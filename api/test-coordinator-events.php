<?php
header('Content-Type: application/json');
require_once '../config/db.php';

// Get all events with coordinator info using the fixed query
$query = "SELECT e.event_id, e.event_name, e.coordinator_id, c.coordinator_name, c.email 
          FROM events e 
          LEFT JOIN coordinators c ON e.coordinator_id = c.coordinator_id 
          LIMIT 20";

$result = $conn->query($query);
$events = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $events[] = $row;
    }
}

// Also check coordinators
$query2 = "SELECT coordinator_id, coordinator_name, email FROM coordinators LIMIT 10";
$result2 = $conn->query($query2);
$coordinators = [];

if ($result2) {
    while ($row = $result2->fetch_assoc()) {
        $coordinators[] = $row;
    }
}

// Check if there are any events with non-null coordinator_id
$coordAssignedQuery = "SELECT COUNT(*) as total, SUM(CASE WHEN coordinator_id IS NOT NULL THEN 1 ELSE 0 END) as assigned 
                       FROM events";
$coordResult = $conn->query($coordAssignedQuery);
$assignmentStats = $coordResult->fetch_assoc();

echo json_encode([
    'events' => $events,
    'coordinators' => $coordinators,
    'total_events' => count($events),
    'total_coordinators' => count($coordinators),
    'assignment_stats' => $assignmentStats
], JSON_PRETTY_PRINT);
?>
