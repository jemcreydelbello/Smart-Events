<?php
// Direct database test - no db.php to avoid double output
header('Content-Type: application/json');
ob_start();

$db_host = 'localhost';
$db_user = 'root';
$db_password = '';
$db_name = 'eventsystem';

$conn = new mysqli($db_host, $db_user, $db_password, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Connection failed']);
} else {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Database connected']);
}

ob_end_flush();
?>

