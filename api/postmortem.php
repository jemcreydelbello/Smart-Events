<?php
// Postmortem API for event analysis and feedback
header('Content-Type: application/json');

// Set error handling to suppress display but log to JSON response
set_error_handler(function($severity, $message, $file, $line) {
    error_log("Postmortem API Error: $message in $file:$line");
    return true; // Return true to prevent default error handling
});

require_once '../config/db.php';

function getUserInfo() {
    // Get user info from headers (sent by admin.js)
    $user_role = $_SERVER['HTTP_X_USER_ROLE'] ?? '';
    $user_id = $_SERVER['HTTP_X_USER_ID'] ?? '';
    $coordinator_id = $_SERVER['HTTP_X_COORDINATOR_ID'] ?? '';
    
    return [
        'id' => intval($user_id),
        'role' => $user_role,
        'coordinator_id' => intval($coordinator_id)
    ];
}

function checkEventAccess($conn, $event_id, $userInfo) {
    // Allow access for admins
    if (strtolower($userInfo['role']) === 'admin' || $userInfo['role'] === 'Admin' || $userInfo['role'] === 'ADMIN') {
        return true;
    }
    
    $query = "SELECT coordinator_id FROM events WHERE event_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $event = $result->fetch_assoc();
    
    return $event && $event['coordinator_id'] == $userInfo['coordinator_id'];
}

// Create postmortem table if it doesn't exist
$create_postmortem_table = "CREATE TABLE IF NOT EXISTS event_postmortem (
    postmortem_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    initial_attendees INT DEFAULT 0,
    actual_attendees INT DEFAULT 0,
    registered_count INT DEFAULT 0,
    attended_count INT DEFAULT 0,
    attendance_rate DECIMAL(5, 2) DEFAULT 0,
    task_completion_rate DECIMAL(5, 2) DEFAULT 0,
    logistics_completion_rate DECIMAL(5, 2) DEFAULT 0,
    communications_sent INT DEFAULT 0,
    communications_scheduled INT DEFAULT 0,
    communications_draft INT DEFAULT 0,
    movement_stability_score DECIMAL(5, 2) DEFAULT 0,
    budget_tracked DECIMAL(12, 2) DEFAULT 0,
    total_budget DECIMAL(12, 2) DEFAULT 0,
    feedback_summary LONGTEXT,
    lessons_learned LONGTEXT,
    automated_report_generated BOOLEAN DEFAULT FALSE,
    log_report_created BOOLEAN DEFAULT FALSE,
    log_title_introduction LONGTEXT,
    log_issue_summary LONGTEXT,
    log_root_cause_analysis LONGTEXT,
    log_impact_mitigation LONGTEXT,
    log_resolution_recovery LONGTEXT,
    log_corrective_measures LONGTEXT,
    log_feedback_survey LONGTEXT,
    log_lesson_learned LONGTEXT,
    log_review_measurements LONGTEXT,
    generated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    INDEX idx_event (event_id)
)";

$conn->query($create_postmortem_table);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $event_id = intval($_GET['event_id'] ?? 0);
    
    $userInfo = getUserInfo();
    
    if (!$event_id) {
        echo json_encode(['success' => false, 'message' => 'Event ID is required']);
        exit;
    }
    
    if (!checkEventAccess($conn, $event_id, $userInfo)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
    
    if ($action === 'get') {
        // GET action fetches ONLY the Log Report (stored data)
        // Metrics are calculated on-the-fly by 'calculate' action from source tables
        $query = "SELECT 
            p.postmortem_id,
            p.event_id,
            e.event_name,
            p.feedback_summary,
            p.lessons_learned,
            p.log_report_created,
            p.log_title_introduction,
            p.log_issue_summary,
            p.log_root_cause_analysis,
            p.log_impact_mitigation,
            p.log_resolution_recovery,
            p.log_corrective_measures,
            p.log_feedback_survey,
            p.log_lesson_learned,
            p.log_review_measurements,
            p.generated_at,
            p.created_at,
            p.updated_at
            FROM event_postmortem p
            LEFT JOIN events e ON p.event_id = e.event_id
            WHERE p.event_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $postmortem = $result->fetch_assoc();
        
        if ($postmortem) {
            echo json_encode(['success' => true, 'data' => $postmortem]);
        } else {
            // Return empty log report structure
            echo json_encode(['success' => true, 'data' => [
                'event_id' => $event_id,
                'event_name' => null,
                'feedback_summary' => null,
                'lessons_learned' => null,
                'log_report_created' => false,
                'log_title_introduction' => null,
                'log_issue_summary' => null,
                'log_root_cause_analysis' => null,
                'log_impact_mitigation' => null,
                'log_resolution_recovery' => null,
                'log_corrective_measures' => null,
                'log_feedback_survey' => null,
                'log_lesson_learned' => null,
                'log_review_measurements' => null
            ]]);
        }
        exit;
    } else if ($action === 'calculate') {
        // Calculate postmortem metrics REALTIME from source tables
        // DO NOT store metrics - only calculate and return them
        try {
            // Get registrations data from registrations table
            $registration_query = "SELECT 
                COUNT(*) as total_registrations,
                SUM(CASE WHEN status = 'attended' THEN 1 ELSE 0 END) as attended_count,
                SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) as registered_count,
                SUM(CASE WHEN is_walkIn = 1 THEN 1 ELSE 0 END) as walk_in_count
                FROM registrations WHERE event_id = ?";
            $stmt = $conn->prepare($registration_query);
            if (!$stmt) throw new Exception("Registration query prepare failed: " . $conn->error);
            
            $stmt->bind_param('i', $event_id);
            if (!$stmt->execute()) throw new Exception("Registration query execute failed: " . $stmt->error);
            
            $reg_result = $stmt->get_result()->fetch_assoc();
            $total_registrations = intval($reg_result['total_registrations'] ?? 0);
            $attended_count = intval($reg_result['attended_count'] ?? 0);
            $registered_count = intval($reg_result['registered_count'] ?? 0);
            $walk_in_count = intval($reg_result['walk_in_count'] ?? 0);
            
            // For Event Dynamics:
            // - "Initial List" (invited/registered but not yet attended) = registered_count
            // - "Actual Attendees" (those who attended) = attended_count
            // - "No-show" = those registered but didn't attend
            $initial_attendees = $registered_count;
            $actual_attendees = $attended_count;
            $no_show_count = $registered_count;
            
            // Attendance rate = attended / (registered + attended)
            $denominator = $registered_count + $attended_count;
            $attendance_rate = $denominator > 0 ? round(($attended_count / $denominator) * 100, 2) : 0;
            
            // Get task completion data from event_tasks table
            $task_query = "SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as completed_tasks
                FROM event_tasks WHERE event_id = ?";
            $stmt = $conn->prepare($task_query);
            if (!$stmt) throw new Exception("Task query prepare failed: " . $conn->error);
            
            $stmt->bind_param('i', $event_id);
            if (!$stmt->execute()) throw new Exception("Task query execute failed: " . $stmt->error);
            
            $task_result = $stmt->get_result()->fetch_assoc();
            $total_tasks = intval($task_result['total_tasks'] ?? 0);
            $completed_tasks = intval($task_result['completed_tasks'] ?? 0);
            $task_completion_rate = $total_tasks > 0 ? round(($completed_tasks / $total_tasks) * 100, 2) : 0;
            
            // Get logistics completion data
            $logistics_query = "SELECT 
                COUNT(*) as total_logistics,
                SUM(CASE WHEN status = 'Delivered' OR status = 'Received' THEN 1 ELSE 0 END) as completed_logistics
                FROM event_logistics WHERE event_id = ?";
            $stmt = $conn->prepare($logistics_query);
            if (!$stmt) throw new Exception("Logistics query prepare failed: " . $conn->error);
            
            $stmt->bind_param('i', $event_id);
            if (!$stmt->execute()) throw new Exception("Logistics query execute failed: " . $stmt->error);
            
            $logistics_result = $stmt->get_result()->fetch_assoc();
            $total_logistics = intval($logistics_result['total_logistics'] ?? 0);
            $completed_logistics = intval($logistics_result['completed_logistics'] ?? 0);
            $logistics_completion_rate = $total_logistics > 0 ? round(($completed_logistics / $total_logistics) * 100, 2) : 0;
            
            // Get email communication data from email_blasts table
            $email_query = "SELECT 
                SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as emails_sent,
                SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as emails_scheduled,
                SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as emails_draft
                FROM email_blasts WHERE event_id = ?";
            $stmt = $conn->prepare($email_query);
            if (!$stmt) throw new Exception("Email query prepare failed: " . $conn->error);
            
            $stmt->bind_param('i', $event_id);
            if (!$stmt->execute()) throw new Exception("Email query execute failed: " . $stmt->error);
            
            $email_result = $stmt->get_result()->fetch_assoc();
            $emails_sent = intval($email_result['emails_sent'] ?? 0);
            $emails_scheduled = intval($email_result['emails_scheduled'] ?? 0);
            $emails_draft = intval($email_result['emails_draft'] ?? 0);
            
            // Return calculated metrics (NOT stored, just computed)
            echo json_encode([
                'success' => true,
                'message' => 'Postmortem metrics calculated from source tables',
                'data' => [
                    'event_id' => $event_id,
                    'total_registrations' => $total_registrations,
                    'initial_attendees' => $initial_attendees,
                    'actual_attendees' => $actual_attendees,
                    'registered_count' => $registered_count,
                    'attended_count' => $attended_count,
                    'no_show_count' => $no_show_count,
                    'walk_in_count' => $walk_in_count,
                    'attendance_rate' => $attendance_rate,
                    'task_completion_rate' => $task_completion_rate,
                    'completed_tasks' => $completed_tasks,
                    'total_tasks' => $total_tasks,
                    'logistics_completion_rate' => $logistics_completion_rate,
                    'completed_logistics' => $completed_logistics,
                    'total_logistics' => $total_logistics,
                    'communications_sent' => $emails_sent,
                    'communications_scheduled' => $emails_scheduled,
                    'communications_draft' => $emails_draft
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Calculate error: ' . $e->getMessage()
            ]);
        }
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    
    // Handle both JSON and form data
    $input_data = $_POST;
    $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (empty($_POST) && stripos($content_type, 'application/json') !== false) {
        $input_data = json_decode(file_get_contents('php://input'), true) ?? [];
    }
    
    $event_id = intval($input_data['event_id'] ?? $_GET['event_id'] ?? 0);
    
    $userInfo = getUserInfo();
    
    if (!$event_id) {
        echo json_encode(['success' => false, 'message' => 'Event ID is required']);
        exit;
    }
    
    try {
        $access = checkEventAccess($conn, $event_id, $userInfo);
        if (!$access) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            exit;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Access check error: ' . $e->getMessage()]);
        exit;
    }
    
    if ($action === 'save') {
        try {
            $initial_attendees = intval($input_data['initial_attendees'] ?? 0);
            $actual_attendees = intval($input_data['actual_attendees'] ?? 0);
            $registered_count = intval($input_data['registered_count'] ?? 0);
            $attended_count = intval($input_data['attended_count'] ?? 0);
            $attendance_rate = floatval($input_data['attendance_rate'] ?? 0);
            $task_completion_rate = floatval($input_data['task_completion_rate'] ?? 0);
            $logistics_completion_rate = floatval($input_data['logistics_completion_rate'] ?? 0);
            $communications_sent = intval($input_data['communications_sent'] ?? 0);
            $communications_scheduled = intval($input_data['communications_scheduled'] ?? 0);
            $communications_draft = intval($input_data['communications_draft'] ?? 0);
            
            // Check if postmortem record exists
            $check_query = "SELECT postmortem_id FROM event_postmortem WHERE event_id = ?";
            $stmt = $conn->prepare($check_query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $stmt->bind_param('i', $event_id);
            if (!$stmt->execute()) {
                throw new Exception("Execute failed: " . $stmt->error);
            }
            $exists = $stmt->get_result()->num_rows > 0;
            $stmt->close();
            
            if ($exists) {
                // Update
                $update_query = "UPDATE event_postmortem SET 
                    initial_attendees = ?,
                    actual_attendees = ?,
                    registered_count = ?,
                    attended_count = ?,
                    attendance_rate = ?,
                    task_completion_rate = ?,
                    logistics_completion_rate = ?
                    WHERE event_id = ?";
                $stmt = $conn->prepare($update_query);
                if (!$stmt) {
                    throw new Exception("Update prepare failed: " . $conn->error);
                }
                $stmt->bind_param('iiiidddi', 
                    $initial_attendees, $actual_attendees, $registered_count, $attended_count,
                    $attendance_rate, $task_completion_rate, $logistics_completion_rate, $event_id);
                if (!$stmt->execute()) {
                    throw new Exception("Update execute failed: " . $stmt->error);
                }
                $stmt->close();
                echo json_encode(['success' => true, 'message' => 'Postmortem updated successfully']);
            } else {
                // Insert
                $insert_query = "INSERT INTO event_postmortem 
                    (event_id, initial_attendees, actual_attendees, registered_count, attended_count, 
                    attendance_rate, task_completion_rate, logistics_completion_rate)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($insert_query);
                if (!$stmt) {
                    throw new Exception("Insert prepare failed: " . $conn->error);
                }
                $stmt->bind_param('iiiidddd', 
                    $event_id, $initial_attendees, $actual_attendees, $registered_count, $attended_count,
                    $attendance_rate, $task_completion_rate, $logistics_completion_rate);
                if (!$stmt->execute()) {
                    throw new Exception("Insert execute failed: " . $stmt->error);
                }
                $stmt->close();
                echo json_encode(['success' => true, 'message' => 'Postmortem created successfully']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        exit;
    } else if ($action === 'generate_report') {
        $report_type = $input_data['report_type'] ?? 'automated'; // automated or log
        
        // Update the flag to indicate report was generated
        $update_query = "UPDATE event_postmortem SET " . 
            ($report_type === 'log' ? "log_report_created" : "automated_report_generated") . 
            " = TRUE, generated_at = NOW() WHERE event_id = ?";
        $stmt = $conn->prepare($update_query);
        $stmt->bind_param('i', $event_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => ucfirst($report_type) . ' report generated successfully'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to generate report']);
        }
        exit;
    } else if ($action === 'save_log_report') {
        $log_title = $input_data['log_title_introduction'] ?? '';
        $log_issue = $input_data['log_issue_summary'] ?? '';
        $log_root_cause = $input_data['log_root_cause_analysis'] ?? '';
        $log_impact = $input_data['log_impact_mitigation'] ?? '';
        $log_resolution = $input_data['log_resolution_recovery'] ?? '';
        $log_corrective = $input_data['log_corrective_measures'] ?? '';
        $log_feedback = $input_data['log_feedback_survey'] ?? '';
        $log_lesson = $input_data['log_lesson_learned'] ?? '';
        $log_review = $input_data['log_review_measurements'] ?? '';
        
        // Check if postmortem record exists
        $check_query = "SELECT postmortem_id FROM event_postmortem WHERE event_id = ?";
        $stmt = $conn->prepare($check_query);
        $stmt->bind_param('i', $event_id);
        $stmt->execute();
        $exists = $stmt->get_result()->num_rows > 0;
        
        if ($exists) {
            // Update existing record
            $update_query = "UPDATE event_postmortem SET 
                log_title_introduction = ?,
                log_issue_summary = ?,
                log_root_cause_analysis = ?,
                log_impact_mitigation = ?,
                log_resolution_recovery = ?,
                log_corrective_measures = ?,
                log_feedback_survey = ?,
                log_lesson_learned = ?,
                log_review_measurements = ?,
                log_report_created = TRUE,
                generated_at = NOW()
                WHERE event_id = ?";
            
            $stmt = $conn->prepare($update_query);
            
            // Bind: 9 strings (log fields) + 1 integer (event_id) = 10 params total
            $stmt->bind_param('sssssssssi', $log_title, $log_issue, $log_root_cause, $log_impact, $log_resolution, $log_corrective, $log_feedback, $log_lesson, $log_review, $event_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Log report updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update: ' . $stmt->error]);
            }
        } else {
            // Create new record
            $insert_query = "INSERT INTO event_postmortem 
                (event_id, log_title_introduction, log_issue_summary, log_root_cause_analysis, log_impact_mitigation, log_resolution_recovery, log_corrective_measures, log_feedback_survey, log_lesson_learned, log_review_measurements, log_report_created, generated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())";
            
            $stmt = $conn->prepare($insert_query);
            
            // Bind: 1 integer (event_id) + 9 strings (log fields) = 10 params total
            $stmt->bind_param('isssssssss', $event_id, $log_title, $log_issue, $log_root_cause, $log_impact, $log_resolution, $log_corrective, $log_feedback, $log_lesson, $log_review);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Log report created successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create: ' . $stmt->error]);
            }
        }
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
