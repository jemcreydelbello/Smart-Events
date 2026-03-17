<?php
require_once '../config/db.php';

// Check the schema of events table
$result = $conn->query("DESCRIBE events;");

$schema = [];
while ($row = $result->fetch_assoc()) {
    $schema[] = $row;
}

echo json_encode([
    'success' => true,
    'schema' => $schema
], JSON_PRETTY_PRINT);
?>
