<?php
//Test multipart form data submission (like FormData from browser)

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/Smart-Events/api/events.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);

// Create multipart form data manually
$params = [
    'action' => 'update_event',
    'event_id' => '46',
    'event_name' => 'TEST MULTIPART UPDATE',
    'location' => 'Multipart Test Location',
    'start_event' => '2026-03-25 10:00:00',
    'end_event' => '2026-03-25 12:00:00',
    'registration_start' => '2026-03-25 08:00:00',
    'registration_end' => '2026-03-25 11:00:00',
    'capacity' => '75',
    'description' => 'Multipart test',
    'registration_link' => '',
    'website_link' => '',
    'is_private' => '0'
];

// Set POST fields WITHOUT specifying multipart - let curl handle it
curl_setopt($ch, CURLOPT_POSTFIELDS, $params);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
    'http_code' => $httpCode,
    'curl_error' => $error,
    'response' => json_decode($response, true),
    'message' => 'Multipart test completed'
]);
?>