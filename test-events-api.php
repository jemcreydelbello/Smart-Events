<?php
header('Content-Type: application/json');
require_once 'db_config.php';

// Test: Get count of events
$count_result = $conn->query("SELECT COUNT(*) as total FROM events");
$count = $count_result->fetch_assoc()['total'];

// Test: Get first 3 events
$events_result = $conn->query("SELECT event_id, event_name, event_date, location FROM events LIMIT 3");
$events = [];
while ($row = $events_result->fetch_assoc()) {
    $events[] = $row;
}

// Test: Simulate API call
$today = date('Y-m-d');
$api_query = "SELECT e.event_id, e.event_name, e.description, e.event_date, e.start_time, e.end_time, e.location, e.capacity, e.is_private, e.image_url
              FROM events e
              WHERE e.event_date >= ? AND (e.archived = 0 OR e.archived IS NULL)
              ORDER BY e.event_date ASC";

$stmt = $conn->prepare($api_query);
$stmt->bind_param('s', $today);
$stmt->execute();
$api_result = $stmt->get_result();
$api_events = [];
while ($row = $api_result->fetch_assoc()) {
    $api_events[] = $row;
}

echo json_encode([
    'total_events_in_db' => $count,
    'sample_events' => $events,
    'upcoming_events_count' => count($api_events),
    'upcoming_events' => $api_events,
    'today' => $today
], JSON_PRETTY_PRINT);
?>
