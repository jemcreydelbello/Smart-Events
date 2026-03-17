<?php
// Error handling - ensure all output is JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set JSON headers
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}

// Set custom error handler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $errstr]);
    exit;
});

// Set exception handler
set_exception_handler(function($exception) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Exception: ' . $exception->getMessage()]);
    exit;
});

// Include database configuration
require_once '../config/db.php';

// Verify database connection
if (!isset($conn)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection not initialized']);
    exit;
}

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Helper function to ensure catalogue table exists
function ensureCatalogueTableExists($conn) {
    $check_query = "SHOW TABLES LIKE 'catalogue'";
    $result = $conn->query($check_query);
    
    if ($result->num_rows == 0) {
        $create_query = "CREATE TABLE IF NOT EXISTS catalogue (
            catalogue_id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NULL,
            is_manual BOOLEAN DEFAULT FALSE,
            event_name VARCHAR(200) NOT NULL,
            event_date DATE NOT NULL,
            location VARCHAR(200),
            description TEXT,
            image_url VARCHAR(255),
            is_private BOOLEAN DEFAULT FALSE,
            is_published BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE SET NULL
        )";
        
        if (!$conn->query($create_query)) {
            throw new Exception('Failed to create catalogue table: ' . $conn->error);
        }
    } else {
        // Add is_manual column if it doesn't exist
        $check_col = "SHOW COLUMNS FROM catalogue LIKE 'is_manual'";
        $col_result = $conn->query($check_col);
        if ($col_result->num_rows == 0) {
            $alter_query = "ALTER TABLE catalogue ADD COLUMN is_manual BOOLEAN DEFAULT FALSE AFTER event_id";
            $conn->query($alter_query); // Ignore error if column already exists
        }
        
        // Add is_published column if it doesn't exist
        $check_col = "SHOW COLUMNS FROM catalogue LIKE 'is_published'";
        $col_result = $conn->query($check_col);
        if ($col_result->num_rows == 0) {
            $alter_query = "ALTER TABLE catalogue ADD COLUMN is_published BOOLEAN DEFAULT FALSE";
            $conn->query($alter_query); // Ignore error if column already exists
        }
    }
}

// Ensure events_images table exists
function ensureEventsImagesTableExists($conn) {
    $check_query = "SHOW TABLES LIKE 'events_images'";
    $result = $conn->query($check_query);
    
    if ($result->num_rows == 0) {
        $create_query = "CREATE TABLE IF NOT EXISTS events_images (
            image_id INT AUTO_INCREMENT PRIMARY KEY,
            catalogue_id INT NOT NULL,
            image_url VARCHAR(255) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (catalogue_id) REFERENCES catalogue(catalogue_id) ON DELETE CASCADE
        )";
        
        if (!$conn->query($create_query)) {
            throw new Exception('Failed to create events_images table: ' . $conn->error);
        }
    }
}

// Handle gallery images upload
function handleGalleryImagesUpload($conn, $catalogue_id) {
    ensureEventsImagesTableExists($conn);
    
    if (!isset($_FILES['gallery_images'])) {
        return; // No gallery images to process
    }
    
    $upload_dir = '../uploads/events_img/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    // Handle array of files
    $files = $_FILES['gallery_images'];
    $file_count = count($files['name']);
    
    for ($i = 0; $i < $file_count; $i++) {
        if ($files['error'][$i] !== UPLOAD_ERR_OK) {
            continue; // Skip failed uploads
        }
        
        $file_ext = strtolower(pathinfo($files['name'][$i], PATHINFO_EXTENSION));
        if (!in_array($file_ext, $allowed)) {
            continue; // Skip invalid formats
        }
        
        // Generate unique filename
        $file_name = 'gallery_' . time() . '_' . uniqid() . '.' . $file_ext;
        $file_path = $upload_dir . $file_name;
        
        if (move_uploaded_file($files['tmp_name'][$i], $file_path)) {
            // Insert into events_images table
            $insert_query = "INSERT INTO events_images (catalogue_id, image_url) VALUES (?, ?)";
            $stmt = $conn->prepare($insert_query);
            
            if ($stmt) {
                $stmt->bind_param('is', $catalogue_id, $file_name);
                $stmt->execute();
                $stmt->close();
            }
        }
    }
}

try {
    // GET REQUEST
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? '';
        
        if ($action === 'list') {
            ensureCatalogueTableExists($conn);
            $query = "SELECT catalogue_id, event_id, is_manual, event_name, event_date, location, description, image_url, is_private, is_published, created_at FROM catalogue WHERE is_published = 1 ORDER BY created_at DESC";
            $result = $conn->query($query);
            if (!$result) {
                throw new Exception('Query failed: ' . $conn->error);
            }
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $row['is_private'] = intval($row['is_private']);
                $row['is_manual'] = intval($row['is_manual']);
                $events[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $events]);
        } 
        elseif ($action === 'sync_completed') {
            // Automatically add all completed (past) events to catalogue that aren't already there
            ensureCatalogueTableExists($conn);
            
            // Get all past events not in catalogue (check end_event, not just date)
            $select_query = "SELECT e.event_id, e.event_name, DATE(e.start_event) as event_date, e.location, e.description, e.image_url, e.is_private
                            FROM events e
                            WHERE e.end_event < NOW()
                            AND e.start_event IS NOT NULL
                            AND e.start_event != '0000-00-00 00:00:00'
                            AND e.end_event != '0000-00-00 00:00:00'
                            AND e.event_id NOT IN (SELECT COALESCE(event_id, -1) FROM catalogue WHERE event_id IS NOT NULL)
                            ORDER BY e.start_event DESC";
            
            $stmt = $conn->prepare($select_query);
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            // No longer need to bind $today since we're using NOW()
            if (!$stmt->execute()) {
                throw new Exception('Execute failed: ' . $stmt->error);
            }
            $result = $stmt->get_result();
            $completed_events = [];
            $sync_count = 0;
            
            while ($event = $result->fetch_assoc()) {
                $completed_events[] = $event;
            }
            $stmt->close();
            
            // Insert all completed events into catalogue
            if (count($completed_events) > 0) {
                $insert_query = "INSERT INTO catalogue (event_id, is_manual, event_name, event_date, location, description, image_url, is_private) VALUES (?, 0, ?, ?, ?, ?, ?, ?)";
                $insert_stmt = $conn->prepare($insert_query);
                if (!$insert_stmt) {
                    throw new Exception('Prepare insert failed: ' . $conn->error);
                }
                
                foreach ($completed_events as $event) {
                    $event_id = $event['event_id'];
                    $event_name = $event['event_name'];
                    $event_date = $event['event_date'];
                    $location = $event['location'];
                    $description = $event['description'];
                    $image_url = $event['image_url'];
                    $is_private = intval($event['is_private']);
                    
                    $insert_stmt->bind_param('isssssi', $event_id, $event_name, $event_date, $location, $description, $image_url, $is_private);
                    
                    if ($insert_stmt->execute()) {
                        $sync_count++;
                    }
                }
                $insert_stmt->close();
                
                // Mark synced events as archived in the events table (only if they're actually finished)
                $archive_query = "UPDATE events SET archived = 1 WHERE end_event < NOW() AND event_id IN (SELECT event_id FROM catalogue WHERE is_published = 0)";
                if (!$conn->query($archive_query)) {
                    error_log("Warning: Could not archive synced events: " . $conn->error);
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Auto-sync complete',
                'synced_count' => $sync_count,
                'data' => $completed_events
            ]);
        }
        elseif ($action === 'lookup') {
            ensureCatalogueTableExists($conn);
            // Show past/completed events from the events table that haven't been PUBLISHED to catalogue yet
            // UNION with unpublished manual events from the catalogue table (is_manual=1 AND is_published=0)
            $query = "(SELECT NULL as catalogue_id, e.event_id, e.event_name, DATE(e.start_event) as event_date, TIME(e.start_event) as start_time, TIME(e.end_event) as end_time, e.location, e.image_url, e.is_private, e.description
                      FROM events e
                      WHERE e.end_event < NOW()
                      AND e.start_event IS NOT NULL
                      AND e.start_event != '0000-00-00 00:00:00'
                      AND e.end_event != '0000-00-00 00:00:00'
                      AND e.event_id NOT IN (SELECT event_id FROM catalogue WHERE event_id IS NOT NULL AND is_published = 1))
                      UNION
                      (SELECT c.catalogue_id, c.event_id, c.event_name, c.event_date, NULL as start_time, NULL as end_time, c.location, c.image_url, c.is_private, c.description
                      FROM catalogue c
                      WHERE c.is_manual = 1
                      AND c.is_published = 0)
                      ORDER BY event_date DESC";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            if (!$stmt->execute()) {
                throw new Exception('Execute failed: ' . $stmt->error);
            }
            $result = $stmt->get_result();
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $row['is_private'] = intval($row['is_private']);
                $events[] = $row;
            }
            echo json_encode(['success' => true, 'data' => $events]);
            $stmt->close();
        }
        elseif ($action === 'get_gallery') {
            ensureEventsImagesTableExists($conn);
            $catalogue_id = intval($_GET['catalogue_id'] ?? 0);
            
            if (!$catalogue_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Catalogue ID required']);
                exit;
            }
            
            // Get all images for this catalogue
            $query = "SELECT image_id, image_url, uploaded_at FROM events_images WHERE catalogue_id = ? ORDER BY uploaded_at DESC";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('i', $catalogue_id);
            if (!$stmt->execute()) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Execution failed: ' . $stmt->error]);
                exit;
            }
            
            $result = $stmt->get_result();
            $images = [];
            while ($row = $result->fetch_assoc()) {
                $images[] = $row;
            }
            $stmt->close();
            
            echo json_encode(['success' => true, 'data' => $images]);
        }
        else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action: ' . $action]);
        }
    }
    // POST REQUEST
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = '';
        $post_data = $_POST;
        
        // Handle JSON POST
        $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($content_type, 'application/json') !== false) {
            $json_input = file_get_contents('php://input');
            if ($json_input) {
                $post_data = json_decode($json_input, true) ?? [];
            }
        }
        
        $action = $post_data['action'] ?? '';
        
        if ($action === 'add_with_image') {
            ensureCatalogueTableExists($conn);
            $event_id = intval($_POST['event_id'] ?? 0);
            $catalogue_id = intval($_POST['catalogue_id'] ?? 0);
            
            $event = null;
            $is_manual_event = false;
            
            // Try to get event from catalogue table FIRST (for manually added unpublished events)
            if ($catalogue_id > 0) {
                $event_query = "SELECT catalogue_id, event_id, event_name, event_date, location, is_private, description, image_url, is_manual FROM catalogue WHERE catalogue_id = ?";
                $stmt = $conn->prepare($event_query);
                if (!$stmt) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Query preparation failed: ' . $conn->error]);
                    exit;
                }
                $stmt->bind_param('i', $catalogue_id);
                if (!$stmt->execute()) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Query execution failed: ' . $stmt->error]);
                    exit;
                }
                $result = $stmt->get_result();
                $event = $result->fetch_assoc();
                $stmt->close();
                
                if ($event) {
                    $is_manual_event = true;
                    // Set event_id to NULL if it wasn't set in catalogue (manual event)
                    if ($event['event_id'] === null) {
                        $event_id = null;
                    } else {
                        $event_id = $event['event_id'];
                    }
                }
            }
            
            // If not found in catalogue, try events table (for regular events)
            if (!$event && $event_id > 0) {
                $event_query = "SELECT event_id, event_name, DATE(start_event) as event_date, location, is_private, description, image_url FROM events WHERE event_id = ?";
                $stmt = $conn->prepare($event_query);
                if (!$stmt) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Query preparation failed: ' . $conn->error]);
                    exit;
                }
                $stmt->bind_param('i', $event_id);
                if (!$stmt->execute()) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Query execution failed: ' . $stmt->error]);
                    exit;
                }
                $result = $stmt->get_result();
                $event = $result->fetch_assoc();
                $stmt->close();
                $is_manual_event = false;
            }
            
            if (!$event) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Event not found']);
                exit;
            }
            
            $image_url = $event['image_url']; // Use existing image from events table
            $new_image_uploaded = false;
            
            // Handle image upload if provided
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $upload_dir = '../uploads/events/';
                if (!is_dir($upload_dir)) {
                    mkdir($upload_dir, 0755, true);
                }
                
                $file_ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                if (!in_array($file_ext, $allowed)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid image format']);
                    exit;
                }
                
                $file_name = 'cat_' . time() . '_' . uniqid() . '.' . $file_ext;
                $file_path = $upload_dir . $file_name;
                
                if (!move_uploaded_file($_FILES['image']['tmp_name'], $file_path)) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                    exit;
                }
                
                $image_url = $file_name;
                $new_image_uploaded = true;
            }
            
            // Check if event already in catalogue
            if ($is_manual_event && $catalogue_id) {
                // For manually added events, check by catalogue_id
                $check_query = "SELECT catalogue_id FROM catalogue WHERE catalogue_id = ?";
                $check_stmt = $conn->prepare($check_query);
                if (!$check_stmt) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Check query failed: ' . $conn->error]);
                    exit;
                }
                $check_stmt->bind_param('i', $catalogue_id);
            } else {
                // For regular events, check by event_id
                $check_query = "SELECT catalogue_id FROM catalogue WHERE event_id = ?";
                $check_stmt = $conn->prepare($check_query);
                if (!$check_stmt) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Check query failed: ' . $conn->error]);
                    exit;
                }
                $check_stmt->bind_param('i', $event_id);
            }
            
            if (!$check_stmt->execute()) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Check execution failed: ' . $check_stmt->error]);
                exit;
            }
            $check_result = $check_stmt->get_result();
            
            if ($check_result->num_rows > 0) {
                // Event already in catalogue - update image if provided and mark as published
                $catalogue_row = $check_result->fetch_assoc();
                $catalogue_id = $catalogue_row['catalogue_id'];
                
                // Update query - include image_url only if a new image was uploaded
                if ($new_image_uploaded) {
                    $update_query = "UPDATE catalogue SET is_published = 1, image_url = ? WHERE catalogue_id = ?";
                    $update_stmt = $conn->prepare($update_query);
                    if (!$update_stmt) {
                        throw new Exception('Prepare update failed: ' . $conn->error);
                    }
                    $update_stmt->bind_param('si', $image_url, $catalogue_id);
                } else {
                    $update_query = "UPDATE catalogue SET is_published = 1 WHERE catalogue_id = ?";
                    $update_stmt = $conn->prepare($update_query);
                    if (!$update_stmt) {
                        throw new Exception('Prepare update failed: ' . $conn->error);
                    }
                    $update_stmt->bind_param('i', $catalogue_id);
                }
                
                if ($update_stmt->execute()) {
                    $catalogue_id = $catalogue_row['catalogue_id'];
                    // Handle gallery images upload
                    handleGalleryImagesUpload($conn, $catalogue_id);
                    echo json_encode(['success' => true, 'message' => 'Event published to catalogue']);
                } else {
                    throw new Exception('Failed to publish event: ' . $update_stmt->error);
                }
                $update_stmt->close();
            } else {
                // Event not in catalogue yet - insert with is_published = 1
                $is_manual_flag = $is_manual_event ? 1 : 0;
                
                if ($event_id) {
                    // Regular event - include event_id
                    $insert_query = "INSERT INTO catalogue (event_id, is_manual, event_name, event_date, location, description, image_url, is_private, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)";
                } else {
                    // Manually added event - event_id will be NULL
                    $insert_query = "INSERT INTO catalogue (event_id, is_manual, event_name, event_date, location, description, image_url, is_private, is_published) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, 1)";
                }
                
                $insert_stmt = $conn->prepare($insert_query);
                if (!$insert_stmt) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Insert prepare failed: ' . $conn->error]);
                    exit;
                }
                
                // Extract values to variables for proper binding
                $event_id_val = $event_id ? intval($event['event_id']) : null;
                $event_name = $event['event_name'];
                $event_date = $event['event_date'];
                $location = $event['location'] ?? '';
                $description = $event['description'] ?? '';
                $image_url_val = $image_url ?? '';
                $is_private = intval($event['is_private']);
                
                if ($event_id) {
                    $insert_stmt->bind_param('sisssssi', $event_id_val, $is_manual_flag, $event_name, $event_date, $location, $description, $image_url_val, $is_private);
                } else {
                    $insert_stmt->bind_param('isssssi', $is_manual_flag, $event_name, $event_date, $location, $description, $image_url_val, $is_private);
                }
                
                if (!$insert_stmt->execute()) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Insert execution failed: ' . $insert_stmt->error]);
                    exit;
                }
                
                $catalogue_id = $conn->insert_id;
                // Handle gallery images upload
                handleGalleryImagesUpload($conn, $catalogue_id);
                
                echo json_encode(['success' => true, 'message' => 'Event added to catalogue']);
                $insert_stmt->close();
            }
            $check_stmt->close();
        } 
        elseif ($action === 'add_manual') {
            ensureCatalogueTableExists($conn);
            
            $event_name = $_POST['event_name'] ?? '';
            $event_date = $_POST['event_date'] ?? '';
            $location = $_POST['location'] ?? '';
            $description = $_POST['description'] ?? '';
            
            if (!$event_name || !$event_date) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Event name and date are required']);
                exit;
            }
            
            $image_url = null;
            
            // Handle image upload if provided
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $upload_dir = '../uploads/events/';
                if (!is_dir($upload_dir)) {
                    mkdir($upload_dir, 0755, true);
                }
                
                $file_ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
                $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                if (!in_array($file_ext, $allowed)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid image format']);
                    exit;
                }
                
                $file_name = 'cat_' . time() . '_' . uniqid() . '.' . $file_ext;
                $file_path = $upload_dir . $file_name;
                
                if (!move_uploaded_file($_FILES['image']['tmp_name'], $file_path)) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                    exit;
                }
                
                $image_url = $file_name;
            }
            
            // Insert into catalogue (no event_id since it's manual)
            $insert_query = "INSERT INTO catalogue (event_id, is_manual, event_name, event_date, location, description, image_url, is_private, is_published) VALUES (NULL, 1, ?, ?, ?, ?, ?, ?, 1)";
            $insert_stmt = $conn->prepare($insert_query);
            if (!$insert_stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Insert prepare failed: ' . $conn->error]);
                exit;
            }
            $is_private = 0;
            $insert_stmt->bind_param('sssssi', $event_name, $event_date, $location, $description, $image_url, $is_private);
            
            if (!$insert_stmt->execute()) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Insert execution failed: ' . $insert_stmt->error]);
                exit;
            }
            echo json_encode(['success' => true, 'message' => 'Event added to catalogue']);
            $insert_stmt->close();
        } 
        elseif ($action === 'republish') {
            ensureCatalogueTableExists($conn);
            $catalogue_id = intval($post_data['catalogue_id'] ?? 0);
            
            if (!$catalogue_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Catalogue ID required']);
                exit;
            }
            
            // Set is_published to 1 for manual events
            $update_query = "UPDATE catalogue SET is_published = 1 WHERE catalogue_id = ? AND is_manual = 1";
            $update_stmt = $conn->prepare($update_query);
            if (!$update_stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            $update_stmt->bind_param('i', $catalogue_id);
            
            if ($update_stmt->execute()) {
                if ($update_stmt->affected_rows > 0) {
                    echo json_encode(['success' => true, 'message' => 'Event republished']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Event not found or not a manual event']);
                }
            } else {
                throw new Exception('Failed to republish event: ' . $update_stmt->error);
            }
            $update_stmt->close();
        } 
        elseif ($action === 'remove') {
            ensureCatalogueTableExists($conn);
            $catalogue_id = intval($post_data['catalogue_id'] ?? 0);
            
            if (!$catalogue_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Catalogue ID required']);
                exit;
            }
            
            // Update is_published to 0 instead of deleting
            $update_query = "UPDATE catalogue SET is_published = 0 WHERE catalogue_id = ?";
            $update_stmt = $conn->prepare($update_query);
            if (!$update_stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            $update_stmt->bind_param('i', $catalogue_id);
            
            if ($update_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Event removed from catalogue']);
            } else {
                throw new Exception('Failed to remove event: ' . $update_stmt->error);
            }
            $update_stmt->close();
        } 
        elseif ($action === 'toggle_private') {
            ensureCatalogueTableExists($conn);
            
            $catalogue_id = intval($post_data['catalogue_id'] ?? 0);
            $is_private = intval($post_data['is_private'] ?? 0);
            
            if (!$catalogue_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Catalogue ID required']);
                exit;
            }
            
            // Update is_private status
            $update_query = "UPDATE catalogue SET is_private = ? WHERE catalogue_id = ?";
            $update_stmt = $conn->prepare($update_query);
            if (!$update_stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            $update_stmt->bind_param('ii', $is_private, $catalogue_id);
            
            if ($update_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Visibility updated']);
            } else {
                throw new Exception('Failed to update visibility: ' . $update_stmt->error);
            }
            $update_stmt->close();
        } 
        elseif ($action === 'update_cover') {
            ensureCatalogueTableExists($conn);
            $catalogue_id = intval($post_data['catalogue_id'] ?? 0);
            
            if (!$catalogue_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Catalogue ID required']);
                exit;
            }
            
            // Check if file is provided
            if (!isset($_FILES['cover_image']) || $_FILES['cover_image']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No image provided']);
                exit;
            }
            
            $file = $_FILES['cover_image'];
            
            // Validate file
            $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (!in_array($file_ext, $allowed)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid image format. Allowed: jpg, jpeg, png, gif, webp']);
                exit;
            }
            
            // Check file size (max 5MB)
            $max_size = 5 * 1024 * 1024; // 5MB
            if ($file['size'] > $max_size) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'File size exceeds 5MB limit']);
                exit;
            }
            
            // Create upload directory if it doesn't exist
            $upload_dir = '../uploads/events/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }
            
            // Generate unique filename
            $file_name = 'cover_' . time() . '_' . uniqid() . '.' . $file_ext;
            $file_path = $upload_dir . $file_name;
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $file_path)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                exit;
            }
            
            // Update catalogue record with new image
            $update_query = "UPDATE catalogue SET image_url = ? WHERE catalogue_id = ?";
            $update_stmt = $conn->prepare($update_query);
            if (!$update_stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $update_stmt->bind_param('si', $file_name, $catalogue_id);
            
            if ($update_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Event cover updated successfully', 'image_url' => $file_name]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update cover: ' . $update_stmt->error]);
            }
            $update_stmt->close();
        }
        elseif ($action === 'add_gallery') {
            ensureEventsImagesTableExists($conn);
            $catalogue_id = intval($post_data['catalogue_id'] ?? 0);
            
            if (!$catalogue_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Catalogue ID required']);
                exit;
            }
            
            // Handle gallery images upload
            handleGalleryImagesUpload($conn, $catalogue_id);
            
            echo json_encode(['success' => true, 'message' => 'Gallery images added successfully']);
        }
        elseif ($action === 'delete_gallery_image') {
            ensureEventsImagesTableExists($conn);
            $image_id = intval($post_data['image_id'] ?? 0);
            $catalogue_id = intval($post_data['catalogue_id'] ?? 0);
            
            if (!$image_id || !$catalogue_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Image ID and Catalogue ID required']);
                exit;
            }
            
            // Get image URL first to delete file
            $get_query = "SELECT image_url FROM events_images WHERE image_id = ? AND catalogue_id = ?";
            $get_stmt = $conn->prepare($get_query);
            if (!$get_stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
                exit;
            }
            
            $get_stmt->bind_param('ii', $image_id, $catalogue_id);
            if (!$get_stmt->execute()) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Execution failed: ' . $get_stmt->error]);
                exit;
            }
            
            $result = $get_stmt->get_result();
            $image = $result->fetch_assoc();
            $get_stmt->close();
            
            if (!$image) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Image not found']);
                exit;
            }
            
            // Delete file from filesystem
            $file_path = '../uploads/events_img/' . $image['image_url'];
            if (file_exists($file_path)) {
                unlink($file_path);
            }
            
            // Delete from database
            $delete_query = "DELETE FROM events_images WHERE image_id = ? AND catalogue_id = ?";
            $delete_stmt = $conn->prepare($delete_query);
            if (!$delete_stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Delete query failed: ' . $conn->error]);
                exit;
            }
            
            $delete_stmt->bind_param('ii', $image_id, $catalogue_id);
            if (!$delete_stmt->execute()) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Delete failed: ' . $delete_stmt->error]);
                exit;
            }
            
            $delete_stmt->close();
            echo json_encode(['success' => true, 'message' => 'Image deleted successfully']);
        }
        else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action: ' . $action]);
        }
    } 
    else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// Close database connection
if (isset($conn)) {
    $conn->close();
}
?>

