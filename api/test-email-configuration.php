<?php
error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = @json_decode($input, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

$smtp_host = trim($data['smtp_host'] ?? '');
$smtp_port = intval($data['smtp_port'] ?? 587);
$smtp_username = trim($data['smtp_username'] ?? '');
$smtp_password = trim($data['smtp_password'] ?? '');
$from_email = trim($data['from_email'] ?? '');
$from_name = trim($data['from_name'] ?? '');
$encryption = trim($data['encryption'] ?? 'tls');
$admin_name = trim($data['admin_name'] ?? 'System Administrator');

if (!$from_email || !$smtp_host || !$smtp_username || !$smtp_password) {
    echo json_encode(['success' => false, 'message' => 'Missing required SMTP configuration']);
    exit;
}

// Load the existing SMTPMailer class
$smtpMailerPath = dirname(__DIR__) . '/includes/SMTPMailer.php';
if (!file_exists($smtpMailerPath)) {
    echo json_encode(['success' => false, 'message' => 'SMTPMailer class not found']);
    exit;
}

require_once $smtpMailerPath;

try {
    // Create mailer instance with provided configuration
    $mailer = new SMTPMailer($smtp_host, $smtp_port, $smtp_username, $smtp_password, $from_email, $from_name);
    
    // Create test email body
    $subject = 'Smart Events - Email Configuration Test';
    $html_body = '<html><body style="font-family: Arial, sans-serif; line-height: 1.6;">'
        . '<h2 style="color: #16a34a; margin-top: 0;">Email Configuration Successful!</h2>'
        . '<p>Your email configuration for Smart Events has been successfully tested and verified.</p>'
        . '<p><strong>Configuration Changed By:</strong></p>'
        . '<p style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 12px 0;">' . htmlspecialchars($admin_name) . '</p>'
        . '<p><strong>Test Details:</strong></p>'
        . '<ul>'
        . '<li><strong>From:</strong> ' . htmlspecialchars($from_name) . ' &lt;' . htmlspecialchars($from_email) . '&gt;</li>'
        . '<li><strong>Tested at:</strong> ' . date('Y-m-d H:i:s') . '</li>'
        . '</ul>'
        . '<p>You can now use this configuration to send notifications from your Smart Events admin dashboard.</p>'
        . '</body></html>';
    
    // Send the test email
    if ($mailer->sendGenericEmail($from_email, $subject, $html_body)) {
        echo json_encode(['success' => true, 'message' => 'Test email sent successfully to ' . $from_email]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send test email. Check your SMTP credentials and connection.']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>



