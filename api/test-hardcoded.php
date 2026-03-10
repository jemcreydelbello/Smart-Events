<?php
// Minimal test - just return hardcoded JSON
header('Content-Type: application/json');

$response = [
    'success' => true,
    'message' => 'Hardcoded response',
    'test' => 'value'
];

echo json_encode($response);
?>
