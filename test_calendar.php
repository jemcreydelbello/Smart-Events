<?php
// Test script to add sample tasks for calendar testing
include 'db_config.php';

// Sample tasks for testing
$tasks = [
    [
        'event_id' => 1,
        'task_name' => 'Setup Event Decorations',
        'due_date' => '2026-02-15',
        'party_responsible' => 'John Doe',
        'status' => 'Pending',
        'remarks' => 'Test task 1'
    ],
    [
        'event_id' => 1,
        'task_name' => 'Confirm Guest List',
        'due_date' => '2026-02-10',
        'party_responsible' => 'Jane Smith',
        'status' => 'In Progress',
        'remarks' => 'Test task 2'
    ],
    [
        'event_id' => 1,
        'task_name' => 'Arrange Catering',
        'due_date' => '2026-02-20',
        'party_responsible' => 'Mike Johnson',
        'status' => 'Pending',
        'remarks' => 'Test task 3'
    ],
    [
        'event_id' => 1,
        'task_name' => 'Test Audio/Visual Equipment',
        'due_date' => '2026-02-22',
        'party_responsible' => 'Tech Team',
        'status' => 'Done',
        'remarks' => 'Test task 4'
    ]
];

try {
    foreach ($tasks as $task) {
        $sql = "INSERT INTO event_tasks (event_id, task_name, due_date, party_responsible, status, remarks) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('isssss', 
            $task['event_id'], 
            $task['task_name'], 
            $task['due_date'], 
            $task['party_responsible'], 
            $task['status'], 
            $task['remarks']
        );
        $stmt->execute();
    }
    echo json_encode(['success' => true, 'message' => 'Test tasks added successfully']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
