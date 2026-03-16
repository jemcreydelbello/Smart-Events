<?php
// Migration: Add budget column to events table
// Run this once to update the schema

header('Content-Type: application/json');

require_once '../config/db.php';

try {
    // Check if budget column already exists
    $check_query = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='events' AND COLUMN_NAME='budget'";
    $result = $conn->query($check_query);
    
    if ($result && $result->num_rows === 0) {
        // Add budget column if it doesn't exist
        $alter_query = "ALTER TABLE events ADD COLUMN budget DECIMAL(12, 2) DEFAULT 0.00 AFTER coordinator_id";
        
        if ($conn->query($alter_query)) {
            echo json_encode([
                'success' => true,
                'message' => 'Budget column added successfully to events table'
            ]);
        } else {
            throw new Exception($conn->error);
        }
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Budget column already exists'
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Migration error: ' . $e->getMessage()
    ]);
}
?>
