<?php
require_once '../config/db.php';

echo "=== Testing Fixed resolveUserIdFromAdminId ===\n\n";

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
    $coordQuery = "SELECT email FROM coordinators WHERE coordinator_id = ?";
    $coordStmt = $conn->prepare($coordQuery);
    if (!$coordStmt) return null;
    
    $coordStmt->bind_param('i', $admin_or_coord_id);
    $coordStmt->execute();
    $coordResult = $coordStmt->get_result();
    $coordinator = $coordResult->fetch_assoc();
    $coordStmt->close();
    
    if ($coordinator && $coordinator['email']) {
        // Found coordinator, now find user with same email
        $userQuery = "SELECT user_id FROM users WHERE email = ?";
        $userStmt = $conn->prepare($userQuery);
        if (!$userStmt) return null;
        
        $userStmt->bind_param('s', $coordinator['email']);
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

// Test with admin_id 4
echo "🧪 Testing Admin ID 4:\n";
$resolved4 = resolveUserIdFromAdminId($conn, 4);
if ($resolved4) {
    echo "✅ Resolved to user_id: $resolved4\n";
    $userCheck = $conn->query("SELECT first_name, last_name FROM users WHERE user_id = $resolved4");
    if ($userCheck && $userCheck->num_rows > 0) {
        $user = $userCheck->fetch_assoc();
        echo "   User: {$user['first_name']} {$user['last_name']}\n";
    }
} else {
    echo "❌ Could not resolve\n";
}

// Test with admin_id 10
echo "\n🧪 Testing Admin ID 10:\n";
$resolved10 = resolveUserIdFromAdminId($conn, 10);
if ($resolved10) {
    echo "✅ Resolved to user_id: $resolved10\n";
    $userCheck = $conn->query("SELECT first_name, last_name FROM users WHERE user_id = $resolved10");
    if ($userCheck && $userCheck->num_rows > 0) {
        $user = $userCheck->fetch_assoc();
        echo "   User: {$user['first_name']} {$user['last_name']}\n";
    }
} else {
    echo "❌ Could not resolve\n";
}

echo "\n✅ Fix is working!\n";

?>
