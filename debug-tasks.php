<?php
// Debug script to check tasks table and test API

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db_config.php';

echo "<h2>Database Debug - Event Tasks</h2>";

// Check if table exists
$tables_result = $conn->query("SHOW TABLES LIKE 'event_tasks'");
if ($tables_result->num_rows > 0) {
    echo "<p style='color: green;'><strong>✓ event_tasks table EXISTS</strong></p>";
    
    // Show table structure
    echo "<h3>Table Structure:</h3>";
    $columns_result = $conn->query("DESCRIBE event_tasks");
    echo "<table border='1'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    while ($col = $columns_result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($col['Field']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Key']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Default'] ?? 'NULL') . "</td>";
        echo "<td>" . htmlspecialchars($col['Extra']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Check row count
    $count_result = $conn->query("SELECT COUNT(*) as cnt FROM event_tasks");
    $count = $count_result->fetch_assoc()['cnt'];
    echo "<p>Total tasks: <strong>" . $count . "</strong></p>";
    
} else {
    echo "<p style='color: red;'><strong>✗ event_tasks table DOES NOT EXIST</strong></p>";
    echo "<p>You need to run the migration SQL script first.</p>";
    echo "<p>Solution: Go to phpmyadmin and run <strong>MIGRATE_EVENT_TASKS.sql</strong></p>";
}

// Check events table
$events_result = $conn->query("SHOW TABLES LIKE 'events'");
if ($events_result->num_rows > 0) {
    echo "<p style='color: green;'><strong>✓ events table EXISTS - Good!</strong></p>";
} else {
    echo "<p style='color: red;'><strong>✗ events table missing</strong></p>";
}

// Test INSERT with sample data
echo "<h3>Testing INSERT (with event_id=3):</h3>";
if ($tables_result->num_rows > 0) {
    $test_insert = $conn->prepare("INSERT INTO event_tasks (event_id, task_name, due_date, party_responsible, status, remarks) VALUES (?, ?, ?, ?, ?, ?)");
    
    $event_id = 3;
    $task_name = "Test Task";
    $due_date = "2026-02-20";
    $party = "Test User";
    $status = "Pending";
    $remarks = "Test remarks";
    
    $test_insert->bind_param('isssss', $event_id, $task_name, $due_date, $party, $status, $remarks);
    
    if ($test_insert->execute()) {
        echo "<p style='color: green;'><strong>✓ INSERT test successful</strong></p>";
        echo "<p>Last inserted ID: " . $conn->insert_id . "</p>";
        
        // Delete test record
        $conn->query("DELETE FROM event_tasks WHERE task_id = " . $conn->insert_id);
        echo "<p>Test record deleted.</p>";
    } else {
        echo "<p style='color: red;'><strong>✗ INSERT test failed</strong></p>";
        echo "<p>Error: " . $test_insert->error . "</p>";
    }
}

echo "<h3>Database Connection Status:</h3>";
if ($conn->connect_error) {
    echo "<p style='color: red;'><strong>✗ Connection Error: " . $conn->connect_error . "</strong></p>";
} else {
    echo "<p style='color: green;'><strong>✓ Connected to database successfully</strong></p>";
    echo "<p>Database: " . $conn->get_server_info() . "</p>";
}

?>
