<?php
// ============================================================
// RUN EVENT METADATA MIGRATION
// ============================================================

require_once 'db_config.php';

echo "=== EVENT METADATA TABLE MIGRATION ===\n\n";

// Create the event_metadata table
$sqlCommands = array(
    "CREATE TABLE IF NOT EXISTS event_metadata (
        metadata_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        field_name VARCHAR(255) NOT NULL,
        field_value LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id),
        UNIQUE KEY unique_field_per_event (event_id, field_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

$success = true;

foreach ($sqlCommands as $sql) {
    if ($conn->query($sql) === TRUE) {
        echo "✅ Successfully created event_metadata table\n";
    } else {
        echo "❌ Error: " . $conn->error . "\n";
        $success = false;
    }
}

if ($success) {
    // Verify table exists
    $check = $conn->query("DESCRIBE event_metadata");
    if ($check) {
        echo "\n✅ Table structure verified:\n";
        while ($row = $check->fetch_assoc()) {
            echo "  - {$row['Field']} ({$row['Type']})\n";
        }
        echo "\n✅ MIGRATION COMPLETE - Database is ready!\n";
    }
} else {
    echo "\n❌ Migration failed!\n";
}

$conn->close();
?>
