<?php
header('Content-Type: application/json');

require_once '../config/db.php';

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['email']) || empty($input['event_id'])) {
        throw new Exception("Missing required fields: email and event_id");
    }
    
    $email = trim($input['email']);
    $event_id = intval($input['event_id']);
    
    // Find user by email and get their name fields
    $userResult = $conn->query("SELECT user_id, first_name, middle_name, last_name FROM users WHERE email = '$email'");
    
    if ($userResult->num_rows === 0) {
        // User doesn't exist
        $conn->close();
        echo json_encode([
            'success' => true,
            'is_registered' => false,
            'message' => 'User not registered'
        ]);
        exit;
    }
    
    // Get user_id and name fields
    $user = $userResult->fetch_assoc();
    $user_id = $user['user_id'];
    $firstName = $user['first_name'];
    $middleName = $user['middle_name'];
    $lastName = $user['last_name'];
    
    // Check if registered for this event
    $regResult = $conn->query("SELECT registration_code FROM registrations WHERE user_id = $user_id AND event_id = $event_id");
    
    $conn->close();
    
    if ($regResult->num_rows > 0) {
        // User is registered
        $registration = $regResult->fetch_assoc();
        echo json_encode([
            'success' => true,
            'is_registered' => true,
            'registration_code' => $registration['registration_code'],
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'message' => 'User already registered for this event'
        ]);
    } else {
        // User is not registered
        echo json_encode([
            'success' => true,
            'is_registered' => false,
            'message' => 'User not registered for this event'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
