<?php
/**
 * Email Configuration File
 * Fetches SMTP settings from database email_config table
 * Falls back to defaults if no configuration exists
 */

// Suppress all output from this file
if (!defined('SUPPRESS_EMAIL_CONFIG_OUTPUT')) {
    define('SUPPRESS_EMAIL_CONFIG_OUTPUT', true);
}

// Database configuration
if (file_exists('db.php')) {
    require_once 'db.php';
}

// Initialize variables with defaults
$EMAIL_FROM = 'noreply@smartevents.com';
$EMAIL_FROM_NAME = 'Smart Events Team';
$SMTP_HOST = 'smtp.gmail.com';
$SMTP_PORT = 587;
$SMTP_USER = '';
$SMTP_PASSWORD = '';
$SMTP_ENCRYPTION = 'tls';

// Try to load from database - use global $conn if available
if (defined('DB_HOST') && defined('DB_USER') && defined('DB_PASSWORD') && defined('DB_NAME')) {
    try {
        $email_conn = null;
        
        // Use global $conn if it exists, otherwise create a temporary connection
        if (isset($GLOBALS['conn']) && $GLOBALS['conn'] instanceof mysqli && !$GLOBALS['conn']->connect_error) {
            $email_conn = $GLOBALS['conn'];
        } else {
            // Only create a connection if global is not available
            $email_conn = @new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
            if ($email_conn && !$email_conn->connect_error) {
                $email_conn->set_charset('utf8mb4');
            }
        }
        
        // Query for email config
        if ($email_conn && !$email_conn->connect_error) {
            $result = @$email_conn->query("SELECT * FROM email_config WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1");
            
            if ($result && $result->num_rows > 0) {
                $config = $result->fetch_assoc();
                
                // Use database values
                $EMAIL_FROM = !empty($config['from_email']) ? $config['from_email'] : $EMAIL_FROM;
                $EMAIL_FROM_NAME = !empty($config['from_name']) ? $config['from_name'] : $EMAIL_FROM_NAME;
                $SMTP_HOST = !empty($config['smtp_host']) ? $config['smtp_host'] : $SMTP_HOST;
                $SMTP_PORT = !empty($config['smtp_port']) ? $config['smtp_port'] : $SMTP_PORT;
                $SMTP_USER = !empty($config['smtp_username']) ? $config['smtp_username'] : $SMTP_USER;
                $SMTP_PASSWORD = !empty($config['smtp_password']) ? $config['smtp_password'] : $SMTP_PASSWORD;
                $SMTP_ENCRYPTION = !empty($config['encryption']) ? $config['encryption'] : $SMTP_ENCRYPTION;
                
                error_log('✅ Email Config loaded from database: ' . $EMAIL_FROM);
            }
            
            // Only close connection if we created it (not the global one)
            if (!isset($GLOBALS['conn']) || $email_conn !== $GLOBALS['conn']) {
                if ($email_conn) {
                    $email_conn->close();
                }
            }
        } else {
            error_log('Email Config: Database connection failed, using defaults');
        }
    } catch (Exception $e) {
        error_log('Email Config Error: ' . $e->getMessage() . ', using defaults');
    }
}

// Define constants for use throughout application
define('EMAIL_FROM', $EMAIL_FROM);
define('EMAIL_FROM_NAME', $EMAIL_FROM_NAME);
define('SMTP_HOST', $SMTP_HOST);
define('SMTP_PORT', $SMTP_PORT);
define('SMTP_USER', $SMTP_USER);
define('SMTP_PASSWORD', $SMTP_PASSWORD);
define('SMTP_ENCRYPTION', $SMTP_ENCRYPTION);

// ============ EMAIL TEMPLATES & METADATA ============
define('EMAIL_SUBJECT_PREFIX', '[Smart Events]');
define('ORG_NAME', 'Smart Events');
define('ORG_WEBSITE', 'http://localhost/Smart-Events');

// ============ NOTES ============
// EMAIL SETTINGS: These are now loaded from the email_config database table
// To change email settings, use the admin panel: /admin/email-configuration.php
// The email_config table columns are:
//   - id, mailer_type, smtp_host, smtp_port, smtp_username, smtp_password
//   - from_email, encryption, from_name, reply_to_email, is_active
//   - created_at, updated_at
?>
