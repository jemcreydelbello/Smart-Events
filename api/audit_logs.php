<?php
header('Content-Type: application/json');
require_once '../config/db.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

// GET - Retrieve audit logs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if ($action === 'list') {
            // Get all audit logs with user/admin info and profile images
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $perPage = 50;
            $offset = ($page - 1) * $perPage;
            
            $query = "SELECT al.audit_id, al.user_id, al.admin_id,
                      COALESCE(ad.full_name, u.full_name) as full_name,
                      COALESCE(ad.email, u.email) as email,
                      IF(ad.admin_image IS NOT NULL, CONCAT('../uploads/', ad.admin_image), NULL) as admin_image,
                      al.action_type, al.action_description, al.ip_address, al.created_at
                      FROM audit_logs al
                      LEFT JOIN users u ON al.user_id = u.user_id
                      LEFT JOIN admins ad ON al.admin_id = ad.admin_id
                      ORDER BY al.created_at DESC
                      LIMIT ? OFFSET ?";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param('ii', $perPage, $offset);
            $stmt->execute();
            $result = $stmt->get_result();
            $logs = [];
            
            while ($row = $result->fetch_assoc()) {
                $logs[] = $row;
            }
            
            // Get total count
            $countQuery = "SELECT COUNT(*) as total FROM audit_logs";
            $countResult = $conn->query($countQuery);
            $countRow = $countResult->fetch_assoc();
            
            echo json_encode([
                'success' => true,
                'data' => $logs,
                'total' => $countRow['total'],
                'page' => $page,
                'perPage' => $perPage
            ]);
        }
        else if ($action === 'search' && isset($_GET['q'])) {
            $searchTerm = '%' . $_GET['q'] . '%';
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $perPage = 50;
            $offset = ($page - 1) * $perPage;
            
            $query = "SELECT al.audit_id, al.user_id, al.admin_id,
                      COALESCE(ad.full_name, u.full_name) as full_name,
                      COALESCE(ad.email, u.email) as email,
                      IF(ad.admin_image IS NOT NULL, CONCAT('../uploads/', ad.admin_image), NULL) as admin_image,
                      al.action_type, al.action_description, al.ip_address, al.created_at
                      FROM audit_logs al
                      LEFT JOIN users u ON al.user_id = u.user_id
                      LEFT JOIN admins ad ON al.admin_id = ad.admin_id
                      WHERE COALESCE(ad.full_name, u.full_name) LIKE ? OR COALESCE(ad.email, u.email) LIKE ? OR al.action_type LIKE ? OR al.action_description LIKE ?
                      ORDER BY al.created_at DESC
                      LIMIT ? OFFSET ?";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param('ssssii', $searchTerm, $searchTerm, $searchTerm, $searchTerm, $perPage, $offset);
            $stmt->execute();
            $result = $stmt->get_result();
            $logs = [];
            
            while ($row = $result->fetch_assoc()) {
                $logs[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $logs,
                'page' => $page,
                'perPage' => $perPage
            ]);
        }
        else if ($action === 'filter_action' && isset($_GET['action_type'])) {
            $actionType = $_GET['action_type'];
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $perPage = 50;
            $offset = ($page - 1) * $perPage;
            
            $query = "SELECT al.audit_id, al.user_id, al.admin_id,
                      COALESCE(ad.full_name, u.full_name) as full_name,
                      COALESCE(ad.email, u.email) as email,
                      IF(ad.admin_image IS NOT NULL, CONCAT('../uploads/', ad.admin_image), NULL) as admin_image,
                      al.action_type, al.action_description, al.ip_address, al.created_at
                      FROM audit_logs al
                      LEFT JOIN users u ON al.user_id = u.user_id
                      LEFT JOIN admins ad ON al.admin_id = ad.admin_id
                      WHERE al.action_type = ?
                      ORDER BY al.created_at DESC
                      LIMIT ? OFFSET ?";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param('sii', $actionType, $perPage, $offset);
            $stmt->execute();
            $result = $stmt->get_result();
            $logs = [];
            
            while ($row = $result->fetch_assoc()) {
                $logs[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $logs,
                'page' => $page,
                'perPage' => $perPage
            ]);
        }
        else if ($action === 'get_actions') {
            // Get unique action types for filtering
            $query = "SELECT DISTINCT action_type FROM audit_logs ORDER BY action_type";
            $result = $conn->query($query);
            $actions = [];
            
            while ($row = $result->fetch_assoc()) {
                $actions[] = $row['action_type'];
            }
            
            echo json_encode([
                'success' => true,
                'data' => $actions
            ]);
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// POST - Create audit log entry
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = file_get_contents('php://input');
        
        // Check if input is empty
        if (empty($input)) {
            error_log("Audit log POST - empty input");
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Empty request body']);
            exit;
        }
        
        // Decode JSON
        $data = json_decode($input, true);
        
        // Check for JSON decode errors
        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON decode error: " . json_last_error_msg() . " | Input: " . substr($input, 0, 200));
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON: ' . json_last_error_msg()]);
            exit;
        }
        
        // Log the received data for debugging
        error_log("Audit log POST data: " . json_encode($data));
        
        // Extract and sanitize data
        $user_id = isset($data['user_id']) && !empty($data['user_id']) ? intval($data['user_id']) : null;
        $admin_id = isset($data['admin_id']) && !empty($data['admin_id']) ? intval($data['admin_id']) : null;
        $action_type = isset($data['action_type']) ? trim(strval($data['action_type'])) : '';
        $action_description = isset($data['action_description']) ? trim(strval($data['action_description'])) : '';
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $user_agent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 500);
        
        // Validate required fields
        if (empty($action_type)) {
            error_log("Audit log validation failed - action_type is empty");
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'action_type is required']);
            exit;
        }
        
        if (empty($action_description)) {
            error_log("Audit log validation failed - action_description is empty");
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'action_description is required']);
            exit;
        }
        
        // Build INSERT query based on available IDs
        if ($user_id && $admin_id) {
            // Both user and admin
            $query = "INSERT INTO audit_logs (user_id, admin_id, action_type, action_description, ip_address, user_agent)
                      VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $stmt->bind_param('iissss', $user_id, $admin_id, $action_type, $action_description, $ip_address, $user_agent);
        } elseif ($user_id) {
            // Only user
            $query = "INSERT INTO audit_logs (user_id, action_type, action_description, ip_address, user_agent)
                      VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $stmt->bind_param('issss', $user_id, $action_type, $action_description, $ip_address, $user_agent);
        } elseif ($admin_id) {
            // Only admin
            $query = "INSERT INTO audit_logs (admin_id, action_type, action_description, ip_address, user_agent)
                      VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $stmt->bind_param('issss', $admin_id, $action_type, $action_description, $ip_address, $user_agent);
        } else {
            // Neither user nor admin - still log it
            $query = "INSERT INTO audit_logs (action_type, action_description, ip_address, user_agent)
                      VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $stmt->bind_param('ssss', $action_type, $action_description, $ip_address, $user_agent);
        }
        
        if (!$stmt->execute()) {
            error_log("Audit log insert failed: " . $stmt->error);
            throw new Exception('Failed to create audit log: ' . $stmt->error);
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Audit log created successfully',
            'audit_id' => $conn->insert_id
        ]);
        
    } catch (Exception $e) {
        error_log("Audit log exception: " . $e->getMessage());
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>
