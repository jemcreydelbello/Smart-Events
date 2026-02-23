<?php
// Direct database connection test
echo "Testing database connection...\n\n";

$host = 'localhost';
$user = 'root';
$password = '';
$database = 'eventsystem';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    echo "Connection Error: " . $conn->connect_error . "\n";
    exit;
}

echo "✓ Connected to database successfully\n\n";

// Test events table
echo "Checking events table...\n";
$result = $conn->query("SELECT COUNT(*) as count FROM events");
if (!$result) {
    echo "✗ Error querying events: " . $conn->error . "\n";
} else {
    $row = $result->fetch_assoc();
    echo "✓ Events table exists. Row count: " . $row['count'] . "\n";
}

// List all tables
echo "\nAll tables in eventsystem:\n";
$tables = $conn->query("SHOW TABLES");
if ($tables) {
    while ($table = $tables->fetch_assoc()) {
        echo "  - " . $table['Tables_in_eventsystem'] . "\n";
    }
} else {
    echo "✗ Error listing tables: " . $conn->error . "\n";
}

$conn->close();
echo "\n✓ Test complete\n";
?>
