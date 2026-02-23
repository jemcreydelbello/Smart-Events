<?php
// Detailed diagnostic of endpoints
header('Content-Type: text/plain');

function test_endpoint($url, $name) {
    echo "\n========================================\n";
    echo "Testing: $name\n";
    echo "URL: $url\n";
    echo "========================================\n";
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 10
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        echo "ERROR: No response received\n";
        return;
    }
    
    echo "Response length: " . strlen($response) . " bytes\n";
    echo "First 300 characters:\n";
    echo substr($response, 0, 300) . "\n";
    echo "\n";
    
    // Try to parse as JSON
    $json = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "ERROR: Not valid JSON\n";
        echo "JSON Error: " . json_last_error_msg() . "\n";
        
        // Check for PHP errors
        if (strpos($response, '<br') !== false || strpos($response, 'Fatal') !== false) {
            echo "Detected PHP error/fatal\n";
        }
    } else {
        echo "✓ Valid JSON\n";
        echo "Success: " . ($json['success'] ? 'true' : 'false') . "\n";
        if (isset($json['data'])) {
            echo "Data count: " . count($json['data']) . "\n";
        }
    }
}

test_endpoint('http://localhost/Smart-Events/api/admins.php?action=list', 'Admins List');
test_endpoint('http://localhost/Smart-Events/api/coordinators.php?action=list', 'Coordinators List');
?>
