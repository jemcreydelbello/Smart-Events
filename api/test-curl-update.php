<?php
// Simulate the edit form submission manually

$ch = curl_init('http://localhost/Smart-Events/api/events.php');

$postData = [
    'action' => 'update_event',
    'event_id' => '87',
    'event_name' => 'TEST CURL UPDATE',
    'location' => 'Curl Test Location',
    'start_event' => '2026-03-20 10:00:00',
    'end_event' => '2026-03-20 12:00:00',
    'registration_start' => '2026-03-20 08:00:00',
    'registration_end' => '2026-03-20 11:00:00',
    'capacity' => '100',
    'description' => 'Curl test',
    'registration_link' => '',
    'website_link' => '',
    'is_private' => '0'
];

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
    'http_code' => $httpCode,
    'response' => json_decode($response, true),
    'message' => 'Test curl request completed'
]);
?>