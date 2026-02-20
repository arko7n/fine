import type { ProviderHandler } from "../provider-registry.js";
import type { ConnectionRow } from "../connection-store.js";
import { insertConnection, removeConnection, getConnection } from "../connection-store.js";
import { createLinkToken, exchangePublicToken } from "../../integrations/providers/plaid.js";
import logger from "../../../lib/logger.js";

const log = logger.child({ src: "bank-plaid-direct.handler" });

/** Direct Plaid SDK integration for bank connections. */
export const bankPlaidDirectHandler: ProviderHandler = {
  async initiateConnect(userId: string) {
    const data = await createLinkToken(userId);
    return { type: "plaid", link_token: data.link_token, expiration: data.expiration };
  },

  async handleCallback(userId: string, payload: Record<string, unknown>): Promise<ConnectionRow> {
    const publicToken = payload.public_token as string;
    if (!publicToken) throw new Error("public_token required");

    const metadata = payload.metadata as {
      institution?: { institution_id?: string; name?: string };
      accounts?: unknown[];
    } | undefined;

    const exchangeData = await exchangePublicToken(publicToken);

    const connection = await insertConnection(userId, "bank", {
      accessToken: exchangeData.access_token,
      itemId: exchangeData.item_id,
    }, {
      institutionId: metadata?.institution?.institution_id,
      institutionName: metadata?.institution?.name,
      accounts: metadata?.accounts,
      via: "plaid-direct",
    });

    log.info({ userId, itemId: exchangeData.item_id }, "Bank connection created (plaid-direct)");
    return connection;
  },

  async disconnect(connectionId: string) {
    const connection = await getConnection(connectionId);
    if (!connection) return;
    await removeConnection(connectionId);
    log.info({ connectionId }, "Bank connection removed");
  },
};
