<?php
// KPI Settings API - Save and retrieve KPI dashboard data

error_reporting(E_ALL);
ini_set('display_errors', 0);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

require_once '../config/db.php';

// Get user info from headers
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

// Check event access
function checkEventAccess($conn, $event_id, $userInfo) {
    // Admins have access to all events
    if ($userInfo['role'] === 'ADMIN' || $userInfo['role'] === 'admin') {
        return true;
    }
    
    // Coordinators can only access their own events
    if (($userInfo['role'] === 'COORDINATOR' || $userInfo['role'] === 'coordinator') && $userInfo['coordinator_id']) {
        // Check if assigned directly via coordinator_id column
        $query = "SELECT event_id FROM events WHERE event_id = ? AND coordinator_id = ?";
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return false;
        }
        $stmt->bind_param('ii', $event_id, $userInfo['coordinator_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            return true;
        }
        
        // Check if event_coordinators junction table exists
        $junctionTableExists = $conn->query("SHOW TABLES LIKE 'event_coordinators'");
        if ($junctionTableExists && $junctionTableExists->num_rows > 0) {
            // Check if assigned via junction table
            $junctionQuery = "SELECT event_id FROM event_coordinators WHERE event_id = ? AND coordinator_id = ?";
            $junctionStmt = $conn->prepare($junctionQuery);
            if ($junctionStmt) {
                $junctionStmt->bind_param('ii', $event_id, $userInfo['coordinator_id']);
                $junctionStmt->execute();
                $junctionResult = $junctionStmt->get_result();
                $hasAccess = $junctionResult->num_rows > 0;
                $junctionStmt->close();
                return $hasAccess;
            }
        }
    }
    
    return false;
}

// Ensure KPI settings table exists
function ensureKPITable($conn) {
    $checkTable = "SHOW TABLES LIKE 'kpi_settings'";
    $result = $conn->query($checkTable);
    
    if ($result->num_rows == 0) {
        $createTable = "CREATE TABLE kpi_settings (
            kpi_id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            target_attendees INT DEFAULT 0,
            projected_walk_in INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
            UNIQUE KEY unique_event (event_id)
        )";
        
        if (!$conn->query($createTable)) {
            error_log("Warning: Could not create kpi_settings table: " . $conn->error);
        }
    }
}

// Determine request method
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? ($method === 'POST' ? 'save' : 'get'));

ensureKPITable($conn);
$userInfo = getUserInfo();

if ($method === 'GET' && $action === 'get') {
    // GET KPI settings for an event
    $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;
    
    if (!$event_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'event_id is required']);
        exit;
    }
    
    // Check access
    if (!checkEventAccess($conn, $event_id, $userInfo)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
    
    // Get KPI data
    $query = "SELECT kpi_id, event_id, target_attendees, projected_walk_in, created_at, updated_at 
              FROM kpi_settings WHERE event_id = ?";
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param('i', $event_id);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Query error: ' . $stmt->error]);
        exit;
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $kpiData = $result->fetch_assoc();
        echo json_encode(['success' => true, 'data' => $kpiData]);
    } else {
        // No KPI data found - return empty
        echo json_encode(['success' => true, 'data' => null]);
    }
    
} elseif ($method === 'POST' && $action === 'save') {
    // SAVE KPI settings for an event
    $data = json_decode(file_get_contents('php://input'), true);
    
    $event_id = intval($data['event_id'] ?? 0);
    $target_attendees = intval($data['target_attendees'] ?? 0);
    $projected_walk_in = intval($data['projected_walk_in'] ?? 0);
    
    if (!$event_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'event_id is required']);
        exit;
    }
    
    if ($target_attendees < 0 || $projected_walk_in < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Numbers cannot be negative']);
        exit;
    }
    
    // Check access
    if (!checkEventAccess($conn, $event_id, $userInfo)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
    
    // Insert or update KPI
    $query = "INSERT INTO kpi_settings (event_id, target_attendees, projected_walk_in)
              VALUES (?, ?, ?)
              ON DUPLICATE KEY UPDATE
              target_attendees = VALUES(target_attendees),
              projected_walk_in = VALUES(projected_walk_in),
              updated_at = CURRENT_TIMESTAMP";
    
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param('iii', $event_id, $target_attendees, $projected_walk_in);
    
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Save error: ' . $stmt->error]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'KPI settings saved successfully',
        'data' => [
            'event_id' => $event_id,
            'target_attendees' => $target_attendees,
            'projected_walk_in' => $projected_walk_in
        ]
    ]);
    
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action or method']);
}
?>
