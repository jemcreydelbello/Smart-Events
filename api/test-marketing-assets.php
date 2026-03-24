<?php
// Test script to check marketing assets table

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

require_once '../config/db.php';

// Check if table exists
$tableExists = $conn->query("SHOW TABLES LIKE 'event_marketing_assets'");
$exists = $tableExists && $tableExists->num_rows > 0;

$response = [
    'status' => 'ok',
    'table_exists' => $exists
];

if ($exists) {
    // Get total count
    $countResult = $conn->query("SELECT COUNT(*) as total FROM event_marketing_assets");
    $count = $countResult->fetch_assoc();
    $response['total_assets'] = $count['total'];
    
    // Get all assets
    $allAssets = $conn->query("SELECT asset_id, event_id, asset_type, file_path, filename, created_at FROM event_marketing_assets ORDER BY created_at DESC");
    $assets = [];
    while ($row = $allAssets->fetch_assoc()) {
        $assets[] = $row;
    }
    $response['assets'] = $assets;
    
    // Check specific event if provided
    if (isset($_GET['event_id'])) {
        $event_id = intval($_GET['event_id']);
        $eventAssets = $conn->query("SELECT asset_id, event_id, asset_type, file_path, filename, created_at FROM event_marketing_assets WHERE event_id = $event_id ORDER BY created_at DESC");
        $eventAssetsList = [];
        while ($row = $eventAssets->fetch_assoc()) {
            $eventAssetsList[] = $row;
        }
        $response['event_assets'] = $eventAssetsList;
        $response['event_id'] = $event_id;
    }
} else {
    // Table doesn't exist, try to show error
    $response['error'] = 'Marketing assets table not found';
    $response['last_error'] = $conn->error;
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>
