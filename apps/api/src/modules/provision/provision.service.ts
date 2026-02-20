import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ECSClient, RunTaskCommand, DescribeTasksCommand, DescribeServicesCommand, StopTaskCommand } from "@aws-sdk/client-ecs";
import config from "../../config.js";
import logger from "../../lib/logger.js";
import { getUser, upsertUser, updateUserBody, type ProvisionStatus } from "./user-store.js";
import { restartOpenClaw } from "../openclaw/openclaw.service.js";

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

  if (process.env.USER_ID) {
    log.info("Per-user task — skipping ECS discovery");
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

  // Describe own task to get task definition and service group
  const described = await ecs.send(
    new DescribeTasksCommand({ cluster, tasks: [taskArn] }),
  );
  const task = described.tasks?.[0];
  if (!task) throw new Error(`Failed to describe own task ${taskArn}`);

  const taskDefinition = task.taskDefinitionArn!;

  // Extract service name from task group ("service:<name>")
  const group = task.group;
  if (!group?.startsWith("service:")) {
    throw new Error(`Task group "${group}" is not a service — cannot discover network config`);
  }
  const serviceName = group.substring("service:".length);

  // Get subnets and security groups from the service's network configuration
  const serviceDesc = await ecs.send(
    new DescribeServicesCommand({ cluster, services: [serviceName] }),
  );
  const service = serviceDesc.services?.[0];
  if (!service) throw new Error(`Failed to describe service ${serviceName}`);

  const netConfig = service.networkConfiguration?.awsvpcConfiguration;
  if (!netConfig) throw new Error(`Service ${serviceName} has no awsvpc configuration`);

  const subnets = netConfig.subnets ?? [];
  const securityGroups = netConfig.securityGroups ?? [];

  if (subnets.length === 0 || securityGroups.length === 0) {
    throw new Error("Service network config has empty subnets or securityGroups");
  }

  ecsConfig = { cluster, taskDefinition, subnets, securityGroups, containerName };
  log.info({ ecsConfig }, "Discovered ECS config from service network configuration");
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
  provisionStatus: ProvisionStatus;
};

export async function provisionTask(userId: string): Promise<{ provisionStatus: ProvisionStatus }> {
  if (config.useLocalBackend) {
    fs.writeFileSync(LOCAL_USER_FILE, userId);
    process.env.USER_ID = userId;
    log.info({ userId }, "Local provision — saved USER_ID, restarting gateway");
    await restartOpenClaw();
    return { provisionStatus: "running" };
  }

  const existing = await getUser(userId);
  if (existing && (existing.body.provisionStatus === "running" || existing.body.provisionStatus === "provisioning")) {
    return { provisionStatus: existing.body.provisionStatus };
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
    provisionStatus: "provisioning",
    instanceId: task.taskArn,
    provisionedAt: new Date().toISOString(),
  });

  log.info({ userId, instanceId: task.taskArn }, "ECS task provisioned");
  return { provisionStatus: "provisioning" };
}

export async function resolveTaskStatus(userId: string): Promise<{ provisionStatus: ProvisionStatus; endpoint?: { ip: string; port: number } }> {
  if (config.useLocalBackend) {
    return { provisionStatus: readLocalUserId() ? "running" : "stopped" };
  }

  const user = await getUser(userId);
  if (!user) {
    return { provisionStatus: "stopped" };
  }

  if (user.body.provisionStatus !== "provisioning") {
    const endpoint = user.body.provisionStatus === "running" && user.body.instanceIp
      ? { ip: user.body.instanceIp, port: TASK_PORT }
      : undefined;
    return { provisionStatus: user.body.provisionStatus, endpoint };
  }

  if (!user.body.instanceId) {
    throw new Error(`User ${userId} is provisioning but has no instanceId`);
  }

  const cfg = requireEcsConfig();
  const described = await ecs.send(
    new DescribeTasksCommand({ cluster: cfg.cluster, tasks: [user.body.instanceId] }),
  );

  const task = described.tasks?.[0];
  if (!task) {
    await updateUserBody(userId, { provisionStatus: "stopped" });
    return { provisionStatus: "stopped" };
  }

  const lastStatus = task.lastStatus?.toUpperCase();

  if (lastStatus === "STOPPED") {
    await updateUserBody(userId, { provisionStatus: "stopped" });
    return { provisionStatus: "stopped" };
  }

  if (lastStatus === "RUNNING") {
    const eni = task.attachments?.find((a) => a.type === "ElasticNetworkInterface");
    const privateIp = eni?.details?.find((d) => d.name === "privateIPv4Address")?.value;

    if (!privateIp) {
      throw new Error(`Task ${user.body.instanceId} is RUNNING but has no private IP`);
    }

    await updateUserBody(userId, { provisionStatus: "running", instanceIp: privateIp });
    return { provisionStatus: "running", endpoint: { ip: privateIp, port: TASK_PORT } };
  }

  return { provisionStatus: "provisioning" };
}

export async function deprovisionTask(userId: string): Promise<{ provisionStatus: ProvisionStatus }> {
  if (config.useLocalBackend) {
    try { fs.unlinkSync(LOCAL_USER_FILE); } catch { /* already gone */ }
    delete process.env.USER_ID;
    log.info({ userId }, "Local deprovision — removed USER_ID");
    return { provisionStatus: "stopped" };
  }

  const user = await getUser(userId);
  if (!user || user.body.provisionStatus === "stopped") {
    return { provisionStatus: "stopped" };
  }

  if (user.body.instanceId) {
    const cfg = requireEcsConfig();
    try {
      await ecs.send(new StopTaskCommand({
        cluster: cfg.cluster,
        task: user.body.instanceId,
        reason: "User-initiated deprovision",
      }));
      log.info({ userId, instanceId: user.body.instanceId }, "ECS task stopped");
    } catch (err) {
      log.warn({ err, userId, instanceId: user.body.instanceId }, "Failed to stop ECS task (may already be stopped)");
    }
  }

  await updateUserBody(userId, { provisionStatus: "stopped" });
  return { provisionStatus: "stopped" };
}

export async function getTaskEndpoint(userId: string): Promise<TaskEndpoint | null> {
  const user = await getUser(userId);
  if (!user || !user.body.instanceIp) return null;
  return { ip: user.body.instanceIp, port: TASK_PORT, provisionStatus: user.body.provisionStatus };
}
