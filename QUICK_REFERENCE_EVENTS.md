# Quick Reference - Event Management System

## User Actions

### View All Events
- Click **"Events"** in sidebar
- All upcoming events display as cards
- Shows: Name, Date, Location, Capacity, Registration count, Attendance

### View Event Details
- Click any **event card**
- Modal opens with 4 tabs
- Tabs: Dashboard | Details | Attendees | Tasks
- Shows all event information

### Edit Event
- Click **"Edit Event"** button in details modal
- Form opens with all data pre-filled
- Modify any field
- Upload new image (optional)
- Click **"Update Event"**

### Delete Event
- Click **"Delete Event"** button in details modal
- Confirm deletion
- Event removed from system

### Create New Event
- Click **"Create Event"** button on Events page
- Fill in required fields:
  - Event Name
  - Event Date
  - Capacity
- Optional fields:
  - Time, Location, Description, Image, Private Access
- Check "Private event" to auto-generate access code
- Click **"Create Event"**

---

## Key Features

### Private Events
- Check the **"Private event"** checkbox
- System automatically generates a 6-character access code
- Code appears immediately and can be copied
- Code stored in database for event verification

### Event Images
- Upload PNG, JPG, or GIF (max 5MB)
- Shows preview of current image
- Leave blank when editing to keep existing image

### Event Statistics
- **Total Registrations**: Count of all registered participants
- **Attended**: Count of participants who checked in
- **Available Spots**: Capacity minus registered participants
- **Attendance Rate**: Percentage of attended vs registered

### Coordinator Assignment
- Can assign one coordinator per event
- Select from coordinators list
- Coordinator info displayed in event details

---

## Data Stored Per Event

| Field | Type | Notes |
|-------|------|-------|
| Event Name | Text | Required |
| Date | Date | Required |
| Time | Time | Optional - start and end |
| Location | Text | Optional |
| Capacity | Number | Required |
| Description | Text | Optional |
| Image | File | Optional - PNG/JPG/GIF |
| Private | Boolean | If true, has access code |
| Access Code | 6 chars | Auto-generated for private events |
| Coordinator | Reference | Optional - links to coordinator |
| Department | Text | Optional |
| Created By | User | Auto-set to NULL (system created) |

---

## API Endpoints (For Developers)

```
GET  /api/events.php?action=list
     Returns: All active events with stats

GET  /api/events.php?action=detail&event_id=123
     Returns: Full details for event 123

POST /api/events.php
     Body: FormData with event details + image
     Returns: Success with new event_id

PUT  /api/events.php
     Body: FormData with event_id + updated fields
     Returns: Success confirmation

DELETE /api/events.php?event_id=123
     Returns: Success confirmation
```

---

## Common Tasks

**Changing an event from public to private:**
1. Click event card
2. Click "Edit Event"
3. Check "Private event"
4. New access code generated automatically
5. Click "Update Event"

**Changing event date:**
1. Click event card
2. Click "Edit Event"
3. Select new date in calendar
4. Click "Update Event"

**Adding event image:**
1. Click event card
2. Click "Edit Event"
3. Click file input to select image
4. Preview updates
5. Click "Update Event"

**Viewing who registered:**
1. Click event card
2. Go to "Attendees" tab
3. See registered and attended lists

**Getting event statistics:**
1. Click event card
2. View "Dashboard" tab
3. See registration, attendance, and capacity stats

---

## Status Indicators

- **Public** (Blue badge): Anyone can see and register
- **Private** (Red badge): Only access with access code
- **Upcoming**: Date is in the future
- **Completed**: Event date has passed

---

## Tips & Tricks

💡 **Copy Access Code**: Click the 📋 button next to the code to copy it

💡 **Bulk Update**: Edit form saves and stays in memory until closed

💡 **No User Required**: Events can be created without user accounts (created_by = NULL)

💡 **Image Preservation**: When editing, leaving image blank keeps the existing image

💡 **Flexible Dates**: All time fields are optional - great for all-day events

💡 **Event Search**: Use the search box to quickly find events by name or location

---

## Support / Troubleshooting

❌ **Event not showing**: Check if date is in the past (goes to Catalogue)
❌ **Image not uploading**: Check file size (max 5MB) and format (PNG/JPG/GIF)
❌ **Private event code missing**: Make sure event is marked as private before creating
❌ **Can't edit event**: Check that you have permission to edit (admin only)

Refer to **EVENTS_SYSTEM_COMPLETE.md** for detailed technical documentation.

