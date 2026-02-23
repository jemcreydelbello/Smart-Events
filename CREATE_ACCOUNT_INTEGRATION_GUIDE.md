# Create Account Form - Database Integration Guide

## ✅ Setup Completed

Your Create Account form is now fully connected to the database. Here's what was configured:

### 1. **Database Schema**
New columns added to `coordinators` table:
- `company` VARCHAR(150) - Optional company name
- `job_title` VARCHAR(150) - Optional job title  
- `coordinator_image` VARCHAR(255) - Profile image path

### 2. **API Endpoints**
Both endpoints now accept file uploads and save all data:

**Create Coordinator** → `POST /api/coordinators.php`
- Accepts: FormData with name, email, company, job_title, contact_number, image
- Saves to: `uploads/coordinators/` folder
- Response: JSON with success status and coordinator_id

**Create Admin** → `POST /api/admins.php`
- Accepts: FormData with full_name, email, password, image
- Saves to: `uploads/admins/` folder
- Response: JSON with success status and admin_id

### 3. **Frontend Form**
Located in: `admin/index.html` (Create Account Modal)
- Role selector shows/hides coordinator vs admin fields
- All fields properly connected via JavaScript
- Images uploaded via FormData (not base64)

---

## 📋 Testing Checklist

### Test 1: Create Coordinator Account
1. Open Admin Dashboard → Users page
2. Click **Create Account** button
3. Select **Coordinator** from Role dropdown
4. Fill in fields:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Company: `Tech Corp`
   - Job Title: `Senior Developer`
   - Contact: `+63 9XX XXX XXXX`
   - Image: Upload a profile photo (optional)
5. Click **Create**
6. ✅ Should show "Coordinator created successfully!"
7. Check database:
   ```sql
   SELECT * FROM coordinators WHERE email = 'john@example.com';
   ```
   - Should have all fields populated including image filename

### Test 2: Create Admin Account
1. Click **Create Account** button again
2. Select **Admin** from Role dropdown
3. Fill in fields:
   - Full Name: `Jane Smith`
   - Email: `jane@example.com`
   - Password: `SecurePass123`
   - Image: Upload a profile photo (optional)
4. Click **Create**
5. ✅ Should show "Admin created successfully!"
6. Check database:
   ```sql
   SELECT * FROM admins WHERE email = 'jane@example.com';
   ```
   - Should have all fields including image if uploaded

### Test 3: Verify Image Upload
1. After creating coordinator/admin with image
2. Check file system:
   - Coordinators: `uploads/coordinators/coordinator_*.jpg`
   - Admins: `uploads/admins/admin_*.jpg`
3. Each should have unique filename with timestamp

---

## 🔧 Field Mapping Reference

### Frontend → API Mapping

**Coordinator Fields:**
| Form Field | HTML ID | API Parameter | DB Column |
|---|---|---|---|
| Name | `createCoord_name` | `coordinator_name` | `coordinator_name` |
| Email | `createCoord_email` | `email` | `email` |
| Company | `createCoord_company` | `company` | `company` |
| Job Title | `createCoord_jobTitle` | `job_title` | `job_title` |
| Contact | `createCoord_contact` | `contact_number` | `contact_number` |
| Image | `createCoord_image` | `image` (file) | `coordinator_image` |

**Admin Fields:**
| Form Field | HTML ID | API Parameter | DB Column |
|---|---|---|---|
| Full Name | `createAdmin_fullName` | `full_name` | `full_name` |
| Email | `createAdmin_email` | `email` | `email` |
| Password | `createAdmin_password` | `password` | `password_hash` |
| Image | `createAdmin_image` | `image` (file) | `admin_image` |

---

## 🔍 Debugging Tips

### Issue: "Failed to upload image"
**Solution:**
1. Check `uploads/` folder exists and writable
2. Enable folder creation:
   ```bash
   mkdir -p uploads/coordinators
   mkdir -p uploads/admins
   chmod 755 uploads
   ```
3. Verify image file < 5MB and is JPEG/PNG/GIF/WebP

### Issue: "Email already exists"
**Solution:**
- Check existing records in database
- Email must be unique across coordinators

### Issue: Form not submitting
**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for JavaScript errors
3. Verify form fields have correct IDs matching code

### Issue: Data not saving to database
**Solution:**
1. Check error logs:
   ```bash
   tail -f c:\xampp\apache\logs\error.log
   ```
2. Verify database columns exist:
   ```sql
   SHOW COLUMNS FROM coordinators;
   ```
3. Check API response in Network tab (F12)

---

## 📁 File Locations

**Key Files:**
- Frontend Form: `admin/index.html` (lines 884-970)
- JavaScript: `admin/js/main.js` (functions: submitCreateCoordinator, submitCreateAdmin)
- API: `api/coordinators.php`, `api/admins.php`
- Database: `coordinators` table

**Upload Directories:**
- Coordinators: `uploads/coordinators/`
- Admins: `uploads/admins/`

---

## ✨ Features

✅ Role-based field visibility (Coordinator vs Admin)
✅ Image upload support with validation
✅ Automatic image storage with unique names
✅ Email validation and duplicate checking
✅ Password hashing for admins
✅ Reset token generation for coordinator password setup
✅ Audit logging of account creation
✅ Real-time form validation

---

## 📞 Support

If you encounter issues:
1. Check Console tab in DevTools for errors
2. Check browser Network tab for API response
3. Check database for data presence
4. Review logs in `php_mysql.log` or Apache error log
