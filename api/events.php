<?php
// Error handling - ensure all output is JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error in $errfile:$errline - $errstr");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

set_exception_handler(function($exception) {
    error_log("Exception: " . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $exception->getMessage()]);
    exit;
});

require_once '../config/db.php';

// Helper function to ensure events table has location column
function ensureLocationColumn($conn) {
    $check_col = "SHOW COLUMNS FROM events LIKE 'location'";
    $col_result = $conn->query($check_col);
    if ($col_result->num_rows == 0) {
        $alter_query = "ALTER TABLE events ADD COLUMN location VARCHAR(255) NULL AFTER end_time";
        if (!$conn->query($alter_query)) {
            error_log("Warning: Could not add location column: " . $conn->error);
        } else {
            error_log("Info: Location column added to events table");
        }
    }
}

// Helper function to ensure events table has archived column
function ensureEventsTableArchived($conn) {
    $check_col = "SHOW COLUMNS FROM events LIKE 'archived'";
    $col_result = $conn->query($check_col);
    if ($col_result->num_rows == 0) {
        $alter_query = "ALTER TABLE events ADD COLUMN archived BOOLEAN DEFAULT FALSE";
        if (!$conn->query($alter_query)) {
            error_log("Warning: Could not add archived column: " . $conn->error);
        }
    }
}

// Helper function to resolve admin_id or coordinator_id to user_id by email matching
function resolveUserIdFromAdminId($conn, $admin_or_coord_id) {
    global $conn;
    
    // First try to find in admins table
    $query = "SELECT email FROM admins WHERE admin_id = ?";
    $stmt = $conn->prepare($query);
    if (!$stmt) return null;
    
    $stmt->bind_param('i', $admin_or_coord_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $admin = $result->fetch_assoc();
    $stmt->close();
    
    if ($admin && $admin['email']) {
        // Found admin, now find user with same email
        $userQuery = "SELECT user_id FROM users WHERE email = ?";
        $userStmt = $conn->prepare($userQuery);
        if (!$userStmt) return null;
        
        $userStmt->bind_param('s', $admin['email']);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $user = $userResult->fetch_assoc();
        $userStmt->close();
        
        if ($user && $user['user_id']) {
            return $user['user_id'];
        }
    }
    
    // If not found in admins, try coordinators
    $coordQuery = "SELECT email FROM coordinators WHERE coordinator_id = ?";
    $coordStmt = $conn->prepare($coordQuery);
    if (!$coordStmt) return null;
    
    $coordStmt->bind_param('i', $admin_or_coord_id);
    $coordStmt->execute();
    $coordResult = $coordStmt->get_result();
    $coordinator = $coordResult->fetch_assoc();
    $coordStmt->close();
    
    if ($coordinator && $coordinator['email']) {
        // Found coordinator, now find user with same email
        $userQuery = "SELECT user_id FROM users WHERE email = ?";
        $userStmt = $conn->prepare($userQuery);
        if (!$userStmt) return null;
        
        $userStmt->bind_param('s', $coordinator['email']);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $user = $userResult->fetch_assoc();
        $userStmt->close();
        
        if ($user && $user['user_id']) {
            return $user['user_id'];
        }
    }
    
    return null;
}

// Helper function to get user role and info from request headers or session
function getUserInfo() {
    $userInfo = [
        'role' => 'GUEST',
        'user_id' => null,
        'coordinator_id' => null
    ];
    
    // Check if role is passed in header
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

// Helper function to check if coordinator has access to an event
function coordinatorHasAccessToEvent($conn, $event_id, $coordinator_id) {
    $query = "SELECT event_id FROM events WHERE event_id = ? AND coordinator_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $event_id, $coordinator_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->num_rows > 0;
}

// Helper function to check event access based on role
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

// Helper function to generate access codes
function generateAccessCode() {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $code = '';
    for ($i = 0; $i < 6; $i++) {
        $code .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $code;
}

// Helper function to normalize event data types for JSON response
function normalizeEventData($event) {
    if ($event) {
        // FIX: Convert literal string "undefined" to empty string for proper display
        if ($event['location'] === 'undefined' || $event['location'] === null) {
            $event['location'] = '';
        }
        if ($event['description'] === 'undefined' || $event['description'] === null) {
            $event['description'] = '';
        }
        
        // Convert string values to proper types for JavaScript compatibility
        $event['event_id'] = intval($event['event_id'] ?? 0);
        $event['is_private'] = intval($event['is_private'] ?? 0);
        $event['capacity'] = intval($event['capacity'] ?? 0);
        $event['total_registrations'] = intval($event['total_registrations'] ?? 0);
        $event['attended_count'] = intval($event['attended_count'] ?? 0);
        $event['available_spots'] = intval($event['available_spots'] ?? 0);
    }
    return $event;
}

// Helper function to normalize array of events
function normalizeEventsArray($events) {
    return array_map('normalizeEventData', $events);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list_all';  // Default to list_all for calendar and dashboard
    
    // Ensure location column exists
    ensureLocationColumn($conn);
    if ($action === 'list') {
        // Get all UPCOMING/ACTIVE events (not past events - those go to Catalogue)
        ensureEventsTableArchived($conn); // Ensure archived column exists
        
        // Check if coordinators table exists
        $tablesExist = $conn->query("SHOW TABLES LIKE 'coordinators'");
        $hasCoordinators = $tablesExist && $tablesExist->num_rows > 0;
        
        if ($hasCoordinators) {
            $query = "SELECT e.event_id, e.event_name, e.description, DATE(e.start_event) as event_date, TIME(e.start_event) as start_time, TIME(e.end_event) as end_time, e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id, MAX(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as created_by_name,
                      MAX(c.coordinator_id) as coordinator_id, MAX(c.coordinator_name) as coordinator_name, MAX(c.email) as coordinator_email, MAX(c.contact_number) as coordinator_contact,
                      COUNT(DISTINCT r.registration_id) as total_registrations,
                      SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                      (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                      FROM events e
                      LEFT JOIN users u ON e.created_by = u.user_id
                      LEFT JOIN coordinators c ON e.coordinator_id = c.coordinator_id
                      LEFT JOIN registrations r ON e.event_id = r.event_id
                      WHERE e.archived = 0
                      GROUP BY e.event_id
                      ORDER BY e.start_event DESC";
        } else {
            $query = "SELECT e.event_id, e.event_name, e.description, DATE(e.start_event) as event_date, TIME(e.start_event) as start_time, TIME(e.end_event) as end_time, e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id, MAX(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as created_by_name,
                      NULL as coordinator_id, NULL as coordinator_name, NULL as coordinator_email, NULL as coordinator_contact,
                      COUNT(DISTINCT r.registration_id) as total_registrations,
                      SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                      (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                      FROM events e
                      LEFT JOIN users u ON e.created_by = u.user_id
                      LEFT JOIN registrations r ON e.event_id = r.event_id
                      WHERE e.archived = 0
                      GROUP BY e.event_id
                      ORDER BY e.start_event DESC";
        }
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();
        $events = [];
        
        while ($row = $result->fetch_assoc()) {
            $events[] = $row;
        }
        
        // Normalize data types for JSON response
        $events = normalizeEventsArray($events);
        
        echo json_encode(['success' => true, 'data' => $events]);
    }
    elseif ($action === 'list_all') {
        // Get ALL events for calendar display (past and future)
        ensureEventsTableArchived($conn); // Ensure archived column exists
        $userInfo = getUserInfo();
        
        // Simple query for calendar - just get the essential event data
        $query = "SELECT e.event_id, e.event_name, e.description, DATE(e.start_event) as event_date, TIME(e.start_event) as start_time, TIME(e.end_event) as end_time, 
                         e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id
                  FROM events e
                  WHERE e.archived = 0
                  ORDER BY e.start_event DESC";
        
        // Filter by coordinator if user is a coordinator
        if (($userInfo['role'] === 'COORDINATOR' || $userInfo['role'] === 'coordinator') && $userInfo['coordinator_id']) {
            $query = "SELECT e.event_id, e.event_name, e.description, DATE(e.start_event) as event_date, TIME(e.start_event) as start_time, TIME(e.end_event) as end_time, 
                             e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id
                      FROM events e
                      WHERE e.archived = 0 AND e.coordinator_id = " . intval($userInfo['coordinator_id']) . "
                      ORDER BY e.start_event DESC";
        }
        
        $result = $conn->query($query);
        if (!$result) {
            error_log("Calendar query error: " . $conn->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $events = [];
        while ($row = $result->fetch_assoc()) {
            $events[] = $row;
        }
        
        // Normalize data types for JSON response
        $events = normalizeEventsArray($events);
        
        echo json_encode(['success' => true, 'data' => $events]);
    } 
    elseif ($action === 'detail') {
        $event_id = intval($_GET['event_id']);
        $userInfo = getUserInfo();
        
        // First fetch the event to check permissions
        $permissionQuery = "SELECT event_id, coordinator_id FROM events WHERE event_id = ?";
        $permStmt = $conn->prepare($permissionQuery);
        $permStmt->bind_param('i', $event_id);
        $permStmt->execute();
        $permResult = $permStmt->get_result();
        $eventPerm = $permResult->fetch_assoc();
        
        // Check access - coordinators can only see their assigned events
        if (!checkEventAccess($conn, $event_id, $userInfo)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied. You do not have permission to view this event.']);
            exit;
        }
        
        // Check if coordinators table exists
        $tablesExist = $conn->query("SHOW TABLES LIKE 'coordinators'");
        $hasCoordinators = $tablesExist && $tablesExist->num_rows > 0;
        
        if ($hasCoordinators) {
            $query = "SELECT e.event_id, e.event_name, e.description, DATE(e.start_event) as event_date, TIME(e.start_event) as start_time, TIME(e.end_event) as end_time, e.location, e.capacity, e.is_private, e.image_url, e.registration_start, e.registration_end, e.registration_link, e.website, e.created_by, e.created_at, e.coordinator_id, MAX(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as created_by_name,
                      MAX(c.coordinator_id) as coordinator_id, MAX(c.coordinator_name) as coordinator_name, MAX(c.email) as coordinator_email, MAX(c.contact_number) as coordinator_contact,
                      MAX(eac.access_code) as access_code,
                      COUNT(DISTINCT r.registration_id) as total_registrations,
                      SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                      (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                      FROM events e
                      LEFT JOIN users u ON e.created_by = u.user_id
                      LEFT JOIN coordinators c ON e.coordinator_id = c.coordinator_id
                      LEFT JOIN event_access_codes eac ON e.event_id = eac.event_id AND eac.is_active = 1
                      LEFT JOIN registrations r ON e.event_id = r.event_id
                      WHERE e.event_id = ?
                      GROUP BY e.event_id";
        } else {
            $query = "SELECT e.event_id, e.event_name, e.description, DATE(e.start_event) as event_date, TIME(e.start_event) as start_time, TIME(e.end_event) as end_time, e.location, e.capacity, e.is_private, e.image_url, e.registration_start, e.registration_end, e.registration_link, e.website, e.created_by, e.created_at, e.coordinator_id, MAX(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as created_by_name,
                      NULL as coordinator_id, NULL as coordinator_name, NULL as coordinator_email, NULL as coordinator_contact,
                      MAX(eac.access_code) as access_code,
                      COUNT(DISTINCT r.registration_id) as total_registrations,
                      SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                      (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                      FROM events e
                      LEFT JOIN users u ON e.created_by = u.user_id
                      LEFT JOIN event_access_codes eac ON e.event_id = eac.event_id AND eac.is_active = 1
                      LEFT JOIN registrations r ON e.event_id = r.event_id
                      WHERE e.event_id = ?
                      GROUP BY e.event_id";
        }
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $event = $result->fetch_assoc();
        
        if ($event) {
            // Normalize data types for JSON response
            $event = normalizeEventData($event);
            echo json_encode(['success' => true, 'data' => $event]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Event not found']);
        }
    }
    elseif ($action === 'access_code') {
        // Get access code for a private event
        $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;
        
        if (!$event_id) {
            echo json_encode(['success' => false, 'message' => 'Event ID required']);
            exit;
        }
        
        // Check if event is private and get access code
        $query = "SELECT eac.access_code 
                  FROM event_access_codes eac
                  JOIN events e ON eac.event_id = e.event_id
                  WHERE e.event_id = ? AND e.is_private = 1 AND eac.is_active = 1
                  LIMIT 1";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row && $row['access_code']) {
            echo json_encode(['success' => true, 'access_code' => $row['access_code']]);
        } else {
            echo json_encode(['success' => true, 'access_code' => null]);
        }
    }
    elseif ($action === 'get_event_coordinators') {
        // Get all coordinators assigned to an event via junction table
        $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;
        
        if (!$event_id) {
            echo json_encode(['success' => false, 'message' => 'Event ID required']);
            exit;
        }
        
        // Check if coordinators table exists
        $tablesExist = $conn->query("SHOW TABLES LIKE 'coordinators'");
        $hasCoordinators = $tablesExist && $tablesExist->num_rows > 0;
        
        // Check if event_coordinators junction table exists
        $funcTableExist = $conn->query("SHOW TABLES LIKE 'event_coordinators'");
        $hasJunctionTable = $funcTableExist && $funcTableExist->num_rows > 0;
        
        if ($hasCoordinators && $hasJunctionTable) {
            // Fetch from junction table with coordinator details
            $query = "SELECT c.coordinator_id, c.coordinator_name, c.email, c.coordinator_image, c.company, c.contact_number
                      FROM event_coordinators ec
                      JOIN coordinators c ON ec.coordinator_id = c.coordinator_id
                      WHERE ec.event_id = ?
                      ORDER BY ec.assigned_date DESC";
        } else if ($hasCoordinators) {
            // Fallback: fetch from events table (legacy single coordinator)
            $query = "SELECT c.coordinator_id, c.coordinator_name, c.email, c.coordinator_image, c.company, c.contact_number
                      FROM events e
                      JOIN coordinators c ON e.coordinator_id = c.coordinator_id
                      WHERE e.event_id = ? AND e.coordinator_id IS NOT NULL
                      LIMIT 1";
        } else {
            // No coordinators table
            echo json_encode(['success' => true, 'data' => []]);
            exit;
        }
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $coordinators = [];
        
        while ($row = $result->fetch_assoc()) {
            $coordinators[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $coordinators]);
    }
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Ensure location column exists
    ensureLocationColumn($conn);
    
    // Check if this is an image update request
    if (isset($_POST['action']) && $_POST['action'] === 'update_event_image') {
        $event_id = intval($_POST['event_id'] ?? 0);
        
        if (!$event_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Event ID is required']);
            exit;
        }
        
        // Check if file was uploaded
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No image file provided']);
            exit;
        }
        
        $file = $_FILES['image'];
        
        // Validate file type
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed_types)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG,  GIF, and WebP are allowed']);
            exit;
        }
        
        // Validate file size (max 5MB)
        $max_size = 5 * 1024 * 1024;
        if ($file['size'] > $max_size) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'File size exceeds maximum limit of 5MB']);
            exit;
        }
        
        // Create uploads directory if not exists
        $uploads_dir = dirname(__DIR__) . '/uploads/events/';
        if (!is_dir($uploads_dir)) {
            mkdir($uploads_dir, 0755, true);
        }
        
        // Generate unique filename
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $new_filename = 'event_' . $event_id . '_' . time() . '.' . strtolower($file_extension);
        $upload_path = $uploads_dir . $new_filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file']);
            exit;
        }
        
        // Get current event image to delete old file
        $query = "SELECT image_url FROM events WHERE event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $event = $result->fetch_assoc();
        
        // Delete old image file if exists
        if ($event && $event['image_url']) {
            $old_image_path = dirname(__DIR__) . '/uploads/events/' . $event['image_url'];
            if (file_exists($old_image_path)) {
                unlink($old_image_path);
            }
        }
        
        // Update event with new image URL (store only filename)
        $query = "UPDATE events SET image_url = ? WHERE event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('si', $new_filename, $event_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Event image updated', 'image_url' => $new_filename]);
        } else {
            // Delete uploaded file if db update fails
            if (file_exists($upload_path)) {
                unlink($upload_path);
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update event image in database']);
        }
        exit;
    }
    
    // Handle update_event action (update all event details including optional image)
    if (isset($_POST['action']) && $_POST['action'] === 'update_event') {
        $event_id = intval($_POST['event_id'] ?? 0);
        $event_name = isset($_POST['event_name']) ? trim($_POST['event_name']) : '';
        $location = isset($_POST['location']) ? trim($_POST['location']) : '';
        $event_date = isset($_POST['event_date']) ? trim($_POST['event_date']) : '';
        $start_time = isset($_POST['start_time']) ? trim($_POST['start_time']) : '00:00:00';
        $end_time = isset($_POST['end_time']) ? trim($_POST['end_time']) : '23:59:59';
        $capacity = intval($_POST['capacity'] ?? 0);
        $registration_link = isset($_POST['registration_link']) ? trim($_POST['registration_link']) : '';
        $website_link = isset($_POST['website_link']) ? trim($_POST['website_link']) : '';
        $description = isset($_POST['description']) ? trim($_POST['description']) : '';
        
        if (!$event_id || !$event_name || !$location || !$event_date || !$capacity) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }
        
        // Construct datetime fields from date and time
        $start_event = $event_date . ' ' . $start_time;
        $end_event = $event_date . ' ' . $end_time;
        
        // Handle image upload if provided
        $image_url = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['image'];
            
            // Validate file type
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($file['type'], $allowed_types)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed']);
                exit;
            }
            
            // Validate file size (max 5MB)
            $max_size = 5 * 1024 * 1024;
            if ($file['size'] > $max_size) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'File size exceeds maximum limit of 5MB']);
                exit;
            }
            
            // Create uploads directory if not exists
            $uploads_dir = dirname(__DIR__) . '/uploads/events/';
            if (!is_dir($uploads_dir)) {
                mkdir($uploads_dir, 0755, true);
            }
            
            // Generate unique filename
            $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $new_filename = 'event_' . $event_id . '_' . time() . '.' . strtolower($file_extension);
            $upload_path = $uploads_dir . $new_filename;
            $image_url = $new_filename;
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file']);
                exit;
            }
            
            // Get current event image to delete old file
            $get_query = "SELECT image_url FROM events WHERE event_id = ?";
            $get_stmt = $conn->prepare($get_query);
            $get_stmt->bind_param('i', $event_id);
            $get_stmt->execute();
            $get_result = $get_stmt->get_result();
            $event = $get_result->fetch_assoc();
            
            // Delete old image file if exists
            if ($event && $event['image_url']) {
                $old_image_path = dirname(__DIR__) . '/' . $event['image_url'];
                if (file_exists($old_image_path)) {
                    unlink($old_image_path);
                }
            }
        }
        
        // Update event details
        $query = "UPDATE events SET event_name = ?, location = ?, start_event = ?, end_event = ?, capacity = ?, registration_link = ?, website_link = ?, description = ?";
        $params = [$event_name, $location, $start_event, $end_event, $capacity, $registration_link, $website_link, $description];
        $types = 'ssssisss';
        
        // Add image update if image was provided
        if ($image_url) {
            $query .= ", image_url = ?";
            $params[] = $image_url;
            $types .= 's';
        }
        
        $query .= " WHERE event_id = ?";
        $params[] = $event_id;
        $types .= 'i';
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Event details updated successfully']);
        } else {
            // Delete uploaded file if db update fails
            if ($image_url && file_exists($upload_path)) {
                unlink($upload_path);
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update event: ' . $stmt->error]);
        }
        exit;
    }
    
    // Check if this is a FormData request (Content-Type: multipart/form-data)
    // FormData always sends data as $_POST, even without files
    $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($content_type, 'multipart/form-data') !== false || !empty($_POST)) {
        // FormData request (with or without file upload)
        $event_name = isset($_POST['event_name']) ? trim($_POST['event_name']) : '';
        $description = isset($_POST['description']) ? trim($_POST['description']) : '';
        $location = isset($_POST['location']) ? trim($_POST['location']) : '';
        $capacity = isset($_POST['capacity']) ? intval($_POST['capacity']) : 0;
        $is_private = isset($_POST['is_private']) ? intval($_POST['is_private']) : 0;
        $registration_link = isset($_POST['registration_link']) ? trim($_POST['registration_link']) : '';
        $website_link = isset($_POST['website_link']) ? trim($_POST['website_link']) : '';
        $department = isset($_POST['department']) ? $_POST['department'] : NULL;
        $coordinator_id = isset($_POST['coordinator_id']) && $_POST['coordinator_id'] ? intval($_POST['coordinator_id']) : NULL;
        
        // Debug logging
        error_log("=== EVENT CREATE DEBUG ===");
        error_log("POST data: " . json_encode($_POST));
        error_log("Parsed values:");
        error_log("  event_name: '$event_name'");
        error_log("  location: '$location'");
        error_log("  capacity: $capacity (type: " . gettype($capacity) . ")");
        error_log("  is_private: $is_private (type: " . gettype($is_private) . ")");
        error_log("  registration_link: '$registration_link'");
        error_log("  website_link: '$website_link'");
        error_log("  description: '$description'");
        error_log("========================");
        
        // FIX: Convert literal string "undefined" to empty string
        // This prevents 'undefined' from being saved in the database
        if ($event_name === 'undefined') $event_name = '';
        if ($description === 'undefined') $description = '';
        if ($location === 'undefined') $location = '';
        
        error_log('=== EVENT CREATE - POST REQUEST RECEIVED ===');
        error_log('RAW POST keys: ' . json_encode(array_keys($_POST)));
        error_log('event_name = "' . $event_name . '"');
        error_log('description = "' . $description . '"');
        error_log('location = "' . $location . '"');
        error_log('capacity = "' . $capacity . '"');
        error_log('POST event_name raw: ' . var_export($_POST['event_name'] ?? 'NOT_SET', true));
        error_log('POST description raw: ' . var_export($_POST['description'] ?? 'NOT_SET', true));
        error_log('POST location raw: ' . var_export($_POST['location'] ?? 'NOT_SET', true));
        
        // Handle registration period fields
        $registration_start = $_POST['registration_start'] ?? '';
        $registration_end = $_POST['registration_end'] ?? '';
        
        error_log('registration_start: ' . var_export($registration_start, true));
        error_log('registration_end: ' . var_export($registration_end, true));
        
        // Handle datetime fields - check for new format (start_event/end_event) first, then fall back to old format
        $start_event = $_POST['start_event'] ?? '';
        $end_event = $_POST['end_event'] ?? '';
        
        error_log('start_event from POST: ' . var_export($start_event, true));
        error_log('end_event from POST: ' . var_export($end_event, true));
        
        // If new format not provided, construct from old format
        if (!$start_event && isset($_POST['event_date']) && isset($_POST['start_time'])) {
            $event_date = $_POST['event_date'] ?? '';
            $start_time = $_POST['start_time'] ?? '';
            $start_event = $event_date . ' ' . $start_time;
        }
        
        if (!$end_event && isset($_POST['event_date']) && isset($_POST['end_time'])) {
            $event_date = $_POST['event_date'] ?? '';
            $end_time = $_POST['end_time'] ?? '';
            $end_event = $event_date . ' ' . $end_time;
        }
        
        $image_url = null;
        
        // Debug: Log file upload details and location
        error_log('EVENT CREATE - Form data: event_name=' . $event_name . ', location=' . $location);
        error_log('EVENT CREATE - FILES array: ' . json_encode($_FILES));
        error_log('EVENT CREATE - FILE[image] size: ' . $_FILES['image']['size'] . ', error: ' . $_FILES['image']['error']);
        
        // Handle file upload
        if ($_FILES['image']['size'] > 0 && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploads_path = dirname(__DIR__) . '/uploads/events/';
            
            // Create directory if it doesn't exist
            if (!is_dir($uploads_path)) {
                mkdir($uploads_path, 0755, true);
            }
            
            // Validate file type
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($_FILES['image']['type'], $allowed_types)) {
                echo json_encode(['success' => false, 'message' => 'Invalid file type. Only images allowed.']);
                exit;
            }
            
            // Validate file size (max 5MB)
            if ($_FILES['image']['size'] > 5 * 1024 * 1024) {
                echo json_encode(['success' => false, 'message' => 'File too large. Maximum 5MB allowed.']);
                exit;
            }
            
            // Generate unique filename
            $file_ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $filename = 'event_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
            $filepath = $uploads_path . $filename;
            
            // Move uploaded file
            if (move_uploaded_file($_FILES['image']['tmp_name'], $filepath)) {
                // Store ONLY the filename in database
                $image_url = $filename;
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                exit;
            }
        }
        
        // Log image_url status and datetime values before insert
        error_log('EVENT CREATE - After file handling, image_url: ' . ($image_url ? $image_url : 'NULL (no file uploaded)'));
        error_log('EVENT CREATE - DateTime values: start_event=' . $start_event . ', end_event=' . $end_event . ', location=' . $location);
        error_log('EVENT CREATE - Description and other fields: description="' . $description . '", capacity=' . $capacity . ', is_private=' . $is_private);
        
        // Insert event with image
        // Check if coordinator_id column exists in events table
        $columnsResult = $conn->query("SHOW COLUMNS FROM events LIKE 'coordinator_id'");
        $hasCoordinatorColumn = $columnsResult && $columnsResult->num_rows > 0;
        
        if ($hasCoordinatorColumn && $coordinator_id) {
            $query = "INSERT INTO events (event_name, description, start_event, end_event, location, registration_start, registration_end, image_url, capacity, is_private, registration_link, website, coordinator_id, created_by)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";
            $stmt = $conn->prepare($query);
            // bind_param: Match INSERT column order exactly
            // Columns: event_name, description, start_event, end_event, location, registration_start, registration_end, image_url, capacity, is_private, registration_link, website, coordinator_id
            // Types:   s          s              s              s          s          s                    s                  s          i        i           s                 s       i
            $stmt->bind_param('ssssssssiissi', $event_name, $description, $start_event, $end_event, $location, $registration_start, $registration_end, $image_url, $capacity, $is_private, $registration_link, $website_link, $coordinator_id);
        } else {
            $query = "INSERT INTO events (event_name, description, start_event, end_event, location, registration_start, registration_end, image_url, capacity, is_private, registration_link, website, created_by)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";
            $stmt = $conn->prepare($query);
            // bind_param: Match INSERT column order exactly
            // Columns: event_name, description, start_event, end_event, location, registration_start, registration_end, image_url, capacity, is_private, registration_link, website
            // Types:   s          s              s              s          s          s                    s                  s          i        i           s                 s
            $stmt->bind_param('ssssssssiiss', $event_name, $description, $start_event, $end_event, $location, $registration_start, $registration_end, $image_url, $capacity, $is_private, $registration_link, $website_link);
        }
        
        if ($stmt->execute()) {
            $event_id = $conn->insert_id;
            
            // Log activity - get user_id from POST or headers  
            $user_id = intval($_POST['_user_id'] ?? 0);
            if (!$user_id) {
                $userInfo = getUserInfo();
                $user_id = $userInfo['user_id'] ?? 1;
            }
            // Try to resolve admin/coordinator ID to actual user_id
            $resolved_user_id = resolveUserIdFromAdminId($conn, $user_id);
            if ($resolved_user_id) {
                $user_id = $resolved_user_id;
            }
            // Wrap logActivity in try-catch to prevent 500 errors
            try {
                logActivity($user_id, 'CREATE', 'EVENT', $event_id, "Created event: {$event_name} (Capacity: {$capacity})");
            } catch (Exception $e) {
                error_log('Failed to log activity: ' . $e->getMessage());
                // Continue anyway - logging failure shouldn't prevent event creation
            }
            
            $access_code = null;
            
            // If event is private, generate and create access code
            if ($is_private) {
                $access_code = generateAccessCode();
                $code_query = "INSERT INTO event_access_codes (event_id, access_code, is_active) VALUES (?, ?, 1)";
                $code_stmt = $conn->prepare($code_query);
                $code_stmt->bind_param('is', $event_id, $access_code);
                $code_stmt->execute();
                $code_stmt->close();
            }
            
            $response = [
                'success' => true, 
                'message' => 'Event created successfully',
                'event_id' => $event_id,
                'image_uploaded' => !empty($image_url),
                'is_private' => $is_private,
                'access_code' => $access_code
            ];
            
            if (empty($image_url)) {
                $response['warning'] = 'No image was provided. Event created without cover image.';
            }
            
            echo json_encode($response);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create event: ' . $stmt->error]);
        }
    } else {
        // JSON request fallback
        $data = json_decode(file_get_contents('php://input'), true);
        
        $event_name = $data['event_name'] ?? '';
        $description = $data['description'] ?? '';
        $location = $data['location'] ?? '';
        $capacity = isset($data['capacity']) ? intval($data['capacity']) : 0;
        $is_private = isset($data['is_private']) ? intval($data['is_private']) : 0;
        $registration_link = isset($data['registration_link']) ? trim($data['registration_link']) : '';
        $website_link = isset($data['website_link']) ? trim($data['website_link']) : '';
        $department = isset($data['department']) ? $data['department'] : NULL;
        $coordinator_id = isset($data['coordinator_id']) && $data['coordinator_id'] ? intval($data['coordinator_id']) : NULL;
        $image_url = null;
        
        // FIX: Convert literal string "undefined" to empty string (JSON fallback)
        if ($event_name === 'undefined') $event_name = '';
        if ($description === 'undefined') $description = '';
        if ($location === 'undefined') $location = '';
        
        // Handle registration period fields
        $registration_start = $data['registration_start'] ?? '';
        $registration_end = $data['registration_end'] ?? '';
        
        // Handle datetime fields - check for new format (start_event/end_event) first, then fall back to old format
        $start_event = $data['start_event'] ?? '';
        $end_event = $data['end_event'] ?? '';
        
        // If new format not provided, construct from old format
        if (!$start_event && isset($data['event_date']) && isset($data['start_time'])) {
            $event_date = $data['event_date'] ?? '';
            $start_time = $data['start_time'] ?? '';
            $start_event = $event_date . ' ' . $start_time;
        }
        
        if (!$end_event && isset($data['event_date']) && isset($data['end_time'])) {
            $event_date = $data['event_date'] ?? '';
            $end_time = $data['end_time'] ?? '';
            $end_event = $event_date . ' ' . $end_time;
        }
        
        // Insert event (JSON fallback)
        // Check if coordinator_id column exists in events table
        $columnsResult = $conn->query("SHOW COLUMNS FROM events LIKE 'coordinator_id'");
        $hasCoordinatorColumn = $columnsResult && $columnsResult->num_rows > 0;
        
        if ($hasCoordinatorColumn && $coordinator_id) {
            $query = "INSERT INTO events (event_name, description, start_event, end_event, location, registration_start, registration_end, image_url, capacity, is_private, registration_link, website, coordinator_id, created_by)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";
            $stmt = $conn->prepare($query);
            // bind_param: Match INSERT column order exactly
            // Columns: event_name, description, start_event, end_event, location, registration_start, registration_end, image_url, capacity, is_private, registration_link, website, coordinator_id
            // Types:   s          s              s              s          s          s                    s                  s          i        i           s                 s       i
            $stmt->bind_param('ssssssssiissi', $event_name, $description, $start_event, $end_event, $location, $registration_start, $registration_end, $image_url, $capacity, $is_private, $registration_link, $website_link, $coordinator_id);
        } else {
            $query = "INSERT INTO events (event_name, description, start_event, end_event, location, registration_start, registration_end, image_url, capacity, is_private, registration_link, website, created_by)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";
            $stmt = $conn->prepare($query);
            // bind_param: Match INSERT column order exactly
            // Columns: event_name, description, start_event, end_event, location, registration_start, registration_end, image_url, capacity, is_private, registration_link, website
            // Types:   s          s              s              s          s          s                    s                  s          i        i           s                 s
            $stmt->bind_param('ssssssssiiss', $event_name, $description, $start_event, $end_event, $location, $registration_start, $registration_end, $image_url, $capacity, $is_private, $registration_link, $website_link);
        }
        
        if ($stmt->execute()) {
            $event_id = $conn->insert_id;
            
            // Log activity - get user_id from POST or headers
            $user_id = intval($data['_user_id'] ?? 0);
            if (!$user_id) {
                $userInfo = getUserInfo();
                $user_id = $userInfo['user_id'] ?? 1;
            }
            // Try to resolve admin/coordinator ID to actual user_id
            $resolved_user_id = resolveUserIdFromAdminId($conn, $user_id);
            if ($resolved_user_id) {
                $user_id = $resolved_user_id;
            }
            // Wrap logActivity in try-catch to prevent 500 errors
            try {
                logActivity($user_id, 'CREATE', 'EVENT', $event_id, "Created event: {$event_name} (Capacity: {$capacity})");
            } catch (Exception $e) {
                error_log('Failed to log activity: ' . $e->getMessage());
                // Continue anyway - logging failure shouldn't prevent event creation
            }
            
            $access_code = null;
            
            // If event is private, generate and create access code
            if ($is_private) {
                $access_code = generateAccessCode();
                $code_query = "INSERT INTO event_access_codes (event_id, access_code, is_active) VALUES (?, ?, 1)";
                $code_stmt = $conn->prepare($code_query);
                $code_stmt->bind_param('is', $event_id, $access_code);
                $code_stmt->execute();
                $code_stmt->close();
            }
            
            echo json_encode(['success' => true, 'message' => 'Event created successfully', 'event_id' => $event_id, 'is_private' => $is_private, 'access_code' => $access_code]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create event: ' . $stmt->error]);
        }
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Ensure location column exists
    ensureLocationColumn($conn);
    
    // Update event - supports both FormData (with file) and JSON
    $data = [];
    $files = [];
    
    // Get the raw input
    $input = file_get_contents('php://input');
    
    // Check content type to determine how to parse
    $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($content_type, 'multipart/form-data') !== false) {
        // FormData with file upload
        // For PUT requests, we need to manually parse multipart data
        // PHP doesn't auto-populate $_POST/$_FILES for PUT
        
        // Try to use $_POST and $_FILES if available (some servers support it)
        if (!empty($_POST)) {
            $data = $_POST;
            $files = $_FILES;
        } else {
            // Manual parsing of multipart form data
            $boundary = '';
            if (preg_match('/boundary=([^;]+)/', $content_type, $matches)) {
                $boundary = trim($matches[1], "\"\t ");
            }
            
            if ($boundary) {
                // Parse multipart data
                $parts = explode('--' . $boundary, $input);
                foreach ($parts as $part) {
                    if (empty(trim($part)) || $part === '--') continue;
                    
                    // Separate headers from content
                    $part = ltrim($part, "\r\n");
                    if (strpos($part, "\r\n\r\n") !== false) {
                        list($headers, $content) = explode("\r\n\r\n", $part, 2);
                        $content = rtrim($content, "\r\n");
                        
                        // Parse headers
                        if (preg_match('/name="([^"]+)"/', $headers, $name_match)) {
                            $name = $name_match[1];
                            
                            if (preg_match('/filename="([^"]+)"/', $headers, $file_match)) {
                                // This is a file - extract MIME type from Content-Type header
                                $filename = $file_match[1];
                                $file_type = 'application/octet-stream';
                                
                                if (preg_match('/Content-Type:\s*([^\r\n]+)/', $headers, $type_match)) {
                                    $file_type = trim($type_match[1]);
                                }
                                
                                // Create temp file with actual content
                                $temp_file = tempnam(sys_get_temp_dir(), 'upload_');
                                if (file_put_contents($temp_file, $content) === false) {
                                    error_log("Failed to write temp file: $temp_file");
                                } else {
                                    $files[$name] = [
                                        'name' => $filename,
                                        'type' => $file_type,
                                        'tmp_name' => $temp_file,
                                        'error' => 0,
                                        'size' => strlen($content)
                                    ];
                                }
                            } else {
                                // Regular form field
                                $data[$name] = $content;
                            }
                        }
                    }
                }
            }
        }
    } else if (strpos($content_type, 'application/json') !== false) {
        // JSON request
        $data = json_decode($input, true) ?? [];
    } else if (!empty($input)) {
        // Fallback: try to parse as form data
        parse_str($input, $data);
    }
    
    $event_id = intval($data['event_id'] ?? 0);
    $action = $data['action'] ?? 'update';
    
    if (!$event_id) {
        echo json_encode(['success' => false, 'message' => 'Event ID required']);
        exit;
    }
    
    // Handle assign_coordinator action
    if ($action === 'assign_coordinator') {
        $coordinator_id = intval($data['coordinator_id'] ?? 0);
        
        if (!$coordinator_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Coordinator ID required']);
            exit;
        }
        
        // Update event with coordinator_id
        $updateQuery = "UPDATE events SET coordinator_id = ? WHERE event_id = ?";
        $stmt = $conn->prepare($updateQuery);
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('ii', $coordinator_id, $event_id);
        
        if ($stmt->execute()) {
            // Also activate the coordinator account (set is_active = 1)
            $activateQuery = "UPDATE coordinators SET is_active = 1 WHERE coordinator_id = ?";
            $activateStmt = $conn->prepare($activateQuery);
            $activateStmt->bind_param('i', $coordinator_id);
            $activateStmt->execute();
            $activateStmt->close();
            
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Coordinator assigned successfully and account activated']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to assign coordinator: ' . $stmt->error]);
        }
        exit;
    }
    
    // Handle assign_multiple_coordinators action (many-to-many via junction table)
    if ($action === 'assign_multiple_coordinators') {
        $coordinator_ids_json = $data['coordinator_ids'] ?? '[]';
        
        // Parse coordinator IDs (can be JSON string or array)
        if (is_string($coordinator_ids_json)) {
            $coordinator_ids = json_decode($coordinator_ids_json, true) ?? [];
        } else {
            $coordinator_ids = is_array($coordinator_ids_json) ? $coordinator_ids_json : [];
        }
        
        if (empty($coordinator_ids)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'At least one coordinator ID required']);
            exit;
        }
        
        // Sanitize coordinator IDs to integers
        $coordinator_ids = array_map('intval', $coordinator_ids);
        
        // Check if event_coordinators table exists
        $tableExist = $conn->query("SHOW TABLES LIKE 'event_coordinators'");
        if (!$tableExist || $tableExist->num_rows == 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Event coordinators table not found. Please run migration.']);
            exit;
        }
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // Delete existing assignments for this event
            $deleteQuery = "DELETE FROM event_coordinators WHERE event_id = ?";
            $deleteStmt = $conn->prepare($deleteQuery);
            if (!$deleteStmt) {
                throw new Exception('Failed to prepare delete statement: ' . $conn->error);
            }
            $deleteStmt->bind_param('i', $event_id);
            if (!$deleteStmt->execute()) {
                throw new Exception('Failed to delete existing assignments: ' . $deleteStmt->error);
            }
            $deleteStmt->close();
            
            // Insert new assignments
            $insertQuery = "INSERT INTO event_coordinators (event_id, coordinator_id, assigned_date, assigned_by) VALUES (?, ?, NOW(), ?)";
            $insertStmt = $conn->prepare($insertQuery);
            if (!$insertStmt) {
                throw new Exception('Failed to prepare insert statement: ' . $conn->error);
            }
            
            $userInfo = getUserInfo();
            $assigned_by = $userInfo['user_id'] ?? 0;
            
            foreach ($coordinator_ids as $coordinator_id) {
                $coordinator_id = intval($coordinator_id);
                $insertStmt->bind_param('iii', $event_id, $coordinator_id, $assigned_by);
                if (!$insertStmt->execute()) {
                    throw new Exception('Failed to assign coordinator ' . $coordinator_id . ': ' . $insertStmt->error);
                }
                
                // Also activate the coordinator account
                $activateQuery = "UPDATE coordinators SET is_active = 1 WHERE coordinator_id = ?";
                $activateStmt = $conn->prepare($activateQuery);
                $activateStmt->bind_param('i', $coordinator_id);
                $activateStmt->execute();
                $activateStmt->close();
            }
            $insertStmt->close();
            
            // Commit transaction
            $conn->commit();
            
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => count($coordinator_ids) . ' coordinator(s) assigned successfully']);
        } catch (Exception $e) {
            // Rollback on error
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // Handle remove_coordinator action
    if ($action === 'remove_coordinator') {
        $coordinator_id = intval($data['coordinator_id'] ?? 0);
        
        if (!$coordinator_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Coordinator ID required']);
            exit;
        }
        
        // Check if event_coordinators table exists
        $tableExist = $conn->query("SHOW TABLES LIKE 'event_coordinators'");
        if (!$tableExist || $tableExist->num_rows == 0) {
            // Fallback: update events table directly for legacy single coordinator
            $updateQuery = "UPDATE events SET coordinator_id = NULL WHERE event_id = ? AND coordinator_id = ?";
            $stmt = $conn->prepare($updateQuery);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param('ii', $event_id, $coordinator_id);
        } else {
            // Remove from junction table
            $deleteQuery = "DELETE FROM event_coordinators WHERE event_id = ? AND coordinator_id = ?";
            $stmt = $conn->prepare($deleteQuery);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param('ii', $event_id, $coordinator_id);
        }
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Coordinator removed successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to remove coordinator: ' . $stmt->error]);
        }
        exit;
    }
    
    // Get existing event to preserve image and check privacy status
    $query = "SELECT e.image_url, e.is_private, eac.access_code 
              FROM events e 
              LEFT JOIN event_access_codes eac ON e.event_id = eac.event_id AND eac.is_active = 1 
              WHERE e.event_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $existing = $result->fetch_assoc();
    
    if (!$existing) {
        echo json_encode(['success' => false, 'message' => 'Event not found']);
        exit;
    }
    
    $event_name = $data['event_name'] ?? '';
    $description = $data['description'] ?? '';
    $event_date = $data['event_date'] ?? '';
    $start_time = $data['start_time'] ?? null;
    $end_time = $data['end_time'] ?? null;
    $location = $data['location'] ?? '';
    $capacity = isset($data['capacity']) ? intval($data['capacity']) : 0;
    $is_private = isset($data['is_private']) ? intval($data['is_private']) : 0;
    $registration_link = isset($data['registration_link']) ? trim($data['registration_link']) : '';
    $website_link = isset($data['website_link']) ? trim($data['website_link']) : '';
    $department = isset($data['department']) ? $data['department'] : NULL;
    $coordinator_id = isset($data['coordinator_id']) && $data['coordinator_id'] ? intval($data['coordinator_id']) : NULL;
    
    $image_url = $existing['image_url']; // Keep existing by default
    
    // Handle file upload if provided
    if (isset($files['image']) && $files['image']['size'] > 0) {
        $upload_dir = '/../uploads/';
        $uploads_path = dirname(__DIR__) . '/uploads/';
        
        // Create directory if it doesn't exist
        if (!is_dir($uploads_path)) {
            mkdir($uploads_path, 0755, true);
        }
        
        // Validate file type
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($files['image']['type'], $allowed_types)) {
            error_log("Invalid file type: " . $files['image']['type']);
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only images allowed.']);
            exit;
        }
        
        // Validate file size (max 5MB)
        if ($files['image']['size'] > 5 * 1024 * 1024) {
            error_log("File too large: " . $files['image']['size'] . " bytes");
            echo json_encode(['success' => false, 'message' => 'File too large. Maximum 5MB allowed.']);
            exit;
        }
        
        // Generate unique filename
        $file_ext = pathinfo($files['image']['name'], PATHINFO_EXTENSION);
        $filename = 'event_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
        $filepath = $uploads_path . $filename;
        
        // Move/copy uploaded file
        // For manually parsed multipart, use copy() instead of move_uploaded_file()
        error_log("Attempting to copy file from: " . $files['image']['tmp_name'] . " to: " . $filepath);
        if (file_exists($files['image']['tmp_name'])) {
            error_log("Temp file exists, size: " . filesize($files['image']['tmp_name']));
        } else {
            error_log("Temp file does not exist!");
        }
        
        if (copy($files['image']['tmp_name'], $filepath)) {
            // Clean up temp file after successful copy
            @unlink($files['image']['tmp_name']);
            
            $image_url = '/.././uploads/' . $filename;
            
            // Delete old image if exists
            if ($existing['image_url']) {
                // Handle both old relative path and new absolute path formats
                if (strpos($existing['image_url'], '/') === 0) {
                    // Absolute path - remove leading slash for filesystem
                    $old_path = dirname(__DIR__) . $existing['image_url'];
                } else {
                    // Relative path (old format)
                    $old_path = dirname(__DIR__) . '/' . $existing['image_url'];
                }
                if (file_exists($old_path)) {
                    unlink($old_path);
                }
            }
        } else {
            error_log("Failed to copy uploaded file. Temp file: " . $files['image']['tmp_name'] . ", Target: " . $filepath);
            echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
            exit;
        }
    }
    
    // Build start_event and end_event from event_date and time fields
    $start_event = null;
    $end_event = null;
    if ($event_date && $start_time) {
        $start_event = $event_date . ' ' . $start_time;
    }
    if ($event_date && $end_time) {
        $end_event = $event_date . ' ' . $end_time;
    }
    
    // Check if coordinator_id column exists
    $columnsResult = $conn->query("SHOW COLUMNS FROM events LIKE 'coordinator_id'");
    $hasCoordinatorColumn = $columnsResult && $columnsResult->num_rows > 0;
    
    if ($hasCoordinatorColumn) {
        $query = "UPDATE events SET 
                  event_name = ?, 
                  description = ?, 
                  start_event = ?, 
                  end_event = ?, 
                  location = ?, 
                  image_url = ?,
                  capacity = ?, 
                  is_private = ?,
                  registration_link = ?,
                  website = ?,
                  coordinator_id = ?
                  WHERE event_id = ?";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error (prepare with coordinator): ' . $conn->error]);
            exit;
        }
        $bind_result = $stmt->bind_param('ssssssiiisii', $event_name, $description, $start_event, $end_event, $location, $image_url, $capacity, $is_private, $registration_link, $website_link, $coordinator_id, $event_id);
        if (!$bind_result) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Bind param error (with coordinator): ' . $stmt->error]);
            exit;
        }
    } else {
        $query = "UPDATE events SET 
                  event_name = ?, 
                  description = ?, 
                  start_event = ?, 
                  end_event = ?, 
                  location = ?, 
                  image_url = ?,
                  capacity = ?, 
                  is_private = ?,
                  registration_link = ?,
                  website = ?
                  WHERE event_id = ?";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error (prepare without coordinator): ' . $conn->error]);
            exit;
        }
        $bind_result = $stmt->bind_param('ssssssiissi', $event_name, $description, $start_event, $end_event, $location, $image_url, $capacity, $is_private, $registration_link, $website_link, $event_id);
        if (!$bind_result) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Bind param error (without coordinator): ' . $stmt->error]);
            exit;
        }
    }
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            // Log activity for event update
            $user_id = intval($data['_user_id'] ?? 0);
            if (!$user_id) {
                $userInfo = getUserInfo();
                $user_id = $userInfo['user_id'] ?? 1;
            }
            // Try to resolve admin/coordinator ID to actual user_id
            $resolved_user_id = resolveUserIdFromAdminId($conn, $user_id);
            if ($resolved_user_id) {
                $user_id = $resolved_user_id;
            }
            // Wrap logActivity in try-catch to prevent 500 errors
            try {
                logActivity($user_id, 'UPDATE', 'EVENT', $event_id, "Updated event: {$event_name} (Capacity: {$capacity})");
            } catch (Exception $e) {
                error_log('Failed to log activity: ' . $e->getMessage());
                // Continue anyway - logging failure shouldn't prevent event update
            }
            
            // Handle access code changes when privacy status changes
            $privacy_changed_to_private = ($is_private == 1 && $existing['is_private'] == 0);
            $privacy_changed_to_public = ($is_private == 0 && $existing['is_private'] == 1);
            
            if ($privacy_changed_to_private) {
                // Event became private, generate new access code
                $access_code = generateAccessCode();
                $code_query = "INSERT INTO event_access_codes (event_id, access_code, is_active) VALUES (?, ?, 1)";
                $code_stmt = $conn->prepare($code_query);
                $code_stmt->bind_param('is', $event_id, $access_code);
                $code_stmt->execute();
                $code_stmt->close();
            } elseif ($privacy_changed_to_public && $existing['access_code']) {
                // Event is no longer private, deactivate existing code
                $code_query = "UPDATE event_access_codes SET is_active = 0 WHERE event_id = ? AND is_active = 1";
                $code_stmt = $conn->prepare($code_query);
                $code_stmt->bind_param('i', $event_id);
                $code_stmt->execute();
                $code_stmt->close();
            }
            
            echo json_encode(['success' => true, 'message' => 'Event updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No event found to update']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update event: ' . $stmt->error]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Delete event - handle both JSON and FormData
    $input = file_get_contents('php://input');
    
    $data = [];
    
    // Try JSON first
    $json_data = json_decode($input, true);
    if ($json_data && is_array($json_data)) {
        $data = $json_data;
    } else {
        // Fallback to form data
        parse_str($input, $data);
    }
    
    $event_id = isset($data['event_id']) ? intval($data['event_id']) : 0;
    
    if (!$event_id) {
        echo json_encode(['success' => false, 'message' => 'Event ID required']);
        exit;
    }
    
    // Get the event to delete associated image and fetch event_name for logging
    $get_query = "SELECT image_url, event_name FROM events WHERE event_id = ?";
    $stmt = $conn->prepare($get_query);
    $stmt->bind_param('i', $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $event = $result->fetch_assoc();
    $event_name = $event ? $event['event_name'] : 'Unknown';
    
    // Start transaction for cascade delete
    $conn->begin_transaction();
    
    try {
        // Delete attendance logs that reference registrations for this event (cascade delete)
        $delete_logs = "DELETE FROM attendance_logs WHERE registration_id IN (SELECT registration_id FROM registrations WHERE event_id = ?)";
        $stmt = $conn->prepare($delete_logs);
        $stmt->bind_param('i', $event_id);
        if (!$stmt->execute()) {
            throw new Exception('Failed to delete attendance logs: ' . $stmt->error);
        }
        
        // Delete associated registrations (cascade delete)
        $delete_registrations = "DELETE FROM registrations WHERE event_id = ?";
        $stmt = $conn->prepare($delete_registrations);
        $stmt->bind_param('i', $event_id);
        if (!$stmt->execute()) {
            throw new Exception('Failed to delete registrations: ' . $stmt->error);
        }
        
        // Delete the event
        $query = "DELETE FROM events WHERE event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to delete event: ' . $stmt->error);
        }
        
        $affected_rows = $stmt->affected_rows;
        
        // Commit transaction
        $conn->commit();
        
        if ($affected_rows > 0) {
            // Log activity for event deletion
            $input_data = [];
            if (json_decode($input, true) && is_array(json_decode($input, true))) {
                $input_data = json_decode($input, true);
            } else {
                parse_str($input, $input_data);
            }
            $user_id = intval($input_data['_user_id'] ?? 0);
            if (!$user_id) {
                $userInfo = getUserInfo();
                $user_id = $userInfo['user_id'] ?? 1;
            }
            // Try to resolve admin/coordinator ID to actual user_id
            $resolved_user_id = resolveUserIdFromAdminId($conn, $user_id);
            if ($resolved_user_id) {
                $user_id = $resolved_user_id;
            }
            // Wrap logActivity in try-catch to prevent 500 errors
            try {
                logActivity($user_id, 'DELETE', 'EVENT', $event_id, "Deleted event: {$event_name}");
            } catch (Exception $e) {
                error_log('Failed to log activity: ' . $e->getMessage());
                // Continue anyway - logging failure shouldn't prevent event deletion
            }
            
            // Delete associated image file if exists
            if ($event && $event['image_url']) {
                $image_path = dirname(__DIR__) . '/' . $event['image_url'];
                if (file_exists($image_path)) {
                    unlink($image_path);
                }
            }
            echo json_encode(['success' => true, 'message' => 'Event and associated registrations deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No event found to delete']);
        }
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
