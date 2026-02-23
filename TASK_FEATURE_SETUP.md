================================================================================
TASK MANAGEMENT FEATURE - SETUP GUIDE
================================================================================

The Task Management feature for events is now fully implemented. Follow these steps
to activate it in your system.

================================================================================
STEP 1: CREATE THE DATABASE TABLE
================================================================================

Run the migration SQL to create the event_tasks table:

Option A - If you have a fresh database:
   - Run: COMPLETE_DATABASE_SETUP.sql 
   - This includes the event_tasks table

Option B - If you have an existing database:
   - Run: MIGRATE_EVENT_TASKS.sql
   - This adds the event_tasks table without affecting existing data

Steps to run:
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Select the 'eventsystem' database
3. Click the 'SQL' tab
4. Copy and paste the SQL from the migration file
5. Click 'Go' to execute

================================================================================
STEP 2: VERIFY THE TABLE EXISTS
================================================================================

After running the SQL, verify the table was created:

1. In phpMyAdmin, click on 'eventsystem' database
2. Look for 'event_tasks' in the list of tables
3. You should see these columns:
   - task_id, event_id, task_name, due_date
   - party_responsible, status, remarks
   - created_at, updated_at

================================================================================
STEP 3: TEST THE FEATURE
================================================================================

1. Log in to the admin panel
2. Go to Events and click on any event
3. Click the "Tasks" tab
4. Click the "+ Add Task" button
5. Fill in the form:
   - Due Date: Select a date
   - Task: Enter task name
   - Party Responsible: Enter person/team name
   - Status: Select from dropdown (Pending, In Progress, Done)
   - Remarks: Enter any notes
6. Click "Create" to save

================================================================================
STEP 4: MANAGE TASKS
================================================================================

View Tasks:
   - Open any event's "Tasks" tab
   - All tasks for that event will be displayed in a table

Edit Task:
   - Click the "Edit" button on any task row
   - Modal will open with current values
   - Update and click "Update"

Delete Task:
   - Click the "Delete" button on any task row
   - Confirm the deletion

Filter by Status:
   - Status shows with color-coding:
     - Pending (Orange)
     - In Progress (Blue)
     - Done (Green)

================================================================================
FILES MODIFIED/CREATED
================================================================================

Database:
   - COMPLETE_DATABASE_SETUP.sql (Updated - includes event_tasks)
   - MIGRATE_EVENT_TASKS.sql (New - migration for existing DB)

API:
   - api/tasks.php (New - Complete CRUD endpoint)

Frontend HTML:
   - admin/event-details.html (Updated - Tasks tab with modal)

Frontend JavaScript:
   - admin/js/event-details.js (Updated - Task management functions)

================================================================================
API ENDPOINTS
================================================================================

Get Task List for an Event:
   GET /api/tasks.php?action=list&event_id=1
   Returns: { success: true, data: [task_objects] }

Get Single Task Details:
   GET /api/tasks.php?action=detail&task_id=1
   Returns: { success: true, data: task_object }

Create New Task:
   POST /api/tasks.php
   Body: {
     event_id: 1,
     task_name: "Setup registration",
     due_date: "02/28/2026",
     party_responsible: "John Doe",
     status: "Pending",
     remarks: "Configure online form"
   }

Update Task:
   PUT /api/tasks.php
   Body: { task_id: 1, ...same fields... }

Delete Task:
   DELETE /api/tasks.php
   Body: { task_id: 1 }

================================================================================
TROUBLESHOOTING
================================================================================

If Tasks don't appear:
   1. Check browser console (F12) for JS errors
   2. Verify event_tasks table exists in database
   3. Ensure you're on an event details page (URL has ?id=X)

If Add Task button doesn't work:
   1. Check that the API endpoint (api/tasks.php) exists
   2. Verify the database connection is working
   3. Check browser console for network errors

If date format is wrong:
   1. The date picker uses HTML5 date input type
   2. Store format: YYYY-MM-DD in database
   3. Display format: MM/DD/YYYY in table

Permission Issues:
   1. Ensure you're logged in as admin
   2. Check admin session is active
   3. Verify localStorage contains admin data

================================================================================
DATE HANDLING
================================================================================

Input Format (HTML5 date picker):
   - YYYY-MM-DD (e.g., 2026-02-28)

API Format (sent to server):
   - MM/DD/YYYY (e.g., 02/28/2026)
   - Automatically converted by JavaScript

Database Format (stored):
   - YYYY-MM-DD (e.g., 2026-02-28)
   - Automatic conversion in PHP API

Display Format (shown in table):
   - MM/DD/YYYY (e.g., 02/28/2026)
   - Formatted by JavaScript formatDate()

================================================================================
STATUS VALUES
================================================================================

Pending (Default):
   - Color: Orange (#FF9800)
   - Use: Task not yet started

In Progress:
   - Color: Blue (#2196F3)
   - Use: Task is currently being worked on

Done:
   - Color: Green (#4CAF50)
   - Use: Task has been completed

================================================================================
FORM VALIDATION
================================================================================

Required Fields:
   - Due Date (must select a date)
   - Task name (must be at least 3 characters)

Optional Fields:
   - Party Responsible
   - Remarks

Status Notes:
   - Defaults to "Pending"
   - Can be changed anytime
   - All three statuses are editable

================================================================================
NEXT STEPS
================================================================================

1. Run the migration SQL if not done already
2. Test creating a task in any event
3. Verify tasks appear in the table
4. Test edit and delete functionality
5. Check all status types are working

All functionality is complete and ready to use!

================================================================================
