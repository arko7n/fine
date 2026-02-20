import { getPipedreamClient } from "../connections/pipedream.service.js";

export type PipedreamAppInfo = {
  nameSlug: string;
  name: string;
  description: string;
  imgSrc: string;
};

export async function searchApps(q?: string, limit = 20): Promise<PipedreamAppInfo[]> {
  const pd = getPipedreamClient();
  const response = await pd.apps.list({ q, limit, hasActions: true });
  return response.data.map((app) => ({
    nameSlug: app.nameSlug,
    name: app.name,
    description: app.description ?? "",
    imgSrc: app.imgSrc,
  }));
}

export async function listActions(appSlug: string) {
  const pd = getPipedreamClient();
  const response = await pd.actions.list({ app: appSlug });
  return response.data.map((action) => ({
    key: action.key,
    name: action.name,
    description: action.description ?? "",
  }));
}

export async function describeAction(actionKey: string) {
  const pd = getPipedreamClient();
  return pd.actions.retrieve(actionKey);
}

export async function runAction(
  actionKey: string,
  externalUserId: string,
  configuredProps: Record<string, unknown>,
) {
  const pd = getPipedreamClient();
  return pd.actions.run({ id: actionKey, externalUserId, configuredProps });
}

const PROXY_METHODS = ["get", "post", "put", "delete", "patch"] as const;
type ProxyMethod = (typeof PROXY_METHODS)[number];

export async function apiProxy(
  method: string,
  url: string,
  externalUserId: string,
  accountId: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const pd = getPipedreamClient();
  const m = method.toLowerCase() as ProxyMethod;
  if (!PROXY_METHODS.includes(m)) {
    throw new Error(`Unsupported proxy method: ${method}`);
  }
  return pd.proxy[m]({ url, externalUserId, accountId, body, headers } as never);
}
