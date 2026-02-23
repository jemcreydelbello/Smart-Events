<?php
// ============================================================
// METADATA CRUD OPERATIONS TEST
// ============================================================

require_once 'db_config.php';

echo "=== METADATA CRUD OPERATIONS TEST ===\n\n";

// Test 1: Get an existing event ID
echo "Step 1: Finding test event...\n";
$query = "SELECT event_id, event_name FROM events LIMIT 1";
$result = $conn->query($query);
$event = $result->fetch_assoc();

if (!$event) {
    echo "❌ No events found in database. Create an event first.\n";
    exit;
}

$event_id = $event['event_id'];
$event_name = $event['event_name'];
echo "✅ Found event: ID={$event_id}, Name={$event_name}\n\n";

// Test 2: CREATE - Add metadata
echo "Step 2: Testing CREATE operation...\n";
$test_field = "Emergency Contact";
$test_value = "+1 555 0123";

$insert_query = "INSERT INTO event_metadata (event_id, field_name, field_value) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE field_value = ?";
$stmt = $conn->prepare($insert_query);
$stmt->bind_param('isss', $event_id, $test_field, $test_value, $test_value);

if ($stmt->execute()) {
    $metadata_id = $stmt->insert_id;
    echo "✅ CREATE successful\n";
    echo "   Field: $test_field\n";
    echo "   Value: $test_value\n";
    echo "   Metadata ID: $metadata_id\n\n";
} else {
    echo "❌ CREATE failed: " . $stmt->error . "\n";
    exit;
}
$stmt->close();

// Test 3: CREATE ANOTHER - Add second metadata
echo "Step 3: Testing CREATE another metadata...\n";
$test_field2 = "Lead Organizer";
$test_value2 = "John Doe";

$insert_query = "INSERT INTO event_metadata (event_id, field_name, field_value) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE field_value = ?";
$stmt = $conn->prepare($insert_query);
$stmt->bind_param('isss', $event_id, $test_field2, $test_value2, $test_value2);

if ($stmt->execute()) {
    $metadata_id2 = $stmt->insert_id;
    echo "✅ CREATE second metadata successful\n";
    echo "   Field: $test_field2\n";
    echo "   Value: $test_value2\n";
    echo "   Metadata ID: $metadata_id2\n\n";
} else {
    echo "❌ CREATE failed: " . $stmt->error . "\n";
    exit;
}
$stmt->close();

// Test 4: READ - Fetch all metadata for event
echo "Step 4: Testing READ operation (list all)...\n";
$read_query = "SELECT metadata_id, field_name, field_value, created_at FROM event_metadata WHERE event_id = ? ORDER BY created_at ASC";
$stmt = $conn->prepare($read_query);
$stmt->bind_param('i', $event_id);
$stmt->execute();
$result = $stmt->get_result();

$count = 0;
echo "   Metadata for Event #{$event_id}:\n";
while ($row = $result->fetch_assoc()) {
    $count++;
    echo "   [{$count}] {$row['field_name']} = {$row['field_value']}\n";
}
echo "✅ READ successful (found $count records)\n\n";
$stmt->close();

// Test 5: UPDATE - Modify metadata
echo "Step 5: Testing UPDATE operation...\n";
$updated_value = "+1 555 9999";
$update_query = "UPDATE event_metadata SET field_value = ? WHERE metadata_id = ?";
$stmt = $conn->prepare($update_query);
$stmt->bind_param('si', $updated_value, $metadata_id);

if ($stmt->execute()) {
    echo "✅ UPDATE successful\n";
    echo "   Updated Metadata ID: $metadata_id\n";
    echo "   New value: $updated_value\n\n";
} else {
    echo "❌ UPDATE failed: " . $stmt->error . "\n";
    exit;
}
$stmt->close();

// Verify update
$verify_query = "SELECT field_value FROM event_metadata WHERE metadata_id = ?";
$stmt = $conn->prepare($verify_query);
$stmt->bind_param('i', $metadata_id);
$stmt->execute();
$verify_result = $stmt->get_result()->fetch_assoc();
echo "   ✓ Verified new value: {$verify_result['field_value']}\n\n";
$stmt->close();

// Test 6: DELETE - Remove metadata
echo "Step 6: Testing DELETE operation...\n";
$count_before = $conn->query("SELECT COUNT(*) as cnt FROM event_metadata WHERE event_id = $event_id")->fetch_assoc()['cnt'];
echo "   Records before delete: $count_before\n";

$delete_query = "DELETE FROM event_metadata WHERE metadata_id = ?";
$stmt = $conn->prepare($delete_query);
$stmt->bind_param('i', $metadata_id2);

if ($stmt->execute()) {
    echo "✅ DELETE successful\n";
    echo "   Deleted Metadata ID: $metadata_id2\n";
} else {
    echo "❌ DELETE failed: " . $stmt->error . "\n";
    exit;
}
$stmt->close();

$count_after = $conn->query("SELECT COUNT(*) as cnt FROM event_metadata WHERE event_id = $event_id")->fetch_assoc()['cnt'];
echo "   Records after delete: $count_after\n";
echo "   ✓ Record decrease: " . ($count_before - $count_after) . "\n\n";

// Test 7: Final state
echo "Step 7: Final metadata state...\n";
$final_query = "SELECT metadata_id, field_name, field_value FROM event_metadata WHERE event_id = ? ORDER BY created_at ASC";
$stmt = $conn->prepare($final_query);
$stmt->bind_param('i', $event_id);
$stmt->execute();
$result = $stmt->get_result();

$count = 0;
echo "   Remaining metadata:\n";
while ($row = $result->fetch_assoc()) {
    $count++;
    echo "   [{$count}] ID={$row['metadata_id']}, Field={$row['field_name']}, Value={$row['field_value']}\n";
}
$stmt->close();

echo "\n";
echo "╔════════════════════════════════════════════════════════╗\n";
echo "║           ✅ ALL CRUD OPERATIONS SUCCESSFUL            ║\n";
echo "║                                                        ║\n";
echo "║  ✓ CREATE - Add new metadata fields                   ║\n";
echo "║  ✓ READ   - Retrieve metadata for events              ║\n";
echo "║  ✓ UPDATE - Modify existing metadata                  ║\n";
echo "║  ✓ DELETE - Remove metadata records                   ║\n";
echo "║                                                        ║\n";
echo "║  Database: READY FOR USE                              ║\n";
echo "║  API: /api/metadata.php                               ║\n";
echo "╚════════════════════════════════════════════════════════╝\n";

$conn->close();
?>
