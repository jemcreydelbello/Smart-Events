# 🔧 FIX: CORS Error - How To Access Login Page Correctly

## The Problem
You are seeing this error:
```
Access to fetch at 'file:///C:/xampp/htdocs/Smart-Events/api/admin_login.php?action=login' 
from origin 'null' has been blocked by CORS policy
```

**Reason:** You are opening the login page using **`file:///`** (direct file path) instead of **`http://localhost/`** (web server).

---

## ✅ THE SOLUTION

### Option 1: Use The Automatic Script (EASIEST)

1. **Open File Explorer**
2. **Navigate to:** `C:\xampp\htdocs\Smart-Events\`
3. **Double-click:** `START_LOGIN.bat`
4. Your browser will automatically open the correct page

[Image: Shows file browser with START_LOGIN.bat file]

---

### Option 2: Manual - Type in Browser Address Bar

1. **Open your browser** (Chrome, Firefox, Edge, etc.)
2. **Click the address bar** at the top
3. **Clear it completely** (Select all + Delete)
4. **Type exactly:**
   ```
   http://localhost/Smart-Events/admin/login.html
   ```
5. **Press Enter**

[Image: Browser address bar showing http://localhost/...]

---

### Option 3: From Home Page

1. **Go to:** `http://localhost/Smart-Events/`
2. **Click:** "Login to Dashboard" button
3. You'll be taken to the login page

---

## ❌ WRONG Ways (Do NOT Do These)

| ❌ Wrong | ✅ Right |
|---------|---------|
| `file:///C:/xampp/htdocs/...` | `http://localhost/Smart-Events/...` |
| Opening file from File Explorer | Using browser address bar with http:// |
| VS Code Preview panel | Using actual browser (Chrome, Firefox, etc.) |
| Dragging file to browser | Typing URL in address bar |

---

## 📝 Login Credentials

```
Username: admin
Password: admin123
```

---

## 🆘 Troubleshooting

### If the page still doesn't load:

1. **Check if XAMPP is running:**
   - Open XAMPP Control Panel
   - Apache and MySQL should have green "Running" indicators
   - If not, click "Start" button

2. **Clear browser cache:**
   - Press: `Ctrl + Shift + Delete`
   - Select "All time"
   - Check: Cookies, Cache
   - Click "Clear data"

3. **Try different browser:**
   - Try Chrome, Firefox, or Edge
   - Some browsers cache more aggressively

4. **Check if port 80 is blocked:**
   - Open Command Prompt (cmd)
   - Run: `netstat -ano | findstr ":80"`
   - If something is using port 80, change Apache port in config

5. **Test the API endpoint:**
   - Go to: `http://localhost/Smart-Events/api/admin_login.php`
   - You should see a JSON error (that's normal)
   - If you see nothing, Apache isn't running

---

## 🎯 Why This Matters

| Protocol | What It Does | Works For |
|----------|-------------|-----------|
| `file:///` | Opens file directly from disk | Static HTML only ❌ |
| `http://localhost` | Goes through Apache web server | PHP, Database, AJAX ✅ |

When you use `file:///`, the browser treats it as a local file, not a web page. This blocks all network requests (fetch, AJAX) for security reasons - **you'll get CORS errors**.

---

## 📍 Quick URL Reference

| Purpose | URL |
|---------|-----|
| Home Page | `http://localhost/Smart-Events/` |
| Login Page | `http://localhost/Smart-Events/admin/login.html` |
| Admin Dashboard | `http://localhost/Smart-Events/admin/index.html` |
| API Endpoint | `http://localhost/Smart-Events/api/admin_login.php` |

---

## ✅ Verification Checklist

Before trying to login, make sure:
- [ ] You're using `http://localhost` URL (not `file:///`)
- [ ] XAMPP Apache is running (green indicator)
- [ ] MySQL is running (for database)
- [ ] Browser shows page content (not a download)
- [ ] No CORS error in console
- [ ] Address bar shows `http://localhost/...`

---

## 🚀 Next Steps

1. **Use Option 1** (automatic script) OR **Type `http://localhost/Smart-Events/admin/login.html`** in address bar
2. **Login with:** 
   - Username: `admin`
   - Password: `admin123`
3. **You should see the dashboard!**

---

**If you follow these steps exactly, the CORS error will disappear and login will work!** 🎉
