<?php
require 'config/db.php';

echo "=== Database Connection Test ===\n";

if (!$conn) {
    echo "❌ Connection failed: No connection object\n";
    exit(1);
}

if ($conn->connect_error) {
    echo "❌ Connection error: " . $conn->connect_error . "\n";
    exit(1);
}

echo "✓ Database connected\n\n";

// Check users table
$result = $conn->query("SELECT COUNT(*) as total FROM users");
if ($result) {
    $row = $result->fetch_assoc();
    echo "👥 Total users in database: " . $row['total'] . "\n";
} else {
    echo "❌ Users query failed: " . $conn->error . "\n";
}

// Check registrations table
$result = $conn->query("SELECT COUNT(*) as total FROM registrations");
if ($result) {
    $row = $result->fetch_assoc();
    echo "📋 Total registrations in database: " . $row['total'] . "\n";
} else {
    echo "❌ Registrations query failed: " . $conn->error . "\n";
}

// Show recent users (last 5)
echo "\n=== Recent Users (Last 5) ===\n";
$result = $conn->query("SELECT user_id, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC LIMIT 5");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        echo "- User {$row['user_id']}: {$row['first_name']} {$row['last_name']} ({$row['email']}) - {$row['created_at']}\n";
    }
} else {
    echo "❌ Query failed: " . $conn->error . "\n";
}

// Show recent registrations (last 5)
echo "\n=== Recent Registrations (Last 5) ===\n";
$result = $conn->query("SELECT registration_id, user_id, event_id, registration_code, status, registered_at FROM registrations ORDER BY registered_at DESC LIMIT 5");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        echo "- Reg {$row['registration_id']}: User {$row['user_id']}, Event {$row['event_id']}, Code {$row['registration_code']}, Status {$row['status']} - {$row['registered_at']}\n";
    }
} else {
    echo "❌ Query failed: " . $conn->error . "\n";
}

echo "\n✓ Test complete\n";
