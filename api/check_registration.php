<?php
/**
 * Check Registration API
 * Verify if an email is already registered for a specific event
 * Prevents duplicate registrations
 */

header('Content-Type: application/json');

require_once '../config/db.php';

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed. Use POST.'
        ]);
        exit;
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($input['email']) || !isset($input['event_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: email and event_id'
        ]);
        exit;
    }

    $email = trim($input['email']);
    $event_id = intval($input['event_id']);

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email format',
            'is_registered' => false
        ]);
        exit;
    }

    // Validate event_id
    if ($event_id <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid event ID',
            'is_registered' => false
        ]);
        exit;
    }

    // Query: Check if this email is already registered for this event
    $query = "SELECT COUNT(*) as count 
              FROM registrations 
              WHERE email = ? AND event_id = ?";

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $conn->error
        ]);
        exit;
    }

    $stmt->bind_param('si', $email, $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    $is_registered = $row['count'] > 0;

    echo json_encode([
        'success' => true,
        'is_registered' => $is_registered,
        'message' => $is_registered ? 'Email already registered for this event' : 'Email not registered yet'
    ]);

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error checking registration: ' . $e->getMessage(),
        'is_registered' => false
    ]);
}
?>
