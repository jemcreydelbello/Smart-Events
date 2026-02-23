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
    require_once '../db_config.php';
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Helper function to check if coordinator has access to an event
function coordinatorHasAccessToEvent($conn, $event_id, $coordinator_id) {
    $query = "SELECT event_id FROM events WHERE event_id = ? AND coordinator_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $event_id, $coordinator_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->num_rows > 0;
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

// Helper function to check event access
function checkEventAccess($conn, $event_id, $userInfo) {
    // Admins have access to all events
    if ($userInfo['role'] === 'ADMIN' || $userInfo['role'] === 'admin') {
        return true;
    }
    
    // Coordinators can only access their assigned events
    if ($userInfo['role'] === 'COORDINATOR' || $userInfo['role'] === 'coordinator') {
        return coordinatorHasAccessToEvent($conn, $event_id, $userInfo['coordinator_id']);
    }
    
    // For local development/testing: allow localhost access
    if (isset($_SERVER['REMOTE_ADDR']) && $_SERVER['REMOTE_ADDR'] === '127.0.0.1') {
        return true;
    }
    if (isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false)) {
        return true;
    }
    
    return false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'list') {
        // Get all tasks for an event
        $event_id = intval($_GET['event_id'] ?? 0);
        $userInfo = getUserInfo();
        
        if (!$event_id) {
            echo json_encode(['success' => false, 'message' => 'Event ID is required']);
            exit;
        }
        
        // Check access
        if (!checkEventAccess($conn, $event_id, $userInfo)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            exit;
        }
        
        $query = "SELECT * FROM event_tasks WHERE event_id = ? ORDER BY due_date ASC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $tasks = [];
        while ($row = $result->fetch_assoc()) {
            $tasks[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $tasks]);
    }
    elseif ($action === 'detail') {
        $task_id = intval($_GET['task_id'] ?? 0);
        
        $query = "SELECT * FROM event_tasks WHERE task_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $task_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $task = $result->fetch_assoc();
        
        if ($task) {
            echo json_encode(['success' => true, 'data' => $task]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Task not found']);
        }
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create new task
    $data = json_decode(file_get_contents('php://input'), true);
    
    $event_id = intval($data['event_id'] ?? 0);
    $task_name = $data['task_name'] ?? '';
    $due_date = $data['due_date'] ?? '';
    $party_responsible = $data['party_responsible'] ?? '';
    $status = $data['status'] ?? 'Pending';
    $remarks = $data['remarks'] ?? '';
    
    if (!$event_id || !$task_name || !$due_date) {
        echo json_encode(['success' => false, 'message' => 'Event ID, Task name, and Due date are required']);
        exit;
    }
    
    // Validate status
    $valid_statuses = ['Pending', 'In Progress', 'Done'];
    if (!in_array($status, $valid_statuses)) {
        $status = 'Pending';
    }
    
    // Convert date format from mm/dd/yyyy to yyyy-mm-dd if needed
    $date_parts = explode('/', $due_date);
    if (count($date_parts) === 3) {
        $due_date = $date_parts[2] . '-' . $date_parts[0] . '-' . $date_parts[1];
    }
    
    $query = "INSERT INTO event_tasks (event_id, task_name, due_date, party_responsible, status, remarks) 
              VALUES (?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('isssss', $event_id, $task_name, $due_date, $party_responsible, $status, $remarks);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Task created successfully', 'task_id' => $conn->insert_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create task: ' . $stmt->error]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update task
    $data = json_decode(file_get_contents('php://input'), true);
    
    $task_id = intval($data['task_id'] ?? 0);
    $task_name = $data['task_name'] ?? '';
    $due_date = $data['due_date'] ?? '';
    $party_responsible = $data['party_responsible'] ?? '';
    $status = $data['status'] ?? 'Pending';
    $remarks = $data['remarks'] ?? '';
    
    if (!$task_id || !$task_name || !$due_date) {
        echo json_encode(['success' => false, 'message' => 'Task ID, Task name, and Due date are required']);
        exit;
    }
    
    // Validate status
    $valid_statuses = ['Pending', 'In Progress', 'Done'];
    if (!in_array($status, $valid_statuses)) {
        $status = 'Pending';
    }
    
    // Convert date format from mm/dd/yyyy to yyyy-mm-dd if needed
    $date_parts = explode('/', $due_date);
    if (count($date_parts) === 3) {
        $due_date = $date_parts[2] . '-' . $date_parts[0] . '-' . $date_parts[1];
    }
    
    $query = "UPDATE event_tasks SET 
              task_name = ?, 
              due_date = ?, 
              party_responsible = ?, 
              status = ?, 
              remarks = ?
              WHERE task_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sssssi', $task_name, $due_date, $party_responsible, $status, $remarks, $task_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Task updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update task: ' . $stmt->error]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Delete task
    $data = json_decode(file_get_contents('php://input'), true);
    
    $task_id = intval($data['task_id'] ?? 0);
    
    if (!$task_id) {
        echo json_encode(['success' => false, 'message' => 'Task ID is required']);
        exit;
    }
    
    $query = "DELETE FROM event_tasks WHERE task_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $task_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Task deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete task: ' . $stmt->error]);
    }
}
else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
