<?php
// Test the actual API endpoint
$test_time = time();
$coordinates_data = [
    'coordinator_name' => "HTTPTest$test_time",
    'email' => "httptest$test_time@example.com",
    'contact_number' => '5551234567',
    'company' => 'HTTPCorp',
    'job_title' => 'HTTP Manager'
];

echo "=== Testing Actual API Endpoint ===\n";
echo "POST /api/coordinators.php?action=create\n";
echo "Data: " . json_encode($coordinates_data) . "\n\n";

// Make the actual HTTP POST request
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost/Smart-Events/api/coordinators.php?action=create');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($coordinates_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, false);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "HTTP Status: $http_code\n";
    
    if ($error) {
        echo "cURL Error: $error\n";
    } else {
        echo "Response:\n";
        if ($response) {
            // Try to format as JSON
            $json = json_decode($response, true);
            if ($json) {
                echo json_encode($json, JSON_PRETTY_PRINT);
            } else {
                echo $response;
            }
        } else {
            echo "(empty response)\n";
        }
    }
} else {
    echo "cURL not available - using file_get_contents\n";
    
    $data = json_encode($coordinates_data);
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => $data,
            'timeout' => 10
        ]
    ];
    
    $context = stream_context_create($options);
    try {
        $response = @file_get_contents('http://localhost/Smart-Events/api/coordinators.php?action=create', false, $context);
        echo "Response: " . ($response ?: "(empty)") . "\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
