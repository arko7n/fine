import { registerToolHandler } from "../tools/tool-registry.js";
import {
  listAccounts,
  listActions,
  describeAction,
  runAction,
  apiProxy,
} from "./pipedream-api.service.js";

registerToolHandler("pipedream", "list_accounts", async (_params, userId) => {
  if (!userId) throw new Error("userId is required");
  const accounts = await listAccounts(userId);
  return accounts.map((a) => ({
    provider: a.app?.nameSlug ?? "",
    pipedreamAccountId: a.id,
    appName: a.app?.name ?? "",
    status: a.healthy === false ? "error" : "active",
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

  // Resolve authProvisionId from PD accounts
  const accounts = await listAccounts(userId);
  const match = accounts.find(
    (a) => a.app?.nameSlug && actionKey.startsWith(a.app.nameSlug + "-"),
  );
  if (!match) {
    throw new Error(
      `No connected account found for action "${actionKey}". Connect the app first.`,
    );
  }

  const appSlug = match.app!.nameSlug;
  configuredProps[appSlug] = { authProvisionId: match.id };

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
