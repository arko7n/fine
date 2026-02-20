import { registerToolHandler } from "../tools/tool-registry.js";
import { getConnections } from "../connections/connection-store.js";
import {
  listActions,
  describeAction,
  runAction,
  apiProxy,
} from "./pipedream-api.service.js";

registerToolHandler("pipedream", "list_accounts", async (_params, userId) => {
  if (!userId) throw new Error("userId is required");
  const connections = await getConnections(userId);
  return connections
    .filter((c) => c.body.credentials.pipedreamAccountId)
    .map((c) => ({
      provider: c.body.provider,
      pipedreamAccountId: c.body.credentials.pipedreamAccountId,
      appName: c.body.metadata.appName ?? c.body.provider,
      status: c.body.status,
    }));
});

registerToolHandler("pipedream", "list_actions", async (params) => {
  return listActions(params.app_slug as string);
});

registerToolHandler("pipedream", "describe_action", async (params) => {
  return describeAction(params.action_key as string);
});

registerToolHandler("pipedream", "run_action", async (params, userId) => {
  if (!userId) throw new Error("userId is required");
  return runAction(
    params.action_key as string,
    userId,
    (params.configured_props as Record<string, unknown>) ?? {},
  );
});

registerToolHandler("pipedream", "api_proxy", async (params, userId) => {
  if (!userId) throw new Error("userId is required");
  return apiProxy(
    params.method as string,
    params.url as string,
    userId,
    params.account_id as string,
    params.body as Record<string, unknown> | undefined,
    params.headers as Record<string, string> | undefined,
  );
});
