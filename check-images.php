<?php
header('Content-Type: application/json');

$conn = new mysqli('localhost', 'root', '', 'eventsystem');
if ($conn->connect_error) {
    echo json_encode(['error' => 'DB Connection failed: ' . $conn->connect_error]);
    exit;
}

// Check events
$result = $conn->query("SELECT event_id, event_name, image_url FROM events LIMIT 5");
$events = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $events[] = $row;
    }
}

echo json_encode([
    'total_events' => $conn->query("SELECT COUNT(*) as cnt FROM events")->fetch_assoc()['cnt'],
    'with_images' => $conn->query("SELECT COUNT(*) as cnt FROM events WHERE image_url IS NOT NULL AND image_url != ''")->fetch_assoc()['cnt'],
    'sample_events' => $events
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

$conn->close();
?>
