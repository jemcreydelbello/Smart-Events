<?php
/**
 * PHPMailer Alternative - SMTP Email Sender
 * Uses SMTP without requiring Composer
 * Supports Gmail and other SMTP servers
 */

class SMTPMailer {
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
     * Send email with SMTP
     */
    public function sendRegistrationConfirmation($to_email, $to_name, $event_name, $registration_code, $event_date = '', $event_location = '', $is_private = false) {
        // Validate email
        if (!filter_var($to_email, FILTER_VALIDATE_EMAIL)) {
            error_log('Invalid email address: ' . $to_email);
            return false;
        }
        
        // Always use SMTP if credentials are configured
        // Only fall back to mail() if SMTP isn't configured
        if (!empty($this->smtp_user) && !empty($this->smtp_password)) {
            error_log('✓ Using SMTP with configured credentials');
            return $this->sendViaSMTP($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
        }
        
        // Fallback to local mail() if SMTP not configured
        error_log('⚠ SMTP not configured, falling back to local mail()');
        return $this->sendViaLocalMail($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
    }

    /**
     * Send generic HTML email (for password reset, etc.)
     */
    public function sendGenericEmail($to_email, $subject, $html_body) {
        // Validate email
        if (!filter_var($to_email, FILTER_VALIDATE_EMAIL)) {
            error_log('Invalid email address: ' . $to_email);
            return false;
        }

        // Always use SMTP if credentials are configured
        if (!empty($this->smtp_user) && !empty($this->smtp_password)) {
            error_log('✓ Using SMTP for generic email to: ' . $to_email);
            return $this->sendGenericViaSMTP($to_email, $subject, $html_body);
        }

        // Fallback to local mail()
        error_log('⚠ SMTP not configured, falling back to local mail()');
        return $this->sendGenericViaLocalMail($to_email, $subject, $html_body);
    }

    
    private function sendGenericViaLocalMail($to_email, $subject, $html_body) {
        $headers = "From: " . $this->from_name . " <" . $this->from_email . ">\r\n";
        $headers .= "Reply-To: " . $this->from_email . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

        $result = mail($to_email, $subject, $html_body, $headers);

        if ($result) {
            error_log('Email sent via mail() to: ' . $to_email);
        } else {
            error_log('mail() failed for: ' . $to_email);
        }

        return $result;
    }

   
    private function sendGenericViaSMTP($to_email, $subject, $html_body) {
        try {
            // Create socket connection
            $socket = @fsockopen($this->smtp_host, $this->smtp_port, $errno, $errstr, 10);

            if (!$socket) {
                error_log('✗ SMTP Connection failed: ' . $errstr . ' (' . $errno . ')');
                return false;
            }

            // Read greeting
            $response = $this->readResponse($socket);
            if (strpos($response, '220') === false) {
                fclose($socket);
                error_log('✗ SMTP Server not responding properly');
                return false;
            }

            // Send EHLO
            $this->sendCommand($socket, 'EHLO localhost');
            $response = $this->readResponse($socket);

            // Start TLS
            $this->sendCommand($socket, 'STARTTLS');
            $response = $this->readResponse($socket);

            if (strpos($response, '220') === false) {
                error_log('✗ TLS negotiation failed');
                fclose($socket);
                return false;
            }

            // Enable crypto
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

            // Send EHLO again after TLS
            $this->sendCommand($socket, 'EHLO localhost');
            $response = $this->readResponse($socket);

            // AUTH LOGIN
            $this->sendCommand($socket, 'AUTH LOGIN');
            $this->readResponse($socket);

            $this->sendCommand($socket, base64_encode($this->smtp_user));
            $this->readResponse($socket);

            $this->sendCommand($socket, base64_encode($this->smtp_password));
            $response = $this->readResponse($socket);

            if (strpos($response, '235') === false) {
                error_log('✗ SMTP Authentication failed');
                fclose($socket);
                return false;
            }

            // Send email
            $this->sendCommand($socket, 'MAIL FROM: <' . $this->from_email . '>');
            $this->readResponse($socket);

            $this->sendCommand($socket, 'RCPT TO: <' . $to_email . '>');
            $this->readResponse($socket);

            $this->sendCommand($socket, 'DATA');
            $this->readResponse($socket);

            // Build email message
            $headers = "From: " . $this->from_name . " <" . $this->from_email . ">\r\n";
            $headers .= "To: " . $to_email . "\r\n";
            $headers .= "Subject: " . $subject . "\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "Content-Transfer-Encoding: 8bit\r\n";
            $headers .= "\r\n";

            $email_message = $headers . $html_body;

            $this->sendCommand($socket, $email_message);
            $this->sendCommand($socket, '.');
            $response = $this->readResponse($socket);

            if (strpos($response, '250') === false) {
                error_log('✗ Email sending failed: ' . $response);
                fclose($socket);
                return false;
            }

            // Quit
            $this->sendCommand($socket, 'QUIT');
            fclose($socket);

            error_log('✓ Email sent via SMTP to: ' . $to_email);
            return true;

        } catch (Exception $e) {
            error_log('✗ SMTP Error: ' . $e->getMessage());
            return false;
        }
    }
    
    
    private function isLocalhost() {
        $localhost_ips = ['127.0.0.1', '::1', 'localhost'];
        return in_array($_SERVER['REMOTE_ADDR'] ?? 'localhost', $localhost_ips) || 
               in_array($_SERVER['SERVER_NAME'] ?? 'localhost', $localhost_ips);
    }
 
    private function sendViaLocalMail($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private) {
        $subject = 'Event Registration Confirmation - ' . htmlspecialchars($event_name);
        
        $html_body = $this->getEmailTemplate($to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
        
        $boundary = uniqid();
        $headers = "From: " . $this->from_name . " <" . $this->from_email . ">\r\n";
        $headers .= "Reply-To: " . $this->from_email . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        
        $result = mail($to_email, $subject, $html_body, $headers);
        
        if ($result) {
            error_log('✓ Email sent via mail() to: ' . $to_email);
        } else {
            error_log('✗ mail() failed for: ' . $to_email);
        }
        
        return $result;
    }
    
    
    private function sendViaSMTP($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private) {
        try {
            // Create socket connection
            $socket = @fsockopen($this->smtp_host, $this->smtp_port, $errno, $errstr, 10);
            
            if (!$socket) {
                error_log('✗ SMTP Connection failed: ' . $errstr . ' (' . $errno . ')');
                // Fallback to local mail
                return $this->sendViaLocalMail($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
            }
            
            // Read greeting
            $response = $this->readResponse($socket);
            if (strpos($response, '220') === false) {
                fclose($socket);
                error_log('✗ SMTP Server not responding properly');
                return false;
            }
            
            // Send EHLO
            $this->sendCommand($socket, 'EHLO localhost');
            $response = $this->readResponse($socket);
            
            // Start TLS
            $this->sendCommand($socket, 'STARTTLS');
            $response = $this->readResponse($socket);
            
            if (strpos($response, '220') === false) {
                error_log('✗ TLS negotiation failed');
                fclose($socket);
                return false;
            }
            
            // Enable crypto
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            
            // Send EHLO again after TLS
            $this->sendCommand($socket, 'EHLO localhost');
            $response = $this->readResponse($socket);
            
            // AUTH LOGIN
            $this->sendCommand($socket, 'AUTH LOGIN');
            $this->readResponse($socket);
            
            $this->sendCommand($socket, base64_encode($this->smtp_user));
            $this->readResponse($socket);
            
            $this->sendCommand($socket, base64_encode($this->smtp_password));
            $response = $this->readResponse($socket);
            
            if (strpos($response, '235') === false) {
                error_log('✗ SMTP Authentication failed');
                fclose($socket);
                return false;
            }
            
            // Send email
            $this->sendCommand($socket, 'MAIL FROM: <' . $this->from_email . '>');
            $this->readResponse($socket);
            
            $this->sendCommand($socket, 'RCPT TO: <' . $to_email . '>');
            $this->readResponse($socket);
            
            $this->sendCommand($socket, 'DATA');
            $this->readResponse($socket);
            
            // Build email
            $email = $this->buildEmailMessage($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
            
            $this->sendCommand($socket, $email);
            $this->sendCommand($socket, '.');
            $response = $this->readResponse($socket);
            
            if (strpos($response, '250') === false) {
                error_log('✗ Email sending failed: ' . $response);
                fclose($socket);
                return false;
            }
            
            // Quit
            $this->sendCommand($socket, 'QUIT');
            fclose($socket);
            
            error_log('✓ Email sent via SMTP to: ' . $to_email);
            return true;
            
        } catch (Exception $e) {
            error_log('✗ SMTP Error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send SMTP command
     */
    private function sendCommand(&$socket, $command) {
        fwrite($socket, $command . "\r\n");
    }
    
    /**
     * Read SMTP response
     */
    private function readResponse(&$socket) {
        $response = '';
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ') break;
        }
        return $response;
    }
    
    /**
     * Build complete email message
     */
    private function buildEmailMessage($to_email, $to_name, $event_name, $registration_code, $event_date, $event_location, $is_private) {
        $subject = 'Event Registration Confirmation - ' . htmlspecialchars($event_name);
        $html = $this->getEmailTemplate($to_name, $event_name, $registration_code, $event_date, $event_location, $is_private);
        
        $headers = "From: " . $this->from_name . " <" . $this->from_email . ">\r\n";
        $headers .= "To: " . $to_name . " <" . $to_email . ">\r\n";
        $headers .= "Subject: " . $subject . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "Content-Transfer-Encoding: 8bit\r\n";
        $headers .= "\r\n";
        
        return $headers . $html;
    }
    
    /**
     * Get HTML email template with QR code
     */
    private function getEmailTemplate($to_name, $event_name, $registration_code, $event_date, $event_location, $is_private) {
        $event_type = $is_private ? 'Private' : 'Public';
        $qr_data = 'Registration Code: ' . $registration_code;
        $qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($qr_data);
        
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
            background: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: #559CDA;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin: 20px 0;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #559CDA;
            margin-bottom: 10px;
        }
        .qr-code-container {
            text-align: center;
            margin: 30px 0;
        }
        .qr-code-container img {
            max-width: 250px;
            border: 2px solid #ddd;
            padding: 10px;
            border-radius: 4px;
        }
        .code-box {
            background: #f0f0f0;
            padding: 15px;
            border-left: 4px solid #ED8028;
            font-family: monospace;
            font-size: 18px;
            margin: 10px 0;
            border-radius: 4px;
            text-align: center;
            letter-spacing: 2px;
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
        .badge {
            display: inline-block;
            background: #7BADFF;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 8px;
        }
        .footer {
            background: #f9f9f9;
            text-align: center;
            color: #999;
            font-size: 12px;
            padding: 20px;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Registration Confirmed!</h1>
        </div>
        
        <div class="content">
            <p>Hello <strong>{$to_name}</strong>,</p>
            
            <p>Thank you for registering! Your registration has been confirmed. Your unique registration code and QR code are below.</p>
            
            <div class="section">
                <div class="section-title">Event Details</div>
                <div class="event-details">
                    <p>
                        <span class="detail-label">Event:</span> {$event_name}
                    </p>
EOT;
        
        if (!empty($event_date)) {
            $html .= "                    <p><span class=\"detail-label\">Date & Time:</span> {$event_date}</p>\n";
        }
        
        if (!empty($event_location)) {
            $html .= "                    <p><span class=\"detail-label\">Location:</span> {$event_location}</p>\n";
        }
        
        $html .= <<<EOT
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Your Registration Code</div>
                <div class="code-box">{$registration_code}</div>
                <p style="font-size: 12px; color: #666; text-align: center;">Keep this code safe. You'll need it at check-in.</p>
            </div>
            
            <div class="qr-code-container">
                <div class="section-title">Scan at Check-in</div>
                <img src="{$qr_url}" alt="QR Code">
                <p style="font-size: 12px; color: #666;">Screenshot this QR code for quick check-in</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #666; font-size: 13px;">If you have questions, please contact the event organizer.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated email. Please do not reply with sensitive information.</p>
            <p>&copy; Intellismart Technology Inc. Event System</p>
        </div>
    </div>
</body>
</html>
EOT;
        
        return $html;
    }
}
?>
