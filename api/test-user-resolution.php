<?php
require_once '../config/db.php';

// Test resolveUserIdFromAdminId function
function resolveUserIdFromAdminId($conn, $admin_or_coord_id) {
    // First try to find in admins table
    $query = "SELECT email FROM admins WHERE admin_id = ?";
    $stmt = $conn->prepare($query);
    if (!$stmt) return null;
    
    $stmt->bind_param('i', $admin_or_coord_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $admin = $result->fetch_assoc();
    $stmt->close();
    
    if ($admin && $admin['email']) {
        // Found admin, now find user with same email
        $userQuery = "SELECT user_id FROM users WHERE email = ?";
        $userStmt = $conn->prepare($userQuery);
        if (!$userStmt) return null;
        
        $userStmt->bind_param('s', $admin['email']);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $user = $userResult->fetch_assoc();
        $userStmt->close();
        
        if ($user && $user['user_id']) {
            return $user['user_id'];
        }
    }
    
    // If not found in admins, try coordinators
    $coordQuery = "SELECT coordinator_email FROM coordinators WHERE coordinator_id = ?";
    $coordStmt = $conn->prepare($coordQuery);
    if (!$coordStmt) return null;
    
    $coordStmt->bind_param('i', $admin_or_coord_id);
    $coordStmt->execute();
    $coordResult = $coordStmt->get_result();
    $coordinator = $coordResult->fetch_assoc();
    $coordStmt->close();
    
    if ($coordinator && $coordinator['coordinator_email']) {
        // Found coordinator, now find user with same email
        $userQuery = "SELECT user_id FROM users WHERE email = ?";
        $userStmt = $conn->prepare($userQuery);
        if (!$userStmt) return null;
        
        $userStmt->bind_param('s', $coordinator['coordinator_email']);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $user = $userResult->fetch_assoc();
        $userStmt->close();
        
        if ($user && $user['user_id']) {
            return $user['user_id'];
        }
    }
    
    return null;
}

echo "=== Testing Admin ID to User ID Resolution ===\n\n";

// Test resolving admin_id 4 to user_id
$admin_id = 4;
echo "🔍 Resolving admin_id: $admin_id\n";

$resolved_user_id = resolveUserIdFromAdminId($conn, $admin_id);

if ($resolved_user_id) {
    echo "✅ Successfully resolved to user_id: $resolved_user_id\n";
    
    // Verify the user exists
    $userCheck = $conn->query("SELECT user_id, email, first_name, last_name FROM users WHERE user_id = $resolved_user_id");
    if ($userCheck && $userCheck->num_rows > 0) {
        $user = $userCheck->fetch_assoc();
        echo "   User Name: {$user['first_name']} {$user['last_name']}\n";
        echo "   User Email: {$user['email']}\n";
    }
} else {
    echo "❌ Could not resolve admin_id to user_id\n";
}

echo "\n=== Testing Activity Log with Correct User ID ===\n";

// Check the most recent log from admin_id 4
$logsCheck = $conn->query("
    SELECT l.*, a.username as admin_name, u.first_name, u.last_name
    FROM activity_logs l
    LEFT JOIN admins a ON a.admin_id = 4 AND a.email = (SELECT email FROM admins WHERE admin_id = 4)
    LEFT JOIN users u ON u.user_id = l.user_id
    WHERE l.action_type = 'CREATE'
    ORDER BY l.log_id DESC
    LIMIT 3
");

if ($logsCheck && $logsCheck->num_rows > 0) {
    while ($log = $logsCheck->fetch_assoc()) {
        echo "\n📋 Log Entry:\n";
        echo "   Action: {$log['action_type']} {$log['entity_type']} #{$log['entity_id']}\n";
        echo "   User ID: {$log['user_id']}\n";
        if ($log['first_name']) {
            echo "   User Name: {$log['first_name']} {$log['last_name']}\n";
        }
        echo "   Description: {$log['description']}\n";
        echo "   Time: {$log['timestamp']}\n";
    }
} else {
    echo "No CREATE logs found\n";
}

?>
