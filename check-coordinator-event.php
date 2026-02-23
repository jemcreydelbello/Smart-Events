<?php
require 'db_config.php';

echo "=== Event & Coordinator Diagnostic ===\n\n";

// Check all events and their coordinators
echo "=== Events & Coordinator Assignments ===\n";
$query = "SELECT e.event_id, e.event_name, e.coordinator_id, 
                 c.coordinator_id, c.coordinator_name, c.email
          FROM events e
          LEFT JOIN coordinators c ON e.coordinator_id = c.coordinator_id
          ORDER BY e.event_id DESC
          LIMIT 20";

$result = $conn->query($query);

if ($result && $result->num_rows > 0) {
    echo "Event ID | Event Name | Coordinator ID | Coordinator Name\n";
    echo str_repeat("-", 80) . "\n";
    
    while ($row = $result->fetch_assoc()) {
        printf("%-8s | %-15s | %-14s | %s\n",
            $row['event_id'],
            substr($row['event_name'] ?? 'N/A', 0, 12),
            $row['coordinator_id'] ?? 'NULL',
            $row['coordinator_name'] ?? 'Unassigned'
        );
    }
} else {
    echo "❌ No events found\n";
}

// Check the specific qwerty event
echo "\n=== Qwerty Event Details ===\n";
$qwerty_query = "SELECT e.event_id, e.event_name, e.coordinator_id, 
                        c.coordinator_id, c.coordinator_name, c.email
                 FROM events e
                 LEFT JOIN coordinators c ON e.coordinator_id = c.coordinator_id
                 WHERE e.event_name = 'qwerty'";

$qwerty_result = $conn->query($qwerty_query);

if ($qwerty_result && $qwerty_result->num_rows > 0) {
    $qwerty_row = $qwerty_result->fetch_assoc();
    echo "Event: " . $qwerty_row['event_name'] . "\n";
    echo "Event ID: " . $qwerty_row['event_id'] . "\n";
    echo "Coordinator ID: " . ($qwerty_row['coordinator_id'] ?? 'NULL/Unassigned') . "\n";
    echo "Coordinator Name: " . ($qwerty_row['coordinator_name'] ?? 'Unassigned') . "\n";
    echo "Coordinator Email: " . ($qwerty_row['email'] ?? 'N/A') . "\n";
} else {
    echo "❌ Qwerty event not found\n";
}

// Check all coordinators
echo "\n=== All Coordinators ===\n";
$coord_query = "SELECT coordinator_id, coordinator_name, email, is_active
               FROM coordinators
               ORDER BY coordinator_id ASC";

$coord_result = $conn->query($coord_query);

if ($coord_result && $coord_result->num_rows > 0) {
    echo "ID | Name\t\t\t\t| Email\t\t\t\t| Active\n";
    echo str_repeat("-", 100) . "\n";
    
    while ($row = $coord_result->fetch_assoc()) {
        printf("%-3s| %-30s| %-30s| %s\n",
            $row['coordinator_id'],
            substr($row['coordinator_name'], 0, 28),
            substr($row['email'], 0, 28),
            $row['is_active'] ? 'Yes' : 'No'
        );
    }
} else {
    echo "❌ No coordinators found\n";
}

?>
