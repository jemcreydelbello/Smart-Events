-- Create email_configurations table for storing SMTP settings
CREATE TABLE IF NOT EXISTS email_configurations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INT NOT NULL DEFAULT 587,
    smtp_user VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(500) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    email_on_user_create BOOLEAN DEFAULT 1,
    email_on_event_create BOOLEAN DEFAULT 1,
    email_reminders BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES admins(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for faster queries
CREATE INDEX idx_updated_at ON email_configurations(updated_at);

-- Insert default configuration if table is empty
INSERT INTO email_configurations (
    smtp_host, 
    smtp_port, 
    smtp_user, 
    smtp_password, 
    from_name, 
    from_email, 
    email_on_user_create, 
    email_on_event_create, 
    email_reminders
) SELECT 
    'smtp.gmail.com',
    587,
    'your-email@gmail.com',
    'app-password-here',
    'Smart Events Team',
    'noreply@smartevents.com',
    1,
    1,
    1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM email_configurations LIMIT 1);
