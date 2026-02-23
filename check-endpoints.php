<?php
// Test the actual output
header('Content-Type: text/plain');

echo "Testing API endpoints...\n\n";

// Test 1: Admins
echo "1. Admins API\n";
echo "=============\n";

$url = 'http://localhost/Smart-Events/api/admins.php?action=list';
$response = @file_get_contents($url);

if ($response === false) {
    echo "ERROR: No response\n";
} else {
    echo "Response length: " . strlen($response) . " bytes\n";
    echo "First character code: " . ord(substr($response, 0, 1)) . "\n";
    echo "First character: '" . substr($response, 0, 1) . "'\n";
    echo "First 100 chars: " . substr($response, 0, 100) . "\n\n";
    
    // Try to JSON decode
    $json = json_decode($response, true);
    if ($json) {
        echo "✓ Valid JSON\n";
        echo "  success: " . ($json['success'] ? 'true' : 'false') . "\n";
        echo "  data items: " . count($json['data'] ?? []) . "\n";
    } else {
        echo "✗ Invalid JSON\n";
        echo "  Error: " . json_last_error_msg() . "\n";
    }
}

echo "\n";

// Test 2: Coordinators  
echo "2. Coordinators API\n";
echo "===================\n";

$url = 'http://localhost/Smart-Events/api/coordinators.php?action=list';
$response = @file_get_contents($url);

if ($response === false) {
    echo "ERROR: No response\n";
} else {
    echo "Response length: " . strlen($response) . " bytes\n";
    echo "First character code: " . ord(substr($response, 0, 1)) . "\n";
    echo "First character: '" . substr($response, 0, 1) . "'\n";
    echo "First 100 chars: " . substr($response, 0, 100) . "\n\n";
    
    // Try to JSON decode
    $json = json_decode($response, true);
    if ($json) {
        echo "✓ Valid JSON\n";
        echo "  success: " . ($json['success'] ? 'true' : 'false') . "\n";
        echo "  data items: " . count($json['data'] ?? []) . "\n";
    } else {
        echo "✗ Invalid JSON\n";
        echo "  Error: " . json_last_error_msg() . "\n";
    }
}
?>
