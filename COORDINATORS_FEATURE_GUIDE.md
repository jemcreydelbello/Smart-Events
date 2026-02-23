# Event Coordinators Feature - Setup Guide

## Overview
This update adds comprehensive coordinator management and detailed event information views to your Smart Events system.

## What's New

### 1. **Coordinators Management**
- Add, edit, and manage event coordinators with their contact information
- Each coordinator has:
  - Name
  - Email address
  - Contact number
  
### 2. **Enhanced Event Details Modal**
When you click on an event, you now see a tabbed interface with:

#### Dashboard Tab
- Quick overview metrics:
  - Total registered participants
  - Total attended participants
  - Available spots available
  - Attendance rate percentage
- Event overview with key information

#### Event Details Tab
- Complete event information
- Event name, date, time
- Location
- Capacity
- Event type (Public/Private)
- **Coordinator information** (Name, Email, Contact)
- Created by information

#### Attendees Tab
- Two sub-tabs for viewing:
  - All registered participants (with count)
  - Attended participants (with count)
- Shows participant details and status

#### Tasks Tab
- Placeholder for future task management features

## Database Changes

### New Table: `coordinators`
```sql
CREATE TABLE coordinators (
    coordinator_id INT AUTO_INCREMENT PRIMARY KEY,
    coordinator_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Modified Table: `events`
- Added `coordinator_id` column (nullable, Foreign Key to coordinators table)
- Links each event to an optional coordinator

## Installation

### For New Installations
The database schema is already updated in `create_database.sql`. Just run the normal setup.

### For Existing Installations
Run the migration script to add coordinator support:

1. Open your database management tool (phpMyAdmin, MySQL Workbench, etc.)
2. Execute the SQL commands in `COORDINATORS_MIGRATION.sql`
3. The migration will:
   - Create the coordinators table
   - Add coordinator_id column to events table
   - Set up the foreign key relationship

## Using Coordinators

### Adding a Coordinator
1. Go to the **Events** section
2. Click **Create Event**
3. Fill in event details
4. Select a coordinator from the **Event Coordinator** dropdown (optional)
5. Click **Create Event**

### Editing Event Coordinators
1. Click **Edit Event** on any event
2. Select a different coordinator from the dropdown
3. Click **Update Event**

### Viewing Event Coordinators
1. Click **View Details** on any event
2. Go to the **Event Details** tab
3. Scroll to see the **COORDINATOR** section showing:
   - Coordinator name
   - Email
   - Contact number

## API Endpoints

### Coordinators API (`/api/coordinators.php`)

#### List All Coordinators
```
GET /api/coordinators.php?action=list
Response: { success: true, data: [ { coordinator_id, coordinator_name, email, contact_number } ] }
```

#### Get Coordinator Details
```
GET /api/coordinators.php?action=detail&coordinator_id=1
Response: { success: true, data: { coordinator_id, coordinator_name, email, contact_number } }
```

#### Create Coordinator
```
POST /api/coordinators.php
Body: { coordinator_name, email, contact_number }
Response: { success: true, message, coordinator_id }
```

#### Update Coordinator
```
PUT /api/coordinators.php
Body: { coordinator_id, coordinator_name, email, contact_number }
Response: { success: true, message }
```

#### Delete Coordinator
```
DELETE /api/coordinators.php
Body: { coordinator_id }
Response: { success: true, message }
```

## Files Modified

1. **Database**
   - `create_database.sql` - Updated with coordinators table and events.coordinator_id column

2. **API**
   - `api/coordinators.php` - NEW: Complete API for managing coordinators
   - `api/events.php` - Updated to include coordinator information in event queries

3. **Frontend**
   - `admin/index.html` - Updated event modals with tabbed interface
   - `admin/js/main.js` - Updated with tab switching and coordinator loading functions

## Features

### Event Details Modal Features
- **Dashboard Tab**: At-a-glance metrics and event overview
- **Event Details Tab**: Complete event information with coordinator details
- **Attendees Tab**: Manage and view event participants
- **Responsive Design**: Works on desktop and mobile devices
- **Tab Navigation**: Easy switching between information sections

### Coordinator Management
- Optional coordinator assignment (events can have no coordinator)
- Full contact information storage
- Automatic association with events
- Easy access in event details

## Future Enhancements

The **Tasks Tab** is a placeholder for planned features:
- Create and manage event-specific tasks
- Assign tasks to coordinators
- Track task completion
- Set task deadlines

## Troubleshooting

### Coordinators dropdown appears empty
- Make sure coordinators have been added to the database
- Check that the `coordinators` table exists
- Verify API permissions for `/api/coordinators.php`

### Coordinator information not showing in event details
- Ensure the event has a coordinator assigned
- Check the browser console for API errors
- Verify the coordinator data exists in the database

### Migration failed
- Check database user permissions
- Ensure `create_database.sql` was run successfully
- Try running individual SQL commands from `COORDINATORS_MIGRATION.sql`

## Support

For issues or feature requests, please check:
- Browser console (F12) for JavaScript errors
- Server logs for PHP errors
- Database logs for SQL errors
