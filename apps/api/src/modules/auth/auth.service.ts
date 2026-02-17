import { createClerkClient } from "@clerk/express";
import config from "../../config.js";
import logger from "../../lib/logger.js";

const log = logger.child({ module: "auth" });

export type User = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
};

const clerk = config.clerkSecretKey
  ? createClerkClient({ secretKey: config.clerkSecretKey })
  : null;

export async function resolveUser(userId: string): Promise<User> {
  if (!clerk || config.bypassAuth) {
    log.debug({ userId }, "resolveUser (bypass mode)");
    return {
      id: userId,
      name: "Demo User",
      email: "demo@getfine.pro",
    };
  }

  const clerkUser = await clerk.users.getUser(userId);
  return {
    id: clerkUser.id,
    name:
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "User",
    email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
    imageUrl: clerkUser.imageUrl,
  };
}
