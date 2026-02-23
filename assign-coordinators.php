<?php
require 'db_config.php';

echo "=== Assigning Coordinators to Unassigned Events ===\n\n";

// Assign coordinator to qwerty event
$update_query = "UPDATE events SET coordinator_id = 14 WHERE event_name = 'qwerty'";
if ($conn->query($update_query)) {
    echo "✓ Assigned coordinator_id 14 to 'qwerty' event\n";
} else {
    echo "❌ Failed to update qwerty event\n";
}

// List all unassigned events
echo "\n=== Current Event-Coordinator Status ===\n";
$query = "SELECT event_id, event_name, coordinator_id, 
                 (SELECT coordinator_name FROM coordinators WHERE coordinator_id = e.coordinator_id) as coordinator_name
          FROM events e
          ORDER BY event_id DESC";

$result = $conn->query($query);

if ($result) {
    echo "Event ID | Event Name | Coordinator ID | Coordinator Name\n";
    echo str_repeat("-", 80) . "\n";
    
    while ($row = $result->fetch_assoc()) {
        printf("%-8s | %-15s | %-14s | %s\n",
            $row['event_id'],
            substr($row['event_name'], 0, 12),
            $row['coordinator_id'] ?? 'NULL',
            $row['coordinator_name'] ?? 'Unassigned'
        );
    }
}

?>
