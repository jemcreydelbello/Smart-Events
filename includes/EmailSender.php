<?php
/**
 * Email Sender Utility Class
 * Handles sending emails with QR codes and event registration details
 */

// Load email configuration
if (file_exists(dirname(__DIR__) . '/config/email_config.php')) {
    require_once dirname(__DIR__) . '/config/email_config.php';
} else {
    // Default configuration if config file doesn't exist
    define('EMAIL_FROM', 'noreply@eventssystem.com');
    define('EMAIL_FROM_NAME', 'Event System');
    define('EMAIL_REPLY_TO', 'noreply@eventssystem.com');
}

class EmailSender {
    private $from_email;
    private $from_name;
    
    public function __construct($from_email = null, $from_name = null) {
        $this->from_email = $from_email ?? EMAIL_FROM ?? 'noreply@eventssystem.com';
        $this->from_name = $from_name ?? EMAIL_FROM_NAME ?? 'Event System';
    }
    
    /**
     * Send registration confirmation email with QR code
     * 
     * @param string $recipient_email - Recipient email address
     * @param string $recipient_name - Recipient full name
     * @param string $event_name - Event name
     * @param string $registration_code - Registration code
     * @param string $event_date - Event date
     * @param string $event_location - Event location
     * @param bool $is_private - Whether event is private
     * 
     * @return bool - True if email sent successfully
     */
    public function sendRegistrationConfirmation($recipient_email, $recipient_name, $event_name, $registration_code, $event_date = '', $event_location = '', $is_private = false) {
        // Validate email
        if (!filter_var($recipient_email, FILTER_VALIDATE_EMAIL)) {
            error_log('Invalid email address: ' . $recipient_email);
            return false;
        }
        
        // Generate QR code URL
        $qr_data = 'Registration Code: ' . $registration_code;
        $qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($qr_data);
        
        // Create email subject
        $subject = 'Event Registration Confirmation - ' . htmlspecialchars($event_name);
        
        // Create HTML email body
        $html_body = $this->getEmailTemplate($recipient_name, $event_name, $registration_code, $event_date, $event_location, $qr_url, $is_private);
        
        // Create plain text version
        $text_body = $this->getPlainTextTemplate($recipient_name, $event_name, $registration_code, $event_date, $event_location);
        
        // Prepare headers for both HTML and plain text (multipart)
        $boundary = uniqid();
        $headers = $this->getEmailHeaders($boundary);
        
        // Create body with both HTML and plain text
        $body = $this->createMultipartBody($text_body, $html_body, $boundary);
        
        // Send email
        $result = mail(
            $recipient_email,
            $subject,
            $body,
            $headers
        );
        
        if ($result) {
            error_log('✓ Email sent successfully to: ' . $recipient_email);
        } else {
            error_log('✗ Failed to send email to: ' . $recipient_email);
        }
        
        return $result;
    }
    
    /**
     * Get email headers
     */
    private function getEmailHeaders($boundary) {
        $headers = "From: " . $this->from_name . " <" . $this->from_email . ">\r\n";
        $headers .= "Reply-To: " . $this->from_email . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"" . $boundary . "\"\r\n";
        return $headers;
    }
    
    /**
     * Create multipart body with both plain text and HTML
     */
    private function createMultipartBody($text_body, $html_body, $boundary) {
        $body = "--" . $boundary . "\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $text_body . "\r\n";
        $body .= "\r\n--" . $boundary . "\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $html_body . "\r\n";
        $body .= "\r\n--" . $boundary . "--\r\n";
        return $body;
    }
    
    /**
     * Get HTML email template with QR code
     */
    private function getEmailTemplate($recipient_name, $event_name, $registration_code, $event_date, $event_location, $qr_url, $is_private) {
        $event_type = $is_private ? 'Private' : 'Public';
        
        $html = <<<EOT
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .section {
            margin: 20px 0;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .qr-code-container {
            text-align: center;
            margin: 30px 0;
        }
        .qr-code-container img {
            max-width: 300px;
            border: 2px solid #ddd;
            padding: 10px;
            border-radius: 4px;
        }
        .code-box {
            background: #f0f0f0;
            padding: 15px;
            border-left: 4px solid #667eea;
            font-family: monospace;
            font-size: 16px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .event-details {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .event-details p {
            margin: 8px 0;
        }
        .detail-label {
            font-weight: bold;
            color: #333;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
        }
        .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        .badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Event Registration Confirmed</h1>
        </div>
        
        <div class="content">
            <p>Hello <strong>{$recipient_name}</strong>,</p>
            
            <p>Thank you for registering! Your registration for the event has been confirmed. Please save your registration code and QR code for check-in.</p>
            
            <div class="section">
                <div class="section-title">Event Details</div>
                <div class="event-details">
                    <p>
                        <span class="detail-label">Event Name:</span><br>
                        {$event_name}
                        <span class="badge">{$event_type}</span>
                    </p>
EOT;

        if (!empty($event_date)) {
            $html .= "                    <p><span class=\"detail-label\">Date:</span><br>{$event_date}</p>\n";
        }
        
        if (!empty($event_location)) {
            $html .= "                    <p><span class=\"detail-label\">Location:</span><br>{$event_location}</p>\n";
        }
        
        $html .= <<<EOT
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Your Registration Code</div>
                <div class="code-box">{$registration_code}</div>
                <p style="font-size: 12px; color: #999;">Please keep this code safe. You'll need it for event check-in.</p>
            </div>
            
            <div class="qr-code-container">
                <div class="section-title">QR Code for Check-in</div>
                <img src="{$qr_url}" alt="Registration QR Code">
                <p style="font-size: 12px; color: #999;">Screenshot this QR code for quick check-in</p>
            </div>
            
            <div class="section">
                <p style="font-size: 14px;">If you have any questions, please contact the event organizer or reply to this email.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated email. Please do not reply with sensitive information.</p>
                <p>&copy; Event System. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
EOT;
        
        return $html;
    }
    
    /**
     * Get plain text email template
     */
    private function getPlainTextTemplate($recipient_name, $event_name, $registration_code, $event_date, $event_location) {
        $text = "EVENT REGISTRATION CONFIRMATION\n";
        $text .= "================================\n\n";
        $text .= "Hello {$recipient_name},\n\n";
        $text .= "Thank you for registering! Your registration for the event has been confirmed.\n\n";
        
        $text .= "EVENT DETAILS:\n";
        $text .= "-------------\n";
        $text .= "Event: {$event_name}\n";
        
        if (!empty($event_date)) {
            $text .= "Date: {$event_date}\n";
        }
        
        if (!empty($event_location)) {
            $text .= "Location: {$event_location}\n";
        }
        
        $text .= "\n";
        $text .= "YOUR REGISTRATION CODE:\n";
        $text .= "---------------------\n";
        $text .= "{$registration_code}\n\n";
        $text .= "Please keep this code safe. You'll need it for event check-in.\n\n";
        $text .= "A QR code has been generated and included in the HTML version of this email.\n\n";
        $text .= "If you have any questions, please contact the event organizer.\n\n";
        $text .= "Event System\n";
        
        return $text;
    }
}
?>
