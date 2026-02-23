<?php
// Output buffering to catch any unexpected output
ob_start();

// Error handling - ensure all output is JSON
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 0);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error: $errstr in $errfile:$errline");
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $errstr]);
    exit;
});

// Set fatal error handler
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error: ' . $error['message']
        ]);
    } else {
        ob_end_flush();
    }
});


try {
    require_once '../db_config.php';
} catch (Exception $e) {
    error_log("Database config error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database config failed']);
    exit;
}

// Load email & SMTP optional (don't fail if not available)
@require_once '../config/email_config.php';
@require_once '../includes/SMTPMailer.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $action = $_GET['action'] ?? '';
        
        if ($action === 'list') {
            // Get all coordinators with only essential columns to avoid missing column errors
            // Start with core columns that should always exist
            $query = "SELECT * FROM coordinators ORDER BY coordinator_name ASC";
            
            $result = $conn->query($query);
            
            if (!$result) {
                error_log("Query error in list action: " . $conn->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database query failed: ' . $conn->error]);
                exit;
            }
            
            $coordinators = [];
            
            while ($row = $result->fetch_assoc()) {
                $coordinators[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $coordinators]);
        }
        elseif ($action === 'list_pending') {
            // Get only pending setup coordinators (is_active = 0)
            $query = "SELECT coordinator_id, coordinator_name, email, contact_number, created_at 
                      FROM coordinators 
                      WHERE is_active = 0 
                      ORDER BY coordinator_name ASC";
            
            $result = $conn->query($query);
            
            if (!$result) {
                error_log("Query error in list_pending action: " . $conn->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database query failed: ' . $conn->error]);
                exit;
            }
            
            $coordinators = [];
            
            while ($row = $result->fetch_assoc()) {
                $coordinators[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $coordinators]);
        }
        elseif ($action === 'list_pending') {
            // Get only pending setup coordinators (is_active = 0 or no assignment yet)
            $query = "SELECT * FROM coordinators WHERE is_active = 0 ORDER BY coordinator_name ASC";
            
            $result = $conn->query($query);
            
            if (!$result) {
                error_log("Query error in list_pending action: " . $conn->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database query failed: ' . $conn->error]);
                exit;
            }
            
            $coordinators = [];
            
            while ($row = $result->fetch_assoc()) {
                $coordinators[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $coordinators]);
        }
        elseif ($action === 'events') {
            // Get all available events for dropdown selection
            $query = "SELECT event_id, event_name FROM events ORDER BY event_name ASC";
            $result = $conn->query($query);
            
            if (!$result) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database query failed']);
                exit;
            }
            
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $events[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $events]);
        }
        elseif ($action === 'detail') {
            $coordinator_id = intval($_GET['coordinator_id'] ?? 0);
            
            if (!$coordinator_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Coordinator ID is required']);
                exit;
            }
            
            // Use SELECT * to get all available columns
            $query = "SELECT * FROM coordinators WHERE coordinator_id = ?";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                error_log("Prepare failed in detail: " . $conn->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('i', $coordinator_id);
            
            if (!$stmt->execute()) {
                error_log("Execute failed in detail: " . $stmt->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
                exit;
            }
            
            $result = $stmt->get_result();
            $coordinator = $result->fetch_assoc();
            
            if ($coordinator) {
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => $coordinator]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Coordinator not found']);
            }
            
            $stmt->close();
        }
        else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } catch (Exception $e) {
        error_log("GET error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Check if this is an update operation
        $action = $_GET['action'] ?? '';
        $isUpdate = ($action === 'update');
        
        // Log the request for debugging
        error_log("POST request: action=$action, isUpdate=" . ($isUpdate ? 'true' : 'false') . ", Content-Type=" . ($_SERVER['CONTENT_TYPE'] ?? 'none'));
        
        // Create new or update coordinator
        // Handle both JSON and FormData
        $is_multipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
        
        $coordinator_id = null;
        if ($isUpdate) {
            if ($is_multipart) {
                $coordinator_id = intval($_POST['coordinator_id'] ?? 0);
            } else {
                $data = json_decode(file_get_contents('php://input'), true);
                $coordinator_id = intval($data['coordinator_id'] ?? 0);
            }
            
            if (!$coordinator_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Coordinator ID is required for update']);
                exit;
            }
        }
        
        if ($is_multipart) {
            // FormData (with file upload)
            $coordinator_name = $_POST['coordinator_name'] ?? '';
            $email = $_POST['email'] ?? '';
            $contact_number = $_POST['contact_number'] ?? '';
            $company = $_POST['company'] ?? '';
            $job_title = $_POST['job_title'] ?? '';
            $image_file = $_FILES['image'] ?? null;
        } else {
            // JSON
            $data = json_decode(file_get_contents('php://input'), true);
            $coordinator_name = $data['coordinator_name'] ?? '';
            $email = $data['email'] ?? '';
            $contact_number = $data['contact_number'] ?? '';
            $company = $data['company'] ?? '';
            $job_title = $data['job_title'] ?? '';
            $image_file = null;
        }
        
        if (!$coordinator_name || !$email) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name and email are required']);
            exit;
        }
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid email format']);
            exit;
        }
        
        // Check if email already exists (for new coordinators or if email changed)
        if (!$isUpdate) {
            $check_query = "SELECT coordinator_id FROM coordinators WHERE email = ?";
            $check_stmt = $conn->prepare($check_query);
            if (!$check_stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $check_stmt->bind_param('s', $email);
            $check_stmt->execute();
            if ($check_stmt->get_result()->num_rows > 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Email already exists']);
                exit;
            }
        } else {
            // For updates, check if email exists on a different coordinator
            $check_query = "SELECT coordinator_id FROM coordinators WHERE email = ? AND coordinator_id != ?";
            $check_stmt = $conn->prepare($check_query);
            if (!$check_stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $check_stmt->bind_param('si', $email, $coordinator_id);
            $check_stmt->execute();
            if ($check_stmt->get_result()->num_rows > 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Email already exists']);
                exit;
            }
        }
        
        if ($isUpdate) {
            // UPDATE operation with core columns only
            $coordinator_image = null;
            if ($image_file && $image_file['size'] > 0) {
                $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($image_file['type'], $allowed_types)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed']);
                    exit;
                }
                
                if ($image_file['size'] > 5 * 1024 * 1024) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'File size must not exceed 5MB']);
                    exit;
                }
                
                $upload_dir = '../uploads/coordinators/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0755, true);
                }
                
                $file_ext = pathinfo($image_file['name'], PATHINFO_EXTENSION);
                $coordinator_image = 'coordinator_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
                $upload_path = $upload_dir . $coordinator_image;
                
                if (!move_uploaded_file($image_file['tmp_name'], $upload_path)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                    exit;
                }
            }
            
            // Simple UPDATE - just core columns
            $query = "UPDATE coordinators SET coordinator_name = ?, email = ?, contact_number = ? WHERE coordinator_id = ?";
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                error_log("UPDATE prepare failed: " . $conn->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('sssi', $coordinator_name, $email, $contact_number, $coordinator_id);
            
            if (!$stmt->execute()) {
                error_log("UPDATE execute failed: " . $stmt->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
                exit;
            }
            $stmt->close();
            
            // Try to update optional fields separately if they have values
            if (!empty($company) || !empty($job_title) || $coordinator_image) {
                $optional_fields = [];
                $optional_values = [];
                $optional_types = '';
                
                if (!empty($company)) {
                    $optional_fields[] = "company = ?";
                    $optional_values[] = $company;
                    $optional_types .= 's';
                }
                if (!empty($job_title)) {
                    $optional_fields[] = "job_title = ?";
                    $optional_values[] = $job_title;
                    $optional_types .= 's';
                }
                if ($coordinator_image) {
                    $optional_fields[] = "coordinator_image = ?";
                    $optional_values[] = $coordinator_image;
                    $optional_types .= 's';
                }
                
                if (!empty($optional_fields)) {
                    $optional_values[] = $coordinator_id;
                    $optional_types .= 'i';
                    
                    $optional_query = "UPDATE coordinators SET " . implode(", ", $optional_fields) . " WHERE coordinator_id = ?";
                    $optional_stmt = $conn->prepare($optional_query);
                    
                    if ($optional_stmt) {
                        $optional_stmt->bind_param($optional_types, ...$optional_values);
                        $optional_stmt->execute();
                        $optional_stmt->close();
                    }
                }
            }
            
            error_log("Coordinator updated: ID=$coordinator_id, Name=$coordinator_name, Email=$email");
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Coordinator updated successfully',
                'coordinator_id' => $coordinator_id
            ]);
        } else {
            // CREATE operation - simple INSERT with core columns only
            $coordinator_image = null;
            if ($image_file && $image_file['size'] > 0) {
                $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($image_file['type'], $allowed_types)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed']);
                    exit;
                }
                
                if ($image_file['size'] > 5 * 1024 * 1024) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'File size must not exceed 5MB']);
                    exit;
                }
                
                $upload_dir = '../uploads/coordinators/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0755, true);
                }
                
                $file_ext = pathinfo($image_file['name'], PATHINFO_EXTENSION);
                $coordinator_image = 'coordinator_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
                $upload_path = $upload_dir . $coordinator_image;
                
                if (!move_uploaded_file($image_file['tmp_name'], $upload_path)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                    exit;
                }
            }
            
            // Generate reset token for password setup
            $reset_token = bin2hex(random_bytes(16));
            $reset_expire = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            // INSERT core columns plus reset token
            $query = "INSERT INTO coordinators (coordinator_name, email, contact_number, reset_token, reset_expire) VALUES (?, ?, ?, ?, ?)";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                error_log("CREATE INSERT prepare failed: " . $conn->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
                exit;
            }
            
            $stmt->bind_param('sssss', $coordinator_name, $email, $contact_number, $reset_token, $reset_expire);
            
            if (!$stmt->execute()) {
                error_log("CREATE INSERT execute failed: " . $stmt->error);
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
                exit;
            }
            
            $coordinator_id = $conn->insert_id;
            $stmt->close();
            
            // Update optional fields if they have values
            if (!empty($company) || !empty($job_title) || $coordinator_image) {
                $optional_fields = [];
                $optional_values = [];
                $optional_types = '';
                
                if (!empty($company)) {
                    $optional_fields[] = "company = ?";
                    $optional_values[] = $company;
                    $optional_types .= 's';
                }
                if (!empty($job_title)) {
                    $optional_fields[] = "job_title = ?";
                    $optional_values[] = $job_title;
                    $optional_types .= 's';
                }
                if ($coordinator_image) {
                    $optional_fields[] = "coordinator_image = ?";
                    $optional_values[] = $coordinator_image;
                    $optional_types .= 's';
                }
                
                if (!empty($optional_fields)) {
                    $optional_values[] = $coordinator_id;
                    $optional_types .= 'i';
                    
                    $update_query = "UPDATE coordinators SET " . implode(", ", $optional_fields) . " WHERE coordinator_id = ?";
                    $update_stmt = $conn->prepare($update_query);
                    
                    if ($update_stmt) {
                        $update_stmt->bind_param($optional_types, ...$optional_values);
                        $update_stmt->execute();
                        $update_stmt->close();
                    }
                }
            }
            
            error_log("Coordinator created: ID=$coordinator_id, Name=$coordinator_name, Email=$email");
            
            // Return success immediately - email sending is optional and non-blocking
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Coordinator created successfully.', 'coordinator_id' => $coordinator_id]);
            
            // Send email asynchronously (non-blocking)
            // If email config exists, try to send the reset password email
            if (defined('EMAIL_FROM') && defined('SMTP_HOST') && defined('SMTP_USER')) {
                try {
                    // Use the already-loaded SMTPMailer class
                    if (class_exists('SMTPMailer')) {
                        // Use the reset_token that was already generated and saved to database
                        $org_website = defined('ORG_WEBSITE') ? ORG_WEBSITE : 'http://localhost/Smart-Events';
                        $reset_link = $org_website . "/admin/coordinator-reset-password.php?token=" . $reset_token;
                        
                        $subject = (defined('EMAIL_SUBJECT_PREFIX') ? EMAIL_SUBJECT_PREFIX : '[Event System]') . " Set Your Coordinator Password";
                        $html_body = "
<html>
<head>
<meta charset='UTF-8'>
<style>
body { font-family: Arial, sans-serif; color: #333; }
.container { max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 5px; }
.header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
.content { padding: 20px; background: white; }
.button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
.footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class='container'>
<div class='header'><h2>Welcome to Event System</h2></div>
<div class='content'>
<p>Hello " . htmlspecialchars($coordinator_name) . ",</p>
<p>You have been registered as a coordinator in our Event Management System. Please set your password by clicking the button below:</p>
<p style='text-align: center;'><a href=\"" . htmlspecialchars($reset_link) . "\" class='button'>Set Your Password</a></p>
<p>Or copy this link in your browser:</p>
<p style='word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px; font-size: 12px;'>" . htmlspecialchars($reset_link) . "</p>
<p><strong>⏰ This link will expire in 24 hours.</strong></p>
<p>If you did not request this, please contact your administrator immediately.</p>
<div class='footer'>
<p>This is an automated email. Please do not reply with sensitive information.</p>
<p>© 2026 Event Management System. All rights reserved.</p>
</div>
</div>
</div>
</body>
</html>
";
                        
                        $mailer = new SMTPMailer(
                            defined('SMTP_HOST') ? SMTP_HOST : 'smtp.gmail.com',
                            defined('SMTP_PORT') ? SMTP_PORT : 587,
                            defined('SMTP_USER') ? SMTP_USER : '',
                            defined('SMTP_PASSWORD') ? SMTP_PASSWORD : '',
                            defined('EMAIL_FROM') ? EMAIL_FROM : '',
                            defined('EMAIL_FROM_NAME') ? EMAIL_FROM_NAME : 'Event System'
                        );
                        
                        $mailer->sendGenericEmail($email, $subject, $html_body);
                        error_log("Password reset email sent to coordinator: " . $email);
                    }
                } catch (Exception $e) {
                    // Log email error but don't let it affect the coordinator creation success
                    error_log("Email error for coordinator $coordinator_id: " . $e->getMessage());
                }
            }
        }
    } catch (Exception $e) {
        error_log("Coordinator operation error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Handle both JSON and FormData
    $is_multipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
    
    if ($is_multipart) {
        $data = $_POST;
    } else {
        $data = json_decode(file_get_contents('php://input'), true);
    }
    
    $action = $data['action'] ?? '';
    
    // Handle activate action (simple status update)
    if ($action === 'activate') {
        $coordinator_id = intval($data['coordinator_id'] ?? 0);
        $is_active = intval($data['is_active'] ?? 1);
        
        if (!$coordinator_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Coordinator ID is required']);
            exit;
        }
        
        $query = "UPDATE coordinators SET is_active = ? WHERE coordinator_id = ?";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        $stmt->bind_param('ii', $is_active, $coordinator_id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Coordinator activated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to activate coordinator: ' . $stmt->error]);
        }
        $stmt->close();
        exit;
    }
    
    // Update coordinator
    $coordinator_id = intval($data['coordinator_id'] ?? 0);
    $coordinator_name = $data['coordinator_name'] ?? '';
    $email = $data['email'] ?? '';
    $contact_number = $data['contact_number'] ?? '';
    $company = $data['company'] ?? '';
    $job_title = $data['job_title'] ?? '';
    $event_id = intval($data['event_id'] ?? 0);
    $image_file = $is_multipart ? ($_FILES['image'] ?? null) : null;
    
    if (!$coordinator_id || !$coordinator_name || !$email) {
        echo json_encode(['success' => false, 'message' => 'ID, name and email are required']);
        exit;
    }
    
    // Handle image upload
    $coordinator_image = null;
    $update_image = false;
    
    if ($image_file && $image_file['size'] > 0) {
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($image_file['type'], $allowed_types)) {
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed']);
            exit;
        }
        
        if ($image_file['size'] > 5 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'File size must not exceed 5MB']);
            exit;
        }
        
        // Create upload directory if it doesn't exist
        $upload_dir = '../uploads/coordinators/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        // Delete old image if exists
        $old_image_query = "SELECT coordinator_image FROM coordinators WHERE coordinator_id = ?";
        $old_stmt = $conn->prepare($old_image_query);
        $old_stmt->bind_param('i', $coordinator_id);
        $old_stmt->execute();
        $old_result = $old_stmt->get_result();
        if ($old_result->num_rows > 0) {
            $old_row = $old_result->fetch_assoc();
            $old_image_path = $upload_dir . $old_row['coordinator_image'];
            if (file_exists($old_image_path)) {
                unlink($old_image_path);
            }
        }
        
        // Generate unique filename
        $file_ext = pathinfo($image_file['name'], PATHINFO_EXTENSION);
        $coordinator_image = 'coordinator_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $file_ext;
        $upload_path = $upload_dir . $coordinator_image;
        
        if (!move_uploaded_file($image_file['tmp_name'], $upload_path)) {
            echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
            exit;
        }
        
        $update_image = true;
    }
    
    // Build update query
    if ($update_image) {
        $query = "UPDATE coordinators SET 
                  coordinator_name = ?, 
                  email = ?, 
                  contact_number = ?,
                  company = ?,
                  job_title = ?,
                  coordinator_image = ?,
                  event_id = ?
                  WHERE coordinator_id = ?";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ssssssii', $coordinator_name, $email, $contact_number, $company, $job_title, $coordinator_image, $event_id, $coordinator_id);
    } else {
        $query = "UPDATE coordinators SET 
                  coordinator_name = ?, 
                  email = ?, 
                  contact_number = ?,
                  company = ?,
                  job_title = ?,
                  event_id = ?
                  WHERE coordinator_id = ?";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('sssssii', $coordinator_name, $email, $contact_number, $company, $job_title, $event_id, $coordinator_id);
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Coordinator updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update coordinator: ' . $stmt->error]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Delete coordinator
    $data = json_decode(file_get_contents('php://input'), true);
    
    $coordinator_id = intval($data['coordinator_id'] ?? 0);
    
    if (!$coordinator_id) {
        echo json_encode(['success' => false, 'message' => 'Coordinator ID required']);
        exit;
    }
    
    $query = "DELETE FROM coordinators WHERE coordinator_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $coordinator_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Coordinator deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete coordinator: ' . $stmt->error]);
    }
}
?>
