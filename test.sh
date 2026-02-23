#!/bin/bash
cd /c/xampp/htdocs/Smart-Events
echo "=== Testing PHP database operations ==="
php << 'EOFPHP'
<?php
require_once 'db_config.php';

// Get table structure
echo "TABLE STRUCTURE:\n";
$result = $conn->query("SHOW COLUMNS FROM coordinators");
if (!$result) {
    echo "ERROR: " . $conn->error . "\n";
} else {
    while ($row = $result->fetch_assoc()) {
        echo "  - " . json_encode($row) . "\n";
    }
}

// Try to insert
echo "\nTRYING INSERT:\n";
$test_name = "Test" . time();
$test_email = "test" . time() . "@example.com";
$test_contact = "9876543210";

$query = "INSERT INTO coordinators (coordinator_name, email, contact_number) VALUES (?, ?, ?)";
$stmt = $conn->prepare($query);

if (!$stmt) {
    echo "Prepare error: " . $conn->error . "\n";
} else {
    echo "Prepare: OK\n";
    $stmt->bind_param('sss', $test_name, $test_email, $test_contact);
    echo "Bind: OK\n";
    
    if (!$stmt->execute()) {
        echo "Execute error: " . $stmt->error . "\n";
    } else {
        echo "Execute: OK\n";
        echo "Insert ID: " . $conn->insert_id . "\n";
    }
    $stmt->close();
}

$conn->close();
?>
EOFPHP
