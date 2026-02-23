<?php
/**
 * Database Migration: Add company, job_title, and coordinator_image to coordinators table
 * Run this script once to add the new columns
 */

require_once 'db_config.php';

try {
    // Check if columns already exist
    $check_query = "SHOW COLUMNS FROM coordinators LIKE 'company'";
    $result = $conn->query($check_query);
    
    if ($result && $result->num_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Columns already exist. Migration skipped.'
        ]);
        exit;
    }
    
    // Add the new columns
    $migration_sql = "
        ALTER TABLE coordinators
        ADD COLUMN company VARCHAR(150) NULL DEFAULT NULL AFTER contact_number,
        ADD COLUMN job_title VARCHAR(150) NULL DEFAULT NULL AFTER company,
        ADD COLUMN coordinator_image VARCHAR(255) NULL DEFAULT NULL AFTER job_title;
    ";
    
    if ($conn->query($migration_sql)) {
        // Add indexes for better query performance
        $conn->query("CREATE INDEX idx_coordinator_company ON coordinators(company)");
        $conn->query("CREATE INDEX idx_coordinator_job_title ON coordinators(job_title)");
        
        echo json_encode([
            'success' => true,
            'message' => 'Migration completed successfully! Added company, job_title, and coordinator_image columns to coordinators table.'
        ]);
    } else {
        throw new Exception('Migration failed: ' . $conn->error);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
