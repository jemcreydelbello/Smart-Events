<?php
// Direct file logging for debugging

$log_file = dirname(__DIR__) . '/DEBUG_CREATE_LOG.txt';

$message = "[" . date('Y-m-d H:i:s') . "] POST REQUEST DEBUG\n";
$message .= "REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD'] . "\n";
$message .= "POST keys: " . implode(', ', array_keys($_POST)) . "\n";
$message .= "POST data:\n";
foreach ($_POST as $key => $value) {
    $message .= "  [$key] = " . (strlen($value) > 50 ? substr($value, 0, 50) . '...' : $value) . "\n";
}
$message .= "CONTENT_TYPE: " . ($_SERVER['CONTENT_TYPE'] ?? 'NOT SET') . "\n";
$message .= "---\n";

file_put_contents($log_file, $message, FILE_APPEND);

http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['logged' => true, 'file' => $log_file]);
?>