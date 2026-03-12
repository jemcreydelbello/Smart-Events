<?php
/**
 * Test Activity Logging for Events
 * 
 * This script tests that:
 * 1. Event creation logs are created
 * 2. Activity logs table exists
 * 3. bind_param is correct
 */

require_once '../config/db.php';

echo "=== Activity Logging Test ===\n\n";

// 1. Check if activity_logs table exists
$check_table = "SHOW TABLES LIKE 'activity_logs'";
$result = $conn->query($check_table);

if ($result && $result->num_rows > 0) {
    echo "✓ activity_logs table exists\n";
} else {
    echo "✗ activity_logs table does NOT exist\n";
    exit;
}

// 2. Check recent activity logs
$check_logs = "SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 5";
$result = $conn->query($check_logs);

echo "\n📋 Recent Activity Logs:\n";
if ($result && $result->num_rows > 0) {
    while ($log = $result->fetch_assoc()) {
        echo "  - {$log['action_type']} {$log['entity_type']} #{$log['entity_id']}: {$log['description']}\n";
        echo "    User: {$log['user_id']}, Time: {$log['timestamp']}\n";
    }
} else {
    echo "  (No logs yet - create/update/delete an event to generate logs)\n";
}

// 3. Test logActivity function
echo "\n🧪 Testing logActivity function...\n";

// Create test log entry
$test_result = logActivity(1, 'TEST', 'EVENT', 0, "Test logging entry");
if ($test_result) {
    echo "✓ Test log entry created successfully\n";
    
    // Verify it was inserted correctly
    $verify = $conn->query("SELECT * FROM activity_logs WHERE action_type = 'TEST' ORDER BY timestamp DESC LIMIT 1");
    if ($verify && $verify->num_rows > 0) {
        $log = $verify->fetch_assoc();
        echo "✓ Test log verified: {$log['description']}\n";
    } else {
        echo "✗ Test log not found in database\n";
    }
} else {
    echo "✗ Failed to create test log\n";
}

echo "\n=== Test Complete ===\n";
echo "\nTo test actual event creation logging:\n";
echo "1. Go to admin dashboard\n";
echo "2. Create a new event\n";
echo "3. Check Activity Logs page - should show 'Created event' entry\n";
echo "4. Update or delete the event - should add respective log entries\n";

?>
