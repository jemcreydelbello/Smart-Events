<?php
// Test script to capture what's actually being POSTed

error_log('=== TEST POST CAPTURE ===');
error_log('Timestamp: ' . date('Y-m-d H:i:s'));
error_log('REQUEST_METHOD: ' . $_SERVER['REQUEST_METHOD']);
error_log('CONTENT_TYPE: ' . ($_SERVER['CONTENT_TYPE'] ?? 'NOT SET'));
error_log('Content-Length: ' . ($_SERVER['CONTENT_LENGTH'] ?? 'NOT SET'));
error_log('');
error_log('$_POST array (count: ' . count($_POST) . '):');
foreach ($_POST as $key => $value) {
    if (is_string($value)) {
        error_log("  [$key] = '" . substr($value, 0, 100) . (strlen($value) > 100 ? '...' : '') . "'");
    } else {
        error_log("  [$key] = " . gettype($value) . ": " . json_encode($value));
    }
}
error_log('');
error_log('$_FILES array (count: ' . count($_FILES) . '):');
foreach ($_FILES as $key => $file) {
    error_log("  [$key] = " . $file['name'] . " (" . $file['size'] . " bytes, type: " . $file['type'] . ")");
}
error_log('');

// Also output to JSON for easy reading
http_response_code(200);
header('Content-Type: application/json');

$response = [
    'success' => true,
    'timestamp' => date('Y-m-d H:i:s'),
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT SET',
    'post_count' => count($_POST),
    'post_data' => $_POST,
    'files_count' => count($_FILES),
    'has_action' => isset($_POST['action']),
    'action_value' => $_POST['action'] ?? 'NOT SET'
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>