-- Persistent conversations for Fine
-- Run against your local Postgres instance

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS threads (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS thread_events (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body JSONB NOT NULL DEFAULT '{}'
);

-- Index for listing threads by user
CREATE INDEX IF NOT EXISTS idx_threads_user_id
  ON threads ((body ->> 'userId'));

-- Index for listing events by thread
CREATE INDEX IF NOT EXISTS idx_thread_events_thread_id
  ON thread_events ((body ->> 'threadId'));

-- Unified connections (replaces per-provider tables like plaid_items)
CREATE TABLE IF NOT EXISTS connections (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_connections_user
  ON connections ((body ->> 'userId'));
CREATE INDEX IF NOT EXISTS idx_connections_user_provider
  ON connections ((body ->> 'userId'), (body ->> 'provider'));
