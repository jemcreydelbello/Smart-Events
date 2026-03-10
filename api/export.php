<?php
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $report = $_GET['report'] ?? '';
    
    if ($report === 'event_summary') {
        // Generate CSV for event summary report
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="event_summary_report.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Event Name', 'Event Date', 'Total Registered', 'Total Attended', 'Attendance Rate']);
        
        $query = "SELECT 
                  e.event_name,
                  DATE(e.start_event) as event_date,
                  COUNT(DISTINCT r.registration_id) as total_registered,
                  SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) as total_attended,
                  ROUND(100.0 * SUM(CASE WHEN r.status = 'ATTENDED' THEN 1 ELSE 0 END) / COUNT(DISTINCT r.registration_id), 2) as attendance_rate
                  FROM events e
                  LEFT JOIN registrations r ON e.event_id = r.event_id
                  GROUP BY e.event_id
                  ORDER BY e.start_event DESC";
        
        $result = $conn->query($query);
        while ($row = $result->fetch_assoc()) {
            $row['attendance_rate'] = $row['attendance_rate'] . '%';
            fputcsv($output, $row);
        }
        
        fclose($output);
        exit;
    }
    elseif ($report === 'participant_list') {
        // Generate CSV for participant master list
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="participant_master_list.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Full Name', 'Email', 'Department', 'Events Registered', 'Events Attended']);
        
        $query = "SELECT 
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
        while ($row = $result->fetch_assoc()) {
            fputcsv($output, $row);
        }
        
        fclose($output);
        exit;
    }
    elseif ($report === 'attendance') {
        // Generate CSV for attendance report
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="checked_in_attendance_report.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Name', 'Email', 'Event', 'Registration Code', 'Scanned At', 'Scanned By']);
        
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
        while ($row = $result->fetch_assoc()) {
            fputcsv($output, $row);
        }
        
        fclose($output);
        exit;
    }
    elseif ($report === 'absentees') {
        // Generate CSV for absentees report
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="absentees_report.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Name', 'Email', 'Event', 'Registration Code', 'Registered At', 'Department']);
        
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
        while ($row = $result->fetch_assoc()) {
            fputcsv($output, $row);
        }
        
        fclose($output);
        exit;
    }
    elseif ($report === 'timeline') {
        // Generate CSV for registration timeline report
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="registration_timeline_report.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Date', 'Registrations']);
        
        $query = "SELECT 
                  DATE(registered_at) as date,
                  COUNT(*) as count
                  FROM registrations
                  GROUP BY DATE(registered_at)
                  ORDER BY date ASC";
        
        $result = $conn->query($query);
        while ($row = $result->fetch_assoc()) {
            fputcsv($output, [$row['date'], $row['count']]);
        }
        
        fclose($output);
        exit;
    }
    else {
        echo json_encode(['success' => false, 'message' => 'Invalid report type']);
    }
}
?>
