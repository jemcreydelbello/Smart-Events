<?php
/**
 * Database Setup Script - Creates email_configurations table
 * Run this once to initialize the email configuration storage
 */

require_once 'config/db.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

$conn->set_charset('utf8mb4');

// Create email_configurations table
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

if ($conn->query($sql) === TRUE) {
    echo "✓ email_configurations table created successfully<br>";
} else {
    echo "Error creating table: " . $conn->error . "<br>";
}

// Insert default configuration if empty
$checkResult = $conn->query("SELECT COUNT(*) as count FROM email_configurations");
$row = $checkResult->fetch_assoc();

if ($row['count'] == 0) {
    $insertSql = "
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
        ) VALUES (
            'smtp.gmail.com',
            587,
            'your-email@gmail.com',
            'app-password-here',
            'Smart Events Team',
            'noreply@smartevents.com',
            1,
            1,
            1
        )
    ";
    
    if ($conn->query($insertSql) === TRUE) {
        echo "✓ Default email configuration inserted<br>";
    } else {
        echo "Error inserting default config: " . $conn->error . "<br>";
    }
} else {
    echo "✓ Email configurations already exist<br>";
}

// Create index
$conn->query("CREATE INDEX IF NOT EXISTS idx_updated_at ON email_configurations(updated_at)");

$conn->close();
echo "<br><strong>✅ Email configuration database setup complete!</strong><br>";
echo "<a href='admin/index.html'>Return to admin dashboard</a>";
?>
