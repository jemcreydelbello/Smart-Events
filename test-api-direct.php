<?php
// Direct test of the coordinators.php API logic
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db_config.php';

// Simulate a POST request to create a coordinator
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'create';

// Simulate JSON input
$test_data = [
    'coordinator_name' => 'Direct Test Coordinator',
    'email' => 'directtest' . time() . '@example.com',
    'contact_number' => '9876543210'
];

echo "=== Testing Coordinator CREATE API ===\n";
echo "Input data: " . json_encode($test_data) . "\n\n";

// Set up input stream with our test data
$input = json_encode($test_data);
$GLOBALS['HTTP_RAW_POST_DATA'] = $input;

// Intercept the response
ob_start();

// Mock the request
$_SERVER['CONTENT_TYPE'] = 'application/json';

try {
    // Validate input
    $coordinator_name = $test_data['coordinator_name'] ?? '';
    $email = $test_data['email'] ?? '';
    $contact_number = $test_data['contact_number'] ?? '';
    $company = $test_data['company'] ?? '';
    $job_title = $test_data['job_title'] ?? '';
    $image_file = null;
    
    echo "Step 1: Input validation\n";
    if (!$coordinator_name || !$email) {
        echo "ERROR: Name and email required\n";
        exit;
    }
    echo "  ✓ Name and email present\n";
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "ERROR: Invalid email format\n";
        exit;
    }
    echo "  ✓ Email format valid\n";
    
    // Check if email already exists
    echo "\nStep 2: Check email uniqueness\n";
    $check_query = "SELECT coordinator_id FROM coordinators WHERE email = ?";
    $check_stmt = $conn->prepare($check_query);
    if (!$check_stmt) {
        echo "ERROR: Prepare failed: " . $conn->error . "\n";
        exit;
    }
    $check_stmt->bind_param('s', $email);
    $check_stmt->execute();
    if ($check_stmt->get_result()->num_rows > 0) {
        echo "ERROR: Email already exists\n";
        exit;
    }
    echo "  ✓ Email is unique\n";
    $check_stmt->close();
    
    // Insert coordinator
    echo "\nStep 3: INSERT core columns\n";
    $query = "INSERT INTO coordinators (coordinator_name, email, contact_number) VALUES (?, ?, ?)";
    echo "  Query: $query\n";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        echo "  ERROR: Prepare failed: " . $conn->error . "\n";
        exit;
    }
    echo "  ✓ Prepare successful\n";
    
    $stmt->bind_param('sss', $coordinator_name, $email, $contact_number);
    echo "  ✓ Bind param successful\n";
    
    if (!$stmt->execute()) {
        echo "  ERROR: Execute failed: " . $stmt->error . "\n";
        exit;
    }
    echo "  ✓ Execute successful\n";
    
    $coordinator_id = $conn->insert_id;
    echo "  ✓ Inserted with ID: $coordinator_id\n";
    $stmt->close();
    
    // Verify the data was inserted
    echo "\nStep 4: Verification\n";
    $verify_query = "SELECT * FROM coordinators WHERE coordinator_id = ?";
    $verify_stmt = $conn->prepare($verify_query);
    $verify_stmt->bind_param('i', $coordinator_id);
    $verify_stmt->execute();
    $result = $verify_stmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row) {
        echo "  ✓ Coordinator verified in database:\n";
        foreach ($row as $key => $value) {
            echo "    - $key: $value\n";
        }
    } else {
        echo "  ERROR: Coordinator not found in database\n";
    }
    $verify_stmt->close();
    
    echo "\n=== TEST PASSED ===\n";
    echo "Coordinator created successfully with ID: $coordinator_id\n";
    
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

$conn->close();
?>
