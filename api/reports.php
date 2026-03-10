<?php
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'event_summary') {
        $query = "SELECT 
                  COUNT(DISTINCT e.event_id) as total_events,
                  SUM(CASE WHEN DATE(e.start_event) >= CURDATE() THEN 1 ELSE 0 END) as upcoming_events,
                  COUNT(DISTINCT r.registration_id) as total_registrations,
                  SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as total_attended,
                  ROUND(100.0 * SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) / COUNT(DISTINCT r.registration_id), 2) as attendance_rate
                  FROM events e
                  LEFT JOIN registrations r ON e.event_id = r.event_id";
        
        $result = $conn->query($query);
        $summary = $result->fetch_assoc();
        
        echo json_encode(['success' => true, 'data' => $summary]);
    }
    elseif ($action === 'participant_master') {
        $query = "SELECT 
                  u.user_id,
                  u.full_name,
                  u.email,
                  d.department_name,
                  COUNT(DISTINCT r.registration_id) as events_registered,
                  SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as events_attended
                  FROM users u
                  LEFT JOIN departments d ON u.department_id = d.department_id
                  LEFT JOIN registrations r ON u.user_id = r.user_id
                  WHERE u.role_id = (SELECT role_id FROM roles WHERE role_name = 'PARTICIPANT')
                  GROUP BY u.user_id
                  ORDER BY u.full_name ASC";
        
        $result = $conn->query($query);
        $participants = [];
        
        while ($row = $result->fetch_assoc()) {
            $participants[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $participants]);
    }
    elseif ($action === 'checked_in_attendance') {
        $query = "SELECT 
                  u.full_name,
                  u.email,
                  e.event_name,
                  r.registration_code,
                  a.scanned_at,
                  scanned_by.full_name as scanned_by_name
                  FROM attendance_logs a
                  JOIN registrations r ON a.registration_id = r.registration_id
                  JOIN users u ON r.user_id = u.user_id
                  JOIN events e ON r.event_id = e.event_id
                  LEFT JOIN users scanned_by ON a.scanned_by = scanned_by.user_id
                  ORDER BY a.scanned_at DESC";
        
        $result = $conn->query($query);
        $attendance = [];
        
        while ($row = $result->fetch_assoc()) {
            $attendance[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $attendance]);
    }
    elseif ($action === 'absentees') {
        $query = "SELECT 
                  u.full_name,
                  u.email,
                  e.event_name,
                  r.registration_code,
                  r.registered_at,
                  d.department_name
                  FROM registrations r
                  JOIN users u ON r.user_id = u.user_id
                  JOIN events e ON r.event_id = e.event_id
                  LEFT JOIN departments d ON u.department_id = d.department_id
                  WHERE r.status != 'ATTENDED'
                  ORDER BY e.start_event DESC, u.full_name ASC";
        
        $result = $conn->query($query);
        $absentees = [];
        
        while ($row = $result->fetch_assoc()) {
            $absentees[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $absentees]);
    }
    elseif ($action === 'registration_timeline') {
        $days = isset($_GET['days']) ? intval($_GET['days']) : 30;
        
        $query = "SELECT 
                  DATE(registered_at) as date,
                  COUNT(*) as count
                  FROM registrations
                  WHERE registered_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                  GROUP BY DATE(registered_at)
                  ORDER BY date ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $days);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $timeline = [];
        while ($row = $result->fetch_assoc()) {
            $timeline[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $timeline]);
    }
}
?>
