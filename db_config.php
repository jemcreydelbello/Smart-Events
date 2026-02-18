<?php
// Set headers before any output
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'eventsystem');

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database connection failed', 'error' => $conn->connect_error]));
}

// Set character set to utf8mb4
$conn->set_charset("utf8mb4");

// Helper function to execute queries
function executeQuery($query, $params = []) {
    global $conn;
    
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        return ['success' => false, 'message' => 'Prepare failed: ' . $conn->error];
    }
    
    if (!empty($params)) {
        $types = '';
        foreach ($params as $param) {
            if (is_int($param)) $types .= 'i';
            elseif (is_float($param)) $types .= 'd';
            else $types .= 's';
        }
        $stmt->bind_param($types, ...$params);
    }
    
    if (!$stmt->execute()) {
        return ['success' => false, 'message' => 'Execute failed: ' . $stmt->error];
    }
    
    return ['success' => true, 'stmt' => $stmt];
}
?>

