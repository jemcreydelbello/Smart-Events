<?php
// ============================================================
// EVENT METADATA API
// ============================================================
// Handles CRUD operations for custom event metadata fields
// ============================================================

error_reporting(E_ALL);
ini_set('display_errors', 0);

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}

require_once '../config/db.php';

if (!isset($conn)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection not initialized']);
    exit;
}

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

try {
    // GET REQUEST - Retrieve metadata
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? '';
        $event_id = intval($_GET['event_id'] ?? 0);
        
        if ($action === 'list' && $event_id) {
            // Get all metadata for an event
            $query = "SELECT metadata_id, field_name, field_value, created_at, updated_at 
                     FROM event_metadata 
                     WHERE event_id = ? 
                     ORDER BY created_at ASC";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            $stmt->bind_param('i', $event_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $metadata = [];
            while ($row = $result->fetch_assoc()) {
                $metadata[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $metadata]);
            $stmt->close();
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action or missing event_id']);
        }
    }
    // POST REQUEST - Create or Update metadata
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'create') {
            $event_id = intval($input['event_id'] ?? 0);
            $field_name = $input['field_name'] ?? '';
            $field_value = $input['field_value'] ?? '';
            
            if (!$event_id || !$field_name) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'event_id and field_name are required']);
                exit;
            }
            
            // Check if event exists
            $check_query = "SELECT event_id FROM events WHERE event_id = ?";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bind_param('i', $event_id);
            $check_stmt->execute();
            if ($check_stmt->get_result()->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Event not found']);
                $check_stmt->close();
                exit;
            }
            $check_stmt->close();
            
            // Insert or update metadata
            $insert_query = "INSERT INTO event_metadata (event_id, field_name, field_value) 
                           VALUES (?, ?, ?)
                           ON DUPLICATE KEY UPDATE field_value = ?";
            $insert_stmt = $conn->prepare($insert_query);
            if (!$insert_stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            $insert_stmt->bind_param('isss', $event_id, $field_name, $field_value, $field_value);
            
            if ($insert_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Metadata created/updated', 'metadata_id' => $conn->insert_id]);
            } else {
                throw new Exception('Failed to create metadata: ' . $insert_stmt->error);
            }
            $insert_stmt->close();
        }
        elseif ($action === 'update') {
            $metadata_id = intval($input['metadata_id'] ?? 0);
            $field_name = $input['field_name'] ?? '';
            $field_value = $input['field_value'] ?? '';
            
            if (!$metadata_id || !$field_name) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'metadata_id and field_name are required']);
                exit;
            }
            
            $update_query = "UPDATE event_metadata SET field_name = ?, field_value = ? WHERE metadata_id = ?";
            $update_stmt = $conn->prepare($update_query);
            if (!$update_stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            $update_stmt->bind_param('ssi', $field_name, $field_value, $metadata_id);
            
            if ($update_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Metadata updated']);
            } else {
                throw new Exception('Failed to update metadata: ' . $update_stmt->error);
            }
            $update_stmt->close();
        }
        elseif ($action === 'delete') {
            $metadata_id = intval($input['metadata_id'] ?? 0);
            
            if (!$metadata_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'metadata_id is required']);
                exit;
            }
            
            $delete_query = "DELETE FROM event_metadata WHERE metadata_id = ?";
            $delete_stmt = $conn->prepare($delete_query);
            if (!$delete_stmt) {
                throw new Exception('Prepare failed: ' . $conn->error);
            }
            $delete_stmt->bind_param('i', $metadata_id);
            
            if ($delete_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Metadata deleted']);
            } else {
                throw new Exception('Failed to delete metadata: ' . $delete_stmt->error);
            }
            $delete_stmt->close();
        }
        else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    }
    else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

if (isset($conn)) {
    $conn->close();
}
?>
