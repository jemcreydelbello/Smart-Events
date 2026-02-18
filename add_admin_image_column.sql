-- Add admin_image column to admins table for profile pictures
ALTER TABLE admins ADD COLUMN admin_image LONGBLOB NULL DEFAULT NULL AFTER full_name;

-- You can verify the column was added with:
-- DESCRIBE admins;
