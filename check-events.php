<?php
$conn = new mysqli('localhost', 'root', '', 'eventsystem');

echo "=== DATABASE STATUS ===\n";
$result = $conn->query("SELECT COUNT(*) cnt FROM events");
$row = $result->fetch_assoc();
echo "Total events: " . $row['cnt'] . "\n\n";

echo "=== EVENTS LIST ===\n";
$result = $conn->query("SELECT event_id, event_name, event_date, image_url FROM events ORDER BY event_id");
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "ID: " . $row['event_id'] . " | Name: " . $row['event_name'] . " | Date: " . $row['event_date'] . " | Image: " . ($row['image_url'] ?: 'NULL') . "\n";
    }
} else {
    echo "No events found in database.\n";
}

$conn->close();
?>
