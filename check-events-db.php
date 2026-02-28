<?php
require_once 'db_config.php';

$result = $conn->query("SELECT event_id, event_name, event_date, is_private FROM events ORDER BY event_id DESC LIMIT 20");

echo json_encode([
    'total_events' => $conn->query("SELECT COUNT(*) as c FROM events")->fetch_assoc()['c'],
    'recent_events' => $result->fetch_all(MYSQLI_ASSOC)
], JSON_PRETTY_PRINT);
?>
