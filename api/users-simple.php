<?php
// Ultra-simple users API - no fancy stuff
header('Content-Type: application/json; charset=utf-8');

$response_data = [];

// Connect to database
$mysqli = mysqli_connect('localhost', 'root', '', 'eventsystem');
if (!$mysqli) {
    die(json_encode(['success' => false, 'error' => 'Connection failed']));
}

mysqli_set_charset($mysqli, 'utf8mb4');

// Get admins
$result = mysqli_query($mysqli, "SELECT admin_id as id, username, email, full_name, admin_image, 'Admin' as role_name, (status = 'active') as is_active, created_at, updated_at FROM admins ORDER BY created_at DESC");

if (!$result) {
    die(json_encode(['success' => false, 'error' => 'Admins query failed: ' . mysqli_error($mysqli)]));
}

while ($row = mysqli_fetch_assoc($result)) {
    $response_data[] = $row;
}

// Get coordinators
$result = mysqli_query($mysqli, "SELECT coordinator_id, coordinator_name, email, company, contact_number, coordinator_image, 'Coordinator' as role_name, is_active, created_at, updated_at FROM coordinators ORDER BY created_at DESC");

if (!$result) {
    die(json_encode(['success' => false, 'error' => 'Coordinators query failed: ' . mysqli_error($mysqli)]));
}

while ($row = mysqli_fetch_assoc($result)) {
    $response_data[] = $row;
}

mysqli_close($mysqli);

// Output response
echo json_encode([
    'success' => true,
    'count' => count($response_data),
    'data' => $response_data
]);
?>
