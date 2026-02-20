import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import constants from "../../../constants.json" with { type: "json" };

type PluginApi = {
  pluginConfig?: Record<string, unknown>;
  logger: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
  on: (hook: string, handler: (event: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void> | void) => void;
  resolvePath: (input: string) => string;
};

const BUCKET = constants.s3.bucket;
const S3_PREFIX = "oc-state";

function tmpPath(): string {
  return path.join(os.tmpdir(), `oc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.tar.gz`);
}

const plugin = {
  id: "fine-persistence",
  name: "Fine Persistence",
  description: "Persists full agent state (workspace + sessions) to S3 as tarballs",

  register(api: PluginApi) {
    const s3 = new S3Client({});

    function agentDir(id: string): string {
      return api.resolvePath(`~/.openclaw/agents/${id}`);
    }

    function workspaceDir(id: string): string {
      if (id === "main") return api.resolvePath("~/.openclaw/workspace");
      return api.resolvePath(`~/.openclaw/workspace-${id}`);
    }

    function s3Key(agentId: string, name: string): string {
      return `${S3_PREFIX}/${agentId}/${name}`;
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

    // gateway_start: restore all agents from S3 (runs once on ECS task boot)
    api.on("gateway_start", async () => {
      api.logger.info(`fine-persistence: restoring from s3://${BUCKET}/${S3_PREFIX}/`);

      let restored = 0;
      try {
        const { CommonPrefixes } = await s3.send(new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: `${S3_PREFIX}/`,
          Delimiter: "/",
        }));

        for (const prefix of CommonPrefixes ?? []) {
          const agentId = prefix.Prefix?.replace(`${S3_PREFIX}/`, "").replace(/\/$/, "");
          if (!agentId) continue;

          const [gotAgent, gotWorkspace] = await Promise.all([
            downloadDir(s3Key(agentId, "agentdir.tar.gz"), agentDir(agentId)),
            downloadDir(s3Key(agentId, "workspace.tar.gz"), workspaceDir(agentId)),
          ]);

          if (gotAgent || gotWorkspace) restored++;
        }
      } catch (err) {
        api.logger.error("fine-persistence: S3 restore failed, starting fresh", err);
      }

      api.logger.info(`fine-persistence: restored ${restored} agents from S3`);
    });

    // agent_end: snapshot entire agent state to S3
    api.on("agent_end", async (_event: Record<string, unknown>, ctx: Record<string, unknown>) => {
      const agentId = (ctx.agentId as string) ?? "main";

      await Promise.all([
        uploadDir(agentDir(agentId), s3Key(agentId, "agentdir.tar.gz")),
        uploadDir(workspaceDir(agentId), s3Key(agentId, "workspace.tar.gz")),
      ]);

      api.logger.info(`fine-persistence: snapshot saved for ${agentId}`);
    });
  },
};

export default plugin;
