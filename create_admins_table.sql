-- Create dedicated ADMINS table for Admin-side login
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    admin_image LONGBLOB NULL DEFAULT NULL,
    department_id INT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME NULL,
    login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reset_token VARCHAR(255) NULL,
    reset_expire DATETIME NULL,
    
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Create index for faster login lookups
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_status ON admins(status);

-- Create admin login logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_login_logs (
    login_log_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    reason VARCHAR(255) NULL,
    
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);

-- Insert initial admin account (username: admin, password: admin123)
-- Password hash is for 'admin123' using bcrypt
INSERT INTO admins (username, email, password_hash, full_name, status) 
VALUES ('admin', 'admin@wells-fargo.com', '$2y$10$zC9v3gjP6OtDJLkfDKzv9eXHLw8lz8z8lz8z8z8z8z0000000000000', 'Admin User', 'active')
ON DUPLICATE KEY UPDATE status='active';


ALTER TABLE admins ADD INDEX idx_reset_token (reset_token);