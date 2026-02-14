import express from "express";
import { startOpenClaw, stopOpenClaw, ocBaseUrl, ocToken } from "./openclaw.js";

const PORT = Number(process.env.PORT ?? "3001");

const app = express();
app.use(express.json());

// CORS for local dev
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Proxy chat to OpenClaw's OpenAI-compatible endpoint (streaming SSE)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body as { message?: string };
  if (!message) { res.status(400).json({ error: "message required" }); return; }

  let ocRes: Response;
  try {
    ocRes = await fetch(`${ocBaseUrl()}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ocToken()}`,
      },
      body: JSON.stringify({
        model: "openclaw",
        stream: true,
        messages: [{ role: "user", content: message }],
      }),
    });
  } catch (err) {
    console.error("[api/chat] OpenClaw unreachable:", err);
    res.status(502).json({ error: "Agent unavailable. Please try again." });
    return;
  }

  if (!ocRes.ok || !ocRes.body) {
    const text = await ocRes.text().catch(() => "unknown error");
    console.error("[api/chat] OpenClaw error:", ocRes.status, text);
    res.status(502).json({ error: "Agent error. Please try again." });
    return;
  }

  // Stream SSE through to client
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const reader = ocRes.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
  } finally {
    res.end();
  }
});

async function main() {
  console.log("Starting OpenClaw gateway...");
  await startOpenClaw();
  console.log("OpenClaw gateway started.");

  app.listen(PORT, () => {
    console.log(`Fine backend listening on http://localhost:${PORT}`);
  });
}

process.on("SIGTERM", () => { stopOpenClaw(); process.exit(0); });
process.on("SIGINT", () => { stopOpenClaw(); process.exit(0); });

main();
