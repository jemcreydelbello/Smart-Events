<?php
require 'db_config.php';

// Check admin records
$result = $conn->query('SELECT admin_id, username, email, full_name, admin_image FROM admins LIMIT 1');

if ($result && $result->num_rows > 0) {
    $admin = $result->fetch_assoc();
    echo "Admin ID: " . $admin['admin_id'] . "\n";
    echo "Admin Name: " . $admin['full_name'] . "\n";
    echo "Admin Email: " . $admin['email'] . "\n";
    echo "Admin Image: " . ($admin['admin_image'] ?? 'NULL') . "\n";
    
    // Test the file path
    if ($admin['admin_image']) {
        $image_path = '../uploads/' . $admin['admin_image'];
        echo "Checking path: " . $image_path . "\n";
        echo "File exists: " . (file_exists($image_path) ? "YES" : "NO") . "\n";
    }
} else {
    echo "No admins found in database\n";
}

// Also check what files are in uploads folder
echo "\nFiles in uploads/admins/:\n";
$admin_uploads_dir = '../uploads/admins/';
if (is_dir($admin_uploads_dir)) {
    $files = scandir($admin_uploads_dir);
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            echo "- " . $file . "\n";
        }
    }
} else {
    echo "Directory doesn't exist\n";
}
?>
