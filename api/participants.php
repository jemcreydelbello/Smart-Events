<?php
// Error handling - ensure all output is JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

require_once '../db_config.php';
require_once '../config/email_config.php';
require_once '../includes/SimpleMailer.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'list') {
        $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;
        $status = isset($_GET['status']) ? $_GET['status'] : null;
        $event_type = isset($_GET['event_type']) ? $_GET['event_type'] : null; // 'public' or 'private'
        $department_id = isset($_GET['department_id']) ? intval($_GET['department_id']) : null; // department filter
        
        // If filtering by event_id, we want only registered participants
        if ($event_id) {
            $query = "SELECT DISTINCT u.user_id, u.full_name, u.email, u.department_id, d.department_name,
                      e.event_id, e.event_name, e.is_private, r.registration_id, r.registration_code, r.status, r.registered_at
                      FROM registrations r
                      JOIN users u ON r.user_id = u.user_id
                      JOIN events e ON r.event_id = e.event_id
                      LEFT JOIN departments d ON u.department_id = d.department_id
                      WHERE e.event_id = ?";
            
            $params = [$event_id];
            $param_types = 'i';
            
            if ($status) {
                $query .= " AND r.status = ?";
                $params[] = $status;
                $param_types .= 's';
            }
        } else {
            // Standard participant list
            $query = "SELECT u.user_id, u.full_name, u.email, u.department_id, d.department_name,
                      e.event_id, e.event_name, e.is_private, r.registration_id, r.registration_code, r.status, r.registered_at
                      FROM users u
                      LEFT JOIN departments d ON u.department_id = d.department_id
                      LEFT JOIN registrations r ON u.user_id = r.user_id
                      LEFT JOIN events e ON r.event_id = e.event_id
                      WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT')";
            
            $params = [];
            $param_types = '';
            
            if ($status) {
                $query .= " AND r.status = ?";
                $params[] = $status;
                $param_types .= 's';
            }
            
            if ($event_type === 'public') {
                $query .= " AND e.is_private = 0";
            } elseif ($event_type === 'private') {
                $query .= " AND e.is_private = 1";
            }
            
            if ($department_id) {
                $query .= " AND u.department_id = ?";
                $params[] = $department_id;
                $param_types .= 'i';
            }
        }
        
        $query .= " ORDER BY u.full_name ASC";
        
        if (!empty($params)) {
            $stmt = $conn->prepare($query);
            $stmt->bind_param($param_types, ...$params);
            $result = $stmt->execute() ? $stmt->get_result() : null;
        } else {
            $result = $conn->query($query);
        }
        
        $participants = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $participants[] = $row;
            }
        }
        
        echo json_encode(['success' => true, 'data' => $participants]);
    }
    elseif ($action === 'search') {
        $search = '%' . ($_GET['q'] ?? '') . '%';
        $event_type = isset($_GET['event_type']) ? $_GET['event_type'] : null; // 'public' or 'private'
        $department_id = isset($_GET['department_id']) ? intval($_GET['department_id']) : null; // department filter
        
        $query = "SELECT u.user_id, u.full_name, u.email, u.department_id, d.department_name,
                  e.event_id, e.event_name, e.is_private, r.registration_id, r.registration_code, r.status, r.registered_at
                  FROM users u
                  LEFT JOIN departments d ON u.department_id = d.department_id
                  LEFT JOIN registrations r ON u.user_id = r.user_id
                  LEFT JOIN events e ON r.event_id = e.event_id
                  WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT')
                  AND (u.full_name LIKE ? OR u.email LIKE ?)";
        
        $params = [$search, $search];
        $param_types = 'ss';
        
        if ($event_type === 'public') {
            $query .= " AND e.is_private = 0";
        } elseif ($event_type === 'private') {
            $query .= " AND e.is_private = 1";
        }
        
        if ($department_id) {
            $query .= " AND u.department_id = ?";
            $params[] = $department_id;
            $param_types .= 'i';
        }
        
        $query .= " ORDER BY u.full_name ASC LIMIT 20";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param($param_types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $participants = [];
        while ($row = $result->fetch_assoc()) {
            $participants[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $participants]);
    }
    elseif ($action === 'get_departments') {
        // Get list of all departments
        $query = "SELECT department_id, department_name FROM departments ORDER BY department_name ASC";
        $result = $conn->query($query);
        
        $departments = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $departments[] = $row;
            }
        }
        
        echo json_encode(['success' => true, 'data' => $departments]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Handle requests
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        error_log('═══════════════════════════════════════');
        error_log('API Request received');
        error_log('Raw input: ' . $input);
        error_log('Parsed data: ' . json_encode($data));
        error_log('═══════════════════════════════════════');
        
        if (!$data) {
            throw new Exception('Invalid JSON received: ' . json_last_error_msg());
        }
        
        $action = $data['action'] ?? null;
        
        // Handle QR Code registration lookup
        if ($action === 'get_registration') {
            $registration_code = trim($data['registration_code'] ?? '');
            
            error_log('Looking up registration with code: ' . $registration_code);
            
            if (!$registration_code) {
                error_log('ERROR: No registration code provided');
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Registration code is required']);
                exit;
            }
            
            // Get registration details by code (case-insensitive)
            $query = "SELECT u.user_id, u.full_name, u.email,
                      e.event_id, e.event_name, 
                      r.registration_id, r.registration_code, r.status, r.registered_at
                      FROM registrations r
                      LEFT JOIN users u ON r.user_id = u.user_id
                      LEFT JOIN events e ON r.event_id = e.event_id
                      WHERE UPPER(r.registration_code) = UPPER(?) LIMIT 1";
            
            error_log('Query: ' . $query);
            error_log('Param: ' . $registration_code);
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                error_log('Prepare failed: ' . $conn->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('s', $registration_code);
            if (!$stmt->execute()) {
                error_log('Execute failed: ' . $stmt->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Query failed: ' . $stmt->error]);
                exit;
            }
            
            $result = $stmt->get_result();
            error_log('Query returned: ' . $result->num_rows . ' rows');
            
            if ($result->num_rows === 0) {
                error_log('ERROR: No registration found for code: ' . $registration_code);
                // List all registration codes for debugging
                $debug_query = "SELECT registration_code FROM registrations LIMIT 5";
                $debug_result = $conn->query($debug_query);
                if ($debug_result) {
                    error_log('Sample codes in database:');
                    while ($debug_row = $debug_result->fetch_assoc()) {
                        error_log('  - ' . $debug_row['registration_code']);
                    }
                }
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Registration code not found: ' . $registration_code]);
                exit;
            }
            
            $registration = $result->fetch_assoc();
            error_log('SUCCESS: Found registration: ' . json_encode($registration));
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $registration
            ]);
            exit;
        }
        
        // Handle new registration from client-side
        $event_id = intval($data['event_id'] ?? 0);
        $participant_name = trim($data['participant_name'] ?? '');
        $participant_email = trim($data['participant_email'] ?? '');
        $participant_department = trim($data['participant_department'] ?? '');
        $participant_phone = trim($data['participant_phone'] ?? '');
        $status = $data['status'] ?? 'REGISTERED';
        
        // Validate required fields
        if (!$event_id || !$participant_name || !$participant_email) {
            throw new Exception('Event ID, name, and email are required');
        }
        
        // Validate email format
        if (!filter_var($participant_email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email address');
        }
        
        // Check if event exists
        $event_check = "SELECT event_id FROM events WHERE event_id = ?";
        $stmt = $conn->prepare($event_check);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $conn->error);
        }
        
        $stmt->bind_param('i', $event_id);
        if (!$stmt->execute()) {
            throw new Exception('Event check failed: ' . $stmt->error);
        }
        
        if ($stmt->get_result()->num_rows === 0) {
            throw new Exception('Event not found');
        }
        
        // Check if user already exists with this email
        $user_check = "SELECT user_id FROM users WHERE email = ? AND role_id = (SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT')";
        $stmt = $conn->prepare($user_check);
        if (!$stmt) {
            throw new Exception('Prepare user check failed: ' . $conn->error);
        }
        
        $stmt->bind_param('s', $participant_email);
        if (!$stmt->execute()) {
            throw new Exception('User check failed: ' . $stmt->error);
        }
        
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user_row = $result->fetch_assoc();
            $user_id = $user_row['user_id'];
        } else {
            // Create new participant/user
            $role_query = "SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT'";
            $role_result = $conn->query($role_query);
            
            if (!$role_result) {
                throw new Exception('Role query failed: ' . $conn->error);
            }
            
            $role_row = $role_result->fetch_assoc();
            $role_id = $role_row['role_id'] ?? 3; // Default to role_id 3 if not found
            
            // Generate a random password for new participants
            $temp_password = bin2hex(random_bytes(8));
            $hashed_password = hash('sha256', $temp_password);
            
            // Get department_id if provided
            $department_id = null;
            if ($participant_department) {
                $dept_query = "SELECT department_id FROM departments WHERE LOWER(department_name) = LOWER(?)";
                $dept_stmt = $conn->prepare($dept_query);
                if ($dept_stmt) {
                    $dept_stmt->bind_param('s', $participant_department);
                    if ($dept_stmt->execute()) {
                        $dept_result = $dept_stmt->get_result();
                        if ($dept_result->num_rows > 0) {
                            $dept_row = $dept_result->fetch_assoc();
                            $department_id = $dept_row['department_id'];
                        }
                    }
                }
            }
            
            $insert_user = "INSERT INTO users (full_name, email, password_hash, role_id, department_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())";
            $stmt = $conn->prepare($insert_user);
            if (!$stmt) {
                throw new Exception('Prepare user insert failed: ' . $conn->error);
            }
            
            $stmt->bind_param('sssii', $participant_name, $participant_email, $hashed_password, $role_id, $department_id);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to create participant account: ' . $stmt->error);
            }
            
            $user_id = $conn->insert_id;
        }
        
        // Check if already registered for this event
        $reg_check = "SELECT registration_id, registration_code FROM registrations WHERE user_id = ? AND event_id = ?";
        $stmt = $conn->prepare($reg_check);
        if (!$stmt) {
            throw new Exception('Prepare registration check failed: ' . $conn->error);
        }
        
        $stmt->bind_param('ii', $user_id, $event_id);
        if (!$stmt->execute()) {
            throw new Exception('Registration check failed: ' . $stmt->error);
        }
        
        $existing_reg = $stmt->get_result()->fetch_assoc();
        if ($existing_reg) {
            // Already registered - return success with existing code
            error_log('ℹ User already registered for this event - returning existing registration.');
            
            echo json_encode([
                'success' => true, 
                'message' => 'You are already registered for this event!',
                'registration_id' => $existing_reg['registration_id'],
                'registration_code' => $existing_reg['registration_code'],
                'already_registered' => true
            ]);
            exit;
        }
        
        // Create registration record with stronger code generation
        // Generate a more robust registration code: REG-[8 random hex chars]
        $random_suffix = bin2hex(random_bytes(6)); // Generates 12 hex characters
        $registration_code = 'REG-' . strtoupper($random_suffix);
        
        error_log('Generated registration code: ' . $registration_code);
        
        $insert_registration = "INSERT INTO registrations (user_id, event_id, registration_code, status, registered_at) 
                               VALUES (?, ?, ?, ?, NOW())";
        $stmt = $conn->prepare($insert_registration);
        if (!$stmt) {
            throw new Exception('Prepare registration insert failed: ' . $conn->error);
        }
        
        $stmt->bind_param('iiss', $user_id, $event_id, $registration_code, $status);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to create registration: ' . $stmt->error);
        }
        
        error_log('Registration saved successfully with code: ' . $registration_code);
        
        // Fetch event details for email
        $event_query = "SELECT event_name, event_date, start_time, end_time, location, is_private 
                       FROM events WHERE event_id = ?";
        $event_stmt = $conn->prepare($event_query);
        $event_stmt->bind_param('i', $event_id);
        $event_stmt->execute();
        $event_result = $event_stmt->get_result();
        $event_data = $event_result->fetch_assoc();
        
        // Prepare event date/time for email
        $event_date_str = '';
        if ($event_data['event_date']) {
            $date = new DateTime($event_data['event_date']);
            $event_date_str = $date->format('F j, Y');
            
            if ($event_data['start_time']) {
                $event_date_str .= ' at ' . date('g:i A', strtotime($event_data['start_time']));
            }
        }
        
        // Send registration confirmation email with QR code
        try {
            $mailer = new SimpleMailer(
                SMTP_HOST,
                SMTP_PORT,
                SMTP_USER,
                SMTP_PASSWORD,
                EMAIL_FROM,
                EMAIL_FROM_NAME
            );
            
            $email_sent = $mailer->sendRegistrationConfirmation(
                $participant_email,
                $participant_name,
                $event_data['event_name'] ?? 'Event',
                $registration_code,
                $event_date_str,
                $event_data['location'] ?? '',
                $event_data['is_private'] == 1
            );
            
            if ($email_sent) {
                error_log('✓ Registration confirmation email sent to: ' . $participant_email);
            } else {
                error_log('⚠ Email sending returned false for: ' . $participant_email);
                error_log('✓ But registration still successful - check email configuration');
            }
        } catch (Exception $email_error) {
            error_log('⚠ Email sending error: ' . $email_error->getMessage());
            error_log('✓ But registration still successful - check email configuration');
        }
        
        echo json_encode([
            'success' => true, 
            'message' => 'Registration successful! Check your email for confirmation.',
            'registration_id' => $conn->insert_id,
            'registration_code' => $registration_code
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        // Update registration status
        $input = file_get_contents('php://input');
        
        error_log('═══════════════════════════════════════');
        error_log('PUT Request received - Updating attendance');
        error_log('Raw input: ' . $input);
        error_log('═══════════════════════════════════════');
        
        $data = json_decode($input, true);
        
        error_log('Parsed data: ' . json_encode($data));
        error_log('JSON error: ' . json_last_error_msg());
        
        if (!$data) {
            error_log('ERROR: Invalid JSON received');
            throw new Exception('Invalid JSON received: ' . json_last_error_msg());
        }
        
        $registration_code = trim($data['registration_code'] ?? '');
        $status = trim($data['status'] ?? 'ATTENDED');
        
        error_log('Registration code: ' . $registration_code);
        error_log('New status: ' . $status);
        
        if (!$registration_code) {
            error_log('ERROR: No registration code provided');
            throw new Exception('Registration code is required');
        }
        
        // Find registration by code and update status (case-insensitive)
        $query = "UPDATE registrations SET status = ? WHERE UPPER(registration_code) = UPPER(?)";
        error_log('Query: ' . $query);
        error_log('Params: status=' . $status . ', registration_code=' . $registration_code);
        
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            error_log('Prepare failed: ' . $conn->error);
            throw new Exception('Prepare statement failed: ' . $conn->error);
        }
        
        $stmt->bind_param('ss', $status, $registration_code);
        
        if (!$stmt->execute()) {
            error_log('Execute failed: ' . $stmt->error);
            throw new Exception('Failed to update registration: ' . $stmt->error);
        }
        
        error_log('Rows affected: ' . $stmt->affected_rows);
        
        if ($stmt->affected_rows === 0) {
            error_log('ERROR: No registration found for code: ' . $registration_code);
            throw new Exception('Registration code not found: ' . $registration_code);
        }
        
        // Get updated registration details (case-insensitive)
        $query = "SELECT u.full_name, u.email, e.event_name, r.registration_code, r.status
                  FROM registrations r
                  LEFT JOIN users u ON r.user_id = u.user_id
                  LEFT JOIN events e ON r.event_id = e.event_id
                  WHERE UPPER(r.registration_code) = UPPER(?)";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('s', $registration_code);
        $stmt->execute();
        $result = $stmt->get_result();
        $registration = $result->fetch_assoc();
        
        error_log('SUCCESS: Updated registration: ' . json_encode($registration));
        error_log('═══════════════════════════════════════');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Registration status updated to ' . $status,
            'data' => $registration
        ]);
        
    } catch (Exception $e) {
        error_log('EXCEPTION: ' . $e->getMessage());
        error_log('═══════════════════════════════════════');
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>

