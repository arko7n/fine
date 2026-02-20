import type { Request, Response, NextFunction, RequestHandler } from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";
import config from "../config.js";

const BYPASS_USER_ID = "user_01";

declare global {
  namespace Express {
    interface Request {
      auth: { userId: string };
    }
  }
}

function bypassAuth(req: Request, _res: Response, next: NextFunction) {
  req.auth = { userId: BYPASS_USER_ID };
  next();
}

function perUserTaskAuth(req: Request, _res: Response, next: NextFunction) {
  req.auth = { userId: process.env.USER_ID! };
  next();
}

function extractClerkAuth(req: Request, _res: Response, next: NextFunction) {
  const clerkAuth = getAuth(req);
  if (!clerkAuth.userId) {
    req.auth = { userId: "" };
  } else {
    req.auth = { userId: clerkAuth.userId };
  }
  next();
}

/**
 * Auth middleware:
 * - Per-user ECS task (USER_ID set): use USER_ID directly (requests come from shared API proxy)
 * - bypassAuth: dummy user for local dev
 * - Otherwise: Clerk JWT verification
 */
export const auth: RequestHandler[] = process.env.USER_ID
  ? [perUserTaskAuth]
  : config.bypassAuth
    ? [bypassAuth]
    : [clerkMiddleware() as RequestHandler, extractClerkAuth];
