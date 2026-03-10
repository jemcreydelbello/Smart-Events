<?php
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';
    
    if ($action === 'mark_attended') {
        $registration_id = intval($data['registration_id']);
        $scanned_by = intval($data['scanned_by']);
        
        // Update registration status
        $query = "UPDATE registrations SET status = 'ATTENDED' WHERE registration_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $registration_id);
        $stmt->execute();
        
        // Log attendance
        $query = "INSERT INTO attendance_logs (registration_id, scanned_by) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $registration_id, $scanned_by);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Attendance marked successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to mark attendance']);
        }
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'by_registration') {
        $registration_id = intval($_GET['registration_id']);
        
        $query = "SELECT a.*, u.full_name as scanned_by_name 
                  FROM attendance_logs a
                  LEFT JOIN users u ON a.scanned_by = u.user_id
                  WHERE a.registration_id = ?
                  ORDER BY a.scanned_at DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $registration_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $logs]);
    }
}
?>
