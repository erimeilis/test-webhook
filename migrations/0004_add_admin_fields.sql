-- Migration: Add admin plugin required fields to user table
-- Better Auth admin plugin requires: banned, banReason, banExpires

-- Add banned column with default value false
ALTER TABLE user ADD COLUMN banned INTEGER DEFAULT 0;

-- Add banReason column (nullable)
ALTER TABLE user ADD COLUMN ban_reason TEXT;

-- Add banExpires column (nullable timestamp)
ALTER TABLE user ADD COLUMN ban_expires INTEGER;
