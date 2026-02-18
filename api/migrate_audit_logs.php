<?php
/**
 * Migration: Add admin_id column to audit_logs table
 * Run this once to update the existing audit_logs table
 */

require_once '../db_config.php';

try {
    // Check if admin_id column already exists
    $checkQuery = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'admin_id' AND TABLE_SCHEMA = DATABASE()";
    
    $result = $conn->query($checkQuery);
    
    if ($result->num_rows === 0) {
        // Column doesn't exist, add it
        $alterQuery = "ALTER TABLE audit_logs 
                       ADD COLUMN admin_id INT AFTER user_id,
                       ADD FOREIGN KEY (admin_id) REFERENCES admins(admin_id)";
        
        if ($conn->query($alterQuery)) {
            echo json_encode([
                'success' => true,
                'message' => 'Migration completed: admin_id column added to audit_logs table'
            ]);
        } else {
            throw new Exception('Failed to alter table: ' . $conn->error);
        }
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Migration skipped: admin_id column already exists'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Migration failed: ' . $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>
