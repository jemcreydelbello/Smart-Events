<?php
// Set error handling before any output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set headers first
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

require_once '../db_config.php';

try {
    // Get dashboard statistics
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        
        // Total Events
        $result = $conn->query("SELECT COUNT(*) as total FROM events");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        $totalEvents = $result->fetch_assoc()['total'];
        
        // Total Registrations
        $result = $conn->query("SELECT COUNT(*) as total FROM registrations");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        $totalRegistrations = $result->fetch_assoc()['total'];
        
        // Attended (Total with ATTENDED status)
        $result = $conn->query("SELECT COUNT(*) as total 
                               FROM registrations 
                               WHERE status = 'ATTENDED'");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        $attendedToday = $result->fetch_assoc()['total'];
        
        // Events this week
        $result = $conn->query("SELECT COUNT(*) as total FROM events 
                               WHERE WEEK(event_date) = WEEK(CURDATE()) 
                               AND YEAR(event_date) = YEAR(CURDATE())");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        $eventsThisWeek = $result->fetch_assoc()['total'];
        
        // Registration change percentage
        $result = $conn->query("SELECT COUNT(*) as regs_this_month FROM registrations 
                               WHERE MONTH(registered_at) = MONTH(CURDATE()) 
                               AND YEAR(registered_at) = YEAR(CURDATE())");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        $thisMonthRegs = $result->fetch_assoc()['regs_this_month'];
        
        $result = $conn->query("SELECT COUNT(*) as regs_last_month FROM registrations 
                               WHERE MONTH(registered_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
                               AND YEAR(registered_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        $lastMonthRegs = $result->fetch_assoc()['regs_last_month'];
        
        $regPercent = $lastMonthRegs > 0 ? round((($thisMonthRegs - $lastMonthRegs) / $lastMonthRegs) * 100, 0) : 0;
        
        // Participants per event
        $perEventData = [];
        $result = $conn->query("SELECT e.event_name, COUNT(r.registration_id) as participant_count
                               FROM events e
                               LEFT JOIN registrations r ON e.event_id = r.event_id
                               GROUP BY e.event_id, e.event_name
                               ORDER BY participant_count DESC
                               LIMIT 15");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        
        while ($row = $result->fetch_assoc()) {
            $perEventData[] = ['event_name' => $row['event_name'], 'count' => (int)$row['participant_count']];
        }
        
        // Attendance status (pie chart)
        $result = $conn->query("SELECT 
                               SUM(CASE WHEN status = 'ATTENDED' THEN 1 ELSE 0 END) as attended,
                               SUM(CASE WHEN status = 'REGISTERED' THEN 1 ELSE 0 END) as pending
                               FROM registrations");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        $attendance = $result->fetch_assoc();
        
        // Recent events (top 3 most recently created)
        $recentEvents = [];
        $result = $conn->query("SELECT event_id, event_name, event_date, created_at
                               FROM events
                               ORDER BY created_at DESC
                               LIMIT 3");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        
        while ($row = $result->fetch_assoc()) {
            $recentEvents[] = [
                'event_id' => (int)$row['event_id'],
                'event_name' => $row['event_name'],
                'event_date' => $row['event_date'],
                'created_at' => $row['created_at']
            ];
        }
        
        // Department-wise registrations
        $departmentData = [];
        $result = $conn->query("SELECT d.department_name, COUNT(r.registration_id) as count
                               FROM departments d
                               LEFT JOIN users u ON d.department_id = u.department_id
                               LEFT JOIN registrations r ON u.user_id = r.user_id
                               GROUP BY d.department_id, d.department_name
                               ORDER BY count DESC
                               LIMIT 10");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        
        while ($row = $result->fetch_assoc()) {
            if ((int)$row['count'] > 0) {
                $departmentData[] = [
                    'department_name' => $row['department_name'],
                    'count' => (int)$row['count']
                ];
            }
        }
        
        // Event capacity utilization
        $capacityData = [];
        $result = $conn->query("SELECT e.event_id, e.event_name, e.capacity, COUNT(r.registration_id) as registered
                               FROM events e
                               LEFT JOIN registrations r ON e.event_id = r.event_id
                               GROUP BY e.event_id, e.event_name, e.capacity
                               ORDER BY e.event_date DESC
                               LIMIT 10");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        
        while ($row = $result->fetch_assoc()) {
            $capacityData[] = [
                'event_name' => $row['event_name'],
                'capacity' => (int)$row['capacity'],
                'registered' => (int)$row['registered']
            ];
        }
        
        // Event type distribution (public vs private)
        $result = $conn->query("SELECT 
                               SUM(CASE WHEN is_private = 0 THEN 1 ELSE 0 END) as public_count,
                               SUM(CASE WHEN is_private = 1 THEN 1 ELSE 0 END) as private_count
                               FROM events");
        if (!$result) throw new Exception("Query error: " . $conn->error);
        $typeDistribution = $result->fetch_assoc();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'totalEvents' => (int)$totalEvents,
                'eventsThisWeek' => (int)$eventsThisWeek,
                'totalRegistrations' => (int)$totalRegistrations,
                'registrationPercent' => $regPercent,
                'attendedToday' => (int)$attendedToday,
                'registrationTrends' => $perEventData,
                'attendanceStatus' => [
                    'attended' => (int)$attendance['attended'],
                    'pending' => (int)$attendance['pending']
                ],
                'recentEvents' => $recentEvents,
                'departmentRegistrations' => $departmentData,
                'capacityUtilization' => $capacityData,
                'eventTypeDistribution' => [
                    'public_count' => (int)$typeDistribution['public_count'],
                    'private_count' => (int)$typeDistribution['private_count']
                ]
            ]
        ]);
    } else {
        throw new Exception("Invalid request method");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading dashboard',
        'error' => $e->getMessage()
    ]);
}
?>
