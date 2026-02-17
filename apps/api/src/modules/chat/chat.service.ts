import { ocBaseUrl, ocToken } from "../openclaw/openclaw.service.js";
import { appendEvent, listEvents } from "../thread-events/thread-events.service.js";
import { getThread, updateThreadTimestamp } from "../threads/threads.service.js";
import { getConnections, getConnectionsByProvider } from "../connections/connection-store.js";
import { getProvider } from "../connections/provider-registry.js";
import logger from "../../lib/logger.js";

const log = logger.child({ module: "chat" });

type HistoryMessage = { role: string; content: string };

export async function buildHistory(threadId: string): Promise<HistoryMessage[]> {
  const events = await listEvents(threadId);
  return events.map((e: { body: { role: string; content: string } }) => ({
    role: e.body.role,
    content: e.body.content,
  }));
}

export async function persistUserMessage(threadId: string, content: string) {
  await appendEvent(threadId, "user", content);
  await updateThreadTimestamp(threadId);
}

export async function persistAssistantMessage(threadId: string, content: string) {
  await appendEvent(threadId, "assistant", content);
  await updateThreadTimestamp(threadId);
}

export async function validateThread(threadId: string) {
  return getThread(threadId);
}

/**
 * Build a system message with the user's connected integrations so the agent
 * knows which credentials to use when calling provider tools.
 */
export async function buildIntegrationContext(userId: string): Promise<HistoryMessage | null> {
  const connections = await getConnections(userId);
  if (connections.length === 0) return null;

  // Group connections by provider
  const grouped = new Map<string, typeof connections>();
  for (const c of connections) {
    const list = grouped.get(c.body.provider) ?? [];
    list.push(c);
    grouped.set(c.body.provider, list);
  }

  const parts: string[] = [];
  for (const [provider, conns] of grouped) {
    const handler = getProvider(provider);
    if (handler?.getAgentContext) {
      const ctx = handler.getAgentContext(conns);
      if (ctx) parts.push(ctx);
    }
  }

  if (parts.length === 0) return null;

  return {
    role: "system",
    content: parts.join("\n\n"),
  };
}

export async function callOpenClaw(messages: HistoryMessage[]): Promise<Response> {
  log.debug("sending request to openclaw");
  const start = Date.now();
  const res = await fetch(`${ocBaseUrl()}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ocToken()}`,
    },
    body: JSON.stringify({
      model: "openclaw",
      stream: true,
      messages,
    }),
  });
  log.debug({ status: res.status, ms: Date.now() - start }, "openclaw first byte");
  return res;
}

export function parseSSEChunk(chunk: string): string {
  let text = "";
  for (const line of chunk.split("\n")) {
    if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
    try {
      const json = JSON.parse(line.slice(6));
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) text += delta;
    } catch {
      // skip non-JSON lines
    }
  }
  return text;
}
