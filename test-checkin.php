<?php
require 'db_config.php';

echo "=== Testing QR Check-In API ===\n\n";

$code = 'REG-3AF4EC187032';

// Simulate the API request
echo "Simulating PUT request for: " . $code . "\n";
echo "Setting status to: ATTENDED\n\n";

// Check current status
$query = "SELECT registration_code, status FROM registrations WHERE UPPER(registration_code) = UPPER(?)";
$stmt = $conn->prepare($query);
$stmt->bind_param('s', $code);
$stmt->execute();
$result = $stmt->get_result();
$current = $result->fetch_assoc();

echo "Current status: " . $current['status'] . "\n";

// Try the UPDATE
$update_query = "UPDATE registrations SET status = 'ATTENDED' WHERE UPPER(registration_code) = UPPER(?)";
$update_stmt = $conn->prepare($update_query);
$update_stmt->bind_param('s', $code);
$update_stmt->execute();

$affected = $update_stmt->affected_rows;
echo "Rows affected by UPDATE: " . $affected . "\n";

// Return what the API would return
echo "\n=== API Response ===\n";
echo "Success: true\n";

if ($affected === 0 && $current['status'] === 'ATTENDED') {
    echo "Message: Registration status is ATTENDED\n";
    echo "Already checked in: true\n";
} else {
    echo "Message: Registration status updated to ATTENDED\n";
    echo "Already checked in: false\n";
}

// Get the full registration details
$detail_query = "SELECT u.full_name, u.email, e.event_name, r.registration_code, r.status
                 FROM registrations r
                 LEFT JOIN users u ON r.user_id = u.user_id
                 LEFT JOIN events e ON r.event_id = e.event_id
                 WHERE UPPER(r.registration_code) = UPPER(?)";

$detail_stmt = $conn->prepare($detail_query);
$detail_stmt->bind_param('s', $code);
$detail_stmt->execute();
$detail_result = $detail_stmt->get_result();
$reg = $detail_result->fetch_assoc();

echo "\nParticipant: " . $reg['full_name'] . "\n";
echo "Email: " . $reg['email'] . "\n";
echo "Event: " . $reg['event_name'] . "\n";
echo "Status: " . $reg['status'] . "\n";

?>
