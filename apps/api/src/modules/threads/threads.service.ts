import pool from "../../lib/db.js";

export async function createThread(userId: string, title: string) {
  const body = {
    userId,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const { rows } = await pool.query(
    `INSERT INTO threads (body) VALUES ($1) RETURNING id, body`,
    [JSON.stringify(body)]
  );
  return rows[0];
}

export async function listThreads(userId: string) {
  const { rows } = await pool.query(
    `SELECT t.id, t.body,
       (SELECT e.body->>'content' FROM thread_events e
        WHERE e.body->>'threadId' = t.id::text
        ORDER BY e.body->>'createdAt' DESC LIMIT 1
       ) AS last_message
     FROM threads t
     WHERE t.body->>'userId' = $1
     ORDER BY t.body->>'updatedAt' DESC`,
    [userId]
  );
  return rows;
}

export async function getThread(id: string) {
  const { rows } = await pool.query(
    `SELECT id, body FROM threads WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateThreadTimestamp(id: string) {
  await pool.query(
    `UPDATE threads SET body = jsonb_set(body, '{updatedAt}', to_jsonb($1::text)) WHERE id = $2`,
    [new Date().toISOString(), id]
  );
}
