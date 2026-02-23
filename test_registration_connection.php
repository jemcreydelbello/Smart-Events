<?php
// ============================================================
// TEST REGISTRATION CONNECTION
// ============================================================

require_once 'db_config.php';

echo "=== REGISTRATION CONNECTION TEST ===\n\n";

// Step 1: Check registrations table
echo "Step 1: Checking registrations table structure...\n";
$result = $conn->query("DESCRIBE registrations");
if ($result) {
    echo "✅ Registrations table exists\n";
    echo "   Columns: ";
    $cols = [];
    while ($row = $result->fetch_assoc()) {
        $cols[] = $row['Field'];
    }
    echo implode(", ", $cols) . "\n\n";
} else {
    echo "❌ ERROR: " . $conn->error . "\n\n";
}

// Step 2: Count total registrations
echo "Step 2: Counting total registrations...\n";
$count_result = $conn->query("SELECT COUNT(*) as total FROM registrations");
if ($count_result) {
    $row = $count_result->fetch_assoc();
    echo "✅ Total registrations in database: " . $row['total'] . "\n\n";
} else {
    echo "❌ ERROR: " . $conn->error . "\n\n";
}

// Step 3: Show recent registrations
echo "Step 3: Showing last 5 registrations...\n";
$recent = $conn->query("
    SELECT r.registration_id, r.user_id, u.full_name, u.email, u.company, 
           e.event_id, e.event_name, r.registration_code, r.status, r.registered_at
    FROM registrations r
    JOIN users u ON r.user_id = u.user_id
    JOIN events e ON r.event_id = e.event_id
    ORDER BY r.registered_at DESC
    LIMIT 5
");

if ($recent && $recent->num_rows > 0) {
    echo "✅ Found registrations:\n";
    while ($row = $recent->fetch_assoc()) {
        echo "   - {$row['full_name']} ({$row['email']}) → {$row['event_name']} - Code: {$row['registration_code']}\n";
    }
    echo "\n";
} else {
    echo "❌ No registrations found\n\n";
}

// Step 4: Check if registrations table is linked to events and users
echo "Step 4: Verifying foreign key relationships...\n";
$users_check = $conn->query("SELECT COUNT(*) as count FROM users");
$users_count = $users_check->fetch_assoc()['count'];
echo "   - Users table: $users_count records\n";

$events_check = $conn->query("SELECT COUNT(*) as count FROM events");
$events_count = $events_check->fetch_assoc()['count'];
echo "   - Events table: $events_count records\n\n";

// Step 5: Test CREATE registration via API simulation
echo "Step 5: Testing registration creation...\n";

$test_email = 'test_' . time() . '@example.com';
$test_data = [
    'event_id' => 1,
    'participant_name' => 'Test Participant',
    'participant_email' => $test_email,
    'company' => 'Test Company',
    'job_title' => 'Test Title',
    'employee_code' => 'TEST123',
    'participant_phone' => '+1 555 1234',
    'status' => 'REGISTERED'
];

// Check if event exists
$event_check = $conn->query("SELECT event_id FROM events WHERE event_id = 1");
if (!$event_check || $event_check->num_rows === 0) {
    echo "❌ No events found. Cannot test registration.\n";
    echo "   Please create some events first.\n\n";
} else {
    echo "✅ Event 1 exists\n";
    
    // Try to register
    $role_result = $conn->query("SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT'");
    $role_id = ($role_result && $role_result->num_rows > 0) ? $role_result->fetch_assoc()['role_id'] : 3;
    
    // Create user
    $temp_password_hash = hash('sha256', 'temp_password');
    $insert_user = "INSERT INTO users (full_name, email, password_hash, role_id, company, job_title, employee_code, phone, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $conn->prepare($insert_user);
    $stmt->bind_param('sssiiiss', $test_data['participant_name'], $test_data['participant_email'], 
                      $temp_password_hash, $role_id, $test_data['company'], $test_data['job_title'], 
                      $test_data['employee_code'], $test_data['participant_phone']);
    
    if ($stmt->execute()) {
        $user_id = $stmt->insert_id;
        echo "✅ User created: ID $user_id\n";
        
        // Create registration
        $registration_code = strtoupper(substr(hash('sha256', uniqid()), 0, 8));
        $insert_reg = "INSERT INTO registrations (user_id, event_id, registration_code, status, registered_at) 
                       VALUES (?, ?, ?, ?, NOW())";
        $reg_stmt = $conn->prepare($insert_reg);
        $reg_stmt->bind_param('iiss', $user_id, $test_data['event_id'], $registration_code, $test_data['status']);
        
        if ($reg_stmt->execute()) {
            echo "✅ Registration created: Code $registration_code\n";
            echo "   Test registration successful!\n\n";
        } else {
            echo "❌ Registration creation failed: " . $reg_stmt->error . "\n\n";
        }
    } else {
        echo "❌ User creation failed: " . $stmt->error . "\n\n";
    }
}

// Step 6: Check participants API endpoint
echo "Step 6: Testing /api/participants.php endpoint...\n";
$curl = curl_init('http://localhost/Smart-Events/api/participants.php?action=list&event_id=1');
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
$api_response = curl_exec($curl);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($http_code == 200) {
    $api_data = json_decode($api_response, true);
    if ($api_data['success']) {
        $count = count($api_data['data'] ?? []);
        echo "✅ API working - Found $count registrations for event 1\n\n";
    } else {
        echo "⚠️  API returned error: " . ($api_data['message'] ?? 'Unknown') . "\n\n";
    }
} else {
    echo "❌ API not responding (HTTP $http_code)\n\n";
}

echo "╔════════════════════════════════════════════════════════╗\n";
echo "║     REGISTRATION CONNECTION DIAGNOSTIC COMPLETE        ║\n";
echo "╚════════════════════════════════════════════════════════╝\n";

$conn->close();
?>
