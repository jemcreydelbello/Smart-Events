<?php
require_once '../config/db.php';

echo "=== Updating User 12 Name ===\n\n";

$result = $conn->query("UPDATE users SET last_name = '' WHERE user_id = 12");
if ($result) {
    echo "✅ Updated user 12 last_name to empty\n";
} else {
    echo "❌ Update failed: " . $conn->error . "\n";
}

// Verify
$verify = $conn->query("SELECT user_id, first_name, last_name FROM users WHERE user_id = 12");
if ($verify && $verify->num_rows > 0) {
    $user = $verify->fetch_assoc();
    echo "\n📋 Updated User Details:\n";
    echo "   User ID: {$user['user_id']}\n";
    echo "   Name: {$user['first_name']} {$user['last_name']}\n";
}

?>
