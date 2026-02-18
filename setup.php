<?php
/**
 * Database Setup Script
 * Run this script once to initialize the database with the provided schema
 */

$host = 'localhost';
$username = 'root';
$password = '';

// Create connection
$conn = new mysqli($host, $username, $password);

if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Database creation and setup SQL
$sql = "
-- Create Database
CREATE DATABASE IF NOT EXISTS eventsystem;
USE eventsystem;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert roles
INSERT IGNORE INTO roles (role_name) VALUES ('ADMIN'), ('PARTICIPANT');

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL
);

-- Insert departments
INSERT IGNORE INTO departments (department_name) VALUES ('IT'), ('HR'), ('Marketing'), ('Finance');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(200),
    is_private BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Create event access codes table
CREATE TABLE IF NOT EXISTS event_access_codes (
    code_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    access_code VARCHAR(50) UNIQUE NOT NULL,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_code VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('REGISTERED', 'ATTENDED', 'CANCELLED') DEFAULT 'REGISTERED',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- Create attendance logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    scanned_by INT NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(registration_id),
    FOREIGN KEY (scanned_by) REFERENCES users(user_id)
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    admin_id INT,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample admin user
INSERT IGNORE INTO users (full_name, email, password_hash, role_id, department_id)
VALUES ('Admin User', 'admin@eventsystem.local', SHA2('admin123', 256), 1, 1);

-- Insert sample events
INSERT IGNORE INTO events (event_name, description, event_date, start_time, end_time, location, created_by)
VALUES 
('Global Tech Summit 2026', 'Annual technology conference', '2026-03-15', '09:00:00', '17:00:00', 'San Francisco, CA', 1),
('Design Systems Workshop', 'UI/UX design principles workshop', '2026-04-10', '10:00:00', '16:00:00', 'New York, NY', 1);
";

// Execute the SQL
if ($conn->multi_query($sql) === TRUE) {
    echo "Database setup completed successfully!<br>";
    echo "✓ Database 'eventsystem' created<br>";
    echo "✓ All tables created<br>";
    echo "✓ Sample data inserted<br>";
    echo "<br><strong>Admin Credentials:</strong><br>";
    echo "Email: admin@eventsystem.local<br>";
    echo "Password: admin123<br>";
    echo "<br><a href='index.html'>Go to Dashboard</a>";
} else {
    echo "Error setting up database: " . $conn->error;
}

$conn->close();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Database Setup</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #C41E3A; }
        pre { background: #f0f0f0; padding: 15px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>EventSystem Database Setup</h1>
</body>
</html>
