import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import config from "../../config.js";
import logger from "../../lib/logger.js";

const log = logger.child({ module: "openclaw" });

const OC_PORT = config.openclawPort;
const OC_TOKEN = config.openclawToken;

let child: ChildProcess | null = null;
let reusedExisting = false;

async function isPortHealthy(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForPort(port: number, timeoutMs = 120_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortHealthy(port)) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`OpenClaw gateway not reachable on port ${port} after ${timeoutMs}ms`);
}

function resolveBin(): { bin: string; args: string[] } {
  const baseArgs = ["gateway", "--port", String(OC_PORT), "--bind", "loopback", "--allow-unconfigured"];
  if (process.env.OPENCLAW_BIN) return { bin: process.env.OPENCLAW_BIN, args: baseArgs };
  try {
    const resolved = new URL("../../../node_modules/.bin/openclaw", import.meta.url).pathname;
    return { bin: resolved, args: baseArgs };
  } catch {
    return { bin: "npx", args: ["openclaw", ...baseArgs] };
  }
}

export async function startOpenClaw(): Promise<void> {
  if (await isPortHealthy(OC_PORT)) {
    log.info(`Gateway already running on port ${OC_PORT}, reusing it`);
    reusedExisting = true;
    return;
  }

  const { bin, args } = resolveBin();

  const projectRoot = new URL("../../..", import.meta.url).pathname;

  child = spawn(bin, args, {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: projectRoot,
    env: {
      ...process.env,
      OPENCLAW_GATEWAY_TOKEN: OC_TOKEN,
      OPENCLAW_GATEWAY_PORT: String(OC_PORT),
      OPENCLAW_CONFIG_PATH: `${projectRoot}openclaw.json`,
    },
  });

  child.on("error", (err) => {
    log.error({ err }, "spawn error");
  });

  child.stdout?.on("data", (chunk: Buffer) => {
    log.debug({ src: "stdout" }, chunk.toString().trimEnd());
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    log.debug({ src: "stderr" }, chunk.toString().trimEnd());
  });

  child.on("exit", (code) => {
    log.info(`exited with code ${code}`);
    child = null;
  });

  await waitForPort(OC_PORT);
}

export function isHealthy(): boolean {
  return reusedExisting || (child !== null && child.exitCode === null);
}

export function stopOpenClaw() {
  if (reusedExisting) return;
  child?.kill("SIGTERM");
  const { bin } = resolveBin();
  const stopBin = bin === "npx" ? "npx" : bin;
  const stopArgs = bin === "npx" ? ["openclaw", "gateway", "stop"] : ["gateway", "stop"];
  try {
    spawnSync(stopBin, stopArgs, { stdio: "ignore", timeout: 5000 });
  } catch {
    // best-effort
  }
}

export function ocBaseUrl() {
  return `http://127.0.0.1:${OC_PORT}`;
}

export function ocToken() {
  return OC_TOKEN;
}
