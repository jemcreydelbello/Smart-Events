<?php
// Output buffering to catch any unexpected output
ob_start();

// Error handling - ensure all output is JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Helper function to safely encode JSON with invalid UTF-8 handling
function cleanUtf8Data($data) {
    if (is_array($data) || is_object($data)) {
        $cleaned = is_array($data) ? [] : new stdClass();
        foreach ($data as $key => $value) {
            $cleaned[$key] = cleanUtf8Data($value);
        }
        return $cleaned;
    } elseif (is_string($data)) {
        // Use regex-based approach to handle incomplete multibyte sequences
        // iconv() throws errors on incomplete sequences, so we use regex instead
        // Remove high bytes that don't form valid UTF-8
        $cleaned = preg_replace('/[\x80-\xFF]/', '', $data);
        // Also remove any control characters (except newlines/tabs)
        $cleaned = preg_replace('/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/u', '', $cleaned);
        return trim($cleaned);
    }
    return $data;
}

function safeJsonEncode($data) {
    // Clean data first to remove corrupt UTF-8
    $cleanedData = cleanUtf8Data($data);
    
    // Try with standard encoding first
    $json = json_encode($cleanedData);
    if ($json === false && json_last_error() === JSON_ERROR_UTF8) {
        // If UTF-8 error, retry with substitution flag
        return json_encode($cleanedData, JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_SLASHES);
    }
    return $json;
}

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error: $errstr in $errfile:$errline");
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

// Set fatal error handler
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error: ' . $error['message']
        ]);
    } else {
        if (ob_get_level() > 0) {
            ob_end_flush();
        }
    }
});

try {
    require_once dirname(__DIR__) . '/config/db.php';
    
    // Verify database connection was successful
    if (!isset($conn) || !$conn || $conn->connect_error) {
        throw new Exception('Database connection not available: ' . ($conn->connect_error ?? 'Unknown error'));
    }
} catch (Exception $e) {
    error_log("Database config error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database config failed: ' . $e->getMessage()]);
    exit;
}

// Get all users (admins + coordinators)
try {
    $users = array();
    
    // Get admins - use COALESCE to handle missing updated_at column
    $adminsQuery = "SELECT admin_id as id, email, full_name, admin_image, 'Admin' as role_name, (status='active') as is_active, created_at, COALESCE(updated_at, created_at) as updated_at FROM admins";
    $r1 = $conn->query($adminsQuery);
    
    // If the COALESCE version fails (column doesn't exist), try without updated_at
    if (!$r1) {
        error_log("Admin query with updated_at failed: " . $conn->error . ". Trying without updated_at...");
        $adminsQuery = "SELECT admin_id as id, email, full_name, admin_image, 'Admin' as role_name, (status='active') as is_active, created_at, created_at as updated_at FROM admins";
        $r1 = $conn->query($adminsQuery);
    }
    
    if (!$r1) {
        throw new Exception('Admins query failed: ' . $conn->error);
    }
    while ($row = $r1->fetch_assoc()) {
        $users[] = $row;
    }
    
    // Get coordinators
    $r2 = $conn->query("SELECT coordinator_id as id, coordinator_name as full_name, email, coordinator_image, company, contact_number, 'Coordinator' as role_name, is_active, created_at, updated_at FROM coordinators");
    if (!$r2) {
        throw new Exception('Coordinators query failed: ' . $conn->error);
    }
    while ($row = $r2->fetch_assoc()) {
        $users[] = $row;
    }
    
    // Sort by created_at (newest first)
    usort($users, function($a,$b) { 
        return strtotime($b["created_at"] ?? "1970-01-01") - strtotime($a["created_at"] ?? "1970-01-01"); 
    });
    
    http_response_code(200);
    echo safeJsonEncode([
        'success' => true,
        'data' => $users,
        'count' => count($users)
    ]);
    exit;
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading users: ' . $e->getMessage()
    ]);
    exit;
}
?>