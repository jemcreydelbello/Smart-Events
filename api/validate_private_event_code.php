<?php
require_once '../config/db.php';

// Handle OPTIONS requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get the request body
$input = json_decode(file_get_contents('php://input'), true);
$code = isset($input['code']) ? trim($input['code']) : '';

if (empty($code)) {
    echo json_encode(['success' => false, 'message' => 'Code is required']);
    exit();
}

// Query to find the event by access code
$query = "SELECT 
    eac.event_id,
    eac.access_code,
    eac.expires_at,
    eac.is_active,
    e.event_id as id,
    e.event_name,
    DATE(e.start_event) as event_date,
    TIME(e.start_event) as start_time,
    TIME(e.end_event) as end_time,
    e.location,
    e.description,
    e.capacity,
    e.image_url,
    e.is_private,
    e.registration_end,
    COALESCE(COUNT(r.registration_id), 0) as total_registrations
FROM event_access_codes eac
JOIN events e ON eac.event_id = e.event_id
LEFT JOIN registrations r ON e.event_id = r.event_id AND r.status = 'confirmed'
WHERE eac.access_code = ? 
  AND (eac.is_active = 1 AND (eac.expires_at IS NULL OR eac.expires_at > NOW()))
GROUP BY e.event_id
LIMIT 1";

$stmt = $conn->prepare($query);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    exit();
}

$stmt->bind_param('s', $code);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $event = $result->fetch_assoc();
    
    // Additional validation checks
    if ($event['is_active'] != 1) {
        echo json_encode(['success' => false, 'message' => 'This code has been deactivated']);
        $stmt->close();
        $conn->close();
        exit();
    }
    
    if ($event['expires_at'] && strtotime($event['expires_at']) < time()) {
        echo json_encode(['success' => false, 'message' => 'This code has expired']);
        $stmt->close();
        $conn->close();
        exit();
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Event found',
        'event' => $event
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid code or event not found']);
}

$stmt->close();
$conn->close();
?>
