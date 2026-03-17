<?php
// Program Items API
header('Content-Type: application/json');

require_once '../config/db.php';

function getUserInfo() {
    // Get user info from headers (sent by admin.js)
    $user_role = $_SERVER['HTTP_X_USER_ROLE'] ?? '';
    $user_id = $_SERVER['HTTP_X_USER_ID'] ?? '';
    $coordinator_id = $_SERVER['HTTP_X_COORDINATOR_ID'] ?? '';
    
    return [
        'id' => intval($user_id),
        'role' => $user_role,
        'coordinator_id' => intval($coordinator_id)
    ];
}

function checkEventAccess($conn, $event_id, $userInfo) {
    // Allow access for admins
    if (strtolower($userInfo['role']) === 'admin' || $userInfo['role'] === 'Admin' || $userInfo['role'] === 'ADMIN') {
        return true;
    }
    
    // Check if assigned directly via coordinator_id column
    $query = "SELECT coordinator_id FROM events WHERE event_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $event = $result->fetch_assoc();
    
    if ($event && $event['coordinator_id'] == $userInfo['coordinator_id']) {
        return true;
    }
    
    // Check if event_coordinators junction table exists
    $junctionTableExists = $conn->query("SHOW TABLES LIKE 'event_coordinators'");
    if ($junctionTableExists && $junctionTableExists->num_rows > 0) {
        // Check if assigned via junction table
        $junctionQuery = "SELECT event_id FROM event_coordinators WHERE event_id = ? AND coordinator_id = ?";
        $junctionStmt = $conn->prepare($junctionQuery);
        if ($junctionStmt) {
            $coord_id = $userInfo['coordinator_id'];
            $junctionStmt->bind_param('ii', $event_id, $coord_id);
            $junctionStmt->execute();
            $junctionResult = $junctionStmt->get_result();
            $hasAccess = $junctionResult->num_rows > 0;
            $junctionStmt->close();
            return $hasAccess;
        }
    }
    
    return false;
}

// Create tables if they don't exist
$create_timeline_table = "CREATE TABLE IF NOT EXISTS event_timeline (
    timeline_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    entry_type VARCHAR(50),
    week_number INT,
    month VARCHAR(50),
    title VARCHAR(255),
    description LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    INDEX idx_event (event_id)
)";

$create_program_flow_table = "CREATE TABLE IF NOT EXISTS event_program_flow (
    flow_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    time VARCHAR(50),
    location VARCHAR(255),
    activity VARCHAR(255),
    time_frame VARCHAR(50),
    speaker VARCHAR(255),
    duration_mins INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    INDEX idx_event (event_id)
)";

$conn->query($create_timeline_table);
$conn->query($create_program_flow_table);

// Ensure new columns exist in event_timeline table (for existing databases)
$result = $conn->query("SHOW COLUMNS FROM event_timeline LIKE 'entry_type'");
if ($result && $result->num_rows == 0) {
    $conn->query("ALTER TABLE event_timeline ADD COLUMN entry_type VARCHAR(50) DEFAULT 'timeline' AFTER event_id");
}

$result = $conn->query("SHOW COLUMNS FROM event_timeline LIKE 'month'");
if ($result && $result->num_rows == 0) {
    $conn->query("ALTER TABLE event_timeline ADD COLUMN month VARCHAR(50) AFTER entry_type");
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $event_id = intval($_GET['event_id'] ?? 0);
    
    $userInfo = getUserInfo();
    
    if (!$event_id) {
        echo json_encode(['success' => false, 'message' => 'Event ID is required']);
        exit;
    }
    
    if (!checkEventAccess($conn, $event_id, $userInfo)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
    
    if ($action === 'list-timeline') {
        $query = "SELECT * FROM event_timeline WHERE event_id = ? ORDER BY week_number ASC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $items]);
    }
    elseif ($action === 'list-flow') {
        $query = "SELECT * FROM event_program_flow WHERE event_id = ? ORDER BY time ASC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $items]);
    }
    elseif ($action === 'get-timeline') {
        $timeline_id = intval($_GET['timeline_id'] ?? 0);
        $query = "SELECT * FROM event_timeline WHERE timeline_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $timeline_id, $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $item = $result->fetch_assoc();
        
        if ($item) {
            echo json_encode(['success' => true, 'data' => $item]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Item not found']);
        }
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? 'create';
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userInfo = getUserInfo();
    $event_id = intval($data['event_id'] ?? 0);
    
    if (!$event_id) {
        echo json_encode(['success' => false, 'message' => 'Event ID is required']);
        exit;
    }
    
    if (!checkEventAccess($conn, $event_id, $userInfo)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
    
    if ($action === 'create-timeline') {
        $entry_type = $data['entry_type'] ?? 'timeline';
        $week_number = intval($data['week_number'] ?? 0);
        $month = $data['month'] ?? '';
        $title = $data['title'] ?? '';
        $description = $data['description'] ?? '';
        
        if (!$title) {
            echo json_encode(['success' => false, 'message' => 'Title is required']);
            exit;
        }
        
        $query = "INSERT INTO event_timeline (event_id, entry_type, week_number, month, title, description) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('isisss', $event_id, $entry_type, $week_number, $month, $title, $description);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Timeline item created', 'timeline_id' => $conn->insert_id]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create: ' . $stmt->error]);
        }
    }
    elseif ($action === 'create-flow') {
        $time = $data['time'] ?? '';
        $location = $data['location'] ?? '';
        $activity = $data['activity'] ?? '';
        $time_frame = $data['time_frame'] ?? '';
        $speaker = $data['speaker'] ?? '';
        $duration_mins = intval($data['duration_mins'] ?? 0);
        
        if (!$time || !$activity) {
            echo json_encode(['success' => false, 'message' => 'Time and Activity are required']);
            exit;
        }
        
        $query = "INSERT INTO event_program_flow (event_id, time, location, activity, time_frame, speaker, duration_mins) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('isssssi', $event_id, $time, $location, $activity, $time_frame, $speaker, $duration_mins);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Program flow item created', 'flow_id' => $conn->insert_id]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create: ' . $stmt->error]);
        }
    }
    elseif ($action === 'update-timeline') {
        $timeline_id = intval($data['timeline_id'] ?? 0);
        $entry_type = $data['entry_type'] ?? 'timeline';
        $week_number = intval($data['week_number'] ?? 0);
        $month = $data['month'] ?? '';
        $title = $data['title'] ?? '';
        $description = $data['description'] ?? '';
        
        if (!$timeline_id) {
            echo json_encode(['success' => false, 'message' => 'Timeline ID is required']);
            exit;
        }
        
        $query = "UPDATE event_timeline SET entry_type = ?, week_number = ?, month = ?, title = ?, description = ? WHERE timeline_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('sisssii', $entry_type, $week_number, $month, $title, $description, $timeline_id, $event_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Timeline item updated']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update: ' . $stmt->error]);
        }
    }
    elseif ($action === 'update-flow') {
        $flow_id = intval($data['flow_id'] ?? 0);
        $time = $data['time'] ?? '';
        $location = $data['location'] ?? '';
        $activity = $data['activity'] ?? '';
        $time_frame = $data['time_frame'] ?? '';
        $speaker = $data['speaker'] ?? '';
        $duration_mins = intval($data['duration_mins'] ?? 0);
        
        if (!$flow_id) {
            echo json_encode(['success' => false, 'message' => 'Flow ID is required']);
            exit;
        }
        
        $query = "UPDATE event_program_flow SET time = ?, location = ?, activity = ?, time_frame = ?, speaker = ?, duration_mins = ? 
                  WHERE flow_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('sssssiii', $time, $location, $activity, $time_frame, $speaker, $duration_mins, $flow_id, $event_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Program flow item updated']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update: ' . $stmt->error]);
        }
    }
    elseif ($action === 'delete-timeline') {
        $timeline_id = intval($data['timeline_id'] ?? 0);
        
        if (!$timeline_id) {
            echo json_encode(['success' => false, 'message' => 'Timeline ID is required']);
            exit;
        }
        
        $query = "DELETE FROM event_timeline WHERE timeline_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $timeline_id, $event_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Timeline item deleted']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete']);
        }
    }
    elseif ($action === 'delete-flow') {
        $flow_id = intval($data['flow_id'] ?? 0);
        
        if (!$flow_id) {
            echo json_encode(['success' => false, 'message' => 'Flow ID is required']);
            exit;
        }
        
        $query = "DELETE FROM event_program_flow WHERE flow_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $flow_id, $event_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Program flow item deleted']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete']);
        }
    }
}
else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
