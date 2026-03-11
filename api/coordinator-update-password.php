<?php

include("../config/db.php");

// Set plain text response for this endpoint
header('Content-Type: text/plain; charset=utf-8');

// Validate input
if (!isset($_POST['password']) || !isset($_POST['token'])) {
    http_response_code(400);
    die("Error: Password and token are required");
}

$password = $_POST['password'];
$token = $_POST['token'];

// Validate password strength
if (strlen($password) < 8) {
    http_response_code(400);
    die("Error: Password must be at least 8 characters long");
}

// First verify the token exists and is not expired in coordinators table
$verify_sql = "SELECT coordinator_id, reset_expire FROM coordinators WHERE reset_token = ?";
$verify_stmt = $conn->prepare($verify_sql);
if (!$verify_stmt) {
    http_response_code(500);
    die("Error: Database error - verification failed");
}

$verify_stmt->bind_param("s", $token);
$verify_stmt->execute();
$verify_result = $verify_stmt->get_result();

if ($verify_result->num_rows == 0) {
    http_response_code(400);
    die("Error: Invalid or expired reset token");
}

$token_row = $verify_result->fetch_assoc();
$coordinator_id = $token_row['coordinator_id'];

// Check if token has expired
if ($token_row['reset_expire'] < date('Y-m-d H:i:s')) {
    http_response_code(400);
    die("Error: Reset token has expired");
}

$verify_stmt->close();

// Hash password
$password_hash = password_hash($password, PASSWORD_DEFAULT);

// Update password, clear reset token, and activate account (is_active = 1)
$update_sql = "UPDATE coordinators SET password_hash = ?, reset_token = NULL, reset_expire = NULL, is_active = 1 WHERE coordinator_id = ? LIMIT 1";
$update_stmt = $conn->prepare($update_sql);

if (!$update_stmt) {
    http_response_code(500);
    die("Error: Database prepare failed");
}

$update_stmt->bind_param("si", $password_hash, $coordinator_id);

if (!$update_stmt->execute()) {
    http_response_code(500);
    die("Error: Could not update password in database");
}

if ($update_stmt->affected_rows > 0) {
    echo "success: Password set successfully! Your account is now active. You can login with your credentials.";
} else {
    http_response_code(500);
    die("Error: Password update failed - no rows affected");
}

$update_stmt->close();
$conn->close();

?>
