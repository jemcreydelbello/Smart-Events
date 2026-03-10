<?php
header('Content-Type: application/json');

require_once '../config/db.php';

try {
    // Query to get all published catalogue events
    $query = "SELECT 
        catalogue_id as id,
        event_id,
        is_manual,
        event_name,
        event_date,
        location,
        description,
        image_url,
        is_private,
        is_published,
        created_at
    FROM catalogue
    WHERE is_published = 1
    ORDER BY created_at DESC";
    
    $result = $conn->query($query);
    
    if (!$result) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Query failed: ' . $conn->error
        ]);
        exit;
    }
    
    $events = [];
    while ($row = $result->fetch_assoc()) {
        $events[] = $row;
    }
    
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'events' => $events,
        'count' => count($events)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
