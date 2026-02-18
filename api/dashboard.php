<?php
require_once '../db_config.php';

// Get dashboard statistics
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // Total Events
    $result = $conn->query("SELECT COUNT(*) as total FROM events");
    $totalEvents = $result->fetch_assoc()['total'];
    
    // Total Registrations
    $result = $conn->query("SELECT COUNT(*) as total FROM registrations");
    $totalRegistrations = $result->fetch_assoc()['total'];
    
    // Attended (Total with ATTENDED status)
    $result = $conn->query("SELECT COUNT(*) as total 
                           FROM registrations 
                           WHERE status = 'ATTENDED'");
    $attendedToday = $result->fetch_assoc()['total'];
    
    // Events this week
    $result = $conn->query("SELECT COUNT(*) as total FROM events 
                           WHERE WEEK(event_date) = WEEK(CURDATE()) 
                           AND YEAR(event_date) = YEAR(CURDATE())");
    $eventsThisWeek = $result->fetch_assoc()['total'];
    
    // Registration change percentage
    $result = $conn->query("SELECT COUNT(*) as regs_this_month FROM registrations 
                           WHERE MONTH(registered_at) = MONTH(CURDATE()) 
                           AND YEAR(registered_at) = YEAR(CURDATE())");
    $thisMonthRegs = $result->fetch_assoc()['regs_this_month'];
    
    $result = $conn->query("SELECT COUNT(*) as regs_last_month FROM registrations 
                           WHERE MONTH(registered_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
                           AND YEAR(registered_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))");
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
    
    while ($row = $result->fetch_assoc()) {
        $perEventData[] = ['event_name' => $row['event_name'], 'count' => (int)$row['participant_count']];
    }
    
    // Attendance status (pie chart)
    $result = $conn->query("SELECT 
                           SUM(CASE WHEN status = 'ATTENDED' THEN 1 ELSE 0 END) as attended,
                           SUM(CASE WHEN status = 'REGISTERED' THEN 1 ELSE 0 END) as pending
                           FROM registrations");
    $attendance = $result->fetch_assoc();
    
    // Recent events (top 3 most recently created)
    $recentEvents = [];
    $result = $conn->query("SELECT event_id, event_name, event_date, created_at
                           FROM events
                           ORDER BY created_at DESC
                           LIMIT 3");
    
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
}
?>
