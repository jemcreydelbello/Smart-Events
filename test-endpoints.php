<?php
// Test both endpoints to see which one is returning HTML
header('Content-Type: text/plain');

echo "=== Testing API Endpoints ===\n\n";

// Test 1: Admins list
echo "1. Testing /api/admins.php?action=list\n";
echo "-----------------------------------\n";

$response = @file_get_contents('http://localhost/Smart-Events/api/admins.php?action=list');
if ($response) {
    $first_char = substr($response, 0, 1);
    echo "First character: '$first_char'\n";
    if ($first_char === '{') {
        echo "✓ Returns JSON\n";
        $json = json_decode($response, true);
        if ($json) {
            echo "✓ Valid JSON - success=" . ($json['success'] ? 'true' : 'false') . "\n";
        }
    } else {
        echo "✗ Returns HTML or error\n";
        echo "First 200 chars:\n";
        echo substr($response, 0, 200) . "\n";
    }
} else {
    echo "✗ No response\n";
}

echo "\n2. Testing /api/coordinators.php?action=list\n";
echo "---------------------------------------------\n";

$response = @file_get_contents('http://localhost/Smart-Events/api/coordinators.php?action=list');
if ($response) {
    $first_char = substr($response, 0, 1);
    echo "First character: '$first_char'\n";
    if ($first_char === '{') {
        echo "✓ Returns JSON\n";
        $json = json_decode($response, true);
        if ($json) {
            echo "✓ Valid JSON - success=" . ($json['success'] ? 'true' : 'false') . "\n";
        }
    } else {
        echo "✗ Returns HTML or error\n";
        echo "First 200 chars:\n";
        echo substr($response, 0, 200) . "\n";
    }
} else {
    echo "✗ No response\n";
}
?>
