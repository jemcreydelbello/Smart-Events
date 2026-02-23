<?php
// Test the actual POST to coordinators.php?action=create
header('Content-Type: application/json');

require_once 'db_config.php';

// Generate test data
$test_time = time();
$test_data = [
    'coordinator_name' => 'APITest' . $test_time,
    'email' => 'apitest' . $test_time . '@example.com',
    'contact_number' => '5551234567',
    'company' => 'TestCorp',
    'job_title' => 'Test Manager',
    'event_id' => '0'
];

echo json_encode([
    'action' => 'Testing POST coordinator creation directly',
    'test_data' => $test_data,
    'note' => 'If coordinator creation succeeds, the database operations work fine',
    'next_step' => 'Check if the JSON appears below'
], JSON_PRETTY_PRINT);

// Now actually do the POST call
echo "\n\n=== Attempting to call API ===\n\n";

// Create a context for the POST request
$data = json_encode($test_data);
$options = [
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $data
    ]
];

$context = stream_context_create($options);

try {
    $response = file_get_contents('http://localhost/Smart-Events/api/coordinators.php?action=create', false, $context);
    echo "API RESPONSE:\n";
    echo $response;
} catch (Exception $e) {
    echo "Error calling API: " . $e->getMessage();
}
?>
