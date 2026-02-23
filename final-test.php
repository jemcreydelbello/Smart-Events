<?php
// Final comprehensive test - simulate EXACTLY what the JavaScript sends
header('Content-Type: application/json');

// Simulate the exact request the JavaScript makes
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/x-www-form-urlencoded'; // FormData is actually multipart, but we'll test both
$_GET['action'] = 'create';

// This is what FormData looks like when parsed
$_POST = [
    'coordinator_name' => 'JSTest' . time(),
    'email' => 'jstest' . time() . '@example.com',
    'contact_number' => '5551234567',
    'company' => 'JSCorp',
    'job_title' => 'JS Manager',
    'event_id' => '0'  // This is sent by JS but never extracted in CREATE
];

$_FILES = []; // No image for this test

echo "=== Simulating JavaScript POST Request ===\n\n";

echo "Request Details:\n";
echo "  Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "  Action: " . ($_GET['action'] ?? 'none') . "\n";
echo "  Content-Type: " . $_SERVER['CONTENT_TYPE'] . "\n";
echo "  POST data:\n";
foreach ($_POST as $key => $value) {
    echo "    - $key: $value\n";
}

// Now run the actual API logic
echo "\n\n=== Running API Logic ===\n\n";

try {
    require_once 'db_config.php';
    
    $action = $_GET['action'] ?? '';
    $isUpdate = ($action === 'update');
    
    echo "Step 1: Check action\n";
    echo "  action=$action, isUpdate=" . ($isUpdate ? 'true' : 'false') . "\n";
    
    $is_multipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
    echo "Step 2: Check multipart\n";
    echo "  is_multipart=" . ($is_multipart ? 'true' : 'false') . "\n";
    
    // Extract data
    $coordinator_name = $_POST['coordinator_name'] ?? '';
    $email = $_POST['email'] ?? '';
    $contact_number = $_POST['contact_number'] ?? '';
    $company = $_POST['company'] ?? '';
    $job_title = $_POST['job_title'] ?? '';
    $image_file = $_FILES['image'] ?? null;
    
    echo "Step 3: Extract data\n";
    echo "  name: $coordinator_name\n";
    echo "  email: $email\n";
    echo "  contact: $contact_number\n";
    echo "  company: $company\n";
    echo "  job_title: $job_title\n";
    echo "  image: " . ($image_file ? 'yes' : 'no') . "\n";
    
    // Validation
    if (!$coordinator_name || !$email) {
        throw new Exception("Name and email are required");
    }
    echo "Step 4: Validation passed\n";
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }
    echo "Step 5: Email format valid\n";
    
    // Check email uniqueness
    $check_query = "SELECT coordinator_id FROM coordinators WHERE email = ?";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bind_param('s', $email);
    $check_stmt->execute();
    if ($check_stmt->get_result()->num_rows > 0) {
        throw new Exception("Email already exists");
    }
    $check_stmt->close();
    echo "Step 6: Email uniqueness check passed\n";
    
    // INSERT
    $query = "INSERT INTO coordinators (coordinator_name, email, contact_number) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    echo "Step 7: INSERT prepare successful\n";
    
    $stmt->bind_param('sss', $coordinator_name, $email, $contact_number);
    echo "Step 8: INSERT bind successful\n";
    
    if (!$stmt->execute()) {
        throw new Exception("INSERT execute failed: " . $stmt->error);
    }
    echo "Step 9: INSERT execute successful\n";
    
    $coordinator_id = $conn->insert_id;
    $stmt->close();
    echo "Step 10: Got insert ID: $coordinator_id\n";
    
    // UPDATE optional fields
    if (!empty($company) || !empty($job_title)) {
        echo "Step 11: Updating optional fields\n";
        
        $optional_fields = [];
        $optional_values = [];
        $optional_types = '';
        
        if (!empty($company)) {
            $optional_fields[] = "company = ?";
            $optional_values[] = $company;
            $optional_types .= 's';
            echo "  - company: $company\n";
        }
        if (!empty($job_title)) {
            $optional_fields[] = "job_title = ?";
            $optional_values[] = $job_title;
            $optional_types .= 's';
            echo "  - job_title: $job_title\n";
        }
        
        if (!empty($optional_fields)) {
            $optional_values[] = $coordinator_id;
            $optional_types .= 'i';
            
            $update_query = "UPDATE coordinators SET " . implode(", ", $optional_fields) . " WHERE coordinator_id = ?";
            echo "  Query: $update_query\n";
            echo "  Types: $optional_types\n";
            
            $update_stmt = $conn->prepare($update_query);
            if (!$update_stmt) {
                throw new Exception("UPDATE prepare failed: " . $conn->error);
            }
            echo "  Prepare: OK\n";
            
            $update_stmt->bind_param($optional_types, ...$optional_values);
            echo "  Bind: OK\n";
            
            if (!$update_stmt->execute()) {
                throw new Exception("UPDATE execute failed: " . $update_stmt->error);
            }
            echo "  Execute: OK\n";
            $update_stmt->close();
        }
    }
    
    echo "\n✓ SUCCESS - Coordinator created with ID: $coordinator_id\n";
    echo "\nFinal Response:\n";
    echo json_encode([
        'success' => true,
        'message' => 'Coordinator created successfully',
        'coordinator_id' => $coordinator_id
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo "\n✗ ERROR: " . $e->getMessage() . "\n";
    echo "\nError Response:\n";
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}

$conn->close();
?>
