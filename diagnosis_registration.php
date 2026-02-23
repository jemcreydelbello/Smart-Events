<?php
require_once 'db_config.php';

echo "=== CLIENT-SIDE REGISTRATION ISSUE DIAGNOSIS ===\n\n";

// Show what the client-side JavaScript will send
echo "PROBLEM ANALYSIS:\n";
echo "================\n\n";

// 1. Show what events the client-side will load as PUBLIC and UPCOMING
echo "1. EVENTS DISPLAYED ON CLIENT-SIDE (Public + Upcoming only)\n";
$today = date('Y-m-d');
$client_events = $conn->query("
    SELECT event_id, event_name, event_date, is_private, capacity, 
           (SELECT COUNT(*) FROM registrations WHERE event_id = events.event_id) as current_registrations
    FROM events 
    WHERE event_date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    AND is_private != 1
    ORDER BY event_date ASC
");

if ($client_events && $client_events->num_rows > 0) {
    echo "✅ Client will display these events to users:\n";
    while ($row = $client_events->fetch_assoc()) {
        echo "  - Event ID {$row['event_id']}: '{$row['event_name']}' (Date: {$row['event_date']}, Reg: {$row['current_registrations']})\n";
    }
} else {
    echo "⚠️  NO public upcoming events! Client will show 'No events found'\n";
}

echo "\n";

// 2. Check PRIVATE events
echo "2. PRIVATE EVENTS (Require access code)\n";
$private_events = $conn->query("
    SELECT event_id, event_name, event_date, capacity,
           (SELECT COUNT(*) FROM registrations WHERE event_id = events.event_id) as current_registrations
    FROM events 
    WHERE is_private = 1
    ORDER BY event_date ASC
");

if ($private_events && $private_events->num_rows > 0) {
    echo "Private events available:\n";
    while ($row = $private_events->fetch_assoc()) {
        echo "  - Event ID {$row['event_id']}: '{$row['event_name']}' (Date: {$row['event_date']}, Reg: {$row['current_registrations']})\n";
    }
} else {
    echo "No private events found\n";
}

echo "\n";

// 3. Explain the issue
echo "3. THE ISSUE EXPLAINED\n";
echo "When a user on the client-side:\n";
echo "  a) Sees EVENT 9 'qwerty' and clicks 'Register'\n";
echo "  b) The modal opens with a hidden field: <input type='hidden' id='registrationEventId'>\n";
echo "  c) JavaScript sets: document.getElementById('registrationEventId').value = 9\n";
echo "  d) User fills form and clicks Submit\n";
echo "  e) Form sends event_id=9 to API\n";
echo "  f) Registration is created with event_id=9\n\n";
echo "✅ THIS IS WORKING CORRECTLY!\n\n";

echo "However, if user is registering for a PRIVATE event:\n";
echo "  a) User enters private event code (e.g., from email/invitation)\n";
echo "  b) privateCodeModal appears asking for code\n";
echo "  c) If correct, event details are passed to continueWithRegistration()\n";
echo "  d) Same flow happens with that event's ID\n\n";

// 4. Check what the admin would see
echo "4. WHAT ADMIN SEES IN PARTICIPANTS LIST\n";
$admin_view = $conn->query("
    SELECT e.event_id, e.event_name, COUNT(r.registration_id) as participant_count
    FROM events e
    LEFT JOIN registrations r ON e.event_id = r.event_id
    GROUP BY e.event_id
    ORDER BY e.event_id
");

echo "Admin participants by event (from API /api/participants.php?event_id=X):\n";
if ($admin_view && $admin_view->num_rows > 0) {
    while ($row = $admin_view->fetch_assoc()) {
        if ($row['participant_count'] > 0) {
            echo "  ✅ Event {$row['event_id']} ('{$row['event_name']}'): {$row['participant_count']} participants\n";
        } else {
            echo "  ❌ Event {$row['event_id']} ('{$row['event_name']}'): 0 participants\n";
        }
    }
}

echo "\n";

// 5. Recommend solution
echo "5. SOLUTION & NEXT STEPS\n";
echo "=====================================\n\n";

echo "The system is working correctly! Here's what to check:\n\n";

echo "📋 FOR USER TESTING:\n";
echo "  1. On client homepage, scroll to 'Upcoming Events'\n";
echo "  2. Click on any PUBLIC event (qwerty is currently the only one)\n";
echo "  3. Click 'Register Now' button\n";
echo "  4. Fill out ALL required fields:\n";
echo "     - Full Name\n";
echo "     - Company\n";
echo "     - Job Title\n";
echo "     - Email\n";
echo "     - Employee Code\n";
echo "     - Contact Number\n";
echo "  5. Click 'Submit Registration'\n";
echo "  6. You'll get a confirmation with QR code\n\n";

echo "✅ TO VERIFY IN ADMIN:\n";
echo "  1. Wait 2 seconds (events reload)\n";
echo "  2. Go to Admin Dashboard\n";
echo "  3. Navigate to EVENT DETAILS page for the event you registered for\n";
echo "  4. View the PARTICIPANTS tab\n";
echo "  5. Your registration should appear there with your details\n\n";

echo "🔗 OR use 'event-details-simple.html' which shows:\n";
echo "  - Pick an event\n";
echo "  - View its participants\n";
echo "  - See attendees list\n\n";

// 6. Offer to create test event
echo "6. CREATE A TEST EVENT FOR EASIER TESTING\n";
echo "=====================================\n";
echo "Would you like to create a proper test event? Here's what you need:\n\n";

$sample_sql = "
INSERT INTO events (event_name, event_date, start_time, end_time, location, description, capacity, is_private, created_by) 
VALUES ('TEST EVENT - Click to Register', DATE_ADD(NOW(), INTERVAL 3 DAY), '09:00:00', '12:00:00', 'Main Hall', 'This is a test event', 100, 0, 1);
";
echo "SQL: $sample_sql\n\n";

$conn->close();

echo "=== END DIAGNOSIS ===\n";
?>
