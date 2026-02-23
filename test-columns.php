<?php
require_once 'db_config.php';

echo "=== TABLE STRUCTURE ===\n";
$result = $conn->query("DESCRIBE coordinators");
$safe_columns = [];
while ($row = $result->fetch_assoc()) {
    $safe_columns[] = $row['Field'];
    echo $row['Field'] . " | " . $row['Type'] . " | " . ($row['Null'] == 'YES' ? 'NULL' : 'NOT NULL') . "\n";
}

echo "\n=== TESTING SAFE QUERY ===\n";
$query = "SELECT " . implode(", ", $safe_columns) . " FROM coordinators LIMIT 1";
echo "Query: $query\n\n";

$result = $conn->query($query);
if ($result) {
    $row = $result->fetch_assoc();
    echo "Success! Row: " . json_encode($row, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Error: " . $conn->error . "\n";
}

echo "\n=== CURRENT QUERY IN coordinators.php ===\n";
$query2 = "SELECT coordinator_id, coordinator_name, email, contact_number, company, job_title, coordinator_image FROM coordinators LIMIT 1";
echo "Query: $query2\n\n";

$result2 = $conn->query($query2);
if ($result2) {
    $row = $result2->fetch_assoc();
    echo "Success! Row: " . json_encode($row, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Error: " . $conn->error . "\n";
}
?>
