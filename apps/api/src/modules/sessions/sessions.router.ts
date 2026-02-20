import { Router } from "express";
import fs from "node:fs";
import path from "node:path";

const router = Router();
const HOME = process.env.HOME ?? "/tmp";
const AGENT_ID = "main";

type Message = { role: "user" | "assistant"; content: string };
type SessionEntry = { sessionId: string; updatedAt?: string };

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

const SESSIONS_DIR = path.join(HOME, `.openclaw/agents/${AGENT_ID}/sessions`);

function readIndex(): Record<string, SessionEntry> {
  try {
    return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, "sessions.json"), "utf-8"));
  } catch {
    return {};
  }
}

function readTranscript(ocSessionId: string): string | null {
  try {
    return fs.readFileSync(path.join(SESSIONS_DIR, `${ocSessionId}.jsonl`), "utf-8");
  } catch {
    return null;
  }
}

router.get("/", (_req, res) => {
  const sessions: Array<{ id: string; title: string; updatedAt?: string }> = [];

  for (const [key, entry] of Object.entries(readIndex())) {
    const transcript = readTranscript(entry.sessionId);
    const msgs = transcript ? parseTranscript(transcript) : [];
    sessions.push({ id: key, title: titleFromMessages(msgs), updatedAt: entry.updatedAt });
  }

  sessions.sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
  res.json(sessions.slice(0, 50));
});

router.get("/:id/messages", (req, res) => {
  const entry = readIndex()[req.params.id];
  if (!entry) { res.json([]); return; }
  const transcript = readTranscript(entry.sessionId);
  if (transcript) { res.json(parseTranscript(transcript)); return; }
  res.json([]);
});

export default router;
