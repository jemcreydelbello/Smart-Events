<?php
header('Content-Type: application/json; charset=utf-8');

// Connect
$conn = new mysqli('localhost', 'root', '', 'eventsystem');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB Connection: ' . $conn->connect_error]);
    exit;
}

$conn->set_charset('utf8mb4');
$users = [];

// Admins
$sql = "SELECT admin_id as id, username, email, full_name, admin_image, 'Admin' as role_name, (status='active') as is_active, created_at, updated_at FROM admins";
if ($result = $conn->query($sql)) {
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

// Coordinators
$sql = "SELECT coordinator_id as id, coordinator_name as username, email, coordinator_name as full_name, coordinator_image, 'Coordinator' as role_name, is_active, created_at, updated_at FROM coordinators";
if ($result = $conn->query($sql)) {
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

$conn->close();

// Sort by date
usort($users, function($a, $b) {
    return strtotime($b['created_at'] ?? 0) - strtotime($a['created_at'] ?? 0);
});

echo json_encode([
    'success' => true,
    'count' => count($users),
    'data' => $users
]);
?>
