# Walk-in Attendees Feature Implementation

## Overview
A complete solution for tracking walk-in attendees separately from pre-registered participants using a binary flag (`is_walkIn`) similar to the event privacy settings.

## Changes Made

### 1. Database Schema (✅ Completed)
**File:** `config/migrations/add_walkIn_to_registrations.sql`

Added column to `registrations` table:
```sql
ALTER TABLE `registrations`
ADD COLUMN `is_walkIn` TINYINT(1) DEFAULT 0 AFTER `status`,
ADD INDEX `idx_is_walkIn` (`is_walkIn`);
```

**Field Details:**
- Column: `is_walkIn`
- Type: `TINYINT(1)` (0 or 1 flag)
- Default: `0` (registered normally)
- Values:
  - `0` = Normal registered participant
  - `1` = Walk-in attendee (manually added by admin)
- Index: Added for efficient queries

### 2. Backend API Updates (✅ Completed)
**File:** `api/participants.php`

#### Changes:
1. **Accept `is_walkIn` parameter in POST request**
   ```javascript
   $is_walkIn = isset($data['is_walkIn']) ? intval($data['is_walkIn']) : 0;
   ```

2. **Include `is_walkIn` in registration INSERT query**
   ```sql
   INSERT INTO registrations (user_id, event_id, registration_code, status, is_walkIn, registered_at)
   VALUES (?, ?, ?, ?, ?, NOW())
   ```

3. **Include `is_walkIn` in all SELECT queries**
   - Event attendees list query
   - Participant search queries
   - Full participant profiles

### 3. Admin UI Updates (✅ Completed)

#### A. Add Attendee Modal Form
**File:** `admin/index.html` (Lines 5560-5570)

Added checkbox field:
```html
<!-- Walk-in Attendee Checkbox -->
<div style="display: flex; align-items: center; gap: 12px; padding: 12px; 
            background: #f0fdff; border: 2px solid #c6f0ff; border-radius: 10px;">
  <input type="checkbox" id="addAttendeeIsWalkIn" style="accent-color: #06b6d4;">
  <label for="addAttendeeIsWalkIn">Mark as Walk-in Attendee</label>
  <span style="font-size: 12px; color: #999;">(Directly added attendee, not pre-registered)</span>
</div>
```

#### B. Form Submission Handler
**File:** `admin/js/admin.js` (handleAddAttendeeSubmit function)

Updated to capture and send the `is_walkIn` flag:
```javascript
const isWalkIn = document.getElementById('addAttendeeIsWalkIn').checked ? 1 : 0;

const requestPayload = {
    // ... other fields ...
    is_walkIn: isWalkIn
};
```

#### C. Attendees Table Display
**File:** `admin/js/admin.js` (renderAttendeeTableRows function)

Added visual indicator in attendees list:
```javascript
const walkInBadge = attendee.is_walkIn === 1 || attendee.is_walkIn === '1' 
    ? '<span style="display: inline-block; padding: 2px 8px; 
       background: #fef08a; color: #854d0e; border-radius: 4px; 
       font-size: 11px; font-weight: 600; margin-left: 6px;">Walk-in</span>'
    : '';
```

## How to Use

### Adding a Walk-in Attendee:

1. Open event details → Click "Attendees" tab
2. Click "+ Add" button
3. Fill in attendee information:
   - First Name, Middle Name, Last Name
   - Company, Job Title
   - Email, Contact Number
4. **Check "Mark as Walk-in Attendee"** checkbox
5. Click "Create"

### Distinguishing Attendees in Reports:

The attendees list will now show:
- **Normal Registrations:** Name only
- **Walk-in Attendees:** Name + **[Walk-in]** badge (yellow)

## Database Query Examples

### Get all walk-in attendees for an event:
```sql
SELECT r.*, u.* 
FROM registrations r
JOIN users u ON r.user_id = u.user_id
WHERE r.event_id = 46 AND r.is_walkIn = 1;
```

### Count walk-in vs registered attendees:
```sql
SELECT 
  SUM(CASE WHEN is_walkIn = 0 THEN 1 ELSE 0 END) as registered_count,
  SUM(CASE WHEN is_walkIn = 1 THEN 1 ELSE 0 END) as walkIn_count
FROM registrations
WHERE event_id = 46 AND status = 'registered';
```

## Backward Compatibility

✅ All existing records automatically have `is_walkIn = 0` (marked as normal registrations)
✅ No breaking changes to existing functionality
✅ All APIs remain backward compatible

## Files Modified

1. ✅ `config/migrations/add_walkIn_to_registrations.sql` - Database migration
2. ✅ `api/participants.php` - Backend API logic
3. ✅ `admin/index.html` - UI form element
4. ✅ `admin/js/admin.js` - Form handling and display logic

## Testing Checklist

- [x] Database migration applied successfully
- [ ] Add new walk-in attendee and verify database saves `is_walkIn = 1`
- [ ] Add normal attendee (without walk-in checkbox) and verify `is_walkIn = 0`
- [ ] Verify "Walk-in" badge appears next to walk-in attendees in table
- [ ] Verify API returns is_walkIn field in attendees list
- [ ] Test filtering/searching still works properly
- [ ] Verify existing registrations still work correctly
