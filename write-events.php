<?php
$conn = new mysqli('localhost', 'root', '', 'eventsystem');
$output = "";

$output .= "=== DATABASE STATUS ===\n";
$result = $conn->query("SELECT COUNT(*) cnt FROM events");
$row = $result->fetch_assoc();
$output .= "Total events: " . $row['cnt'] . "\n\n";

$output .= "=== EVENTS LIST ===\n";
$result = $conn->query("SELECT event_id, event_name, event_date, image_url FROM events ORDER BY event_id");
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $output .= "ID: " . $row['event_id'] . " | " . $row['event_name'] . " | " . $row['event_date'] . " | " . ($row['image_url'] ?: 'NO IMAGE') . "\n";
    }
} else {
    $output .= "No events found!\n";
}

file_put_contents('C:/xampp/htdocs/Smart-Events/events-check.txt', $output);
echo "OK - Check events-check.txt";
?>
