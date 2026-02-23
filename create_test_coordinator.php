<?php
require_once 'db_config.php';

$password_hash = '$2y$10$/Zkt7lkkz2yjdvn/Yd9t0.alFkDKFBc4HaijmUN4tXk/abcCQtJbu';
$email = 'coordinator@test.com';
$coordinator_name = 'Test Coordinator';

// Try to update if exists, insert if not
$checkQuery = "SELECT coordinator_id FROM coordinators WHERE email = ?";
$checkStmt = $conn->prepare($checkQuery);
$checkStmt->bind_param('s', $email);
$checkStmt->execute();
$result = $checkStmt->get_result();

if ($result->num_rows > 0) {
    // Update existing coordinator
    $query = "UPDATE coordinators SET password_hash = ?, coordinator_name = ? WHERE email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sss', $password_hash, $coordinator_name, $email);
    if ($stmt->execute()) {
        echo "Coordinator updated successfully!";
    } else {
        echo "Error: " . $stmt->error;
    }
} else {
    // Insert new coordinator
    $query = "INSERT INTO coordinators (coordinator_name, email, password_hash) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sss', $coordinator_name, $email, $password_hash);
    if ($stmt->execute()) {
        echo "Coordinator created successfully!";
        echo "\nCoordinator ID: " . $conn->insert_id;
    } else {
        echo "Error: " . $stmt->error;
    }
}

$stmt->close();
$conn->close();
?>
