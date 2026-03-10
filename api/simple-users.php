<?php
header('Content-Type: application/json');
$mysqli = mysqli_connect('localhost', 'root', '', 'eventsystem');
if (!$mysqli) {
    exit(json_encode(['success' => false, 'error' => 'Connection failed']));
}
mysqli_set_charset($mysqli, 'utf8mb4');
$all_users = [];
$result = mysqli_query($mysqli, "SELECT admin_id as id, username, email, full_name, admin_image, 'Admin' as role_name, (status = 'active') as is_active, created_at, updated_at FROM admins ORDER BY created_at DESC");
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $all_users[] = $row;
    }
}
$result = mysqli_query($mysqli, "SELECT coordinator_id as id, coordinator_name as username, email, coordinator_name as full_name, coordinator_image, 'Coordinator' as role_name, is_active, created_at, updated_at FROM coordinators ORDER BY created_at DESC");
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $all_users[] = $row;
    }
}
mysqli_close($mysqli);
usort($all_users, function($a, $b) {
    return strtotime($b['created_at'] ?? 0) - strtotime($a['created_at'] ?? 0);
});
echo json_encode(['success' => true, 'count' => count($all_users), 'data' => $all_users]);
?>

