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
  return response.data.map((app: Record<string, unknown>) => ({
    nameSlug: app.name_slug as string,
    name: app.name as string,
    description: (app.description as string) ?? "",
    imgSrc: (app.img_src as string) ?? "",
  }));
}

export async function listActions(appSlug: string) {
  const pd = getPipedreamClient();
  const response = await pd.actions.list({ app: appSlug });
  return response.data.map((action: Record<string, unknown>) => ({
    key: action.key as string,
    name: action.name as string,
    description: (action.description as string) ?? "",
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

export async function apiProxy(
  method: string,
  url: string,
  externalUserId: string,
  accountId: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const pd = getPipedreamClient();
  const proxyMethod = (pd.proxy as Record<string, Function>)[method.toLowerCase()];
  if (!proxyMethod) {
    throw new Error(`Unsupported proxy method: ${method}`);
  }
  return proxyMethod.call(pd.proxy, { url, externalUserId, accountId, body, headers });
}
