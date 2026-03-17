<?php
require_once '../config/db.php';

// Delete the empty event 116
$event_id = 116;
$delete_query = "DELETE FROM events WHERE event_id = ?";
$stmt = $conn->prepare($delete_query);
$stmt->bind_param('i', $event_id);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Empty event 116 deleted',
        'affected_rows' => $stmt->affected_rows
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete: ' . $stmt->error
    ]);
}
?>
