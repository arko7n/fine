import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import constants from "../../../constants.json" with { type: "json" };

type PluginApi = {
  pluginConfig?: Record<string, unknown>;
  logger: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
  on: (hook: string, handler: (event: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void> | void) => void;
  resolvePath: (input: string) => string;
};

const BUCKET = constants.s3.bucket;
const S3_PREFIX = "oc-state";
const AGENT_ID = "main";

function tmpPath(): string {
  return path.join(os.tmpdir(), `oc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.tar.gz`);
}

const plugin = {
  id: "fine-persistence",
  name: "Fine Persistence",
  description: "Persists main agent state to S3, keyed by userId",

  register(api: PluginApi) {
    const s3 = new S3Client({});

    // Local dirs always use the "main" agent
    const mainAgentDir = api.resolvePath(`~/.openclaw/agents/${AGENT_ID}`);
    const mainWorkspaceDir = api.resolvePath(`~/.openclaw/workspace-${AGENT_ID}`);

    // S3 keys use userId for per-user isolation
    function s3Key(userId: string, name: string): string {
      return `${S3_PREFIX}/${userId}/${name}`;
    }

    async function uploadDir(dir: string, key: string): Promise<void> {
      if (!fs.existsSync(dir)) return;
      const tmp = tmpPath();
      try {
        execSync(`tar czf "${tmp}" -C "${dir}" .`, { stdio: "ignore" });
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: fs.readFileSync(tmp),
        }));
      } finally {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      }
    }

    async function downloadDir(key: string, dir: string): Promise<boolean> {
      const tmp = tmpPath();
      try {
        const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
        if (!Body) return false;
        const bytes = await Body.transformToByteArray();
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(tmp, Buffer.from(bytes));
        execSync(`tar xzf "${tmp}" -C "${dir}"`, { stdio: "ignore" });
        return true;
      } catch (err: unknown) {
        if ((err as { name?: string }).name === "NoSuchKey") return false;
        throw err;
      } finally {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      }
    }

    // gateway_start: restore main agent state from S3 using userId key
    api.on("gateway_start", async () => {
      const userId = process.env.USER_ID;
      if (!userId) {
        api.logger.info("fine-persistence: no USER_ID set, skipping S3 restore");
        return;
      }

      const s3UserId = userId.toLowerCase();
      api.logger.info(`fine-persistence: restoring state for userId=${s3UserId} into agent=${AGENT_ID}`);

      try {
        const [gotAgent, gotWorkspace] = await Promise.all([
          downloadDir(s3Key(s3UserId, "agentdir.tar.gz"), mainAgentDir),
          downloadDir(s3Key(s3UserId, "workspace.tar.gz"), mainWorkspaceDir),
        ]);
        api.logger.info(`fine-persistence: restore ${gotAgent || gotWorkspace ? "succeeded" : "no data found"} (agentdir=${gotAgent}, workspace=${gotWorkspace})`);
      } catch (err) {
        api.logger.error("fine-persistence: restore failed, starting fresh", err);
      }
    });

    // agent_end: snapshot main agent state to S3 using userId key
    api.on("agent_end", async () => {
      const userId = process.env.USER_ID;
      if (!userId) {
        api.logger.info("fine-persistence: no USER_ID set, skipping S3 snapshot");
        return;
      }

      const s3UserId = userId.toLowerCase();
      await Promise.all([
        uploadDir(mainAgentDir, s3Key(s3UserId, "agentdir.tar.gz")),
        uploadDir(mainWorkspaceDir, s3Key(s3UserId, "workspace.tar.gz")),
      ]);

      api.logger.info(`fine-persistence: snapshot saved for userId=${s3UserId}`);
    });
  },
};

export default plugin;
