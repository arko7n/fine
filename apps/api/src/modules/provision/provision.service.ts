import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ECSClient, RunTaskCommand, DescribeTasksCommand, StopTaskCommand } from "@aws-sdk/client-ecs";
import config from "../../config.js";
import logger from "../../lib/logger.js";
import { getUser, upsertUser, updateUserBody, type UserStatus } from "./user-store.js";

const log = logger.child({ src: "provision.service" });

const ecs = new ECSClient({});

const TASK_PORT = 3001;

// --- Local provision (stores userId to file, sets process.env.USER_ID) ---

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const LOCAL_USER_FILE = path.join(projectRoot, ".local-user-id");

function readLocalUserId(): string | null {
  try {
    return fs.readFileSync(LOCAL_USER_FILE, "utf-8").trim() || null;
  } catch {
    return null;
  }
}

/** Call at startup to restore USER_ID from local file (local dev only). */
export function initLocalUser(): void {
  if (!config.useLocalBackend) return;
  const userId = readLocalUserId();
  if (userId) {
    process.env.USER_ID = userId;
    log.info({ userId }, "Restored local USER_ID from file");
  }
}

// --- ECS config auto-discovery from task metadata ---

type EcsConfig = {
  cluster: string;
  taskDefinition: string;
  subnets: string[];
  securityGroups: string[];
  containerName: string;
};

let ecsConfig: EcsConfig | null = null;

/**
 * Discover ECS config from the running task's metadata endpoint.
 * Call once at startup. No-ops when useLocalBackend is true or outside ECS.
 */
export async function discoverEcsConfig(): Promise<void> {
  if (config.useLocalBackend) {
    log.info("useLocalBackend=true — skipping ECS discovery");
    return;
  }

  const metadataUri = process.env.ECS_CONTAINER_METADATA_URI_V4;
  if (!metadataUri) {
    throw new Error("ECS_CONTAINER_METADATA_URI_V4 not set — cannot discover ECS config");
  }

  const taskMeta = await fetch(`${metadataUri}/task`).then((r) => r.json());
  const cluster: string = taskMeta.Cluster;
  const taskArn: string = taskMeta.TaskARN;
  const containerName: string = taskMeta.Containers?.[0]?.Name;

  const described = await ecs.send(
    new DescribeTasksCommand({ cluster, tasks: [taskArn] }),
  );

  const task = described.tasks?.[0];
  if (!task) throw new Error(`Failed to describe own task ${taskArn}`);

  const taskDefinition = task.taskDefinitionArn!;

  const eni = task.attachments?.find((a) => a.type === "ElasticNetworkInterface");
  if (!eni) throw new Error("Own task has no ENI attachment");

  const subnets = eni.details
    ?.filter((d) => d.name === "subnetId")
    .map((d) => d.value!) ?? [];
  const securityGroups = eni.details
    ?.filter((d) => d.name === "securityGroupId")
    .map((d) => d.value!) ?? [];

  if (subnets.length === 0 || securityGroups.length === 0) {
    throw new Error("Failed to extract subnets/securityGroups from own task ENI");
  }

  ecsConfig = { cluster, taskDefinition, subnets, securityGroups, containerName };
  log.info({ ecsConfig }, "Discovered ECS config from task metadata");
}

function requireEcsConfig(): EcsConfig {
  if (!ecsConfig) {
    throw new Error("ECS config not available — not running on ECS");
  }
  return ecsConfig;
}

// --- Public API ---

export type TaskEndpoint = {
  ip: string;
  port: number;
  status: UserStatus;
};

export async function provisionTask(userId: string): Promise<{ status: UserStatus }> {
  if (config.useLocalBackend) {
    fs.writeFileSync(LOCAL_USER_FILE, userId);
    process.env.USER_ID = userId;
    log.info({ userId }, "Local provision — saved USER_ID");
    return { status: "running" };
  }

  const existing = await getUser(userId);
  if (existing && (existing.body.status === "running" || existing.body.status === "provisioning")) {
    return { status: existing.body.status };
  }

  const cfg = requireEcsConfig();

  const result = await ecs.send(
    new RunTaskCommand({
      cluster: cfg.cluster,
      taskDefinition: cfg.taskDefinition,
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: cfg.subnets,
          securityGroups: cfg.securityGroups,
          assignPublicIp: "DISABLED",
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: cfg.containerName,
            environment: [{ name: "USER_ID", value: userId }],
          },
        ],
      },
    }),
  );

  const task = result.tasks?.[0];
  if (!task?.taskArn) {
    throw new Error("ECS RunTask returned no task");
  }

  await upsertUser(userId, {
    status: "provisioning",
    taskArn: task.taskArn,
    provisionedAt: new Date().toISOString(),
  });

  log.info({ userId, taskArn: task.taskArn }, "ECS task provisioned");
  return { status: "provisioning" };
}

export async function resolveTaskStatus(userId: string): Promise<{ status: UserStatus; endpoint?: { ip: string; port: number } }> {
  if (config.useLocalBackend) {
    return { status: readLocalUserId() ? "running" : "stopped" };
  }

  const user = await getUser(userId);
  if (!user) {
    return { status: "stopped" };
  }

  if (user.body.status !== "provisioning") {
    const endpoint = user.body.status === "running" && user.body.taskIp
      ? { ip: user.body.taskIp, port: TASK_PORT }
      : undefined;
    return { status: user.body.status, endpoint };
  }

  if (!user.body.taskArn) {
    throw new Error(`User ${userId} is provisioning but has no taskArn`);
  }

  const cfg = requireEcsConfig();
  const described = await ecs.send(
    new DescribeTasksCommand({ cluster: cfg.cluster, tasks: [user.body.taskArn] }),
  );

  const task = described.tasks?.[0];
  if (!task) {
    await updateUserBody(userId, { status: "stopped" });
    return { status: "stopped" };
  }

  const lastStatus = task.lastStatus?.toUpperCase();

  if (lastStatus === "STOPPED") {
    await updateUserBody(userId, { status: "stopped" });
    return { status: "stopped" };
  }

  if (lastStatus === "RUNNING") {
    const eni = task.attachments?.find((a) => a.type === "ElasticNetworkInterface");
    const privateIp = eni?.details?.find((d) => d.name === "privateIPv4Address")?.value;

    if (!privateIp) {
      throw new Error(`Task ${user.body.taskArn} is RUNNING but has no private IP`);
    }

    await updateUserBody(userId, { status: "running", taskIp: privateIp });
    return { status: "running", endpoint: { ip: privateIp, port: TASK_PORT } };
  }

  return { status: "provisioning" };
}

export async function deprovisionTask(userId: string): Promise<{ status: UserStatus }> {
  if (config.useLocalBackend) {
    try { fs.unlinkSync(LOCAL_USER_FILE); } catch { /* already gone */ }
    delete process.env.USER_ID;
    log.info({ userId }, "Local deprovision — removed USER_ID");
    return { status: "stopped" };
  }

  const user = await getUser(userId);
  if (!user || user.body.status === "stopped") {
    return { status: "stopped" };
  }

  if (user.body.taskArn) {
    const cfg = requireEcsConfig();
    try {
      await ecs.send(new StopTaskCommand({
        cluster: cfg.cluster,
        task: user.body.taskArn,
        reason: "User-initiated deprovision",
      }));
      log.info({ userId, taskArn: user.body.taskArn }, "ECS task stopped");
    } catch (err) {
      log.warn({ err, userId, taskArn: user.body.taskArn }, "Failed to stop ECS task (may already be stopped)");
    }
  }

  await updateUserBody(userId, { status: "stopped" });
  return { status: "stopped" };
}

export async function getTaskEndpoint(userId: string): Promise<TaskEndpoint | null> {
  const user = await getUser(userId);
  if (!user || !user.body.taskIp) return null;
  return { ip: user.body.taskIp, port: TASK_PORT, status: user.body.status };
}
