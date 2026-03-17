<?php
require_once '../config/db.php';

// Test creating an event with EMPTY data
$test_data = [
    'action' => 'create',
    'event_name' => '',
    'location' => '',
    'capacity' => 0,
    'description' => '',
    'start_event' => '',
    'end_event' => '',
    'registration_link' => '',
    'website_link' => ''
];

// Simulate form submission
$_POST = $test_data;
$_FILES = [];

header('Content-Type: application/json');

// Check required fields
$event_name = isset($_POST['event_name']) ? trim($_POST['event_name']) : '';
$location = isset($_POST['location']) ? trim($_POST['location']) : '';
$capacity = isset($_POST['capacity']) ? intval($_POST['capacity']) : 0;
$start_event = isset($_POST['start_event']) ? trim($_POST['start_event']) : '';
$end_event = isset($_POST['end_event']) ? trim($_POST['end_event']) : '';

// VALIDATION
if (empty($event_name) || empty($location) || empty($start_event) || empty($end_event) || $capacity <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields',
        'validation_check' => [
            'event_name_empty' => empty($event_name),
            'location_empty' => empty($location),
            'start_event_empty' => empty($start_event),
            'end_event_empty' => empty($end_event),
            'capacity_invalid' => $capacity <= 0
        ]
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Validation passed (should not happen with empty data)'
]);
?>
