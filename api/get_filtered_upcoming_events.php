<?php
header('Content-Type: application/json');

require_once '../config/db.php';

// Get event type from query parameter (upcoming, ongoing, etc.)
$eventType = isset($_GET['type']) ? $_GET['type'] : 'upcoming';

// Get private event code if provided
$privateCode = isset($_GET['code']) ? trim($_GET['code']) : '';

// Set timezone to match database
date_default_timezone_set('Asia/Manila');
$now = new DateTime('now', new DateTimeZone('Asia/Manila'));
$currentDateTime = $now->format('Y-m-d H:i:s');

// Build query based on event type
switch($eventType) {
    case 'private':
        // Events accessed via private code
        if (empty($privateCode)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Code is required']);
            exit;
        }
        
        $query = "SELECT 
            e.event_id as id,
            e.event_name,
            DATE(e.start_event) as event_date,
            TIME(e.start_event) as start_time,
            TIME(e.end_event) as end_time,
            e.location,
            e.description,
            e.image_url,
            e.is_private,
            e.capacity,
            COALESCE(COUNT(r.registration_id), 0) as current_registrations,
            e.registration_start,
            e.registration_end,
            CASE WHEN COALESCE(COUNT(r.registration_id), 0) >= e.capacity THEN 1 ELSE 0 END as is_registration_closed
        FROM event_access_codes eac
        JOIN events e ON eac.event_id = e.event_id
        LEFT JOIN registrations r ON e.event_id = r.event_id
        WHERE eac.access_code = ? 
          AND (eac.is_active = 1 AND (eac.expires_at IS NULL OR eac.expires_at > NOW()))
        GROUP BY e.event_id
        LIMIT 1";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Query preparation failed']);
            exit;
        }
        $stmt->bind_param("s", $privateCode);
        $stmt->execute();
        $result = $stmt->get_result();
        break;
    case 'ongoing':
        // Events currently happening (started but not ended)
        $query = "SELECT 
            e.event_id as id,
            e.event_name,
            DATE(e.start_event) as event_date,
            TIME(e.start_event) as start_time,
            TIME(e.end_event) as end_time,
            e.location,
            e.description,
            e.image_url,
            e.is_private,
            e.capacity,
            COALESCE(COUNT(r.registration_id), 0) as current_registrations,
            e.registration_start,
            e.registration_end,
            CASE WHEN COALESCE(COUNT(r.registration_id), 0) >= e.capacity THEN 1 ELSE 0 END as is_registration_closed
        FROM events e
        LEFT JOIN registrations r ON e.event_id = r.event_id
        WHERE e.start_event < NOW()
        AND e.end_event > NOW()
        GROUP BY e.event_id
        ORDER BY e.start_event ASC
        LIMIT 50";
        break;
        
    case 'upcoming':
    default:
        // Future events
        $query = "SELECT 
            e.event_id as id,
            e.event_name,
            DATE(e.start_event) as event_date,
            TIME(e.start_event) as start_time,
            TIME(e.end_event) as end_time,
            e.location,
            e.description,
            e.image_url,
            e.is_private,
            e.capacity,
            COALESCE(COUNT(r.registration_id), 0) as current_registrations,
            e.registration_start,
            e.registration_end,
            CASE WHEN COALESCE(COUNT(r.registration_id), 0) >= e.capacity THEN 1 ELSE 0 END as is_registration_closed
        FROM events e
        LEFT JOIN registrations r ON e.event_id = r.event_id
        WHERE e.start_event > NOW() AND e.is_private = 0
        GROUP BY e.event_id
        ORDER BY e.start_event ASC
        LIMIT 50";
        break;
}

// Execute query if not already executed (prepared statement case)
if (!isset($result)) {
    $result = $conn->query($query);
}
    
if (!$result) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Query failed: ' . $conn->error
    ]);
    exit;
}

$events = [];
while ($row = $result->fetch_assoc()) {
    $row['is_private'] = (int)$row['is_private'];
    $row['capacity'] = (int)$row['capacity'];
    $row['current_registrations'] = (int)$row['current_registrations'];
    $row['is_registration_closed'] = (int)$row['is_registration_closed'];
    
    // Process registration status
    $now = new DateTime('now', new DateTimeZone('Asia/Manila'));
    $row['registration_closed'] = false;
    $row['closure_reason'] = 'open';
    $row['status_badge'] = 'Registration Open';
    $row['status_color'] = '#dbeafe';
    $row['status_text_color'] = '#1d4ed8';
    
    // Priority 1: Check if registration hasn't started yet (show Coming Soon)
    if ($row['registration_start'] && !empty(trim($row['registration_start']))) {
        try {
            $regStartDateTime = new DateTime($row['registration_start'], new DateTimeZone('Asia/Manila'));
            
            if ($now < $regStartDateTime) {
                $row['registration_closed'] = true;
                $row['closure_reason'] = 'not_started';
                $row['status_badge'] = 'Coming Soon';
                $row['status_color'] = '#fef3c7';
                $row['status_text_color'] = '#d97706';
            }
        } catch (Exception $e) {
            // If date parsing fails, default to open
        }
    }
    
    // Priority 2: Check if registration is closed (only if not Coming Soon)
    if ($row['closure_reason'] !== 'not_started') {
        // Check if at capacity
        if ($row['is_registration_closed'] == 1) {
            $row['registration_closed'] = true;
            $row['closure_reason'] = 'capacity';
            $row['status_badge'] = 'Registration Closed';
            $row['status_color'] = '#fee2e2';
            $row['status_text_color'] = '#dc2626';
        }
        // Check if deadline has passed (only if not at capacity)
        else if ($row['registration_end'] && !empty(trim($row['registration_end']))) {
            try {
                $regEndDateTime = new DateTime($row['registration_end'], new DateTimeZone('Asia/Manila'));
                
                if ($now > $regEndDateTime) {
                    $row['registration_closed'] = true;
                    $row['closure_reason'] = 'deadline';
                    $row['status_badge'] = 'Registration Closed';
                    $row['status_color'] = '#fee2e2';
                    $row['status_text_color'] = '#dc2626';
                }
            } catch (Exception $e) {
                // If date parsing fails, default to open
            }
        }
    }
    
    $events[] = $row;
}

echo json_encode([
    'success' => true,
    'events' => $events,
    'count' => count($events),
    'type' => $eventType
]);
?>


