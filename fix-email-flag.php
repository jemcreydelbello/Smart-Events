<?php
// Enable email_on_user_create flag
require_once 'config/db.php';

$conn->query("UPDATE email_config SET email_on_user_create = 1 WHERE id = 1");
$result = $conn->query("SELECT * FROM email_config WHERE id = 1");

if ($result && $result->num_rows > 0) {
    $config = $result->fetch_assoc();
    echo "✅ Email config updated:\n";
    echo "From Email: " . $config['from_email'] . "\n";
    echo "email_on_user_create: " . ($config['email_on_user_create'] ? 'ENABLED ✓' : 'DISABLED ✗') . "\n";
    echo "\nFull Config:\n";
    print_r($config);
} else {
    echo "❌ No email config found";
}
?>
