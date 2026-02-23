<?php
require_once 'db_config.php';

// Test fetching attendees for event_id = 1
$event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : 1;

$query = "SELECT DISTINCT u.user_id, u.full_name, u.email, u.department_id, d.department_name,
          e.event_id, e.event_name, e.is_private, r.registration_id, r.registration_code, r.status, r.registered_at,
          '' as company, '' as job_title, '' as phone
          FROM registrations r
          JOIN users u ON r.user_id = u.user_id
          JOIN events e ON r.event_id = e.event_id
          LEFT JOIN departments d ON u.department_id = d.department_id
          WHERE e.event_id = ?
          ORDER BY u.full_name ASC";

$stmt = $conn->prepare($query);
$stmt->bind_param('i', $event_id);
$result = $stmt->execute() ? $stmt->get_result() : null;

$participants = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $participants[] = $row;
    }
}

echo "<h2>Test: Attendees for Event ID = " . htmlspecialchars($event_id) . "</h2>";
echo "<p>Total participants found: " . count($participants) . "</p>";
echo "<pre>" . json_encode($participants, JSON_PRETTY_PRINT) . "</pre>";

// Also show available events
echo "<h2>Available Events:</h2>";
$eventsQuery = "SELECT event_id, event_name FROM events LIMIT 10";
$eventsResult = $conn->query($eventsQuery);
echo "<ul>";
if ($eventsResult) {
    while ($row = $eventsResult->fetch_assoc()) {
        echo "<li><a href='test_attendees.php?event_id=" . $row['event_id'] . "'>" . htmlspecialchars($row['event_name']) . " (ID: " . $row['event_id'] . ")</a></li>";
    }
}
echo "</ul>";
?>
