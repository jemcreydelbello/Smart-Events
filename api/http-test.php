<?php
// Simple HTTP diagnostic
header('Content-Type: application/json');
http_response_code(200);
echo json_encode([
    'status' => 'ok',
    'tested_at' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'current_file' => __FILE__
]);
?>