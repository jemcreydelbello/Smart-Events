<?php
// Error handling - ensure all output is JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set JSON header FIRST before any includes
header('Content-Type: application/json; charset=utf-8');

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error in $errfile:$errline - $errstr");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

set_exception_handler(function($exception) {
    error_log("Exception: " . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $exception->getMessage()]);
    exit;
});

require_once '../config/db.php';
require_once '../includes/activity-logger.php';

// Helper function to get user role and info from request headers or session
function getUserInfo() {
    $userInfo = [
        'role' => 'GUEST',
        'user_id' => null,
        'coordinator_id' => null,
        'email' => null,
        'name' => 'Guest User'
    ];
    
    // Check if role is passed in header
    if (isset($_SERVER['HTTP_X_USER_ROLE'])) {
        $userInfo['role'] = $_SERVER['HTTP_X_USER_ROLE'];
    }
    if (isset($_SERVER['HTTP_X_USER_ID'])) {
        $userInfo['user_id'] = intval($_SERVER['HTTP_X_USER_ID']);
    }
    if (isset($_SERVER['HTTP_X_COORDINATOR_ID'])) {
        $userInfo['coordinator_id'] = intval($_SERVER['HTTP_X_COORDINATOR_ID']);
    }
    if (isset($_SERVER['HTTP_X_USER_EMAIL'])) {
        $userInfo['email'] = $_SERVER['HTTP_X_USER_EMAIL'];
    }
    if (isset($_SERVER['HTTP_X_USER_NAME'])) {
        $userInfo['name'] = $_SERVER['HTTP_X_USER_NAME'];
    }
    
    return $userInfo;
}

// Ensure user is authenticated
$userInfo = getUserInfo();
if (!$userInfo['user_id']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Only admins and coordinators can view activity logs
if (!in_array($userInfo['role'], ['ADMIN', 'admin', 'COORDINATOR'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Ensure activity_logs table exists
        ensureActivityLogsTable();
        
        // Fetch activity logs
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? 50);
        $offset = ($page - 1) * $limit;
        
        $action_filter = $_GET['action'] ?? null;
        $user_filter = $_GET['user_id'] ?? null;
        
        // Build query with filters
        $where_conditions = [];
        $params = [];
        $param_types = '';
        
        if ($action_filter && $action_filter !== 'all') {
            $where_conditions[] = 'action_type = ?';
            $params[] = $action_filter;
            $param_types .= 's';
        }
        
        if ($user_filter) {
            $where_conditions[] = 'user_id = ?';
            $params[] = intval($user_filter);
            $param_types .= 'i';
        }
        
        $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
        
        // Get total count
        $count_query = "SELECT COUNT(*) as total FROM activity_logs $where_clause";
        $count_stmt = $conn->prepare($count_query);
        
        if (!$count_stmt) {
            throw new Exception('Prepare count failed: ' . $conn->error);
        }
        
        if (!empty($params)) {
            $count_stmt->bind_param($param_types, ...$params);
        }
        
        if (!$count_stmt->execute()) {
            throw new Exception('Count query failed: ' . $count_stmt->error);
        }
        
        $count_result = $count_stmt->get_result();
        $count_row = $count_result->fetch_assoc();
        $total_records = $count_row['total'];
        
        // Get logs - extract user_name from description since activity logs store creator info there
        $query = "SELECT al.log_id, al.user_id, al.action_type, al.entity_type, al.entity_id, 
                         al.description, al.timestamp, al.ip_address, al.user_agent
                  FROM activity_logs al
                  $where_clause
                  ORDER BY al.timestamp DESC
                  LIMIT ? OFFSET ?";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }
        
        // Add limit and offset to params
        $all_params = $params;
        $all_params[] = $limit;
        $all_params[] = $offset;
        $all_param_types = $param_types . 'ii';
        
        $stmt->bind_param($all_param_types, ...$all_params);
        
        if (!$stmt->execute()) {
            throw new Exception('Execute failed: ' . $stmt->error);
        }
        
        $result = $stmt->get_result();
        $logs = [];
        
        while ($row = $result->fetch_assoc()) {
            $user_name = 'Unknown';
            $description = $row['description'];
            
            // Extract user name from description based on action type
            // Patterns: "Action: [Name]", "Action: [Name] | By: [Creator]", "Create Account: [Name] | By: [Creator]"
            
            // For LOGIN/LOGOUT: "Admin/Coordinator Login: [Name]"
            if (in_array($row['action_type'], ['LOGIN', 'LOGOUT'])) {
                if (preg_match('/(?:Admin|Coordinator)\s+(?:Login|Logout):\s+(.+?)(?:\s+\||$)/', $description, $matches)) {
                    $user_name = trim($matches[1]);
                }
            }
            // For CREATE: "Create Account: [Name] | By: [Creator]" - we want the creator (By: [Creator])
            elseif ($row['action_type'] === 'CREATE') {
                if (strpos($description, ' | By: ') !== false) {
                    $parts = explode(' | By: ', $description);
                    if (count($parts) > 1) {
                        $user_name = trim($parts[1]);
                    }
                }
            }
            // For other actions, try to extract from format "Action: [something] | [Details]"
            else {
                if (preg_match('/^[^:]+:\s+(.+?)(?:\s+\||$)/', $description, $matches)) {
                    $user_name = trim($matches[1]);
                }
            }
            
            // Default to Unknown if extraction failed
            if (!$user_name) {
                $user_name = 'Unknown';
            }
            
            $logs[] = [
                'log_id' => $row['log_id'],
                'user_id' => $row['user_id'],
                'user_name' => $user_name,
                'action_type' => $row['action_type'],
                'entity_type' => $row['entity_type'],
                'entity_id' => $row['entity_id'],
                'description' => $row['description'],
                'timestamp' => $row['timestamp'],
                'ip_address' => $row['ip_address'],
                'user_agent' => $row['user_agent']
            ];
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $logs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total_records,
                'pages' => ceil($total_records / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log('Activity logs error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    
} elseif ($method === 'POST') {
    try {
        // Ensure activity_logs table exists
        ensureActivityLogsTable();
        
        // Log new activity
        $data = json_decode(file_get_contents('php://input'), true);
        
        $user_id = $userInfo['user_id'] ?? null;
        $action_type = $data['action_type'] ?? null;
        $entity_type = $data['entity_type'] ?? null;
        $entity_id = $data['entity_id'] ?? null;
        $description = $data['description'] ?? null;
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        
        if (!$action_type) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Action type is required']);
            exit;
        }
        
        $query = "INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, description, ip_address, user_agent, timestamp)
                  VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }
        
        $stmt->bind_param('issiiss', $user_id, $action_type, $entity_type, $entity_id, $description, $ip_address, $user_agent);
        
        if (!$stmt->execute()) {
            throw new Exception('Insert failed: ' . $stmt->error);
        }
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Activity logged',
            'log_id' => $conn->insert_id
        ]);
        
    } catch (Exception $e) {
        error_log('Activity log insert error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
