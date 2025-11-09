-- Initial migration for webhook system
-- Date: 2025-11-06

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  google_id TEXT UNIQUE,
  hashed_password TEXT,
  email_verified INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS email_idx ON users(email);
CREATE INDEX IF NOT EXISTS google_id_idx ON users(google_id);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tags TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS webhook_user_id_idx ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS webhook_uuid_idx ON webhooks(uuid);

-- Webhook data table
CREATE TABLE IF NOT EXISTS webhook_data (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  method TEXT NOT NULL,
  headers TEXT NOT NULL,
  data TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS webhook_data_webhook_id_idx ON webhook_data(webhook_id);
CREATE INDEX IF NOT EXISTS webhook_data_received_at_idx ON webhook_data(received_at DESC);

-- Webhook shares table (collaboration)
CREATE TABLE IF NOT EXISTS webhook_shares (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id TEXT,
  invited_by_user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_at INTEGER NOT NULL,
  accepted_at INTEGER,
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS webhook_share_webhook_id_idx ON webhook_shares(webhook_id);
CREATE INDEX IF NOT EXISTS webhook_share_email_idx ON webhook_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS webhook_share_user_id_idx ON webhook_shares(shared_with_user_id);
