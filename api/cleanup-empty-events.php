<?php
// Delete empty events 117, 118, 119
require_once '../config/db.php';

$event_ids = [117, 118, 119];

foreach ($event_ids as $event_id) {
    $query = "DELETE FROM events WHERE event_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $event_id);
    $result = $stmt->execute();
    error_log("Deleted event $event_id: " . ($result ? 'SUCCESS' : 'FAILED'));
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Deleted events 117, 118, 119']);
?>