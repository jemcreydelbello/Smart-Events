<?php
// Error handling - ensure all output is JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error: $errstr in $errfile:$errline");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

try {
    require_once '../config/db.php';
    
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Helper function to get user role and info
function getUserInfo() {
    $userInfo = [
        'role' => 'GUEST',
        'user_id' => null,
        'coordinator_id' => null
    ];
    
    if (isset($_SERVER['HTTP_X_USER_ROLE'])) {
        $userInfo['role'] = $_SERVER['HTTP_X_USER_ROLE'];
    }
    if (isset($_SERVER['HTTP_X_USER_ID'])) {
        $userInfo['user_id'] = intval($_SERVER['HTTP_X_USER_ID']);
    }
    if (isset($_SERVER['HTTP_X_COORDINATOR_ID'])) {
        $userInfo['coordinator_id'] = intval($_SERVER['HTTP_X_COORDINATOR_ID']);
    }
    
    return $userInfo;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'list_all') {
        // Get ALL tasks for calendar display
        $userInfo = getUserInfo();
        
        // Query to get tasks - filter by coordinator if user is a coordinator
        if (($userInfo['role'] === 'COORDINATOR' || $userInfo['role'] === 'coordinator') && $userInfo['coordinator_id']) {
            $query = "SELECT t.task_id, t.event_id, t.task_name, t.description, t.due_date as event_date, 
                             t.party_responsible, t.status, t.remarks, t.created_at, 'task' as item_type,
                             e.event_name
                      FROM event_tasks t
                      JOIN events e ON t.event_id = e.event_id
                      WHERE e.coordinator_id = " . intval($userInfo['coordinator_id']) . "
                      ORDER BY t.due_date ASC";
        } else {
            // For admins, show all tasks
            $query = "SELECT t.task_id, t.event_id, t.task_name, t.description, t.due_date as event_date, 
                             t.party_responsible, t.status, t.remarks, t.created_at, 'task' as item_type,
                             e.event_name
                      FROM event_tasks t
                      JOIN events e ON t.event_id = e.event_id
                      ORDER BY t.due_date ASC";
        }
        
        $result = $conn->query($query);
        if (!$result) {
            error_log("Calendar tasks query error: " . $conn->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $tasks = [];
        while ($row = $result->fetch_assoc()) {
            $tasks[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $tasks]);
    }
}
else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
