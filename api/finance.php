<?php
// Finance API for expenses tracking
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

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
        try {
            // Get event name and budget for this event
            $budget_query = "SELECT event_name, budget FROM events WHERE event_id = ?";
            $budget_stmt = $conn->prepare($budget_query);
            
            if (!$budget_stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            
            $budget_stmt->bind_param('i', $event_id);
            $budget_stmt->execute();
            $budget_result = $budget_stmt->get_result();
            $budget_row = $budget_result->fetch_assoc();
            $event_name = $budget_row['event_name'] ?? 'Event ' . $event_id;
            $budget = floatval($budget_row['budget'] ?? 0);
            $budget_stmt->close();
            
            // Get expenses
            $query = "SELECT * FROM event_expenses WHERE event_id = ? ORDER BY created_at DESC";
            $stmt = $conn->prepare($query);
            
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            
            $stmt->bind_param('i', $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $items = [];
            $total = 0;
            
            while ($row = $result->fetch_assoc()) {
                $items[] = $row;
                $total += floatval($row['total']);
            }
            $stmt->close();
            
            $balance = $budget - $total;
            
            echo json_encode([
                'success' => true,
                'data' => $items,
                'grand_total' => $total,
                'budget' => $budget,
                'balance' => $balance,
                'event_name' => $event_name
            ]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
            exit;
        }
    } else if ($action === 'get_budget') {
        try {
            $query = "SELECT budget FROM events WHERE event_id = ?";
            $stmt = $conn->prepare($query);
            
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            
            $stmt->bind_param('i', $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $event_row = $result->fetch_assoc();
            $stmt->close();
            
            if ($event_row) {
                // Also get total expenses
                $total_query = "SELECT COALESCE(SUM(quantity * unit_price), 0) as total_expenses FROM event_expenses WHERE event_id = ?";
                $total_stmt = $conn->prepare($total_query);
                
                if (!$total_stmt) {
                    throw new Exception('Prepare failed: ' . $conn->error);
                }
                
                $total_stmt->bind_param('i', $event_id);
                $total_stmt->execute();
                $total_result = $total_stmt->get_result();
                $total_row = $total_result->fetch_assoc();
                $total_stmt->close();
                
                $total_expenses = floatval($total_row['total_expenses'] ?? 0);
                $budget = floatval($event_row['budget'] ?? 0);
                
                echo json_encode([
                    'success' => true,
                    'budget' => $budget,
                    'total_expenses' => $total_expenses,
                    'balance' => $budget - $total_expenses
                ]);
            } else {
                // Event not found
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
            }
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
            exit;
        }
    } else if ($action === 'get') {
        try {
            $expense_id = intval($_GET['expense_id'] ?? 0);
            
            if (!$expense_id) {
                throw new Exception('Expense ID is required');
            }
            
            $query = "SELECT * FROM event_expenses WHERE expense_id = ? AND event_id = ?";
            $stmt = $conn->prepare($query);
            
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            
            $stmt->bind_param('ii', $expense_id, $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $item = $result->fetch_assoc();
            $stmt->close();
            
            if ($item) {
                echo json_encode(['success' => true, 'data' => $item]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Expense not found']);
            }
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
            exit;
        }
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
    } else if ($action === 'set_budget') {
        try {
            $budget = floatval($data['budget'] ?? 0);
            
            if ($budget < 0) {
                echo json_encode(['success' => false, 'message' => 'Budget cannot be negative']);
                exit;
            }
            
            // Update budget in events table
            $query = "UPDATE events SET budget = ? WHERE event_id = ?";
            $stmt = $conn->prepare($query);
            
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            
            $stmt->bind_param('di', $budget, $event_id);
            
            if ($stmt->execute()) {
                $stmt->close();
                echo json_encode([
                    'success' => true,
                    'message' => 'Budget updated',
                    'budget' => $budget
                ]);
            } else {
                throw new Exception('Error updating budget: ' . $stmt->error);
            }
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
            exit;
        }
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
