<?php
// Check the table structure and try creating a coordinator
header('Content-Type: application/json');

require_once 'db_config.php';

$response = [
    'success' => false,
    'steps' => []
];

try {
    // Step 1: Check columns
    $result = $conn->query("SHOW COLUMNS FROM coordinators");
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[$row['Field']] = $row['Type'];
    }
    
    $response['steps'][] = [
        'name' => 'Check table columns',
        'success' => true,
        'columns' => $columns
    ];
    
    // Step 2: Try INSERT
    $test_data = [
        'name' => 'TestCoord' . time(),
        'email' => 'test' . time() . '@example.com',
        'contact' => '9876543210'
    ];
    
    $query = "INSERT INTO coordinators (coordinator_name, email, contact_number) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param('sss', $test_data['name'], $test_data['email'], $test_data['contact']);
    $stmt->execute();
    $coordinator_id = $conn->insert_id;
    $stmt->close();
    
    $response['steps'][] = [
        'name' => 'INSERT core columns',
        'success' => true,
        'coordinator_id' => $coordinator_id
    ];
    
    // Step 3: Try UPDATE optional columns (if they exist)
    if (isset($columns['company']) || isset($columns['job_title']) || isset($columns['coordinator_image'])) {
        $fields_to_update = [];
        $types = '';
        $values = [];
        
        if (isset($columns['company'])) {
            $fields_to_update[] = "`company` = ?";
            $types .= 's';
            $values[] = 'TestCompany';
        }
        if (isset($columns['job_title'])) {  
            $fields_to_update[] = "`job_title` = ?";
            $types .= 's';
            $values[] = 'TestJob';
        }
        if (isset($columns['coordinator_image'])) {
            $fields_to_update[] = "`coordinator_image` = ?";
            $types .= 's';
            $values[] = 'test.jpg';
        }
        
        $types .= 'i';
        $values[] = $coordinator_id;
        
        $update_query = "UPDATE coordinators SET " . implode(", ", $fields_to_update) . " WHERE coordinator_id = ?";
        $update_stmt = $conn->prepare($update_query);
        
        if ($update_stmt) {
            $update_stmt->bind_param($types, ...$values);
            $update_stmt->execute();
            $update_stmt->close();
            
            $response['steps'][] = [
                'name' => 'UPDATE optional columns',
                'success' => true,
                'query' => $update_query
            ];
        } else {
            $response['steps'][] = [
                'name' => 'UPDATE optional columns',
                'success' => false,
                'error' => $conn->error
            ];
        }
    } else {
        $response['steps'][] = [
            'name' => 'UPDATE optional columns',
            'success' => true,
            'note' => 'No optional columns to update'
        ];
    }
    
    // Step 4: Verify
    $verify_stmt = $conn->prepare("SELECT * FROM coordinators WHERE coordinator_id = ?");
    $verify_stmt->bind_param('i', $coordinator_id);
    $verify_stmt->execute();
    $result = $verify_stmt->get_result();
    $verified_data = $result->fetch_assoc();
    $verify_stmt->close();
    
    $response['steps'][] = [
        'name' => 'Verify inserted data',
        'success' => !!$verified_data,
        'data' => $verified_data
    ];
    
    $response['success'] = true;
    
} catch (Exception $e) {
    $response['steps'][] = [
        'name' => 'Error',
        'success' => false,
        'error' => $e->getMessage()
    ];
}

$conn->close();
echo json_encode($response, JSON_PRETTY_PRINT);
?>
