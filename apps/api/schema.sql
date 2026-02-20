-- Fine database schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sessions and Users
CREATE TABLE fc_sessions (
  id   TEXT PRIMARY KEY,
  body JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE fc_users (
  id   TEXT PRIMARY KEY,
  body JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_fc_sessions_user ON fc_sessions ((body ->> 'userId'));
CREATE INDEX idx_fc_sessions_updated ON fc_sessions ((body ->> 'updatedAt') DESC);

-- Connections (linked accounts)
CREATE TABLE IF NOT EXISTS connections (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_connections_user
  ON connections ((body ->> 'userId'));
CREATE INDEX IF NOT EXISTS idx_connections_user_provider
  ON connections ((body ->> 'userId'), (body ->> 'provider'));
