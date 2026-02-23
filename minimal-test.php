<?php
// Minimal test to just check basic INSERT
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

header('Content-Type: text/plain');

try {
    // Load database config
    require_once 'db_config.php';
    
    echo "Step 1: DB connection OK\n";
    
    // Try basic insert
    $test_time = time();
    $coordinator_name = "DirectTest$test_time";
    $email = "direct$test_time@test.com";
    $contact_number = "1234567890";
    
    echo "Step 2: Attempting INSERT...\n";
    echo "  Name: $coordinator_name\n";
    echo "  Email: $email\n";
    echo "  Contact: $contact_number\n";
    
    $query = "INSERT INTO coordinators (coordinator_name, email, contact_number) VALUES (?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        echo "PREPARE FAILED: " . $conn->error . "\n";
        exit(1);
    }
    
    $stmt->bind_param('sss', $coordinator_name, $email, $contact_number);
    
    if (!$stmt->execute()) {
        echo "EXECUTE FAILED: " . $stmt->error . "\n";
        exit(1);
    }
    
    $id = $conn->insert_id;
    echo "Step 3: INSERT successful, ID=$id\n";
    
    // Verify
    $verify = $conn->prepare("SELECT * FROM coordinators WHERE coordinator_id = ?");
    $verify->bind_param('i', $id);
    $verify->execute();
    $result = $verify->get_result();
    if ($row = $result->fetch_assoc()) {
        echo "Step 4: Verification OK\n";
        echo "Data: " . json_encode($row) . "\n";
    } else {
        echo "Step 4: Verification FAILED - not found\n";
    }
    
    echo "\n✓ TEST PASSED\n";
    
} catch (Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo "Class: " . get_class($e) . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
}
?>
