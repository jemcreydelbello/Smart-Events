<?php
header('Content-Type: text/plain');

// Quick error check
echo "=== SMART EVENTS - QUICK DIAGNOSTIC ===\n\n";

// 1. Database connection
echo "[1] Testing database connection...\n";
$conn = @new mysqli('localhost', 'root', '', 'eventsystem');
if ($conn->connect_error) {
    echo "ERROR: " . $conn->connect_error . "\n";
    exit(1);
} else {
    echo "OK - Connected\n";
}

// 2. Test events table
echo "\n[2] Testing events table...\n";
$result = function_exists('mysqli_query') ? @mysqli_query($conn, "DESCRIBE events") : @$conn->query("DESCRIBE events");
if (!$result) {
    echo "ERROR: " . $conn->error . "\n";
    exit(1);
} else {
    echo "OK - Table accessible\n";
}

// 3. Test simple select
echo "\n[3] Testing SELECT from events...\n";
$select = @$conn->query("SELECT COUNT(*) as cnt FROM events");
if (!$select) {
    echo "ERROR: " . $conn->error . "\n";
    exit(1);
} else {
    $row = $select->fetch_assoc();
    echo "OK - " . $row['cnt'] . " rows found\n";
}

echo "\n=== ALL TESTS PASSED ===\n";
$conn->close();
?>
