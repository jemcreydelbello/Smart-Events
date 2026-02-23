<?php
require_once 'db_config.php';

// Test data for coordinator creation
$test_data = [
    'coordinator_name' => 'Test Coordinator',
    'email' => 'test' . time() . '@example.com',
    'contact_number' => '1234567890'
];

echo "=== Testing Coordinator CREATE ===\n";
echo "Test data: " . json_encode($test_data) . "\n\n";

echo "=== Testing INSERT Statement ===\n";
$query = "INSERT INTO coordinators (coordinator_name, email, contact_number) VALUES (?, ?, ?)";
echo "Query: $query\n";

$stmt = $conn->prepare($query);
if (!$stmt) {
    echo "PREPARE FAILED: " . $conn->error . "\n";
    exit;
}

echo "Prepare successful\n";

$stmt->bind_param('sss', $test_data['coordinator_name'], $test_data['email'], $test_data['contact_number']);
echo "Bind successful\n";

if (!$stmt->execute()) {
    echo "EXECUTE FAILED: " . $stmt->error . "\n";
    exit;
}

echo "Execute successful\n";
$coordinator_id = $conn->insert_id;
echo "Inserted coordinator with ID: $coordinator_id\n";

$stmt->close();

// Test optional fields update
echo "\n=== Testing Optional Fields Update ===\n";
$test_company = 'Test Company';
$test_job = 'Test Job Title';

$update_query = "UPDATE coordinators SET company = ?, job_title = ? WHERE coordinator_id = ?";
echo "Update query: $update_query\n";

$update_stmt = $conn->prepare($update_query);
if (!$update_stmt) {
    echo "Update PREPARE FAILED: " . $conn->error . "\n";
    exit;
}

echo "Update prepare successful\n";

$update_stmt->bind_param('ssi', $test_company, $test_job, $coordinator_id);
echo "Update bind successful\n";

if (!$update_stmt->execute()) {
    echo "Update EXECUTE FAILED: " . $update_stmt->error . "\n";
    exit;
}

echo "Update execute successful\n";
$update_stmt->close();

// Verify the data
echo "\n=== Verifying Created Coordinator ===\n";
$verify_query = "SELECT * FROM coordinators WHERE coordinator_id = ?";
$verify_stmt = $conn->prepare($verify_query);
$verify_stmt->bind_param('i', $coordinator_id);
$verify_stmt->execute();
$result = $verify_stmt->get_result();
$row = $result->fetch_assoc();

echo "Coordinator result: " . json_encode($row, JSON_PRETTY_PRINT) . "\n";

$verify_stmt->close();
$conn->close();
?>
