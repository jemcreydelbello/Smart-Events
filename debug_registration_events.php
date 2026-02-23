<?php
require_once 'db_config.php';

echo "=== DETAILED REGISTRATION DEBUG ===\n\n";

// Check what event_ids are in the registrations table
$result = $conn->query("
    SELECT r.registration_id, r.event_id, r.user_id, u.full_name, u.email, 
           r.status, r.registered_at, r.registration_code
    FROM registrations r
    JOIN users u ON r.user_id = u.user_id
    ORDER BY r.registered_at DESC
");

echo "All registrations in database:\n";
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "  - ID: {$row['registration_id']}, Event: {$row['event_id']}, User: {$row['full_name']}, Email: {$row['email']}, Code: {$row['registration_code']}\n";
    }
    echo "\n";
} else {
    echo "No registrations found\n\n";
}

// Check the actual event_ids that exist
echo "Events in database:\n";
$events = $conn->query("SELECT event_id, event_name FROM events");
if ($events && $events->num_rows > 0) {
    while ($row = $events->fetch_assoc()) {
        echo "  - Event ID: {$row['event_id']}, Name: {$row['event_name']}\n";
    }
    echo "\n";
} else {
    echo "No events found\n\n";
}

// Check the registrations table to see if there's a foreign key constraint
$constraints = $conn->query("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME='registrations'");
echo "Foreign key constraints on registrations:\n";
if ($constraints && $constraints->num_rows > 0) {
    while ($row = $constraints->fetch_assoc()) {
        echo "  - {$row['CONSTRAINT_NAME']}\n";
    }
    echo "\n";
} else {
    echo "No constraints found\n\n";
}

$conn->close();
?>
