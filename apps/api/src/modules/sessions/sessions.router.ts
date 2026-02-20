import { Router } from "express";
import pool from "../../lib/db.js";
import config from "../../config.js";

const router = Router();

type Message = { role: "user" | "assistant"; content: string };

function parseTranscript(transcript: string): Message[] {
  const messages: Message[] = [];
  for (const line of transcript.split("\n")) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);

      // OC wraps messages: {"type":"message","message":{"role":"...","content":"..."}}
      const msg = entry.type === "message" && entry.message ? entry.message : entry;

      if (msg.role !== "user" && msg.role !== "assistant") continue;
      const content =
        typeof msg.content === "string"
          ? msg.content
          : Array.isArray(msg.content)
            ? msg.content
                .filter((p: { type: string }) => p.type === "text")
                .map((p: { text: string }) => p.text)
                .join("")
            : "";
      if (content) messages.push({ role: msg.role, content });
    } catch {
      continue;
    }
  }
  return messages;
}

function titleFromMessages(messages: Message[]): string {
  const last = messages.at(-1);
  if (!last) return "New Chat";
  return last.content.length > 60 ? last.content.slice(0, 60) + "..." : last.content;
}

router.get("/", async (req, res) => {
  const q = config.bypassAuth
    ? "SELECT id, body FROM fc_sessions ORDER BY body->>'updatedAt' DESC LIMIT 50"
    : "SELECT id, body FROM fc_sessions WHERE body->>'userId' = $1 ORDER BY body->>'updatedAt' DESC LIMIT 50";

  const { rows } = await pool.query(q, config.bypassAuth ? [] : [req.auth.userId]);

  res.json(
    rows.map((r) => {
      const body = r.body as Record<string, unknown>;
      const transcript = body.transcript as string | undefined;
      const msgs = transcript ? parseTranscript(transcript) : [];
      return {
        id: r.id,
        title: titleFromMessages(msgs),
        createdAt: body.createdAt,
        updatedAt: body.updatedAt,
      };
    })
  );
});

router.get("/:id/messages", async (req, res) => {
  const q = config.bypassAuth
    ? "SELECT body->>'transcript' AS transcript FROM fc_sessions WHERE id = $1 LIMIT 1"
    : "SELECT body->>'transcript' AS transcript FROM fc_sessions WHERE id = $1 AND body->>'userId' = $2 LIMIT 1";
  const params = config.bypassAuth
    ? [req.params.id]
    : [req.params.id, req.auth.userId];

  const { rows } = await pool.query(q, params);
  res.json(rows[0]?.transcript ? parseTranscript(rows[0].transcript) : []);
});

export default router;
