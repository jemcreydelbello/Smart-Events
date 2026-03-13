<?php
/**
 * Migration script to add Entry Type and Month fields to event_timeline table
 * This script adds the new columns if they don't already exist
 */

session_start();

require_once '../includes/db.php';
require_once '../includes/session.php';

header('Content-Type: application/json');

// Check if user is authenticated
$userInfo = getUserInfo();

if (!$userInfo) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Check if user is admin
if ($userInfo['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // Check if entry_type column exists
    $result = $conn->query("SHOW COLUMNS FROM event_timeline LIKE 'entry_type'");
    
    if ($result->num_rows == 0) {
        // Add entry_type column
        $alter1 = "ALTER TABLE event_timeline ADD COLUMN entry_type VARCHAR(50) DEFAULT 'timeline' AFTER event_id";
        if (!$conn->query($alter1)) {
            throw new Exception("Failed to add entry_type column: " . $conn->error);
        }
        echo json_encode(['success' => true, 'message' => 'Added entry_type column']);
    }
    
    // Check if month column exists
    $result = $conn->query("SHOW COLUMNS FROM event_timeline LIKE 'month'");
    
    if ($result->num_rows == 0) {
        // Add month column
        $alter2 = "ALTER TABLE event_timeline ADD COLUMN month VARCHAR(50) AFTER entry_type";
        if (!$conn->query($alter2)) {
            throw new Exception("Failed to add month column: " . $conn->error);
        }
        echo json_encode(['success' => true, 'message' => 'Added month column']);
    }
    
    echo json_encode(['success' => true, 'message' => 'Migration completed successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
