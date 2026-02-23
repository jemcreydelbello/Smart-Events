<?php
require 'db_config.php';

// Test admin login
$username = 'admin';
$password = 'admin'; // Default password from initial setup

$input = json_encode([
    'username' => $username,
    'password' => $password
]);

$ch = curl_init('http://localhost/Smart-Events/api/admin_login.php?action=login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $http_code\n";
echo "Response:\n";
echo json_encode(json_decode($response), JSON_PRETTY_PRINT) . "\n";
?>
