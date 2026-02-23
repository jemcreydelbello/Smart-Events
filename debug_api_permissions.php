<?php
/**
 * Debug script to test API access and permissions
 */

require_once 'db_config.php';

echo "<h2>API Permissions Debug</h2>";

// Test 1: Check if we can access events
echo "<h3>Test 1: Event Details API</h3>";
echo "<p>Testing: GET /api/events.php?action=detail&event_id=1</p>";

$url = 'http://localhost/Smart-Events/api/events.php?action=detail&event_id=1';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p><strong>HTTP Status:</strong> <span style='color: " . ($httpCode === 200 ? "green" : "red") . ";'>" . $httpCode . "</span></p>";

if ($httpCode === 200) {
    echo "<p style='color: green;'>✓ API request successful!</p>";
} else {
    echo "<p style='color: red;'>✗ API returned HTTP $httpCode (Expected 200)</p>";
}

// Test 2: Check localhost detection
echo "<h3>Test 2: Localhost Detection</h3>";
echo "<p><strong>Remote Address:</strong> " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A') . "</p>";
echo "<p><strong>HTTP Host:</strong> " . ($_SERVER['HTTP_HOST'] ?? 'N/A') . "</p>";

$is_localhost = (isset($_SERVER['REMOTE_ADDR']) && $_SERVER['REMOTE_ADDR'] === '127.0.0.1') ||
                (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') !== false);

if ($is_localhost) {
    echo "<p style='color: green;'>✓ Localhost detected - should have access!</p>";
} else {
    echo "<p style='color: orange;'>⚠ Not detected as localhost</p>";
}

// Test 3: Check database
echo "<h3>Test 3: Database Connection</h3>";
$test_query = "SELECT COUNT(*) as event_count FROM events";
$result = $conn->query($test_query);
if ($result) {
    $row = $result->fetch_assoc();
    echo "<p style='color: green;'>✓ Database connected! Events in database: " . $row['event_count'] . "</p>";
} else {
    echo "<p style='color: red;'>✗ Database error: " . $conn->error . "</p>";
}

echo "<p style='margin-top: 30px; padding: 10px; background: #f0f0f0; border-radius: 4px;'>";
echo "<strong>Summary:</strong> If all tests pass (green), the 403 error should be fixed. ";
echo "Try refreshing your browser and accessing the event again.";
echo "</p>";
?>
