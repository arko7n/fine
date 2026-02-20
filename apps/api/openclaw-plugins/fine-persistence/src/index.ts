import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import constants from "../../../constants.json" with { type: "json" };

type PluginApi = {
  pluginConfig?: Record<string, unknown>;
  logger: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
  on: (hook: string, handler: (event: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void> | void) => void;
  resolvePath: (input: string) => string;
};

/** Workspace files to persist. Relative to workspace root. */
const WORKSPACE_FILES = [
  "MEMORY.md",
  "USER.md",
  "AGENTS.md",
  "SOUL.md",
  "IDENTITY.md",
  "TOOLS.md",
];

function readIfExists(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

/** Read all daily log files from memory/ dir. */
function readDailyLogs(workspaceDir: string): Record<string, string> {
  const logsDir = path.join(workspaceDir, "memory");
  const logs: Record<string, string> = {};
  if (!fs.existsSync(logsDir)) return logs;
  for (const file of fs.readdirSync(logsDir)) {
    if (file.endsWith(".md")) {
      logs[file] = fs.readFileSync(path.join(logsDir, file), "utf-8");
    }
  }
  return logs;
}

const plugin = {
  id: "fine-persistence",
  name: "Fine Persistence",
  description: "Persists session transcripts and user workspace files to PostgreSQL",

  register(api: PluginApi) {
    const pool = new pg.Pool({
      user: constants.pg.user,
      password: process.env.PGPASSWORD ?? "",
      host: constants.pg.host,
      database: constants.pg.database,
      port: constants.pg.port,
    });

    function resolveSessionsDir(agentId: string): string {
      return api.resolvePath(`~/.openclaw/agents/${agentId}/sessions`);
    }

    function resolveWorkspaceDir(agentId: string): string {
      // "main" agent uses default workspace, others use workspace-<agentId>
      if (agentId === "main") return api.resolvePath("~/.openclaw/workspace");
      return api.resolvePath(`~/.openclaw/workspace-${agentId}`);
    }

    // gateway_start: Restore sessions + user workspace files from PG to disk
    api.on("gateway_start", async () => {
      api.logger.info("fine-persistence: restoring from PG");

      // Restore sessions
      const { rows: sessions } = await pool.query(
        "SELECT id, body FROM fc_sessions WHERE body->>'transcript' IS NOT NULL"
      );

      for (const row of sessions) {
        const body = row.body as Record<string, unknown>;
        const ocSessionId = body.ocSessionId as string | undefined;
        const userId = body.userId as string | undefined;
        if (!ocSessionId || !userId) continue;

        const sessionsDir = resolveSessionsDir(userId);
        fs.mkdirSync(sessionsDir, { recursive: true });
        const transcriptPath = path.join(sessionsDir, `${ocSessionId}.jsonl`);
        if (!fs.existsSync(transcriptPath)) {
          fs.writeFileSync(transcriptPath, body.transcript as string, "utf-8");
          api.logger.info(`fine-persistence: restored session ${ocSessionId}`);
        }
      }

      // Restore user workspace files
      const { rows: users } = await pool.query("SELECT id, body FROM fc_users");

      for (const row of users) {
        const userId = row.id as string;
        const body = row.body as Record<string, unknown>;
        const files = body.files as Record<string, string> | undefined;
        if (!files) continue;

        const workspaceDir = resolveWorkspaceDir(userId);
        fs.mkdirSync(workspaceDir, { recursive: true });

        for (const [relativePath, content] of Object.entries(files)) {
          const filePath = path.join(workspaceDir, relativePath);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, content, "utf-8");
            api.logger.info(`fine-persistence: restored ${relativePath} for ${userId}`);
          }
        }
      }

      api.logger.info(`fine-persistence: restored ${sessions.length} sessions, ${users.length} users`);
    });

    // agent_end: Persist session transcript + workspace files to PG
    api.on("agent_end", async (_event: Record<string, unknown>, ctx: Record<string, unknown>) => {
      const sessionId = ctx.sessionKey as string;
      const ocSessionId = ctx.sessionId as string;
      const agentId = (ctx.agentId as string) ?? "main";

      if (!sessionId) throw new Error("fine-persistence: agent_end missing ctx.sessionKey");
      if (!ocSessionId) throw new Error("fine-persistence: agent_end missing ctx.sessionId");

      // Read transcript
      const sessionsDir = resolveSessionsDir(agentId);
      const filePath = path.join(sessionsDir, `${ocSessionId}.jsonl`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`fine-persistence: transcript not found: ${filePath}`);
      }

      const transcript = fs.readFileSync(filePath, "utf-8");

      // Update session — row was already created by ensureSession in the API
      const { rows } = await pool.query(
        `UPDATE fc_sessions
         SET body = body || $1
         WHERE id = $2
         RETURNING body->>'userId' AS user_id`,
        [JSON.stringify({ ocSessionId, transcript, updatedAt: new Date().toISOString() }), sessionId]
      );

      if (rows.length === 0) {
        throw new Error(`fine-persistence: no fc_sessions row for id=${sessionId}`);
      }

      const userId = rows[0].user_id;

      // Persist workspace files
      const workspaceDir = resolveWorkspaceDir(agentId);
      const files: Record<string, string> = {};

      for (const name of WORKSPACE_FILES) {
        const content = readIfExists(path.join(workspaceDir, name));
        if (content) files[name] = content;
      }

      // Daily logs
      const dailyLogs = readDailyLogs(workspaceDir);
      for (const [name, content] of Object.entries(dailyLogs)) {
        files[`memory/${name}`] = content;
      }

      await pool.query(
        `INSERT INTO fc_users (id, body) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET body = fc_users.body || EXCLUDED.body`,
        [userId, JSON.stringify({ files, updatedAt: new Date().toISOString() })]
      );

      api.logger.info(`fine-persistence: persisted session ${sessionId} (${transcript.length} bytes, ${Object.keys(files).length} workspace files)`);
    });
  },
};

export default plugin;
