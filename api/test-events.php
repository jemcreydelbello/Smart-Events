<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database config
require_once '../config/db.php';

// Test the list_all query
$query = "SELECT e.event_id, e.event_name, e.description, DATE(e.start_event) as event_date, TIME(e.start_event) as start_time, TIME(e.end_event) as end_time, 
                 e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id
          FROM events e
          WHERE e.archived = 0
          ORDER BY e.start_event DESC";

echo "Testing events query...\n";

$result = $conn->query($query);

if (!$result) {
    echo "ERROR: " . $conn->error . "\n";
    exit;
}

echo "Query executed successfully!\n";
echo "Number of rows: " . $result->num_rows . "\n";

// Fetch and display first few rows
$count = 0;
while ($row = $result->fetch_assoc() && $count < 3) {
    echo "Event: " . $row['event_name'] . "\n";
    $count++;
}

echo "Total processed: $count rows\n";
?>
