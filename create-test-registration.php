<?php
require 'db_config.php';

echo "=== Creating Test Registration ===\n\n";

// First, check if test user exists
$user_email = 'testcheckin@example.com';
$user_name = 'Test Participant ' . date('His');

echo "Creating test user: " . $user_name . "\n";

// Get PARTICIPANT role ID
$role_query = "SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT'";
$role_result = $conn->query($role_query);
$role_row = $role_result->fetch_assoc();
$role_id = $role_row['role_id'] ?? 3;

// Check if user exists
$check_user = "SELECT user_id FROM users WHERE email = ?";
$stmt = $conn->prepare($check_user);
$stmt->bind_param('s', $user_email);
$stmt->execute();
$user_result = $stmt->get_result();

if ($user_result->num_rows > 0) {
    $user_row = $user_result->fetch_assoc();
    $user_id = $user_row['user_id'];
    echo "✓ Using existing user ID: " . $user_id . "\n";
} else {
    // Create new user
    echo "Creating new user in database... ";
    $temp_password = bin2hex(random_bytes(8));
    $hashed_password = hash('sha256', $temp_password);
    
    $insert_user = "INSERT INTO users (full_name, email, password_hash, role_id, company, job_title, employee_code, phone, created_at) 
                   VALUES (?, ?, ?, ?, 'Test Company', 'Test Job', 'TEST-001', '09123456789', NOW())";
    
    $user_stmt = $conn->prepare($insert_user);
    $user_stmt->bind_param('sssi', $user_name, $user_email, $hashed_password, $role_id);
    
    if ($user_stmt->execute()) {
        $user_id = $conn->insert_id;
        echo "✓ Created user ID: " . $user_id . "\n";
    } else {
        echo "❌ Failed: " . $user_stmt->error . "\n";
        exit;
    }
}

// Get qwerty event ID
$event_query = "SELECT event_id FROM events WHERE event_name = 'qwerty'";
$event_result = $conn->query($event_query);
$event_row = $event_result->fetch_assoc();
$event_id = $event_row['event_id'] ?? 9;

echo "Event ID: " . $event_id . "\n";

// Check if registration exists for this user
$reg_check = "SELECT registration_id FROM registrations WHERE user_id = ? AND event_id = ?";
$reg_stmt = $conn->prepare($reg_check);
$reg_stmt->bind_param('ii', $user_id, $event_id);
$reg_stmt->execute();
$reg_result = $reg_stmt->get_result();

if ($reg_result->num_rows > 0) {
    $reg_row = $reg_result->fetch_assoc();
    echo "✓ Using existing registration ID: " . $reg_row['registration_id'] . "\n";
    
    // Get the registration code
    $get_code = "SELECT registration_code FROM registrations WHERE registration_id = ?";
    $code_stmt = $conn->prepare($get_code);
    $code_stmt->bind_param('i', $reg_row['registration_id']);
    $code_stmt->execute();
    $code_result = $code_stmt->get_result();
    $code_row = $code_result->fetch_assoc();
    $reg_code = $code_row['registration_code'];
    
} else {
    // Create new registration with REGISTERED status (not ATTENDED)
    echo "Creating new registration... ";
    $reg_code = 'REG-' . strtoupper(bin2hex(random_bytes(6)));
    
    $insert_reg = "INSERT INTO registrations (user_id, event_id, registration_code, status, registered_at) 
                  VALUES (?, ?, ?, 'REGISTERED', NOW())";
    
    $reg_insert_stmt = $conn->prepare($insert_reg);
    $reg_insert_stmt->bind_param('iis', $user_id, $event_id, $reg_code);
    
    if ($reg_insert_stmt->execute()) {
        $reg_id = $conn->insert_id;
        echo "✓ Created registration ID: " . $reg_id . "\n";
    } else {
        echo "❌ Failed: " . $reg_insert_stmt->error . "\n";
        exit;
    }
}

echo "\n=== Test Registration Ready ===\n";
echo "Name: " . $user_name . "\n";
echo "Email: " . $user_email . "\n";
echo "Event: qwerty\n";
echo "Registration Code: " . $reg_code . "\n";
echo "Current Status: REGISTERED\n";
echo "\n📱 Scan this QR code:\n";
echo "   " . $reg_code . "\n";

?>
