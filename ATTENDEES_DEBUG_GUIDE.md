# Attendees Section - Debugging & Testing Guide

## What Was Fixed

1. ✅ **Global Variable Initialization** - `attendeesData` now properly initialized at the top of event-details.js
2. ✅ **Comprehensive Logging** - Added detailed console logs to track data flow
3. ✅ **Tab Switching Integration** - Attendees tab now triggers `loadAttendees()` when clicked
4. ✅ **Error Handling** - Better error handling and fallback rendering
5. ✅ **Element Validation** - Checks that HTML elements exist before rendering

## How to Test

### Step 1: Open the Event Details Page
1. Go to admin dashboard
2. Click on "Events" in the sidebar
3. Click on any event to open its details
4. Navigate to "Attendees" tab

### Step 2: Check Browser Console
**Press F12 or Ctrl+Shift+I to open Developer Tools**
Look for these console messages (they appear in order):

```
🔀 Switching to tab: attendees
👥 Loading attendees...
📋 Loading attendees for event: 1
📋 Attendees API response status: 200
📋 Attendees API data: {...}
✓ Loaded 4 total attendees
✓ Initial List: 4 | Actual Attendees: 0
🎨 Rendering attendees...
✓ Found attendees table elements
✓ Updated counts: Initial=4, Actual=0
✓ Rendering 4 initial attendees
✓ Attendees rendering complete
```

### What Each Message Means

| Message | Meaning |
|---------|---------|
| `🔀 Switching to tab: attendees` | Tab navigation initiated |
| `👥 Loading attendees...` | Attendees data fetch started |
| `📋 Attendees API response status: 200` | ✅ OK - API call succeeded |
| `✓ Loaded X total attendees` | Data received from API |
| `✓ Initial List: X / Actual Attendees: Y` | Data separated by status |
| `🎨 Rendering attendees...` | Table rendering started |
| `✓ Found attendees table elements` | ✅ HTML elements found |
| `✓ Rendering X initial attendees` | Table being populated |

### If You See These Errors

| Error | Solution |
|-------|----------|
| `❌ Attendees table elements not found!` | HTML IDs missing or page not fully loaded |
| `❌ No currentEventId set` | Event not loaded, try refreshing page |
| `❌ HTTP Error: 403` | Permission denied - check API access  |
| `❌ Failed to load attendees` | API error - check network tab in dev tools |

## Step 3: Verify Data Display

After checking console logs, verify in the page:
- ✅ "Attendees" tab shows in navigation
- ✅ Tab is clickable and displays content
- ✅ "Initial List" and "Actual Attendees" buttons visible
- ✅ Search box is present
- ✅ Export/Add buttons visible
- ✅ Table displays with headers: NO., FULL NAME, COMPANY, JOB TITLE, EMAIL ADDRESS, EMPLOYEE CODE, CONTACT NUMBER, ACTION
- ✅ Attendee rows show with data
- ✅ Action buttons (📱, ✓, 🗑) are visible

## Data Flow Diagram

```
Event Selected (currentEventId set)
         ↓
loadEventDetails() called
         ↓
API call to /api/events.php?action=detail&event_id=X
         ↓
displayEventDetails() sets global vars
         ↓
loadAttendees() is called
         ↓
API call to /api/participants.php?action=list&event_id=X
         ↓
Parse response → Separate by status
         ↓
renderAttendees() → Update tables
         ↓
✓ Page displays attendees
```

## Manual API Test

Open browser console and run:

```javascript
// Test 1: Check current event ID
console.log('Event ID:', currentEventId);

// Test 2: Manually fetch attendees
fetch('../api/participants.php?action=list&event_id=1', {
    headers: getUserHeaders()
})
.then(r => r.json())
.then(data => console.log('Attendees data:', data));

// Test 3: Check global attendees variable
console.log('Attendees Data:', attendeesData);
```

## Force Refresh Attendees

If attendees don't show, run in console:

```javascript
loadAttendees();
```

This will force a reload of attendees data.

## Clear Cache & Reload

If issues persist:
1. Press **Ctrl+Shift+Delete** to open cache clearing dialog
2. Select "All time" and check "JavaScript files"
3. Clear browsing data
4. **Ctrl+Shift+R** to hard refresh the page
5. Click on an event to load details
6. Navigate to Attendees tab

## Expected Console Output (Full Example)

```
🔀 Switching to tab: attendees
👥 Loading attendees...
📋 Loading attendees for event: 1
📋 Attendees API response status: 200
📋 Attendees API data: {
    success: true
    data: Array(4) [
        {full_name: "Guest 1", company: "Company 1", job_title: "Manager", …}
        {full_name: "Guest 2", company: "Company 2", job_title: "Director", …}
        {full_name: "Guest 3", company: "Company 3", job_title: "Analyst", …}
        {full_name: "Guest 4", company: "Company 4", job_title: "Coordinator", …}
    ]
}
✓ Loaded 4 total attendees
✓ Initial List: 4 | Actual Attendees: 0
🎨 Rendering attendees...
✓ Found attendees table elements
✓ Updated counts: Initial=4, Actual=0
✓ Rendering 4 initial attendees
✓ Attendees rendering complete
```

## Troubleshooting Quick Links

- 🔗 Check event-details.html around line 770 for Attendees section
- 🔗 Check event-details.js lines 1-10 for global variable initialization
- 🔗 Check API response at `/api/participants.php` endpoint
- 🔗 Verify database has participants/registrations for the event

## Contact Support

If you encounter any issues after following this guide:
1. Copy console output from browser DevTools
2. Include screenshot of Attendees section (or lack thereof)
3. Note which event you're testing with
4. Verify event has registered participants

---

✅ **The Attendees tab should now display properly with full debugging information!**
