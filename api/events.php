<?php
// Error handling - ensure all output is JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

require_once '../db_config.php';

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
    $action = $_GET['action'] ?? '';
    
    if ($action === 'list') {
        // Get all UPCOMING/ACTIVE events (not past events - those go to Catalogue)
        $today = date('Y-m-d');
        $query = "SELECT e.*, u.full_name as created_by_name,
                  COUNT(DISTINCT r.registration_id) as total_registrations,
                  SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                  (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                  FROM events e
                  LEFT JOIN users u ON e.created_by = u.user_id
                  LEFT JOIN registrations r ON e.event_id = r.event_id
                  WHERE e.event_date >= ?
                  GROUP BY e.event_id
                  ORDER BY e.event_date ASC";
        
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
    elseif ($action === 'list_all') {
        // Get ALL events (including past ones) - for calendar and dashboard
        $query = "SELECT e.*, u.full_name as created_by_name,
                  COUNT(DISTINCT r.registration_id) as total_registrations,
                  SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                  (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                  FROM events e
                  LEFT JOIN users u ON e.created_by = u.user_id
                  LEFT JOIN registrations r ON e.event_id = r.event_id
                  GROUP BY e.event_id
                  ORDER BY e.event_date DESC";
        
        $result = $conn->query($query);
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
        
        $query = "SELECT e.*, u.full_name as created_by_name,
                  COUNT(DISTINCT r.registration_id) as total_registrations,
                  SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as attended_count,
                  (e.capacity - COUNT(DISTINCT CASE WHEN r.status IN ('REGISTERED', 'ATTENDED') THEN r.registration_id END)) as available_spots
                  FROM events e
                  LEFT JOIN users u ON e.created_by = u.user_id
                  LEFT JOIN registrations r ON e.event_id = r.event_id
                  WHERE e.event_id = ?
                  GROUP BY e.event_id";
        
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
        $private_code = ($is_private && isset($_POST['private_code'])) ? $_POST['private_code'] : NULL;
        $department = isset($_POST['department']) ? $_POST['department'] : NULL;
        
        $image_url = null;
        
        // Handle file upload
        if ($_FILES['image']['size'] > 0) {
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
                $image_url = 'uploads/' . $filename;
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                exit;
            }
        }
        
        // Insert event with image
        $query = "INSERT INTO events (event_name, description, event_date, start_time, end_time, location, image_url, capacity, is_private, private_code, department)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('sssssssiiss', $event_name, $description, $event_date, $start_time, $end_time, $location, $image_url, $capacity, $is_private, $private_code, $department);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Event created successfully', 'event_id' => $conn->insert_id]);
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
        $private_code = ($is_private && isset($data['private_code'])) ? $data['private_code'] : NULL;
        $department = isset($data['department']) ? $data['department'] : NULL;
        $image_url = null;
        
        $query = "INSERT INTO events (event_name, description, event_date, start_time, end_time, location, image_url, capacity, is_private, private_code, department)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('sssssssiiss', $event_name, $description, $event_date, $start_time, $end_time, $location, $image_url, $capacity, $is_private, $private_code, $department);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Event created successfully', 'event_id' => $conn->insert_id]);
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
    if (!$event_id) {
        echo json_encode(['success' => false, 'message' => 'Event ID required']);
        exit;
    }
    
    // Get existing event to preserve image if not updating
    $query = "SELECT image_url FROM events WHERE event_id = ?";
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
    $private_code = ($is_private && isset($data['private_code'])) ? $data['private_code'] : $existing['private_code'] ?? NULL;
    $department = isset($data['department']) ? $data['department'] : NULL;
    
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
            
            $image_url = 'uploads/' . $filename;
            
            // Delete old image if exists
            if ($existing['image_url']) {
                $old_path = dirname(__DIR__) . '/' . $existing['image_url'];
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
              private_code = ?,
              department = ?
              WHERE event_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sssssssiissi', $event_name, $description, $event_date, $start_time, $end_time, $location, $image_url, $capacity, $is_private, $private_code, $department, $event_id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
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
