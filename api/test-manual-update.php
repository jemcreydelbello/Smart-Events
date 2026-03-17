<?php
// Manual test - simulate what the JavaScript sends
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

// Simulate the exact POST data that JavaScript would send
$_POST['action'] = 'update_event';
$_POST['event_id'] = '92';
$_POST['event_name'] = 'TEST MANUAL UPDATE ' . date('H:i:s');
$_POST['location'] = 'Meeting Room B';
$_POST['event_date'] = '2024-03-17';
$_POST['start_time'] = '14:30:00';
$_POST['end_time'] = '16:45:00';
$_POST['capacity'] = '10';
$_POST['description'] = '';
$_POST['registration_link'] = 'https://www.jotform.com';
$_POST['website_link'] = 'website.com';
$_POST['registration_start'] = '2024-03-17 10:26:00';
$_POST['registration_end'] = '2024-03-20 10:27:00';
$_POST['is_private'] = '0';

echo json_encode(['test_input' => $_POST]);

// Now execute the update logic (copy from events.php)
$event_id = intval($_POST['event_id'] ?? 0);
$event_name = isset($_POST['event_name']) ? trim($_POST['event_name']) : '';
$location = isset($_POST['location']) ? trim($_POST['location']) : '';
$event_date = isset($_POST['event_date']) ? trim($_POST['event_date']) : '';
$start_time = isset($_POST['start_time']) ? trim($_POST['start_time']) : '00:00:00';
$end_time = isset($_POST['end_time']) ? trim($_POST['end_time']) : '23:59:59';
$capacity = intval($_POST['capacity'] ?? 0);
$registration_link = isset($_POST['registration_link']) ? trim($_POST['registration_link']) : '';
$website_link = isset($_POST['website_link']) ? trim($_POST['website_link']) : '';
$description = isset($_POST['description']) ? trim($_POST['description']) : '';
$registration_start = isset($_POST['registration_start']) ? trim($_POST['registration_start']) : '';
$registration_end = isset($_POST['registration_end']) ? trim($_POST['registration_end']) : '';

error_log("\\n\\n=== MANUAL TEST UPDATE START ===");
error_log("Received: event_id=$event_id, event_date='$event_date', start_time='$start_time', end_time='$end_time'");

if (!$event_id || !$event_name || !$location || !$event_date || !$capacity) {
    error_log("VALIDATION FAILED: event_id=$event_id, event_name='$event_name', location='$location', event_date='$event_date', capacity=$capacity");
    die('Validation failed');
}

// Construct datetime
$start_event = $event_date . ' ' . $start_time;
$end_event = $event_date . ' ' . $end_time;

error_log("Constructed: start_event='$start_event', end_event='$end_event'");

// Update event details
$query = "UPDATE events SET event_name = ?, location = ?, start_event = ?, end_event = ?, capacity = ?, registration_link = ?, website = ?, description = ?, registration_start = ?, registration_end = ? WHERE event_id = ?";
$params = [$event_name, $location, $start_event, $end_event, $capacity, $registration_link, $website_link, $description, $registration_start, $registration_end, $event_id];
$types = 'ssssisssssi';

error_log("Executing UPDATE with params: " . json_encode($params));

$stmt = $conn->prepare($query);
if (!$stmt) {
    error_log("PREPARE FAILED: " . $conn->error);
    die('Prepare failed: ' . $conn->error);
}

$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    error_log("UPDATE SUCCESS");
    
    // Verify
    $verify = $conn->prepare("SELECT event_name, start_event, end_event FROM events WHERE event_id = ?");
    $verify->bind_param('i', $event_id);
    $verify->execute();
    $result = $verify->get_result();
    $row = $result->fetch_assoc();
    
    error_log("VERIFIED DATA: name='{$row['event_name']}', start='{$row['start_event']}', end='{$row['end_event']}'");
    
    if ($row['event_name'] === $event_name && $row['start_event'] === $start_event) {
        echo "<!--SUCCESS: Data was saved-->";
    } else {
        echo "<!--MISMATCH: Expected vs Actual-->";
        error_log("EXPECTED: name='$event_name', start='$start_event'");
        error_log("ACTUAL: name='{$row['event_name']}', start='{$row['start_event']}'");
    }
} else {
    error_log("UPDATE FAILED: " . $stmt->error);
    die('Update failed: ' . $stmt->error);
}

error_log("=== MANUAL TEST UPDATE END ===\\n");
?>
