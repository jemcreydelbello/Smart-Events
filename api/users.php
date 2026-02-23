<?php
// Output buffering to catch any unexpected output
ob_start();

// Set proper headers before any output
header('Content-Type: application/json; charset=utf-8');

// Enable error logging but hide from output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once '../db_config.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

// GET - Retrieve all admin users and coordinators
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if ($action === 'list') {
            // Query to get all admins
            $adminsQuery = "SELECT 
                            admin_id as id,
                            username,
                            email,
                            full_name,
                            'Admin' as role_name,
                            (status = 'active') as is_active,
                            created_at,
                            updated_at,
                            1 as setup_complete
                          FROM admins 
                          WHERE status = 'active'";
            
            $adminsResult = $conn->query($adminsQuery);
            
            if (!$adminsResult) {
                throw new Exception("Admins query error: " . $conn->error);
            }
            
            $users = [];
            
            // Add admins to users array
            while ($row = $adminsResult->fetch_assoc()) {
                $row['id'] = intval($row['id']);
                $row['is_active'] = boolval($row['is_active']);
                $row['setup_complete'] = boolval($row['setup_complete']);
                $users[] = $row;
            }
            
            // Query to get all coordinators
            $coordinatorsQuery = "SELECT 
                                coordinator_id as id,
                                coordinator_name as username,
                                email,
                                coordinator_name as full_name,
                                role_name,
                                is_active,
                                created_at,
                                updated_at,
                                CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 1 ELSE 0 END as setup_complete
                              FROM coordinators
                              ORDER BY created_at DESC";
            
            $coordinatorsResult = $conn->query($coordinatorsQuery);
            
            if (!$coordinatorsResult) {
                throw new Exception("Coordinators query error: " . $conn->error);
            }
            
            // Add coordinators to users array
            while ($row = $coordinatorsResult->fetch_assoc()) {
                $row['id'] = intval($row['id']);
                $row['is_active'] = boolval($row['is_active']);
                $row['setup_complete'] = boolval($row['setup_complete']);
                $users[] = $row;
            }
            
            // Sort by created_at descending
            usort($users, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $users,
                'count' => count($users)
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

ob_end_flush();
?>
