<?php
// Add event_id column to coordinators table
require_once 'db_config.php';

try {
    // Check if column already exists
    $checkQuery = "SHOW COLUMNS FROM coordinators LIKE 'event_id'";
    $result = $conn->query($checkQuery);
    
    if ($result && $result->num_rows === 0) {
        // Column doesn't exist, add it
        $alterQuery = "ALTER TABLE coordinators ADD COLUMN event_id INT NULL, ADD FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE SET NULL";
        
        if ($conn->query($alterQuery)) {
            echo json_encode([
                'success' => true,
                'message' => 'Successfully added event_id column to coordinators table'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error adding column: ' . $conn->error
            ]);
        }
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'event_id column already exists'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
