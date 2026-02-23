<?php
// Write output to a file
$output = [];

try {
    require_once 'db_config.php';
    $output[] = "=== Coordinator CREATE TEST ===";
    $output[] = "Date: " . date('Y-m-d H:i:s');
    
    // Test data
    $coordinator_name = 'Test' . time();
    $email = 'test' . time() . '@example.com';
    $contact_number = '1234567890';
    
    $output[] = "\nTest data:";
    $output[] = "- Name: $coordinator_name";
    $output[] = "- Email: $email";
    $output[] = "- Contact: $contact_number";
    
    // Check email uniqueness
    $output[] = "\nChecking email uniqueness...";
    $check_query = "SELECT coordinator_id FROM coordinators WHERE email = ?";
    $check_stmt = $conn->prepare($check_query);
    if (!$check_stmt) {
        $output[] = "ERROR in prepare: " . $conn->error;
    } else {
        $check_stmt->bind_param('s', $email);
        $check_stmt->execute();
        if ($check_stmt->get_result()->num_rows > 0) {
            $output[] = "Email already exists";
        } else {
            $output[] = "Email is unique - OK";
        }
        $check_stmt->close();
    }
    
    // INSERT coordinator
    $output[] = "\nINSERTing coordinator...";
    $query = "INSERT INTO coordinators (coordinator_name, email, contact_number) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        $output[] = "ERROR in prepare: " . $conn->error;
    } else {
        $output[] = "Prepare: OK";
        $stmt->bind_param('sss', $coordinator_name, $email, $contact_number);
        $output[] = "Bind param: OK";
        
        if (!$stmt->execute()) {
            $output[] = "ERROR in execute: " . $stmt->error;
        } else {
            $output[] = "Execute: OK";
            $coordinator_id = $conn->insert_id;
            $output[] = "Insert ID: $coordinator_id";
        }
        $stmt->close();
    }
    
    $output[] = "\nTEST COMPLETE";
    
} catch (Exception $e) {
    $output[] = "EXCEPTION: " . $e->getMessage();
}

$conn->close();

echo implode("\n", $output);
?>
