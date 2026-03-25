<?php
require 'config/db.php';

echo "=== Checking for NEW Registrations ===\n";
echo "Time check: Current PHP time is: " . date('Y-m-d H:i:s') . "\n\n";

// Get the most recent registration overall
$result = $conn->query("
    SELECT 
        r.registration_id,
        u.first_name,
        u.last_name,
        u.email,
        r.event_id,
        r.status,
        r.is_walkIn,
        r.registered_at
    FROM registrations r
    JOIN users u ON r.user_id = u.user_id
    ORDER BY r.registered_at DESC
    LIMIT 1
");

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "Most recent registration:\n";
    echo "- Name: {$row['first_name']} {$row['last_name']}\n";
    echo "- Email: {$row['email']}\n";
    echo "- Event ID: {$row['event_id']}\n";
    echo "- Status: {$row['status']}\n";
    echo "- Walk-In: {$row['is_walkIn']}\n";
    echo "- Added: {$row['registered_at']}\n";
} else {
    echo "No registrations found!\n";
}

// Check all registrations
$result = $conn->query("SELECT COUNT(*) as total FROM registrations");
$row = $result->fetch_assoc();
echo "\nTotal registrations in database: " . $row['total'] . "\n";

// Check all users
$result = $conn->query("SELECT COUNT(*) as total FROM users");
$row = $result->fetch_assoc();
echo "Total users in database: " . $row['total'] . "\n";

// Check if there are any errors in the error log
echo "\n=== Checking for PHP errors ===\n";
$log_file = "../php/logs/php_error_log";
if (file_exists($log_file)) {
    echo "Error log exists at: $log_file\n";
    $recent_errors = shell_exec("tail -20 $log_file 2>&1");
    if ($recent_errors) {
        echo "Recent errors:\n" . $recent_errors;
    } else {
        echo "No recent errors\n";
    }
} else {
    echo "No error log found at: $log_file\n";
}
?>
