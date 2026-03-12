<?php
require_once '../config/db.php';

echo "=== Creating User for Admin 10 ===\n\n";

// Check if user with admin 10's email already exists
$check = $conn->query("SELECT user_id FROM users WHERE email = 'delapenaedrian555@gmail.com111'");
if ($check && $check->num_rows > 0) {
    echo "User already exists for this email\n";
    exit;
}

// Create user account for admin 10
$email = 'delapenaedrian555@gmail.com111';
$firstName = 'csdf';
$lastName = 'Admin';
$departmentId = NULL;

$insertQuery = "INSERT INTO users (first_name, last_name, email, department_id, created_at) 
                VALUES (?, ?, ?, ?, NOW())";

$stmt = $conn->prepare($insertQuery);
if (!$stmt) {
    echo "❌ Prepare failed: " . $conn->error . "\n";
    exit;
}

$stmt->bind_param('sssi', $firstName, $lastName, $email, $departmentId);

if ($stmt->execute()) {
    $newUserId = $conn->insert_id;
    echo "✅ User created successfully!\n";
    echo "   New User ID: $newUserId\n";
    echo "   Email: $email\n";
    echo "   Name: $firstName $lastName\n";
    
    // Verify
    $verify = $conn->query("SELECT user_id, email, first_name, last_name FROM users WHERE user_id = $newUserId");
    if ($verify && $verify->num_rows > 0) {
        $user = $verify->fetch_assoc();
        echo "\n✅ Verification:\n";
        echo "   User ID: {$user['user_id']}\n";
        echo "   Email: {$user['email']}\n";
        echo "   Name: {$user['first_name']} {$user['last_name']}\n";
    }
} else {
    echo "❌ Insert failed: " . $stmt->error . "\n";
}

$stmt->close();

?>
