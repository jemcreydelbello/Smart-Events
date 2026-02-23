-- ============================================================
-- EVENT METADATA TABLE MIGRATION
-- ============================================================
-- This migration adds support for custom "Other Information"
-- fields attached to events
-- ============================================================

USE eventsystem;

-- Create event_metadata table for storing custom fields
CREATE TABLE IF NOT EXISTS event_metadata (
    metadata_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_value LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id),
    UNIQUE KEY unique_field_per_event (event_id, field_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- SELECT * FROM event_metadata;
-- SELECT * FROM event_metadata WHERE event_id = ?;
