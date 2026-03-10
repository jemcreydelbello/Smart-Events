<?php
// Debug version that logs to file
$debugLog = dirname(__DIR__) . '/admins-debug.log';

function writeDebug($msg) {
    global $debugLog;
    file_put_contents($debugLog, date('Y-m-d H:i:s') . ' - ' . $msg . "\n", FILE_APPEND);
}

writeDebug("===== START REQUEST =====");
writeDebug("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
writeDebug("GET action: " . ($_GET['action'] ?? 'none'));

ob_start();
writeDebug("ob_start() called");

header('Content-Type: application/json; charset=utf-8');
writeDebug("Content-Type header set");

try {
    writeDebug("About to require config/db.php");
    require_once dirname(__DIR__) . '/config/db.php';
    writeDebug("config/db.php loaded successfully");
    
    if (!isset($conn) || !$conn || $conn->connect_error) {
        throw new Exception('Database connection not available: ' . ($conn->connect_error ?? 'Unknown error'));
    }
    writeDebug("Database connection verified");
    
} catch (Exception $e) {
    writeDebug("Exception in DB config: " . $e->getMessage());
    http_response_code(500);
    $response = json_encode(['success' => false, 'message' => 'Database config failed: ' . $e->getMessage()]);
    writeDebug("About to echo (length: " . strlen($response) . "): " . $response);
    echo $response;
    writeDebug("Echoed response, about to exit");
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
writeDebug("Action: " . $action);

// GET - Retrieve admins
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    writeDebug("Processing GET request");
    
    try {
        if ($action === 'list') {
            writeDebug("Processing list action");
            
            $query = "SELECT admin_id as user_id, email, full_name, created_at, status, admin_image FROM admins ORDER BY created_at DESC";
            writeDebug("Query: " . $query);
            
            $result = $conn->query($query);
            writeDebug("Query executed, result type: " . gettype($result));
            
            if (!$result) {
                throw new Exception('Query failed: ' . $conn->error);
            }
            
            $admins = [];
            writeDebug("num_rows: " . $result->num_rows);
            
            if ($result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $admins[] = $row;
                    writeDebug("Added admin: " . $row['email']);
                }
            }
            
            writeDebug("Admins array (before encode): " . var_export($admins, true));
            writeDebug("Array count: " . count($admins));
            
            $dataToEncode = [
                'success' => true,
                'data' => $admins,
                'total' => count($admins)
            ];
            writeDebug("Data to encode: " . var_export($dataToEncode, true));
            
            $response = json_encode($dataToEncode);
            writeDebug("json_encode error (if any): " . (json_last_error() ? json_last_error_msg() : 'none'));
            writeDebug("Response: '" . $response . "'");
            writeDebug("Response length: " . strlen($response));
            writeDebug("About to output response (status 200)");
            
            http_response_code(200);
            echo $response;
            writeDebug("Response echoed, about to exit");
            exit;
            
        } else {
            writeDebug("Unknown action: " . $action);
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Unknown action']);
            exit;
        }
        
    } catch (Exception $e) {
        writeDebug("Exception in GET handler: " . $e->getMessage());
        http_response_code(400);
        $response = json_encode(['success' => false, 'message' => $e->getMessage()]);
        writeDebug("About to output error: " . $response);
        echo $response;
        exit;
    }
}else {
    writeDebug("Not a GET request: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

writeDebug("===== END REQUEST =====");
?>
