<?php
// Direct endpoint test  
header('Content-Type: text/plain');

echo "Testing API Endpoints\n";
echo "====================\n\n";

$admins_url = 'http://localhost/Smart-Events/api/admins.php?action=list';
$coords_url = 'http://localhost/Smart-Events/api/coordinators.php?action=list';

echo "1. ADMINS ENDPOINT\n";
echo "-----------\n";
$response = @file_get_contents($admins_url);
if ($response === false) {
    echo "NO RESPONSE\n";
} else {
    echo "Response length: " . strlen($response) . " bytes\n";
    echo "First char: '" . substr($response, 0, 1) . "' (code: " . ord(substr($response, 0, 1)) . ")\n";
    $json = @json_decode($response, true);
    if ($json) {
        echo "✓ Valid JSON - success=" . ($json['success'] ? 'true' : 'false') . "\n";
    } else {
        echo "✗ Invalid JSON\n";
        echo "First 200 chars:\n" . substr($response, 0, 200) . "\n";
    }
}  

echo "\n2. COORDINATORS ENDPOINT\n";
echo "------------------------\n";
$response = @file_get_contents($coords_url);
if ($response === false) {
    echo "NO RESPONSE\n";
} else {
    echo "Response length: " . strlen($response) . " bytes\n";
    echo "First char: '" . substr($response, 0, 1) . "' (code: " . ord(substr($response, 0, 1)) . ")\n";
    $json = @json_decode($response, true);
    if ($json) {
        echo "✓ Valid JSON - success=" . ($json['success'] ? 'true' : 'false') . "\n";
    } else {
        echo "✗ Invalid JSON\n";
        echo "First 200 chars:\n" . substr($response, 0, 200) . "\n";
    }
}
?>
