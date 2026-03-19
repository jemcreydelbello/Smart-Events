<?php
// Suppress all output except JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start output buffering to catch any unexpected output
ob_start();

// Set JSON header FIRST before any code execution
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-Role, X-User-Id');

// Clean any buffered output
ob_clean();

// Include database configuration
if (file_exists('../config/db.php')) {
    require_once '../config/db.php';
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Get user headers for authentication
    $userRole = $_SERVER['HTTP_X_USER_ROLE'] ?? null;
    $userId = $_SERVER['HTTP_X_USER_ID'] ?? null;

    // Only admins can access email configuration
    if (empty($userRole) || ($userRole !== 'admin' && $userRole !== 'ADMIN')) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Only admins can access email configuration'
        ]);
        exit;
    }

    // Verify database constants are defined
    if (!defined('DB_HOST') || !defined('DB_USER') || !defined('DB_PASSWORD') || !defined('DB_NAME')) {
        throw new Exception('Database configuration not found');
    }

    $conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    $conn->set_charset('utf8mb4');

    // GET: Fetch email configuration
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Try to get the configuration with id=1
        $result = $conn->query("SELECT * FROM email_config WHERE id = 1 LIMIT 1");
        
        if ($result === false) {
            // Table doesn't exist, try to create it
            createEmailConfigTable($conn);
            $result = $conn->query("SELECT * FROM email_config WHERE id = 1 LIMIT 1");
        }
        
        if ($result && $result->num_rows > 0) {
            $config = $result->fetch_assoc();
            
            echo json_encode([
                'success' => true,
                'data' => $config
            ]);
        } else {
            // Return default configuration if id=1 doesn't exist
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => null,
                    'mailer_type' => 'gmail',
                    'smtp_host' => 'smtp.gmail.com',
                    'smtp_port' => 587,
                    'smtp_username' => '',
                    'smtp_password' => '',
                    'from_email' => 'noreply@smartevents.com',
                    'encryption' => 'tls',
                    'from_name' => 'Smart Events Team',
                    'reply_to_email' => '',
                    'is_active' => 0,
                    'created_at' => null,
                    'updated_at' => null
                ]
            ]);
        }
        exit;
    }

    // POST: Save email configuration
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $input = $_POST;
        }
        
        // Validate required fields
        $mailerType = trim($input['mailer_type'] ?? '');
        $smtpHost = trim($input['smtp_host'] ?? '');
        $smtpPort = (int)($input['smtp_port'] ?? 587);
        $smtpUsername = trim($input['smtp_username'] ?? '');
        $smtpPassword = trim($input['smtp_password'] ?? '');
        $fromEmail = trim($input['from_email'] ?? '');
        $fromName = trim($input['from_name'] ?? '');
        $encryption = trim($input['encryption'] ?? 'tls');
        $replyToEmail = trim($input['reply_to_email'] ?? '');
        $isActive = (int)($input['is_active'] ?? 1);
        
        // Validation
        $errors = [];
        
        if (empty($mailerType)) {
            $errors[] = 'Mailer type is required';
        }
        
        if (empty($smtpHost)) {
            $errors[] = 'SMTP Host is required';
        }
        
        if ($smtpPort < 1 || $smtpPort > 65535) {
            $errors[] = 'SMTP Port must be between 1 and 65535';
        }
        
        if (empty($smtpUsername)) {
            $errors[] = 'SMTP Username is required';
        }
        
        if (empty($smtpPassword)) {
            $errors[] = 'SMTP Password is required';
        }
        
        if (empty($fromEmail) || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Valid From Email is required';
        }
        
        if (empty($fromName)) {
            $errors[] = 'From Name is required';
        }
        
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $errors
            ]);
            exit;
        }
        
        // Always use id=1 for the single email configuration
        // Check if configuration with id=1 exists
        $checkResult = $conn->query("SELECT id FROM email_config WHERE id = 1 LIMIT 1");
        
        if ($checkResult === false) {
            // Table doesn't exist, create it
            createEmailConfigTable($conn);
            $checkResult = $conn->query("SELECT id FROM email_config WHERE id = 1 LIMIT 1");
        }
        
        if ($checkResult && $checkResult->num_rows > 0) {
            // Update existing configuration with id=1
            $stmt = $conn->prepare("
                UPDATE email_config SET
                    mailer_type = ?,
                    smtp_host = ?,
                    smtp_port = ?,
                    smtp_username = ?,
                    smtp_password = ?,
                    from_email = ?,
                    encryption = ?,
                    from_name = ?,
                    reply_to_email = ?,
                    is_active = ?,
                    updated_at = NOW()
                WHERE id = 1
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database error: ' . $conn->error
                ]);
                exit;
            }
            
            $stmt->bind_param(
                'ssisssssii',
                $mailerType,
                $smtpHost,
                $smtpPort,
                $smtpUsername,
                $smtpPassword,
                $fromEmail,
                $encryption,
                $fromName,
                $replyToEmail,
                $isActive
            );
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Email configuration updated successfully!',
                    'data' => [
                        'id' => 1,
                        'mailer_type' => $mailerType,
                        'smtp_host' => $smtpHost,
                        'smtp_port' => $smtpPort,
                        'smtp_username' => $smtpUsername,
                        'from_email' => $fromEmail,
                        'from_name' => $fromName,
                        'encryption' => $encryption,
                        'reply_to_email' => $replyToEmail,
                        'is_active' => $isActive
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating configuration: ' . $stmt->error
                ]);
            }
        } else {
            // Insert new configuration with id=1
            $stmt = $conn->prepare("
                INSERT INTO email_config (
                    id,
                    mailer_type,
                    smtp_host,
                    smtp_port,
                    smtp_username,
                    smtp_password,
                    from_email,
                    encryption,
                    from_name,
                    reply_to_email,
                    is_active,
                    created_at,
                    updated_at
                ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            if (!$stmt) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database error: ' . $conn->error
                ]);
                exit;
            }
            
            $stmt->bind_param(
                'ssisssssii',
                $mailerType,
                $smtpHost,
                $smtpPort,
                $smtpUsername,
                $smtpPassword,
                $fromEmail,
                $encryption,
                $fromName,
                $replyToEmail,
                $isActive
            );
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Email configuration created successfully!',
                    'data' => [
                        'id' => 1,
                        'mailer_type' => $mailerType,
                        'smtp_host' => $smtpHost,
                        'smtp_port' => $smtpPort,
                        'smtp_username' => $smtpUsername,
                        'from_email' => $fromEmail,
                        'from_name' => $fromName,
                        'encryption' => $encryption,
                        'reply_to_email' => $replyToEmail,
                        'is_active' => $isActive
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error creating configuration: ' . $stmt->error
                ]);
            }
        }
        exit;
    }

} catch (Exception $e) {
    // Ensure JSON response even on error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}

// Close connection if it exists
if (isset($conn) && $conn) {
    $conn->close();
}

/**
 * Create email config table if it doesn't exist
 */
function createEmailConfigTable($conn) {
    $sql = "
        CREATE TABLE IF NOT EXISTS email_config (
            id INT PRIMARY KEY,
            mailer_type VARCHAR(50) NOT NULL DEFAULT 'gmail',
            smtp_host VARCHAR(255) NOT NULL,
            smtp_port INT NOT NULL DEFAULT 587,
            smtp_username VARCHAR(255) NOT NULL,
            smtp_password VARCHAR(500) NOT NULL,
            from_email VARCHAR(255) NOT NULL,
            encryption VARCHAR(20) NOT NULL DEFAULT 'tls',
            from_name VARCHAR(255) NOT NULL DEFAULT 'Smart Events Team',
            reply_to_email VARCHAR(255),
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_active (is_active),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    if (!$conn->query($sql)) {
        error_log('Failed to create email_config table: ' . $conn->error);
    }
}
