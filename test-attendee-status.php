<?php
require 'config/db.php';

// Check the most recent attendee created by the add modal
// These will have is_walkIn = 1 and status = 'ATTENDED' or 'attended'
$result = $conn->query("
    SELECT 
        r.registration_id,
        r.user_id,
        u.first_name,
        u.last_name,
        u.email,
        r.event_id,
        r.status,
        r.is_walkIn,
        r.registered_at
    FROM registrations r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.is_walkIn = 1
    ORDER BY r.registered_at DESC
    LIMIT 10
");

echo "=== Walk-In Attendees (Added via Add Modal) ===\n";
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo sprintf(
            "- %s %s (%s) | Event %d | Status: %s | Added: %s\n",
            $row['first_name'],
            $row['last_name'],
            $row['email'],
            $row['event_id'],
            $row['status'],
            $row['registered_at']
        );
    }
} else {
    echo "No walk-in attendees found\n";
}

// Now check registrations with status NOT attended
echo "\n=== Registered (Not Attended) ===\n";
$result = $conn->query("
    SELECT 
        r.registration_id,
        u.first_name,
        u.last_name,
        r.status,
        r.registered_at
    FROM registrations r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.status NOT IN ('attended', 'ATTENDED')
    ORDER BY r.registered_at DESC
    LIMIT 5
");

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo sprintf("- %s %s | Status: %s | %s\n", $row['first_name'], $row['last_name'], $row['status'], $row['registered_at']);
    }
} else {
    echo "No registered (pending) attendees found\n";
}
?>
