<?php
require_once '../config/db.php';

echo "=== Checking Coordinators Table Structure ===\n\n";

$columnsResult = $conn->query("DESCRIBE coordinators");
if ($columnsResult && $columnsResult->num_rows > 0) {
    echo "Columns in coordinators table:\n";
    while ($col = $columnsResult->fetch_assoc()) {
        echo "  - {$col['Field']} ({$col['Type']})\n";
    }
} else {
    echo "Could not describe coordinators table\n";
}

echo "\n=== Sample Coordinator Row ===\n";
$sample = $conn->query("SELECT * FROM coordinators LIMIT 1");
if ($sample && $sample->num_rows > 0) {
    $row = $sample->fetch_assoc();
    echo json_encode($row, JSON_PRETTY_PRINT) . "\n";
}

?>
