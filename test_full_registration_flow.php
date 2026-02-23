<?php
require_once 'db_config.php';

echo "=== FULL REGISTRATION FLOW TEST ===\n\n";

// Step 1: Check events available on client-side
echo "STEP 1: Events available for registration on client-side\n";
$events_result = $conn->query("
    SELECT event_id, event_name, is_private, event_date, capacity, 
           (SELECT COUNT(*) FROM registrations WHERE event_id = events.event_id) as registration_count
    FROM events 
    WHERE event_date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    ORDER BY event_date ASC
");

if ($events_result && $events_result->num_rows > 0) {
    echo "✅ Found " . $events_result->num_rows . " upcoming events:\n";
    while ($row = $events_result->fetch_assoc()) {
        $private_label = $row['is_private'] == 1 ? "[PRIVATE]" : "[PUBLIC]";
        echo "  - Event ID {$row['event_id']}, Name: '{$row['event_name']}' $private_label\n";
        echo "    Date: {$row['event_date']}, Capacity: {$row['capacity']}, Registrations: {$row['registration_count']}\n";
    }
} else {
    echo "❌ No upcoming events found\n";
}

echo "\n";

// Step 2: Check all events regardless of date
echo "STEP 2: ALL events in database (for reference)\n";
$all_events = $conn->query("
    SELECT event_id, event_name, is_private 
    FROM events 
    ORDER BY event_id ASC
");
if ($all_events && $all_events->num_rows > 0) {
    echo "Total events: " . $all_events->num_rows . "\n";
    while ($row = $all_events->fetch_assoc()) {
        echo "  - ID {$row['event_id']}: {$row['event_name']} (Private: {$row['is_private']})\n";
    }
} else {
    echo "No events found\n";
}

echo "\n";

// Step 3: Check current registrations by event
echo "STEP 3: Current registrations breakdown by event\n";
$reg_by_event = $conn->query("
    SELECT e.event_id, e.event_name, COUNT(r.registration_id) as reg_count
    FROM events e
    LEFT JOIN registrations r ON e.event_id = r.event_id
    GROUP BY e.event_id
    ORDER BY reg_count DESC
");

if ($reg_by_event && $reg_by_event->num_rows > 0) {
    while ($row = $reg_by_event->fetch_assoc()) {
        echo "  - Event {$row['event_id']} ({$row['event_name']}): {$row['reg_count']} registrations\n";
    }
} else {
    echo "No registrations found\n";
}

echo "\n";

// Step 4: Test API endpoint for each event
echo "STEP 4: Test API participants endpoint for each event\n";
$test_events = $conn->query("SELECT event_id, event_name FROM events ORDER BY event_id LIMIT 5");
if ($test_events && $test_events->num_rows > 0) {
    while ($row = $test_events->fetch_assoc()) {
        $event_id = $row['event_id'];
        $event_name = $row['event_name'];
        
        // Simulate API call
        $api_query = "SELECT COUNT(*) as count
                      FROM registrations r
                      JOIN users u ON r.user_id = u.user_id
                      JOIN events e ON r.event_id = e.event_id
                      WHERE e.event_id = ?";
        $stmt = $conn->prepare($api_query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $api_result = $stmt->get_result();
        $api_row = $api_result->fetch_assoc();
        
        echo "  - Event {$event_id} ({$event_name}): API would return {$api_row['count']} participants\n";
    }
} else {
    echo "No events to test\n";
}

echo "\n";

// Step 5: Check if there are any mismatches
echo "STEP 5: Check for data integrity issues\n";
$orphaned = $conn->query("
    SELECT COUNT(*) as count
    FROM registrations r
    WHERE r.event_id NOT IN (SELECT event_id FROM events)
");
$orphaned_row = $orphaned->fetch_assoc();

if ($orphaned_row['count'] > 0) {
    echo "⚠️  WARNING: Found {$orphaned_row['count']} orphaned registrations (event_id doesn't exist)\n";
} else {
    echo "✅ No orphaned registrations found\n";
}

// Check for registrations with null event_id
$null_events = $conn->query("
    SELECT COUNT(*) as count
    FROM registrations
    WHERE event_id IS NULL
");
$null_row = $null_events->fetch_assoc();

if ($null_row['count'] > 0) {
    echo "⚠️  WARNING: Found {$null_row['count']} registrations with NULL event_id\n";
} else {
    echo "✅ No NULL event_id registrations found\n";
}

echo "\n";

// Step 6: Detailed breakdown of registrations
echo "STEP 6: Detailed registration breakdown\n";
$detailed = $conn->query("
    SELECT r.registration_id, u.full_name, e.event_id, e.event_name, r.status, r.registered_at
    FROM registrations r
    JOIN users u ON r.user_id = u.user_id
    JOIN events e ON r.event_id = e.event_id
    ORDER BY r.registered_at DESC
    LIMIT 10
");

if ($detailed && $detailed->num_rows > 0) {
    echo "Latest 10 registrations:\n";
    $num = 1;
    while ($row = $detailed->fetch_assoc()) {
        echo "  {$num}. {$row['full_name']} → Event {$row['event_id']} ({$row['event_name']}) - Status: {$row['status']}\n";
        $num++;
    }
} else {
    echo "No registrations found\n";
}

$conn->close();

echo "\n=== END TEST ===\n";
?>
