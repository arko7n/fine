import { PipedreamClient } from "@pipedream/sdk";
import config from "../../config.js";

let client: PipedreamClient | null = null;

export function getPipedreamClient(): PipedreamClient {
  if (!client) {
    if (!config.pipedreamSecretKey || !config.pipedreamProjectId) {
      throw new Error(
        "Pipedream is not configured. Set PIPEDREAM_SECRET_KEY and PIPEDREAM_PROJECT_ID."
      );
    }
    client = new PipedreamClient({
      clientId: config.pipedreamPublicKey,
      clientSecret: config.pipedreamSecretKey,
      projectId: config.pipedreamProjectId,
    });
  }
  return client;
}
