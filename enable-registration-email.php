<?php
require_once 'config/db.php';

// Enable user registration emails
$update = $conn->query("UPDATE email_config SET email_on_user_create = 1 WHERE id = 1");

if ($update) {
    echo "✅ User registration emails ENABLED\n\n";
} else {
    echo "❌ Failed to update: " . $conn->error . "\n";
}

// Show current config
$result = $conn->query("SELECT id, from_email, from_name, smtp_host, email_on_user_create, email_on_event_create, email_reminders FROM email_config WHERE id = 1");

if ($result && $result->num_rows > 0) {
    $config = $result->fetch_assoc();
    echo "Current Email Configuration:\n";
    echo "───────────────────────────\n";
    echo "From Email: " . $config['from_email'] . "\n";
    echo "From Name: " . $config['from_name'] . "\n";
    echo "SMTP Host: " . $config['smtp_host'] . "\n";
    echo "───────────────────────────\n";
    echo "User Registration Email: " . ($config['email_on_user_create'] ? '✅ ENABLED' : '❌ DISABLED') . "\n";
    echo "Event Creation Email: " . ($config['email_on_event_create'] ? '✅ ENABLED' : '❌ DISABLED') . "\n";
    echo "Event Reminder Email: " . ($config['email_reminders'] ? '✅ ENABLED' : '❌ DISABLED') . "\n";
}

$conn->close();
?>
