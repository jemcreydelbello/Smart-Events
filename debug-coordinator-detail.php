<?php
require_once 'db_config.php';

// Show all columns in coordinators table
echo "=== COORDINATORS TABLE COLUMNS ===\n";
$result = $conn->query("SHOW COLUMNS FROM coordinators");
$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row['Field'];
    echo $row['Field'] . " (" . $row['Type'] . ")\n";
}
echo "\nColumns array: " . json_encode($columns) . "\n\n";

// Try the detail query
echo "=== TEST DETAIL QUERY ===\n";
$coordinator_id = 1; // Start with coordinator_id = 1

// Try the current query from coordinators.php
$query = "SELECT c.coordinator_id, c.coordinator_name, c.email, c.contact_number, c.department_id, c.created_at, c.updated_at,
                 c.company, c.job_title, c.coordinator_image
          FROM coordinators c 
          WHERE c.coordinator_id = ?";

echo "Query: $query\n\n";

$stmt = $conn->prepare($query);
if (!$stmt) {
    echo "PREPARE FAILED: " . $conn->error . "\n";
} else {
    echo "Prepare successful\n";
    $stmt->bind_param('i', $coordinator_id);
    
    if (!$stmt->execute()) {
        echo "EXECUTE FAILED: " . $stmt->error . "\n";
    } else {
        echo "Execute successful\n";
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        echo "Result returned: " . json_encode($row, JSON_PRETTY_PRINT) . "\n";
    }
    $stmt->close();
}

// Try a simpler query with only existing columns
echo "\n=== TEST SAFE QUERY (ONLY EXISTING COLUMNS) ===\n";
$safe_columns = array_intersect(['coordinator_id', 'coordinator_name', 'email', 'contact_number', 'company', 'job_title', 'coordinator_image'], $columns);
echo "Safe columns: " . json_encode($safe_columns) . "\n";

$safe_query = "SELECT " . implode(', c.', $safe_columns) . " FROM coordinators c WHERE c.coordinator_id = ?";
if (strpos($safe_query, ', c.coordinator_id') === 0) {
    $safe_query = str_replace(', c.coordinator_id', 'c.coordinator_id', $safe_query);
}
$safe_query = "SELECT c." . implode(', c.', $safe_columns) . " FROM coordinators c WHERE c.coordinator_id = ?";

echo "Safe Query: $safe_query\n\n";

$stmt = $conn->prepare($safe_query);
if (!$stmt) {
    echo "PREPARE FAILED: " . $conn->error . "\n";
} else {
    echo "Prepare successful\n";
    $stmt->bind_param('i', $coordinator_id);
    
    if (!$stmt->execute()) {
        echo "EXECUTE FAILED: " . $stmt->error . "\n";
    } else {
        echo "Execute successful\n";
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo "Result returned: " . json_encode($row, JSON_PRETTY_PRINT) . "\n";
        } else {
            echo "No rows found\n";
        }
    }
    $stmt->close();
}

$conn->close();
?>
