<?php
require_once '../config/db.php';

echo "=== Users in Database ===\n";
$result = $conn->query('SELECT user_id, username, email FROM users ORDER BY user_id');
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "User ID: {$row['user_id']}, Username: {$row['username']}, Email: {$row['email']}\n";
    }
} else {
    echo "No users found\n";
}

echo "\n=== Recent Errors ===\n";
$errorLog = error_get_last();
if ($errorLog) {
    echo "Last error: " . json_encode($errorLog) . "\n";
} else {
    echo "No errors\n";
}

echo "\n=== Check if user 4 is admin/coordinator ===\n";
$checkAdmin = $conn->query("SELECT user_id, email FROM admins WHERE admin_id = 4");
$checkCoord = $conn->query("SELECT coordinator_id, coordinator_email FROM coordinators WHERE coordinator_id = 4");

if ($checkAdmin && $checkAdmin->num_rows > 0) {
    echo "User 4 is an admin\n";
}
if ($checkCoord && $checkCoord->num_rows > 0) {
    echo "User 4 is a coordinator\n";
}
?>
