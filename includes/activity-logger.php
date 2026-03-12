<?php
// Helper function to log user activities
function logActivity($user_id, $action_type, $entity_type = null, $entity_id = null, $description = null) {
    global $conn;
    
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    
    $query = "INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, description, ip_address, user_agent, timestamp)
              VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        error_log('Activity log prepare failed: ' . $conn->error);
        return false;
    }
    
        $stmt->bind_param('ississs', $user_id, $action_type, $entity_type, $entity_id, $description, $ip_address, $user_agent);
    
    try {
        if (!$stmt->execute()) {
            error_log('Activity log insert failed: ' . $stmt->error);
            return false;
        }
    } catch (Throwable $e) {
        // Handle all exceptions including mysqli_sql_exception
        error_log('Activity log execution exception: ' . $e->getMessage());
        // Try again with NULL user_id if FK constraint failed (user doesn't exist)
        if (strpos($e->getMessage(), 'FOREIGN KEY') !== false || strpos($e->getMessage(), 'foreign key constraint fails') !== false) {
            error_log('FK constraint failed for user_id: ' . $user_id . ', retrying with NULL');
            $stmt2 = $conn->prepare($query);
            if ($stmt2) {
                $null_user_id = null;
                $stmt2->bind_param('ississs', $null_user_id, $action_type, $entity_type, $entity_id, $description, $ip_address, $user_agent);
                if ($stmt2->execute()) {
                    return $conn->insert_id;
                }
            }
        }
        return false;
    }
    
    return $conn->insert_id;
}

// Function to check if activity_logs table exists and create if needed
function ensureActivityLogsTable() {
    global $conn;
    
    // Check if table exists
    $result = $conn->query("SHOW TABLES LIKE 'activity_logs'");
    
    if ($result && $result->num_rows === 0) {
        // Table doesn't exist, create it
        $create_query = "
        CREATE TABLE IF NOT EXISTS activity_logs (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            action_type VARCHAR(100) NOT NULL,
            entity_type VARCHAR(100),
            entity_id INT,
            description TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_action_type (action_type),
            INDEX idx_timestamp (timestamp),
            INDEX idx_entity (entity_type, entity_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        ";
        
        if (!$conn->query($create_query)) {
            error_log('Failed to create activity_logs table: ' . $conn->error);
            return false;
        }
        
        return true;
    }
    
    return true;
}
?>
