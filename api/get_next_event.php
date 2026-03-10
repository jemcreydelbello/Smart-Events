<?php
// Get the next upcoming event
error_reporting(E_ALL);
ini_set('display_errors', 0);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

header('Content-Type: application/json');

require_once '../config/db.php';

try {
    // Get the next upcoming event - only events that haven't started yet and are not private
    $now = date('Y-m-d H:i:s');
 
    $query = "SELECT 
                  e.event_id,
                  e.event_name,
                  DATE(e.start_event) as event_date,
                  TIME(e.start_event) as start_time,
                  TIME(e.end_event) as end_time,
                  e.location,
                  e.description,
                  e.capacity,
                  e.is_private,
                  COALESCE(COUNT(r.registration_id), 0) as current_registrations,
                  CASE WHEN COALESCE(COUNT(r.registration_id), 0) >= e.capacity THEN 1 ELSE 0 END as is_registration_closed
              FROM events e
              LEFT JOIN registrations r ON e.event_id = r.event_id
              WHERE e.start_event > NOW()
              AND e.is_private = 0
              GROUP BY e.event_id
              ORDER BY e.start_event ASC
              LIMIT 1";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    

    if (!$stmt->execute()) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $event = $result->fetch_assoc();
        
        // Normalize data types
        $event['event_id'] = intval($event['event_id']);
        $event['capacity'] = intval($event['capacity']);
        $event['current_registrations'] = intval($event['current_registrations']);
        $event['is_registration_closed'] = intval($event['is_registration_closed']);
        $event['is_private'] = intval($event['is_private']);
        
        echo json_encode([
            'success' => true,
            'event' => $event
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No upcoming events found',
            'event' => null
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching event: ' . $e->getMessage()
    ]);
}
?>
