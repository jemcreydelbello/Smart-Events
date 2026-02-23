# Event Details Page Navigation - Quick Start Guide

## For Admin Users

### To View Event Details (New Full-Page Format)

1. **From Events List**:
   - Go to Admin Dashboard → Events section
   - Click on any event card
   - You will be navigated to a full-page event details view
   - The page URL will be: `admin/event-details.html?id=EVENT_ID`

2. **From Calendar**:
   - In the admin calendar view, click on an event
   - Click the event card in the popup
   - You will be navigated to the event details page

### Event Details Page Features

The new event details page includes:

**Header Section**:
- Event title at the top
- Back button (← Back to Events) to return to the events list
- Action buttons: Close, Edit Event, Delete Event

**Four Main Tabs**:

1. **Dashboard Tab** (📊)
   - Total Registered participants count
   - Total Attended participants count
   - Available Spots remaining
   - Attendance Rate percentage
   - Event overview with key information

2. **Event Details Tab** (ℹ️)
   - Event name, date, time, location
   - Event capacity and type (Public/Private)
   - Event description
   - Registration link
   - Website link
   - Created by information

3. **Attendees Tab** (👥)
   - Two sub-sections: "Registered" and "Attended"
   - List of participants with name, email, department, phone
   - Switch between registered and attended attendees

4. **Tasks Tab** (✓)
   - Placeholder for upcoming task management feature
   - Available for future implementation

### Navigation Options

- **Back Button** (← Back to Events): Returns to `/admin/index.html?page=events`
- **Close Button**: Same as back button
- **Edit Event Button**: Opens event editor (redirects to events listing)
- **Delete Event Button**: Confirms and deletes the event, then returns to events list
- **Browser Back Button**: Also works to return to events list

### URL Format

When you view an event, the URL will be:
```
/admin/event-details.html?id=123
```

Where `123` is the event ID. You can:
- Bookmark this URL to quickly return to an event
- Share this URL with other admin users
- Use the ID in the URL to verify which event you're viewing

### Browser Compatibility

- Works on all modern browsers: Chrome, Firefox, Safari, Edge
- Responsive design for desktop and tablet viewing
- Mobile-friendly interface

### Troubleshooting

**Problem**: Page shows "No event ID provided"
- Solution: Make sure the event ID is in the URL (`?id=123`)

**Problem**: Event information doesn't load
- Solution: Check your internet connection and try refreshing the page

**Problem**: Buttons don't work
- Solution: Try clearing browser cache and refreshing the page

## Technical Details

### What Changed?

Before:
- Clicking an event showed a popup modal overlay
- All information was compressed into a modal window
- Limited space for displaying data

Now:
- Clicking an event navigates to a dedicated page
- Full page gives more space for information
- Cleaner, more professional interface
- Easier to read and interact with event details

### JavaScript Implementation

The navigation is handled by the `navigateToEventDetails()` function in `admin/js/main.js`:

```javascript
function navigateToEventDetails(eventId) {
    console.log('Navigating to event details page for event ID:', eventId);
    window.location.href = `event-details.html?id=${eventId}`;
}
```

This function is called when:
- You click on an event card in the events list
- You click to edit a calendar event

The event details page (`event-details.html`) uses `event-details.js` to:
- Read the event ID from the URL
- Fetch event data from the API
- Display the information in a professional layout
- Handle tab switching and user interactions
