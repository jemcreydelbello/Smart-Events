<?php
header('Content-Type: application/json');
require_once '../db_config.php';

// Check if tables exist
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['check'])) {
    try {
        // Check if admins table exists
        $query = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
                 WHERE TABLE_SCHEMA = 'eventsystem' AND TABLE_NAME = 'admins'";
        $result = $conn->query($query);
        
        echo json_encode([
            'success' => true,
            'exists' => ($result && $result->num_rows > 0)
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
    exit;
}

// Create admin tables
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $conn->begin_transaction();
        
        // Create admins table
        $adminsTable = "CREATE TABLE IF NOT EXISTS admins (
            admin_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(150) NOT NULL,
            department_id INT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            last_login DATETIME NULL,
            login_attempts INT DEFAULT 0,
            locked_until DATETIME NULL,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (department_id) REFERENCES departments(department_id)
        )";
        
        if (!$conn->query($adminsTable)) {
            throw new Exception('Failed to create admins table: ' . $conn->error);
        }
        
        // Create indexes
        $indexQueries = [
            "CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)",
            "CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)",
            "CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status)"
        ];
        
        foreach ($indexQueries as $indexQuery) {
            if (!$conn->query($indexQuery)) {
                throw new Exception('Failed to create index: ' . $conn->error);
            }
        }
        
        // Create admin login logs table
        $logsTable = "CREATE TABLE IF NOT EXISTS admin_login_logs (
            login_log_id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id INT NOT NULL,
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            logout_time DATETIME NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            success BOOLEAN DEFAULT TRUE,
            reason VARCHAR(255) NULL,
            
            FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
        )";
        
        if (!$conn->query($logsTable)) {
            throw new Exception('Failed to create admin_login_logs table: ' . $conn->error);
        }
        
        // Insert default admin account with bcrypt hash of 'admin123'
        // Hash: $2y$10$YNP8VfqbXFq5fT8C5hWJZ.p5gGZnD3eKq3K5k5k5k5k5k5k5k5k5k
        $defaultPassword = password_hash('admin123', PASSWORD_BCRYPT);
        
        $checkAdmin = $conn->query("SELECT admin_id FROM admins WHERE username = 'admin'");
        
        if ($checkAdmin && $checkAdmin->num_rows === 0) {
            $insertAdmin = "INSERT INTO admins (username, email, password_hash, full_name, status) 
                           VALUES ('admin', 'admin@wells-fargo.com', ?, 'Admin User', 'active')";
            
            $stmt = $conn->prepare($insertAdmin);
            if (!$stmt) {
                throw new Exception('Failed to prepare insert statement: ' . $conn->error);
            }
            
            $stmt->bind_param('s', $defaultPassword);
            if (!$stmt->execute()) {
                throw new Exception('Failed to insert default admin: ' . $stmt->error);
            }
        }
        
        $conn->commit();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Admin tables created successfully',
            'details' => [
                'tables_created' => ['admins', 'admin_login_logs'],
                'default_admin' => [
                    'username' => 'admin',
                    'email' => 'admin@wells-fargo.com',
                    'password' => 'admin123 (temporarily - change after login)'
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>
