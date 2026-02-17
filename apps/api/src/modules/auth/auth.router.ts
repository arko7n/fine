import { Router } from "express";
import { catchAsync } from "../../lib/errors.js";
import { resolveUser } from "./auth.service.js";

const router = Router();

router.get(
  "/me",
  catchAsync(async (req, res) => {
    if (!req.auth.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const user = await resolveUser(req.auth.userId);
    res.json(user);
  })
);

export default router;
