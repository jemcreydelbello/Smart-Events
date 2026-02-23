<?php
// ============================================================
// ADD NEW REGISTRATION FIELDS TO USERS TABLE
// ============================================================

require_once 'db_config.php';

echo "=== ADDING REGISTRATION FIELDS TO USERS TABLE ===\n\n";

// SQL to add new columns
$sqlCommands = array(
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255) NULL AFTER department_id",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(150) NULL AFTER company",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code VARCHAR(100) NULL AFTER job_title",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER employee_code"
);

$success = true;

foreach ($sqlCommands as $sql) {
    if ($conn->query($sql) === TRUE) {
        $column = explode('ADD COLUMN IF NOT EXISTS ', $sql)[1];
        $column = explode(' ', $column)[0];
        echo "✅ Added/Verified column: $column\n";
    } else {
        echo "❌ Error: " . $conn->error . "\n";
        echo "   SQL: $sql\n";
        $success = false;
    }
}

if ($success) {
    // Verify table structure
    echo "\n✅ Verifying table structure...\n";
    $check = $conn->query("DESCRIBE users");
    if ($check) {
        $columns_found = array();
        while ($row = $check->fetch_assoc()) {
            if (in_array($row['Field'], array('company', 'job_title', 'employee_code', 'phone'))) {
                $columns_found[] = $row['Field'];
            }
        }
        echo "✅ New columns verified: " . implode(', ', $columns_found) . "\n\n";
    }
    
    echo "✅ MIGRATION COMPLETE - New registration fields added!\n";
    echo "   - company\n";
    echo "   - job_title\n";
    echo "   - employee_code\n";
    echo "   - phone\n";
} else {
    echo "\n❌ Migration had errors!\n";
}

$conn->close();
?>
