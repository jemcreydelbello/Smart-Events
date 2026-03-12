<?php
require_once '../config/db.php';

echo "=== Verifying Resolution for Admin 10 ===\n\n";

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
    
    $coordQuery = "SELECT email FROM coordinators WHERE coordinator_id = ?";
    $coordStmt = $conn->prepare($coordQuery);
    if (!$coordStmt) return null;
    
    $coordStmt->bind_param('i', $admin_or_coord_id);
    $coordStmt->execute();
    $coordResult = $coordStmt->get_result();
    $coordinator = $coordResult->fetch_assoc();
    $coordStmt->close();
    
    if ($coordinator && $coordinator['email']) {
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

// Test with admin 10
echo "🧪 Testing Admin ID 10 Resolution:\n";
$resolved = resolveUserIdFromAdminId($conn, 10);
echo "Result: " . ($resolved ? "user_id $resolved" : "NULL") . "\n";

if ($resolved) {
    $userCheck = $conn->query("SELECT user_id, email, first_name, last_name FROM users WHERE user_id = $resolved");
    if ($userCheck && $userCheck->num_rows > 0) {
        $user = $userCheck->fetch_assoc();
        echo "✅ User Details:\n";
        echo "   User ID: {$user['user_id']}\n";
        echo "   Email: {$user['email']}\n";
        echo "   Name: {$user['first_name']} {$user['last_name']}\n";
    }
}

// Test with admin 4 to make sure it still works
echo "\n🧪 Testing Admin ID 4 Resolution:\n";
$resolved4 = resolveUserIdFromAdminId($conn, 4);
echo "Result: " . ($resolved4 ? "user_id $resolved4" : "NULL") . "\n";

if ($resolved4) {
    $userCheck = $conn->query("SELECT user_id, email, first_name, last_name FROM users WHERE user_id = $resolved4");
    if ($userCheck && $userCheck->num_rows > 0) {
        $user = $userCheck->fetch_assoc();
        echo "✅ User Details:\n";
        echo "   User ID: {$user['user_id']}\n";
        echo "   Email: {$user['email']}\n";
        echo "   Name: {$user['first_name']} {$user['last_name']}\n";
    }
}

?>
