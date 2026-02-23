================================================================================
TASK FEATURE - VERIFICATION CHECKLIST
================================================================================

Use this checklist to verify that the Task Management feature is working correctly.

================================================================================
QUICK SETUP BEFORE TESTING
================================================================================

1. Database Migration:
   ☐ Ran MIGRATE_EVENT_TASKS.sql in phpMyAdmin
   ☐ Message says "Query executed successfully"
   ☐ event_tasks table appears in table list

2. Files in Place:
   ☐ admin/event-details.html exists
   ☐ admin/js/event-details.js exists
   ☐ api/tasks.php exists
   ☐ config/db.php exists

3. Admin Access:
   ☐ Can log into admin panel
   ☐ Can access Events page
   ☐ Can click on an event

================================================================================
FEATURE TESTING
================================================================================

TEST 1: PAGE LOADS
   ☐ Click on any event
   ☐ Event details page loads
   ☐ Tasks tab appears in tab navigation
   ☐ Click Tasks tab - loads without errors

TEST 2: ADD TASK BUTTON
   ☐ Tasks tab is visible
   ☐ "+ Add Task" button is visible
   ☐ Click button - modal appears
   ☐ Modal shows empty form

TEST 3: FORM FIELDS
   ☐ Date field shows date picker icon
   ☐ Task name text field is empty
   ☐ Party Responsible text field is empty
   ☐ Status dropdown shows 3 options (Pending, In Progress, Done)
   ☐ Remarks text area is empty
   ☐ Cancel button is clickable
   ☐ Create button is clickable

TEST 4: CREATE TASK
   ☐ Fill out form:
     - Date: Select any date
     - Task: Enter "Test Task"
     - Party: Enter "Test Person"
     - Status: Select "Pending"
     - Remarks: Enter "Test remarks"
   ☐ Click "Create" button
   ☐ Modal closes
   ☐ Task appears in table below

TEST 5: VERIFY TABLE DISPLAY
   ☐ Task shows in table with correct date
   ☐ Task name displays correctly
   ☐ Party responsible shows correctly
   ☐ Status shows with orange "Pending" badge
   ☐ Remarks displays (click for full text)
   ☐ Edit button visible
   ☐ Delete button visible

TEST 6: EDIT TASK
   ☐ Click Edit button on task
   ☐ Modal opens with current data
   ☐ Title shows "Edit Task"
   ☐ Button text shows "Update"
   ☐ Change task name to "Updated Task"
   ☐ Change status to "In Progress"
   ☐ Click "Update"
   ☐ Modal closes
   ☐ Table shows updated values
   ☐ Status badge is now blue

TEST 7: CREATE MORE TASKS
   ☐ Create 2-3 more tasks with different statuses
   ☐ Create "Done" status task
   ☐ Verify Done status shows green badge
   ☐ Verify "In Progress" shows blue badge
   ☐ Verify "Pending" shows orange badge

TEST 8: DELETE TASK
   ☐ Click Delete on any task
   ☐ Confirmation dialog appears
   ☐ Click OK to confirm
   ☐ Task disappears from table
   ☐ Task removed from database

TEST 9: CANCEL OPERATIONS
   ☐ Click Add Task
   ☐ Start filling form
   ☐ Click Cancel
   ☐ Modal closes without saving
   ☐ Form doesn't send data

TEST 10: ERROR HANDLING
   ☐ Click Add Task
   ☐ Don't fill any fields
   ☐ Click Create
   ☐ Error message appears: "Please fill in all required fields"
   ☐ Modal stays open
   ☐ Form data preserved

TEST 11: DATE HANDLING
   ☐ Create task with today's date
   ☐ Create task with future date
   ☐ Create task with past date
   ☐ All dates display correctly (MM/DD/YYYY format)
   ☐ Tasks sort by due date (earliest first)

TEST 12: SPECIAL CHARACTERS
   ☐ Create task with special chars: "Test's Task & Event"
   ☐ Task saves and displays correctly
   ☐ No HTML injection issues
   ☐ No display corruption

TEST 13: LONG TEXT
   ☐ Create task with very long name (100+ chars)
   ☐ Create task with long remarks
   ☐ Table displays without breaking layout
   ☐ Long text can be fully viewed (hover shows tooltip)

TEST 14: MULTIPLE EVENTS
   ☐ Go back to Events page
   ☐ Click different event
   ☐ Tasks tab shows different tasks for this event
   ☐ Each event has independent task lists

TEST 15: PAGE REFRESH
   ☐ Create a task
   ☐ Refresh the page (F5)
   ☐ Tasks still appear in table
   ☐ Data persists in database

TEST 16: BROWSER CONSOLE
   ☐ Press F12 to open developer tools
   ☐ Click Console tab
   ☐ No red error messages
   ☐ No warnings related to tasks
   ☐ Network tab shows successful API calls

TEST 17: DIFFERENT BROWSERS
   ☐ Test in Chrome
   ☐ Test in Firefox
   ☐ Test in Edge
   ☐ Date picker works
   ☐ Modal displays correctly
   ☐ All buttons functional

TEST 18: RESPONSIVE DESIGN
   ☐ Resize browser window (make it smaller)
   ☐ Table still readable
   ☐ Buttons still clickable
   ☐ Modal still visible
   ☐ Form fields still editable

TEST 19: KEYBOARD NAVIGATION
   ☐ Tab through form fields
   ☐ Enter key in date field opens picker
   ☐ Can navigate with keyboard
   ☐ Escape key closes modal (if implemented)

TEST 20: DATABASE INTEGRITY
   ☐ Open phpMyAdmin
   ☐ Go to eventsystem > event_tasks
   ☐ Browse records
   ☐ See all created tasks
   ☐ Dates stored as YYYY-MM-DD
   ☐ Foreign key references correct event_id
   ☐ All data types correct

================================================================================
API VALIDATION
================================================================================

TEST API DIRECTLY (use browser dev tools Network tab):

1. GET List Request:
   ☐ URL: /api/tasks.php?action=list&event_id=1
   ☐ Response: { "success": true, "data": [...] }
   ☐ Status: 200 OK

2. POST Create Request:
   ☐ URL: /api/tasks.php
   ☐ Method: POST
   ☐ Body: { event_id: 1, task_name: "Test", ... }
   ☐ Response: { "success": true, "task_id": X }
   ☐ Status: 200 OK

3. PUT Update Request:
   ☐ URL: /api/tasks.php
   ☐ Method: PUT
   ☐ Body: { task_id: 1, ...fields... }
   ☐ Response: { "success": true, "message": "..." }
   ☐ Status: 200 OK

4. DELETE Request:
   ☐ URL: /api/tasks.php
   ☐ Method: DELETE
   ☐ Body: { task_id: 1 }
   ☐ Response: { "success": true, "message": "..." }
   ☐ Status: 200 OK

================================================================================
PERFORMANCE TEST
================================================================================

TEST 1: LOAD SPEED
   ☐ Tasks tab loads within 2 seconds
   ☐ Modal opens instantly
   ☐ Form submission takes < 1 second

TEST 2: MANY TASKS
   ☐ Create 50+ tasks in an event
   ☐ Table still loads and displays
   ☐ No performance degradation
   ☐ Scrolling is smooth

TEST 3: CONCURRENT OPERATIONS
   ☐ Open 2 browser tabs with same event
   ☐ Create task in tab 1
   ☐ Refresh tab 2
   ☐ New task appears in tab 2

================================================================================
SECURITY TEST
================================================================================

TEST 1: HTML INJECTION
   ☐ Try entering "<script>alert('xss')</script>" in task name
   ☐ Script doesn't execute
   ☐ Text displays as literal string

TEST 2: SQL INJECTION
   ☐ Try entering "'; DROP TABLE event_tasks; --" in task name
   ☐ Table not dropped
   ☐ Data inserted safely

TEST 3: CROSS-SITE SCRIPTING
   ☐ Enter HTML tags in remarks: "<img src=x onerror=alert('xss')>"
   ☐ No alert triggers
   ☐ Text displays safely

TEST 4: DATA VALIDATION
   ☐ Try accessing task from different event
   ☐ Should only see tasks for current event
   ☐ Can't modify other event's tasks

================================================================================
IF TESTS FAIL
================================================================================

TASKS NOT LOADING:
   1. Check browser console (F12) for errors
   2. Check Network tab for failed API calls
   3. Verify event_id is in URL
   4. Run migration SQL again
   5. Check database connection

MODAL DOESN'T OPEN:
   1. Check browser console for JS errors
   2. Verify JavaScript file loaded (check Sources tab)
   3. Try refreshing page
   4. Check for AdBlock or security extensions
   5. Try different browser

CAN'T CREATE TASKS:
   1. Check all required fields filled
   2. Check Network tab for API response
   3. Look for error message in form
   4. Check server error logs
   5. Verify database.php connected

DATE ISSUES:
   1. Check date picker works (click on date field)
   2. Verify date format is YYYY-MM-DD
   3. Check browser console for date conversion errors
   4. Try older date (2020) vs future date

STYLING ISSUES:
   1. Check CSS file loaded correctly
   2. Clear browser cache (Ctrl+Shift+Del)
   3. Hard refresh page (Ctrl+F5)
   4. Try in incognito/private mode
   5. Check for CSS conflicts

================================================================================
SUCCESS CRITERIA
================================================================================

All of the following should be TRUE:

✓ Tasks table exists in database
✓ Can create new tasks
✓ Can view tasks in table
✓ Can edit existing tasks
✓ Can delete tasks
✓ Status colors display correctly
✓ Date formatting works
✓ Modal opens and closes properly
✓ No console errors
✓ API calls return success
✓ Data persists after refresh
✓ Works in multiple browsers
✓ Form validation works
✓ Error messages display
✓ Security validation passes

If ALL of these are true, the feature is working correctly! ✓

================================================================================
NEXT STEPS
================================================================================

1. Congratulations! Tasks feature is ready to use
2. Train users on how to create and manage tasks
3. Set up team workflows around tasks
4. Monitor database for any issues
5. Consider additional features (see TASK_IMPLEMENTATION_SUMMARY.md)

================================================================================
