<?php
// Comprehensive test of all coordinator operations
header('Content-Type: application/json');

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => []
];

// Test 1: GET list
$response = @file_get_contents('http://localhost/Smart-Events/api/coordinators.php?action=list');
if ($response) {
    $data = json_decode($response, true);
    $results['tests'][] = [
        'name' => 'GET list',
        'success' => $data['success'] ?? false,
        'count' => count($data['data'] ?? [])
    ];
}

// Test 2: CREATE new coordinator
$test_time = time();
$create_data = [
    'coordinator_name' => "VerifyTest$test_time",
    'email' => "verify$test_time@example.com",
    'contact_number' => '5551234567',
    'company' => 'VerifyCorp',
    'job_title' => 'Verify Manager'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost/Smart-Events/api/coordinators.php?action=create');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($create_data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response) {
    $data = json_decode($response, true);
    $created_id = $data['coordinator_id'] ?? null;
    $results['tests'][] = [
        'name' => 'POST create',
        'success' => $data['success'] ?? false,
        'http_code' => $http_code,
        'coordinator_id' => $created_id
    ];
    
    // Test 3: GET detail of newly created coordinator
    if ($created_id) {
        $response = @file_get_contents("http://localhost/Smart-Events/api/coordinators.php?action=detail&coordinator_id=$created_id");
        if ($response) {
            $data = json_decode($response, true);
            $results['tests'][] = [
                'name' => 'GET detail (new)',
                'success' => $data['success'] ?? false,
                'name_matches' => ($data['data']['coordinator_name'] ?? '') === "VerifyTest$test_time"
            ];
        }
    }
}

// Test 4: UPDATE coordinator
if ($created_id) {
    $update_data = [
        'coordinator_id' => $created_id,
        'coordinator_name' => "VerifyTestUpdated$test_time",
        'email' => "verify$test_time@example.com",
        'contact_number' => '5559876543',
        'company' => 'UpdatedCorp',
        'job_title' => 'Updated Manager'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost/Smart-Events/api/coordinators.php?action=update');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($update_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response) {
        $data = json_decode($response, true);
        $results['tests'][] = [
            'name' => 'POST update',
            'success' => $data['success'] ?? false,
            'http_code' => $http_code
        ];
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
