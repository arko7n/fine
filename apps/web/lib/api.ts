import config from "./config";
import type { ChatMessage } from "./types";

const base = config.apiUrl;

// Chat

export async function sendMessage(sessionId: string, message: string, userId: string) {
  return fetch(`${base}/v1/responses`, {
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
  const res = await fetch(`${base}/api/sessions`);
  return res.json();
}

export async function fetchSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${base}/api/sessions/${sessionId}/messages`);
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
  const res = await fetch(`${base}/api/connections`);
  return res.json();
}

export async function initiateConnect(
  provider: string,
  params?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(`${base}/api/connections/${provider}/connect`, {
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
  const res = await fetch(`${base}/api/connections/${provider}/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function disconnectConnection(id: string): Promise<void> {
  await fetch(`${base}/api/connections/${id}`, {
    method: "DELETE",
  });
}

// Auth stubs

export type User = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
};

export async function getMe(): Promise<User> {
  const res = await fetch(`${base}/api/auth/me`);
  return res.json();
}
