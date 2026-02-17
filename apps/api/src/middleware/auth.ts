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
 * Auth middleware — uses Clerk in production, or falls back to a dummy user
 * when BYPASS_AUTH=true (for local dev without Clerk keys).
 */
export const auth: RequestHandler[] = config.bypassAuth
  ? [bypassAuth]
  : [clerkMiddleware() as RequestHandler, extractClerkAuth];
