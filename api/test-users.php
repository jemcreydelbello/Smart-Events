<?php
// Test file to diagnose users.php issues
header('Content-Type: text/plain; charset=utf-8');

echo "=== Testing Users API ===\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "\n\n";

// Test database connection
echo "--- Testing Database Connection ---\n";
@require_once '../config/db.php';

if (!isset($conn)) {
    echo "ERROR: Database connection not established\n";
    exit;
}

if ($conn->connect_error) {
    echo "ERROR: Connection failed: " . $conn->connect_error . "\n";
    exit;
}

echo "✓ Database connected successfully\n\n";

// Check if tables exist
echo "--- Checking Tables ---\n";

$tables = ['admins', 'coordinators'];
foreach ($tables as $table) {
    $result = $conn->query("SELECT COUNT(*) as count FROM $table");
    if (!$result) {
        echo "✗ $table: Query error - " . $conn->error . "\n";
    } else {
        $row = $result->fetch_assoc();
        $count = $row['count'];
        echo "✓ $table: Found $count records\n";
    }
}

echo "\n--- Testing Admins Query ---\n";
$adminsQuery = "SELECT 
                admin_id as id,
                username,
                email,
                full_name,
                admin_image,
                'Admin' as role_name,
                (status = 'active') as is_active,
                created_at,
                updated_at,
                1 as setup_complete
              FROM admins 
              ORDER BY created_at DESC";

$result = $conn->query($adminsQuery);
if (!$result) {
    echo "ERROR: " . $conn->error . "\n";
} else {
    echo "✓ Query executed, rows: " . $result->num_rows . "\n";
    while ($row = $result->fetch_assoc()) {
        echo "  - Admin: {$row['username']} ({$row['email']})\n";
    }
}

echo "\n--- Testing Coordinators Query ---\n";
$coordQuery = "SELECT * FROM coordinators ORDER BY created_at DESC";
$result = $conn->query($coordQuery);
if (!$result) {
    echo "ERROR: " . $conn->error . "\n";
} else {
    echo "✓ Query executed, rows: " . $result->num_rows . "\n";
    $row = $result->fetch_assoc();
    if ($row) {
        echo "  Fields: " . implode(", ", array_keys($row)) . "\n";
        echo "  Sample - ID: {$row['coordinator_id']}, Name: {$row['coordinator_name']}, Email: {$row['email']}\n";
    }
}

echo "\n--- Testing JSON Encoding ---\n";
$testData = [
    'success' => true,
    'data' => [['id' => 1, 'name' => 'Test']],
    'count' => 1
];
$json = json_encode($testData);
echo "✓ JSON encoding works\n";
echo "Output length: " . strlen($json) . " bytes\n";
echo "First 100 chars: " . substr($json, 0, 100) . "\n";

echo "\n=== Done ===\n";
?>
