<?php
/**
 * Migration script to add attendee-related fields to users table
 * These fields are needed for the Attendees tab display
 */

require_once 'db_config.php';

echo "<h2>Adding Attendee Fields to Users Table</h2>";

$fields = [
    'company' => "ALTER TABLE users ADD COLUMN company VARCHAR(150) NULL DEFAULT NULL",
    'job_title' => "ALTER TABLE users ADD COLUMN job_title VARCHAR(100) NULL DEFAULT NULL",
    'phone' => "ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL DEFAULT NULL",
    'employee_code' => "ALTER TABLE users ADD COLUMN employee_code VARCHAR(50) NULL DEFAULT NULL"
];

foreach ($fields as $field_name => $alter_statement) {
    try {
        // Check if column already exists
        $check_query = "SHOW COLUMNS FROM users LIKE ?";
        $stmt = $conn->prepare($check_query);
        $stmt->bind_param('s', $field_name);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            // Column doesn't exist, add it
            if ($conn->query($alter_statement)) {
                echo "<p style='color: green;'>✓ Added column: <strong>$field_name</strong></p>";
            } else {
                echo "<p style='color: red;'>✗ Failed to add column <strong>$field_name</strong>: " . $conn->error . "</p>";
            }
        } else {
            echo "<p style='color: blue;'>ℹ Column <strong>$field_name</strong> already exists</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>Error checking/adding column: " . $e->getMessage() . "</p>";
    }
}

echo "<p style='margin-top: 20px;'><strong>Migration complete!</strong></p>";
?>
