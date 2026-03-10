<?php
// Write debug log directly to file
$logfile = dirname(__FILE__) . '/users-debug2.log';
file_put_contents($logfile, "\n=== START " . date('Y-m-d H:i:s') . " ===\n", FILE_APPEND);

function log_msg($msg) {
    global $logfile;
    file_put_contents($logfile, $msg . "\n", FILE_APPEND);
    error_log($msg);  // Also try system error log
}

log_msg("1. Script started");

// Set response headers
header('Content-Type: application/json; charset=utf-8');
log_msg("2. Headers set");

// Flush any buffering
if (ob_get_level() > 0) {
    ob_clean();
    log_msg("3. Output buffer cleaned");
} else {
    log_msg("3. No output buffer to clean");
}

try {
    log_msg("4. Starting try block");
    
    // Connect to database
    $mysqli = @mysqli_connect('localhost', 'root', '', 'eventsystem');
    log_msg("5. Connect result: " . ($mysqli ? "Success" : "Failed"));
    
    if (!$mysqli) {
        log_msg("6. Connection failed: " . mysqli_connect_error());
        throw new Exception('Database connection failed: ' . mysqli_connect_error());
    }
    
    log_msg("7. Connection successful, setting charset");
    
    // Set charset
    if (!mysqli_set_charset($mysqli, 'utf8mb4')) {
        throw new Exception('Set charset failed: ' . mysqli_error($mysqli));
    }
    
    log_msg("8. Charset set");
    
    $users = [];
    
    log_msg("9. Querying admins");
    
    // Get admins
    $query = "SELECT admin_id as id, username, email, full_name, admin_image, 'Admin' as role_name, (status = 'active') as is_active, created_at, updated_at FROM admins";
    $result = mysqli_query($mysqli, $query);
    
    if (!$result) {
        throw new Exception('Admin query failed: ' . mysqli_error($mysqli));
    }
    
    log_msg("10. Admin query executed");
    
    while ($row = mysqli_fetch_assoc($result)) {
        $users[] = $row;
    }
    
    log_msg("11. Found " . count($users) . " admins");
    
    // Get coordinators
    $query = "SELECT coordinator_id as id, coordinator_name as username, email, coordinator_name as full_name, coordinator_image, 'Coordinator' as role_name, is_active, created_at, updated_at FROM coordinators";
    $result = mysqli_query($mysqli, $query);
    
    if (!$result) {
        throw new Exception('Coordinator query failed: ' . mysqli_error($mysqli));
    }
    
    log_msg("12. Coordinator query executed");
    
    while ($row = mysqli_fetch_assoc($result)) {
        $users[] = $row;
    }
    
    log_msg("13. Found total " . count($users) . " users");
    
    mysqli_close($mysqli);
    log_msg("14. Database connection closed");
    
    // Sort by created_at descending
    usort($users, function($a, $b) {
        $dateA = strtotime($a['created_at'] ?? '2020-01-01');
        $dateB = strtotime($b['created_at'] ?? '2020-01-01');
        return $dateB - $dateA;
    });
    
    log_msg("15. Users sorted");
    
    // Build response
    $response = [
        'success' => true,
        'count' => count($users),
        'data' => $users
    ];
    
    log_msg("16. Response object created");
    
    // Return success response
    http_response_code(200);
    log_msg("17. HTTP 200 set");
    
    $json = json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    log_msg("18. JSON encoded, length: " . strlen($json));
    
    echo $json;
    log_msg("19. JSON echoed");
    
    // Flush output
    flush();
    log_msg("20. Output flushed");
    
} catch (Throwable $e) {
    log_msg("ERROR: " . $e->getMessage());
    log_msg("File: " . $e->getFile() . " Line: " . $e->getLine());
    
    http_response_code(500);
    $error_response = [
        'success' => false,
        'error' => $e->getMessage(),
        'exception_class' => get_class($e)
    ];
    echo json_encode($error_response);
    log_msg("21. Error response sent");
}

log_msg("=== END ===\n");
?>
