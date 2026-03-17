<?php

include("../config/db.php");
include("../config/email_config.php");
include("../includes/SMTPMailer.php");

// Handle POST request for sending reset email
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate input
    if (!isset($_POST['email']) || empty($_POST['email'])) {
        http_response_code(400);
        die("Email is required");
    }

    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);

    // Verify email exists in coordinators table
    $stmt = $conn->prepare("SELECT coordinator_id FROM coordinators WHERE email=?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 0) {
        // Don't reveal if email exists or not (security best practice)
        die("If this email exists in our system, you will receive a reset link.");
    }

    // Generate reset token and expiration
    $token = bin2hex(random_bytes(16)); // 32 character token
    $expire = date("Y-m-d H:i:s", strtotime("+1 hour")); // 1 hour expiration

    error_log("=== COORDINATOR SEND RESET DEBUG ===");
    error_log("Generated token: " . $token);
    error_log("Token length: " . strlen($token));
    error_log("Token expiry: " . $expire);
    error_log("Email: " . $email);

    // Update coordinator with reset token
    $stmt = $conn->prepare("UPDATE coordinators SET reset_token=?, reset_expire=? WHERE email=?");
    $stmt->bind_param("sss", $token, $expire, $email);

    if (!$stmt->execute()) {
        error_log("ERROR: Failed to execute update: " . $stmt->error);
        http_response_code(500);
        die("Database error: Could not update reset token");
    }

    error_log("UPDATE successful. Affected rows: " . $stmt->affected_rows);

    // Prepare reset link
    $link = ORG_WEBSITE . "/admin/coordinator-reset-password.php?token=" . $token;

    $subject = EMAIL_SUBJECT_PREFIX . " Password Reset Request";
    $html_body = "<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
            background-color: #f3f4f6; 
            color: #374151;
        }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: white; }
        .header {
            background: linear-gradient(135deg, #1F4CC4 0%, #1538A0 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 500;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.7;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .message {
            font-size: 15px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .cta-container {
            text-align: center;
            margin: 35px 0;
        }
        .cta-button {
            background: linear-gradient(135deg, #1F4CC4 0%, #1538A0 100%) !important;
            color: #ffffff !important;
            padding: 16px 40px;
            text-decoration: none !important;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            display: inline-block !important;
            letter-spacing: 0.3px;
            box-shadow: 0 4px 15px rgba(31, 76, 196, 0.3);
        }
        .link-section {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border: 1px solid #e5e7eb;
        }
        .link-label {
            font-size: 13px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        .link-text {
            word-break: break-all;
            background: white;
            padding: 12px 14px;
            border-radius: 6px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            color: #1F4CC4;
            border: 1px solid #e5e7eb;
            line-height: 1.6;
        }
        .security-notice {
            background: #eff6ff;
            border-left: 4px solid #0284c7;
            padding: 15px;
            border-radius: 6px;
            margin: 25px 0;
            font-size: 13px;
            color: #0c4a6e;
            line-height: 1.6;
        }
        .security-notice strong {
            color: #0369a1;
        }
        .expiry-notice {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 13px;
            color: #7c2d12;
            font-weight: 500;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        .footer-text {
            font-size: 12px;
            color: #9ca3af;
            line-height: 1.6;
            margin-bottom: 12px;
        }
        .footer-divider {
            height: 1px;
            background: #e5e7eb;
            margin: 15px 0;
        }
        .ignore-text {
            font-size: 12px;
            color: #9ca3af;
            font-style: italic;
        }
        @media (max-width: 600px) {
            .content { padding: 25px 20px; }
            .header { padding: 30px 20px; }
            .footer { padding: 20px; }
            .cta-button { padding: 14px 32px; font-size: 15px; }
        }
    </style>
</head>
<body>
    <div class='email-wrapper'>
        <div class='header'>
            <h1>Password Reset Request</h1>
            <p>Secure your account</p>
        </div>
        
        <div class='content'>
            <div class='greeting'>Hello,</div>
            
            <div class='message'>
                We received a request to reset your password. If this was you, click the button below to set a new password. This link will expire in <strong>1 hour</strong> for security reasons.
            </div>
            
            <div class='cta-container'>
                <a href='" . htmlspecialchars($link) . "' class='cta-button'>Reset Password</a>
            </div>
            
            <div class='security-notice'>
                <strong>🔒 Security Tip:</strong> Never share your password reset link with anyone. Smart Events staff will never ask for your password or this link.
            </div>
            
            <div class='link-section'>
                <div class='link-label'>Or copy this link:</div>
                <div class='link-text'>" . htmlspecialchars($link) . "</div>
            </div>
            
            <div class='expiry-notice'>
                ⏱️ This link expires in 1 hour for your security.
            </div>
            
            <div style='color: #6b7280; font-size: 14px; margin-top: 20px;'>
                <p>If you didn't request a password reset, please ignore this email. Your account is safe, and no changes have been made.</p>
            </div>
        </div>
        
        <div class='footer'>
            <div class='footer-text'>&copy; " . date('Y') . " Smart Events. All rights reserved.</div>
            <div class='footer-divider'></div>
            <div class='footer-text'>This is an automated security email. Please do not reply or share sensitive information via email.</div>
            <div class='footer-text ignore-text'>If you have questions, please contact our support team.</div>
        </div>
    </div>
</body>
</html>";

    // Send email using SMTPMailer
    $mailer = new SMTPMailer(SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM, EMAIL_FROM_NAME);

    if ($mailer->sendGenericEmail($email, $subject, $html_body)) {
        echo "Reset link sent successfully. Please check your email.";
    } else {
        http_response_code(500);
        die("Email could not be sent. Please try again later.");
    }

    $stmt->close();
    $conn->close();
}
else {
    http_response_code(405);
    die("Method not allowed");
}
?>
