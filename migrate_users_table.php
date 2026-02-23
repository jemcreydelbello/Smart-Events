<?php
require_once 'db_config.php';

echo "<h2>Adding New Fields to Users Table</h2>";

// Check if columns already exist
$checkQuery = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'users' AND (COLUMN_NAME = 'company' OR COLUMN_NAME = 'job_title' OR COLUMN_NAME = 'phone')";
$result = $conn->query($checkQuery);
$existingColumns = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $existingColumns[] = $row['COLUMN_NAME'];
    }
}

echo "<p>Existing columns: " . implode(', ', $existingColumns) . "</p>";

// Add columns if they don't exist
$alterQueries = [
    'company' => "ALTER TABLE users ADD COLUMN company VARCHAR(150) NULL DEFAULT NULL",
    'job_title' => "ALTER TABLE users ADD COLUMN job_title VARCHAR(100) NULL DEFAULT NULL",
    'phone' => "ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL DEFAULT NULL"
];

foreach ($alterQueries as $colName => $query) {
    if (!in_array($colName, $existingColumns)) {
        if ($conn->query($query)) {
            echo "<p>✓ Added column: $colName</p>";
        } else {
            echo "<p>✗ Failed to add $colName: " . $conn->error . "</p>";
        }
    } else {
        echo "<p>- Column $colName already exists</p>";
    }
}

echo "<hr>";
echo "<p><strong>Next step:</strong> Update test data with company, job title, and phone information.</p>";
echo "<h3><a href='update_test_data.php'>Update Test Users with Data</a></h3>";
?>
