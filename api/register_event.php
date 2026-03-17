<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
ob_clean();

require_once '../config/db.php';
require_once '../config/email_config.php';
require_once '../includes/SMTPMailer.php';

try {
    // Get JSON data from request body
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    $firstName = trim($input['first_name'] ?? '');
    $middleName = trim($input['middle_name'] ?? '');
    $lastName = trim($input['last_name'] ?? '');
    $fullName = trim($firstName . ' ' . $middleName . ' ' . $lastName);
    $company = trim($input['company'] ?? '');
    $jobTitle = trim($input['job_title'] ?? '');
    $email = trim($input['email'] ?? '');
    $phone = trim($input['contact_number'] ?? '');
    $eventId = intval($input['event_id'] ?? 0);

    // Log incoming data for debugging
    error_log('Registration data received: ' . json_encode($input));

    // Validate required fields with specific error messages
    if (empty($firstName)) {
        throw new Exception('First name is required');
    }
    if (empty($lastName)) {
        throw new Exception('Last name is required');
    }
    if (empty($company)) {
        throw new Exception('Company is required');
    }
    if (empty($jobTitle)) {
        throw new Exception('Job title is required');
    }
    if (empty($email)) {
        throw new Exception('Email is required');
    }
    if (empty($phone)) {
        throw new Exception('Contact number is required');
    }
    if (empty($eventId)) {
        throw new Exception('Event ID is required');
    }

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Get event details
    $eventQuery = $conn->prepare("SELECT event_name, DATE(start_event) as event_date, TIME(start_event) as start_time, TIME(end_event) as end_time, location FROM events WHERE event_id = ?");
    $eventQuery->bind_param("i", $eventId);
    $eventQuery->execute();
    $eventResult = $eventQuery->get_result();
    if ($eventResult->num_rows === 0) {
        throw new Exception('Event not found');
    }
    $eventData = $eventResult->fetch_assoc();
    $eventName = $eventData['event_name'];
    $eventDate = $eventData['event_date'];
    $eventTime = $eventData['start_time'];
    $eventLocation = $eventData['location'];

    // Check if user exists
    $checkUserQuery = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $checkUserQuery->bind_param("s", $email);
    $checkUserQuery->execute();
    $userResult = $checkUserQuery->get_result();

    if ($userResult->num_rows > 0) {
        $userData = $userResult->fetch_assoc();
        $userId = $userData['user_id'];
        
        // Update existing user
        $updateQuery = $conn->prepare("UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, job_title = ?, company = ?, contact_number = ? WHERE user_id = ?");
        $updateQuery->bind_param("ssssssi", $firstName, $middleName, $lastName, $jobTitle, $company, $phone, $userId);
        $updateQuery->execute();
    } else {
        // Create new user
        $roleQuery = $conn->query("SELECT role_id FROM roles LIMIT 1");
        $roleData = $roleQuery->fetch_assoc();
        $roleId = $roleData ? $roleData['role_id'] : null;

        $insertUserQuery = $conn->prepare("INSERT INTO users (first_name, middle_name, last_name, email, job_title, company, contact_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $insertUserQuery->bind_param("sssssss", $firstName, $middleName, $lastName, $email, $jobTitle, $company, $phone);
        if (!$insertUserQuery->execute()) {
            throw new Exception('Error creating user');
        }
        $userId = $conn->insert_id;
    }

    // Check if already registered
    $checkRegQuery = $conn->prepare("SELECT registration_code FROM registrations WHERE user_id = ? AND event_id = ?");
    $checkRegQuery->bind_param("ii", $userId, $eventId);
    $checkRegQuery->execute();
    $regResult = $checkRegQuery->get_result();
    
    if ($regResult->num_rows > 0) {
        $regData = $regResult->fetch_assoc();
        throw new Exception('Already registered');
    }

    // Check if event registration is closed (capacity reached)
    $capacityQuery = $conn->prepare("SELECT capacity FROM events WHERE event_id = ?");
    $capacityQuery->bind_param("i", $eventId);
    $capacityQuery->execute();
    $capacityResult = $capacityQuery->get_result();
    $eventCapacity = $capacityResult->fetch_assoc();
    
    $countQuery = $conn->prepare("SELECT COUNT(*) as registration_count FROM registrations WHERE event_id = ?");
    $countQuery->bind_param("i", $eventId);
    $countQuery->execute();
    $countResult = $countQuery->get_result();
    $countData = $countResult->fetch_assoc();
    $currentRegistrations = $countData['registration_count'];
    
    if ($currentRegistrations >= $eventCapacity['capacity']) {
        throw new Exception('Registration closed - event is at full capacity');
    }

    // Generate registration code
    $registrationCode = 'REG_' . strtoupper(uniqid());

    // Create registration
    $insertRegQuery = $conn->prepare("INSERT INTO registrations (user_id, event_id, registration_code, status, registered_at) VALUES (?, ?, ?, 'registered', NOW())");
    $insertRegQuery->bind_param("iis", $userId, $eventId, $registrationCode);
    if (!$insertRegQuery->execute()) {
        throw new Exception('Error creating registration');
    }

    // Send confirmation email asynchronously
    try {
        $smtpMailer = new SMTPMailer(
            SMTP_HOST,
            SMTP_PORT,
            SMTP_USER,
            SMTP_PASSWORD,
            EMAIL_FROM,
            EMAIL_FROM_NAME
        );
        
        // 📧 Check if user registration emails are enabled
        if (SMTPMailer::shouldSendEmail('user_registration', null)) {
            $smtpMailer->sendRegistrationConfirmation(
                $email,
                $fullName,
                $eventName,
                $registrationCode,
                $eventDate,
                $eventLocation
            );
            error_log('✓ Registration confirmation email sent to: ' . $email);
        } else {
            error_log('📧 User registration emails are DISABLED - skipping email to: ' . $email);
        }
    } catch (Exception $e) {
        error_log('Email error: ' . $e->getMessage());
        // Don't fail registration if email fails
    }

    // Return success
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'registration_code' => $registrationCode
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>