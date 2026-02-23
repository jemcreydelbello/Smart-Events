<?php
require 'db_config.php';

echo "=== Check Registration: REG-3AF4EC187032 ===\n\n";

$code = 'REG-3AF4EC187032';

$query = "SELECT r.registration_id, r.registration_code, r.status, 
                 u.user_id, u.full_name, u.email,
                 e.event_id, e.event_name, e.coordinator_id,
                 c.coordinator_id, c.coordinator_name
          FROM registrations r
          LEFT JOIN users u ON r.user_id = u.user_id
          LEFT JOIN events e ON r.event_id = e.event_id
          LEFT JOIN coordinators c ON e.coordinator_id = c.coordinator_id
          WHERE UPPER(r.registration_code) = UPPER(?)";

$stmt = $conn->prepare($query);
$stmt->bind_param('s', $code);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $reg = $result->fetch_assoc();
    
    echo "✓ Registration Found!\n";
    echo "Registration Code: " . $reg['registration_code'] . "\n";
    echo "Registration ID: " . $reg['registration_id'] . "\n";
    echo "Current Status: " . $reg['status'] . "\n";
    echo "\nParticipant:\n";
    echo "  Name: " . ($reg['full_name'] ?? 'N/A') . "\n";
    echo "  Email: " . ($reg['email'] ?? 'N/A') . "\n";
    echo "\nEvent:\n";
    echo "  Event ID: " . $reg['event_id'] . "\n";
    echo "  Event Name: " . $reg['event_name'] . "\n";
    echo "  Coordinator ID: " . ($reg['coordinator_id'] ?? 'NULL - UNASSIGNED') . "\n";
    echo "  Coordinator Name: " . ($reg['coordinator_name'] ?? 'UNASSIGNED') . "\n";
    
    // Test the UPDATE
    echo "\n=== Testing UPDATE ===\n";
    
    $update_query = "UPDATE registrations SET status = ? WHERE UPPER(registration_code) = UPPER(?)";
    $update_stmt = $conn->prepare($update_query);
    
    if ($update_stmt) {
        $new_status = 'ATTENDED';
        $update_stmt->bind_param('ss', $new_status, $code);
        
        if ($update_stmt->execute()) {
            echo "✓ UPDATE executed successfully\n";
            echo "Rows affected: " . $update_stmt->affected_rows . "\n";
            
            if ($update_stmt->affected_rows > 0) {
                echo "✓ Status updated to ATTENDED\n";
            } else {
                echo "⚠ UPDATE executed but 0 rows affected\n";
            }
        } else {
            echo "❌ UPDATE failed: " . $update_stmt->error . "\n";
        }
    } else {
        echo "❌ Prepare failed: " . $conn->error . "\n";
    }
    
} else {
    echo "❌ Registration not found\n";
    
    // List similar codes
    echo "\nSearching for similar codes:\n";
    $search = '%3AF4EC187032%';
    $search_query = "SELECT registration_code, registration_id FROM registrations WHERE registration_code LIKE ?";
    $search_stmt = $conn->prepare($search_query);
    $search_stmt->bind_param('s', $search);
    $search_stmt->execute();
    $search_result = $search_stmt->get_result();
    
    if ($search_result->num_rows > 0) {
        while ($row = $search_result->fetch_assoc()) {
            echo "  - " . $row['registration_code'] . "\n";
        }
    } else {
        echo "  No similar codes found\n";
    }
}

?>
