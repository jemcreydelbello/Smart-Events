<?php
/**
 * Migration: Add Address field to coordinators table
 * Date: 2026-03-23
 * Purpose: Add address field to match admins table structure
 */

header('Content-Type: application/json');

try {
    require_once dirname(__DIR__) . '/config/db.php';
    
    if (!isset($conn) || !$conn) {
        throw new Exception('Database connection not available');
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    // Check if address column exists
    $check_query = "SHOW COLUMNS FROM coordinators LIKE 'address'";
    $result = $conn->query($check_query);
    
    if ($result && $result->num_rows === 0) {
        // Column doesn't exist, add it
        $add_query = "ALTER TABLE coordinators ADD COLUMN address TEXT DEFAULT NULL COMMENT 'Physical address' AFTER company";
        
        if (!$conn->query($add_query)) {
            throw new Exception("Failed to add address column: " . $conn->error);
        }
        
        $conn->commit();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Migration completed successfully',
            'column_added' => 'address',
            'details' => 'address column added to coordinators table'
        ]);
    } else {
        // Already exists
        $conn->commit();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Migration skipped',
            'reason' => 'address column already exists',
            'details' => 'No changes needed'
        ]);
    }
    
} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Migration failed: ' . $e->getMessage(),
        'error' => $e->getMessage()
    ]);
}

exit;
?>
