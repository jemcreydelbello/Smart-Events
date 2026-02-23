-- Add company, job_title, and coordinator_image columns to coordinators table
-- This migration adds new fields for enhanced coordinator profile information

ALTER TABLE coordinators
ADD COLUMN company VARCHAR(150) NULL DEFAULT NULL AFTER contact_number,
ADD COLUMN job_title VARCHAR(150) NULL DEFAULT NULL AFTER company,
ADD COLUMN coordinator_image VARCHAR(255) NULL DEFAULT NULL AFTER job_title;

-- Create index for better query performance (optional)
CREATE INDEX idx_coordinator_company ON coordinators(company);
CREATE INDEX idx_coordinator_job_title ON coordinators(job_title);

-- Verify the new columns were added
-- SELECT * FROM coordinators LIMIT 1;
