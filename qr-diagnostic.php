<?php
require 'db_config.php';

echo "=== QR Registration Code Diagnostic ===\n\n";

// Check if registrations table exists
$result = $conn->query("SHOW TABLES LIKE 'registrations'");
if ($result->num_rows === 0) {
    echo "❌ No registrations table found\n";
    exit;
}

echo "✓ Registrations table exists\n\n";

// Get all registration codes
echo "=== All Registration Codes in Database ===\n";
$query = "SELECT r.registration_id, r.registration_code, r.status, u.full_name, e.event_name
          FROM registrations r
          LEFT JOIN users u ON r.user_id = u.user_id
          LEFT JOIN events e ON r.event_id = e.event_id
          ORDER BY r.registration_id DESC
          LIMIT 20";

$result = $conn->query($query);

if ($result && $result->num_rows > 0) {
    echo "ID\t| Code\t\t\t| Status\t| Participant\t\t\t| Event\n";
    echo str_repeat("-", 120) . "\n";
    
    while ($row = $result->fetch_assoc()) {
        printf("%-5s| %-30s| %-10s| %-30s| %s\n",
            $row['registration_id'],
            $row['registration_code'],
            $row['status'],
            substr($row['full_name'] ?? 'N/A', 0, 28),
            substr($row['event_name'] ?? 'N/A', 0, 20)
        );
    }
    echo "\nTotal registrations: " . $result->num_rows . "\n";
} else {
    echo "❌ No registrations found\n";
}

// Check registration code format/patterns
echo "\n=== Registration Code Patterns ===\n";
$pattern_query = "SELECT 
                    COUNT(*) as count,
                    CASE 
                        WHEN registration_code LIKE 'REG-%' THEN 'REG-xxxxx'
                        WHEN registration_code LIKE 'REG %' THEN 'REG xxxxx'
                        WHEN registration_code LIKE '%REG%' THEN 'Contains REG'
                        ELSE 'Other format'
                    END as pattern
                  FROM registrations
                  GROUP BY pattern";

$pattern_result = $conn->query($pattern_query);
if ($pattern_result) {
    while ($row = $pattern_result->fetch_assoc()) {
        echo "  " . $row['pattern'] . ": " . $row['count'] . " codes\n";
    }
}

// Check if the specific code exists
echo "\n=== Search for Specific Code ===\n";
$search_code = 'REG-84FA1FFB19CF';
echo "Searching for: " . $search_code . "\n";

$search_query = "SELECT *
                 FROM registrations
                 WHERE registration_code = ?
                 OR UPPER(registration_code) = UPPER(?)
                 OR registration_code LIKE ?
                 LIMIT 5";

$stmt = $conn->prepare($search_query);
$search_like = '%' . $search_code . '%';
$stmt->bind_param('sss', $search_code, $search_code, $search_like);
$stmt->execute();
$search_result = $stmt->get_result();

if ($search_result->num_rows > 0) {
    echo "✓ Found " . $search_result->num_rows . " matching code(s):\n";
    while ($row = $search_result->fetch_assoc()) {
        echo "  - " . $row['registration_code'] . " (ID: " . $row['registration_id'] . ", Status: " . $row['status'] . ")\n";
    }
} else {
    echo "❌ Code not found in database\n";
    echo "\nThis means either:\n";
    echo "  1. The QR code data is incorrect\n";
    echo "  2. The registration was never created\n";
    echo "  3. The registration code format doesn't match\n";
}

echo "\n=== Database Stats ===\n";
$stats_query = "SELECT 
                  COUNT(*) as total_regs,
                  SUM(CASE WHEN status = 'REGISTERED' THEN 1 ELSE 0 END) as registered,
                  SUM(CASE WHEN status = 'ATTENDED' THEN 1 ELSE 0 END) as attended,
                  SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
                FROM registrations";

$stats_result = $conn->query($stats_query);
if ($stats_result) {
    $stats = $stats_result->fetch_assoc();
    echo "Total Registrations: " . $stats['total_regs'] . "\n";
    echo "  - Registered: " . ($stats['registered'] ?? 0) . "\n";
    echo "  - Attended: " . ($stats['attended'] ?? 0) . "\n";
    echo "  - Cancelled: " . ($stats['cancelled'] ?? 0) . "\n";
}

?>
