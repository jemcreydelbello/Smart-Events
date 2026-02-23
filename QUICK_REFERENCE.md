# Quick Reference Guide - Event Details & Coordinators

## What Changed?

### For Users
When you click "View Details" on an event, you now get a professional tabbed interface:

```
┌─────────────────────────────────────────────┐
│  Event Name                             [×] │
├──────────────────────────────────────────────┤
│ [📊 Dashboard] [ℹ️ Event Details] [👥 Attendees] [✓ Tasks] │
├──────────────────────────────────────────────┤
│                                              │
│  TAB CONTENT AREA                           │
│  (Changes based on selected tab)            │
│                                              │
├──────────────────────────────────────────────┤
│                    [Close] [Edit] [Delete]   │
└──────────────────────────────────────────────┘
```

## Dashboard Tab
Shows key metrics at a glance:
- 📊 **Total Registered** - Number of registrations
- 👥 **Total Attended** - Number who showed up
- 📍 **Available Spots** - Remaining capacity
- 📈 **Attendance Rate** - % of registered who attended

Plus event overview section with essential info.

## Event Details Tab
Complete event information:
- Event name, date, time range
- Location and capacity
- Event type (Public or Private)
- **Coordinator Name & Contact** ← NEW!
- Created by
- Full description

## Attendees Tab
Organized participant information:
```
[All Registered (5)] [Attended (3)]

Registered participants:
├─ John Doe
│  john.doe@email.com
│  Code: REG123456
│  Status: [REGISTERED]
├─ Jane Smith
│  jane.smith@email.com
│  Code: REG789012
│  Status: [ATTENDED] ✅
└─ ...

When [Attended] tab clicked:
├─ Jane Smith ✅
│  jane.smith@email.com
│  Code: REG789012
│  Status: [ATTENDED]
├─ Bob Johnson ✅
│  bob.j@email.com
│  Code: REG345678
│  Status: [ATTENDED]
└─ ...
```

## Tasks Tab
Placeholder for future features - currently shows:
"Task management feature will be available soon."

---

## Working with Coordinators

### Create Event with Coordinator
1. Click **Create Event**
2. Fill event information
3. Scroll to **Event Coordinator** field
4. Click dropdown and select coordinator (optional)
5. Click **Create Event**

### Edit Event Coordinator
1. Click event **Edit** button
2. Scroll to **Event Coordinator** field
3. Select different coordinator (or leave blank to remove)
4. Click **Update Event**

### View Coordinator in Event
1. Click event **View Details**
2. Go to **Event Details** tab
3. Look for **COORDINATOR** section showing:
   - ➤ Coordinator name
   - 📧 Email address
   - 📱 Contact number

---

## Coordinator Database Fields

Each coordinator has:
| Field | Type | Example |
|-------|------|---------|
| Name | Text | John Smith |
| Email | Email | john@company.com |
| Contact | Phone | +1 555 123 4567 |
| Created | Date | 2024-01-15 |

---

## API Quick Reference

### Get All Coordinators
```
GET /api/coordinators.php?action=list

Returns:
{
  "success": true,
  "data": [
    {
      "coordinator_id": 1,
      "coordinator_name": "John Smith",
      "email": "john@company.com",
      "contact_number": "+1555123456"
    }
  ]
}
```

### Create New Coordinator
```
POST /api/coordinators.php

Send JSON:
{
  "coordinator_name": "Jane Doe",
  "email": "jane@company.com",
  "contact_number": "+1555789012"
}

Returns:
{
  "success": true,
  "message": "Coordinator created successfully",
  "coordinator_id": 2
}
```

### Update Coordinator
```
PUT /api/coordinators.php

Send JSON:
{
  "coordinator_id": 1,
  "coordinator_name": "John Smith",
  "email": "john.new@company.com",
  "contact_number": "+1555111222"
}

Returns:
{
  "success": true,
  "message": "Coordinator updated successfully"
}
```

### Delete Coordinator
```
DELETE /api/coordinators.php

Send JSON:
{
  "coordinator_id": 1
}

Returns:
{
  "success": true,
  "message": "Coordinator deleted successfully"
}
```

---

## Database Schema

### Coordinators Table
```sql
CREATE TABLE coordinators (
  coordinator_id        INT PRIMARY KEY AUTO_INCREMENT,
  coordinator_name      VARCHAR(150) NOT NULL,
  email                VARCHAR(150) NOT NULL,
  contact_number       VARCHAR(20) NOT NULL,
  created_at          TIMESTAMP,
  updated_at          TIMESTAMP
);
```

### Events Table (Updated)
```sql
-- New column added:
coordinator_id INT NULL FOREIGN KEY REFERENCES coordinators(coordinator_id)
```

---

## Keyboard Shortcuts

When viewing event details modal:
- **Tab** - Switch between tabs
- **Esc** - (if implemented) Close modal
- **Enter** - (in forms) Submit

---

## Troubleshooting

### "Coordinator dropdown is empty"
→ No coordinators exist yet. They must be added to database first.

### "Coordinator not showing in event details"
→ Check that event has coordinator_id assigned in database.

### "Can't save event with coordinator"
→ Clear browser cache and try again. Check browser console for errors.

### "Error loading event details"
→ Verify coordinator_id column exists in events table.
→ Run migration: `COORDINATORS_MIGRATION.sql`

---

## Common Tasks

### Assign Coordinator to Event
1. Open event editor
2. Select coordinator from dropdown
3. Save changes

### Change Event Coordinator  
1. Open event details
2. Click Edit
3. Select new coordinator
4. Save

### Remove Coordinator from Event
1. Open event editor
2. Clear coordinator dropdown selection
3. Save changes

### View Who Coordinates Which Events
1. Check Event Details tab
2. See "COORDINATOR" section

---

## Performance Notes

- Coordinators list loads on modal open
- Cached in RAM for better performance
- List updates automatically when needed
- No limit on number of coordinators

---

## Security

- Coordinator data is stored in database
- API validates all inputs
- Foreign key constraints prevent orphaned records
- Contact info is visible only to authorized users

---

## Limitations (Current)

- ❌ Coordinators cannot be managed from dashboard yet
  → Use /api/coordinators.php directly
- ❌ No bulk coordinator operations
- ❌ No coordinator-specific reports yet
- ✅ All are planned for future releases

---

## Support

**Need Help?**
- Check `COORDINATORS_FEATURE_GUIDE.md` for detailed docs
- Review `IMPLEMENTATION_SUMMARY.md` for architecture
- Check browser console (F12) for errors

**Report Issues:**
- Screenshot of the issue
- Browser console errors (F12)
- Steps to reproduce
- Database state if possible
