<?php
require_once 'db_config.php';

echo "<h2>Creating Test Registrations</h2>";

// Create test users first
$testUsers = [
    ['name' => 'Guest 4', 'email' => 'guest4@example.com', 'company' => 'Company 4', 'job' => 'Coordinator'],
    ['name' => 'Guest 5', 'email' => 'guest5@example.com', 'company' => 'Company 5', 'job' => 'Specialist'],
    ['name' => 'Guest 6', 'email' => 'guest6@example.com', 'company' => 'Company 1', 'job' => 'Manager'],
    ['name' => 'Guest 7', 'email' => 'guest7@example.com', 'company' => 'Company 2', 'job' => 'Director'],
    ['name' => 'Guest 8', 'email' => 'guest8@example.com', 'company' => 'Company 3', 'job' => 'Analyst'],
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
        $registrationCode = 'SE-' . (1000 + $index + 1);
        $status = $index < 2 ? 'ATTENDED' : 'REGISTERED'; // First 2 are attended
        
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

echo "<h3><a href='test_attendees.php?event_id=" . $eventId . "'>View Registrations for Event " . $eventId . "</a></h3>";
?>
