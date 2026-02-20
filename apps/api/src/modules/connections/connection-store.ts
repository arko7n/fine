import pool from "../../lib/db.js";
import logger from "../../lib/logger.js";

const log = logger.child({ src: "connection-store" });

export type ConnectionBody = {
  userId: string;
  provider: string;
  status: string;
  credentials: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ConnectionRow = {
  id: string;
  body: ConnectionBody;
};

export async function insertConnection(
  userId: string,
  provider: string,
  credentials: Record<string, unknown>,
  metadata: Record<string, unknown>
): Promise<ConnectionRow> {
  const now = new Date().toISOString();
  const body: ConnectionBody = {
    userId,
    provider,
    status: "active",
    credentials,
    metadata,
    createdAt: now,
    updatedAt: now,
  };
  const result = await pool.query(
    `INSERT INTO connections (body) VALUES ($1) RETURNING id, body`,
    [JSON.stringify(body)]
  );
  log.info({ userId, provider }, "Inserted connection");
  return result.rows[0];
}

export async function getConnections(userId: string): Promise<ConnectionRow[]> {
  const result = await pool.query(
    `SELECT id, body FROM connections WHERE body->>'userId' = $1 ORDER BY body->>'createdAt' DESC`,
    [userId]
  );
  return result.rows;
}

export async function getConnectionsByProvider(
  userId: string,
  provider: string
): Promise<ConnectionRow[]> {
  const result = await pool.query(
    `SELECT id, body FROM connections WHERE body->>'userId' = $1 AND body->>'provider' = $2 ORDER BY body->>'createdAt' DESC`,
    [userId, provider]
  );
  return result.rows;
}

export async function getConnection(id: string): Promise<ConnectionRow | null> {
  const result = await pool.query(
    `SELECT id, body FROM connections WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function updateConnectionStatus(
  id: string,
  status: string
): Promise<ConnectionRow | null> {
  const result = await pool.query(
    `UPDATE connections SET body = jsonb_set(jsonb_set(body, '{status}', $1::jsonb), '{updatedAt}', $2::jsonb) WHERE id = $3 RETURNING id, body`,
    [JSON.stringify(status), JSON.stringify(new Date().toISOString()), id]
  );
  return result.rows[0] ?? null;
}

export async function removeConnection(id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM connections WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
