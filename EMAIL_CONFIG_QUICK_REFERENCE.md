# Email Configuration - Quick Reference Card

For: **Marketing Staff & Event Coordinators**

---

## What This Does

Allows you to set up the email sender WITHOUT touching code.  
The system will automatically send emails for:
- New user registrations
- Password resets
- Event notifications
- Event reminders

---

## Quick Setup (5 minutes)

### Step 1: Get SMTP Credentials

Choose your email provider and get the credentials:

#### **Gmail (Recommended)**
1. Go: https://myaccount.google.com/apppasswords
2. Generate an app password
3. Copy the 16-character password

```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [16-char app password]
From Email: your-email@gmail.com
From Name: Smart Events
```

#### **Outlook/Hotmail**
1. Go: https://account.microsoft.com
2. Generate app password
3. Copy password

```
Host: smtp-mail.outlook.com
Port: 587
Username: your-email@outlook.com
Password: [app password]
From Email: your-email@outlook.com
From Name: Smart Events
```

#### **Yahoo**
```
Host: smtp.yahoo.com
Port: 465
Username: your-email@yahoo.com
Password: [app password from Yahoo]
From Email: your-email@yahoo.com
From Name: Smart Events
```

### Step 2: Access Email Configuration

1. Admin Dashboard → Settings ⚙️
2. Click: **Email Configuration** tab
3. You'll see the form

### Step 3: Fill in SMTP Details

Copy & paste your credentials from Step 1:

| Field | Value |
|-------|-------|
| **SMTP Host** | smtp.gmail.com |
| **Port** | 587 |
| **Username** | your-email@gmail.com |
| **Password** | [16-char app password] |
| **From Name** | Smart Events Team |
| **From Email** | your-email@gmail.com |

### Step 4: Test Connection

Click: **🔍 Test Connection**

**Expected:**  
✅ "SMTP connection successful!"

**If it fails:**  
- Check Host/Port (most common issue)
- For Gmail: Make sure using App Password, not regular password
- Try Port 465 instead of 587

### Step 5: Enable Email Features

Check these boxes:
- ☑️ Send welcome emails to new users
- ☑️ Notify coordinators of new events
- ☑️ Send event reminders to participants

### Step 6: Save

Click: **💾 Save Email Configuration**

**Done!** ✅

---

## Verification

Create a test user with an email you can access:

1. Admin Dashboard → Users → Create New
2. Use a test email address
3. Wait 30 seconds
4. **Check your inbox** for welcome email
5. Check **spam folder** if not in inbox

✅ Email received = Everything works!

---

## Common Mistakes

| Problem | Fix |
|---------|-----|
| "Connection failed" | Check Host & Port spelling |
| Gmail says "Invalid" | Using regular password? Use **App Password** instead |
| Email goes to spam | Check From Name & Email look professional |
| No SMTP Password field in Gmail | Go: https://myaccount.google.com/apppasswords |
| "Port 587 doesn't work" | Try Port 465 instead |

---

## Important Notes

✅ **DO:**
- Use a dedicated email (not your personal account)
- Save SMTP Password somewhere secure
- Test before saving
- Check spam folder for test emails

❌ **DON'T:**
- Share SMTP password with non-admin users
- Use Gmail personal account for business emails
- Use telnet or FTP passwords
- Forget to use App Password for Gmail

---

## Need Help?

1. **Test Connection button fails?**  
   → Check SMTP Host and Port
   → For Gmail: Use App Password, not regular password

2. **Email doesn't send?**  
   → Check spam folder
   → Verify configuration saved (💾 button)
   → Create new test user

3. **Still stuck?**  
   → Ask your email provider for their SMTP settings
   → Contact your admin

---

## Support Resources

📖 Full Guide: `EMAIL_CONFIGURATION_GUIDE.md`  
API Docs: `api/email_config.php`  
Setup Script: `setup-email-config.php`

---

**Status:** ✅ Ready to Use  
**Time to Setup:** ~5 minutes  
**Difficulty:** ⭐ Easy (no code required)
