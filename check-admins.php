<?php
require 'db_config.php';

$result = $conn->query('SELECT admin_id, username, email, full_name FROM admins');

while($row = $result->fetch_assoc()) {
    echo 'ID: ' . $row['admin_id'] . ', Username: ' . $row['username'] . ', Email: ' . $row['email'] . ', Name: ' . $row['full_name'] . "\n";
}
?>
