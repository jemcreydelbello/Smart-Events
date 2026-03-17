<?php
require_once '../config/db.php';

$query = "DESCRIBE event_access_codes";
$result = $conn->query($query);

$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row;
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'columns' => $columns
]);
?>