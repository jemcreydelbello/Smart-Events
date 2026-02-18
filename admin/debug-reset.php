<?php
/**
 * Password Reset Debug Tool
 * Run this to diagnose password reset issues
 */

include("../config/db.php");

echo "<h2>Password Reset Debug Tool</h2>";
echo "<pre>";

// 1. Check database connection
echo "1. DATABASE CONNECTION: ";
if ($conn) {
    echo "✓ Connected\n";
} else {
    echo "✗ Failed\n";
    die("Cannot connect to database");
}

// 2. Check if reset columns exist
echo "\n2. DATABASE SCHEMA:\n";
$check_columns = $conn->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='admins' AND COLUMN_NAME IN ('reset_token', 'reset_expire')");
$columns_found = 0;
while ($col = $check_columns->fetch_assoc()) {
    echo "   ✓ Column found: " . $col['COLUMN_NAME'] . "\n";
    $columns_found++;
}
if ($columns_found < 2) {
    echo "   ✗ Missing reset columns\n";
}

// 3. Check for active tokens
echo "\n3. TOKENS IN DATABASE:\n";
$tokens = $conn->query("SELECT admin_id, email, reset_token, LENGTH(reset_token) as token_length, reset_expire FROM admins WHERE reset_token IS NOT NULL");
if ($tokens->num_rows > 0) {
    echo "   Found " . $tokens->num_rows . " active token(s):\n";
    while ($row = $tokens->fetch_assoc()) {
        echo "   - Email: " . $row['email'] . "\n";
        echo "     Token: " . $row['reset_token'] . "\n";
        echo "     Length: " . $row['token_length'] . "\n";
        echo "     Expires: " . $row['reset_expire'] . "\n";
        
        // Check if expired
        $now = date('Y-m-d H:i:s');
        if ($row['reset_expire'] > $now) {
            echo "     Status: ✓ VALID (not expired)\n";
        } else {
            echo "     Status: ✗ EXPIRED\n";
        }
    }
} else {
    echo "   No active tokens found\n";
}

// 4. Check email config
echo "\n4. EMAIL CONFIGURATION:\n";
include("../config/email_config.php");
echo "   ORG_WEBSITE: " . ORG_WEBSITE . "\n";
echo "   EMAIL_FROM: " . EMAIL_FROM . "\n";
echo "   SMTP_HOST: " . SMTP_HOST . "\n";

// 5. Test token generation
echo "\n5. TEST TOKEN GENERATION:\n";
$test_token = bin2hex(random_bytes(16));
echo "   Generated test token: " . $test_token . "\n";
echo "   Length: " . strlen($test_token) . "\n";
echo "   (Should be 32 characters)\n";

// 6. Admins in system
echo "\n6. ADMIN ACCOUNTS:\n";
$admins = $conn->query("SELECT admin_id, email, status FROM admins");
while ($admin = $admins->fetch_assoc()) {
    echo "   - " . $admin['email'] . " (Status: " . $admin['status'] . ")\n";
}

echo "\n7. TROUBLESHOOTING:\n";
echo "   If no tokens are shown above:\n";
echo "   - The 'Send Reset Link' button hasn't been clicked\n";
echo "   - Or tokens are expiring too quickly\n";
echo "\n   If tokens are shown but link still doesn't work:\n";
echo "   - Copy the exact token from above\n";
echo "   - Manually test: " . ORG_WEBSITE . "/admin/reset-password.php?token=<TOKEN>\n";
echo "   - Replace <TOKEN> with the token from above\n";

echo "</pre>";

$conn->close();
?>
