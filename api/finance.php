<?php
// Finance API for expenses tracking
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
    
    $query = "SELECT coordinator_id FROM events WHERE event_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $event = $result->fetch_assoc();
    
    return $event && $event['coordinator_id'] == $userInfo['coordinator_id'];
}

// Create finance/expenses table if it doesn't exist
$create_finance_table = "CREATE TABLE IF NOT EXISTS event_expenses (
    expense_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    INDEX idx_event (event_id)
)";

$conn->query($create_finance_table);

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
        $query = "SELECT * FROM event_expenses WHERE event_id = ? ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $items = [];
        $total = 0;
        
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
            $total += floatval($row['total']);
        }
        
        echo json_encode([
            'success' => true,
            'data' => $items,
            'grand_total' => $total
        ]);
        exit;
    } else if ($action === 'get') {
        $expense_id = intval($_GET['expense_id'] ?? 0);
        $query = "SELECT * FROM event_expenses WHERE expense_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $expense_id, $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $item = $result->fetch_assoc();
        
        if ($item) {
            echo json_encode(['success' => true, 'data' => $item]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Expense not found']);
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
        $description = $data['description'] ?? '';
        $quantity = intval($data['quantity'] ?? 1);
        $unit_price = floatval($data['unit_price'] ?? 0);
        
        if (!$description || $unit_price <= 0) {
            echo json_encode(['success' => false, 'message' => 'Description and Unit Price are required']);
            exit;
        }
        
        $query = "INSERT INTO event_expenses (event_id, description, quantity, unit_price) 
                  VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('isid', $event_id, $description, $quantity, $unit_price);
        
        if ($stmt->execute()) {
            $expense_id = $conn->insert_id;
            $total = $quantity * $unit_price;
            echo json_encode([
                'success' => true,
                'message' => 'Expense created',
                'expense_id' => $expense_id,
                'total' => $total
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating expense: ' . $stmt->error]);
        }
        exit;
    } else if ($action === 'update') {
        $expense_id = intval($data['expense_id'] ?? 0);
        
        if (!$expense_id) {
            echo json_encode(['success' => false, 'message' => 'Expense ID is required']);
            exit;
        }
        
        // Verify ownership
        $check_query = "SELECT event_id FROM event_expenses WHERE expense_id = ?";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bind_param('i', $expense_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        $item_check = $check_result->fetch_assoc();
        
        if (!$item_check || $item_check['event_id'] != $event_id) {
            echo json_encode(['success' => false, 'message' => 'Expense not found']);
            exit;
        }
        
        $description = $data['description'] ?? '';
        $quantity = intval($data['quantity'] ?? 1);
        $unit_price = floatval($data['unit_price'] ?? 0);
        
        if (!$description || $unit_price <= 0) {
            echo json_encode(['success' => false, 'message' => 'Description and Unit Price are required']);
            exit;
        }
        
        $query = "UPDATE event_expenses SET description = ?, quantity = ?, unit_price = ?, updated_at = NOW() 
                  WHERE expense_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('sidii', $description, $quantity, $unit_price, $expense_id, $event_id);
        
        if ($stmt->execute()) {
            $total = $quantity * $unit_price;
            echo json_encode([
                'success' => true,
                'message' => 'Expense updated',
                'total' => $total
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating expense: ' . $stmt->error]);
        }
        exit;
    } else if ($action === 'delete') {
        $expense_id = intval($data['expense_id'] ?? 0);
        
        if (!$expense_id) {
            echo json_encode(['success' => false, 'message' => 'Expense ID is required']);
            exit;
        }
        
        // Verify ownership
        $check_query = "SELECT event_id FROM event_expenses WHERE expense_id = ?";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bind_param('i', $expense_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        $item_check = $check_result->fetch_assoc();
        
        if (!$item_check || $item_check['event_id'] != $event_id) {
            echo json_encode(['success' => false, 'message' => 'Expense not found']);
            exit;
        }
        
        $query = "DELETE FROM event_expenses WHERE expense_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $expense_id, $event_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Expense deleted'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting expense']);
        }
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
