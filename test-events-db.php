<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'config/db.php';

// Set JSON header
header('Content-Type: application/json');

try {
    // Check 1: Count events
    $result = $conn->query("SELECT COUNT(*) as total FROM events");
    $row = $result->fetch_assoc();
    $totalEvents = $row['total'];
    
    // Check 2: Count non-archived events
    $result = $conn->query("SELECT COUNT(*) as total FROM events WHERE archived = 0 OR archived IS NULL");
    $row = $result->fetch_assoc();
    $activeEvents = $row['total'];
    
    // Check 3: Get first 5 events
    $result = $conn->query("SELECT event_id, event_name, archived, start_event, coordinator_id FROM events ORDER BY event_id DESC LIMIT 5");
    $events = [];
    while ($row = $result->fetch_assoc()) {
        $events[] = $row;
    }
    
    // Check 4: Check if archived column exists
    $result = $conn->query("SHOW COLUMNS FROM events LIKE 'archived'");
    $hasArchivedCol = $result->num_rows > 0;
    
    // Check 5: Run the actual query from the API
    $query = "SELECT DISTINCT e.event_id, e.event_name, e.description, DATE(e.start_event) as event_date, 
                      TIME(e.start_event) as start_time, e.coordinator_id, e.archived
              FROM events e
              WHERE e.archived = 0
              GROUP BY e.event_id
              ORDER BY e.start_event DESC";
    
    $result = $conn->query($query);
    $apiResult = [];
    while ($row = $result->fetch_assoc()) {
        $apiResult[] = $row;
    }
    
    ob_end_clean();
    echo json_encode([
        'success' => true,
        'total_events' => $totalEvents,
        'active_events' => $activeEvents,
        'has_archived_column' => $hasArchivedCol,
        'first_5_events' => $events,
        'api_query_result_count' => count($apiResult),
        'api_query_result' => array_slice($apiResult, 0, 3)
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$conn->close();
?>
