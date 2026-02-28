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

require_once '../db_config.php';

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
    
    if ($action === 'list') {
        // Get all UPCOMING/ACTIVE events (not past events - those go to Catalogue)
        ensureEventsTableArchived($conn); // Ensure archived column exists
        
        // Check if coordinators table exists
        $tablesExist = $conn->query("SHOW TABLES LIKE 'coordinators'");
        $hasCoordinators = $tablesExist && $tablesExist->num_rows > 0;
        
        if ($hasCoordinators) {
            $query = "SELECT e.event_id, e.event_name, e.description, e.event_date, e.start_time, e.end_time, e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id, MAX(u.full_name) as created_by_name,
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
                      ORDER BY e.event_date DESC";
        } else {
            $query = "SELECT e.event_id, e.event_name, e.description, e.event_date, e.start_time, e.end_time, e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id, MAX(u.full_name) as created_by_name,
                      NULL as coordinator_id, NULL as coordinator_name, NULL as coordinator_email, NULL as coordinator_contact,
                      COUNT(DISTINCT r.registration_id) as total_registrations,
                      SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                      (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                      FROM events e
                      LEFT JOIN users u ON e.created_by = u.user_id
                      LEFT JOIN registrations r ON e.event_id = r.event_id
                      WHERE e.archived = 0
                      GROUP BY e.event_id
                      ORDER BY e.event_date DESC";
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
        // Get ALL upcoming events (past events are moved to Catalogue)
        ensureEventsTableArchived($conn); // Ensure archived column exists
        $userInfo = getUserInfo();
        $today = date('Y-m-d');
        
        // Check if coordinators table exists
        $tablesExist = $conn->query("SHOW TABLES LIKE 'coordinators'");
        $hasCoordinators = $tablesExist && $tablesExist->num_rows > 0;
        
        if ($hasCoordinators) {
            $query = "SELECT e.event_id, e.event_name, e.description, e.event_date, e.start_time, e.end_time, e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id, MAX(u.full_name) as created_by_name,
                      MAX(c.coordinator_id) as coordinator_id, MAX(c.coordinator_name) as coordinator_name, MAX(c.email) as coordinator_email, MAX(c.contact_number) as coordinator_contact,
                      COUNT(DISTINCT r.registration_id) as total_registrations,
                      SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                      (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                      FROM events e
                      LEFT JOIN users u ON e.created_by = u.user_id
                      LEFT JOIN coordinators c ON e.coordinator_id = c.coordinator_id
                      LEFT JOIN registrations r ON e.event_id = r.event_id
                      WHERE e.event_date >= ? AND e.archived = 0";
            
            // Filter by coordinator if user is a coordinator
            if (($userInfo['role'] === 'COORDINATOR' || $userInfo['role'] === 'coordinator') && $userInfo['coordinator_id']) {
                $query .= " AND e.coordinator_id = " . intval($userInfo['coordinator_id']);
            }
            
            $query .= " GROUP BY e.event_id
                      ORDER BY e.event_date DESC";
        } else {
            $query = "SELECT e.event_id, e.event_name, e.description, e.event_date, e.start_time, e.end_time, e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id, MAX(u.full_name) as created_by_name,
                      NULL as coordinator_id, NULL as coordinator_name, NULL as coordinator_email, NULL as coordinator_contact,
                      COUNT(DISTINCT r.registration_id) as total_registrations,
                      SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                      (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                      FROM events e
                      LEFT JOIN users u ON e.created_by = u.user_id
                      LEFT JOIN registrations r ON e.event_id = r.event_id
                      WHERE e.event_date >= ? AND e.archived = 0
                      GROUP BY e.event_id
                      ORDER BY e.event_date DESC";
        }
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('s', $today);
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
            $query = "SELECT e.event_id, e.event_name, e.description, e.event_date, e.start_time, e.end_time, e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id, MAX(u.full_name) as created_by_name,
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
            $query = "SELECT e.event_id, e.event_name, e.description, e.event_date, e.start_time, e.end_time, e.location, e.capacity, e.is_private, e.image_url, e.created_by, e.created_at, e.coordinator_id, MAX(u.full_name) as created_by_name,
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
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if this is a file upload request or JSON request
    if (isset($_FILES['image'])) {
        // File upload request
        $event_name = $_POST['event_name'] ?? '';
        $description = $_POST['description'] ?? '';
        $event_date = $_POST['event_date'] ?? '';
        $start_time = $_POST['start_time'] ?? '';
        $end_time = $_POST['end_time'] ?? '';
        $location = $_POST['location'] ?? '';
        $capacity = isset($_POST['capacity']) ? intval($_POST['capacity']) : 0;
        $is_private = isset($_POST['is_private']) ? intval($_POST['is_private']) : 0;
        $department = isset($_POST['department']) ? $_POST['department'] : NULL;
        $coordinator_id = isset($_POST['coordinator_id']) && $_POST['coordinator_id'] ? intval($_POST['coordinator_id']) : NULL;
        
        $image_url = null;
        
        // Debug: Log file upload details
        error_log('EVENT CREATE - FILES array: ' . json_encode($_FILES));
        error_log('EVENT CREATE - FILE[image] size: ' . $_FILES['image']['size'] . ', error: ' . $_FILES['image']['error']);
        
        // Handle file upload
        if ($_FILES['image']['size'] > 0 && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = '../uploads/';
            $uploads_path = dirname(__DIR__) . '/uploads/';
            
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
                // Store with absolute path that works from any location
                $image_url = '/Smart-Events/uploads/' . $filename;
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                exit;
            }
        }
        
        // Log image_url status before insert
        error_log('EVENT CREATE - After file handling, image_url: ' . ($image_url ? $image_url : 'NULL (no file uploaded)'));
        
        // Insert event with image
        // Check if coordinator_id column exists in events table
        $columnsResult = $conn->query("SHOW COLUMNS FROM events LIKE 'coordinator_id'");
        $hasCoordinatorColumn = $columnsResult && $columnsResult->num_rows > 0;
        
        if ($hasCoordinatorColumn && $coordinator_id) {
            $query = "INSERT INTO events (event_name, description, event_date, start_time, end_time, location, image_url, capacity, is_private, department, coordinator_id, created_by)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('sssssssiisi', $event_name, $description, $event_date, $start_time, $end_time, $location, $image_url, $capacity, $is_private, $department, $coordinator_id);
        } else {
            $query = "INSERT INTO events (event_name, description, event_date, start_time, end_time, location, image_url, capacity, is_private, department, created_by)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('sssssssiis', $event_name, $description, $event_date, $start_time, $end_time, $location, $image_url, $capacity, $is_private, $department);
        }
        
        if ($stmt->execute()) {
            $event_id = $conn->insert_id;
            
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
        $event_date = $data['event_date'] ?? '';
        $start_time = $data['start_time'] ?? '';
        $end_time = $data['end_time'] ?? '';
        $location = $data['location'] ?? '';
        $capacity = isset($data['capacity']) ? intval($data['capacity']) : 0;
        $is_private = isset($data['is_private']) ? intval($data['is_private']) : 0;
        $department = isset($data['department']) ? $data['department'] : NULL;
        $coordinator_id = isset($data['coordinator_id']) && $data['coordinator_id'] ? intval($data['coordinator_id']) : NULL;
        $image_url = null;
        
        // Insert event (JSON fallback)
        // Check if coordinator_id column exists in events table
        $columnsResult = $conn->query("SHOW COLUMNS FROM events LIKE 'coordinator_id'");
        $hasCoordinatorColumn = $columnsResult && $columnsResult->num_rows > 0;
        
        if ($hasCoordinatorColumn && $coordinator_id) {
            $query = "INSERT INTO events (event_name, description, event_date, start_time, end_time, location, image_url, capacity, is_private, department, coordinator_id, created_by)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('sssssssiisi', $event_name, $description, $event_date, $start_time, $end_time, $location, $image_url, $capacity, $is_private, $department, $coordinator_id);
        } else {
            $query = "INSERT INTO events (event_name, description, event_date, start_time, end_time, location, image_url, capacity, is_private, department, created_by)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('sssssssiis', $event_name, $description, $event_date, $start_time, $end_time, $location, $image_url, $capacity, $is_private, $department);
        }
        
        if ($stmt->execute()) {
            $event_id = $conn->insert_id;
            
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
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Coordinator assigned successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to assign coordinator: ' . $stmt->error]);
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
    $department = isset($data['department']) ? $data['department'] : NULL;
    $coordinator_id = isset($data['coordinator_id']) && $data['coordinator_id'] ? intval($data['coordinator_id']) : NULL;
    
    $image_url = $existing['image_url']; // Keep existing by default
    
    // Handle file upload if provided
    if (isset($files['image']) && $files['image']['size'] > 0) {
        $upload_dir = '../uploads/';
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
            
            $image_url = '/Smart-Events/uploads/' . $filename;
            
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
    
    // Check if coordinator_id column exists
    $columnsResult = $conn->query("SHOW COLUMNS FROM events LIKE 'coordinator_id'");
    $hasCoordinatorColumn = $columnsResult && $columnsResult->num_rows > 0;
    
    if ($hasCoordinatorColumn) {
        $query = "UPDATE events SET 
                  event_name = ?, 
                  description = ?, 
                  event_date = ?, 
                  start_time = ?, 
                  end_time = ?, 
                  location = ?, 
                  image_url = ?,
                  capacity = ?, 
                  is_private = ?,
                  department = ?,
                  coordinator_id = ?
                  WHERE event_id = ?";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('sssssssiiiii', $event_name, $description, $event_date, $start_time, $end_time, $location, $image_url, $capacity, $is_private, $department, $coordinator_id, $event_id);
    } else {
        $query = "UPDATE events SET 
                  event_name = ?, 
                  description = ?, 
                  event_date = ?, 
                  start_time = ?, 
                  end_time = ?, 
                  location = ?, 
                  image_url = ?,
                  capacity = ?, 
                  is_private = ?,
                  department = ?
                  WHERE event_id = ?";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('sssssssiiisi', $event_name, $description, $event_date, $start_time, $end_time, $location, $image_url, $capacity, $is_private, $department, $event_id);
    }
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
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
    
    // Get the event to delete associated image
    $get_query = "SELECT image_url FROM events WHERE event_id = ?";
    $stmt = $conn->prepare($get_query);
    $stmt->bind_param('i', $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $event = $result->fetch_assoc();
    
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
