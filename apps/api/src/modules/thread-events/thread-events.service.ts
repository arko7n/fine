import pool from "../../lib/db.js";

export async function appendEvent(
  threadId: string,
  role: string,
  content: string
) {
  const body = {
    threadId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  const { rows } = await pool.query(
    `INSERT INTO thread_events (body) VALUES ($1) RETURNING id, body`,
    [JSON.stringify(body)]
  );
  return rows[0];
}

export async function listEvents(threadId: string) {
  const { rows } = await pool.query(
    `SELECT id, body FROM thread_events WHERE body->>'threadId' = $1 ORDER BY body->>'createdAt' ASC`,
    [threadId]
  );
  return rows;
}
