<?php
// Test the API endpoint - simpler version
$api_url = 'http://localhost/Smart-Events/api/participants.php';

$test_data = [
    'event_id' => 46,
    'first_name' => 'Quick',
    'middle_name' => 'Test',
    'last_name' => 'Check',
    'participant_email' => 'quick-test-' . time() . '@example.com',
    'company' => 'Test Co',
    'job_title' => 'Tester',
    'participant_phone' => '1111111111',
    'status' => 'REGISTERED',
    'is_walkIn' => 0
];

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-User-Role: ADMIN',
    'X-User-Id: 1'
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $http_code\n";

$data = json_decode($response, true);

if ($data['success']) {
    echo "✓✓✓ SUCCESS ✓✓✓\n";
    echo "Registration ID: " . $data['registration_id'] . "\n";
    echo "Code: " . $data['registration_code'] . "\n";
} else {
    echo "✗ FAILED\n";
    echo "Message: " . $data['message'] . "\n";
}
?>
