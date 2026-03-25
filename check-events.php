<?php
require 'config/db.php';

// Check total events
$r = $conn->query('SELECT COUNT(*) as cnt FROM events');
$row = $r->fetch_assoc();
echo "Total events: " . $row['cnt'] . "\n";

// Check non-archived
$r = $conn->query('SELECT COUNT(*) as cnt FROM events WHERE archived = 0 OR archived IS NULL');
$row = $r->fetch_assoc();
echo "Non-archived: " . $row['cnt'] . "\n\n";

// Get sample events
echo "Sample events:\n";
$r = $conn->query('SELECT event_id, event_name, archived, start_event FROM events LIMIT 5');
while($row = $r->fetch_assoc()) {
    echo json_encode($row) . "\n";
}
