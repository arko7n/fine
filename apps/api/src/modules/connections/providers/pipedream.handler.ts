import type { ProviderHandler } from "../provider-registry.js";
import type { ConnectionRow } from "../connection-store.js";
import { insertConnection, removeConnection, getConnection } from "../connection-store.js";
import { getPipedreamClient } from "../pipedream.service.js";
import logger from "../../../lib/logger.js";

const log = logger.child({ src: "pipedream.handler" });

/** Default Pipedream handler for providers that don't have custom logic. */
export const pipedreamHandler: ProviderHandler = {
  async initiateConnect(userId: string, params?: Record<string, unknown>) {
    const pd = getPipedreamClient();
    const response = await pd.tokens.create({
      externalUserId: userId,
      ...(params?.allowedOrigins
        ? { allowedOrigins: params.allowedOrigins as string[] }
        : {}),
    });
    return {
      type: "pipedream",
      token: response.token,
      expiresAt: response.expiresAt,
    };
  },

  async handleCallback(userId: string, payload: Record<string, unknown>): Promise<ConnectionRow> {
    const accountId = payload.account_id as string;
    const provider = payload.provider as string;
    if (!accountId || !provider) {
      throw new Error("account_id and provider are required");
    }

    const pd = getPipedreamClient();
    const account = await pd.accounts.retrieve(accountId, {
      includeCredentials: true,
    });

    const connection = await insertConnection(userId, provider, {
      pipedreamAccountId: accountId,
      ...(account.credentials ?? {}),
    }, {
      appName: account.app?.name ?? provider,
      healthy: account.healthy,
    });

    log.info({ userId, provider, accountId }, "Pipedream connection created");
    return connection;
  },

  getAgentContext(connections: ConnectionRow[]): string | null {
    if (connections.length === 0) return null;

    const lines = connections.map((c) => {
      const label = (c.body.metadata.appName as string) ?? c.body.provider;
      return `- ${label} (id=${c.id}): connected via Pipedream`;
    });

    return [
      "The user has the following Pipedream-connected accounts:",
      "",
      ...lines,
    ].join("\n");
  },

  async disconnect(connectionId: string) {
    const connection = await getConnection(connectionId);
    if (!connection) return;
    await removeConnection(connectionId);
    log.info({ connectionId }, "Pipedream connection removed");
  },
};
