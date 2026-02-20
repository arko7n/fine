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

  const actionKey = params.action_key as string;
  const configuredProps = (params.configured_props as Record<string, unknown>) ?? {};

  // Inject authProvisionId for the app's connected account
  const connections = await getConnections(userId);
  const match = connections.find(
    (c) =>
      c.body.credentials.pipedreamAccountId &&
      actionKey.startsWith(c.body.provider + "-"),
  );
  if (!match) {
    throw new Error(
      `No connected account found for action "${actionKey}". Connect the app first.`,
    );
  }

  const appSlug = match.body.provider;
  configuredProps[appSlug] = {
    authProvisionId: match.body.credentials.pipedreamAccountId as string,
  };

  return runAction(actionKey, userId, configuredProps);
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
