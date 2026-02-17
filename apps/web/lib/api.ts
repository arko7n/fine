import config from "./config";

const base = config.apiUrl;

export type Thread = {
  id: string;
  body: {
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  last_message: string | null;
};

export type ThreadEvent = {
  id: string;
  body: {
    threadId: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  };
};

export type ThreadWithEvents = Thread & { events: ThreadEvent[] };

export async function createThread(title?: string): Promise<Thread> {
  const res = await fetch(`${base}/api/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function listThreads(): Promise<Thread[]> {
  const res = await fetch(`${base}/api/threads`);
  return res.json();
}

export async function getThread(id: string): Promise<ThreadWithEvents> {
  const res = await fetch(`${base}/api/threads/${id}`);
  return res.json();
}

export async function sendMessage(threadId: string, message: string) {
  return fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId, message }),
  });
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
