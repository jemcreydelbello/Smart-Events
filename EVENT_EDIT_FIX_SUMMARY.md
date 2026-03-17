# Event Edit Bug Fixes - March 17, 2026

## Summary
Fixed three critical bugs preventing event edits from saving and cover images from displaying.

---

## Bug #1: Event Details Not Saving to Database

### Root Cause
**Field Name Mismatch** between JavaScript and PHP API handler

- **JavaScript (edit-modal-v2.js)** sends:
  - `action: 'update_event'`
  - `start_event` → "2026-03-20 14:30:00" (MySQL datetime format)
  - `end_event` → "2026-03-20 18:00:00" (MySQL datetime format)
  - `registration_start`, `registration_end`

- **API (events.php line 532)** was expecting:
  - `event_date` (date only)
  - `start_time` (time only)
  - `end_time` (time only)
  - NO registration date fields!

### Solution Applied
Updated `api/events.php` line 532+ handler to:
1. Accept new field names: `start_event`, `end_event` directly
2. Extract registration dates: `registration_start`, `registration_end`
3. Extract private settings: `is_private`, `private_code`
4. Update SQL query to include ALL fields:
   ```sql
   UPDATE events SET 
     event_name = ?, 
     location = ?, 
     start_event = ?, 
     end_event = ?, 
     registration_start = ?,    -- NOW SAVED!
     registration_end = ?,      -- NOW SAVED!
     capacity = ?, 
     registration_link = ?, 
     website_link = ?, 
     description = ?,
     is_private = ?,            -- NOW SAVED!
     [access_code = ?]          -- CONDITIONALLY SAVED
     WHERE event_id = ?
   ```
5. Fixed bind_param type string to match new parameters

### Files Modified
- **api/events.php** (lines 532-657): Updated `update_event` action handler

---

## Bug #2: Cover Image Upload Not Working

### Root Cause
**Field Name Mismatch** for file uploads

- **JavaScript** sends file as: `cover_image` (form field name)
- **API** was looking for: `image` (wrong field name)
- Result: `$_FILES['image']` was empty, file was never processed

### Solution Applied
Updated `api/events.php` line 559+ to:
- Check for `$_FILES['cover_image']` instead of `$_FILES['image']`
- Validate and process the cover image correctly
- Continue storing as filename only in `image_url` column

### Files Modified
- **api/events.php** (line 559): Changed from `$_FILES['image']` to `$_FILES['cover_image']`

---

## Bug #3: Current Cover Image Not Displaying

### Root Cause
**Missing URL Path Construction**

- API returns `image_url` as filename only (e.g., `event_4_1710789600.jpg`)
- JavaScript used it directly as image src: `<img src="event_4_1710789600.jpg">`
- Browser couldn't find the file (no path specified)
- Files are actually stored in: `/uploads/events/event_4_1710789600.jpg`

### Solution Applied
Updated JavaScript `edit-modal-v2.js` line 127+ to:
1. Check if filename already contains a path (`/`)
2. If not, prepend the uploads path: `../uploads/events/`
3. Construct full path: `../uploads/events/event_4_1710789600.jpg`
4. Add error logging if image fails to load
5. Add alt text and onerror handler for debugging

### Code Example
```javascript
if (event.image_url) {
    let imgSrc = event.image_url;
    if (!imgSrc.includes('/')) {
        imgSrc = '../uploads/events/' + imgSrc;
    }
    const imgHTML = `<img src="${imgSrc}" style="..." 
                          onerror="console.error('Failed to load image:', this.src)">`;
    document.getElementById('editDetailsCurrentImage').innerHTML = imgHTML;
}
```

### Files Modified
- **admin/js/edit-modal-v2.js** (lines 127-142): Added proper path construction

---

## Database Column Reference

| Column Name | Type | What Gets Stored | Example |
|---|---|---|---|
| `event_name` | VARCHAR | Event title | "Annual Conference 2026" |
| `location` | VARCHAR | Event venue | "Convention Center A" |
| `start_event` | DATETIME | Start date & time | "2026-03-20 14:30:00" |
| `end_event` | DATETIME | End date & time | "2026-03-20 18:00:00" |
| `registration_start` | DATETIME | Registration opens | "2026-02-01 09:00:00" |
| `registration_end` | DATETIME | Registration closes | "2026-03-19 23:59:59" |
| `image_url` | VARCHAR | Filename only | "event_4_1710789600.jpg" |
| `is_private` | TINYINT | Boolean 0 or 1 | 1 |
| `access_code` | VARCHAR | Private event code | "ABC12XYZ" |
| (from event_access_codes) | | | |

---

## Testing Instructions

### Test Event Edits
1. Navigate to admin → Event Management
2. Click "Edit" on any event
3. Modify these fields:
   - Event Title
   - Location
   - Event Dates & Times
   - Registration Dates & Times
   - Capacity
   - Description
   - Registration/Website Links
4. Toggle "Private Event" checkbox
5. Upload a new cover image
6. Click "Save"

### Verify Fixes
✅ **All fields save to database** (check DB directly or reload page)
✅ **Cover image uploads successfully** (new image appears after save)
✅ **Cover image displays in edit modal** (before and after upload)
✅ **Registration dates persist** (close & reopen modal to verify)
✅ **Private settings saved** (is_private and access_code columns updated)

### Debug Console Logs
When testing, open browser DevTools (F12) → Console to see:
```javascript
📝 Opening edit event details modal for event: 4
🖼️ Loading cover image from: ../uploads/events/event_4_1710789600.jpg
📋 FormData entries being sent:
  action: update_event
  event_id: 4
  event_name: [value]
  start_event: 2026-03-20 14:30:00
  ...
  cover_image: [File] my-image.jpg (245632 bytes)
API Response status: 200
API Response data: {success: true, message: "Event details updated successfully"}
✅ Event details updated successfully
```

---

## Field Mapping Reference

### What JavaScript Sends → What API Now Processes
| JavaScript Field | API Parameter | Database Column |
|---|---|---|
| `event_name` | `$_POST['event_name']` | `event_name` |
| `location` | `$_POST['location']` | `location` |
| `registration_link` | `$_POST['registration_link']` | `registration_link` |
| `website` (input ID ending) | `$_POST['website_link']` | `website` |
| `start_event` | `$_POST['start_event']` | `start_event` |
| `end_event` | `$_POST['end_event']` | `end_event` |
| `registration_start` | `$_POST['registration_start']` | `registration_start` |
| `registration_end` | `$_POST['registration_end']` | `registration_end` |
| `capacity` | `$_POST['capacity']` | `capacity` |
| `description` | `$_POST['description']` | `description` |
| `is_private` | `$_POST['is_private']` | `is_private` |
| `private_code` | `$_POST['private_code']` | `access_code` |
| `cover_image` file | `$_FILES['cover_image']` | `image_url` (filename) |

---

## Files Modified
1. **api/events.php** - Updated `update_event` action handler (3 changes)
2. **admin/js/edit-modal-v2.js** - Fixed image path + enhanced logging (2 changes)

---

## Notes
- The fix maintains backward compatibility with existing event creation code
- Image files are stored in `/uploads/events/` directory  
- Only filenames are stored in database (not full paths)
- Private event access codes stored in `event_access_codes` table and returned as `access_code` field
