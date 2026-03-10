<?php
// Test each step individually
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');

// Force output even if error
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $error['message'],
            'type' => $error['type'],
            'file' => $error['file'],
            'line' => $error['line']
        ]);
    }
});

try {
    echo json_encode(['step' => '1_start']);
    flush();
    
    $mysqli = mysqli_connect('localhost', 'root', '', 'eventsystem');
    
    echo json_encode(['step' => '2_connected']);
    flush();
    
    if (!$mysqli) {
        throw new Exception('Connection failed: ' . mysqli_connect_error());
    }
    
    echo json_encode(['step' => '3_verified']);
    flush();
    
    mysqli_set_charset($mysqli, 'utf8mb4');
    
    echo json_encode(['step' => '4_charset_set']);
    flush();
    
    $result = mysqli_query($mysqli, "SELECT COUNT(*) as cnt FROM admins");
    
    echo json_encode(['step' => '5_admin_query']);
    flush();
    
    if (!$result) {
        throw new Exception('Query failed: ' . mysqli_error($mysqli));
    }
    
    echo json_encode(['step' => '6_query_success']);
    flush();
    
    $row = mysqli_fetch_assoc($result);
    
    echo json_encode(['step' => 'final', 'admin_count' => $row['cnt'], 'success' => true]);
    
    mysqli_close($mysqli);
    
} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
