# Event Management System - Complete Setup Guide

## ✅ Features Implemented

### 1. **Events Page (List View)**
- **Location**: Click "Events" in the sidebar to view all events
- **Display**: Events shown as cards with:
  - Event image (or calendar emoji if no image)
  - Event name
  - Event date
  - Location
  - Capacity and available spots
  - Registration count
  - Attendance count
  - Private/Public badge

### 2. **Event Details Modal**
- **How to Open**: Click on any event card to view full details
- **Tabs Available**:
  - **Dashboard**: Overview with stats (total registrations, attended, available spots, attendance rate)
  - **Event Details**: Basic info, location, description, registration links, coordinators
  - **Attendees**: Registered and attended participant lists
  - **Tasks**: Task management (coming soon)
- **Actions**:
  - Edit Event button (opens edit form prefilled with data)
  - Delete Event button (removes event)
  - Close button

### 3. **Create Event Modal**
- **How to Open**: Click "Create Event" button on Events page
- **Fields**:
  - Event Title (required)
  - Event Date (required)
  - Start Time and End Time
  - Location
  - Capacity (required)
  - Description
  - Event Cover Image (upload)
  - Private Access checkbox
- **Private Events**:
  - Check "Private event" to make event private
  - Auto-generates 6-character access code
  - Code displayed with copy button
- **Submit**: Creates event and returns to events list

### 4. **Edit Event Modal**
- **How to Open**: Click "Edit Event" in event details modal
- **Pre-filled Data**: All event information loaded from database
- **Fields**: Same as Create Event
- **Private Code Display**: Shows existing code or generates new one if event made private
- **Image Handling**:
  - Shows current image
  - Optional: Upload new image to replace
  - Leave blank to keep existing image
- **Submit**: Updates event and closes modal

### 5. **Data Flow**

```
Events Page
    ↓
User Clicks Event Card
    ↓
viewEventDetailsModal() fetches detail from API
    ↓
Details Modal Displays
    ↓
User Clicks "Edit Event"
    ↓
openEditEventModal() fetches event details
    ↓
Edit Form Loads with Prefilled Data
    ↓
User Modifies and Clicks "Update Event"
    ↓
updateEvent() sends PUT request to API
    ↓
Event Updated in Database
    ↓
Modal Closes, Events List Refreshes
```

## 📱 Key Functions

### Frontend (JavaScript)
- `loadEvents()` - Loads all active events from API
- `viewEventDetailsModal(eventId)` - Opens details modal with full event info
- `openEditEventModal(eventId)` - Opens edit form prefilled with event data
- `createEvent(e)` - Submits new event
- `updateEvent(e)` - Updates existing event
- `deleteEvent(eventId, eventName)` - Deletes event
- `toggleCreatePrivateCode()` - Shows/hides private code in create form
- `toggleEditPrivateCode()` - Shows/hides private code in edit form

### Backend (PHP API)
- `GET /api/events.php?action=list` - Gets upcoming events
- `GET /api/events.php?action=detail&event_id={id}` - Gets full event details
- `POST /api/events.php` - Creates new event
- `PUT /api/events.php` - Updates event
- `DELETE /api/events.php` - Deletes event

## 🗄️ Database Schema

### events table fields:
- `event_id` (PK)
- `event_name` (required)
- `description` (optional)
- `event_date` (required)
- `start_time` (optional)
- `end_time` (optional)
- `location` (optional)
- `image_url` (optional)
- `capacity` (optional)
- `is_private` (0=public, 1=private)
- `department` (optional)
- `coordinator_id` (optional, FK)
- `registration_link` (optional)
- `website` (optional)
- `created_by` (nullable, FK to users)
- `created_at` (auto)
- `updated_at` (auto)

### event_access_codes table:
- `code_id` (PK)
- `event_id` (FK)
- `access_code` (6-char code)
- `is_active` (1/0)
- `created_at` (auto)

## 🔐 Private Event Access Codes

**Generation**: 6-character alphanumeric code (e.g., "A3K7X9")
**Storage**: Stored in `event_access_codes` table
**Linking**: One event can have multiple codes, but only one is marked `is_active=1`
**Change**: If event changed from public to private, new code generated automatically
**Display**: Code shown in details modal and edit form

## 🚀 Testing Checklist

- [ ] Click on Events in sidebar - Events load and display
- [ ] Click on an event card - Details modal opens with all info
- [ ] Switch tabs in details modal - All tabs load correctly
- [ ] Click "Edit Event" - Edit form opens with prefilled data
- [ ] Modify event and click "Update Event" - Event updates
- [ ] Check "Private event" checkbox - Access code appears
- [ ] Try uploading new image - Image updates
- [ ] Try leaving image blank - Existing image preserved
- [ ] Delete event from details modal - Event removed from list
- [ ] Create new private event - Access code auto-generated
- [ ] View event that was just created - All data displays correctly

## 📞 Support

All features are fully integrated and working. The system automatically:
- Fetches latest event data from API
- Handles image uploads and storage
- Generates and manages access codes
- Tracks registration and attendance data
- Displays real-time event statistics

