<?php
// Simple test that mimics the JavaScript request
header('Content-Type: application/json');

require_once 'db_config.php';

// Simulate a POST request to coordinators.php with action=create
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/x-www-form-urlencoded';
$_GET['action'] = 'create';

// Simulate FormData input
$_POST['coordinator_name'] = 'Test Coordinator ' . time();
$_POST['email'] = 'test' . time() . '@example.com';
$_POST['contact_number'] = '1234567890';
$_POST['company'] = 'Test Company';
$_POST['job_title'] = 'Test Job';
$_POST['event_id'] = '0';
$_FILES['image'] = null;

// Now run the actual API code
echo "Starting test for coordinator creation...\n";
echo "POST data: " . json_encode($_POST) . "\n";

try {
    // Check if this is an update operation
    $action = $_GET['action'] ?? '';
    $isUpdate = ($action === 'update');
    
    echo "Action: $action (isUpdate: " . ($isUpdate ? 'true' : 'false') . ")\n";
    
    // Create new or update coordinator  
    // Handle both JSON and FormData
    $is_multipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
    
    echo "Is multipart: " . ($is_multipart ? 'true' : 'false') . "\n";
    
    $coordinator_id = null;
    if ($isUpdate) {
        if ($is_multipart) {
            $coordinator_id = intval($_POST['coordinator_id'] ?? 0);
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            $coordinator_id = intval($data['coordinator_id'] ?? 0);
        }
        
        if (!$coordinator_id) {
            echo "ERROR: Coordinator ID is required for update\n";
            exit;
        }
    }
    
    if ($is_multipart) {
        // FormData (with file upload)
        $coordinator_name = $_POST['coordinator_name'] ?? '';
        $email = $_POST['email'] ?? '';
        $contact_number = $_POST['contact_number'] ?? '';
        $company = $_POST['company'] ?? '';
        $job_title = $_POST['job_title'] ?? '';
        $image_file = $_FILES['image'] ?? null;
    } else {
        // JSON
        $data = json_decode(file_get_contents('php://input'), true);
        $coordinator_name = $data['coordinator_name'] ?? '';
        $email = $data['email'] ?? '';
        $contact_number = $data['contact_number'] ?? '';
        $company = $data['company'] ?? '';
        $job_title = $data['job_title'] ?? '';
        $image_file = null;
    }
    
    echo "Extracted:\n";
    echo "- Name: $coordinator_name\n";
    echo "- Email: $email\n";
    echo "- Contact: $contact_number\n";
    echo "- Company: $company\n";
    echo "- Job: $job_title\n";
    
    if (!$coordinator_name || !$email) {
        echo "ERROR: Name and email are required\n";
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "ERROR: Invalid email format\n";
        exit;
    }
    
    // Check if email already exists (for new coordinators)
    if (!$isUpdate) {
        $check_query = "SELECT coordinator_id FROM coordinators WHERE email = ?";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bind_param('s', $email);
        $check_stmt->execute();
        if ($check_stmt->get_result()->num_rows > 0) {
            echo "ERROR: Email already exists\n";
            exit;
        }
        $check_stmt->close();
    }
    
    // INSERT core columns
    $query = "INSERT INTO coordinators (coordinator_name, email, contact_number) VALUES (?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        echo "ERROR in prepare: " . $conn->error . "\n";
        exit;
    }
    
    echo "Prepare successful\n";
    
    $stmt->bind_param('sss', $coordinator_name, $email, $contact_number);
    echo "Bind param successful\n";
    
    if (!$stmt->execute()) {
        echo "ERROR in execute: " . $stmt->error . "\n";
        exit;
    }
    
    echo "Execute successful\n";
    $coordinator_id = $conn->insert_id;
    echo "Coordinator created with ID: $coordinator_id\n";
    
    $stmt->close();
    
    // Update optional fields if they have values
    if (!empty($company) || !empty($job_title)) {
        echo "Updating optional fields...\n";
        $optional_fields = [];
        $optional_values = [];
        $optional_types = '';
        
        if (!empty($company)) {
            $optional_fields[] = "company = ?";
            $optional_values[] = $company;
            $optional_types .= 's';
        }
        if (!empty($job_title)) {
            $optional_fields[] = "job_title = ?";
            $optional_values[] = $job_title;
            $optional_types .= 's';
        }
        
        if (!empty($optional_fields)) {
            $optional_values[] = $coordinator_id;
            $optional_types .= 'i';
            
            $update_query = "UPDATE coordinators SET " . implode(", ", $optional_fields) . " WHERE coordinator_id = ?";
            echo "Update query: $update_query\n";
            
            $update_stmt = $conn->prepare($update_query);
            
            if ($update_stmt) {
                echo "Update prepare successful\n";
                $update_stmt->bind_param($optional_types, ...$optional_values);
                echo "Update bind successful\n";
                if (!$update_stmt->execute()) {
                    echo "Update execute failed: " . $update_stmt->error . "\n";
                } else {
                    echo "Update successful\n";
                }
                $update_stmt->close();
            } else {
                echo "Update prepare failed: " . $conn->error . "\n";
            }
        }
    }
    
    echo "\n=== SUCCESS ===\n";
    echo "Coordinator created successfully with ID: $coordinator_id\n";
    
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

$conn->close();
?>
