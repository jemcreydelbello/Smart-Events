-- Password Reset Feature Migration
-- This migration adds password reset functionality to the admins table
-- Run this if the columns are not already present in your database

-- Add reset token columns to admins table (if not already present)
ALTER TABLE admins
ADD reset_token VARCHAR(255) NULL DEFAULT NULL,
ADD reset_expire DATETIME NULL DEFAULT NULL;

-- Create index for faster token lookups (if not already present)
CREATE INDEX IF NOT EXISTS idx_reset_token ON admins (reset_token);

-- Verify the columns were added successfully
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'admins' 
AND COLUMN_NAME IN ('reset_token', 'reset_expire');
