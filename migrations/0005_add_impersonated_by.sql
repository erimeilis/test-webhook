-- Migration: Add impersonatedBy field to session table
-- Better Auth admin plugin requires this field for user impersonation

-- Add impersonated_by column (nullable)
ALTER TABLE session ADD COLUMN impersonated_by TEXT;
