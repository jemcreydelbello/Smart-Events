<?php
require_once '../config/db.php';

echo "=== Checking Admin 10 vs Users ===\n\n";

// Get admin 10 details
$admin10 = $conn->query("SELECT admin_id, email, username, full_name FROM admins WHERE admin_id = 10");
if ($admin10 && $admin10->num_rows > 0) {
    $admin = $admin10->fetch_assoc();
    echo "👤 Admin ID 10:\n";
    echo "   Email: '{$admin['email']}'\n";
    echo "   Username: {$admin['username']}\n";
    echo "   Full Name: {$admin['full_name']}\n";
}

// Get all users with similar email
echo "\n📋 Users in database:\n";
$users = $conn->query("SELECT user_id, email, first_name, last_name FROM users ORDER BY user_id");
if ($users && $users->num_rows > 0) {
    while ($user = $users->fetch_assoc()) {
        echo "   User {$user['user_id']}: {$user['email']} - {$user['first_name']} {$user['last_name']}\n";
    }
}

// Check if there's an exact match for admin 10's email
echo "\n🔍 Checking exact email match for admin 10:\n";
$exact = $conn->query("SELECT user_id FROM users WHERE email = 'delapenaedrian555@gmail.com111'");
if ($exact && $exact->num_rows > 0) {
    $match = $exact->fetch_assoc();
    echo "✅ Found exact match: user_id {$match['user_id']}\n";
} else {
    echo "❌ No exact match found\n";
}

// The real issue: admin 10 should map to a user, but which one?
echo "\n❓ Question: Which user should admin 10 map to?\n";
echo "   Admin 10 email: delapenaedrian555@gmail.com111\n";
echo "   Admin 10 name: csdf\n";
echo "   There's NO matching user with that exact email!\n";

echo "\n💡 Solution: Admin 10 needs to be linked to a user with name 'csdf'\n";
echo "   Or create a user with email 'delapenaedrian555@gmail.com111' and name 'csdf'\n";

?>
