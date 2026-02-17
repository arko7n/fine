import { Router } from "express";
import { createThread, listThreads, getThread } from "./threads.service.js";
import { listEvents } from "../thread-events/thread-events.service.js";
import { catchAsync } from "../../lib/errors.js";

const router = Router();

router.post(
  "/",
  catchAsync(async (req, res) => {
    const { title } = req.body as { title?: string };
    const thread = await createThread(req.auth.userId, title ?? "New Chat");
    res.status(201).json(thread);
  })
);

router.get(
  "/",
  catchAsync(async (req, res) => {
    const threads = await listThreads(req.auth.userId);
    res.json(threads);
  })
);

router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const id = req.params.id as string;
    const thread = await getThread(id);
    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }
    const events = await listEvents(id);
    res.json({ ...thread, events });
  })
);

export default router;
