<?php
require_once 'db_config.php';

echo "=== DIRECT API REGISTRATION TEST ===\n\n";

// Simulate a registration request
$test_data = [
    'event_id' => 9,
    'participant_name' => 'DEBUG TEST USER',
    'participant_email' => 'debug-test-' . time() . '@example.com',
    'company' => 'Debug Company',
    'job_title' => 'Tester',
    'employee_code' => 'DEBUG-' . time(),
    'participant_phone' => '+1234567890',
    'status' => 'REGISTERED'
];

echo "Test Registration Data:\n";
echo json_encode($test_data, JSON_PRETTY_PRINT) . "\n\n";

// Check if event exists
echo "STEP 1: Check if Event 9 exists\n";
$event_check = $conn->prepare("SELECT event_id, event_name FROM events WHERE event_id = ?");
$event_check->bind_param('i', $test_data['event_id']);
$event_check->execute();
$event_result = $event_check->get_result();

if ($event_result->num_rows > 0) {
    $event = $event_result->fetch_assoc();
    echo "✅ Event found: {$event['event_name']} (ID: {$event['event_id']})\n\n";
} else {
    echo "❌ Event not found!\n\n";
    exit;
}

// Check if user exists with this email
echo "STEP 2: Check if user exists by email\n";
$user_check = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
$user_check->bind_param('s', $test_data['participant_email']);
$user_check->execute();
$user_result = $user_check->get_result();

if ($user_result->num_rows > 0) {
    $user_row = $user_result->fetch_assoc();
    $user_id = $user_row['user_id'];
    echo "✅ User already exists: ID $user_id\n\n";
} else {
    echo "⚠️  User doesn't exist, will need to create\n\n";
    
    echo "STEP 3: Create new user\n";
    
    // Get participant role
    $role_query = "SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT'";
    $role_result = $conn->query($role_query);
    $role_row = $role_result->fetch_assoc();
    $role_id = $role_row['role_id'] ?? 3;
    
    $temp_password = bin2hex(random_bytes(8));
    $hashed_password = hash('sha256', $temp_password);
    
    $insert_user = $conn->prepare(
        "INSERT INTO users (full_name, email, password_hash, role_id, company, job_title, employee_code, phone, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())"
    );
    
    if (!$insert_user) {
        echo "❌ Prepare failed: " . $conn->error . "\n";
        exit;
    }
    
    $insert_user->bind_param(
        'sssiisss',
        $test_data['participant_name'],
        $test_data['participant_email'],
        $hashed_password,
        $role_id,
        $test_data['company'],
        $test_data['job_title'],
        $test_data['employee_code'],
        $test_data['participant_phone']
    );
    
    if (!$insert_user->execute()) {
        echo "❌ User creation failed: " . $insert_user->error . "\n";
        exit;
    }
    
    $user_id = $conn->insert_id;
    echo "✅ User created: ID $user_id\n\n";
}

// Check if already registered for this event
echo "STEP 4: Check if user is already registered for this event\n";
$reg_check = $conn->prepare("SELECT registration_id FROM registrations WHERE user_id = ? AND event_id = ?");
$reg_check->bind_param('ii', $user_id, $test_data['event_id']);
$reg_check->execute();
$existing_reg = $reg_check->get_result();

if ($existing_reg->num_rows > 0) {
    echo "⚠️  User already registered for this event\n\n";
} else {
    echo "✅ User not yet registered, proceeding...\n\n";
    
    echo "STEP 5: Create registration record\n";
    
    $registration_code = 'REG-' . bin2hex(random_bytes(12));
    
    $insert_registration = $conn->prepare(
        "INSERT INTO registrations (user_id, event_id, registration_code, status, registered_at) 
         VALUES (?, ?, ?, ?, NOW())"
    );
    
    if (!$insert_registration) {
        echo "❌ Prepare failed: " . $conn->error . "\n";
        exit;
    }
    
    $insert_registration->bind_param(
        'iiss',
        $user_id,
        $test_data['event_id'],
        $registration_code,
        $test_data['status']
    );
    
    if (!$insert_registration->execute()) {
        echo "❌ Registration creation failed: " . $insert_registration->error . "\n";
        exit;
    }
    
    $registration_id = $conn->insert_id;
    echo "✅ Registration created!\n";
    echo "   - Registration ID: $registration_id\n";
    echo "   - User ID: $user_id\n";
    echo "   - Event ID: {$test_data['event_id']}\n";
    echo "   - Code: $registration_code\n";
    echo "   - Status: {$test_data['status']}\n\n";
}

// Verify registration is in database
echo "STEP 6: Verify registration in database\n";
$verify = $conn->prepare(
    "SELECT r.registration_id, r.user_id, r.event_id, u.full_name, e.event_name, r.status
     FROM registrations r
     JOIN users u ON r.user_id = u.user_id
     JOIN events e ON r.event_id = e.event_id
     WHERE r.user_id = ? AND r.event_id = ?"
);

$verify->bind_param('ii', $user_id, $test_data['event_id']);
$verify->execute();
$verify_result = $verify->get_result();

if ($verify_result->num_rows > 0) {
    $reg = $verify_result->fetch_assoc();
    echo "✅ ✅ REGISTRATION CONFIRMED IN DATABASE ✅ ✅\n";
    echo "   - User: {$reg['full_name']}\n";
    echo "   - Event: {$reg['event_name']}\n";
    echo "   - Status: {$reg['status']}\n";
    echo "   - Registration ID: {$reg['registration_id']}\n";
} else {
    echo "❌ Registration NOT found in database!\n";
}

echo "\n=== TEST COMPLETE ===\n";

$conn->close();
?>
