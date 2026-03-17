<?php
require_once '../config/db.php';

$query = "DESCRIBE events";
$result = $conn->query($query);

$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row['Field'];
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'columns' => $columns,
    'column_count' => count($columns)
]);
?>