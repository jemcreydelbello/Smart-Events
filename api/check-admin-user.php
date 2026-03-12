<?php
require_once '../config/db.php';

echo "=== Checking Admin/User Structure ===\n\n";

// Check admins table
echo "📋 ADMINS TABLE:\n";
$adminsResult = $conn->query("SELECT admin_id, email FROM admins WHERE admin_id = 4");
if ($adminsResult && $adminsResult->num_rows > 0) {
    $admin = $adminsResult->fetch_assoc();
    echo "Admin ID: {$admin['admin_id']}, Email: {$admin['email']}\n";
}

// Check users table columns
echo "\n📋 USERS TABLE STRUCTURE:\n";
$columnsResult = $conn->query("DESCRIBE users");
if ($columnsResult && $columnsResult->num_rows > 0) {
    while ($col = $columnsResult->fetch_assoc()) {
        echo "  Column: {$col['Field']} ({$col['Type']})\n";
    }
}

// Get all users
echo "\n📋 USERS TABLE DATA:\n";
$usersResult = $conn->query("SELECT * FROM users");
if ($usersResult && $usersResult->num_rows > 0) {
    echo "All users:\n";
    while ($user = $usersResult->fetch_assoc()) {
        echo "  User ID: {$user['user_id']}, Email: {$user['email']}\n";
    }
} else {
    echo "No users found!\n";
}

// Check activity_logs
echo "\n📋 RECENT ACTIVITY LOGS:\n";
$logsResult = $conn->query("SELECT log_id, user_id, action_type, entity_id, description FROM activity_logs ORDER BY log_id DESC LIMIT 5");
if ($logsResult && $logsResult->num_rows > 0) {
    while ($log = $logsResult->fetch_assoc()) {
        echo "Log ID: {$log['log_id']}, User ID: {$log['user_id']}, Action: {$log['action_type']}, Description: {$log['description']}\n";
    }
}

// Check if admin_id 4 should map to any user_id
echo "\n🔍 CHECKING MAPPING:\n";
$adminUser = $conn->query("SELECT * FROM admins WHERE admin_id = 4");
if ($adminUser && $adminUser->num_rows > 0) {
    $admin = $adminUser->fetch_assoc();
    echo "Admin found - need to find or create corresponding user\n";
    echo "Admin data: " . json_encode($admin) . "\n";
}

// Check if there's a connection table or if admins should be in users too
$tables = $conn->query("SHOW TABLES");
echo "\n📊 ALL TABLES:\n";
while ($row = $tables->fetch_array()) {
    echo "  - {$row[0]}\n";
}

?>
