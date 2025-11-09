-- Migration: Add Better Auth tables
-- Date: 2025-11-06
-- Purpose: Replace old users table with Better Auth schema (user, session, account, verification)

-- Drop all existing tables due to foreign key dependencies
DROP TABLE IF EXISTS webhook_shares;
DROP TABLE IF EXISTS webhook_data;
DROP TABLE IF EXISTS webhooks;
DROP TABLE IF EXISTS users;

-- Better Auth: Users table
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX user_email_idx ON user(email);

-- Better Auth: Session table
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX session_token_idx ON session(token);
CREATE INDEX session_user_id_idx ON session(user_id);

-- Better Auth: Account table (for OAuth)
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX account_provider_idx ON account(provider_id, account_id);
CREATE INDEX account_user_id_idx ON account(user_id);

-- Better Auth: Verification table
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX verification_identifier_idx ON verification(identifier);

-- Webhooks table (updated to reference 'user' instead of 'users')
CREATE TABLE webhooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tags TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX webhook_user_id_idx ON webhooks(user_id);
CREATE INDEX webhook_uuid_idx ON webhooks(uuid);

-- Webhook data table
CREATE TABLE webhook_data (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  method TEXT NOT NULL,
  headers TEXT NOT NULL,
  data TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

CREATE INDEX webhook_data_webhook_id_idx ON webhook_data(webhook_id);
CREATE INDEX webhook_data_received_at_idx ON webhook_data(received_at);

-- Webhook shares table (collaboration)
CREATE TABLE webhook_shares (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id TEXT,
  invited_by_user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_at INTEGER NOT NULL,
  accepted_at INTEGER,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by_user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX webhook_share_webhook_id_idx ON webhook_shares(webhook_id);
CREATE INDEX webhook_share_email_idx ON webhook_shares(shared_with_email);
CREATE INDEX webhook_share_user_id_idx ON webhook_shares(shared_with_user_id);
