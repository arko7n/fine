import { Router } from "express";
import { catchAsync } from "../../lib/errors.js";
import { searchApps } from "./pipedream-api.service.js";

const router = Router();

router.get(
  "/apps",
  catchAsync(async (req, res) => {
    const q = req.query.q as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const apps = await searchApps(q, limit);
    res.json(apps);
  }),
);

export default router;
