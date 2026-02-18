# Admin Database & Login System Setup Guide

## Overview
A dedicated **admin accounts** table has been created in the database for secure admin login and authentication. This system is separate from the general users table and includes security features like:
- Bcrypt password hashing
- Failed login attempt tracking
- Account lockout after 5 failed attempts (30 minutes)
- Login/logout audit logs
- Session management

---

## Setup Instructions

### Step 1: Create Admin Tables (Quick Setup)

Navigate to the setup page and click the setup button:
```
http://localhost/EventSystem/admin/setup-admin-db.html
```

OR manually create the tables using the SQL file:
```
EventSystem/create_admins_table.sql
```

This creates:
- **admins** table - Stores admin accounts
- **admin_login_logs** table - Tracks login/logout activity

### Step 2: Default Admin Account

After setup, use these credentials to login:

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Email** | `admin@wells-fargo.com` |
| **Password** | `admin123` |

**⚠️ IMPORTANT:** Change the default password immediately after first login!

---

## Admin Table Structure

### admins Table

```
Column            Type           Description
─────────────────────────────────────────────────────────
admin_id          INT PK         Unique admin identifier
username          VARCHAR(100)   Login username (unique)
email             VARCHAR(150)   Email address (unique)
password_hash     VARCHAR(255)   Bcrypt hashed password
full_name         VARCHAR(150)   Admin's full name
department_id     INT FK         Department reference
status            ENUM           'active' or 'inactive'
last_login        DATETIME       Last login timestamp
login_attempts    INT            Failed login counter
locked_until      DATETIME       Account lock expiration
created_by        INT            Admin who created this account
created_at        TIMESTAMP      Account creation time
updated_at        TIMESTAMP      Last update time
```

### admin_login_logs Table

```
Column            Type           Description
─────────────────────────────────────────────────────────
login_log_id      INT PK         Log entry ID
admin_id          INT FK         Admin reference
login_time        TIMESTAMP      Login timestamp
logout_time       DATETIME       Logout timestamp
ip_address        VARCHAR(45)    Client IP address
user_agent        TEXT           Browser/client info
success           BOOLEAN        Login success flag
reason            VARCHAR(255)   Failure reason (if failed)
```

---

## API Endpoints

### Admin Login

**Endpoint:** `POST /api/admin_login.php?action=login`

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "admin": {
    "admin_id": 1,
    "username": "admin",
    "email": "admin@wells-fargo.com",
    "full_name": "Admin User"
  }
}
```

### Admin Logout

**Endpoint:** `POST /api/admin_login.php?action=logout`

**Request:**
```json
{
  "admin_id": 1
}
```

---

## Login Flow

### 1. Admin visits login page
```
http://localhost/EventSystem/admin/login.html
```

### 2. Admin enters credentials
- Username or Email
- Password

### 3. System validates credentials
- Checks if admin exists
- Verifies password (bcrypt)
- Checks if account is active
- Checks if account is locked

### 4. On successful login
- Admin data stored in `localStorage`
- Session management initialized
- Redirected to admin dashboard

### 5. On failed login
- Login attempts incremented
- After 5 failed attempts, account locked for 30 minutes
- Error message displayed

---

## Password Reset

To change a password:

1. Go to **Admin Users** page
2. Find the admin account
3. Click **"Edit"** button
4. Click **"Change Password"** button
5. Enter new password and confirm
6. Click **"Update Password"**

### Password Requirements
- Minimum 6 characters
- Hashed with bcrypt algorithm
- Never stored in plaintext

---

## Security Features

### 1. Bcrypt Password Hashing
All passwords are hashed using PHP's `password_hash()` function with BCRYPT algorithm.

### 2. Account Lockout
- 5 failed login attempts triggers 30-minute lockout
- Prevents brute force attacks
- Admin can unlock by waiting or admin changing password

### 3. Audit Trail
- Every login/logout is logged
- IP address and user agent recorded
- Can be viewed in **Activity Logs**

### 4. Session Management
- Admin data stored securely in localStorage
- Automatic logout on page reload (if not logged in)
- "Remember me" option for convenience

---

## Managing Admin Accounts

### Create New Admin
1. Go to **Admin Users** page
2. Click **"+ Add Admin"** button
3. Enter:
   - Full Name
   - Email
   - Initial Password
4. Click **"Create Admin"**

### Edit Admin Details
1. Go to **Admin Users** page
2. Click **"Edit"** on the admin row
3. Modify Full Name or Email
4. Click **"Update Admin"**

### Change Admin Password
1. Go to **Admin Users** page
2. Click **"Edit"** on the admin row
3. Click **"Change Password"** button
4. Enter new password and confirm
5. Click **"Update Password"**

### Delete Admin Account
1. Go to **Admin Users** page
2. Click **"Delete"** on the admin row
3. Confirm deletion
4. ⚠️ Cannot delete your own account

---

## Troubleshooting

### Issue: "Invalid username or email"
- Check if username/email is spelled correctly
- Admin account must exist in `admins` table
- Username/email are case-sensitive

### Issue: "Account is temporarily locked"
- Account was locked due to 5 failed login attempts
- Wait 30 minutes for automatic unlock
- Or admin can reset password to unlock

### Issue: "Your account is inactive"
- Admin status is set to 'inactive'
- Contact system administrator to reactivate

### Issue: "Items not authenticating"
- Check if admin data is in localStorage
- Try clearing localStorage and logging in again
- Verify admin is in `admins` table with 'active' status

### Issue: "Table doesn't exist" error
- Run the database setup: `setup-admin-db.html`
- Or manually execute `create_admins_table.sql`
- Verify MySQL connection in `db_config.php`

---

## File Locations

| File | Purpose |
|------|---------|
| `/admin/login.html` | Admin login page |
| `/admin/setup-admin-db.html` | Database setup wizard |
| `/api/admin_login.php` | Login/logout API |
| `/api/admin_table_setup.php` | Table creation API |
| `create_admins_table.sql` | SQL migration script |

---

## Database Connection

Connection details in `/db_config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'eventsystem');
```

Ensure MySQL is running and credentials are correct!

---

## Support & Questions

For issues or questions:
1. Check the **Troubleshooting** section above
2. Review **Activity Logs** for admin actions
3. Check browser console for errors
4. Verify database tables exist

---

**Last Updated:** February 10, 2026  
**Version:** 1.0
