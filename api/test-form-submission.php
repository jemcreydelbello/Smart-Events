<?php
require_once '../config/db.php';

// Simulate the form submission that would come from edit-modal-v2.js
header('Content-Type: application/json');

$test_data = [
    'action' => 'update_event',
    'event_id' => 87,
    'event_name' => 'TEST EDITED EVENT',
    'location' => 'Test Location',
    'start_event' => '2026-03-20 14:30:00',
    'end_event' => '2026-03-20 16:45:00',
    'registration_start' => '2026-03-18 10:00:00',
    'registration_end' => '2026-03-19 23:59:59',
    'capacity' => '50',
    'description' => 'Test description',
    'registration_link' => 'https://example.com',
    'website_link' => 'https://example.com',
    'is_private' => '0'
];

error_log("=== SIMULATING FORM SUBMISSION ===");
error_log("Testing update_event with data:");
error_log(json_encode($test_data, JSON_PRETTY_PRINT));

// Simulate the PHP handler code
$event_id = intval($test_data['event_id'] ?? 0);
$event_name = trim($test_data['event_name'] ?? '');
$location = trim($test_data['location'] ?? '');
$start_event = trim($test_data['start_event'] ?? '');
$end_event = trim($test_data['end_event'] ?? '');
$capacity = intval($test_data['capacity'] ?? 0);
$description = trim($test_data['description'] ?? '');
$registration_link = trim($test_data['registration_link'] ?? '');
$website_link = trim($test_data['website_link'] ?? '');
$is_private = intval($test_data['is_private'] ?? 0);
$registration_start = trim($test_data['registration_start'] ?? '');
$registration_end = trim($test_data['registration_end'] ?? '');
$private_code = trim($test_data['private_code'] ?? '');

error_log("Parsed values:");
error_log("  event_id: $event_id");
error_log("  event_name: '$event_name' (" . strlen($event_name) . " chars)");
error_log("  location: '$location' (" . strlen($location) . " chars)");
error_log("  start_event: '$start_event' (" . strlen($start_event) . " chars)");
error_log("  end_event: '$end_event' (" . strlen($end_event) . " chars)");
error_log("  registration_start: '$registration_start' (" . strlen($registration_start) . " chars)");
error_log("  registration_end: '$registration_end' (" . strlen($registration_end) . " chars)");
error_log("  capacity: $capacity");

// Validate required fields
if (empty($event_name) || empty($location) || empty($start_event) || empty($end_event) || $capacity <= 0) {
    error_log("VALIDATION FAILED");
    echo json_encode(['success' => false, 'message' => 'Missing required fields', 'validation' => [
        'event_name' => !empty($event_name),
        'location' => !empty($location),
        'start_event' => !empty($start_event),
        'end_event' => !empty($end_event),
        'capacity' => $capacity > 0
    ]]);
    exit;
}

error_log("✓ Validation passed");

// Now actually execute the update
$query = "UPDATE events SET 
            event_name = ?, 
            location = ?, 
            start_event = ?, 
            end_event = ?, 
            capacity = ?, 
            description = ?, 
            registration_link = ?, 
            website = ?, 
            registration_start = ?, 
            registration_end = ?, 
            is_private = ?
        WHERE event_id = ?";

$params = [
    $event_name,
    $location,
    $start_event,
    $end_event,
    $capacity,
    $description,
    $registration_link,
    $website_link,
    $registration_start,
    $registration_end,
    $is_private,
    $event_id
];

$types = 'ssssisssssii';

error_log("Executing query with types: $types (" . strlen($types) . " chars for " . count($params) . " params)");

$stmt = $conn->prepare($query);
if (!$stmt) {
    error_log("Prepare failed: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    exit;
}

$stmt->bind_param($types, ...$params);

if (!$stmt->execute()) {
    error_log("Execute failed: " . $stmt->error);
    echo json_encode(['success' => false, 'message' => 'Update failed: ' . $stmt->error]);
    exit;
}

error_log("✅ UPDATE succeeded! Affected rows: " . $stmt->affected_rows);

// Verify the update
$verify = $conn->query("SELECT event_id, event_name, location, start_event, end_event, registration_start, registration_end FROM events WHERE event_id = $event_id");
$updated = $verify->fetch_assoc();

error_log("Verification - Updated event:");
error_log(json_encode($updated, JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true,
    'message' => 'Event updated successfully',
    'updated_event' => $updated
]);

?>
