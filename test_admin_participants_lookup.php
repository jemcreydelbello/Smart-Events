<?php
require_once 'db_config.php';

echo "=== TESTING SPECIFIC EVENT PARTICIPANTS LOOKUP ===\n\n";

// Simulate what the admin event-details page does
echo "TEST 1: Admin queries participants for Event 9 (qwerty)\n";
echo "======================================================\n";

$event_id = 9;

// This is what the API does when called with event_id=9
$query = "SELECT DISTINCT u.user_id, u.full_name, u.email, u.department_id, 
          IFNULL(u.company, '') as company, 
          IFNULL(u.job_title, '') as job_title, 
          IFNULL(u.phone, '') as phone,
          IFNULL(u.employee_code, '') as employee_code,
          e.event_id, e.event_name, e.is_private, r.registration_id, r.registration_code, r.status, r.registered_at
          FROM registrations r
          JOIN users u ON r.user_id = u.user_id
          JOIN events e ON r.event_id = e.event_id
          WHERE e.event_id = ?";

$stmt = $conn->prepare($query);
if (!$stmt) {
    echo "❌ Prepare failed: " . $conn->error . "\n";
    exit;
}

$stmt->bind_param('i', $event_id);
if (!$stmt->execute()) {
    echo "❌ Execute failed: " . $stmt->error . "\n";
    exit;
}

$result = $stmt->get_result();
echo "Results from database query: " . $result->num_rows . " rows\n\n";

if ($result->num_rows > 0) {
    echo "✅ Found participants:\n";
    while ($row = $result->fetch_assoc()) {
        echo "  - {$row['full_name']} ({$row['email']}) - Status: {$row['status']}\n";
    }
} else {
    echo "❌ No participants found for event 9!\n";
}

echo "\n\n";

// Test 2: Check what happens with all events
echo "TEST 2: Check ALL events for their registrations\n";
echo "==================================================\n";

$all_events = $conn->query("SELECT event_id, event_name FROM events ORDER BY event_id");

if ($all_events && $all_events->num_rows > 0) {
    while ($event = $all_events->fetch_assoc()) {
        $eid = $event['event_id'];
        $ename = $event['event_name'];
        
        $test_query = "SELECT COUNT(*) as count
                       FROM registrations r
                       JOIN users u ON r.user_id = u.user_id
                       JOIN events e ON r.event_id = e.event_id
                       WHERE e.event_id = ?";
        
        $test_stmt = $conn->prepare($test_query);
        $test_stmt->bind_param('i', $eid);
        $test_stmt->execute();
        $test_result = $test_stmt->get_result();
        $test_row = $test_result->fetch_assoc();
        
        $count = $test_row['count'];
        if ($count > 0) {
            echo "✅ Event $eid ('{$ename}'): $count participants\n";
        } else {
            echo "❌ Event $eid ('{$ename}'): 0 participants\n";
        }
    }
} else {
    echo "No events found\n";
}

echo "\n\n";

// Test 3: Check if there are permission/role issues
echo "TEST 3: Check registrations without JOIN (raw data)\n";
echo "===================================================\n";

$raw_regs = $conn->query("
    SELECT r.registration_id, r.user_id, r.event_id, r.status, 
           u.full_name, e.event_name
    FROM registrations r
    LEFT JOIN users u ON r.user_id = u.user_id
    LEFT JOIN events e ON r.event_id = e.event_id
    ORDER BY r.registered_at DESC
");

if ($raw_regs && $raw_regs->num_rows > 0) {
    echo "Raw registrations in database:\n";
    while ($reg = $raw_regs->fetch_assoc()) {
        echo "  - Registration {$reg['registration_id']}: User ID {$reg['user_id']} ({$reg['full_name']}) → Event ID {$reg['event_id']} ({$reg['event_name']}) - Status: {$reg['status']}\n";
    }
} else {
    echo "No registrations found\n";
}

echo "\n\n";

// Test 4: Check admin credentials and event access
echo "TEST 4: Verify table structure\n";
echo("==============================\n");

// Show columns in registrations table
$cols = $conn->query("DESCRIBE registrations");
if ($cols && $cols->num_rows > 0) {
    echo "Registrations table structure:\n";
    while ($col = $cols->fetch_assoc()) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
}

$conn->close();

echo "\n=== TEST COMPLETE ===\n";
?>
