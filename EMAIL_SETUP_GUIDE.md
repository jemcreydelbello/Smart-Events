# Email System Setup Guide

## Overview

The Event System now includes automated email notifications with QR codes that are sent to clients when they register for **Public** and **Private** events.

## Features

✅ **Automatic Email Confirmation** - Sent immediately after successful registration
✅ **QR Code Attachment** - Embedded in HTML email for easy check-in
✅ **Registration Code** - Included in plain text and displayed in email
✅ **Event Details** - Event name, date, time, and location included
✅ **Event Type Badge** - Shows if event is Public or Private
✅ **Responsive Design** - Works on desktop and mobile email clients

## Files Created

1. **`/includes/EmailSender.php`**
   - Main email sending class
   - Handles HTML and plain text email generation
   - Generates QR codes dynamically
   - Supports multipart MIME emails

2. **`/config/email_config.php`**
   - Email configuration settings
   - Customizable sender email and name
   - Future SMTP configuration support

3. **`/api/participants.php`** (Modified)
   - Integrated email sending into registration flow
   - Sends QR code confirmation after user registers

## Configuration

### Edit Email Settings

Open `/config/email_config.php` and update:

```php
// Your sender email address
define('EMAIL_FROM', 'noreply@eventssystem.com');

// Your sender name (appears in email "From:")
define('EMAIL_FROM_NAME', 'Event System');

// Reply-to email address
define('EMAIL_REPLY_TO', 'support@eventssystem.com');

// Organization name
define('ORG_NAME', 'Your Organization Name');
```

## How It Works

### Registration Flow

1. **User Registers** for an event (Public or Private)
2. **Registration Created** - System generates a unique registration code
3. **Email Sent** - Confirmation email with QR code sent to participant's email
4. **QR Code Generated** - Dynamic QR code created containing registration code
5. **Success Message** - User sees success notification and option to download QR

### Email Contents

The confirmation email includes:

- ✅ Personalized greeting with participant name
- ✅ Event name with Public/Private badge
- ✅ Event date and time (formatted nicely)
- ✅ Event location
- ✅ Unique registration code
- ✅ QR code image (300x300px)
- ✅ Instructions for check-in
- ✅ Contact information

### QR Code

The QR code encodes the registration code and can be scanned during event check-in:

```
www.qrserver.com generates: "Registration Code: REG-XXXXXXXXXXXXXXXX"
```

## Testing

### Local Testing with XAMPP

1. **Configure PHP Mail Function** (Windows)

   Edit `php.ini` in XAMPP:
   ```
   [mail function]
   SMTP = "localhost"
   smtp_port = 25
   sendmail_from = "noreply@localhost"
   ```

2. **Test Email Sending**

   Create a file `/api/test-email.php`:

   ```php
   <?php
   require_once '../includes/EmailSender.php';

   $mailer = new EmailSender();
   $result = $mailer->sendRegistrationConfirmation(
       'your-test-email@gmail.com',
       'Test User',
       'Test Event',
       'REG-TESTTESTTEST',
       'January 15, 2025 at 2:00 PM',
       'Conference Room A',
       false
   );

   if ($result) {
       echo "✓ Email sent successfully!";
   } else {
       echo "✗ Failed to send email";
   }
   ?>
   ```

   Access: `http://localhost/EventSystem/api/test-email.php`

3. **Check Event Registration**

   - Go to client portal
   - Register for a test event
   - Check your email (and spam folder)
   - Verify QR code displays correctly

## Gmail Setup (Recommended for Production)

To send emails through Gmail:

1. **Enable 2-Step Verification** on your Google Account
2. **Create App Password**:
   - Go to https://myaccount.google.com/security
   - Select "App passwords"
   - Choose "Mail" and "Windows Computer"
   - Copy the 16-character password

3. **Install PHPMailer** (Optional for advanced SMTP):
   ```bash
   composer require phpmailer/phpmailer
   ```

4. **Update Configuration**:
   ```php
   // In config/email_config.php
   define('SMTP_HOST', 'smtp.gmail.com');
   define('SMTP_PORT', 587);
   define('SMTP_USER', 'your-email@gmail.com');
   define('SMTP_PASSWORD', 'xxxx xxxx xxxx xxxx'); // App password
   define('SMTP_ENCRYPTION', 'tls');
   ```

## Troubleshooting

### Emails Not Sending

1. **Check Error Logs**
   - Look in `error_log` for EmailSender messages
   - Check PHP mail function logs

2. **Verify Configuration**
   ```php
   // Test in test-email.php
   ini_set('display_errors', 1);
   error_reporting(E_ALL);
   ```

3. **Check Email Address**
   - Ensure email is valid: `filter_var($email, FILTER_VALIDATE_EMAIL)`
   - Check for typos in registration form

4. **Check Spam Folder**
   - Emails may be filtered as spam
   - Ask recipients to whitelist sender email

### QR Code Not Displaying

1. QR codes are generated dynamically via `api.qrserver.com`
2. Ensure your server has internet connectivity
3. The QR code URL is: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...`

### Gmail Authentication Issues

1. Use **App Password** (not regular Gmail password)
2. Enable access for "Less secure apps" (if not using App Passwords)
3. Check Gmail security settings for blocked sign-in attempts

## Email Event Lifecycle

```
User Clicks Register
        ↓
Validates Form Input
        ↓
Sends to /api/participants.php
        ↓
Creates User (if new)
        ↓
Creates Registration Record
        ↓
Generates Registration Code
        ↓
Fetches Event Details
        ↓
Initializes EmailSender
        ↓
Generates QR Code URL
        ↓
Sends Multipart Email
        ├─ Plain Text Version
        └─ HTML Version (with QR)
        ↓
Returns Success Response
        ↓
Shows Confirmation Modal
        ↓
Participant Can Download QR
```

## Customizing Email Template

Edit `/includes/EmailSender.php`:

- **HTML Template**: `getEmailTemplate()` method (lines ~100-200)
- **Plain Text Template**: `getPlainTextTemplate()` method (lines ~220-240)
- **Colors**: Update gradient colors in CSS
- **Branding**: Add logo or custom header

## Advanced: PHPMailer Integration

To use PHPMailer for better SMTP support:

```php
<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host = SMTP_HOST;
$mail->SMTPAuth = true;
$mail->Username = SMTP_USER;
$mail->Password = SMTP_PASSWORD;
```

## Future Enhancements

- [ ] Schedule reminder emails before event
- [ ] Send thank you email after event attendance
- [ ] Export QR code as PDF
- [ ] Email template customization via admin panel
- [ ] SMS notifications (optional)
- [ ] Calendar invite (iCal format)

## Support

For issues or questions about the email system:

1. Check error logs: `/EventSystem/error_log`
2. Test file: `/EventSystem/api/test-email.php`
3. Verify configuration: `/EventSystem/config/email_config.php`
4. Review EmailSender class: `/EventSystem/includes/EmailSender.php`

---

**Last Updated:** February 11, 2026
**Version:** 1.0
