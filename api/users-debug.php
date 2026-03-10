<?php
// Step-by-step users API with debugging
header('Content-Type: application/json');
ob_start();

$error = null;
$users = [];
$admin_count = 0;
$coordinator_count = 0;

try {
    // Step 1: Connect
    $conn = new mysqli('localhost', 'root', '', 'eventsystem');
    if ($conn->connect_error) {
        throw new Exception('Connection failed: ' . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    // Step 2: Get admins
    $result = $conn->query("SELECT admin_id as id, username, email, full_name, admin_image, 'Admin' as role_name, (status = 'active') as is_active, created_at, updated_at, 1 as setup_complete FROM admins ORDER BY created_at DESC");
    
    if (!$result) {
        throw new Exception('Admins query failed: ' . $conn->error);
    }
    
    $admin_count = $result->num_rows;
    while ($row = $result->fetch_assoc()) {
        $row['id'] = intval($row['id']);
        $row['is_active'] = (bool)($row['is_active']);
        $row['setup_complete'] = (bool)$row['setup_complete'];
        $users[] = $row;
    }
    
    // Step 3: Get coordinators
    $result = $conn->query("SELECT * FROM coordinators ORDER BY created_at DESC");
    
    if (!$result) {
        throw new Exception('Coordinators query failed: ' . $conn->error);
    }
    
    $coordinator_count = $result->num_rows;
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            'id' => intval($row['coordinator_id'] ?? 0),
            'username' => $row['coordinator_name'] ?? '',
            'email' => $row['email'] ?? '',
            'full_name' => $row['coordinator_name'] ?? '',
            'coordinator_image' => $row['coordinator_image'] ?? null,
            'role_name' => 'Coordinator',
            'is_active' => (bool)($row['is_active'] ?? 0),
            'created_at' => $row['created_at'] ?? '',
            'updated_at' => $row['updated_at'] ?? '',
            'setup_complete' => (bool)(isset($row['password_hash']) && !empty($row['password_hash']))
        ];
    }
    
    // Step 4: Sort
    if (!empty($users)) {
        usort($users, function($a, $b) {
            $timeA = isset($a['created_at']) ? strtotime($a['created_at']) : 0;
            $timeB = isset($b['created_at']) ? strtotime($b['created_at']) : 0;
            if ($timeA === false) $timeA = 0;
            if ($timeB === false) $timeB = 0;
            return $timeB - $timeA;
        });
    }
    
    $conn->close();
    
} catch (Throwable $e) {
    $error = $e->getMessage();
}

// Build response
if ($error) {
    http_response_code(500);
    $response = [
        'success' => false,
        'error' => $error
    ];
} else {
    http_response_code(200);
    $response = [
        'success' => true,
        'data' => $users,
        'count' => count($users),
        'admin_count' => $admin_count,
        'coordinator_count' => $coordinator_count
    ];
}

// Output
echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
ob_end_flush();
?>
