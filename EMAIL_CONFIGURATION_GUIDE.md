# Email Configuration Feature - Complete Guide

## Overview

The **Email Configuration** feature allows marketing staff and admins to set up SMTP email settings **without touching any code**. You can configure emails for:
- User registration (welcome emails)
- Password resets
- Event notifications
- Event reminders

## Initial Setup (One-Time)

### Step 1: Create the Database Table

1. Open your browser and go to:  
   ```
   http://localhost/Smart-Events/setup-email-config.php
   ```

2. You should see a green checkmark (✓) message:
   ```
   ✓ email_configurations table created successfully
   ✓ Default email configuration inserted
   ✓ Email configuration database setup complete!
   ```

3. If you see any errors, check your database is connected.

---

## Using Email Configuration

### Step 1: Navigate to Settings

1. Log in to the admin dashboard
2. Click the **⚙️ Settings** button in the left sidebar
3. You'll see three tabs at the top:
   - **👤 Profile** - Edit your name, company, contact info, and profile photo
   - **📋 Activity Logs** - View your recent actions
   - **📧 Email Configuration** ← Click this tab

### Step 2: Understand Each Section

#### **SMTP Server Settings** (Blue Section)

This is where you tell the system how to send emails. Think of it as the "mail carrier" settings.

**SMTP Host** - The email server address
- Gmail: `smtp.gmail.com`
- Outlook: `smtp-mail.outlook.com`
- Yahoo: `smtp.yahoo.com`
- Other: Ask your email provider

**Port** - The communication channel number
- **587** = TLS (most common, more modern)
- **465** = SSL (older, still secure)
- Ask your provider if unsure

**Username/Email** - Your email account credentials
- Usually your full email address
- Example: `team@smartevents.com`

**Password/App Password** - Your email password
- ⚠️ **IMPORTANT FOR GMAIL**: If you have 2-Factor Authentication (2FA) enabled, you CANNOT use your regular password. Instead:
  1. Go to: https://myaccount.google.com/apppasswords
  2. Generate an "App Password"
  3. Use that instead of your regular password
- For regular passwords, use your account password

#### **Email Sender Details** (Green Section)

This is what appears in the recipient's inbox.

**From Name** - The sender's display name
- What people see in their email client
- Example: `Smart Events Team` or `Event Notifications`
- Can be anything recognizable

**From Email** - The sender's email address
- Usually same as your SMTP username
- Example: `noreply@smartevents.com`
- Some providers require this to be your actual email

### Step 3: How to Get SMTP Credentials

#### **For Gmail:**

1. Go to: https://myaccount.google.com
2. Click **Security** on the left
3. Scroll down to **App passwords** 
4. Select App: **Mail** and Device: **Windows/Mac/Other device**
5. Google will generate a 16-character password
6. Use that in the **Password** field (ignore spaces)

**SMTP Settings:**
- Host: `smtp.gmail.com`
- Port: `587`
- Username: Your full Gmail address
- Password: 16-character app password (no spaces)

#### **For Outlook/Hotmail:**

1. Go to: https://account.microsoft.com
2. Click **Security** 
3. Set up **App passwords**
4. Use the generated password

**SMTP Settings:**
- Host: `smtp-mail.outlook.com`
- Port: `587`
- Username: Your email address
- Password: Your account password or generated app password

#### **For Yahoo:**

1. Go to: https://login.yahoo.com
2. Click account settings
3. Find **Generate app password**
4. Use the generated password

**SMTP Settings:**
- Host: `smtp.yahoo.com`
- Port: `465`
- Username: Your email address
- Password: Generated app password

#### **For Other Providers:**

Contact your email provider's support and ask for:
- SMTP server address
- SMTP port number
- Whether to use TLS or SSL
- Authentication credentials

---

## Step 4: Testing Your Configuration

1. **Fill in all SMTP fields** (Host, Port, Username, Password)
2. Click the **🔍 Test Connection** button
3. You'll see one of these messages:

**✅ Success:**  
"SMTP connection successful! (Connecting to smtp.gmail.com:587)"

**❌ Failed:**  
You'll see an error like:
- "Connection refused" = Wrong port or server
- "Authentication failed" = Wrong username/password
- "Host not found" = Wrong SMTP address

### Troubleshooting Test Failures:

| Error | Solution |
|-------|----------|
| "Connection refused" | Check port (usually 587 or 465) |
| "Host not found" | Check SMTP address spelling |
| "Authentication failed" | Check username and password (Gmail: use App Password if 2FA enabled) |
| "Timeout" | Provider may block port 587; try 465 |

---

## Step 5: Complete the Setup

1. **Fill in all fields:**
   - ✅ SMTP Host (required)
   - ✅ Port (required)
   - ✅ Username (required)
   - ✅ Password (required)
   - ✅ From Name (required)
   - ✅ From Email (required)

2. **Choose delivery preferences:**
   - ☑️ Send welcome emails to new users
   - ☑️ Notify coordinators of new events
   - ☑️ Send event reminders to participants

3. Click **💾 Save Email Configuration**

You'll see a green success message:  
**✅ Email configuration saved successfully!**

---

## Testing Actual Email Sending

Once you've saved the configuration:

1. **Create a test user** with an email address you can check
2. **Wait 30 seconds** for the welcome email to arrive
3. **Check the inbox** (and spam folder)

If the email arrives: ✅ Everything works!  
If the email doesn't arrive: ❌ Debug the SMTP settings

---

## Email Types Sent

Once configured, the system will automatically send emails for:

### 1. **New User Registration**
- Sent when: A new user registers or admin creates a user account
- Contains: Welcome message, login instructions, link to set password
- Only if: "Send welcome emails to new users" ✅

### 2. **Password Reset**
- Sent when: User clicks "Forgot Password"
- Contains: Password reset link and instructions
- Always sent (for security)

### 3. **Event Notifications**
- Sent when: Admin creates a new event
- Recipient: All coordinators
- Contains: Event details, date, time, location
- Only if: "Notify coordinators of new events" ✅

### 4. **Event Reminders**
- Sent when: Event is starting soon
- Recipient: All registered participants
- Contains: Event reminder and instructions
- Only if: "Send event reminders to participants" ✅

---

## Common Issues & Solutions

### Issue: "Validation failed: SMTP Password is required"
**Solution:** The Password field is empty. You must enter a password or app password.

### Issue: "SMTP connection test failed"
**Solution:** 
1. Double-check the SMTP host (spelling matters!)
2. Verify the port (587 or 465)
3. For Gmail, use App Password (not regular password)
4. Check if your firewall blocks outgoing email

### Issue: Emails not sending but configuration saved
**Solution:**
1. Test connection again (🔍 Test Connection button)
2. Check email spam folder
3. Verify "Send welcome emails to new users" is checked ✅
4. Create a new test user to trigger an email

### Issue: Google says "Could not authorize"
**Solution:**
1. You have 2FA enabled on Gmail ✅
2. Go to https://myaccount.google.com/apppasswords
3. Generate a NEW app password
4. Use that instead of regular password
5. Use the 16-character password exactly as Gmail gives it

### Issue: "From Email could not send"
**Solution:**
1. Some providers require the From Email to be the same as your SMTP username
2. Change From Email to match your SMTP Username
3. Try saving again

---

## Security Best Practices

### ✅ Do:
- Use a dedicated email account for sending (not your personal account)
- Use App Passwords for Gmail instead of regular passwords
- Store passwords securely (this system stores them encrypted in database)
- Test connection before saving to catch errors early
- Regularly review activity logs for suspicious changes

### ❌ Don't:
- Use your personal Gmail account for application emails
- Share SMTP credentials with marketing staff (they only need admin access)
- Save weak passwords
- Redistribute email configuration to non-admin users
- Use telnet or FTP passwords as SMTP passwords

---

## Advanced Configuration

### Using a Dedicated Email Service

For production, consider using a dedicated email service:

**Popular Options:**
- **SendGrid** - Enterprise grade
- **MailChimp** - Great for marketing
- **Amazon SES** - AWS integrated
- **Postmark** - Simple and reliable

These services provide:
- Better deliverability
- Email templates
- Analytics and tracking
- Bounce handling
- Compliance (GDPR, CAN-SPAM)

Each has an SMTP endpoint - just use their SMTP details in the Email Configuration form.

---

## Reloading Configuration

If you want to reload the saved configuration:

1. Click the **🔄 Reload** button
2. All fields will be restored to the last saved values
3. Useful if you accidentally edited a field

---

## Support

If you need help:

1. **Check the troubleshooting section** above
2. **Verify SMTP credentials** by testing with the 🔍 Test Connection button
3. **Ask your email provider** for their SMTP settings
4. Contact your system administrator

---

## Summary

✅ **You've successfully set up Email Configuration!**

The system can now:
- Send welcome emails to new users
- Send password reset emails
- Send event notifications to coordinators
- Send event reminders to participants

All without requiring any code changes.

**Next Steps:**
1. Make sure all SMTP fields are correctly filled ✓
2. Test the connection ✓
3. Save the configuration ✓
4. Create a test user to verify emails send correctly ✓
5. Check the spam folder if emails don't arrive ✓

---

**Last Updated:** Message 9 of Conversation  
**Feature Status:** ✅ Complete and Ready for Use
