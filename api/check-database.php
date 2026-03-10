<?php
header('Content-Type: application/json');
try {
    require_once dirname(__DIR__) . '/config/db.php';
    
    // Check admins table count
    $adminCount = $conn->query("SELECT COUNT(*) as count FROM admins")->fetch_assoc()['count'];
    
    // Check coordinators table count
    $coordCount = $conn->query("SELECT COUNT(*) as count FROM coordinators")->fetch_assoc()['count'];
    
    // Get sample admin record
    $adminSample = $conn->query("SELECT * FROM admins LIMIT 1")->fetch_assoc();
    
    // Get sample coordinator record
    $coordSample = $conn->query("SELECT * FROM coordinators LIMIT 1")->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'admin_count' => $adminCount,
        'coordinator_count' => $coordCount,
        'admin_sample' => $adminSample,
        'coordinator_sample' => $coordSample,
        'admin_table_exists' => true,
        'coordinator_table_exists' => true
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
