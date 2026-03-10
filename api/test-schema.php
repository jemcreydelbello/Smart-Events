<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/db.php';

// Check the structure of the events table
$query = "DESCRIBE events";
$result = $conn->query($query);

if (!$result) {
    echo "ERROR: " . $conn->error . "\n";
    exit;
}

echo "Events table columns:\n";
echo "=====================\n";
while ($row = $result->fetch_assoc()) {
    echo $row['Field'] . " (" . $row['Type'] . ")\n";
}
?>
