<?php
require 'config/db.php';

echo "=== Testing Add Attendee via API ===\n\n";

// Simulate what the Add Attendee modal sends
$test_data = [
    'event_id' => 46,
    'first_name' => 'Test',
    'middle_name' => '',
    'last_name' => 'Attendee',
    'participant_email' => 'test-' . time() . '@example.com',
    'company' => 'Test Company',
    'job_title' => 'Test Job',
    'participant_phone' => '1234567890',
    'status' => 'REGISTERED',
    'is_walkIn' => 0
];

echo "Test data to insert:\n";
echo json_encode($test_data, JSON_PRETTY_PRINT) . "\n\n";

// Verify event exists
$event_id = $test_data['event_id'];
$check = $conn->query("SELECT event_id, event_name FROM events WHERE event_id = $event_id");
if ($check && $check->num_rows > 0) {
    $event = $check->fetch_assoc();
    echo "✓ Event exists: {$event['event_name']} (ID: {$event['event_id']})\n\n";
} else {
    echo "✗ Event NOT found (ID: $event_id)\n";
    exit(1);
}

// Step 1: Check if user exists
$email = $test_data['participant_email'];
echo "Step 1: Checking if user exists with email: $email\n";
$user_check = $conn->query("SELECT user_id FROM users WHERE email = '$email'");
if ($user_check && $user_check->num_rows > 0) {
    $user_row = $user_check->fetch_assoc();
    $user_id = $user_row['user_id'];
    echo "  ✓ User already exists: ID $user_id\n";
} else {
    echo "  ✗ User does NOT exist, creating new user...\n";
    
    // Insert new user
    $first = $test_data['first_name'];
    $middle = $test_data['middle_name'];
    $last = $test_data['last_name'];
    $company = $test_data['company'];
    $job = $test_data['job_title'];
    $phone = $test_data['participant_phone'];
    
    $insert = "INSERT INTO users (first_name, middle_name, last_name, email, company, job_title, contact_number) 
               VALUES ('$first', '$middle', '$last', '$email', '$company', '$job', '$phone')";
    
    if ($conn->query($insert)) {
        $user_id = $conn->insert_id;
        echo "  ✓ User created: ID $user_id\n";
    } else {
        echo "  ✗ User creation FAILED: " . $conn->error . "\n";
        exit(1);
    }
}

// Step 2: Check if already registered for this event
echo "\nStep 2: Checking if user already registered for this event...\n";
$reg_check = $conn->query("SELECT registration_id FROM registrations WHERE user_id = $user_id AND event_id = $event_id");
if ($reg_check && $reg_check->num_rows > 0) {
    $reg = $reg_check->fetch_assoc();
    echo "  ✗ Already registered: Registration ID {$reg['registration_id']}\n";
    exit(1);
} else {
    echo "  ✓ Not yet registered, proceeding...\n";
}

// Step 3: Create registration
echo "\nStep 3: Creating registration...\n";
$code = 'REG-' . strtoupper(bin2hex(random_bytes(6)));
$status = $test_data['status'];
$is_walkin = $test_data['is_walkIn'];

$reg_insert = "INSERT INTO registrations (user_id, event_id, registration_code, status, is_walkIn, registered_at) 
               VALUES ($user_id, $event_id, '$code', '$status', $is_walkin, NOW())";

if ($conn->query($reg_insert)) {
    $reg_id = $conn->insert_id;
    echo "  ✓ Registration created: ID $reg_id\n";
    echo "  ✓ Registration code: $code\n";
    echo "  ✓ Status: $status\n";
} else {
    echo "  ✗ Registration creation FAILED: " . $conn->error . "\n";
    exit(1);
}

// Step 4: Verify the data was saved
echo "\nStep 4: Verifying data was saved...\n";
$verify = $conn->query("
    SELECT r.registration_id, u.first_name, u.last_name, r.status, r.registered_at
    FROM registrations r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.registration_id = $reg_id
");

if ($verify && $verify->num_rows > 0) {
    $row = $verify->fetch_assoc();
    echo "  ✓ Data verified:\n";
    echo "    - Name: {$row['first_name']} {$row['last_name']}\n";
    echo "    - Status: {$row['status']}\n";
    echo "    - Created: {$row['registered_at']}\n";
    echo "\n✓✓✓ SUCCESS: Attendee saved to database! ✓✓✓\n";
} else {
    echo "  ✗ Verification FAILED: Could not find just-created registration\n";
}
?>
