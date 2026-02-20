import type { ProviderHandler } from "../provider-registry.js";
import type { ConnectionRow } from "../connection-store.js";
import { insertConnection, removeConnection, getConnection } from "../connection-store.js";
import { getPipedreamClient } from "../pipedream.service.js";
import { bankAgentContext } from "./bank-context.js";
import logger from "../../../lib/logger.js";

const log = logger.child({ src: "bank-plaid-pipedream.handler" });

/** Pipedream Connect-wrapped Plaid for bank connections. */
export const bankPlaidPipedreamHandler: ProviderHandler = {
  async initiateConnect(userId: string) {
    const pd = getPipedreamClient();
    const response = await pd.tokens.create({ externalUserId: userId });
    return {
      type: "pipedream",
      token: response.token,
      expiresAt: response.expiresAt,
      app: "plaid",
    };
  },

  async handleCallback(userId: string, payload: Record<string, unknown>): Promise<ConnectionRow> {
    const accountId = payload.account_id as string;
    if (!accountId) throw new Error("account_id required");

    const pd = getPipedreamClient();
    const account = await pd.accounts.retrieve(accountId, {
      includeCredentials: true,
    });

    // Pipedream stores the Plaid access_token in account credentials
    const creds = account.credentials ?? {};

    const connection = await insertConnection(userId, "bank", {
      accessToken: creds.access_token ?? creds.accessToken,
      itemId: creds.item_id ?? creds.itemId,
      pipedreamAccountId: accountId,
    }, {
      institutionName: account.name,
      healthy: account.healthy,
      via: "plaid-pipedream",
    });

    log.info({ userId, accountId }, "Bank connection created (plaid-pipedream)");
    return connection;
  },

  getAgentContext: bankAgentContext,

  async disconnect(connectionId: string) {
    const connection = await getConnection(connectionId);
    if (!connection) return;
    await removeConnection(connectionId);
    log.info({ connectionId }, "Bank connection removed");
  },
};
