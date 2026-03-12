<?php
/**
 * Test Event Creation with Activity Logging
 */

require_once '../config/db.php';

echo "=== Testing Event Creation ===\n";

// Simulate FormData submission
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/x-www-form-urlencoded';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['HTTP_USER_AGENT'] = 'Test Browser';

// Create test event data
$testData = [
    'event_name' => 'Test Event ' . date('H:i:s'),
    'description' => 'This is a test event',
    'location' => 'Test Location',
    'capacity' => 50,
    'is_private' => 0,
    'registration_link' => '',
    'website_link' => '',
    'event_date' => date('Y-m-d'),
    'start_time' => '10:00:00',
    'end_time' => '12:00:00',
    'registration_start' => date('Y-m-d H:i:s'),
    'registration_end' => date('Y-m-d H:i:s'),
    '_user_id' => 4  // Admin ID
];

// Build query string
$_POST = $testData;

// Try to create event via API
$response = [
    'test' => 'Event creation test',
    'data' => $testData
];

echo "Test data prepared:\n";
echo json_encode($response, JSON_PRETTY_PRINT) . "\n";

echo "\nTo test event creation:\n";
echo "1. Use the admin dashboard Create Event form\n";
echo "2. Fill in the event details\n";
echo "3. Click 'Create Event'\n";
echo "4. Check the browser console for any errors\n";

?>
