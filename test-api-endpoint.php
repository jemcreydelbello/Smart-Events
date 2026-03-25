<?php
echo "=== Testing API Endpoint ===\n\n";

// Test the API endpoint directly using curl
$api_url = 'http://localhost/Smart-Events/api/participants.php';

$test_data = [
    'event_id' => 46,
    'first_name' => 'API',
    'middle_name' => 'Test',
    'last_name' => 'User',
    'participant_email' => 'api-test-' . time() . '@example.com',
    'company' => 'API Test Co',
    'job_title' => 'Tester',
    'participant_phone' => '9999999999',
    'status' => 'REGISTERED',
    'is_walkIn' => 0
];

echo "Test payload:\n";
echo json_encode($test_data, JSON_PRETTY_PRINT) . "\n\n";

// Make POST request to API
$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-User-Role: ADMIN',
    'X-User-Id: 1'
]);

echo "Sending POST to: $api_url\n";
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

echo "HTTP Response Code: $http_code\n";
echo "Response Length: " . strlen($response) . " bytes\n\n";

if ($curl_error) {
    echo "❌ CURL Error: $curl_error\n";
} else if ($response === false) {
    echo "❌ No response from API\n";
} else {
    echo "Raw Response:\n";
    echo $response . "\n\n";
    
    // Try to parse as JSON
    $data = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "✓ Valid JSON response\n";
        echo "Response data:\n";
        echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
        
        if (isset($data['success'])) {
            if ($data['success']) {
                echo "\n✓✓✓ API call was SUCCESSFUL ✓✓✓\n";
                echo "Registration ID: " . ($data['registration_id'] ?? 'N/A') . "\n";
                echo "Registration Code: " . ($data['registration_code'] ?? 'N/A') . "\n";
            } else {
                echo "\n✗✗✗ API returned error ✗✗✗\n";
                echo "Error: " . ($data['message'] ?? 'Unknown error') . "\n";
            }
        } else {
            echo "\n⚠️ Response missing 'success' flag\n";
        }
    } else {
        echo "❌ Invalid JSON response: " . json_last_error_msg() . "\n";
        echo "Response was: " . substr($response, 0, 200) . "...\n";
    }
}
?>
