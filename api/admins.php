<?php
// Set proper headers before any output
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}

// Enable error logging but hide from output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set error handler to JSON output
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $errstr,
        'error' => true
    ]);
    exit;
});

require_once '../db_config.php';

// Check if database connection exists
if (!isset($conn) || !$conn) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// GET - Retrieve admins
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if ($action === 'list') {
            // Get all admin users from admins table
            $query = "SELECT admin_id as user_id, email, full_name, created_at, status, admin_image
                      FROM admins 
                      ORDER BY created_at DESC";
            $result = $conn->query($query);
            $admins = [];
            
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    // Add full image URL if image exists
                    if ($row['admin_image']) {
                        $row['admin_image'] = '../uploads/' . $row['admin_image'];
                    }
                    $admins[] = $row;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $admins,
                'total' => count($admins)
            ]);
        } else if ($action === 'search' && isset($_GET['q'])) {
            $searchTerm = '%' . $_GET['q'] . '%';
            $query = "SELECT admin_id as user_id, email, full_name, created_at, status, admin_image
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
                // Add full image URL if image exists
                if ($row['admin_image']) {
                    $row['admin_image'] = '../uploads/' . $row['admin_image'];
                }
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

// POST - Create new admin
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        $full_name = trim($data['full_name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');
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
?>
