<?php
require_once 'db_config.php';

echo "<h2>Adding More Test Registrations</h2>";

// Create additional test users
$testUsers = [
    ['name' => 'Guest 9', 'email' => 'guest9@example.com', 'company' => 'Company 9', 'job' => 'Consultant', 'status' => 'ATTENDED'],
    ['name' => 'Guest 10', 'email' => 'guest10@example.com', 'company' => 'Company 10', 'job' => 'Engineer', 'status' => 'REGISTERED'],
    ['name' => 'Guest 11', 'email' => 'guest11@example.com', 'company' => 'Company 11', 'job' => 'Developer', 'status' => 'REGISTERED'],
];

$participantRoleQuery = "SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT'";
$roleResult = $conn->query($participantRoleQuery);
$roleRow = $roleResult->fetch_assoc();
$roleId = $roleRow['role_id'] ?? 3;

$eventId = 1; // Use first event

foreach ($testUsers as $index => $user) {
    // Create user
    $passwordHash = password_hash('password123', PASSWORD_BCRYPT);
    $insertUserQuery = "INSERT INTO users (full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($insertUserQuery);
    $stmt->bind_param('sssi', $user['name'], $user['email'], $passwordHash, $roleId);
    
    if ($stmt->execute()) {
        $userId = $stmt->insert_id;
        echo "<p>✓ Created user: {$user['name']} (ID: $userId)</p>";
        
        // Create registration
        $registrationCode = 'SE-' . (1000 + 5 + $index);
        $status = $user['status'];
        
        $insertRegQuery = "INSERT INTO registrations (user_id, event_id, registration_code, status) VALUES (?, ?, ?, ?)";
        $regStmt = $conn->prepare($insertRegQuery);
        $regStmt->bind_param('iiss', $userId, $eventId, $registrationCode, $status);
        
        if ($regStmt->execute()) {
            echo "<p>&nbsp;&nbsp;&nbsp;✓ Registered with code: $registrationCode (Status: $status)</p>";
        } else {
            echo "<p>&nbsp;&nbsp;&nbsp;✗ Failed to create registration: " . $regStmt->error . "</p>";
        }
    } else {
        echo "<p>✗ Failed to create user: " . $stmt->error . "</p>";
    }
}

echo "<hr>";
echo "<h3><a href='test_attendees.php?event_id=" . $eventId . "'>View All Registrations for Event " . $eventId . "</a></h3>";
echo "<h3><a href='admin/event-details.html?id=" . $eventId . "'>Open Event Details</a></h3>";
?>
