import { Router } from "express";
import { catchAsync } from "../../lib/errors.js";
import logger from "../../lib/logger.js";
import {
  buildHistory,
  buildIntegrationContext,
  callOpenClaw,
  parseSSEChunk,
  persistAssistantMessage,
  persistUserMessage,
  validateThread,
} from "./chat.service.js";

const log = logger.child({ module: "chat" });
const router = Router();

router.post(
  "/",
  catchAsync(async (req, res) => {
    const { threadId, message } = req.body as { threadId?: string; message?: string };
    if (!message) {
      res.status(400).json({ error: "message required" });
      return;
    }

    let messages: { role: string; content: string }[] = [];

    if (threadId) {
      const thread = await validateThread(threadId);
      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
        return;
      }
      messages = await buildHistory(threadId);
      await persistUserMessage(threadId, message);
    }

    messages.push({ role: "user", content: message });

    // Inject integration context so the agent knows available credentials
    if (req.auth.userId) {
      const integrationContext = await buildIntegrationContext(req.auth.userId);
      if (integrationContext) {
        messages.unshift(integrationContext);
      }
    }

    let ocRes: Response;
    try {
      ocRes = await callOpenClaw(messages);
    } catch (err) {
      log.error({ err }, "OpenClaw unreachable");
      res.status(502).json({ error: "Agent unavailable. Please try again." });
      return;
    }

    if (!ocRes.ok || !ocRes.body) {
      const text = await ocRes.text().catch(() => "unknown error");
      log.error({ status: ocRes.status, text }, "OpenClaw error");
      res.status(502).json({ error: "Agent error. Please try again." });
      return;
    }

    // Stream SSE through to client
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = ocRes.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
        assistantText += parseSSEChunk(chunk);
      }
    } finally {
      res.end();
    }

    if (threadId && assistantText) {
      await persistAssistantMessage(threadId, assistantText);
    }
  })
);

export default router;
