<?php
// Diagnostic - show raw response with character counts
header('Content-Type: text/plain');

$db_host = 'localhost';
$db_user = 'root';
$db_password = '';
$db_name = 'eventsystem';

echo "=== Diagnostic Report ===\n\n";

echo "1. Connecting to MySQL...\n";
$conn = new mysqli($db_host, $db_user, $db_password, $db_name);

if ($conn->connect_error) {
    echo "❌ Connection failed: " . $conn->connect_error . "\n";
    exit;
}
echo "✓ Connected\n\n";

echo "2. Checking tables exist...\n";
$result = $conn->query("SHOW TABLES LIKE 'admins'");
if ($result && $result->num_rows > 0) {
    echo "✓ admins table exists\n";
} else {
    echo "❌ admins table NOT found\n";
}

$result = $conn->query("SHOW TABLES LIKE 'coordinators'");
if ($result && $result->num_rows > 0) {
    echo "✓ coordinators table exists\n";
} else {
    echo "❌ coordinators table NOT found\n";
}

echo "\n3. Counting rows...\n";
$result = $conn->query("SELECT COUNT(*) as cnt FROM admins");
$row = $result->fetch_assoc();
echo "Admin rows: " . ($row['cnt'] ?? 0) . "\n";

$result = $conn->query("SELECT COUNT(*) as cnt FROM coordinators");
$row = $result->fetch_assoc();
echo "Coordinator rows: " . ($row['cnt'] ?? 0) . "\n";

echo "\n4. Testing JSON encode...\n";
$test_data = [
    'success' => true,
    'test' => 'value'
];
$json = json_encode($test_data);
echo "JSON encode result: " . $json . "\n";
echo "JSON length: " . strlen($json) . " bytes\n";

echo "\n5. Attempting admins query...\n";
$sql = "SELECT admin_id, username, email, full_name FROM admins LIMIT 1";
$result = $conn->query($sql);
if (!$result) {
    echo "❌ Query failed: " . $conn->error . "\n";
} else {
    echo "✓ Query succeeded\n";
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo "Sample admin: " . json_encode($row) . "\n";
    } else {
        echo "No admin rows returned\n";
    }
}

echo "\n6. Attempting coordinators query...\n";
$sql = "SELECT coordinator_id, coordinator_name, email FROM coordinators LIMIT 1";
$result = $conn->query($sql);
if (!$result) {
    echo "❌ Query failed: " . $conn->error . "\n";
} else {
    echo "✓ Query succeeded\n";
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo "Sample coordinator: " . json_encode($row) . "\n";
    } else {
        echo "No coordinator rows returned\n";
    }
}

$conn->close();
echo "\nDiagnostic complete.\n";
?>
