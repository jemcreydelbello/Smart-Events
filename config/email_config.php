<?php
/**
 * Email Configuration File
 * Configure your email settings here
 */

// ============ SENDER SETTINGS ============
define('EMAIL_FROM', 'we555tuna@gmail.com');  // Change this to your email
define('EMAIL_FROM_NAME', 'Event System');

// ============ SMTP SETTINGS ============
// Gmail: Use your Gmail email and an "App Password"
// (See: https://support.google.com/accounts/answer/185833)

define('SMTP_HOST', 'smtp.gmail.com');          // Gmail SMTP server
define('SMTP_PORT', 587);                        // Gmail TLS port
define('SMTP_USER', 'we555tuna@gmail.com');    // Your Gmail address (same as EMAIL_FROM)
define('SMTP_PASSWORD', 'ompy vdhm esps eset');   // Your Gmail App Password (NOT your regular password!)

// ============ ALTERNATIVE SMTP SERVERS ============
// Outlook/Office365:
// define('SMTP_HOST', 'smtp.office365.com');
// define('SMTP_PORT', 587);
// define('SMTP_USER', 'your-email@outlook.com');
// define('SMTP_PASSWORD', 'your-password');

// Mailtrap.io (testing):
// define('SMTP_HOST', 'smtp.mailtrap.io');
// define('SMTP_PORT', 2525);
// define('SMTP_USER', 'your-mailtrap-user');
// define('SMTP_PASSWORD', 'your-mailtrap-password');

// ============ LOCALHOST TESTING ============
// When using localhost, emails are sent via PHP's mail() function
// You can test with Mailhog or similar local SMTP server

// ============ EMAIL TEMPLATES ============
define('EMAIL_SUBJECT_PREFIX', '[Event System]');
define('ORG_NAME', 'Event Management System');
define('ORG_WEBSITE', 'http://localhost/EventSystem');

?>

