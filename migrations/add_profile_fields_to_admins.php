<?php
/**
 * Migration: Add Company, Contact Number, and Address fields to admins table
 * Date: 2026-03-23
 * Purpose: Add profile fields to store admin company info and contact details
 */

header('Content-Type: application/json');

try {
    require_once dirname(__DIR__) . '/config/db.php';
    
    if (!isset($conn) || !$conn) {
        throw new Exception('Database connection not available');
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    // Check if columns already exist
    $columns_to_add = [
        'company' => "VARCHAR(255) DEFAULT NULL COMMENT 'Company name'",
        'contact_number' => "VARCHAR(20) DEFAULT NULL COMMENT 'Contact phone number'",
        'address' => "TEXT DEFAULT NULL COMMENT 'Physical address'"
    ];
    
    $columns_added = [];
    $columns_skipped = [];
    
    foreach ($columns_to_add as $col_name => $col_def) {
        // Check if column exists
        $check_query = "SHOW COLUMNS FROM admins LIKE '{$col_name}'";
        $result = $conn->query($check_query);
        
        if ($result && $result->num_rows === 0) {
            // Column doesn't exist, add it
            $add_query = "ALTER TABLE admins ADD COLUMN {$col_name} {$col_def}";
            
            if (!$conn->query($add_query)) {
                throw new Exception("Failed to add column {$col_name}: " . $conn->error);
            }
            
            $columns_added[] = $col_name;
        } else {
            $columns_skipped[] = $col_name;
        }
    }
    
    $conn->commit();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Migration completed successfully',
        'columns_added' => $columns_added,
        'columns_skipped' => $columns_skipped,
        'details' => [
            'added' => count($columns_added) . ' column(s) added',
            'skipped' => count($columns_skipped) . ' column(s) already exist'
        ]
    ]);
    
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
