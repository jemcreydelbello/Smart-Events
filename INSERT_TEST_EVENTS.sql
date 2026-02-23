-- Smart Events - Test Data Insert
-- This script adds sample events with images to demonstrate the application

USE eventsystem;

-- Clear existing events first (optional - comment out if you want to keep old events)
-- DELETE FROM events;

-- Insert test events with image references
-- Make sure these image files exist in /Smart-Events/uploads/

INSERT INTO events (event_name, description, event_date, start_time, end_time, location, capacity, image_url, created_by)
VALUES 
  ('Tech Conference 2026', 'Annual technology conference featuring latest innovations in software and hardware', CURDATE(), '09:00:00', '17:00:00', 'Convention Center', 200, '/Smart-Events/uploads/admin_1771246188_6993126c2d72e.jpg', 1),
  ('Web Development Workshop', 'Hands-on training for modern web technologies', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00', '14:00:00', 'Tech Lab', 50, '/Smart-Events/uploads/admin_1771246196_69931274c04fe.jpg', 1),
  ('AI & Machine Learning Summit', 'Explore the future of artificial intelligence', DATE_ADD(CURDATE(), INTERVAL 7 DAY), '08:30:00', '18:00:00', 'Innovation Hub', 300, '/Smart-Events/uploads/admin_1771246205_6993127d0cbdb.jpg', 1),
  ('Mobile App Development Bootcamp', 'Intensive program for mobile app development', DATE_ADD(CURDATE(), INTERVAL 14 DAY), '10:00:00', '16:00:00', 'Tech Campus', 75, '/Smart-Events/uploads/admin_1771246213_699312857d8e6.jpg', 1);

-- Verify insertion
SELECT 'Test events inserted successfully!' as Status;
SELECT COUNT(*) as total_events FROM events;
SELECT event_id, event_name, DATE(event_date) as event_date, image_url FROM events ORDER BY event_date DESC;
d