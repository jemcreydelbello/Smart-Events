# 🔍 HOW TO VIEW REGISTRATIONS - COMPLETE GUIDE

## ✅ REGISTRATIONS ARE WORKING!

Your registrations **ARE being connected to participants** properly. The system is functioning correctly.

### Current Registrations in Database:
```
Event 9 (qwerty) - 4 participants:
  1. Edrian Catabay Dela Peña (delapenaedrian555@gmail.com) - ATTENDED
  2. John Smith (john.smith@example.com) - REGISTERED  
  3. Jane Doe (jane.doe@example.com) - REGISTERED
  4. User (manojtelang18@gmail.com) - REGISTERED
```

---

## 🎯 HOW TO VIEW REGISTRATIONS IN ADMIN

### ✨ Method 1: Use Quick Verification Page (EASIEST)

1. Open: `http://localhost/Smart-Events/admin/verify-registrations.html`
2. Select an event from the dropdown
3. Click "Load Participants"
4. ✅ See all registrations for that event

**This is the fastest way to verify everything is working!**

---

### Method 2: Event Details Page

To view registrations for a **specific event**, you MUST include the event ID in the URL:

#### ✅ CORRECT URL FORMAT:
```
http://localhost/Smart-Events/admin/event-details-simple.html?id=9
```

#### ❌ WRONG (won't show participants):
```
http://localhost/Smart-Events/admin/event-details-simple.html
```

**Important:** The `?id=9` parameter is **REQUIRED** to load event data!

#### How It Works:
1. Navigate to: `http://localhost/Smart-Events/admin/event-details-simple.html?id=9`
2. The page will load **Event 9 (qwerty)** details
3. Click on the **"Attendees"** tab
4. You'll see all 4 registered participants in a table

---

### Method 3: Admin Dashboard

**Problem:** The main admin dashboard's "Participants" page is showing ALL participants from all events, not filtered by event. This is by design but can be confusing.

**Solution:** Use Method 1 or 2 instead for event-specific participant lists.

---

## 🧪 HOW TO TEST THE FULL FLOW

### Step 1: Register on Client-Side
```
1. Go to: http://localhost/Smart-Events/client/
2. Scroll to "Upcoming Events"
3. Click on any public event (currently only "qwerty" is public)
4. Click "Register Now"
5. Fill out all fields:
   - Full Name: TEST USER
   - Company: TEST COMPANY
   - Job Title: TESTER
   - Email: test@example.com
   - Employee Code: EMP001
   - Phone: +1234567890
6. Click "Submit Registration"
7. You'll get a QR code confirmation ✓
```

### Step 2: Verify in Admin
```
1. Go to: http://localhost/Smart-Events/admin/verify-registrations.html
2. Select "Event 9: qwerty"
3. Click "Load Participants"
4. Look for your test user in the list
5. Verify the data matches what you entered ✓
```

OR use Method 2 URL directly:
```
http://localhost/Smart-Events/admin/event-details-simple.html?id=9
```

---

## 📊 DATABASE VERIFICATION

All registrations are stored correctly:

```sql
-- View all registrations
SELECT r.registration_id, u.full_name, e.event_name, r.status
FROM registrations r
JOIN users u ON r.user_id = u.user_id
JOIN events e ON r.event_id = e.event_id
ORDER BY r.registered_at DESC;

-- Check specific event
SELECT u.full_name, u.email, r.status, r.registration_code
FROM registrations r
JOIN users u ON r.user_id = u.user_id
WHERE r.event_id = 9;
```

---

## 🎯 QUICK REFERENCE

| What | Where | How |
|-----|-------|-----|
| **View all registrations** | `admin/verify-registrations.html` | Select event → Load |
| **View specific event** | `admin/event-details-simple.html?id=9` | Opens Event 9 details with attendees tab |
| **Register new participant** | `client/` → Find event → Register | Fill form → Submit |
| **Check database** | phpMyAdmin | Query `registrations` table |

---

## ✅ CONFIRMATION

**Your registration system is working perfectly!**
- ✓ Registrations being created
- ✓ Linked to correct events
- ✓ Stored in database properly
- ✓ Retrievable via API

The key was understanding that:
1. The event-details page needs the `?id=X` URL parameter
2. Some admin pages show all data, others show event-specific data
3. The database and API are functioning correctly

---

## 🔗 USEFUL LINKS

- 🏠 Client Homepage: `http://localhost/Smart-Events/client/`
- 🎯 Verify Registrations: `http://localhost/Smart-Events/admin/verify-registrations.html`
- 📋 Event Details: `http://localhost/Smart-Events/admin/event-details-simple.html?id=9`
- 📊 Admin Dashboard: `http://localhost/Smart-Events/admin/`

---

## 💡 STILL NOT SEEING REGISTRATIONS?

**Checklist:**
1. ✓ Are you using the correct URL with `?id=9` parameter?
2. ✓ Did you register for Event 9 (qwerty)?
3. ✓ Did you fill out ALL required fields in the registration form?
4. ✓ Did you see the QR code confirmation after submitting?
5. ✓ Did you wait a few seconds after submitting?

If answers to all above are YES, your registration should appear in the admin participants list!

