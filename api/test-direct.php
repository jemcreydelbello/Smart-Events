<?php
// Direct execution test - simulate what happens when the API is called
ob_start();

// Test what happens when we include admins.php
echo "=== Testing admins.php ===\n";

try {
    // Simulate the exact request
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_GET['action'] = 'list';
    
    // Include and execute
    include '../api/admins.php';
    
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

$output = ob_get_clean();

echo $output;
echo "\n============\n";
echo "Output length: " . strlen($output) . "\n";
echo "First char: '" . substr($output, 0, 1) . "'\n";

// Check if it's JSON
$json = @json_decode($output, true);
if ($json) {
    echo "Is valid JSON: YES\n";
    echo "Success: " . ($json['success'] ? 'true' : 'false') . "\n";
} else {
    echo "Is valid JSON: NO\n";
    if (substr($output, 0, 1) === '<') {
        echo "Looks like HTML error\n";
    }
}
?>
