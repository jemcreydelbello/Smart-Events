<?php
// Test coordinator creation after fix
header('Content-Type: application/json');

$test_time = time();
$test_data = [
    'coordinator_name' => "FixTest$test_time",
    'email' => "fixtest$test_time@example.com",
    'contact_number' => '5551234567',
    'company' => 'FixCorp',
    'job_title' => 'Fix Manager'
];

echo "Testing Coordinator Creation After Fix\n";
echo "======================================\n\n";
echo "Test Data:\n";
echo json_encode($test_data, JSON_PRETTY_PRINT) . "\n\n";

// Make the HTTP POST request
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost/Smart-Events/api/coordinators.php?action=create');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Status Code: $http_code\n";
    echo "Response:\n";
    
    if ($response) {
        $json = json_decode($response, true);
        if ($json) {
            echo json_encode($json, JSON_PRETTY_PRINT);
        } else {
            echo $response;
        }
    } else {
        echo "(empty response)";
    }
} else {
    echo "cURL not available";
}
?>
