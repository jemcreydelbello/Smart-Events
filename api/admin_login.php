<?php
header('Content-Type: application/json');
require_once '../config/db.php';
require_once '../includes/activity-logger.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Handle CORS preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// LOGIN - Admin authentication
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Username and password are required']);
            exit;
        }
        
        // Query admin by username or email (exclude admin_image blob for now)
        $query = "SELECT admin_id, username, email, password_hash, full_name,
                         status, login_attempts, locked_until 
                  FROM admins 
                  WHERE (username = ? OR email = ?)";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Database error: ' . $conn->error);
        }
        
        $stmt->bind_param('ss', $username, $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            // Log failed attempt
            logFailedLogin(null, $ip_address, $user_agent, 'Invalid username or email');
            
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid username or email']);
            exit;
        }
        
        $admin = $result->fetch_assoc();
        
        // Check if account is locked
        if ($admin['locked_until']) {
            $lockedUntil = new DateTime($admin['locked_until']);
            $now = new DateTime();
            
            if ($now < $lockedUntil) {
                logFailedLogin($admin['admin_id'], $ip_address, $user_agent, 'Account locked - too many failed attempts');
                
                http_response_code(429);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Account is temporarily locked. Please try again later.',
                    'locked_until' => $admin['locked_until']
                ]);
                exit;
            } else {
                // Unlock account
                $unlockQuery = "UPDATE admins SET login_attempts = 0, locked_until = NULL WHERE admin_id = ?";
                $unlockStmt = $conn->prepare($unlockQuery);
                $unlockStmt->bind_param('i', $admin['admin_id']);
                $unlockStmt->execute();
            }
        }
        
        // Check if account is active
        if ($admin['status'] !== 'active') {
            logFailedLogin($admin['admin_id'], $ip_address, $user_agent, 'Account is inactive');
            
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Your account is inactive. Contact system administrator.']);
            exit;
        }
        
        // Verify password (check if password is set first)
        if (empty($admin['password_hash']) || !password_verify($password, $admin['password_hash'])) {
            // Increment failed login attempts
            $attempts = $admin['login_attempts'] + 1;
            $lockedUntilTime = null;
            
            if ($attempts >= 5) {
                // Lock account for 30 minutes
                $lockedUntilTime = date('Y-m-d H:i:s', strtotime('+30 minutes'));
                logFailedLogin($admin['admin_id'], $ip_address, $user_agent, 'Too many failed attempts - account locked');
                
                $updateQuery = "UPDATE admins SET login_attempts = ?, locked_until = ? WHERE admin_id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                $updateStmt->bind_param('isi', $attempts, $lockedUntilTime, $admin['admin_id']);
                $updateStmt->execute();
                
                http_response_code(429);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Too many failed login attempts. Account locked for 30 minutes.'
                ]);
            } else {
                // Update attempts
                $updateQuery = "UPDATE admins SET login_attempts = ? WHERE admin_id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                $updateStmt->bind_param('ii', $attempts, $admin['admin_id']);
                $updateStmt->execute();
                
                logFailedLogin($admin['admin_id'], $ip_address, $user_agent, 'Invalid password');
                
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Invalid password']);
            }
            exit;
        }
        
        // Reset login attempts and lock status
        $resetQuery = "UPDATE admins SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE admin_id = ?";
        $resetStmt = $conn->prepare($resetQuery);
        $resetStmt->bind_param('i', $admin['admin_id']);
        $resetStmt->execute();
        
        // Log successful login
        logSuccessfulLogin($admin['admin_id'], $ip_address, $user_agent);
        
        // Get proper full name for activity log - just use full_name from database
        $admin_full_name = !empty($admin['full_name']) ? $admin['full_name'] : $admin['username'];
        
        // Log activity - Admin Login
        $description = "Admin Login: " . $admin_full_name;
        logActivity($admin['admin_id'], 'LOGIN', 'ADMIN', $admin['admin_id'], $description);

        // Return success with admin data
        $adminData = [
            'id' => $admin['admin_id'],
            'admin_id' => $admin['admin_id'],
            'username' => $admin['username'],
            'email' => $admin['email'],
            'full_name' => $admin['full_name'],
            'role' => 'ADMIN',
            'role_name' => 'ADMIN'
        ];
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'admin' => $adminData
        ]);
        exit;
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
        exit;
    }
}

// COORDINATOR LOGIN - Coordinator authentication
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'coordinator_login') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email/Username and password are required']);
            exit;
        }
        
        // Query coordinator by email or username
        $query = "SELECT coordinator_id, coordinator_name, email, password_hash, is_active, coordinator_image
                  FROM coordinators 
                  WHERE email = ? OR coordinator_name = ?";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception('Database error: ' . $conn->error);
        }
        
        $stmt->bind_param('ss', $email, $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid email/username or password']);
            exit;
        }
        
        $coordinator = $result->fetch_assoc();
        
        // Check if coordinator account is active
        if (!$coordinator['is_active']) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Your account is pending setup. Please contact an administrator.']);
            exit;
        }
        
        // Verify password (check if password is set first)
        if (empty($coordinator['password_hash']) || !password_verify($password, $coordinator['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid email/username or password']);
            exit;
        }
        
        // Return success with coordinator data
        $userData = [
            'user_id' => $coordinator['coordinator_id'],
            'id' => $coordinator['coordinator_id'],
            'email' => $coordinator['email'],
            'full_name' => $coordinator['coordinator_name'],
            'role' => 'COORDINATOR',
            'role_name' => 'COORDINATOR',
            'coordinator_id' => $coordinator['coordinator_id']
        ];
        
        // Log activity - Coordinator Login
        $description = "Coordinator Login: " . $coordinator['coordinator_name'];
        logActivity($coordinator['coordinator_id'], 'LOGIN', 'COORDINATOR', $coordinator['coordinator_id'], $description);
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => $userData
        ]);
        exit;
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
        exit;
    }
}

// LOGOUT - End admin/coordinator session
elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'logout') {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        $user_id = intval($data['admin_id'] ?? $data['user_id'] ?? 0);
        $user_role = isset($data['role']) ? strtoupper($data['role']) : 'ADMIN'; // Default to ADMIN if not specified
        
        if ($user_id > 0) {
            // Get user full name for activity log
            $user_full_name = 'System';
            $entity_type = 'ADMIN';
            
            if ($user_role === 'COORDINATOR') {
                $userQuery = "SELECT coordinator_name FROM coordinators WHERE coordinator_id = ?";
                $entity_type = 'COORDINATOR';
            } else {
                $userQuery = "SELECT COALESCE(full_name, username) as name FROM admins WHERE admin_id = ?";
                $entity_type = 'ADMIN';
            }
            
            $userStmt = $conn->prepare($userQuery);
            $userStmt->bind_param('i', $user_id);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            
            if ($userResult->num_rows > 0) {
                $userRow = $userResult->fetch_assoc();
                $user_full_name = $user_role === 'COORDINATOR' ? $userRow['coordinator_name'] : $userRow['name'];
            }
            $userStmt->close();
            
            // Update logout time in login logs (for admin only, coordinators don't use admin_login_logs)
            if ($user_role === 'ADMIN') {
                $query = "UPDATE admin_login_logs 
                         SET logout_time = NOW() 
                         WHERE admin_id = ? AND logout_time IS NULL 
                         ORDER BY login_time DESC LIMIT 1";
                
                $stmt = $conn->prepare($query);
                $stmt->bind_param('i', $user_id);
                $stmt->execute();
            }
            
            // Log activity - User Logout
            $description = $entity_type . " Logout: " . $user_full_name;
            logActivity($user_id, 'LOGOUT', $entity_type, $user_id, $description);
        }
        
        echo json_encode(['success' => true, 'message' => 'Logout successful']);
        exit;
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Logout error: ' . $e->getMessage()]);
        exit;
    }
}

// GET - Retrieve admin info
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if ($action === 'get' && isset($_GET['admin_id'])) {
            $admin_id = intval($_GET['admin_id']);
            
            $query = "SELECT admin_id, username, email, full_name, admin_image, status, last_login, created_at 
                     FROM admins WHERE admin_id = ? AND status = 'active'";
            
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $admin_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $admin = $result->fetch_assoc();
                
                // Convert admin_image to base64 if available
                if ($admin['admin_image']) {
                    $admin['admin_image'] = 'data:image/jpeg;base64,' . base64_encode($admin['admin_image']);
                }
                
                echo json_encode(['success' => true, 'data' => $admin]);
                exit;
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Admin not found']);
                exit;
            }
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        exit;
    }
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$conn->close();

// ========== HELPER FUNCTIONS ==========

function logSuccessfulLogin($admin_id, $ip_address, $user_agent) {
    global $conn;
    
    $query = "INSERT INTO admin_login_logs (admin_id, ip_address, user_agent, success) 
              VALUES (?, ?, ?, TRUE)";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iss', $admin_id, $ip_address, $user_agent);
    $stmt->execute();
}

function logFailedLogin($admin_id, $ip_address, $user_agent, $reason) {
    global $conn;
    
    $query = "INSERT INTO admin_login_logs (admin_id, ip_address, user_agent, success, reason) 
              VALUES (?, ?, ?, FALSE, ?)";
    
    $stmt = $conn->prepare($query);
    if ($admin_id) {
        $stmt->bind_param('isss', $admin_id, $ip_address, $user_agent, $reason);
    } else {
        $stmt->bind_param('isss', $admin_id, $ip_address, $user_agent, $reason);
    }
    $stmt->execute();
}

?>
