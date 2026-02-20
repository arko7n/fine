import { PipedreamClient } from "@pipedream/sdk";
import config from "../../config.js";

let client: PipedreamClient | null = null;

export function getPipedreamClient(): PipedreamClient {
  if (!client) {
    if (!config.pipedreamClientId || !config.pipedreamClientSecret) {
      throw new Error(
        "Pipedream is not configured. Set PIPEDREAM_CLIENT_ID and PIPEDREAM_CLIENT_SECRET."
      );
    }
    client = new PipedreamClient({
      clientId: config.pipedreamClientId,
      clientSecret: config.pipedreamClientSecret,
      projectId: config.pipedreamProjectId,
      projectEnvironment: config.pipedreamProjectEnvironment,
    });
  }
  return client;
}
