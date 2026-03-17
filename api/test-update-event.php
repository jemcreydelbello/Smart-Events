<?php
// Test endpoint to verify event update is working
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

try {
    // Test: Update an event and see if it works
    $event_id = intval($_GET['event_id'] ?? 0);
    
    if (!$event_id) {
        $event_id = 92; // Default to the event we've been testing
    }
    
    error_log("\\n\\n=== TEST UPDATE EVENT START ===");
    error_log("Testing event_id: $event_id");
    
    // Get current values
    $get_query = "SELECT event_id, event_name, start_event, end_event, registration_start, registration_end FROM events WHERE event_id = ?";
    $get_stmt = $conn->prepare($get_query);
    $get_stmt->bind_param('i', $event_id);
    $get_stmt->execute();
    $get_result = $get_stmt->get_result();
    $old_event = $get_result->fetch_assoc();
    
    error_log("OLD VALUES: name={$old_event['event_name']}, start={$old_event['start_event']}, end={$old_event['end_event']}, reg_start={$old_event['registration_start']}, reg_end={$old_event['registration_end']}");
    
    // Try updating
    $new_name = 'TEST UPDATE ' . date('Y-m-d H:i:s');
    $new_start = '2024-03-17 14:30:00';
    $new_end = '2024-03-17 16:45:00';
    $new_reg_start = '2024-03-10 10:00:00';
    $new_reg_end = '2024-03-16 23:59:59';
    
    $update_query = "UPDATE events SET event_name = ?, start_event = ?, end_event = ?, registration_start = ?, registration_end = ? WHERE event_id = ?";
    $update_stmt = $conn->prepare($update_query);
    $update_stmt->bind_param('sssssi', $new_name, $new_start, $new_end, $new_reg_start, $new_reg_end, $event_id);
    
    error_log("EXECUTING UPDATE with: name='$new_name', start='$new_start', end='$new_end', reg_start='$new_reg_start', reg_end='$new_reg_end'");
    
    if ($update_stmt->execute()) {
        error_log("UPDATE SUCCEEDED");
        
        // Verify
        $verify_stmt = $conn->prepare("SELECT event_id, event_name, start_event, end_event, registration_start, registration_end FROM events WHERE event_id = ?");
        $verify_stmt->bind_param('i', $event_id);
        $verify_stmt->execute();
        $verify_result = $verify_stmt->get_result();
        $new_event = $verify_result->fetch_assoc();
        
        error_log("VERIFICATION: name={$new_event['event_name']}, start={$new_event['start_event']}, end={$new_event['end_event']}, reg_start={$new_event['registration_start']}, reg_end={$new_event['registration_end']}");
        
        if ($new_event['event_name'] === $new_name && $new_event['start_event'] === $new_start) {
            error_log("✅ UPDATE VERIFIED - Data was actually saved to database");
            echo json_encode([
                'success' => true,
                'message' => 'Update verified successfully',
                'old_values' => $old_event,
                'new_values' => $new_event
            ]);
        } else {
            error_log("❌ UPDATE MISMATCH - Data was NOT saved correctly");
            echo json_encode([
                'success' => false,
                'message' => 'Update failed - data mismatch',
                'expected' => ['name' => $new_name, 'start' => $new_start],
                'actual' => ['name' => $new_event['event_name'], 'start' => $new_event['start_event']]
            ]);
        }
    } else {
        error_log("UPDATE FAILED: " . $update_stmt->error);
        echo json_encode([
            'success' => false,
            'message' => 'Update failed: ' . $update_stmt->error
        ]);
    }
    
    error_log("=== TEST UPDATE EVENT END ===\\n");
    
} catch (Exception $e) {
    error_log("ERROR: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
