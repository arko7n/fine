import { Router } from "express";
import { catchAsync } from "../../lib/errors.js";
import { provisionTask, resolveTaskStatus } from "./provision.service.js";

export const provisionRouter = Router();

/** POST /api/provision — start an ECS task for the authenticated user */
provisionRouter.post(
  "/",
  catchAsync(async (req, res) => {
    if (!req.auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const result = await provisionTask(req.auth.userId);
    res.json(result);
  }),
);

export const meRouter = Router();

/** GET /api/me — resolve current user's task status */
meRouter.get(
  "/",
  catchAsync(async (req, res) => {
    if (!req.auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const result = await resolveTaskStatus(req.auth.userId);
    res.json(result);
  }),
);
