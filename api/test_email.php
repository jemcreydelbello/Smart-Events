<?php
/**
 * Email Configuration Test Script
 * Tests email sending without requiring a registration
 * 
 * Access this file at: http://localhost/EventSystem/api/test_email.php
 */

require_once '../config/email_config.php';
require_once '../includes/SimpleMailer.php';

// Check if this is a form submission
$test_email = $_POST['test_email'] ?? '';
$test_name = $_POST['test_name'] ?? 'Test User';
$test_event = $_POST['test_event'] ?? 'Sample Event';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Configuration Test</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        
        h1 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 24px;
        }
        
        .subtitle {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
        }
        
        .config-box {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 13px;
        }
        
        .config-item {
            margin: 8px 0;
            word-break: break-all;
        }
        
        .config-label {
            font-weight: bold;
            color: #333;
        }
        
        .config-value {
            color: #666;
            margin-left: 10px;
        }
        
        .password-masked {
            color: #999;
        }
        
        .form-group {
            margin: 15px 0;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        
        input[type="text"],
        input[type="email"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            font-family: Arial, sans-serif;
        }
        
        input[type="text"]:focus,
        input[type="email"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-test {
            background: #667eea;
            color: white;
        }
        
        .btn-test:hover {
            background: #5568d3;
        }
        
        .btn-back {
            background: #e0e0e0;
            color: #333;
        }
        
        .btn-back:hover {
            background: #d0d0d0;
        }
        
        .alert {
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
            border-left: 4px solid;
        }
        
        .alert-success {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        
        .alert-error {
            background: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
        }
        
        .alert-warning {
            background: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }
        
        .alert-info {
            background: #d1ecf1;
            border-color: #17a2b8;
            color: #0c5460;
        }
        
        .instructions {
            background: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            line-height: 1.6;
        }
        
        .instructions h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .instructions ol {
            margin-left: 20px;
        }
        
        .instructions li {
            margin: 8px 0;
        }
        
        .instructions code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 Email Configuration Test</h1>
        <p class="subtitle">Test your email settings before using the registration system</p>
        
        <?php
        // Display current configuration
        echo '<div class="config-box">';
        echo '<div class="config-item"><span class="config-label">SMTP Host:</span><span class="config-value">' . SMTP_HOST . '</span></div>';
        echo '<div class="config-item"><span class="config-label">SMTP Port:</span><span class="config-value">' . SMTP_PORT . '</span></div>';
        echo '<div class="config-item"><span class="config-label">From Email:</span><span class="config-value">' . EMAIL_FROM . '</span></div>';
        echo '<div class="config-item"><span class="config-label">From Name:</span><span class="config-value">' . EMAIL_FROM_NAME . '</span></div>';
        echo '<div class="config-item"><span class="config-label">SMTP User:</span><span class="config-value">' . SMTP_USER . '</span></div>';
        echo '<div class="config-item"><span class="config-label">SMTP Password:</span><span class="password-masked">••••••••••</span></div>';
        echo '</div>';
        
        // Check configuration validity
        $config_issues = [];
        
        if (SMTP_USER === 'your-email@gmail.com') {
            $config_issues[] = 'SMTP_USER not configured';
        }
        if (SMTP_PASSWORD === 'your-app-password') {
            $config_issues[] = 'SMTP_PASSWORD not configured';
        }
        if (EMAIL_FROM === 'your-email@gmail.com') {
            $config_issues[] = 'EMAIL_FROM not configured';
        }
        
        if (!empty($config_issues)) {
            echo '<div class="alert alert-warning">';
            echo '<strong>⚠ Configuration Required:</strong><br>';
            echo 'Before testing, update these settings in <code>/config/email_config.php</code>:<br><br>';
            foreach ($config_issues as $issue) {
                echo '• ' . htmlspecialchars($issue) . '<br>';
            }
            echo '</div>';
            
            echo '<div class="instructions">';
            echo '<h3>📋 Gmail Setup Instructions:</h3>';
            echo '<ol>';
            echo '<li>Go to <code>myaccount.google.com/apppasswords</code></li>';
            echo '<li>Select "Mail" and "Windows Computer"</li>';
            echo '<li>Copy the generated password</li>';
            echo '<li>Update <code>/config/email_config.php</code> with:<br>';
            echo '   <code>define(\'SMTP_USER\', \'your-email@gmail.com\');</code><br>';
            echo '   <code>define(\'SMTP_PASSWORD\', \'copied-app-password\');</code><br>';
            echo '   <code>define(\'EMAIL_FROM\', \'your-email@gmail.com\');</code>';
            echo '</li>';
            echo '<li>Refresh this page</li>';
            echo '</ol>';
            echo '</div>';
        } else {
            echo '<div class="alert alert-info">✓ Configuration looks good. Enter test email below.</div>';
        }
        
        // Handle test email submission
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($test_email)) {
            echo '<div style="margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 4px;">';
            echo '<h3 style="color: #667eea; margin-bottom: 15px;">Sending test email...</h3>';
            
            try {
                $mailer = new SimpleMailer(
                    SMTP_HOST,
                    SMTP_PORT,
                    SMTP_USER,
                    SMTP_PASSWORD,
                    EMAIL_FROM,
                    EMAIL_FROM_NAME
                );
                
                $result = $mailer->sendRegistrationConfirmation(
                    $test_email,
                    $test_name,
                    $test_event,
                    'TEST-' . strtoupper(bin2hex(random_bytes(3))),
                    'Test Date: ' . date('F j, Y'),
                    'Test Location',
                    false
                );
                
                if ($result) {
                    echo '<div class="alert alert-success">';
                    echo '<strong>✓ Email sent successfully!</strong><br>';
                    echo 'Test email was sent to: <strong>' . htmlspecialchars($test_email) . '</strong><br>';
                    echo 'Check your inbox (and spam folder) for the test email.';
                    echo '</div>';
                } else {
                    echo '<div class="alert alert-error">';
                    echo '<strong>✗ Email sending failed</strong><br>';
                    echo 'Please check:<br>';
                    echo '• Your email credentials are correct<br>';
                    echo '• If using Gmail, you\'ve generated an App Password<br>';
                    echo '• Your firewall allows SMTP connections<br>';
                    echo '• Check PHP error logs for more details';
                    echo '</div>';
                }
            } catch (Exception $e) {
                echo '<div class="alert alert-error">';
                echo '<strong>✗ Error:</strong> ' . htmlspecialchars($e->getMessage());
                echo '</div>';
            }
            
            echo '</div>';
        }
        
        if (empty($config_issues)) {
            ?>
            <form method="POST">
                <div class="form-group">
                    <label for="test_name">Your Name:</label>
                    <input type="text" id="test_name" name="test_name" value="<?php echo htmlspecialchars($test_name); ?>" placeholder="John Doe">
                </div>
                
                <div class="form-group">
                    <label for="test_email">Email Address (for test):</label>
                    <input type="email" id="test_email" name="test_email" value="<?php echo htmlspecialchars($test_email); ?>" placeholder="your-email@example.com" required>
                </div>
                
                <div class="form-group">
                    <label for="test_event">Event Name:</label>
                    <input type="text" id="test_event" name="test_event" value="<?php echo htmlspecialchars($test_event); ?>" placeholder="Sample Event">
                </div>
                
                <div class="button-group">
                    <button type="submit" class="btn-test">Send Test Email</button>
                    <button type="button" class="btn-back" onclick="window.location='../../';">Back to App</button>
                </div>
            </form>
            <?php
        } else {
            ?>
            <div class="button-group">
                <button type="button" class="btn-back" onclick="window.location='../../';">Back to App</button>
            </div>
            <?php
        }
        ?>
    </div>
</body>
</html>
