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

// Helper function to ensure table exists
function ensureCatalogueTableExists($conn) {
    $check_query = "SHOW TABLES LIKE 'catalogue'";
    $result = $conn->query($check_query);
    
    if ($result->num_rows == 0) {
        // Table doesn't exist, create it
        $create_query = "CREATE TABLE catalogue (
            catalogue_id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NULL,
            event_name VARCHAR(200) NOT NULL,
            event_date DATE NOT NULL,
            location VARCHAR(200),
            description TEXT,
            image_url VARCHAR(255),
            is_private BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE SET NULL
        )";
        
        if (!$conn->query($create_query)) {
            throw new Exception('Failed to create catalogue table: ' . $conn->error);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'list') {
        // Get all catalogued events
        try {
            ensureCatalogueTableExists($conn);
            
            $query = "SELECT * FROM catalogue ORDER BY event_date DESC";
            $result = $conn->query($query);
            
            if (!$result) {
                throw new Exception('Query failed: ' . $conn->error);
            }
            
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $row['is_private'] = intval($row['is_private']);
                $events[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $events]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    elseif ($action === 'lookup') {
        // Get past events (event_date < today) that are not yet in catalogue
        try {
            ensureCatalogueTableExists($conn);
            
            $today = date('Y-m-d');
            
            $query = "SELECT e.event_id, e.event_name, e.event_date, e.location, e.image_url, e.is_private, e.description
                      FROM events e
                      WHERE e.event_date < ?
                      AND e.event_id NOT IN (SELECT COALESCE(event_id, -1) FROM catalogue WHERE event_id IS NOT NULL)
                      ORDER BY e.event_date DESC";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param('s', $today);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $row['is_private'] = intval($row['is_private']);
                $events[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $events]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle both JSON and form-encoded POST data
    $action = '';
    $post_data = $_POST;
    
    // Log the request for debugging
    error_log('POST Request - Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
    error_log('POST Data: ' . json_encode($_POST));
    error_log('FILES: ' . json_encode(array_keys($_FILES)));
    
    // Check if request is JSON
    $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($content_type, 'application/json') !== false) {
        $json_input = file_get_contents('php://input');
        if ($json_input) {
            $post_data = json_decode($json_input, true) ?? [];
        }
    }
    
    $action = $post_data['action'] ?? '';
    error_log('Detected Action: ' . $action);
    
    if ($action === 'add') {
        // Add existing event to catalogue
        try {
            ensureCatalogueTableExists($conn);
            
            $event_id = isset($post_data['event_id']) ? intval($post_data['event_id']) : 0;
            
            if (!$event_id) {
                echo json_encode(['success' => false, 'message' => 'Event ID required']);
                exit;
            }
            
            // Get event details
            $event_query = "SELECT event_id, event_name, event_date, location, image_url, is_private, description
                           FROM events WHERE event_id = ?";
            
            $stmt = $conn->prepare($event_query);
            $stmt->bind_param('i', $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $event = $result->fetch_assoc();
            
            if (!$event) {
                echo json_encode(['success' => false, 'message' => 'Event not found']);
                exit;
            }
            
            // Check if already in catalogue
            $check_query = "SELECT catalogue_id FROM catalogue WHERE event_id = ?";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param('i', $event_id);
            $check_stmt->execute();
            
            if ($check_stmt->get_result()->num_rows > 0) {
                echo json_encode(['success' => false, 'message' => 'Event already in catalogue']);
                exit;
            }
            
            // Add to catalogue
            $insert_query = "INSERT INTO catalogue (event_id, event_name, event_date, location, description, image_url, is_private)
                            VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $insert_stmt = $conn->prepare($insert_query);
            $is_private = intval($event['is_private']);
            $insert_stmt->bind_param('isssssi', 
                $event_id,
                $event['event_name'],
                $event['event_date'],
                $event['location'],
                $event['description'],
                $event['image_url'],
                $is_private
            );
            
            if ($insert_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Event added to catalogue']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to add event: ' . $insert_stmt->error]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    elseif ($action === 'add_with_image') {
        // Add event to catalogue with custom image upload (or use original image if not provided)
        try {
            ensureCatalogueTableExists($conn);
            
            $event_id = isset($_POST['event_id']) ? intval($_POST['event_id']) : 0;
            
            if (!$event_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Event ID required']);
                exit;
            }
            
            // Get event details INCLUDING original image_url
            $event_query = "SELECT event_id, event_name, event_date, location, is_private, description, image_url
                           FROM events WHERE event_id = ?";
            
            $stmt = $conn->prepare($event_query);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('i', $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $event = $result->fetch_assoc();
            
            if (!$event) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Event not found']);
                exit;
            }
            
            // Check if already in catalogue
            $check_query = "SELECT catalogue_id FROM catalogue WHERE event_id = ?";
            $check_stmt = $conn->prepare($check_query);
            if (!$check_stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error']);
                exit;
            }
            
            $check_stmt->bind_param('i', $event_id);
            $check_stmt->execute();
            
            if ($check_stmt->get_result()->num_rows > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Event already in catalogue']);
                exit;
            }
            
            $image_url = null;
            
            // Handle image upload if provided
            if (isset($_FILES['image']) && $_FILES['image']['error'] == UPLOAD_ERR_OK) {
                $upload_dir = '../uploads/';
                
                if (!is_dir($upload_dir)) {
                    if (!mkdir($upload_dir, 0755, true)) {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'Failed to create upload directory']);
                        exit;
                    }
                }
                
                $file_ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                $file_name = 'catalogue_' . time() . '_' . uniqid() . '.' . $file_ext;
                $file_path = $upload_dir . $file_name;
                
                // Validate image - check extension first
                $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                if (!in_array($file_ext, $allowed_ext)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.']);
                    exit;
                }
                
                // Validate MIME type
                if (function_exists('finfo_file')) {
                    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    if ($finfo === false) {
                        // Fallback to extension-only validation
                        $mime_type = null;
                    } else {
                        $mime_type = finfo_file($finfo, $_FILES['image']['tmp_name']);
                        finfo_close($finfo);
                    }
                    
                    if ($mime_type && !in_array($mime_type, $allowed_types)) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => 'Invalid image MIME type']);
                        exit;
                    }
                }
                
                if (!move_uploaded_file($_FILES['image']['tmp_name'], $file_path)) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                    exit;
                }
                
                $image_url = 'uploads/' . $file_name;
            }
            
            // Add to catalogue with custom image
            $insert_query = "INSERT INTO catalogue (event_id, event_name, event_date, location, description, image_url, is_private)
                            VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $insert_stmt = $conn->prepare($insert_query);
            if (!$insert_stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $is_private = intval($event['is_private']);
            $insert_stmt->bind_param('isssssi', 
                $event_id,
                $event['event_name'],
                $event['event_date'],
                $event['location'],
                $event['description'],
                $image_url,
                $is_private
            );
            
            if ($insert_stmt->execute()) {
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Event added to catalogue with image']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to add event: ' . $insert_stmt->error]);
            }
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            exit;
        }
    }
    elseif ($action === 'add_direct') {
        // Add new past event directly to catalogue
        try {
            ensureCatalogueTableExists($conn);
            
            // Use $_POST for form data (which includes FormData)
            $event_name = $_POST['event_name'] ?? '';
            $event_date = $_POST['event_date'] ?? '';
            $location = $_POST['location'] ?? '';
            $description = $_POST['description'] ?? '';
            $is_private = isset($_POST['is_private']) ? 1 : 0;
            
            if (!$event_name || !$event_date) {
                echo json_encode(['success' => false, 'message' => 'Event name and date are required']);
                exit;
            }
            
            $image_url = null;
            
            // Handle file upload
            if (isset($_FILES['image']) && $_FILES['image']['size'] > 0) {
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
                $filename = 'catalogue_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
                $filepath = $uploads_path . $filename;
                
                // Move uploaded file
                if (move_uploaded_file($_FILES['image']['tmp_name'], $filepath)) {
                    $image_url = 'uploads/' . $filename;
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                    exit;
                }
            }
            
            // Insert into catalogue
            $query = "INSERT INTO catalogue (event_name, event_date, location, description, image_url, is_private)
                     VALUES (?, ?, ?, ?, ?, ?)";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param('sssssi', $event_name, $event_date, $location, $description, $image_url, $is_private);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Event added to catalogue']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to add event: ' . $stmt->error]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    elseif ($action === 'remove') {
        // Remove event from catalogue
        try {
            ensureCatalogueTableExists($conn);
            
            $catalogue_id = isset($post_data['catalogue_id']) ? intval($post_data['catalogue_id']) : 0;
            
            if (!$catalogue_id) {
                echo json_encode(['success' => false, 'message' => 'Catalogue ID required']);
                exit;
            }
            
            // Get image URL to delete file
            $get_query = "SELECT image_url FROM catalogue WHERE catalogue_id = ?";
            $stmt = $conn->prepare($get_query);
            $stmt->bind_param('i', $catalogue_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $catalogue = $result->fetch_assoc();
            
            // Delete from catalogue
            $delete_query = "DELETE FROM catalogue WHERE catalogue_id = ?";
            $delete_stmt = $conn->prepare($delete_query);
            $delete_stmt->bind_param('i', $catalogue_id);
            
            if ($delete_stmt->execute()) {
                // Delete image file if exists
                if ($catalogue && $catalogue['image_url']) {
                    $image_path = dirname(__DIR__) . '/' . $catalogue['image_url'];
                    if (file_exists($image_path)) {
                        unlink($image_path);
                    }
                }
                echo json_encode(['success' => true, 'message' => 'Event removed from catalogue']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to remove event: ' . $delete_stmt->error]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
else {
    // Handle JSON POST requests
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }
    
    $action = $data['action'] ?? '';
    
    if ($action === 'add') {
        // Add existing event to catalogue via JSON
        try {
            ensureCatalogueTableExists($conn);
            
            $event_id = isset($data['event_id']) ? intval($data['event_id']) : 0;
            
            if (!$event_id) {
                echo json_encode(['success' => false, 'message' => 'Event ID required']);
                exit;
            }
            
            // Get event details
            $event_query = "SELECT event_id, event_name, event_date, location, image_url, is_private, description
                           FROM events WHERE event_id = ?";
            
            $stmt = $conn->prepare($event_query);
            $stmt->bind_param('i', $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $event = $result->fetch_assoc();
            
            if (!$event) {
                echo json_encode(['success' => false, 'message' => 'Event not found']);
                exit;
            }
            
            // Check if already in catalogue
            $check_query = "SELECT catalogue_id FROM catalogue WHERE event_id = ?";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param('i', $event_id);
            $check_stmt->execute();
            
            if ($check_stmt->get_result()->num_rows > 0) {
                echo json_encode(['success' => false, 'message' => 'Event already in catalogue']);
                exit;
            }
            
            // Add to catalogue
            $insert_query = "INSERT INTO catalogue (event_id, event_name, event_date, location, description, image_url, is_private)
                            VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $insert_stmt = $conn->prepare($insert_query);
            $is_private = intval($event['is_private']);
            $insert_stmt->bind_param('isssssi', 
                $event_id,
                $event['event_name'],
                $event['event_date'],
                $event['location'],
                $event['description'],
                $event['image_url'],
                $is_private
            );
            
            if ($insert_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Event added to catalogue']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to add event: ' . $insert_stmt->error]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    elseif ($action === 'remove') {
        // Remove event from catalogue via JSON
        try {
            ensureCatalogueTableExists($conn);
            
            $catalogue_id = isset($data['catalogue_id']) ? intval($data['catalogue_id']) : 0;
            
            if (!$catalogue_id) {
                echo json_encode(['success' => false, 'message' => 'Catalogue ID required']);
                exit;
            }
            
            // Get image URL to delete file
            $get_query = "SELECT image_url FROM catalogue WHERE catalogue_id = ?";
            $stmt = $conn->prepare($get_query);
            $stmt->bind_param('i', $catalogue_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $catalogue = $result->fetch_assoc();
            
            // Delete from catalogue
            $delete_query = "DELETE FROM catalogue WHERE catalogue_id = ?";
            $delete_stmt = $conn->prepare($delete_query);
            $delete_stmt->bind_param('i', $catalogue_id);
            
            if ($delete_stmt->execute()) {
                // Delete image file if exists
                if ($catalogue && $catalogue['image_url']) {
                    $image_path = dirname(__DIR__) . '/' . $catalogue['image_url'];
                    if (file_exists($image_path)) {
                        unlink($image_path);
                    }
                }
                echo json_encode(['success' => true, 'message' => 'Event removed from catalogue']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to remove event: ' . $delete_stmt->error]);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
