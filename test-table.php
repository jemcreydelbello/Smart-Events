<?php
require_once 'db_config.php';

echo "=== COORDINATORS TABLE STRUCTURE ===\n";
$result = $conn->query("DESCRIBE coordinators");
if ($result) {
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[$row['Field']] = $row['Type'];
        echo $row['Field'] . " | " . $row['Type'] . "\n";
    }
    echo "\nColumns available: " . implode(", ", array_keys($columns)) . "\n";
} else {
    echo "Error: " . $conn->error . "\n";
}
?>
