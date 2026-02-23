<?php
$conn = new mysqli('localhost', 'root', '', 'eventsystem');

$cnt = $conn->query("SELECT COUNT(*) as c FROM events")->fetch_assoc()['c'];
file_put_contents('/tmp/eventcount.txt', (string)$cnt);

echo $cnt;
?>
