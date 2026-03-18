<?php
// Error handling
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
    
    // Create email_blasts table if not exists
    $check_table = "CREATE TABLE IF NOT EXISTS email_blasts (
        email_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        email_blast_name VARCHAR(255) NOT NULL,
        audience VARCHAR(255) NOT NULL,
        details TEXT,
        status ENUM('Draft', 'Scheduled', 'Sent', 'Cancelled') DEFAULT 'Draft',
        scheduled_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id),
        INDEX idx_status (status),
        INDEX idx_scheduled_date (scheduled_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $conn->query($check_table);
    
    // Create email_templates table if not exists
    $templates_table = "CREATE TABLE IF NOT EXISTS email_templates (
        template_id INT AUTO_INCREMENT PRIMARY KEY,
        template_name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        recipients VARCHAR(255),
        body LONGTEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_template_name (template_name),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $conn->query($templates_table);
    
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Helper function - check coordinator access
function coordinatorHasAccessToEvent($conn, $event_id, $coordinator_id) {
    // Check if assigned directly via coordinator_id column
    $query = "SELECT event_id FROM events WHERE event_id = ? AND coordinator_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $event_id, $coordinator_id);
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
        $junctionStmt->bind_param('ii', $event_id, $coordinator_id);
        $junctionStmt->execute();
        $junctionResult = $junctionStmt->get_result();
        $hasAccess = $junctionResult->num_rows > 0;
        $junctionStmt->close();
        return $hasAccess;
    }
    
    return false;
}

// Get user info from headers
$user_role = $_SERVER['HTTP_X_USER_ROLE'] ?? '';
$user_id = $_SERVER['HTTP_X_USER_ID'] ?? '';
$coordinator_id = $_SERVER['HTTP_X_COORDINATOR_ID'] ?? '';

// Debug: Log all received headers
error_log('[EMAILS API] ========== REQUEST DEBUG ==========');
error_log('[EMAILS API] Headers received:');
error_log('[EMAILS API]  - X-User-Role: "' . $user_role . '"');
error_log('[EMAILS API]  - X-User-Id: "' . $user_id . '"');
error_log('[EMAILS API]  - X-Coordinator-Id: "' . $coordinator_id . '"');
error_log('[EMAILS API]  - Request method: ' . $_SERVER['REQUEST_METHOD']);

header('Content-Type: application/json');

// Parse request body once (for POST requests with JSON)
$json_data = null;
$request_body = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $request_body = file_get_contents("php://input");
    if ($request_body) {
        $json_data = json_decode($request_body, true);
    }
}

// Get action from GET, POST variables, or JSON body
$action = $_GET['action'] ?? $_POST['action'] ?? '';
if (!$action && $json_data && isset($json_data['action'])) {
    $action = $json_data['action'];
}

error_log('[EMAILS API]  - Action: ' . ($action ?? 'NONE'));

try {
    switch ($action) {
        case 'list':
            // Get all email blasts for an event
            $event_id = intval($_GET['event_id'] ?? 0);
            
            if (!$event_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'event_id is required']);
                exit;
            }
            
            error_log('[EMAILS API] LIST - event_id=' . $event_id);
            
            // Check access - be lenient for admin panel users
            $isAdmin = (strtolower($user_role) === 'admin' || strtolower($user_role) === 'super admin' || $user_role === 'Admin');
            
            error_log('[EMAILS API] isAdmin (role="' . $user_role . '"): ' . ($isAdmin ? 'YES' : 'NO'));
            
            if (!$isAdmin) {
                error_log('[EMAILS API] Not admin, checking coordinator access...');
                $hasAccess = coordinatorHasAccessToEvent($conn, $event_id, intval($coordinator_id));
                error_log('[EMAILS API] Coordinator #' . $coordinator_id . ' has access to event #' . $event_id . ': ' . ($hasAccess ? 'YES' : 'NO'));
                
                if (!$hasAccess) {
                    http_response_code(403);
                    error_log('[EMAILS API] ❌ DENIED - User role="' . $user_role . '" is not admin, and coordinator #' . $coordinator_id . ' has no access to event #' . $event_id);
                    echo json_encode(['success' => false, 'message' => 'Access denied - insufficient permissions']);
                    exit;
                }
            } else {
                error_log('[EMAILS API] ✓ Admin access granted');
            }
            
            $query = "SELECT * FROM email_blasts WHERE event_id = ? ORDER BY created_at DESC";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $emails = [];
            while ($row = $result->fetch_assoc()) {
                $emails[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $emails]);
            break;
            
        case 'get':
            // Get a single email blast
            $email_id = intval($_GET['email_id'] ?? 0);
            
            if (!$email_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'email_id is required']);
                exit;
            }
            
            // Get email and check access
            $query = "SELECT eb.*, e.coordinator_id FROM email_blasts eb 
                     JOIN events e ON eb.event_id = e.event_id 
                     WHERE eb.email_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $email_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Email not found']);
                exit;
            }
            
            $email = $result->fetch_assoc();
            $event_id = $email['event_id'];
            $email_coordinator = $email['coordinator_id'];
            
            // Check access
            $isAdmin = (strtolower($user_role) === 'admin' || strtolower($user_role) === 'super admin' || $user_role === 'Admin');
            
            if (!$isAdmin) {
                // Coordinator can only view their own event emails
                if (intval($coordinator_id) !== intval($email_coordinator)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Access denied']);
                    exit;
                }
            }
            
            // Return email data (remove coordinator_id as it's not part of email_blasts table)
            unset($email['coordinator_id']);
            echo json_encode(['success' => true, 'data' => $email]);
            break;
            
        case 'counts':
            // Get email blast counts by status for an event
            $event_id = intval($_GET['event_id'] ?? 0);
            
            if (!$event_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'event_id is required']);
                exit;
            }
            
            // Check access - be lenient for admin panel users
            $isAdmin = (strtolower($user_role) === 'admin' || strtolower($user_role) === 'super admin' || $user_role === 'Admin');
            
            if (!$isAdmin) {
                $hasAccess = coordinatorHasAccessToEvent($conn, $event_id, intval($coordinator_id));
                if (!$hasAccess) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Access denied - insufficient permissions']);
                    exit;
                }
            }
            
            // Get counts by status
            $query = "SELECT status, COUNT(*) as count FROM email_blasts WHERE event_id = ? GROUP BY status";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $counts = [
                'Sent' => 0,
                'Scheduled' => 0,
                'Draft' => 0,
                'Cancelled' => 0
            ];
            
            while ($row = $result->fetch_assoc()) {
                if (isset($counts[$row['status']])) {
                    $counts[$row['status']] = intval($row['count']);
                }
            }
            
            echo json_encode(['success' => true, 'data' => $counts]);
            break;
            
        case 'create':
            // Create new email blast
            $data = json_decode(file_get_contents('php://input'), true);
            
            $event_id = intval($data['event_id'] ?? 0);
            $email_blast_name = trim($data['email_blast_name'] ?? '');
            $audience = trim($data['audience'] ?? '');
            $details = trim($data['details'] ?? '');
            $status = $data['status'] ?? 'Draft';
            $scheduled_date = $data['scheduled_date'] ?? null;
            
            if (!$event_id || !$email_blast_name || !$audience) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'event_id, email_blast_name, and audience are required']);
                exit;
            }
            
            // Check access - be lenient for admin panel users
            $isAdmin = (strtolower($user_role) === 'admin' || strtolower($user_role) === 'super admin' || $user_role === 'Admin');
            
            if (!$isAdmin) {
                if (!coordinatorHasAccessToEvent($conn, $event_id, intval($coordinator_id))) {
                    http_response_code(403);
                    error_log('[EMAILS API] Access denied on create - role=' . $user_role . ', user_id=' . $user_id . ', event_id=' . $event_id);
                    echo json_encode(['success' => false, 'message' => 'Access denied - insufficient permissions']);
                    exit;
                }
            }
            
            $query = "INSERT INTO email_blasts (event_id, email_blast_name, audience, details, status, scheduled_date) 
                     VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('isssss', $event_id, $email_blast_name, $audience, $details, $status, $scheduled_date);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Email blast created successfully',
                    'data' => [
                        'email_id' => $conn->insert_id,
                        'event_id' => $event_id,
                        'email_blast_name' => $email_blast_name,
                        'audience' => $audience,
                        'details' => $details,
                        'status' => $status,
                        'scheduled_date' => $scheduled_date,
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ]
                ]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Failed to create email blast']);
            }
            break;
            
        case 'update':
            // Update email blast
            $data = json_decode(file_get_contents('php://input'), true);
            
            $email_id = intval($data['email_id'] ?? 0);
            $email_blast_name = trim($data['email_blast_name'] ?? '');
            $audience = trim($data['audience'] ?? '');
            $details = trim($data['details'] ?? '');
            $status = $data['status'] ?? 'Draft';
            $scheduled_date = $data['scheduled_date'] ?? null;
            
            if (!$email_id || !$email_blast_name || !$audience) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'email_id, email_blast_name, and audience are required']);
                exit;
            }
            
            // Get email and check access
            $query = "SELECT event_id FROM email_blasts WHERE email_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $email_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Email not found']);
                exit;
            }
            
            $email = $result->fetch_assoc();
            $event_id = $email['event_id'];
            
            // Check access - be lenient for admin panel users
            $isAdmin = (strtolower($user_role) === 'admin' || strtolower($user_role) === 'super admin' || $user_role === 'Admin');
            
            if (!$isAdmin) {
                if (!coordinatorHasAccessToEvent($conn, $event_id, intval($coordinator_id))) {
                    http_response_code(403);
                    error_log('[EMAILS API] Access denied on update - role=' . $user_role . ', user_id=' . $user_id . ', event_id=' . $event_id);
                    echo json_encode(['success' => false, 'message' => 'Access denied - insufficient permissions']);
                    exit;
                }
            }
            
            $query = "UPDATE email_blasts SET email_blast_name = ?, audience = ?, details = ?, status = ?, scheduled_date = ? WHERE email_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('sssssi', $email_blast_name, $audience, $details, $status, $scheduled_date, $email_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Email blast updated successfully',
                    'data' => [
                        'email_id' => $email_id,
                        'event_id' => $event_id,
                        'email_blast_name' => $email_blast_name,
                        'audience' => $audience,
                        'details' => $details,
                        'status' => $status,
                        'scheduled_date' => $scheduled_date,
                        'updated_at' => date('Y-m-d H:i:s')
                    ]
                ]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Failed to update email blast']);
            }
            break;
            
        case 'update-status':
            // Update only the status of an email blast
            $data = json_decode(file_get_contents('php://input'), true);
            
            $email_id = intval($data['email_id'] ?? 0);
            $status = trim($data['status'] ?? '');
            
            if (!$email_id || !$status) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'email_id and status are required']);
                exit;
            }
            
            // Validate status
            $validStatuses = ['Draft', 'Scheduled', 'Sent', 'Cancelled'];
            if (!in_array($status, $validStatuses)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid status value']);
                exit;
            }
            
            // Get email and check access
            $query = "SELECT event_id FROM email_blasts WHERE email_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $email_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Email not found']);
                exit;
            }
            
            $email = $result->fetch_assoc();
            $event_id = $email['event_id'];
            
            // Check access - be lenient for admin panel users
            $isAdmin = (strtolower($user_role) === 'admin' || strtolower($user_role) === 'super admin' || $user_role === 'Admin');
            
            if (!$isAdmin) {
                if (!coordinatorHasAccessToEvent($conn, $event_id, intval($coordinator_id))) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Access denied - insufficient permissions']);
                    exit;
                }
            }
            
            // Update status only
            $query = "UPDATE email_blasts SET status = ? WHERE email_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('si', $status, $email_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Status updated successfully',
                    'data' => [
                        'email_id' => $email_id,
                        'status' => $status,
                        'updated_at' => date('Y-m-d H:i:s')
                    ]
                ]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Failed to update status']);
            }
            break;
            
        case 'delete':
            // Delete email blast
            $email_id = intval($_GET['email_id'] ?? $_POST['email_id'] ?? 0);
            
            if (!$email_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'email_id is required']);
                exit;
            }
            
            // Get email and check access
            $query = "SELECT event_id FROM email_blasts WHERE email_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $email_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Email not found']);
                exit;
            }
            
            $email = $result->fetch_assoc();
            $event_id = $email['event_id'];
            
            // Check access - be lenient for admin panel users
            $isAdmin = (strtolower($user_role) === 'admin' || strtolower($user_role) === 'super admin' || $user_role === 'Admin');
            
            if (!$isAdmin) {
                if (!coordinatorHasAccessToEvent($conn, $event_id, intval($coordinator_id))) {
                    http_response_code(403);
                    error_log('[EMAILS API] Access denied on delete - role=' . $user_role . ', user_id=' . $user_id . ', event_id=' . $event_id);
                    echo json_encode(['success' => false, 'message' => 'Access denied - insufficient permissions']);
                    exit;
                }
            }
            
            $query = "DELETE FROM email_blasts WHERE email_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $email_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Email blast deleted successfully']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Failed to delete email blast']);
            }
            break;
            
        // ========== EMAIL TEMPLATES ACTIONS ==========
        
        case 'save_template':
            // Save a new email template
            error_log('[TEMPLATES API] Save template action triggered');
            
            $data = $json_data ?? [];
            $template_name = $data['template_name'] ?? '';
            $subject = $data['subject'] ?? '';
            $recipients = $data['recipients'] ?? '';
            $body = $data['body'] ?? '';
            $created_by = $data['created_by'] ?? 'admin';
            
            if (!$template_name || !$subject) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Template name and subject are required']);
                exit;
            }
            
            error_log('[TEMPLATES API] Saving template: ' . $template_name);
            
            $query = "INSERT INTO email_templates (template_name, subject, recipients, body, created_by) 
                     VALUES (?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('sssss', $template_name, $subject, $recipients, $body, $created_by);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Template saved successfully',
                    'template_id' => $stmt->insert_id
                ]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Failed to save template']);
            }
            break;
            
        case 'list_templates':
            // Get all email templates
            error_log('[TEMPLATES API] List templates action triggered');
            
            $query = "SELECT template_id, template_name, subject, recipients, body, created_at, created_by 
                     FROM email_templates ORDER BY created_at DESC";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $templates = [];
            while ($row = $result->fetch_assoc()) {
                $templates[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $templates,
                'count' => count($templates)
            ]);
            break;
            
        case 'get_template':
            // Get a specific email template
            $template_id = intval($_GET['template_id'] ?? 0);
            
            if (!$template_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'template_id is required']);
                exit;
            }
            
            error_log('[TEMPLATES API] Get template #' . $template_id);
            
            $query = "SELECT template_id, template_name, subject, recipients, body, created_at, created_by 
                     FROM email_templates WHERE template_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $template_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                echo json_encode([
                    'success' => true,
                    'data' => $row
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Template not found']);
            }
            break;
            
        case 'delete_template':
            // Delete an email template
            $data = $json_data ?? [];
            $template_id = intval($data['template_id'] ?? 0);
            
            if (!$template_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'template_id is required']);
                exit;
            }
            
            error_log('[TEMPLATES API] Delete template #' . $template_id);
            
            $query = "DELETE FROM email_templates WHERE template_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $template_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Template deleted successfully']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Failed to delete template']);
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }

    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
