-- Migration: Add role field to user table for admin functionality
-- Better Auth admin plugin support

-- Add role column with default value 'user'
ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'user';
