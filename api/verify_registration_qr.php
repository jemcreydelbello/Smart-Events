<?php
header('Content-Type: application/json');

require_once '../config/db.php';

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['registration_code'])) {
        throw new Exception("Registration code is required");
    }
    
    $registration_code = trim($input['registration_code']);
    
    // Query to get registration details with user and event info
    $query = "
        SELECT 
            r.registration_id,
            r.registration_code,
            r.status,
            r.registered_at,
            u.user_id,
            u.full_name,
            u.email,
            u.job_title,
            u.company,
            u.contact_number,
            e.event_id,
            e.event_name,
            DATE(e.start_event) as event_date,
            TIME(e.start_event) as start_time,
            TIME(e.end_event) as end_time,
            e.location
        FROM registrations r
        INNER JOIN users u ON r.user_id = u.user_id
        INNER JOIN events e ON r.event_id = e.event_id
        WHERE r.registration_code = '$registration_code'
    ";
    
    $result = $conn->query($query);
    
    if ($result->num_rows === 0) {
        throw new Exception("Invalid registration code");
    }
    
    $registration = $result->fetch_assoc();
    
    // Check if already scanned/marked attendance
    $attestationCheck = $conn->query("
        SELECT attendance_id FROM attendance 
        WHERE registration_id = {$registration['registration_id']}
    ");
    
    $already_attended = $attestationCheck->num_rows > 0;
    
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'is_valid' => true,
        'already_attended' => $already_attended,
        'user' => [
            'user_id' => $registration['user_id'],
            'full_name' => $registration['full_name'],
            'email' => $registration['email'],
            'job_title' => $registration['job_title'],
            'company' => $registration['company'],
            'contact_number' => $registration['contact_number']
        ],
        'event' => [
            'event_id' => $registration['event_id'],
            'event_name' => $registration['event_name'],
            'event_date' => $registration['event_date'],
            'start_time' => $registration['start_time'],
            'end_time' => $registration['end_time'],
            'location' => $registration['location']
        ],
        'registration' => [
            'registration_code' => $registration['registration_code'],
            'status' => $registration['status'],
            'registered_at' => $registration['registered_at']
        ],
        'message' => 'Registration verified successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'is_valid' => false,
        'message' => $e->getMessage()
    ]);
}
?>
