<?php
// Email Calendar API - Dedicated endpoint for email calendar display
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
    
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Get user info from headers
$user_role = $_SERVER['HTTP_X_USER_ROLE'] ?? '';
$user_id = $_SERVER['HTTP_X_USER_ID'] ?? '';
$coordinator_id = $_SERVER['HTTP_X_COORDINATOR_ID'] ?? '';

// Debug: Log all received headers
error_log('[EMAIL-CALENDAR API] ========== REQUEST DEBUG ==========');
error_log('[EMAIL-CALENDAR API] Headers received:');
error_log('[EMAIL-CALENDAR API]  - X-User-Role: "' . $user_role . '"');
error_log('[EMAIL-CALENDAR API]  - X-User-Id: "' . $user_id . '"');
error_log('[EMAIL-CALENDAR API]  - X-Coordinator-Id: "' . $coordinator_id . '"');
error_log('[EMAIL-CALENDAR API]  - Request method: ' . $_SERVER['REQUEST_METHOD']);
error_log('[EMAIL-CALENDAR API]  - Action: ' . ($_GET['action'] ?? $_POST['action'] ?? 'NONE'));

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'list_all':
            // Get ALL email blasts for calendar display
            $userInfo = [
                'role' => $_SERVER['HTTP_X_USER_ROLE'] ?? 'GUEST',
                'coordinator_id' => intval($_SERVER['HTTP_X_COORDINATOR_ID'] ?? 0)
            ];
            
            // Query to get emails - filter by coordinator if user is a coordinator
            if (($userInfo['role'] === 'COORDINATOR' || $userInfo['role'] === 'coordinator') && $userInfo['coordinator_id']) {
                $query = "SELECT eb.email_id, eb.event_id, eb.email_blast_name, eb.audience, 
                                 eb.details, eb.status, COALESCE(DATE(eb.scheduled_date), DATE(e.start_event)) as event_date, eb.created_at, 
                                 'email' as item_type, e.event_name
                          FROM email_blasts eb
                          JOIN events e ON eb.event_id = e.event_id
                          WHERE e.coordinator_id = " . intval($userInfo['coordinator_id']) . "
                          ORDER BY COALESCE(eb.scheduled_date, e.start_event) ASC";
            } else {
                // For admins, show all emails
                $query = "SELECT eb.email_id, eb.event_id, eb.email_blast_name, eb.audience, 
                                 eb.details, eb.status, COALESCE(DATE(eb.scheduled_date), DATE(e.start_event)) as event_date, eb.created_at, 
                                 'email' as item_type, e.event_name
                          FROM email_blasts eb
                          JOIN events e ON eb.event_id = e.event_id
                          ORDER BY COALESCE(eb.scheduled_date, e.start_event) ASC";
            }
            
            $result = $conn->query($query);
            if (!$result) {
                error_log("Calendar emails query error: " . $conn->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $emails = [];
            while ($row = $result->fetch_assoc()) {
                $emails[] = $row;
            }
            
            error_log('[EMAIL-CALENDAR API] list_all - Found ' . count($emails) . ' emails');
            echo json_encode(['success' => true, 'data' => $emails]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    error_log('[EMAIL-CALENDAR API] Exception: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
