<?php
require_once 'db_config.php';

$password_hash = '$2y$10$FN89S04XhfWYL9qrAo/3DutAmtY86Xs.Kpy.S7M9uEIcrIIBl./Ji';
$username = 'delapena';

$query = "UPDATE admins SET password_hash = ? WHERE username = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('ss', $password_hash, $username);

if ($stmt->execute()) {
    echo "Password hash updated successfully!";
} else {
    echo "Error: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
