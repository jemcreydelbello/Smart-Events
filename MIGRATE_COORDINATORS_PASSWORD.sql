-- ============================================================
-- MIGRATE COORDINATORS TABLE - Add Password Fields
-- ============================================================
-- Run this SQL to add password functionality to existing coordinators table
-- This can be run on an existing database without losing data
-- ============================================================

USE eventsystem;

-- Add password and reset token columns to coordinators table
ALTER TABLE coordinators ADD COLUMN password_hash VARCHAR(255) NULL AFTER contact_number;
ALTER TABLE coordinators ADD COLUMN reset_token VARCHAR(255) NULL AFTER password_hash;
ALTER TABLE coordinators ADD COLUMN reset_expire DATETIME NULL AFTER reset_token;

-- Add indexes for better query performance
ALTER TABLE coordinators ADD KEY idx_coordinator_email (email);
ALTER TABLE coordinators ADD KEY idx_reset_token (reset_token);

-- Verify the migration
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'coordinators' AND TABLE_SCHEMA = 'eventsystem'
ORDER BY ORDINAL_POSITION;

-- ============================================================
-- MIGRATION COMPLETE
-- You can now create coordinators with password functionality
-- ============================================================
