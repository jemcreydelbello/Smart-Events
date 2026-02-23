# Calendar Events Display - Debugging Guide

## Overview
You reported that events are not showing on the calendar. This guide walks you through step-by-step debugging to identify and fix the issue.

## Step 1: Open Browser Developer Tools

1. **Open the calendar page** in your browser (`/admin/index.html`)
2. **Press F12** or right-click → "Inspect" to open Developer Tools
3. **Click on the "Console" tab** to see console logs
4. **Look for logging** that starts with emoji symbols (🎨, 📅, ✅, ❌, etc.)

## Step 2: Check Initial Loading Logs

When the calendar page first loads (or refreshes), you should see these logs appear in the Console:

### Expected Logs (in this order):

```
✓ DOM ContentLoaded fired
✓ User authenticated: admin@example.com
✓ Starting initialization sequence...
⏳ Loading sidebar...
✓ Sidebar ready
...
Restoring page: calendar
📅 Loading calendar for [month] / [year]
🔗 API URL: http://localhost/Smart-Events/api/events.php?action=list_all
📡 API Response status: 200
📥 API Response data: {success: true, data: [{...}, {...}]}
✅ Loaded X events for calendar
📋 Events array: [...]
🔍 First event: {event_id: 1, event_name: "Event Name", event_date: "2026-02-15 10:00:00", ...}
🎨 Rendering calendar for 2026-02
📊 Total events in cache: X
📅 Date 2026-02-15: Found 1 events
  ├─ Event 1: "Event Name"
✓ Calendar month rendered
```

### If the logs DON'T appear:
- If you don't see any logs at all → The page might not be loading JavaScript correctly
- If you see logs but no calendar data → The API is not returning data

## Step 3: Verify API Response

1. **Click on the "Network" tab** in Developer Tools
2. **Look for a request** to `events.php?action=list_all`
3. **Click on that request** to see the full response
4. **Check the "Response" section** - you should see JSON data like:

```json
{
  "success": true,
  "data": [
    {
      "event_id": "1",
      "event_name": "Sample Event",
      "event_date": "2026-02-15 10:00:00",
      "event_title": "Sample Event Details",
      "description": "Event description",
      ...
    },
    ...
  ]
}
```

### What to check:
- ✅ `"success": true` - API call succeeded
- ✅ `"data": [...]` - Array contains events
- ✅ Each event has `"event_name"` field - This is what displays on calendar
- ✅ Each event has `"event_date"` field - This is used to match calendar dates
- ❌ If the array is empty `[]` → No events in database

## Step 4: Check Date Format Matching

The calendar is looking for dates in format `YYYY-MM-DD` (e.g., `2026-02-15`).

### In the Console, look for logs like:

```
📅 Date 2026-02-15: Found 1 events
  ├─ Event 1: "Sample Event"
```

### If you see:
- ✅ "Found 1 events" → Event is being matched and should display
- ❌ "Found 0 events" → The date strings don't match (see troubleshooting below)

### To manually check date format:
1. In Console, type: `allEventsForCalendar[0]`
2. Press Enter and expand the object
3. Check the `event_date` field
4. Should be in format: `"2026-02-15 10:00:00"`
5. If it's in a different format, that might be the issue

## Step 5: Verify Calendar DOM Structure

In the Console, type:
```javascript
document.getElementById('calendarGrid')
```

This should return a DOM element. If it returns `null`, the HTML structure might be wrong.

## Common Issues & Solutions

### Issue 1: API returns success but no events (empty array)

**Symptom**: You see `✅ Loaded 0 events for calendar`

**Solution**: 
- Events table in the database is empty
- Check `/api/events.php` is correctly querying the events table
- Verify your database has events with data in the `event_date` column

**How to test**:
1. In your terminal/command prompt, go to the project directory
2. Run: `php -r "require 'db_config.php'; $r = mysqli_query($conn, 'SELECT COUNT(*) as count FROM events'); $row = mysqli_fetch_assoc($r); echo 'Events in DB: ' . $row['count'];"`
3. If this shows 0, you need to add test events to the database

### Issue 2: Events are in database but not showing on calendar

**Symptom**: 
- You see `✅ Loaded X events for calendar`
- BUT Console shows `📅 Date 2026-02-15: Found 0 events`

**Solution**: Date format mismatch
1. In Console, type: `allEventsForCalendar[0].event_date`
2. Check the format returned
3. Expected: `"2026-02-15 10:00:00"` (with space between date and time)
4. If it's different, we need to adjust the date parsing code

### Issue 3: API response is slow or timing out

**Symptom**: 
- No "API Response status" log appears
- Or you see `❌ Error loading calendar`

**Solution**:
1. Check your API endpoint is working: Visit `/api/events.php?action=list_all` directly in browser
2. Check for PHP errors - look at browser console for any error messages
3. Verify database connection is working
4. Check `/admin/js/admin.js` line ~340 to ensure the API call is correct

### Issue 4: Events fetched but still not visible on page

**Symptom**:
- Logs show events are found: `📅 Date 2026-02-15: Found 1 events`
- But calendar cells appear empty

**Solution**:
1. Check CSS is not hiding the events
2. In Console, type: `document.querySelector('[data-date="2026-02-15"]')`
3. This should find the calendar cell for that date
4. If found, check its content with: `document.querySelector('[data-date="2026-02-15"]').innerHTML`
5. Should contain the event name text

## Step 6: Testing with Console Commands

You can manually test the system in the Console:

### Test 1: Check cached events
```javascript
console.log('Total events:', allEventsForCalendar.length);
console.log('First event:', allEventsForCalendar[0]);
```

### Test 2: Test date matching manually
```javascript
const testDate = '2026-02-15';
const matching = allEventsForCalendar.filter(e => e.event_date.split(' ')[0] === testDate);
console.log('Events matching ' + testDate + ':', matching);
```

### Test 3: Check specific calendar cell
```javascript
const cell = document.querySelector('[data-date="2026-02-15"]');
console.log('Calendar cell HTML:', cell?.innerHTML);
console.log('Cell content:', cell?.textContent);
```

## Step 7: Verify Calendar Navigation

Try clicking the month/year navigation buttons:
1. Click "Next" or "Previous" month arrows
2. Watch the Console for logs showing the new month being rendered
3. The calendar should update and show events for the new month

## Still Having Issues?

Follow these steps to collect diagnostic information:

1. **Capture Console Output**:
   - Right-click in Console → "Save as" to save the full console log

2. **Check Browser Version**:
   - Different browsers might have different JavaScript execution

3. **Clear Cache**:
   - Press Ctrl+Shift+Delete to clear browser cache
   - Refresh the page (F5)
   - Try again

4. **Check File Syntax**:
   - Look for any **red error messages** in the Console
   - These indicate JavaScript syntax errors

## Key Files Involved

- **Frontend**: `/admin/js/admin.js` - Calendar display logic
- **API**: `/api/events.php` - Event data endpoint
- **HTML**: `/admin/index.html` - Calendar DOM structure (section with id="calendar")
- **Database**: `events` table

## Recent Changes

The following debugging enhancements were added:
- Enhanced `loadCalendar()` function with detailed API logging
- Added event count logging in `renderCalendarMonth()`
- Added per-date event matching logs in `createCalendarDayElement()`
- Fixed field reference from `event.event_title` to `event.event_name`

## Next Steps

1. Open the calendar page
2. Press F12 to open Console
3. Look for the logs described in Step 2
4. Report what you see (or don't see)
5. We can use that information to fix the issue

---

**Last Updated**: After event display debugging
**Status**: Diagnostic logging enabled - Ready for testing
