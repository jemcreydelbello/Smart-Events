<?php
require_once 'db_config.php';

echo "<h2>Creating Test Tasks for Event 1</h2>";

$eventId = 1;

// Sample tasks data
$tasks = [
    ['name' => 'Confirm all registrations', 'due_date' => '2026-03-01', 'status' => 'Done', 'responsible' => 'Admin', 'remarks' => 'Completed'],
    ['name' => 'Prepare venue logistics', 'due_date' => '2026-02-25', 'status' => 'In Progress', 'responsible' => 'Logistics Team', 'remarks' => 'In progress'],
    ['name' => 'Send reminder emails', 'due_date' => '2026-02-20', 'status' => 'Pending', 'responsible' => 'Marketing', 'remarks' => 'Not started yet'],
    ['name' => 'Print badges and materials', 'due_date' => '2026-02-23', 'status' => 'Pending', 'responsible' => 'Operations', 'remarks' => 'Waiting for final count'],
    ['name' => 'Setup AV equipment', 'due_date' => '2026-02-24', 'status' => 'Pending', 'responsible' => 'Technical Team', 'remarks' => 'Pending venue preparation'],
];

$insertQuery = "INSERT INTO event_tasks (event_id, task_name, due_date, party_responsible, status, remarks) 
                VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($insertQuery);

foreach ($tasks as $task) {
    $stmt->bind_param('isssss', $eventId, $task['name'], $task['due_date'], $task['responsible'], $task['status'], $task['remarks']);
    
    if ($stmt->execute()) {
        echo "<p>✓ Created task: {$task['name']} (Status: {$task['status']})</p>";
    } else {
        echo "<p>✗ Failed to create task: {$task['name']} - " . $stmt->error . "</p>";
    }
}

echo "<hr>";
echo "<h3><a href='admin/event-details.html?id=1'>View Event Details (Dashboard)</a></h3>";
?>
