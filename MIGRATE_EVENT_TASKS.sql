-- ============================================================
-- MIGRATE EVENT_TASKS TABLE
-- ============================================================
-- Run this SQL to add the event tasks table to existing database
-- This enables task management for events
-- ============================================================

USE eventsystem;

-- Create event_tasks table
CREATE TABLE IF NOT EXISTS event_tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    party_responsible VARCHAR(150),
    status ENUM('Pending', 'In Progress', 'Done') DEFAULT 'Pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    KEY idx_event_id (event_id),
    KEY idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MIGRATION COMPLETE
-- You can now create and manage tasks for events
-- ============================================================
