<?php
header('Content-Type: application/json');

// Test that users.php works
$response = file_get_contents('http://localhost/Smart-Events/api/users.php');
$json = json_decode($response, true);

echo json_encode([
    'api_response_length' => strlen($response),
    'json_valid' => $json !== null,
    'success' => $json['success'] ?? false,
    'users_count' => $json['count'] ?? 0,
    'first_user_id' => $json['data'][0]['id'] ?? null,
    'first_user_has_id' => isset($json['data'][0]['id']) ? 'yes' : 'no',
    'first_user_has_role' => isset($json['data'][0]['role_name']) ? 'yes' : 'no'
]);
?>
