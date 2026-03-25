<?php
require 'config/db.php';

// Unarchive all events
$conn->query('UPDATE events SET archived = 0 WHERE archived = 1 OR archived IS NULL');

// Check result
$r = $conn->query('SELECT COUNT(*) as cnt FROM events WHERE archived = 0 OR archived IS NULL');
$row = $r->fetch_assoc();
$activeCount = $row['cnt'];

echo "✓ Fixed! All events unarchived\n";
echo "Active events now: " . $activeCount . "\n";

// Show list
echo "\nActive events:\n";
$r = $conn->query('SELECT event_id, event_name, start_event FROM events WHERE archived = 0 ORDER BY start_event DESC');
while($row = $r->fetch_assoc()) {
    echo "  - " . $row['event_name'] . " (" . $row['start_event'] . ")\n";
}
