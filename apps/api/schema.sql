-- Fine database schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE fc_users (
  id   TEXT PRIMARY KEY,
  body JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_fc_users_provision_status
  ON fc_users ((body ->> 'provisionStatus')); 

-- Connections (linked accounts)
CREATE TABLE IF NOT EXISTS connections (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_connections_user
  ON connections ((body ->> 'userId'));
CREATE INDEX IF NOT EXISTS idx_connections_user_provider
  ON connections ((body ->> 'userId'), (body ->> 'provider'));
