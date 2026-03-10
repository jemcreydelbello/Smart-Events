<?php
// Write directly to file to verify PHP execution
$debug_file = dirname(__FILE__) . '/users-diagnostics.txt';
$output = [];

// Check 1: Script started
$output[] = date('Y-m-d H:i:s') . ' - Script started';

// Check 2: Can we connect to DB?
$conn = @mysqli_connect('localhost', 'root', '', 'eventsystem');
if (!$conn) {
    $output[] = 'DB Connection FAILED: ' . mysqli_connect_error();
} else {
    $output[] = 'DB Connection: SUCCESS';
    
    // Check 3: Get sample data
    $result = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM admins");
    if ($result) {
        $row = mysqli_fetch_assoc($result);
        $output[] = 'Admin count: ' . $row['cnt'];
    } else {
        $output[] = 'Admin query failed: ' . mysqli_error($conn);
    }
    
    $result = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM coordinators");
    if ($result) {
        $row = mysqli_fetch_assoc($result);
        $output[] = 'Coordinator count: ' . $row['cnt'];
    } else {
        $output[] = 'Coordinator query failed: ' . mysqli_error($conn);
    }
    
    mysqli_close($conn);
}

// Write to file
file_put_contents($debug_file, implode("\n", $output));

// Also echo as JSON
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => true, 'diagnostics' => $output]);
?>
