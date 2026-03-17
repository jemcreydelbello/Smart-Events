<?php
// Error handling - ensure all output is JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

require_once '../config/db.php';
require_once '../config/email_config.php';
require_once '../includes/SMTPMailer.php';

// Helper function to check if coordinator has access to an event
function coordinatorHasAccessToEvent($conn, $event_id, $coordinator_id) {
    // Check if assigned directly via coordinator_id column
    $query = "SELECT event_id FROM events WHERE event_id = ? AND coordinator_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $event_id, $coordinator_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        return true;
    }
    
    // Check if event_coordinators junction table exists
    $junctionTableExists = $conn->query("SHOW TABLES LIKE 'event_coordinators'");
    if ($junctionTableExists && $junctionTableExists->num_rows > 0) {
        // Check if assigned via junction table
        $junctionQuery = "SELECT event_id FROM event_coordinators WHERE event_id = ? AND coordinator_id = ?";
        $junctionStmt = $conn->prepare($junctionQuery);
        $junctionStmt->bind_param('ii', $event_id, $coordinator_id);
        $junctionStmt->execute();
        $junctionResult = $junctionStmt->get_result();
        $hasAccess = $junctionResult->num_rows > 0;
        $junctionStmt->close();
        return $hasAccess;
    }
    
    return false;
}

// Helper function to get user role and info from request headers
function getUserInfo() {
    $userInfo = [
        'role' => 'GUEST',
        'user_id' => null,
        'coordinator_id' => null
    ];
    
    if (isset($_SERVER['HTTP_X_USER_ROLE'])) {
        $userInfo['role'] = $_SERVER['HTTP_X_USER_ROLE'];
    }
    if (isset($_SERVER['HTTP_X_USER_ID'])) {
        $userInfo['user_id'] = intval($_SERVER['HTTP_X_USER_ID']);
    }
    if (isset($_SERVER['HTTP_X_COORDINATOR_ID'])) {
        $userInfo['coordinator_id'] = intval($_SERVER['HTTP_X_COORDINATOR_ID']);
    }
    
    return $userInfo;
}

// Helper function to check event access based on role
function checkEventAccess($conn, $event_id, $userInfo) {
    // Admins have access to all events
    if ($userInfo['role'] === 'ADMIN' || $userInfo['role'] === 'admin') {
        return true;
    }
    
    // Coordinators can only access their assigned events
    if ($userInfo['role'] === 'COORDINATOR' || $userInfo['role'] === 'coordinator') {
        return coordinatorHasAccessToEvent($conn, $event_id, $userInfo['coordinator_id']);
    }
    
    // For local development/testing: allow localhost access
    if (isset($_SERVER['REMOTE_ADDR']) && $_SERVER['REMOTE_ADDR'] === '127.0.0.1') {
        return true;
    }
    if (isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false)) {
        return true;
    }
    
    return false;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list'; // Default to 'list' if not specified
    
    if ($action === 'list') {
        $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : null;
        $status = isset($_GET['status']) ? $_GET['status'] : null;
        $event_type = isset($_GET['event_type']) ? $_GET['event_type'] : null; // 'public' or 'private'
        $department_id = isset($_GET['department_id']) ? intval($_GET['department_id']) : null; // department filter
        $userInfo = getUserInfo();
        
        // If filtering by event_id, check access
        if ($event_id) {
            // Check if user has access to this event
            if (!checkEventAccess($conn, $event_id, $userInfo)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied']);
                exit;
            }
            
            $query = "SELECT DISTINCT u.user_id, CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) as full_name, u.first_name, u.middle_name, u.last_name, u.email, u.department_id, d.department_name,
                      IFNULL(u.company, '') as company, 
                      IFNULL(u.job_title, '') as job_title, 
                      IFNULL(u.contact_number, '') as phone,
                      '' as employee_code,
                      e.event_id, e.event_name, e.is_private, r.registration_id, r.registration_code, r.status, r.is_walkIn, r.registered_at
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
            // Standard participant list - filter by coordinator if user is a coordinator
            $query = "SELECT u.user_id, CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as full_name, u.email, u.department_id, d.department_name,
                      IFNULL(u.company, '') as company, 
                      IFNULL(u.job_title, '') as job_title, 
                      IFNULL(u.contact_number, '') as phone,
                      '' as employee_code,
                      e.event_id, e.event_name, e.is_private, r.registration_id, r.registration_code, r.status, r.is_walkIn, r.registered_at
                      FROM users u
                      LEFT JOIN departments d ON u.department_id = d.department_id
                      LEFT JOIN registrations r ON u.user_id = r.user_id
                      LEFT JOIN events e ON r.event_id = e.event_id
                      WHERE 1=1";
            
            $params = [];
            $param_types = '';
            
            // Filter by coordinator's events if user is a coordinator
            if (($userInfo['role'] === 'COORDINATOR' || $userInfo['role'] === 'coordinator') && $userInfo['coordinator_id']) {
                $query .= " AND e.coordinator_id = ?";
                $params[] = $userInfo['coordinator_id'];
                $param_types .= 'i';
            }
            
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
        
        $query .= " ORDER BY CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) ASC";
        
        $participants = [];
        $error = null;
        
        try {
            if (!empty($params)) {
                $stmt = $conn->prepare($query);
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $conn->error);
                }
                
                if (!$stmt->bind_param($param_types, ...$params)) {
                    throw new Exception("Bind param failed: " . $stmt->error);
                }
                
                if (!$stmt->execute()) {
                    throw new Exception("Execute failed: " . $stmt->error);
                }
                
                $result = $stmt->get_result();
                if (!$result) {
                    throw new Exception("Get result failed: " . $stmt->error);
                }
            } else {
                $result = $conn->query($query);
                if (!$result) {
                    throw new Exception("Query failed: " . $conn->error);
                }
            }
            
            while ($row = $result->fetch_assoc()) {
                $participants[] = $row;
            }
        } catch (Exception $e) {
            error_log("Participants API error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error fetching participants: ' . $e->getMessage()]);
            exit;
        }
        
        echo json_encode(['success' => true, 'data' => $participants]);
    }
    elseif ($action === 'search') {
        $search = '%' . ($_GET['q'] ?? '') . '%';
        $event_type = isset($_GET['event_type']) ? $_GET['event_type'] : null; // 'public' or 'private'
        $department_id = isset($_GET['department_id']) ? intval($_GET['department_id']) : null; // department filter
        
        $query = "SELECT u.user_id, CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) as full_name, u.email, u.department_id, d.department_name,
                  e.event_id, e.event_name, e.is_private, r.registration_id, r.registration_code, r.status, r.is_walkIn, r.registered_at
                  FROM users u
                  LEFT JOIN departments d ON u.department_id = d.department_id
                  LEFT JOIN registrations r ON u.user_id = r.user_id
                  LEFT JOIN events e ON r.event_id = e.event_id
                  WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT')
                  AND (CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) LIKE ? OR u.email LIKE ?)";
        
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
        
        $query .= " ORDER BY CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) ASC LIMIT 20";
        
        try {
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            
            if (!$stmt->bind_param($param_types, ...$params)) {
                throw new Exception("Bind param failed: " . $stmt->error);
            }
            
            if (!$stmt->execute()) {
                throw new Exception("Execute failed: " . $stmt->error);
            }
            
            $result = $stmt->get_result();
            if (!$result) {
                throw new Exception("Get result failed: " . $stmt->error);
            }
            
            $participants = [];
            while ($row = $result->fetch_assoc()) {
                $participants[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $participants]);
        } catch (Exception $e) {
            error_log("Participants search error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error searching participants: ' . $e->getMessage()]);
            exit;
        }
    }
    elseif ($action === 'get_departments') {
        // Get list of all departments
        try {
            $query = "SELECT department_id, department_name FROM departments ORDER BY department_name ASC";
            $result = $conn->query($query);
            
            if (!$result) {
                throw new Exception("Query failed: " . $conn->error);
            }
            
            $departments = [];
            while ($row = $result->fetch_assoc()) {
                $departments[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $departments]);
        } catch (Exception $e) {
            error_log("Get departments error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error fetching departments: ' . $e->getMessage()]);
            exit;
        }
    } else {
        // Unknown action
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action: ' . $action]);
        exit;
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
            $query = "SELECT u.user_id, CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) as full_name, u.email,
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
        $first_name = trim($data['first_name'] ?? '');
        $middle_name = trim($data['middle_name'] ?? '');
        $last_name = trim($data['last_name'] ?? '');
        $participant_email = trim($data['participant_email'] ?? '');
        $company = trim($data['company'] ?? '');
        $job_title = trim($data['job_title'] ?? '');
        $employee_code = trim($data['employee_code'] ?? '');
        $participant_phone = trim($data['participant_phone'] ?? '');
        $status = $data['status'] ?? 'REGISTERED';
        $is_walkIn = isset($data['is_walkIn']) ? intval($data['is_walkIn']) : 0; // 1 for walk-in, 0 for registered
        
        // Create full name from three components for email and display
        $participant_name = trim($first_name . ' ' . $middle_name . ' ' . $last_name);
        
        // Validate required fields (employee_code is optional, not stored anywhere)
        if (!$event_id || !$first_name || !$last_name || !$participant_email || !$company || !$job_title || !$participant_phone) {
            throw new Exception('Event ID, first name, last name, email, company, job title, and phone are required');
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
        $user_check = "SELECT user_id FROM users WHERE email = ?";
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
            // Department_id is not provided in new registration form
            $department_id = null;
            
            // Insert into users table with separate name fields
            $insert_user = "INSERT INTO users (first_name, middle_name, last_name, email, company, job_title, contact_number, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($insert_user);
            if (!$stmt) {
                throw new Exception('Prepare user insert failed: ' . $conn->error);
            }
            
            $stmt->bind_param('sssssssi', $first_name, $middle_name, $last_name, $participant_email, $company, $job_title, $participant_phone, $department_id);
            
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
        error_log('Walk-in flag: ' . $is_walkIn);
        
        $insert_registration = "INSERT INTO registrations (user_id, event_id, registration_code, status, is_walkIn, registered_at) 
                               VALUES (?, ?, ?, ?, ?, NOW())";
        $stmt = $conn->prepare($insert_registration);
        if (!$stmt) {
            throw new Exception('Prepare registration insert failed: ' . $conn->error);
        }
        
        $stmt->bind_param('iissi', $user_id, $event_id, $registration_code, $status, $is_walkIn);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to create registration: ' . $stmt->error);
        }
        
        error_log('Registration saved successfully with code: ' . $registration_code);
        
        // Fetch event details for email
        $event_query = "SELECT event_name, start_event, end_event, location, is_private 
                       FROM events WHERE event_id = ?";
        $event_stmt = $conn->prepare($event_query);
        $event_stmt->bind_param('i', $event_id);
        $event_stmt->execute();
        $event_result = $event_stmt->get_result();
        $event_data = $event_result->fetch_assoc();
        
        // Prepare event date/time for email
        $event_date_str = '';
        if ($event_data['start_event']) {
            $date = new DateTime($event_data['start_event']);
            $event_date_str = $date->format('F j, Y');
            $event_date_str .= ' at ' . $date->format('g:i A');
        }
        
        // Send registration confirmation email with QR code
        try {
            $mailer = new SMTPMailer(
                SMTP_HOST,
                SMTP_PORT,
                SMTP_USER,
                SMTP_PASSWORD,
                EMAIL_FROM,
                EMAIL_FROM_NAME
            );
            
            // 📧 Check if user registration emails are enabled
            if (SMTPMailer::shouldSendEmail('user_registration', null)) {
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
            } else {
                error_log('📧 User registration emails are DISABLED - skipping email to: ' . $participant_email);
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
        $userInfo = getUserInfo();
        
        error_log('Parsed data: ' . json_encode($data));
        error_log('User Info: ' . json_encode($userInfo));
        error_log('JSON error: ' . json_last_error_msg());
        
        if (!$data) {
            error_log('ERROR: Invalid JSON received');
            throw new Exception('Invalid JSON received: ' . json_last_error_msg());
        }
        
        $registration_code = trim($data['registration_code'] ?? '');
        $status = trim($data['status'] ?? 'ATTENDED');
        $event_id = intval($data['event_id'] ?? 0);
        
        error_log('Registration code: ' . $registration_code);
        error_log('Event ID: ' . $event_id);
        error_log('New status: ' . $status);
        
        if (!$registration_code) {
            error_log('ERROR: No registration code provided');
            throw new Exception('Registration code is required');
        }
        
        if ($event_id <= 0) {
            error_log('ERROR: No event ID provided');
            throw new Exception('Event ID is required');
        }
        
        // First, verify the registration exists and get its details
        // AND verify it belongs to the selected event
        $verify_query = "SELECT r.registration_id, r.event_id, r.status as current_status, 
                                e.coordinator_id, CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) as full_name, u.email, e.event_name
                         FROM registrations r
                         JOIN events e ON r.event_id = e.event_id
                         LEFT JOIN users u ON r.user_id = u.user_id
                         WHERE UPPER(r.registration_code) = UPPER(?) AND r.event_id = ?";
        
        error_log('Verify query: ' . $verify_query);
        error_log('Verify params: registration_code=' . $registration_code . ', event_id=' . $event_id);
        
        $verify_stmt = $conn->prepare($verify_query);
        if (!$verify_stmt) {
            error_log('Prepare failed: ' . $conn->error);
            throw new Exception('Prepare statement failed: ' . $conn->error);
        }
        
        $verify_stmt->bind_param('si', $registration_code, $event_id);
        if (!$verify_stmt->execute()) {
            error_log('Execute failed: ' . $verify_stmt->error);
            throw new Exception('Failed to verify registration: ' . $verify_stmt->error);
        }
        
        $result = $verify_stmt->get_result();
        error_log('Verify query returned: ' . $result->num_rows . ' rows');
        
        if ($result->num_rows === 0) {
            error_log('ERROR: No registration found for code: ' . $registration_code . ' in event: ' . $event_id);
            throw new Exception('Registration code not found for this event');
        }
        
        $registration_data = $result->fetch_assoc();
        error_log('Found registration: ' . json_encode($registration_data));
        
        // Check coordinator access (if user is a coordinator)
        // Admins bypass this check
        if ($userInfo['role'] === 'COORDINATOR' && $userInfo['coordinator_id']) {
            // Verify coordinator has access to this event
            if ((int)$registration_data['coordinator_id'] !== (int)$userInfo['coordinator_id']) {
                error_log('ERROR: Coordinator ' . $userInfo['coordinator_id'] . ' does not have access to event ' . $registration_data['event_id'] . ' (event assigned to coordinator: ' . ($registration_data['coordinator_id'] ?? 'None') . ')');
                throw new Exception('You do not have access to check in participants for this event. Event is assigned to a different coordinator.');
            }
            error_log('✓ Coordinator ' . $userInfo['coordinator_id'] . ' verified for event ' . $registration_data['event_id']);
        } elseif ($userInfo['role'] !== 'ADMIN' && $userInfo['role'] !== 'admin') {
            error_log('ERROR: User with role ' . $userInfo['role'] . ' cannot check in participants');
            throw new Exception('Only admins and coordinators can check in participants');
        }
        
        // Now update the registration status
        $update_query = "UPDATE registrations SET status = ? WHERE UPPER(registration_code) = UPPER(?)";
        error_log('Update query: ' . $update_query);
        error_log('Update params: status=' . $status . ', registration_code=' . $registration_code);
        
        $update_stmt = $conn->prepare($update_query);
        
        if (!$update_stmt) {
            error_log('Prepare failed: ' . $conn->error);
            throw new Exception('Prepare statement failed: ' . $conn->error);
        }
        
        $update_stmt->bind_param('ss', $status, $registration_code);
        
        if (!$update_stmt->execute()) {
            error_log('Execute failed: ' . $update_stmt->error);
            throw new Exception('Failed to update registration: ' . $update_stmt->error);
        }
        
        $rows_affected = $update_stmt->affected_rows;
        error_log('Rows affected: ' . $rows_affected);
        
        // If no rows were affected, the status might already be ATTENDED
        // This is OK - they're already checked in
        if ($rows_affected === 0) {
            if ($registration_data['current_status'] === $status) {
                error_log('✓ Registration already has status: ' . $status);
                // Person is already checked in - that's fine, return success
            } else {
                error_log('⚠ Update affected 0 rows, but status is: ' . $registration_data['current_status']);
            }
        } else {
            error_log('✓ Updated registration status from ' . $registration_data['current_status'] . ' to ' . $status);
        }
        
        error_log('SUCCESS: Check-in processed for registration ' . $registration_code);
        error_log('═══════════════════════════════════════');
        
        // Return the registration details
        $response_data = [
            'registration_id' => $registration_data['registration_id'],
            'registration_code' => $registration_code,
            'full_name' => $registration_data['full_name'],
            'email' => $registration_data['email'],
            'event_name' => $registration_data['event_name'],
            'status' => $status,
            'previous_status' => $registration_data['current_status'],
            'already_checked_in' => ($rows_affected === 0 && $registration_data['current_status'] === $status)
        ];
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Registration status is ' . $status,
            'data' => $response_data
        ]);
        
    } catch (Exception $e) {
        error_log('EXCEPTION: ' . $e->getMessage());
        error_log('═══════════════════════════════════════');
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        // Delete a participant from an event
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            throw new Exception('Invalid JSON received');
        }
        
        $registration_id = isset($data['registration_id']) ? intval($data['registration_id']) : 0;
        $registration_code = trim($data['registration_code'] ?? '');
        
        if (!$registration_id && !$registration_code) {
            throw new Exception('Registration ID or code is required');
        }
        
        // Determine which column to use for deletion
        if ($registration_id > 0) {
            $query = "DELETE FROM registrations WHERE registration_id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $registration_id);
        } else {
            $query = "DELETE FROM registrations WHERE UPPER(registration_code) = UPPER(?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('s', $registration_code);
        }
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to delete participant: ' . $stmt->error);
        }
        
        if ($stmt->affected_rows === 0) {
            throw new Exception('Participant not found');
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Participant deleted successfully'
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>

