<?php
require_once '../config/db.php';

echo "=== Diagnostic: User ID 10 ===\n\n";

// Check if user 10 exists
$userCheck = $conn->query("SELECT user_id, email, first_name, last_name FROM users WHERE user_id = 10");
if ($userCheck && $userCheck->num_rows > 0) {
    $user = $userCheck->fetch_assoc();
    echo "✅ User ID 10 exists:\n";
    echo "   Name: {$user['first_name']} {$user['last_name']}\n";
    echo "   Email: {$user['email']}\n";
} else {
    echo "❌ User ID 10 NOT found in users table\n";
}

// Check if user 10 is an admin
$adminCheck = $conn->query("SELECT admin_id, email FROM admins WHERE admin_id = 10");
if ($adminCheck && $adminCheck->num_rows > 0) {
    $admin = $adminCheck->fetch_assoc();
    echo "\n✅ User ID 10 is also Admin ID 10:\n";
    echo "   Email: {$admin['email']}\n";
} else {
    echo "\n⚠️ User ID 10 is NOT an admin_id\n";
}

// Check recent events
echo "\n📋 Recent Events:\n";
$eventsCheck = $conn->query("SELECT event_id, event_name, created_by FROM events ORDER BY event_id DESC LIMIT 5");
if ($eventsCheck && $eventsCheck->num_rows > 0) {
    while ($event = $eventsCheck->fetch_assoc()) {
        echo "   Event ID: {$event['event_id']}, Name: {$event['event_name']}, Created By: {$event['created_by']}\n";
    }
}

// Check error logs
echo "\n🔍 PHP Error Log (last 10 lines):\n";
$errorLogPath = 'C:\\xampp\\apache\\logs\\error.log';
if (file_exists($errorLogPath)) {
    $lines = file($errorLogPath);
    $lastLines = array_slice($lines, -10);
    foreach ($lastLines as $line) {
        if (strpos($line, 'Smart-Events') !== false || strpos($line, 'events.php') !== false) {
            echo trim($line) . "\n";
        }
    }
} else {
    echo "Error log not found at: $errorLogPath\n";
}

// Test resolveUserIdFromAdminId with user_id 10
echo "\n🧪 Testing resolveUserIdFromAdminId(conn, 10):\n";

function resolveUserIdFromAdminId($conn, $admin_or_coord_id) {
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
    
    $coordQuery = "SELECT coordinator_email FROM coordinators WHERE coordinator_id = ?";
    $coordStmt = $conn->prepare($coordQuery);
    if (!$coordStmt) return null;
    
    $coordStmt->bind_param('i', $admin_or_coord_id);
    $coordStmt->execute();
    $coordResult = $coordStmt->get_result();
    $coordinator = $coordResult->fetch_assoc();
    $coordStmt->close();
    
    if ($coordinator && $coordinator['coordinator_email']) {
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

$resolved = resolveUserIdFromAdminId($conn, 10);
echo "Result: " . ($resolved ? "Resolved to user_id $resolved" : "Could not resolve") . "\n";

?>
