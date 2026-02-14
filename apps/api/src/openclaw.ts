import { spawn, type ChildProcess } from "node:child_process";

const OC_PORT = Number(process.env.OPENCLAW_GATEWAY_PORT ?? "18789");
const OC_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN ?? "fine-internal";

let child: ChildProcess | null = null;

async function waitForPort(port: number, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.warn(`[openclaw] port ${port} not reachable after ${timeoutMs}ms — continuing anyway`);
}

export async function startOpenClaw(): Promise<void> {
  const bin = process.env.OPENCLAW_BIN ?? "npx";
  const args =
    bin === "npx"
      ? ["openclaw", "gateway", "--port", String(OC_PORT), "--bind", "loopback", "--allow-unconfigured"]
      : ["gateway", "--port", String(OC_PORT), "--bind", "loopback", "--allow-unconfigured"];

  child = spawn(bin, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      OPENCLAW_GATEWAY_TOKEN: OC_TOKEN,
      OPENCLAW_GATEWAY_PORT: String(OC_PORT),
      OPENCLAW_CONFIG_PATH: new URL("../openclaw.json", import.meta.url).pathname,
    },
  });

  child.stdout?.on("data", (chunk: Buffer) => {
    process.stdout.write(`[openclaw] ${chunk.toString()}`);
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    process.stderr.write(`[openclaw] ${chunk.toString()}`);
  });

  child.on("exit", (code) => {
    console.log(`[openclaw] exited with code ${code}`);
    child = null;
  });

  await waitForPort(OC_PORT);
}

export function stopOpenClaw() {
  child?.kill("SIGTERM");
}

export function ocBaseUrl() {
  return `http://127.0.0.1:${OC_PORT}`;
}

export function ocToken() {
  return OC_TOKEN;
}
