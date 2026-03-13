-- Add is_walkIn field to registrations table
-- This flag distinguishes between:
-- 0 = Registered through normal registration (default)
-- 1 = Walk-in attendee (manually added by admin)

ALTER TABLE `registrations`
ADD COLUMN `is_walkIn` TINYINT(1) DEFAULT 0 AFTER `status`,
ADD INDEX `idx_is_walkIn` (`is_walkIn`);

-- Add is_walkIn to existing queries/views if needed
-- This maintains backward compatibility as existing records will have is_walkIn = 0
