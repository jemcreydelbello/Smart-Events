<?php
// Logistics API
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

// Create logistics table if it doesn't exist
$create_logistics_table = "CREATE TABLE IF NOT EXISTS event_logistics (
    logistics_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    item VARCHAR(255) NOT NULL,
    partner VARCHAR(255),
    quantity INT DEFAULT 1,
    schedule_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    notes LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    INDEX idx_event (event_id),
    INDEX idx_category (category),
    INDEX idx_status (status)
)";

$conn->query($create_logistics_table);

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
    
    if ($action === 'list') {
        $query = "SELECT * FROM event_logistics WHERE event_id = ? ORDER BY schedule_date ASC, created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $items = [];
        
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $items
        ]);
        exit;
    } else if ($action === 'get') {
        $logistics_id = intval($_GET['logistics_id'] ?? 0);
        $query = "SELECT * FROM event_logistics WHERE logistics_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $logistics_id, $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $item = $result->fetch_assoc();
        
        if ($item) {
            echo json_encode(['success' => true, 'data' => $item]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Logistics item not found']);
        }
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? '';
    
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
    
    if ($action === 'create') {
        $category = $data['category'] ?? '';
        $item = $data['item'] ?? '';
        $partner = $data['partner'] ?? '';
        $quantity = intval($data['quantity'] ?? 1);
        $schedule_date = $data['schedule_date'] ?? null;
        $status = $data['status'] ?? 'Pending';
        $notes = $data['notes'] ?? '';
        
        if (!$category || !$item) {
            echo json_encode(['success' => false, 'message' => 'Category and Item are required']);
            exit;
        }
        
        $query = "INSERT INTO event_logistics (event_id, category, item, partner, quantity, schedule_date, status, notes) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        
        if ($schedule_date === '' || $schedule_date === null) {
            $schedule_date = null;
        }
        
        // Bind parameters: i=int, s=string
        // event_id(i), category(s), item(s), partner(s), quantity(i), schedule_date(s), status(s), notes(s)
        $stmt->bind_param('isssisss', $event_id, $category, $item, $partner, $quantity, $schedule_date, $status, $notes);
        
        if ($stmt->execute()) {
            $logistics_id = $conn->insert_id;
            echo json_encode([
                'success' => true,
                'message' => 'Logistics item created',
                'logistics_id' => $logistics_id
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating logistics item: ' . $stmt->error]);
        }
        exit;
    } else if ($action === 'update') {
        $logistics_id = intval($data['logistics_id'] ?? 0);
        
        if (!$logistics_id) {
            echo json_encode(['success' => false, 'message' => 'Logistics ID is required']);
            exit;
        }
        
        // Verify ownership
        $check_query = "SELECT event_id FROM event_logistics WHERE logistics_id = ?";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bind_param('i', $logistics_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        $item_check = $check_result->fetch_assoc();
        
        if (!$item_check || $item_check['event_id'] != $event_id) {
            echo json_encode(['success' => false, 'message' => 'Logistics item not found']);
            exit;
        }
        
        $category = $data['category'] ?? '';
        $item = $data['item'] ?? '';
        $partner = $data['partner'] ?? '';
        $quantity = intval($data['quantity'] ?? 1);
        $schedule_date = $data['schedule_date'] ?? null;
        $status = $data['status'] ?? 'Pending';
        $notes = $data['notes'] ?? '';
        
        if (!$category || !$item) {
            echo json_encode(['success' => false, 'message' => 'Category and Item are required']);
            exit;
        }
        
        $query = "UPDATE event_logistics SET category = ?, item = ?, partner = ?, quantity = ?, schedule_date = ?, status = ?, notes = ?, updated_at = NOW() 
                  WHERE logistics_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        
        if ($schedule_date === '' || $schedule_date === null) {
            $schedule_date = null;
        }
        
        // Bind parameters: s,s,s,i,s,s,s for SET clause, then i,i for WHERE clause
        $stmt->bind_param('sssisssii', $category, $item, $partner, $quantity, $schedule_date, $status, $notes, $logistics_id, $event_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Logistics item updated'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating logistics item: ' . $stmt->error]);
        }
        exit;
    } else if ($action === 'delete') {
        $logistics_id = intval($data['logistics_id'] ?? 0);
        
        if (!$logistics_id) {
            echo json_encode(['success' => false, 'message' => 'Logistics ID is required']);
            exit;
        }
        
        // Verify ownership
        $check_query = "SELECT event_id FROM event_logistics WHERE logistics_id = ?";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bind_param('i', $logistics_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        $item_check = $check_result->fetch_assoc();
        
        if (!$item_check || $item_check['event_id'] != $event_id) {
            echo json_encode(['success' => false, 'message' => 'Logistics item not found']);
            exit;
        }
        
        $query = "DELETE FROM event_logistics WHERE logistics_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $logistics_id, $event_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Logistics item deleted'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting logistics item']);
        }
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
