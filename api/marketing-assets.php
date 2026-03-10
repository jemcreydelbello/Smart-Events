<?php
// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error: $errstr in $errfile:$errline");
    return true; // Suppress the error
});

// Marketing Assets API
header('Content-Type: application/json');

require_once '../config/db.php';

// Create uploads directory if it doesn't exist
$uploads_dir = '../uploads/marketing';
if (!is_dir($uploads_dir)) {
    @mkdir($uploads_dir, 0777, true);
}

function handleFileUpload($file) {
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    
    $uploads_dir = '../uploads/marketing';
    $filename = time() . '_' . md5(random_bytes(16)) . '_' . basename($file['name']);
    $filepath = $uploads_dir . '/' . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return 'uploads/marketing/' . $filename;
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

// Create marketing assets table if it doesn't exist
$create_table = "CREATE TABLE IF NOT EXISTS event_marketing_assets (
    asset_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    asset_type ENUM('poster', 'banner', 'social_pack') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    filename VARCHAR(255),
    file_size INT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    INDEX idx_event (event_id),
    INDEX idx_type (asset_type)
)";

$conn->query($create_table);

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
        $query = "SELECT * FROM event_marketing_assets WHERE event_id = ? ORDER BY asset_type, created_at DESC";
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
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? 'upload';
    
    // Check for multipart form data
    if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false) {
        $userInfo = getUserInfo();
        $event_id = intval($_POST['event_id'] ?? 0);
        $asset_type = $_POST['asset_type'] ?? '';
        
        if (!$event_id) {
            echo json_encode(['success' => false, 'message' => 'Event ID is required']);
            exit;
        }
        
        if (!checkEventAccess($conn, $event_id, $userInfo)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            exit;
        }
        
        if ($action === 'upload') {
            if (!isset($_FILES['file'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No file provided']);
                exit;
            }
            
            if (!in_array($asset_type, ['poster', 'banner', 'social_pack'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid asset type']);
                exit;
            }
            
            $file = $_FILES['file'];
            
            // Check for upload errors
            if ($file['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'File upload error: ' . $file['error']]);
                exit;
            }
            
            $file_path = handleFileUpload($file);
            
            if (!$file_path) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Failed to upload file']);
                exit;
            }
            
            $file_name = basename($file['name']);
            $file_size = intval($file['size']);
            $mime_type = $file['type'] ?? 'application/octet-stream';
            
            $query = "INSERT INTO event_marketing_assets (event_id, asset_type, file_path, filename, file_size, mime_type) 
                      VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            
            if (!$stmt) {
                http_response_code(500);
                error_log("Prepare failed: " . $conn->error);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('isssis', $event_id, $asset_type, $file_path, $file_name, $file_size, $mime_type);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'File uploaded successfully',
                    'asset_id' => $conn->insert_id,
                    'file_path' => $file_path,
                    'file_name' => $file_name,
                    'mime_type' => $mime_type
                ]);
            } else {
                http_response_code(500);
                error_log("Execute failed: " . $stmt->error);
                echo json_encode(['success' => false, 'message' => 'Failed to save asset: ' . $stmt->error]);
            }
            exit;
        }
    } else {
        // Handle JSON requests for delete
        $data = json_decode(file_get_contents('php://input'), true);
        
        $userInfo = getUserInfo();
        $event_id = intval($data['event_id'] ?? 0);
        $action = $data['action'] ?? 'delete';
        
        if (!$event_id) {
            echo json_encode(['success' => false, 'message' => 'Event ID is required']);
            exit;
        }
        
        if (!checkEventAccess($conn, $event_id, $userInfo)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            exit;
        }
        
        if ($action === 'delete') {
            $asset_id = intval($data['asset_id'] ?? 0);
            
            if (!$asset_id) {
                echo json_encode(['success' => false, 'message' => 'Asset ID is required']);
                exit;
            }
            
            // Get the file path before deleting
            $query = "SELECT file_path FROM event_marketing_assets WHERE asset_id = ? AND event_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('ii', $asset_id, $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $asset = $result->fetch_assoc();
            
            if (!$asset) {
                echo json_encode(['success' => false, 'message' => 'Asset not found']);
                exit;
            }
            
            // Delete from database
            $query = "DELETE FROM event_marketing_assets WHERE asset_id = ? AND event_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('ii', $asset_id, $event_id);
            
            if ($stmt->execute()) {
                // Try to delete the file
                $file_path = '../' . $asset['file_path'];
                if (file_exists($file_path)) {
                    @unlink($file_path);
                }
                
                echo json_encode(['success' => true, 'message' => 'Asset deleted']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete: ' . $stmt->error]);
            }
        }
    }
}
else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>
