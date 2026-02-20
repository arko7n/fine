import type { ProviderHandler } from "../provider-registry.js";
import type { ConnectionRow } from "../connection-store.js";
import { getPipedreamClient } from "../pipedream.service.js";
import { deleteAccount } from "../../pipedream/pipedream-api.service.js";
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

    // No DB insert — PD is the source of truth. Return a synthetic ConnectionRow.
    log.info({ userId, provider, accountId }, "Pipedream account connected (not persisted)");
    const now = new Date().toISOString();
    return {
      id: accountId,
      body: {
        userId,
        provider,
        status: "active",
        credentials: {},
        metadata: { appName: provider },
        createdAt: now,
        updatedAt: now,
      },
    };
  },

  async disconnect(connectionId: string) {
    await deleteAccount(connectionId);
    log.info({ connectionId }, "Pipedream account deleted");
  },
};
