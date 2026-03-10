<?php
header('Content-Type: application/json');

require_once '../config/db.php';

$now = new DateTime();
$currentDateTime = $now->format('Y-m-d H:i:s');

// Query to get upcoming events
$query = "SELECT 
    e.event_id as id,
    e.event_name,
    DATE(e.start_event) as event_date,
    TIME(e.start_event) as start_time,
    TIME(e.end_event) as end_time,
    e.location,
    e.description,
    e.image_url,
    e.is_private,
    e.capacity,
    COALESCE(COUNT(r.registration_id), 0) as current_registrations,
    e.registration_end,
    CASE WHEN COALESCE(COUNT(r.registration_id), 0) >= e.capacity THEN 1 ELSE 0 END as is_registration_closed
FROM events e
LEFT JOIN registrations r ON e.event_id = r.event_id
WHERE e.start_event > NOW()
GROUP BY e.event_id
ORDER BY e.start_event ASC
LIMIT 50";

$result = $conn->query($query);
    
if (!$result) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Query failed: ' . $conn->error
    ]);
    exit;
}

$events = [];
while ($row = $result->fetch_assoc()) {
    $row['is_private'] = (int)$row['is_private'];
    $row['capacity'] = (int)$row['capacity'];
    $row['current_registrations'] = (int)$row['current_registrations'];
    $row['is_registration_closed'] = (int)$row['is_registration_closed'];
    $events[] = $row;
}
    
$conn->close();

echo json_encode([
    'success' => true,
    'events' => $events,
    'count' => count($events)
]);
?>