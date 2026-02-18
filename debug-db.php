<?php
include("config/db.php");

echo "<h2>Database Debug</h2>";

// Get all tokens
$result = $conn->query("SELECT admin_id, email, reset_token, reset_expire FROM admins");

echo "<table border='1' cellpadding='10'>";
echo "<tr><th>Admin ID</th><th>Email</th><th>Full Token</th><th>Expires</th><th>Expired?</th></tr>";

while ($row = $result->fetch_assoc()) {
    $is_expired = $row['reset_expire'] < date('Y-m-d H:i:s') ? "YES" : "NO";
    echo "<tr>";
    echo "<td>" . $row['admin_id'] . "</td>";
    echo "<td>" . $row['email'] . "</td>";
    echo "<td>" . ($row['reset_token'] ? $row['reset_token'] : "NULL") . "</td>";
    echo "<td>" . $row['reset_expire'] . "</td>";
    echo "<td>" . $is_expired . "</td>";
    echo "</tr>";
}
echo "</table>";

echo "<p>Current time: " . date('Y-m-d H:i:s') . "</p>";

// Test the specific token
$test_token = "01f3bf35dbef8fb452aa3fac396378b3";
echo "<h3>Testing token: $test_token</h3>";
$test_result = $conn->query("SELECT * FROM admins WHERE reset_token='$test_token'");
echo "Found: " . $test_result->num_rows . " rows<br>";
if ($test_result->num_rows > 0) {
    $row = $test_result->fetch_assoc();
    echo "Expires: " . $row['reset_expire'] . "<br>";
    echo "Expired?: " . ($row['reset_expire'] < date('Y-m-d H:i:s') ? "YES" : "NO");
}
?>
