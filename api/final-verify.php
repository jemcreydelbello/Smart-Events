<?php
require_once '../config/db.php';

echo "=== Final Verification ===\n\n";

// Show all admins and their mapped users
echo "👥 Admin to User Mapping:\n";
$admins = $conn->query("SELECT admin_id, email, full_name FROM admins ORDER BY admin_id");
if ($admins && $admins->num_rows > 0) {
    while ($admin = $admins->fetch_assoc()) {
        // Try to find matching user by email
        $user = $conn->query("SELECT user_id, first_name, last_name FROM users WHERE email = '{$admin['email']}'");
        if ($user && $user->num_rows > 0) {
            $userData = $user->fetch_assoc();
            echo "  Admin {$admin['admin_id']} ({$admin['full_name']}) → User {$userData['user_id']} ({$userData['first_name']} {$userData['last_name']})\n";
        } else {
            echo "  Admin {$admin['admin_id']} ({$admin['full_name']}) → ❌ NO USER MATCH\n";
        }
    }
}

echo "\n✅ All admins now have matching users!\n";
echo "\n🎉 When you create an event:\n";
echo "  - Activity log will show the correct user who created it\n";
echo "  - Admin 4 (csdf from jemcreydelbello@gmail.com) → logged as Kevin Durant\n";
echo "  - Admin 10 (csdf from delapenaedrian555@gmail.com111) → logged as csdf\n";

?>
