import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import config from "../../config.js";

const router = Router();
const HOME = process.env.HOME ?? "/tmp";

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

function sessionsDir(agentId: string): string {
  return path.join(HOME, `.openclaw/agents/${agentId}/sessions`);
}

function readIndex(agentId: string): Record<string, SessionEntry> {
  try {
    return JSON.parse(fs.readFileSync(path.join(sessionsDir(agentId), "sessions.json"), "utf-8"));
  } catch {
    return {};
  }
}

function readTranscript(agentId: string, ocSessionId: string): string | null {
  try {
    return fs.readFileSync(path.join(sessionsDir(agentId), `${ocSessionId}.jsonl`), "utf-8");
  } catch {
    return null;
  }
}

function allAgentIds(): string[] {
  try {
    const dir = path.join(HOME, ".openclaw/agents");
    return fs.readdirSync(dir).filter((n) => fs.statSync(path.join(dir, n)).isDirectory());
  } catch {
    return [];
  }
}

router.get("/", (req, res) => {
  const agents = config.bypassAuth ? allAgentIds() : req.auth?.userId ? [req.auth.userId] : [];
  const sessions: Array<{ id: string; title: string; updatedAt?: string }> = [];

  for (const agentId of agents) {
    for (const [key, entry] of Object.entries(readIndex(agentId))) {
      const transcript = readTranscript(agentId, entry.sessionId);
      const msgs = transcript ? parseTranscript(transcript) : [];
      sessions.push({ id: key, title: titleFromMessages(msgs), updatedAt: entry.updatedAt });
    }
  }

  sessions.sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
  res.json(sessions.slice(0, 50));
});

router.get("/:id/messages", (req, res) => {
  const agents = config.bypassAuth ? allAgentIds() : req.auth?.userId ? [req.auth.userId] : [];

  for (const agentId of agents) {
    const entry = readIndex(agentId)[req.params.id];
    if (!entry) continue;
    const transcript = readTranscript(agentId, entry.sessionId);
    if (transcript) return res.json(parseTranscript(transcript));
  }

  res.json([]);
});

export default router;
