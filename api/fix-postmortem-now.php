<?php
header('Content-Type: application/json');
require_once '../config/db.php';

$event_id = 46;

try {
    // Step 1: Delete old postmortem
    $delete = $conn->prepare("DELETE FROM event_postmortem WHERE event_id = ?");
    $delete->bind_param('i', $event_id);
    $delete->execute();
    echo json_encode(['step' => 'Deleted old postmortem']) . "\n";
    
    // Step 2: Get registrations count using UPPERCASE status (matches dashboard)
    $reg_stmt = $conn->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'ATTENDED' THEN 1 ELSE 0 END) as attended FROM registrations WHERE event_id = ?");
    $reg_stmt->bind_param('i', $event_id);
    $reg_stmt->execute();
    $reg_result = $reg_stmt->get_result()->fetch_assoc();
    
    $initial = (int)$reg_result['total'];
    $actual = (int)$reg_result['attended'];
    $rate = $initial > 0 ? ($actual / $initial) * 100 : 0;
    
    echo json_encode(['step' => 'Got registration data', 'initial' => $initial, 'actual' => $actual, 'rate' => $rate]) . "\n";
    
    // Step 3: Get task completion (check if table exists first)
    $task_total = 0;
    $task_done = 0;
    $task_rate = 0;
    
    $check_table = $conn->query("SHOW TABLES LIKE 'tasks'");
    if ($check_table && $check_table->num_rows > 0) {
        $task_stmt = $conn->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM tasks WHERE event_id = ?");
        $task_stmt->bind_param('i', $event_id);
        $task_stmt->execute();
        $task_result = $task_stmt->get_result()->fetch_assoc();
        
        $task_total = (int)($task_result['total'] ?? 0);
        $task_done = (int)($task_result['completed'] ?? 0);
        $task_rate = $task_total > 0 ? ($task_done / $task_total) * 100 : 0;
    }
    
    echo json_encode(['step' => 'Got task data', 'total_tasks' => $task_total, 'completed' => $task_done, 'rate' => $task_rate]) . "\n";
    
    // Step 4: Insert new postmortem
    $insert = $conn->prepare("INSERT INTO event_postmortem (event_id, initial_attendees, actual_attendees, registered_count, attended_count, attendance_rate, task_completion_rate) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $insert->bind_param('iiiiidd', $event_id, $initial, $actual, $initial, $actual, $rate, $task_rate);
    $insert->execute();
    
    echo json_encode(['step' => 'Inserted new postmortem']) . "\n";
    
    // Step 5: Verify
    $verify = $conn->prepare("SELECT initial_attendees, actual_attendees, registered_count, attended_count, attendance_rate, task_completion_rate FROM event_postmortem WHERE event_id = ?");
    $verify->bind_param('i', $event_id);
    $verify->execute();
    $result = $verify->get_result()->fetch_assoc();
    
    echo json_encode(['step' => 'SUCCESS', 'postmortem' => $result]) . "\n";
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
