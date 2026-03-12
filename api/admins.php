<?php
// Output buffering to catch any unexpected output
ob_start();

// Error handling - ensure all output is JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Helper function to safely encode JSON with invalid UTF-8 handling
function cleanUtf8Data($data) {
    if (is_array($data) || is_object($data)) {
        $cleaned = is_array($data) ? [] : new stdClass();
        foreach ($data as $key => $value) {
            $cleaned[$key] = cleanUtf8Data($value);
        }
        return $cleaned;
    } elseif (is_string($data)) {
        // Use regex-based approach to handle incomplete multibyte sequences
        // iconv() throws errors on incomplete sequences, so we use regex instead
        // Remove high bytes that don't form valid UTF-8
        $cleaned = preg_replace('/[\x80-\xFF]/', '', $data);
        // Also remove any control characters (except newlines/tabs)
        $cleaned = preg_replace('/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/u', '', $cleaned);
        return trim($cleaned);
    }
    return $data;
}

function safeJsonEncode($data) {
    // Clean data first to remove corrupt UTF-8
    $cleanedData = cleanUtf8Data($data);
    
    // Try with standard encoding first
    $json = json_encode($cleanedData);
    if ($json === false && json_last_error() === JSON_ERROR_UTF8) {
        // If UTF-8 error, retry with substitution flag
        return json_encode($cleanedData, JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_SLASHES);
    }
    return $json;
}

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error: $errstr in $errfile:$errline");
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

// Set fatal error handler
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        // Clear buffer and output error
        if (ob_get_level() > 0) {
            ob_end_clean();
        }
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error: ' . $error['message']
        ]);
    } else {
        // Normal shutdown - just flush buffer without double-outputting
        if (ob_get_level() > 0) {
            ob_end_flush();
        }
    }
});


try {
    require_once dirname(__DIR__) . '/config/db.php';
    
    // Verify database connection was successful
    if (!isset($conn) || !$conn || $conn->connect_error) {
        throw new Exception('Database connection not available: ' . ($conn->connect_error ?? 'Unknown error'));
    }
} catch (Exception $e) {
    error_log("Database config error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database config failed: ' . $e->getMessage()]);
    exit;
}

// Load activity logger
require_once dirname(__DIR__) . '/includes/activity-logger.php';

// Load email & SMTP optional (don't fail if not available)
@require_once dirname(__DIR__) . '/config/email_config.php';
@require_once dirname(__DIR__) . '/includes/SMTPMailer.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// GET - Retrieve admins
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if ($action === 'list') {
            // Get all admin users from admins table
            // Note: admin_image is now safe to select since it's VARCHAR(255) storing only filename, not BLOB
            $query = "SELECT admin_id as user_id, email, full_name, admin_image, created_at, status
                      FROM admins 
                      ORDER BY created_at DESC";
            $result = $conn->query($query);
            
            if (!$result) {
                throw new Exception('Query failed: ' . $conn->error);
            }
            
            $admins = [];
            
            if ($result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $admins[] = $row;
                }
            }
            
            http_response_code(200);
            $jsonResponse = safeJsonEncode([
                'success' => true,
                'data' => $admins,
                'total' => count($admins)
            ]);
            echo $jsonResponse;
            exit;
        } else if ($action === 'detail') {
            // Get single admin by ID
            $admin_id = intval($_GET['admin_id'] ?? 0);
            if (!$admin_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Admin ID is required']);
                exit;
            }
            
            // Don't select admin_image to avoid returning huge BLOB data in JSON
            $query = "SELECT admin_id as user_id, email, full_name, admin_image, created_at, status
                      FROM admins 
                      WHERE admin_id = ?";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            
            $stmt->bind_param('i', $admin_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Admin not found']);
                exit;
            }
            
            $admin = $result->fetch_assoc();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $admin
            ]);
        } else if ($action === 'search' && isset($_GET['q'])) {
            $searchTerm = '%' . $_GET['q'] . '%';
            // Note: admin_image is now safe to select since it's VARCHAR(255) storing only filename, not BLOB
            $query = "SELECT admin_id as user_id, email, full_name, admin_image, created_at, status
                      FROM admins 
                      WHERE (full_name LIKE ? OR email LIKE ?)
                      ORDER BY created_at DESC";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            
            $stmt->bind_param('ss', $searchTerm, $searchTerm);
            $stmt->execute();
            $result = $stmt->get_result();
            $admins = [];
            
            while ($row = $result->fetch_assoc()) {
                $admins[] = $row;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $admins,
                'total' => count($admins)
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// POST - Create new admin OR update with image
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Handle both JSON and FormData
        $is_multipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
        
        // Read JSON data once and save it
        $data = [];
        if (!$is_multipart) {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true) ?? [];
        }
        
        // Determine if this is CREATE or UPDATE
        $admin_id = null;
        if ($is_multipart) {
            $admin_id = intval($_POST['admin_id'] ?? 0);
        } else {
            $admin_id = intval($data['admin_id'] ?? 0);
        }
        
        $isUpdate = $admin_id > 0;
        
        if ($isUpdate) {
            // UPDATE operation with image file upload
            if (!$is_multipart) {
                throw new Exception('UPDATE requires FormData');
            }
            
            $full_name = trim($_POST['full_name'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $image_file = $_FILES['image'] ?? null;
            $imageFilename = null;
            
            if (!$full_name || !$email) {
                throw new Exception('Full name and email are required');
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format');
            }
            
            // Check if email already exists on a different admin
            $checkQuery = "SELECT admin_id FROM admins WHERE email = ? AND admin_id != ?";
            $checkStmt = $conn->prepare($checkQuery);
            if (!$checkStmt) {
                throw new Exception('Database error: ' . $conn->error);
            }
            $checkStmt->bind_param('si', $email, $admin_id);
            $checkStmt->execute();
            if ($checkStmt->get_result()->num_rows > 0) {
                throw new Exception('Email already exists');
            }
            $checkStmt->close();
            
            // Handle image file upload if provided
            if ($image_file && $image_file['size'] > 0) {
                $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($image_file['type'], $allowed_types)) {
                    throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
                }
                
                if ($image_file['size'] > 5 * 1024 * 1024) {
                    throw new Exception('File size must not exceed 5MB');
                }
                
                $upload_dir = '../uploads/admins/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0755, true);
                }
                
                $file_ext = pathinfo($image_file['name'], PATHINFO_EXTENSION);
                $imageFilename = 'admin_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
                $upload_path = $upload_dir . $imageFilename;
                
                if (!move_uploaded_file($image_file['tmp_name'], $upload_path)) {
                    throw new Exception('Failed to upload image');
                }
            }
            
            // Prepare update statement
            if ($imageFilename) {
                $updateQuery = "UPDATE admins SET full_name = ?, email = ?, admin_image = ?, updated_at = NOW() WHERE admin_id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                if (!$updateStmt) {
                    throw new Exception('Database error: ' . $conn->error);
                }
                $updateStmt->bind_param('sssi', $full_name, $email, $imageFilename, $admin_id);
            } else {
                $updateQuery = "UPDATE admins SET full_name = ?, email = ?, updated_at = NOW() WHERE admin_id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                if (!$updateStmt) {
                    throw new Exception('Database error: ' . $conn->error);
                }
                $updateStmt->bind_param('ssi', $full_name, $email, $admin_id);
            }
            
            if (!$updateStmt->execute()) {
                throw new Exception('Failed to update admin: ' . $updateStmt->error);
            }
            $updateStmt->close();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Admin updated successfully',
                'admin_id' => $admin_id
            ]);
            exit;
        }
        
        // CREATE operation (when admin_id is not provided)
        $full_name = null;
        $email = null;
        $password = null;
        $image_file = null;
        $imageFilename = null;
        
        if ($is_multipart) {
            // FormData (with file upload)
            $full_name = trim($_POST['full_name'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $password = trim($_POST['password'] ?? '');
            $image_file = $_FILES['image'] ?? null;
        } else {
            // JSON - use already-decoded data
            $full_name = trim($data['full_name'] ?? '');
            $email = trim($data['email'] ?? '');
            $password = trim($data['password'] ?? '');
            // For JSON, don't process base64 image - only FormData should handle images
        }
        
        // Handle file upload ONLY if image_file exists and is FormData
        if ($image_file && $image_file['size'] > 0 && isset($_FILES['image'])) {
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($image_file['type'], $allowed_types)) {
                throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
            }
            
            if ($image_file['size'] > 5 * 1024 * 1024) {
                throw new Exception('File size must not exceed 5MB');
            }
            
            // Create upload directory if it doesn't exist
            $upload_dir = '../uploads/admins/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            } elseif (!is_dir('../uploads')) {
                mkdir('../uploads', 0755, true);
            }
            
            // Generate unique filename
            $file_ext = pathinfo($image_file['name'], PATHINFO_EXTENSION);
            $imageFilename = 'admin_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
            $upload_path = $upload_dir . $imageFilename;
            
            if (!move_uploaded_file($image_file['tmp_name'], $upload_path)) {
                throw new Exception('Failed to upload image');
            }
        }
        
        if (!$full_name || !$email || !$password) {
            throw new Exception('Full name, email, and password are required');
        }
        
        if (strlen($password) < 6) {
            throw new Exception('Password must be at least 6 characters');
        }
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }
        
        // Check if email already exists in admins table
        $checkQuery = "SELECT admin_id FROM admins WHERE email = ?";
        $checkStmt = $conn->prepare($checkQuery);
        if (!$checkStmt) {
            throw new Exception('Database error: ' . $conn->error);
        }
        
        $checkStmt->bind_param('s', $email);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows > 0) {
            throw new Exception('Email already exists');
        }
        
        // Generate username from email
        $username = explode('@', $email)[0];
        
        // Hash password with bcrypt
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        
        // Insert new admin into admins table
        if ($imageFilename) {
            $insertQuery = "INSERT INTO admins (username, email, password_hash, full_name, admin_image, status) 
                           VALUES (?, ?, ?, ?, ?, 'active')";
            $insertStmt = $conn->prepare($insertQuery);
            
            if (!$insertStmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            
            $insertStmt->bind_param('sssss', $username, $email, $hashedPassword, $full_name, $imageFilename);
        } else {
            $insertQuery = "INSERT INTO admins (username, email, password_hash, full_name, status) 
                           VALUES (?, ?, ?, ?, 'active')";
            $insertStmt = $conn->prepare($insertQuery);
            
            if (!$insertStmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            
            $insertStmt->bind_param('ssss', $username, $email, $hashedPassword, $full_name);
        }
        
        if (!$insertStmt->execute()) {
            throw new Exception('Failed to create admin: ' . $insertStmt->error);
        }
        
        $newAdminId = $conn->insert_id;
        
        // Log activity - Admin Account Creation
        // Debug: Show what was received
        error_log("=== ADMIN CREATION DEBUG ===");
        error_log("Full data received: " . json_encode($data));
        error_log("creator_admin_id from data: " . ($data['creator_admin_id'] ?? 'MISSING'));
        
        // First try to get from request body (newer method), then fall back to headers
        $creator_user_id = intval($data['creator_admin_id'] ?? $_SERVER['HTTP_X_USER_ID'] ?? 0) ?: null;
        error_log("creator_user_id after parsing: " . ($creator_user_id ?? 'NULL'));
        
        // Get creator name from database if user_id is available
        $creator_name = 'System';
        if ($creator_user_id) {
            error_log("Attempting to look up admin with ID: " . $creator_user_id);
            // Try to get from admins table first - use correct column name
            $creatorQuery = "SELECT COALESCE(full_name, username) as name FROM admins WHERE admin_id = ? LIMIT 1";
            $creatorStmt = $conn->prepare($creatorQuery);
            if ($creatorStmt) {
                $creatorStmt->bind_param('i', $creator_user_id);
                $creatorStmt->execute();
                $creatorResult = $creatorStmt->get_result();
                if ($creatorResult->num_rows > 0) {
                    $creatorRow = $creatorResult->fetch_assoc();
                    $creator_name = $creatorRow['name'];
                    error_log("Found creator: " . $creator_name);
                } else {
                    error_log("No creator found with admin_id: " . $creator_user_id);
                }
                $creatorStmt->close();
            } else {
                error_log("Failed to prepare query: " . $conn->error);
            }
        } else {
            error_log("creator_user_id is NULL or 0");
        }
        
        $description = "Create Account: " . $full_name . " | By: " . $creator_name;
        logActivity($creator_user_id, 'CREATE', 'ADMIN', $newAdminId, $description);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Admin created successfully',
            'data' => [
                'admin_id' => $newAdminId,
                'email' => $email,
                'full_name' => $full_name,
                'status' => 'active'
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// PUT - Update admin details or password
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        // Try admin_id first, then user_id
        $admin_id = intval($data['admin_id'] ?? 0);
        if ($admin_id === 0) {
            $admin_id = intval($data['user_id'] ?? 0);
        }
        $action_type = $data['action_type'] ?? 'update'; // 'update', 'change_password', 'deactivate', 'activate', 'archive'
        
        if (!$admin_id) {
            throw new Exception('Admin ID is required');
        }
        
        if ($action_type === 'deactivate') {
            $updateQuery = "UPDATE admins SET status = 'inactive' WHERE admin_id = ?";
            $updateStmt = $conn->prepare($updateQuery);
            
            if (!$updateStmt) {
                throw new Exception('Database error: ' . $conn->error);
            }
            
            $updateStmt->bind_param('i', $admin_id);
            
            if (!$updateStmt->execute()) {
                throw new Exception('Failed to deactivate admin: ' . $updateStmt->error);
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Admin account deactivated successfully'
            ]);
        } else if ($action_type === 'activate') {
            $updateQuery = "UPDATE admins SET status = 'active' WHERE admin_id = ?";
            $updateStmt = $conn->prepare($updateQuery);
            
            if (!$updateStmt) {
                throw new Exception('Database error: ' . $conn->error);
            }
            
            $updateStmt->bind_param('i', $admin_id);
            
            if (!$updateStmt->execute()) {
                throw new Exception('Failed to activate admin: ' . $updateStmt->error);
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Admin account activated successfully'
            ]);
        } else if ($action_type === 'archive') {
            $updateQuery = "UPDATE admins SET status = 'archived' WHERE admin_id = ?";
            $updateStmt = $conn->prepare($updateQuery);
            
            if (!$updateStmt) {
                throw new Exception('Database error: ' . $conn->error);
            }
            
            $updateStmt->bind_param('i', $admin_id);
            
            if (!$updateStmt->execute()) {
                throw new Exception('Failed to archive admin: ' . $updateStmt->error);
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Admin account archived successfully'
            ]);
        } else if ($action_type === 'change_password') {
            $newPassword = trim($data['new_password'] ?? '');
            $confirmPassword = trim($data['confirm_password'] ?? '');
            
            if (!$newPassword || !$confirmPassword) {
                throw new Exception('New password and confirmation are required');
            }
            
            if ($newPassword !== $confirmPassword) {
                throw new Exception('Passwords do not match');
            }
            
            if (strlen($newPassword) < 6) {
                throw new Exception('Password must be at least 6 characters');
            }
            
            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            $updateQuery = "UPDATE admins SET password_hash = ? WHERE admin_id = ?";
            $updateStmt = $conn->prepare($updateQuery);
            
            if (!$updateStmt) {
                throw new Exception('Database error: ' . $conn->error);
            }
            
            $updateStmt->bind_param('si', $hashedPassword, $admin_id);
            
            if (!$updateStmt->execute()) {
                throw new Exception('Failed to update password: ' . $updateStmt->error);
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Password updated successfully'
            ]);
        } else {
            // Update admin details
            $full_name = trim($data['full_name'] ?? '');
            $email = trim($data['email'] ?? '');
            $new_password = trim($data['new_password'] ?? '');
            $admin_image = isset($data['admin_image']) ? $data['admin_image'] : null;
            
            // Process image if provided (save to uploads folder)
            $imageFilename = null;
            if ($admin_image && strpos($admin_image, 'data:image') === 0) {
                // Extract base64 data from data URI
                $imageData = explode(',', $admin_image);
                if (count($imageData) === 2) {
                    $imageBlob = base64_decode($imageData[1]);
                    // Generate unique filename
                    $imageFilename = 'admin_' . time() . '_' . uniqid() . '.jpg';
                    $uploadPath = '../uploads/' . $imageFilename;
                    
                    // Create uploads folder if it doesn't exist
                    if (!is_dir('../uploads')) {
                        mkdir('../uploads', 0755, true);
                    }
                    
                    // Save image file
                    if (!file_put_contents($uploadPath, $imageBlob)) {
                        throw new Exception('Failed to save image file');
                    }
                    
                    // Delete old image if exists
                    $getOldQuery = "SELECT admin_image FROM admins WHERE admin_id = ?";
                    $getOldStmt = $conn->prepare($getOldQuery);
                    $getOldStmt->bind_param('i', $admin_id);
                    $getOldStmt->execute();
                    $oldResult = $getOldStmt->get_result();
                    if ($oldResult->num_rows > 0) {
                        $oldRow = $oldResult->fetch_assoc();
                        if ($oldRow['admin_image'] && file_exists('../uploads/' . $oldRow['admin_image'])) {
                            unlink('../uploads/' . $oldRow['admin_image']);
                        }
                    }
                    $getOldStmt->close();
                }
            }
            
            if (!$full_name || !$email) {
                throw new Exception('Full name and email are required');
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format');
            }
            
            // Check if email is unique (excluding current admin)
            $checkQuery = "SELECT admin_id FROM admins WHERE email = ? AND admin_id != ?";
            $checkStmt = $conn->prepare($checkQuery);
            
            if (!$checkStmt) {
                throw new Exception('Database error: ' . $conn->error);
            }
            
            $checkStmt->bind_param('si', $email, $admin_id);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows > 0) {
                throw new Exception('Email already exists');
            }
            
            // Validate password if provided
            if ($new_password) {
                if (strlen($new_password) < 6) {
                    throw new Exception('Password must be at least 6 characters');
                }
            }
            
            // Update admin in admins table
            if ($imageFilename && $new_password) {
                $hashedPassword = password_hash($new_password, PASSWORD_BCRYPT);
                $updateQuery = "UPDATE admins SET full_name = ?, email = ?, password_hash = ?, admin_image = ?, updated_at = NOW() WHERE admin_id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                
                if (!$updateStmt) {
                    throw new Exception('Database error: ' . $conn->error);
                }
                
                $updateStmt->bind_param('ssssi', $full_name, $email, $hashedPassword, $imageFilename, $admin_id);
            } else if ($imageFilename) {
                $updateQuery = "UPDATE admins SET full_name = ?, email = ?, admin_image = ?, updated_at = NOW() WHERE admin_id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                
                if (!$updateStmt) {
                    throw new Exception('Database error: ' . $conn->error);
                }
                
                $updateStmt->bind_param('sssi', $full_name, $email, $imageFilename, $admin_id);
            } else if ($new_password) {
                $hashedPassword = password_hash($new_password, PASSWORD_BCRYPT);
                $updateQuery = "UPDATE admins SET full_name = ?, email = ?, password_hash = ?, updated_at = NOW() WHERE admin_id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                
                if (!$updateStmt) {
                    throw new Exception('Database error: ' . $conn->error);
                }
                
                $updateStmt->bind_param('sssi', $full_name, $email, $hashedPassword, $admin_id);
            } else {
                $updateQuery = "UPDATE admins SET full_name = ?, email = ?, updated_at = NOW() WHERE admin_id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                
                if (!$updateStmt) {
                    throw new Exception('Database error: ' . $conn->error);
                }
                
                $updateStmt->bind_param('ssi', $full_name, $email, $admin_id);
            }
            
            if (!$updateStmt->execute()) {
                throw new Exception('Failed to update admin: ' . $updateStmt->error);
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Admin updated successfully',
                'data' => [
                    'admin_id' => $admin_id,
                    'full_name' => $full_name,
                    'email' => $email,
                    'status' => 'active'
                ]
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// DELETE - Delete admin user
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        $admin_id = intval($data['admin_id'] ?? 0);
        if (!$admin_id) {
            $admin_id = intval($data['user_id'] ?? 0);
        }
        
        if (!$admin_id) {
            throw new Exception('Admin ID is required');
        }
        
        // Prevent deleting your own account (check against current session if available)
        $currentAdmin = json_decode($_COOKIE['admin'] ?? '{}', true);
        if (isset($currentAdmin['admin_id']) && $currentAdmin['admin_id'] == $admin_id) {
            throw new Exception('Cannot delete your own admin account');
        }
        
        // Delete admin from admins table
        $deleteQuery = "DELETE FROM admins WHERE admin_id = ?";
        $deleteStmt = $conn->prepare($deleteQuery);
        
        if (!$deleteStmt) {
            throw new Exception('Database error: ' . $conn->error);
        }
        
        $deleteStmt->bind_param('i', $admin_id);
        
        if (!$deleteStmt->execute()) {
            throw new Exception('Failed to delete admin: ' . $deleteStmt->error);
        }
        
        if ($deleteStmt->affected_rows === 0) {
            throw new Exception('Admin not found');
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Admin deleted successfully'
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();

