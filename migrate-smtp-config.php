<?php
/**
 * Migrate existing SMTP configuration from email_config.php to database
 * This script reads the existing email configuration constants and saves them to the database
 */

require_once 'config/db.php';
require_once 'config/email_config.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

$conn->set_charset('utf8mb4');

// Check if table exists, create if not
$checkTable = $conn->query("
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
    AND TABLE_NAME = 'email_configurations'
");

if ($checkTable->num_rows === 0) {
    // Create table
    $sql = "
        CREATE TABLE IF NOT EXISTS email_configurations (
            id INT PRIMARY KEY AUTO_INCREMENT,
            smtp_host VARCHAR(255) NOT NULL,
            smtp_port INT NOT NULL DEFAULT 587,
            smtp_user VARCHAR(255) NOT NULL,
            smtp_password VARCHAR(500) NOT NULL,
            from_name VARCHAR(255) NOT NULL,
            from_email VARCHAR(255) NOT NULL,
            email_on_user_create BOOLEAN DEFAULT 1,
            email_on_event_create BOOLEAN DEFAULT 1,
            email_reminders BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT,
            updated_by INT,
            FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
            FOREIGN KEY (updated_by) REFERENCES admins(admin_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    $conn->query($sql);
    echo "✓ Created email_configurations table<br>";
}

// Get current configuration from email_config.php constants
$smtp_host = defined('SMTP_HOST') ? SMTP_HOST : 'smtp.gmail.com';
$smtp_port = defined('SMTP_PORT') ? SMTP_PORT : 587;
$smtp_user = defined('SMTP_USER') ? SMTP_USER : '';
$smtp_password = defined('SMTP_PASSWORD') ? SMTP_PASSWORD : '';
$from_email = defined('EMAIL_FROM') ? EMAIL_FROM : '';
$from_name = defined('EMAIL_FROM_NAME') ? EMAIL_FROM_NAME : 'Event System';

// Check if configuration already exists
$result = $conn->query("SELECT id FROM email_configurations LIMIT 1");

if ($result && $result->num_rows > 0) {
    // Update existing configuration
    $stmt = $conn->prepare("
        UPDATE email_configurations SET
            smtp_host = ?,
            smtp_port = ?,
            smtp_user = ?,
            smtp_password = ?,
            from_name = ?,
            from_email = ?,
            email_on_user_create = 1,
            email_on_event_create = 1,
            email_reminders = 1,
            updated_at = NOW()
        WHERE id = 1
    ");
    
    $stmt->bind_param(
        'sissss',
        $smtp_host,
        $smtp_port,
        $smtp_user,
        $smtp_password,
        $from_name,
        $from_email
    );
    
    if ($stmt->execute()) {
        echo "✓ Updated existing email configuration<br>";
    } else {
        echo "✗ Error updating: " . $stmt->error . "<br>";
    }
    $stmt->close();
} else {
    // Insert new configuration
    $stmt = $conn->prepare("
        INSERT INTO email_configurations (
            smtp_host,
            smtp_port,
            smtp_user,
            smtp_password,
            from_name,
            from_email,
            email_on_user_create,
            email_on_event_create,
            email_reminders
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1)
    ");
    
    $stmt->bind_param(
        'sissss',
        $smtp_host,
        $smtp_port,
        $smtp_user,
        $smtp_password,
        $from_name,
        $from_email
    );
    
    if ($stmt->execute()) {
        echo "✓ Inserted new email configuration<br>";
    } else {
        echo "✗ Error inserting: " . $stmt->error . "<br>";
    }
    $stmt->close();
}

// Display the configuration that was saved
echo "<br><strong>✅ Email Configuration Migrated Successfully!</strong><br><br>";
echo "<table style='border-collapse: collapse; width: 100%;'>";
echo "<tr style='border: 1px solid #ddd;'>";
echo "<td style='border: 1px solid #ddd; padding: 10px; font-weight: bold; background: #f0f0f0;'>Setting</td>";
echo "<td style='border: 1px solid #ddd; padding: 10px; background: #f0f0f0;'>Value</td>";
echo "</tr>";
echo "<tr style='border: 1px solid #ddd;'>";
echo "<td style='border: 1px solid #ddd; padding: 10px; font-weight: bold;'>SMTP Host</td>";
echo "<td style='border: 1px solid #ddd; padding: 10px;'>" . htmlspecialchars($smtp_host) . "</td>";
echo "</tr>";
echo "<tr style='border: 1px solid #ddd;'>";
echo "<td style='border: 1px solid #ddd; padding: 10px; font-weight: bold;'>SMTP Port</td>";
echo "<td style='border: 1px solid #ddd; padding: 10px;'>" . htmlspecialchars($smtp_port) . "</td>";
echo "</tr>";
echo "<tr style='border: 1px solid #ddd;'>";
echo "<td style='border: 1px solid #ddd; padding: 10px; font-weight: bold;'>SMTP User</td>";
echo "<td style='border: 1px solid #ddd; padding: 10px;'>" . htmlspecialchars($smtp_user) . "</td>";
echo "</tr>";
echo "<tr style='border: 1px solid #ddd;'>";
echo "<td style='border: 1px solid #ddd; padding: 10px; font-weight: bold;'>SMTP Password</td>";
echo "<td style='border: 1px solid #ddd; padding: 10px;'>••••••••</td>";
echo "</tr>";
echo "<tr style='border: 1px solid #ddd;'>";
echo "<td style='border: 1px solid #ddd; padding: 10px; font-weight: bold;'>From Name</td>";
echo "<td style='border: 1px solid #ddd; padding: 10px;'>" . htmlspecialchars($from_name) . "</td>";
echo "</tr>";
echo "<tr style='border: 1px solid #ddd;'>";
echo "<td style='border: 1px solid #ddd; padding: 10px; font-weight: bold;'>From Email</td>";
echo "<td style='border: 1px solid #ddd; padding: 10px;'>" . htmlspecialchars($from_email) . "</td>";
echo "</tr>";
echo "</table>";

echo "<br><p style='color: #059669; font-weight: bold;'>✅ Your SMTP configuration has been saved to the database!</p>";
echo "<p>You can now manage these settings from: <strong>Admin Dashboard → Settings → Email Configuration</strong></p>";
echo "<p><a href='admin/index.html' style='color: #3b82f6; text-decoration: none; font-weight: bold;'>Go to Admin Dashboard →</a></p>";

$conn->close();
?>
