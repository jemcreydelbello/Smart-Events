<?php
// Giveaways API
header('Content-Type: application/json');

require_once '../config/db.php';

// Create uploads directory if it doesn't exist
$uploads_dir = '../uploads/giveaways';
if (!is_dir($uploads_dir)) {
    @mkdir($uploads_dir, 0777, true);
}

function handleFileUpload($file) {
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    
    $uploads_dir = '../uploads/giveaways';
    $filename = time() . '_' . md5(random_bytes(16)) . '_' . basename($file['name']);
    $filepath = $uploads_dir . '/' . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return 'uploads/giveaways/' . $filename;
    }
    
    return null;
}

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

// Create giveaways table if it doesn't exist
$create_giveaways_table = "CREATE TABLE IF NOT EXISTS event_giveaways (
    giveaway_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    bundle_inclusion LONGTEXT,
    estimated_price DECIMAL(10, 2),
    reference VARCHAR(255),
    lead_time VARCHAR(100),
    further_info LONGTEXT,
    image_path VARCHAR(500),
    poster_path VARCHAR(500),
    banner_path VARCHAR(500),
    social_pack_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    INDEX idx_event (event_id)
)";

$conn->query($create_giveaways_table);

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
        $query = "SELECT * FROM event_giveaways WHERE event_id = ? ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $items]);
    }
    elseif ($action === 'get') {
        $giveaway_id = intval($_GET['giveaway_id'] ?? 0);
        $query = "SELECT * FROM event_giveaways WHERE giveaway_id = ? AND event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $giveaway_id, $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $item = $result->fetch_assoc();
        
        if ($item) {
            echo json_encode(['success' => true, 'data' => $item]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Item not found']);
        }
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : 'create');
    
    // Handle file uploads
    if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false) {
        // Parse multipart form data
        $userInfo = getUserInfo();
        $event_id = intval($_POST['event_id'] ?? 0);
        
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
            $name = $_POST['name'] ?? '';
            $location = $_POST['location'] ?? '';
            $bundle_inclusion = $_POST['bundle_inclusion'] ?? '';
            $estimated_price = floatval($_POST['estimated_price'] ?? 0);
            $reference = $_POST['reference'] ?? '';
            $lead_time = $_POST['lead_time'] ?? '';
            $further_info = $_POST['further_info'] ?? '';
            
            $image_path = null;
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $image_path = handleFileUpload($_FILES['image']);
            }
            
            $poster_path = null;
            if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
                $poster_path = handleFileUpload($_FILES['poster']);
            }
            
            $banner_path = null;
            if (isset($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                $banner_path = handleFileUpload($_FILES['banner']);
            }
            
            $social_pack_path = null;
            if (isset($_FILES['social_pack']) && $_FILES['social_pack']['error'] === UPLOAD_ERR_OK) {
                $social_pack_path = handleFileUpload($_FILES['social_pack']);
            }
            
            if (!$name) {
                echo json_encode(['success' => false, 'message' => 'Name is required']);
                exit;
            }
            
            $query = "INSERT INTO event_giveaways (event_id, name, location, bundle_inclusion, estimated_price, reference, lead_time, further_info, image_path, poster_path, banner_path, social_pack_path) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('isssdsssssss', $event_id, $name, $location, $bundle_inclusion, $estimated_price, $reference, $lead_time, $further_info, $image_path, $poster_path, $banner_path, $social_pack_path);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Giveaway created', 'giveaway_id' => $conn->insert_id]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create: ' . $stmt->error]);
            }
        }
        elseif ($action === 'update') {
            $giveaway_id = intval($_POST['giveaway_id'] ?? 0);
            $name = $_POST['name'] ?? '';
            $location = $_POST['location'] ?? '';
            $bundle_inclusion = $_POST['bundle_inclusion'] ?? '';
            $estimated_price = floatval($_POST['estimated_price'] ?? 0);
            $reference = $_POST['reference'] ?? '';
            $lead_time = $_POST['lead_time'] ?? '';
            $further_info = $_POST['further_info'] ?? '';
            
            if (!$giveaway_id) {
                echo json_encode(['success' => false, 'message' => 'Giveaway ID is required']);
                exit;
            }
            
            // Build update query based on which files are uploaded
            $setFields = [];
            $bindTypes = '';
            $bindValues = [];
            
            $setFields[] = 'name = ?';
            $bindTypes .= 's';
            $bindValues[] = $name;
            
            $setFields[] = 'location = ?';
            $bindTypes .= 's';
            $bindValues[] = $location;
            
            $setFields[] = 'bundle_inclusion = ?';
            $bindTypes .= 's';
            $bindValues[] = $bundle_inclusion;
            
            $setFields[] = 'estimated_price = ?';
            $bindTypes .= 'd';
            $bindValues[] = $estimated_price;
            
            $setFields[] = 'reference = ?';
            $bindTypes .= 's';
            $bindValues[] = $reference;
            
            $setFields[] = 'lead_time = ?';
            $bindTypes .= 's';
            $bindValues[] = $lead_time;
            
            $setFields[] = 'further_info = ?';
            $bindTypes .= 's';
            $bindValues[] = $further_info;
            
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $image_path = handleFileUpload($_FILES['image']);
                if ($image_path) {
                    $setFields[] = 'image_path = ?';
                    $bindTypes .= 's';
                    $bindValues[] = $image_path;
                }
            }
            
            if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
                $poster_path = handleFileUpload($_FILES['poster']);
                if ($poster_path) {
                    $setFields[] = 'poster_path = ?';
                    $bindTypes .= 's';
                    $bindValues[] = $poster_path;
                }
            }
            
            if (isset($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                $banner_path = handleFileUpload($_FILES['banner']);
                if ($banner_path) {
                    $setFields[] = 'banner_path = ?';
                    $bindTypes .= 's';
                    $bindValues[] = $banner_path;
                }
            }
            
            if (isset($_FILES['social_pack']) && $_FILES['social_pack']['error'] === UPLOAD_ERR_OK) {
                $social_pack_path = handleFileUpload($_FILES['social_pack']);
                if ($social_pack_path) {
                    $setFields[] = 'social_pack_path = ?';
                    $bindTypes .= 's';
                    $bindValues[] = $social_pack_path;
                }
            }
            
            // Add giveaway_id and event_id to bind values for WHERE clause
            $bindTypes .= 'ii';
            $bindValues[] = $giveaway_id;
            $bindValues[] = $event_id;
            
            $query = "UPDATE event_giveaways SET " . implode(', ', $setFields) . " WHERE giveaway_id = ? AND event_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param($bindTypes, ...$bindValues);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Giveaway updated']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update: ' . $stmt->error]);
            }
        }
        elseif ($action === 'update_images') {
            // Handle image uploads for giveaway
            $giveaway_id = intval($_POST['giveaway_id'] ?? 0);
            
            if (!$giveaway_id) {
                echo json_encode(['success' => false, 'message' => 'Giveaway ID is required']);
                exit;
            }
            
            // Verify giveaway belongs to this event
            $query = "SELECT event_id FROM event_giveaways WHERE giveaway_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $giveaway_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $giveaway = $result->fetch_assoc();
            
            if (!$giveaway || $giveaway['event_id'] != $event_id) {
                echo json_encode(['success' => false, 'message' => 'Giveaway not found']);
                exit;
            }
            
            // Handle file uploads
            $update_fields = [];
            $bind_types = '';
            $bind_values = [];
            
            if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
                $poster_path = handleFileUpload($_FILES['poster']);
                if ($poster_path) {
                    $update_fields[] = 'poster_path = ?';
                    $bind_types .= 's';
                    $bind_values[] = $poster_path;
                }
            }
            
            if (isset($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                $banner_path = handleFileUpload($_FILES['banner']);
                if ($banner_path) {
                    $update_fields[] = 'banner_path = ?';
                    $bind_types .= 's';
                    $bind_values[] = $banner_path;
                }
            }
            
            if (isset($_FILES['social_pack']) && $_FILES['social_pack']['error'] === UPLOAD_ERR_OK) {
                $social_pack_path = handleFileUpload($_FILES['social_pack']);
                if ($social_pack_path) {
                    $update_fields[] = 'social_pack_path = ?';
                    $bind_types .= 's';
                    $bind_values[] = $social_pack_path;
                }
            }
            
            if (!empty($update_fields)) {
                $bind_types .= 'i';
                $bind_values[] = $giveaway_id;
                
                $query = "UPDATE event_giveaways SET " . implode(', ', $update_fields) . " WHERE giveaway_id = ?";
                $stmt = $conn->prepare($query);
                $stmt->bind_param($bind_types, ...$bind_values);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Images updated successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update images: ' . $stmt->error]);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'No files uploaded']);
            }
        }
    } else {
        // Handle JSON requests (for create, update, and delete)
        $data = json_decode(file_get_contents('php://input'), true);

        
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
            $name = $data['name'] ?? '';
            $location = $data['location'] ?? '';
            $bundle_inclusion = $data['bundle_inclusion'] ?? '';
            $estimated_price = floatval($data['estimated_price'] ?? 0);
            $reference = $data['reference'] ?? '';
            $lead_time = $data['lead_time'] ?? '';
            $further_info = $data['further_info'] ?? '';
            
            if (!$name) {
                echo json_encode(['success' => false, 'message' => 'Name is required']);
                exit;
            }
            
            $query = "INSERT INTO event_giveaways (event_id, name, location, bundle_inclusion, estimated_price, reference, lead_time, further_info) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('isssdsss', $event_id, $name, $location, $bundle_inclusion, $estimated_price, $reference, $lead_time, $further_info);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Giveaway created', 'giveaway_id' => $conn->insert_id]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create: ' . $stmt->error]);
            }
        }
        elseif ($action === 'update') {
            $giveaway_id = intval($data['giveaway_id'] ?? 0);
            $name = $data['name'] ?? '';
            $location = $data['location'] ?? '';
            $bundle_inclusion = $data['bundle_inclusion'] ?? '';
            $estimated_price = floatval($data['estimated_price'] ?? 0);
            $reference = $data['reference'] ?? '';
            $lead_time = $data['lead_time'] ?? '';
            $further_info = $data['further_info'] ?? '';
            
            if (!$giveaway_id) {
                echo json_encode(['success' => false, 'message' => 'Giveaway ID is required']);
                exit;
            }
            
            $query = "UPDATE event_giveaways SET name = ?, location = ?, bundle_inclusion = ?, estimated_price = ?, reference = ?, lead_time = ?, further_info = ? 
                      WHERE giveaway_id = ? AND event_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('sssdssiii', $name, $location, $bundle_inclusion, $estimated_price, $reference, $lead_time, $further_info, $giveaway_id, $event_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Giveaway updated']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update: ' . $stmt->error]);
            }
        }
        elseif ($action === 'delete') {
            $giveaway_id = intval($data['giveaway_id'] ?? 0);
            
            if (!$giveaway_id) {
                echo json_encode(['success' => false, 'message' => 'Giveaway ID is required']);
                exit;
            }
            
            $query = "DELETE FROM event_giveaways WHERE giveaway_id = ? AND event_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('ii', $giveaway_id, $event_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Giveaway deleted']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    }
}
else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
