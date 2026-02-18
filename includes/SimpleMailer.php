<?php
/**
 * Simple SMTP Email Sender for Gmail
 * Simplified version that works reliably on Windows
 */

class SimpleMailer {
    private $smtp_host;
    private $smtp_port;
    private $smtp_user;
    private $smtp_password;
    private $from_email;
    private $from_name;
    
    public function __construct($smtp_host = 'smtp.gmail.com', $smtp_port = 587, $smtp_user = '', $smtp_password = '', $from_email = '', $from_name = 'Event System') {
        $this->smtp_host = $smtp_host;
        $this->smtp_port = $smtp_port;
        $this->smtp_user = $smtp_user;
        $this->smtp_password = $smtp_password;
        $this->from_email = $from_email ?: $smtp_user;
        $this->from_name = $from_name;
    }
    
    /**
     * Send registration confirmation email
     */
    public function sendRegistrationConfirmation($to_email, $to_name, $event_name, $registration_code, $event_date = '', $event_location = '', $is_private = false) {
        if (!filter_var($to_email, FILTER_VALIDATE_EMAIL)) {
            error_log('Invalid email address: ' . $to_email);
            return false;
        }
        
        // If SMTP not configured, use PHP mail()
        if (empty($this->smtp_user) || empty($this->smtp_password)) {
            return $this->sendViaMail($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
        }
        
        // Try SMTP first
        $result = $this->sendViaSMTP($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
        
        // If SMTP fails, try php mail() as fallback
        if (!$result) {
            error_log('⚠ SMTP failed, trying php mail() fallback...');
            return $this->sendViaMail($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
        }
        
        return $result;
    }
    
    /**
     * Send via PHP mail()
     */
    private function sendViaMail($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private) {
        $subject = 'Event Registration Confirmation - ' . htmlspecialchars($event_name);
        $html = $this->getEmailHTML($to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
        
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: " . $this->from_name . " <" . $this->from_email . ">\r\n";
        $headers .= "Reply-To: " . $this->from_email . "\r\n";
        
        error_log('Attempting to send via php mail() to: ' . $to_email);
        $result = @mail($to_email, $subject, $html, $headers);
        
        if ($result) {
            error_log('✓ Email sent via mail() to: ' . $to_email);
        } else {
            error_log('✗ mail() failed. Check SMTP settings in php.ini');
        }
        
        return $result;
    }
    
    /**
     * Send via SMTP
     */
    private function sendViaSMTP($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private) {
        try {
            error_log('Attempting SMTP connection to ' . $this->smtp_host . ':' . $this->smtp_port);
            
            // Open socket
            $socket = @fsockopen($this->smtp_host, $this->smtp_port, $errno, $errstr, 30);
            
            if (!$socket) {
                error_log('✗ SMTP Connection failed: ' . $errstr . ' (' . $errno . ')');
                return false;
            }
            
            error_log('✓ Socket opened successfully');
            
            // Read server greeting
            $response = fgets($socket, 512);
            error_log('Server greeting: ' . trim($response));
            
            if (strpos($response, '220') === false) {
                fclose($socket);
                error_log('✗ No 220 greeting from server');
                return false;
            }
            
            // Send EHLO
            fputs($socket, "EHLO localhost\r\n");
            $response = fgets($socket, 512);
            error_log('EHLO response: ' . trim($response));
            
            // Read rest of EHLO response
            while (substr($response, 3, 1) != ' ') {
                $response = fgets($socket, 512);
            }
            
            // Start TLS 
            fputs($socket, "STARTTLS\r\n");
            $response = fgets($socket, 512);
            error_log('STARTTLS response: ' . trim($response));
            
            if (strpos($response, '220') === false && strpos($response, '250') === false) {
                error_log('✗ STARTTLS not available');
                fclose($socket);
                return false;
            }
            
            // Enable encryption
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT)) {
                error_log('✗ Failed to enable TLS encryption');
                fclose($socket);
                return false;
            }
            
            error_log('✓ TLS encryption enabled');
            
            // Send EHLO again after TLS
            fputs($socket, "EHLO localhost\r\n");
            $response = fgets($socket, 512);
            while (substr($response, 3, 1) != ' ') {
                $response = fgets($socket, 512);
            }
            
            // Authenticate
            fputs($socket, "AUTH LOGIN\r\n");
            $response = fgets($socket, 512);
            error_log('AUTH LOGIN response: ' . trim($response));
            
            if (strpos($response, '334') === false) {
                error_log('✗ AUTH LOGIN not supported');
                fclose($socket);
                return false;
            }
            
            // Send username
            fputs($socket, base64_encode($this->smtp_user) . "\r\n");
            $response = fgets($socket, 512);
            error_log('Username sent, response: ' . substr(trim($response), 0, 10) . '...');
            
            // Send password
            fputs($socket, base64_encode($this->smtp_password) . "\r\n");
            $response = fgets($socket, 512);
            error_log('Password sent, response: ' . trim($response));
            
            if (strpos($response, '235') === false) {
                error_log('✗ Authentication failed');
                fclose($socket);
                return false;
            }
            
            error_log('✓ Authentication successful');
            
            // Send FROM
            fputs($socket, "MAIL FROM: <" . $this->from_email . ">\r\n");
            $response = fgets($socket, 512);
            error_log('MAIL FROM response: ' . trim($response));
            
            // Send TO
            fputs($socket, "RCPT TO: <" . $to_email . ">\r\n");
            $response = fgets($socket, 512);
            error_log('RCPT TO response: ' . trim($response));
            
            // Send DATA command
            fputs($socket, "DATA\r\n");
            $response = fgets($socket, 512);
            error_log('DATA response: ' . trim($response));
            
            // Build email
            $subject = 'Event Registration Confirmation - ' . htmlspecialchars($event_name);
            $html = $this->getEmailHTML($to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
            
            $email_body = "From: " . $this->from_name . " <" . $this->from_email . ">\r\n";
            $email_body .= "To: " . $to_name . " <" . $to_email . ">\r\n";
            $email_body .= "Subject: " . $subject . "\r\n";
            $email_body .= "MIME-Version: 1.0\r\n";
            $email_body .= "Content-Type: text/html; charset=UTF-8\r\n";
            $email_body .= "\r\n";
            $email_body .= $html;
            
            // Send body
            fputs($socket, $email_body . "\r\n.\r\n");
            $response = fgets($socket, 512);
            error_log('Email send response: ' . trim($response));
            
            if (strpos($response, '250') === false) {
                error_log('✗ Email not accepted by server');
                fclose($socket);
                return false;
            }
            
            // Send QUIT
            fputs($socket, "QUIT\r\n");
            fclose($socket);
            
            error_log('✓ Email sent successfully via SMTP');
            return true;
            
        } catch (Exception $e) {
            error_log('✗ SMTP Exception: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get email HTML content
     */
    private function getEmailHTML($to_name, $event_name, $registration_code, $event_date, $event_location, $is_private) {
        $event_type = $is_private ? 'Private' : 'Public';
        $qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode('Registration Code: ' . $registration_code);
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .section { margin: 20px 0; }
        .section-title { font-size: 16px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
        .event-details { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .event-details p { margin: 8px 0; }
        .code-box { background: #f0f0f0; padding: 15px; border-left: 4px solid #667eea; font-family: monospace; font-size: 18px; margin: 10px 0; border-radius: 4px; text-align: center; }
        .qr-code-container { text-align: center; margin: 30px 0; }
        .qr-code-container img { max-width: 250px; border: 2px solid #ddd; padding: 10px; border-radius: 4px; }
        .badge { display: inline-block; background: #667eea; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; margin-left: 8px; }
        .footer { background: #f9f9f9; text-align: center; color: #999; font-size: 12px; padding: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
        </div>
        
        <div class="content">
            <p>Hello <strong>$to_name</strong>,</p>
            <p>Thank you for registering! Your registration has been confirmed.</p>
            
            <div class="section">
                <div class="section-title">Event Details</div>
                <div class="event-details">
                    <p><strong>Event:</strong> $event_name <span class="badge">$event_type</span></p>
                    <p><strong>Date & Time:</strong> $event_date</p>
                    <p><strong>Location:</strong> $event_location</p>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Your Registration Code</div>
                <div class="code-box">$registration_code</div>
                <p style="font-size: 12px; color: #666; text-align: center;">Keep this code safe. You'll need it at check-in.</p>
            </div>
            
            <div class="qr-code-container">
                <div class="section-title">Scan at Check-in</div>
                <img src="$qr_url" alt="QR Code">
                <p style="font-size: 12px; color: #666;">Screenshot this QR code for quick check-in</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 13px;">If you have questions, please contact the event organizer.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated email. Please do not reply with sensitive information.</p>
            <p>&copy; Event Registration System</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
?>
