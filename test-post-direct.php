<?php
// POST test using a simpler approach
$test_time = time();
$test_email = "posttest$test_time@example.com";

// Simulate a POST form/JSON request
$url = "http://localhost/Smart-Events/api/coordinators.php?action=create";

// Method 1: Try with cURL if available
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'coordinator_name' => "TestAPI$test_time",
        'email' => $test_email,
        'contact_number' => '5551234567',
        'company' => 'TestCorp',
        'job_title' => 'Test Manager'
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "=== POST CREATE TEST ===\n";
    echo "HTTP Status: $http_code\n";
    
    if ($error) {
        echo "cURL Error: $error\n";
    } else {
        echo "Response:\n";
        echo $response ? $response : "(no response)";
    }
} else {
    echo "cURL not available\n";
}
?>
