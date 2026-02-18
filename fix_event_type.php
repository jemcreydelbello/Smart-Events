<?php
require_once 'db_config.php';

// Find and fix the Malolos Marathon event on Feb 14, 2026
$query = "UPDATE events SET is_private = 0 WHERE event_date = '2026-02-14' AND event_name LIKE '%Malolos%'";

if ($conn->query($query)) {
    // Verify the update
    $verify = $conn->query("SELECT event_id, event_name, event_date, is_private FROM events WHERE event_date = '2026-02-14' AND event_name LIKE '%Malolos%'");
    $event = $verify->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'message' => 'Event type updated successfully',
        'event' => $event
    ], JSON_PRETTY_PRINT);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update event: ' . $conn->error
    ], JSON_PRETTY_PRINT);
}

$conn->close();
?>
