<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/db.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get user headers for authentication
$userRole = $_SERVER['HTTP_X_USER_ROLE'] ?? null;
$userId = $_SERVER['HTTP_X_USER_ID'] ?? null;

// Debug logging
error_log('📧 Email Config API - User Role: ' . ($userRole ?? 'NONE'));
error_log('📧 Email Config API - User ID: ' . ($userId ?? 'NONE'));
error_log('📧 Email Config API - Headers: ' . json_encode(getallheaders() ?: []));

// Only admins can access email configuration
if (empty($userRole) || ($userRole !== 'admin' && $userRole !== 'ADMIN')) {
    error_log('❌ Access denied - Role: ' . ($userRole ?? 'empty'));
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Only admins can access email configuration',
        'debug' => [
            'user_role' => $userRole,
            'headers_received' => getallheaders() ?: []
        ]
    ]);
    exit;
}

$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

$conn->set_charset('utf8mb4');

// GET: Fetch email configuration
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if table exists, create if not
    $checkTable = $conn->query("
        SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
        AND TABLE_NAME = 'email_configurations'
    ");
    
    if ($checkTable->num_rows === 0) {
        // Create table with default values
        createEmailConfigTable($conn);
    }
    
    $result = $conn->query("SELECT * FROM email_configurations LIMIT 1");
    
    if ($result && $result->num_rows > 0) {
        $config = $result->fetch_assoc();
        
        // Note: Return actual password so users can see what was saved
        // This is saved in database for form editing
        // Do NOT expose this via public API, only to logged-in admins
        
        echo json_encode([
            'success' => true,
            'data' => $config
        ]);
    } else {
        // Return default configuration
        echo json_encode([
            'success' => true,
            'data' => [
                'id' => null,
                'smtp_host' => 'smtp.gmail.com',
                'smtp_port' => 587,
                'smtp_user' => '',
                'smtp_password' => '',
                'from_name' => 'Smart Events Team',
                'from_email' => 'noreply@smartevents.com',
                'email_on_user_create' => 1,
                'email_on_event_create' => 1,
                'email_reminders' => 1
            ]
        ]);
    }
    exit;
}

// POST: Save email configuration
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    error_log('💾 Save request - Parsed input: ' . json_encode(array_keys($input ?? [])));
    
    // Validate required fields
    $smtpHost = trim($input['smtp_host'] ?? '');
    $smtpPort = (int)($input['smtp_port'] ?? 587);
    $smtpUser = trim($input['smtp_user'] ?? '');
    $smtpPassword = trim($input['smtp_password'] ?? '');
    $fromName = trim($input['from_name'] ?? '');
    $fromEmail = trim($input['from_email'] ?? '');
    $emailOnUserCreate = (int)($input['email_on_user_create'] ?? 0);
    $emailOnEventCreate = (int)($input['email_on_event_create'] ?? 0);
    $emailReminders = (int)($input['email_reminders'] ?? 0);
    
    error_log('💾 Validating fields:');
    error_log('  - Host: ' . ($smtpHost ? 'provided' : 'EMPTY'));
    error_log('  - Port: ' . $smtpPort);
    error_log('  - User: ' . ($smtpUser ? 'provided' : 'EMPTY'));
    error_log('  - Password: ' . ($smtpPassword ? 'provided' : 'EMPTY'));
    error_log('  - From Name: ' . ($fromName ? 'provided' : 'EMPTY'));
    error_log('  - From Email: ' . ($fromEmail ? 'provided' : 'EMPTY'));
    
    // Validation
    $errors = [];
    
    if (empty($smtpHost)) {
        $errors[] = 'SMTP Host is required';
    }
    
    if ($smtpPort < 1 || $smtpPort > 65535) {
        $errors[] = 'Port must be between 1 and 65535';
    }
    
    if (empty($smtpUser)) {
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
        error_log('💾 Validation failed: ' . json_encode($errors));
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors
        ]);
        exit;
    }
    
    // Check if table exists, create if not
    $checkTable = $conn->query("
        SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
        AND TABLE_NAME = 'email_configurations'
    ");
    
    if ($checkTable->num_rows === 0) {
        error_log('💾 Creating email_configurations table...');
        createEmailConfigTable($conn);
    }
    
    // Check if configuration already exists
    $checkResult = $conn->query("SELECT id FROM email_configurations LIMIT 1");
    
    if ($checkResult && $checkResult->num_rows > 0) {
        // Update existing configuration
        error_log('💾 Updating existing email configuration...');
        $stmt = $conn->prepare("
            UPDATE email_configurations SET
                smtp_host = ?,
                smtp_port = ?,
                smtp_user = ?,
                smtp_password = ?,
                from_name = ?,
                from_email = ?,
                email_on_user_create = ?,
                email_on_event_create = ?,
                email_reminders = ?,
                updated_by = ?,
                updated_at = NOW()
            WHERE id = (SELECT MIN(id) FROM email_configurations)
        ");
        
        $stmt->bind_param(
            'sissssiiii',
            $smtpHost,
            $smtpPort,
            $smtpUser,
            $smtpPassword,
            $fromName,
            $fromEmail,
            $emailOnUserCreate,
            $emailOnEventCreate,
            $emailReminders,
            $userId
        );
    } else {
        // Insert new configuration
        error_log('💾 Inserting new email configuration...');
        $stmt = $conn->prepare("
            INSERT INTO email_configurations (
                smtp_host,
                smtp_port,
                smtp_user,
                smtp_password,
                from_name,
                from_email,
                email_on_user_create,
                email_on_event_create,
                email_reminders,
                created_by,
                updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->bind_param(
            'sissssiiii',
            $smtpHost,
            $smtpPort,
            $smtpUser,
            $smtpPassword,
            $fromName,
            $fromEmail,
            $emailOnUserCreate,
            $emailOnEventCreate,
            $emailReminders,
            $userId,
            $userId
        );
    }
    
    if ($stmt->execute()) {
        error_log('💾 ✅ Configuration saved successfully');
        // Fetch and return updated configuration
        $result = $conn->query("SELECT * FROM email_configurations LIMIT 1");
        $config = $result->fetch_assoc();
        $config['smtp_password'] = '••••••••'; // Don't expose actual password
        
        echo json_encode([
            'success' => true,
            'message' => 'Email configuration saved successfully',
            'data' => $config
        ]);
    } else {
        error_log('💾 ❌ Failed to execute: ' . $stmt->error);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save configuration: ' . $stmt->error
        ]);
    }
    
    $stmt->close();
    exit;
}

// POST: Test SMTP connection
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'test') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    error_log('🧪 Test action - Raw input: ' . json_encode($input ?: []));
    
    $smtpHost = $input['smtp_host'] ?? '';
    $smtpPort = (int)($input['smtp_port'] ?? 587);
    $smtpUser = $input['smtp_user'] ?? '';
    $smtpPassword = $input['smtp_password'] ?? '';
    
    error_log('🧪 Test parsed values:');
    error_log('  - Host: ' . $smtpHost);
    error_log('  - Port: ' . $smtpPort . ' (type: ' . gettype($smtpPort) . ')');
    error_log('  - User: ' . $smtpUser);
    error_log('  - Password length: ' . strlen($smtpPassword));
    
    // Validate required fields
    $errors = [];
    if (empty($smtpHost)) {
        $errors[] = 'SMTP Host is required';
    }
    if (empty($smtpUser)) {
        $errors[] = 'SMTP Username is required';
    }
    if (empty($smtpPassword)) {
        $errors[] = 'SMTP Password is required';
    }
    if ($smtpPort < 1 || $smtpPort > 65535) {
        $errors[] = 'Port must be between 1 and 65535';
    }
    
    if (!empty($errors)) {
        error_log('🧪 Test validation failed: ' . json_encode($errors));
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'SMTP credentials are incomplete',
            'errors' => $errors,
            'received' => [
                'host' => $smtpHost,
                'port' => $smtpPort,
                'user' => $smtpUser,
                'password_length' => strlen($smtpPassword)
            ]
        ]);
        exit;
    }
    
    // Try to connect to SMTP server
    error_log('🧪 Attempting SMTP connection to ' . $smtpHost . ':' . $smtpPort);
    $connection = @fsockopen($smtpHost, $smtpPort, $errno, $errstr, 10);
    
    if ($connection) {
        fclose($connection);
        error_log('🧪 ✅ SMTP connection successful');
        echo json_encode([
            'success' => true,
            'message' => 'SMTP connection successful!',
            'host' => $smtpHost,
            'port' => $smtpPort
        ]);
    } else {
        error_log('🧪 ❌ SMTP connection failed: ' . $errstr . ' (errno: ' . $errno . ')');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => "SMTP connection failed: $errstr (Error code: $errno)",
            'provider_help' => getProviderHelp($smtpHost)
        ]);
    }
    exit;
}

// Helper function to create table if not exists
function createEmailConfigTable($conn) {
    $sql = "
        CREATE TABLE IF NOT EXISTS email_configurations (
            id INT PRIMARY KEY AUTO_INCREMENT,
            smtp_host VARCHAR(255) NOT NULL,
            smtp_port INT NOT NULL DEFAULT 587,
            smtp_user VARCHAR(255) NOT NULL,
            smtp_password VARCHAR(500) NOT NULL,
            from_name VARCHAR(255) NOT NULL,
            from_email VARCHAR(255) NOT NULL,
            email_on_user_create BOOLEAN DEFAULT 1,
            email_on_event_create BOOLEAN DEFAULT 1,
            email_reminders BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT,
            updated_by INT,
            FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
            FOREIGN KEY (updated_by) REFERENCES admins(admin_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $conn->query($sql);
    
    // Insert default configuration
    $conn->query("
        INSERT INTO email_configurations (
            smtp_host, 
            smtp_port, 
            smtp_user, 
            smtp_password, 
            from_name, 
            from_email, 
            email_on_user_create, 
            email_on_event_create, 
            email_reminders
        ) SELECT 
            'smtp.gmail.com',
            587,
            'your-email@gmail.com',
            'app-password-here',
            'Smart Events Team',
            'noreply@smartevents.com',
            1,
            1,
            1
        FROM DUAL
        WHERE NOT EXISTS (SELECT 1 FROM email_configurations LIMIT 1)
    ");
}

// Helper function to provide SMTP help based on provider
function getProviderHelp($host) {
    $providers = [
        'smtp.gmail.com' => [
            'port' => 587,
            'protocol' => 'TLS',
            'help' => 'For Gmail, use App Password if 2FA is enabled. Generate it from https://myaccount.google.com/apppasswords'
        ],
        'smtp-mail.outlook.com' => [
            'port' => 587,
            'protocol' => 'TLS',
            'help' => 'For Outlook, verify the email is valid and password is correct'
        ],
        'smtp.yahoo.com' => [
            'port' => 465,
            'protocol' => 'SSL',
            'help' => 'For Yahoo, use App Password. Generate at https://login.yahoo.com and click "Generate app password"'
        ]
    ];
    
    return $providers[$host] ?? null;
}

$conn->close();
?>
