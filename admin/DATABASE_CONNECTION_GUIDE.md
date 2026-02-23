# Admin Dashboard - Database Connection Guide

## Overview
The Admin Dashboard is now **fully connected to your Smart-Events database**. Here's how it all works:

### Connection Chain
```
HTML (index.html)
    ↓
dashboard-api.js (JavaScript API Client)
    ↓
PHP API Endpoints (../api/*.php)
    ↓
Database (via db_config.php)
```

## Quick Start

### 1. **Test the Dashboard**
Open your browser and visit:
```
http://localhost/Smart-Events/admin/
```

You should see:
- Dashboard with 4 KPI cards (Total Events, Registrations, Check-ins, Upcoming)
- Two charts showing trends and distribution
- Sidebar navigation with 9 pages

### 2. **Test API Connections**
To verify all database connections are working:
```
http://localhost/Smart-Events/admin/test-api.html
```

This will automatically test all endpoints:
- ✅ Dashboard API (statistics)
- ✅ Events API (event list)
- ✅ Participants API (registrations)
- ✅ Users API (admin users)
- ✅ Catalogue API (past events)
- ✅ Audit Logs API (activity logs)

**Expected Results:**
- All tests should show "✓ Connected & Working"
- If any fail, check the browser console for error details

## Troubleshooting

### Issue: "Failed to load dashboard data"

**Solution 1: Check API Endpoints**
Open browser DevTools (F12) → Network tab → click on failed request → see Response

**Solution 2: Verify Database Connection**
Check if `db_config.php` has correct credentials:
- File: `c:\xampp\htdocs\Smart-Events\db_config.php`
- Verify: `$servername`, `$username`, `$password`, `$database`

**Solution 3: Check Database Tables**
Ensure these tables exist in your database:
```sql
-- Required tables
- events
- registrations (or participants)
- users (or admins)
- audit_logs
```

### Issue: 404 Error on API Calls

**Verification:**
- Check file exists: `c:\xampp\htdocs\Smart-Events\api\{filename}.php`
- Verify files: `dashboard.php`, `events.php`, `participants.php`, `admins.php`, `catalogue.php`, `audit_logs.php`

### Issue: 500 Internal Server Error

**Causes:**
1. Database connection failed
2. Table structure mismatch
3. Missing data columns

**Solution:**
1. Check PHP error logs: `c:\xampp\apache\logs\error.log`
2. Or: Check `c:\xampp\htdocs\Smart-Events\` for error files

### Issue: Data Not Loading but API Returns Success

**Possible Causes:**
- No data in tables (empty result set)
- Database columns don't match API expectations

**Solution:**
Run test queries:
```php
// Test Events Table
SELECT COUNT(*) FROM events;
SELECT * FROM events LIMIT 5;

// Test Registrations Table
SELECT COUNT(*) FROM registrations;
SELECT * FROM registrations LIMIT 5;
```

## File Locations

```
Smart-Events/
├── admin/
│   ├── index.html                 ← Main dashboard
│   ├── test-api.html              ← API testing page
│   ├── js/
│   │   └── dashboard-api.js       ← JavaScript API client
│   └── css/
│       └── welcome.css            ← Admin CSS
├── api/
│   ├── dashboard.php              ← Dashboard statistics
│   ├── events.php                 ← Events management
│   ├── participants.php           ← Registrations/participants
│   ├── admins.php                 ← Admin users list
│   ├── catalogue.php              ← Past events
│   ├── audit_logs.php             ← Activity logs
│   └── ... (other APIs)
├── assets/
│   └── css/
│       └── admin-dashboard.css    ← Dashboard styles
└── db_config.php                  ← Database configuration
```

## API Endpoints Reference

### Dashboard Statistics
```
GET /api/dashboard.php
Returns: totalEvents, totalRegistrations, attendedToday, eventsThisWeek, charts data
```

### Events
```
GET /api/events.php
Returns: Array of event objects with id, name, date, location, image
```

### Participants/Registrations
```
GET /api/participants.php
Returns: Array of participant objects with name, email, event, status
```

### Users/Admins
```
GET /api/admins.php
Returns: Array of admin users with id, username, email, role
```

### Catalogue
```
GET /api/catalogue.php
Returns: Array of past events
```

### Audit Logs
```
GET /api/audit_logs.php
Returns: Array of activity logs with user, action, timestamp, details
```

## Console Logging

The dashboard includes detailed console logging for debugging:

**Open DevTools:** F12 → Console tab

You'll see logs like:
```
[Dashboard] Initializing...
[Dashboard] Loading dashboard data...
[Dashboard] Fetching stats...
[API] Calling ../api/dashboard.php
[API Response] dashboard.php: {success: true, data: {...}}
[Dashboard] Stats received: {...}
[Dashboard] KPI stats updated
[Dashboard] Charts initialized
[Dashboard] Initialization complete!
```

**Error logs appear in RED:**
```
[Error] Failed to connect to database
[API Error] dashboard.php: Error message
```

## Testing Features

### 1. Dashboard Page
- Shows real-time statistics
- Charts populated from database
- Updates on page load

### 2. Events Page
- Lists all events from database
- Shows event cards with details
- Create new event modal

### 3. Participants Page
- Table of all registrations
- Filtered by event
- Shows attendance status

### 4. Users Page
- List of admin users
- Role information
- Active status

### 5. Activity Logs
- System audit trail
- Shows who did what and when
- Searchable logs

### 6. Reports Page
- Report generation options
- Exportable data

### 7. Catalogue Page
- Archive of past events
- Historical event listing

## Browser Support

✅ Chrome/Chromium (Recommended)
✅ Firefox
✅ Safari
✅ Edge

**Recommended:** Use Chrome DevTools for debugging

## Performance Tips

1. **Use the test page** to verify connections before assuming UI issues
2. **Check browser console** (F12) for detailed error messages
3. **Monitor Network tab** to see actual API response times
4. **Database indexes** - Ensure event and participant tables have proper indexes

## Sample Database Queries

Insert test data:
```sql
-- Insert test event
INSERT INTO events (event_name, event_date, location, capacity, is_private, created_at)
VALUES ('Test Conference', '2026-03-15', 'Convention Center', 500, 0, NOW());

-- Insert test registration
INSERT INTO registrations (event_id, user_id, status, registered_at)
VALUES (1, 1, 'ATTENDED', NOW());
```

## Next Steps

1. ✅ Verify dashboard loads at `http://localhost/Smart-Events/admin/`
2. ✅ Run API tests at `http://localhost/Smart-Events/admin/test-api.html`
3. ✅ Add sample data to database if empty
4. ✅ Test all navigation pages
5. ✅ Check browser console for any errors
6. ✅ Deploy to production when satisfied

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check PHP error logs
3. Run test-api.html to identify which API is failing
4. Verify database tables and data exist
5. Check API endpoint files for syntax errors

---

**Dashboard Status:** ✅ Fully Connected to Database
**Last Updated:** February 20, 2026
