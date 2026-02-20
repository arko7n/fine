import config from "./config";
import type { ChatMessage } from "./types";

const base = config.apiUrl;

type TokenGetter = () => Promise<string | null>;

let _getToken: TokenGetter | null = null;

export function setTokenGetter(fn: TokenGetter) {
  _getToken = fn;
}

async function authedFetch(url: string, init?: RequestInit): Promise<Response> {
  if (!_getToken) throw new Error("Auth not initialized — call setTokenGetter first");
  const token = await _getToken();
  if (!token) throw new Error("Missing auth token");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

// Chat

export async function sendMessage(sessionId: string, message: string, userId: string) {
  return authedFetch(`${base}/v1/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-OpenClaw-Session-Key": sessionId,
    },
    body: JSON.stringify({ model: "openclaw", stream: true, user: userId, input: message }),
  });
}

// Sessions

export type Session = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchSessions(): Promise<Session[]> {
  const res = await authedFetch(`${base}/api/sessions`);
  return res.json();
}

export async function fetchSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await authedFetch(`${base}/api/sessions/${sessionId}/messages`);
  return res.json();
}

// Integrations

export type Integration = {
  id: string;
  label: string;
  description: string;
  icon: string;
  provider: string;
};

export async function fetchIntegrations(): Promise<Integration[]> {
  const res = await fetch(`${base}/api/integrations`);
  return res.json();
}

// Connections

export type Connection = {
  id: string;
  body: {
    userId: string;
    provider: string;
    status: string;
    credentials: Record<string, unknown>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
};

export async function listConnections(): Promise<Connection[]> {
  const res = await authedFetch(`${base}/api/connections`);
  return res.json();
}

export async function initiateConnect(
  provider: string,
  params?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await authedFetch(`${base}/api/connections/${provider}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params ?? {}),
  });
  return res.json();
}

export async function handleConnectCallback(
  provider: string,
  payload: Record<string, unknown>
): Promise<Connection> {
  const res = await authedFetch(`${base}/api/connections/${provider}/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function disconnectConnection(id: string): Promise<void> {
  await authedFetch(`${base}/api/connections/${id}`, {
    method: "DELETE",
  });
}
