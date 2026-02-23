<?php
require 'db_config.php';

// Check if coordinator exists
$checkQuery = "SELECT user_id FROM users WHERE email = 'coordinator@test.com' AND role_name = 'COORDINATOR'";
$result = $conn->query($checkQuery);

if ($result && $result->num_rows > 0) {
    echo json_encode([
        'success' => true,
        'message' => 'Test coordinator already exists'
    ]);
} else {
    // Create test coordinator
    $email = 'coordinator@test.com';
    $password_hash = password_hash('password', PASSWORD_BCRYPT);
    $full_name = 'Test Coordinator';
    $role_name = 'COORDINATOR';
    $coordinator_id = 1;
    
    $insertQuery = "INSERT INTO users (email, password_hash, full_name, role_name, coordinator_id, status, created_at) 
                    VALUES (?, ?, ?, ?, ?, 'active', NOW())";
    
    $stmt = $conn->prepare($insertQuery);
    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => 'Prepare error: ' . $conn->error
        ]);
    } else {
        $stmt->bind_param('ssssi', $email, $password_hash, $full_name, $role_name, $coordinator_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Test coordinator created',
                'email' => $email,
                'password' => 'password'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error: ' . $conn->error
            ]);
        }
    }
}

$conn->close();
?>
