<?php
require_once 'db_config.php';

// Check the current is_private value for Malolos Marathon on Feb 14
$query = "SELECT event_id, event_name, event_date, is_private FROM events WHERE event_date = '2026-02-14' AND event_name LIKE '%Malolos%'";
$result = $conn->query($query);
$event = $result->fetch_assoc();

echo json_encode([
    'event_id' => $event['event_id'] ?? null,
    'event_name' => $event['event_name'] ?? null,
    'event_date' => $event['event_date'] ?? null,
    'is_private' => $event['is_private'] ?? null,
    'is_private_meaning' => $event['is_private'] == 0 ? 'PUBLIC (should be BLUE)' : 'PRIVATE (should be RED)'
], JSON_PRETTY_PRINT);

$conn->close();
?>
