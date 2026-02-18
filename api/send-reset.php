<?php

include("../config/db.php");
include("../config/email_config.php");
include("../includes/SMTPMailer.php");

// Validate input
if (!isset($_POST['email']) || empty($_POST['email'])) {
    http_response_code(400);
    die("Email is required");
}

$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);

// Verify email exists in database
$stmt = $conn->prepare("SELECT admin_id FROM admins WHERE email=?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows == 0) {
    // Don't reveal if email exists or not (security best practice)
    // But we can still send a generic message
    die("If this email exists in our system, you will receive a reset link.");
}

// Generate reset token and expiration - use shorter 32-char token to avoid URL truncation in email clients
$token = bin2hex(random_bytes(16)); // 32 characters instead of 64
$expire = date("Y-m-d H:i:s", strtotime("+1 hour")); // Extended to 1 hour for easier testing

error_log("=== SEND RESET DEBUG ===");
error_log("Generated token: " . $token);
error_log("Token length: " . strlen($token));
error_log("Token expiry: " . $expire);
error_log("Email: " . $email);

// Update admin with reset token
$stmt = $conn->prepare("UPDATE admins SET reset_token=?, reset_expire=? WHERE email=?");
$stmt->bind_param("sss", $token, $expire, $email);

if (!$stmt->execute()) {
    error_log("ERROR: Failed to execute update: " . $stmt->error);
    http_response_code(500);
    die("Database error: Could not update reset token");
}

error_log("UPDATE successful. Affected rows: " . $stmt->affected_rows);

// Prepare reset link
$link = ORG_WEBSITE . "/admin/reset-password.php?token=" . $token;

$subject = EMAIL_SUBJECT_PREFIX . " Password Reset Request";
$html_body = "
<html>
<head>
<meta charset='UTF-8'>
<style>
body { font-family: Arial, sans-serif; }
.container { max-width: 600px; margin: 20px auto; }
.header { background: #667eea; color: white; padding: 20px; text-align: center; }
.content { padding: 20px; }
.button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
.footer { color: #666; font-size: 12px; margin-top: 30px; }
</style>
</head>
<body>
<div class='container'>
<div class='header'><h2>Password Reset Request</h2></div>
<div class='content'>
<p>You requested to reset your password. Click the button below to proceed:</p>
<p><a href=\"" . $link . "\" class='button'>Reset Password</a></p>
<p>Or copy this link:</p>
<p style='word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;'>" . htmlspecialchars($link) . "</p>
<p><strong>This link will expire in 1 hour.</strong></p>
<p>If you didn't request this, please ignore this email.</p>
<div class='footer'>
<p>This is an automated email. Please do not reply with sensitive information.</p>
</div>
</div>
</div>
</body>
</html>
";

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
?>
