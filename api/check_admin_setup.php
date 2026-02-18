<?php
header('Content-Type: application/json');
require_once '../db_config.php';

// Check if admins table exists
$tableCheckQuery = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
                  WHERE TABLE_SCHEMA = 'eventsystem' AND TABLE_NAME = 'admins'";
$result = $conn->query($tableCheckQuery);
$tableExists = ($result && $result->num_rows > 0);

// Try to get admin count if table exists
$adminCount = 0;
if ($tableExists) {
    $countQuery = "SELECT COUNT(*) as count FROM admins";
    $countResult = $conn->query($countQuery);
    if ($countResult) {
        $row = $countResult->fetch_assoc();
        $adminCount = $row['count'];
    }
}

echo json_encode([
    'success' => true,
    'database' => [
        'name' => 'eventsystem',
        'connected' => true
    ],
    'admins_table_exists' => $tableExists,
    'admin_count' => $adminCount,
    'message' => $tableExists ? 
        "Admin table exists with $adminCount admins" : 
        'Admin table not created yet - please run setup-admin-db.html'
]);

$conn->close();
?>
