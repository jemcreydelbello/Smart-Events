<?php
// Test API endpoint to see what event detail returns
require_once '../config/db.php';

// Get the event ID from query
$event_id = $_GET['event_id'] ?? 1;

// Fetch event using the same query as events.php
$query = "SELECT e.event_id, e.event_name, e.description, DATE(e.start_event) as event_date, TIME(e.start_event) as start_time, DATE(e.end_event) as end_date, TIME(e.end_event) as end_time, e.location, e.capacity, e.is_private, e.image_url, e.registration_start, e.registration_end, e.registration_link, e.website, e.created_by, e.created_at, e.coordinator_id, MAX(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as created_by_name,
              MAX(c.coordinator_id) as coordinator_id, MAX(c.coordinator_name) as coordinator_name, MAX(c.email) as coordinator_email, MAX(c.contact_number) as coordinator_contact,
              MAX(eac.access_code) as access_code,
              COUNT(DISTINCT r.registration_id) as total_registrations,
              SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
              (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
              FROM events e
              LEFT JOIN users u ON e.created_by = u.user_id
              LEFT JOIN coordinators c ON e.coordinator_id = c.coordinator_id
              LEFT JOIN event_access_codes eac ON e.event_id = eac.event_id AND eac.is_active = 1
              LEFT JOIN registrations r ON e.event_id = r.event_id
              WHERE e.event_id = ?
              GROUP BY e.event_id";

$stmt = $conn->prepare($query);
$stmt->bind_param('i', $event_id);
$stmt->execute();
$result = $stmt->get_result();
$event = $result->fetch_assoc();

// Output full event data
echo json_encode([
    'success' => true,
    'event_id' => $event_id,
    'data' => $event,
    'debug' => [
        'raw_start_event' => $event['event_date'] . ' ' . $event['start_time'],
        'raw_end_event' => $event['end_date'] . ' ' . $event['end_time'],
        'image_url' => $event['image_url'],
        'access_code' => $event['access_code'],
        'is_private' => $event['is_private']
    ]
], JSON_PRETTY_PRINT);
