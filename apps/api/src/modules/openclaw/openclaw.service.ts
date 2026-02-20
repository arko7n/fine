import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import config from "../../config.js";
import logger from "../../lib/logger.js";
import { getEnabledToolPatterns } from "../../integrations.config.js";

const log = logger.child({ src: "openclaw" });

const OC_PORT = config.fcPort;
const OC_TOKEN = "fine-internal";

let child: ChildProcess | null = null;
let reusedExisting = false;

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const runtimeConfigPath = path.join(projectRoot, ".openclaw-runtime.json");
const knownAgents = new Set<string>();

async function isHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${OC_PORT}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForHealth(timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (child && child.exitCode !== null) {
      throw new Error(`OpenClaw exited with code ${child.exitCode}`);
    }
    if (await isHealthy()) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`OpenClaw not healthy after ${timeoutMs}ms`);
}

function resolveBin(): string {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(dir, "../../../node_modules/.bin/openclaw");
  } catch {
    return "npx";
  }
}

function buildRuntimeConfig(agentIds: string[]): Record<string, unknown> {
  const baseConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, "openclaw.json"), "utf-8"));

  // OC resolves relative plugin paths from its own workspace, not CWD — make them absolute
  if (baseConfig.plugins?.load?.paths) {
    baseConfig.plugins.load.paths = (baseConfig.plugins.load.paths as string[]).map(
      (p: string) => path.resolve(projectRoot, p)
    );
  }

  const toolPatterns = getEnabledToolPatterns();
  if (toolPatterns.length > 0) {
    baseConfig.tools = { ...baseConfig.tools, alsoAllow: toolPatterns };
  } else {
    delete baseConfig.tools?.alsoAllow;
  }

  // Add per-user agents
  if (agentIds.length > 0) {
    baseConfig.agents = {
      ...baseConfig.agents,
      list: agentIds.map((id) => ({
        id,
        workspace: `~/.openclaw/workspace-${id}`,
      })),
    };
  }

  return baseConfig;
}

function writeRuntimeConfig(cfg: Record<string, unknown>): void {
  fs.writeFileSync(runtimeConfigPath, JSON.stringify(cfg, null, 2));
}

/**
 * Ensure an OC agent exists for this user. Creates the agent in the
 * runtime config and workspace directory if needed. OC hot-reloads
 * config within 200ms.
 */
export function ensureAgent(userId: string): void {
  if (knownAgents.has(userId)) return;

  log.info(`Creating OC agent for user ${userId}`);

  // Read current runtime config, add agent, write back
  const cfg = JSON.parse(fs.readFileSync(runtimeConfigPath, "utf-8"));
  const list: Array<{ id: string; workspace: string }> = cfg.agents?.list ?? [];
  if (!list.some((a) => a.id === userId)) {
    list.push({ id: userId, workspace: `~/.openclaw/workspace-${userId}` });
    cfg.agents = { ...cfg.agents, list };
    writeRuntimeConfig(cfg);
  }

  // Create workspace + sessions directories
  const home = process.env.HOME ?? "/tmp";
  const workspaceDir = path.join(home, `.openclaw/workspace-${userId}`);
  const sessionsDir = path.join(home, `.openclaw/agents/${userId}/sessions`);
  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.mkdirSync(sessionsDir, { recursive: true });

  knownAgents.add(userId);
}

export async function startOpenClaw(): Promise<void> {
  if (await isHealthy()) {
    log.debug(`Gateway already running on :${OC_PORT}, reusing`);
    reusedExisting = true;
    return;
  }

  const bin = resolveBin();
  const args =
    bin === "npx"
      ? ["openclaw", "gateway", "--port", String(OC_PORT), "--bind", "loopback", "--allow-unconfigured"]
      : ["gateway", "--port", String(OC_PORT), "--bind", "loopback", "--allow-unconfigured"];

  // Discover agents from local dirs (populated by S3 restore or previous runs)
  const home = process.env.HOME ?? "/tmp";
  const agentsDir = path.join(home, ".openclaw/agents");
  let agentIds: string[] = [];
  try {
    agentIds = fs.readdirSync(agentsDir).filter((n) =>
      fs.statSync(path.join(agentsDir, n)).isDirectory()
    );
    for (const id of agentIds) knownAgents.add(id);
    log.info(`Discovered ${agentIds.length} local agents`);
  } catch {
    log.info("No local agents found, starting fresh");
  }

  const runtimeConfig = buildRuntimeConfig(agentIds);
  writeRuntimeConfig(runtimeConfig);
  log.debug({ runtimeConfigPath }, "Wrote runtime config");

  child = spawn(bin, args, {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: projectRoot,
    env: {
      ...process.env,
      OPENCLAW_CONFIG_PATH: runtimeConfigPath,
      OPENCLAW_GATEWAY_TOKEN: OC_TOKEN,
      OPENCLAW_SKIP_CHANNELS: "1",
    },
  });

  child.on("error", (err) => log.error({ err }, "OpenClaw spawn error"));
  child.stdout?.on("data", (d: Buffer) => log.trace(d.toString().trimEnd()));
  child.stderr?.on("data", (d: Buffer) => log.trace(d.toString().trimEnd()));
  child.on("exit", (code) => {
    log.warn(`OpenClaw exited (code ${code})`);
    child = null;
  });

  await waitForHealth();
}

export function stopOpenClaw(): void {
  if (reusedExisting) return;
  child?.kill("SIGTERM");
}

export function ocToken(): string {
  return OC_TOKEN;
}
