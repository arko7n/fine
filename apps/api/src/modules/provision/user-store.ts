import pool from "../../lib/db.js";
import logger from "../../lib/logger.js";

const log = logger.child({ src: "user-store" });

export type UserStatus = "provisioning" | "running" | "stopped";

export type UserBody = {
  status: UserStatus;
  taskArn?: string;
  taskIp?: string;
  provisionedAt?: string;
};

export type UserRow = {
  id: string;
  body: UserBody;
};

export async function getUser(userId: string): Promise<UserRow | null> {
  const result = await pool.query(
    `SELECT id, body FROM fc_users WHERE id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function upsertUser(userId: string, body: UserBody): Promise<UserRow> {
  const result = await pool.query(
    `INSERT INTO fc_users (id, body) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET body = $2
     RETURNING id, body`,
    [userId, JSON.stringify(body)],
  );
  log.info({ userId, status: body.status }, "Upserted user");
  return result.rows[0];
}

export async function updateUserBody(userId: string, patch: Partial<UserBody>): Promise<UserRow> {
  const result = await pool.query(
    `UPDATE fc_users SET body = body || $1::jsonb WHERE id = $2 RETURNING id, body`,
    [JSON.stringify(patch), userId],
  );
  if (result.rows.length === 0) {
    throw new Error(`User ${userId} not found`);
  }
  log.info({ userId, patch }, "Updated user body");
  return result.rows[0];
}
