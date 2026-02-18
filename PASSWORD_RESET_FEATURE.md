# Password Reset Feature - Setup Guide

## Overview
This document provides a complete guide to the password reset functionality added to the Event System.

## Files Created

### Frontend Files (Password Reset UI)

#### 1. **admin/forget-password.php**
- **Purpose**: First page where admins enter their email to request a password reset
- **Location**: `/admin/forget-password.php`
- **Features**:
  - Email validation (client and server-side)
  - Beautiful responsive UI with gradient background
  - SweetAlert2 notifications
  - Enter key support for quick submission
  - Disabled button during submission
  - Back to login link

#### 2. **admin/reset-password.php**
- **Purpose**: Page where admins set their new password after clicking email link
- **Location**: `/admin/reset-password.php`
- **Features**:
  - Token validation (expires after 15 minutes)
  - Real-time password strength indicator
  - Password requirements display:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
  - Password confirmation verification
  - Enter key support
  - Responsive design with modern UI

### API Files (Backend Logic)

#### 3. **api/send-reset.php**
- **Purpose**: Handles the password reset email sending
- **Location**: `/api/send-reset.php`
- **Process**:
  1. Validates email exists in database
  2. Generates secure 64-character token
  3. Token expires in 15 minutes
  4. Sends email with reset link via PHPMailer
  5. Used HTML-formatted email
  6. Returns success/error message

#### 4. **api/update-password.php**
- **Purpose**: Validates token and updates password in database
- **Location**: `/api/update-password.php`
- **Process**:
  1. Validates token is provided
  2. Hashes new password with bcrypt (PASSWORD_DEFAULT)
  3. Updates password in database
  4. Clears reset_token and reset_expire
  5. Returns success/error message

### Configuration Files

#### 5. **config/db.php**
- **Purpose**: Database connection configuration (copy of db_config.php)
- **Location**: `/config/db.php`
- **Created for**: Consistent include paths across API files

## Database Changes

### Columns Added to `admins` Table
```sql
ALTER TABLE admins
ADD reset_token VARCHAR(255) NULL,
ADD reset_expire DATETIME NULL;

CREATE INDEX idx_reset_token ON admins(reset_token);
```

**Note**: These columns are already present in the current database schema (create_admins_table.sql)

## Modified Files

### 1. **admin/login.html**
- **Change**: Updated "Forgot Password" link to point to forget-password.php
- **Before**: `<a href="#">Click Here</a>`
- **After**: `<a href="forget-password.php">Click Here</a>`

## Complete Flow

```
1. Admin visits login page
   ↓
2. Admin clicks "Forgot Password?" link
   ↓
3. Opens forget-password.php
   - Admin enters their email
   - Server validates email exists
   ↓
4. System sends email via PHPMailer
   - Email contains reset link with token
   - Link: /admin/reset-password.php?token=<64-char-token>
   ↓
5. Admin clicks email link
   ↓
6. Opens reset-password.php
   - Token is validated (must not be expired)
   - If valid, shows password reset form
   ↓
7. Admin enters new password
   - Password strength checked
   - Password confirmation verified
   ↓
8. System calls api/update-password.php
   - Password is hashed with bcrypt
   - Reset token and expiration are cleared
   ↓
9. Admin redirected to login.html
   ↓
10. Admin logs in with new password
```

## Security Features

✅ **Token Security**
- 64-character random token (bin2hex of 32 random bytes)
- Tokens stored in database
- Tokens expire after 15 minutes

✅ **Password Security**
- Passwords hashed with bcrypt (PASSWORD_DEFAULT)
- Minimum 8 characters enforced
- Strength requirements displayed to users

✅ **Email Security**
- Email validation (format check)
- Server-side validation
- Using PHPMailer with SMTP (not mail())

✅ **Database Security**
- Prepared statements (no SQL injection)
- Reset token indexed for fast lookups
- No sensitive data in error messages

## Configuration Requirements

### Email Settings (Already Configured)
File: `/config/email_config.php`

```php
define('EMAIL_FROM', 'we555tuna@gmail.com');
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'we555tuna@gmail.com');
define('SMTP_PASSWORD', 'ompy vdhm esps eset'); // App Password
define('ORG_WEBSITE', 'http://localhost/EventSystem');
```

### Database Configuration
File: `/config/db.php` (or `/db_config.php`)

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'eventsystem');
```

## Testing the Feature

### Step 1: Verify Database
```sql
-- Check if columns exist
DESCRIBE admins;
-- Should show: reset_token, reset_expire
```

### Step 2: Test Email Sending
1. Go to: `http://localhost/EventSystem/admin/login.html`
2. Click "Forgot Password?"
3. Enter a valid admin email (e.g., admin@wells-fargo.com)
4. Check email inbox for reset link

### Step 3: Test Password Reset
1. Click the reset link from email
2. Should show password reset form (if link not expired)
3. Enter new password meeting requirements
4. Confirm password
5. Click "Update Password"
6. Should be redirected to login
7. Try logging in with new password

### Step 4: Test Error Handling
- Invalid email: Should show "email not found" message
- Expired token: Should show "invalid or expired link"
- Non-matching passwords: Should show validation error
- Weak password: Should show requirements not met

## Troubleshooting

### Issue: "Email could not be sent"
**Solution**: Check SMTP settings in `/config/email_config.php`
- Verify Gmail App Password is correct
- Check firewall allows port 587
- Ensure 2FA is enabled on Gmail account

### Issue: "Database error"
**Solution**: Check database connection in `/config/db.php`
- Verify credentials are correct
- Ensure MySQLi extension is enabled
- Check if admins table exists

### Issue: "Invalid or expired link"
**Solution**: 
- Token expires after 15 minutes
- Browser cache might be serving old page; do a hard refresh
- Check if token exists in database

### Issue: "Reset link sent but no email received"
**Solution**:
- Check Gmail spam folder
- Verify email address is correct in admins table
- Check server error logs

## File Structure

```
EventSystem/
├── admin/
│   ├── login.html (MODIFIED)
│   ├── forget-password.php (NEW)
│   └── reset-password.php (NEW)
├── api/
│   ├── send-reset.php (NEW)
│   └── update-password.php (NEW)
├── config/
│   ├── db.php (NEW)
│   └── email_config.php (existing)
└── PASSWORD_RESET_SETUP.sql (NEW)
```

## Summary of Changes

| File | Type | Status | Purpose |
|------|------|--------|---------|
| admin/forget-password.php | Frontend | NEW | Request password reset form |
| admin/reset-password.php | Frontend | NEW | Set new password form |
| api/send-reset.php | Backend | NEW | Send reset email |
| api/update-password.php | Backend | NEW | Update password in DB |
| config/db.php | Config | NEW | Database connection |
| admin/login.html | Frontend | MODIFIED | Added forgot password link |
| PASSWORD_RESET_SETUP.sql | Migration | NEW | Database schema migration |

## Next Steps

1. ✅ All files have been created
2. ✅ Login page has been updated with "Forgot Password" link
3. ✅ Database columns already exist (verify with SQL query if needed)
4. Test the complete flow with a test admin account
5. Monitor email delivery and server logs

## Support

For issues or questions:
1. Check error logs in server error log
2. Enable debugging by checking browser console (F12)
3. Verify all files exist in correct locations
4. Test database connectivity
5. Confirm email credentials are valid
