# Other Information Feature - Implementation Guide

## Overview
Added full CRUD support for custom "Other Information" metadata fields attached to events. These custom fields display in both admin and client event details.

## What Was Implemented

### 1. Database
**File**: `MIGRATE_EVENT_METADATA.sql`
- Created `event_metadata` table to store custom field/value pairs
- Each metadata record linked to an event via `event_id`
- Unique constraint ensures one field name per event
- Auto timestamps for created_at and updated_at

**Table Schema**:
```sql
CREATE TABLE event_metadata (
    metadata_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_value LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    UNIQUE KEY unique_field_per_event (event_id, field_name)
);
```

### 2. API Endpoint
**File**: `/api/metadata.php`

**GET Requests**:
- `?action=list&event_id={id}` - Get all metadata for an event

**POST Requests**:
- `action=create` - Create new metadata field
  - Required: `event_id`, `field_name`, `field_value`
  - On duplicate key: Updates existing field

- `action=update` - Update existing metadata
  - Required: `metadata_id`, `field_name`, `field_value`

- `action=delete` - Delete metadata field
  - Required: `metadata_id`

**Response Format**: JSON with `success`, `data`, and `message` fields

### 3. Admin Interface

#### Modals Added
**Create Modal** (`#createOtherInformationModal`):
- Field input (text input)
- Value input (textarea)
- Cancel and Create buttons

**Edit Modal** (`#editOtherInformationModal`):
- Same fields as create
- Pre-populated with existing data
- Cancel and Update buttons

#### JavaScript Functions
**Admin HTML** (`/admin/index.html`):
- `openCreateOtherInformationModal(eventId)` - Opens create modal
- `submitOtherInformation()` - Submits new metadata to API
- `loadEventMetadata(eventId)` - Fetches metadata from API
- `displayEventMetadata(metadata)` - Renders metadata list with edit/delete buttons
- `openEditOtherInformationModal(metadataId, fieldName, fieldValue)` - Opens edit modal
- `submitEditOtherInformation()` - Updates metadata via API
- `deleteOtherInformation(metadataId)` - Deletes metadata with confirmation
- `escapeHtml(text)` - Security function to prevent XSS

#### Display Section (Admin)
Add this HTML to your Event Details:
```html
<div id="otherInformationContainer">
  <h3>Other Information</h3>
  <div style="display: flex; gap: 8px; margin-bottom: 12px;">
    <input type="text" id="fieldValueSearch" placeholder="Search field/value..." 
           class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
    <button onclick="openCreateOtherInformationModal(eventId)" 
            class="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold text-sm">
      Create
    </button>
  </div>
  <div id="otherInformationList">
    <!-- Metadata items will be rendered here -->
  </div>
</div>
```

### 4. Client Interface

#### JavaScript Functions
**Client JS** (`/client/js/client.js`):
- `loadClientEventMetadata(eventId)` - Fetches metadata for a specific event
- `displayClientEventMetadata(metadata)` - Renders metadata in event modal
- `createOtherInformationSection()` - Creates the section dynamically if needed
- `escapeHtml(text)` - Security function

#### Display in Event Modal
Metadata automatically displays in the event modal after event details under "Other Information" section.

**Format**:
- Field name as bold header
- Field value displayed below (preserves formatting)
- Separated by dividers between items

## Usage Flow

### Admin - Creating Other Information
1. View event details → Click "Create" button in Other Information section
2. Enter Field name (e.g., "Emergency Contact", "Lead Organizer")
3. Enter Field value (any text, can be multi-line)
4. Click "Create" → Metadata saves and displays immediately

### Admin - Editing Other Information
1. In Other Information section, click "✏️ Edit" on any item
2. Modal opens with current values
3. Modify as needed
4. Click "Update" → Changes save immediately

### Admin - Deleting Other Information
1. In Other Information section, click "🗑️ Delete" on any item
2. Confirm deletion
3. Item removed from database and display

### Client - Viewing Other Information
1. Click on any event to open details modal
2. Scroll to "Other Information" section at bottom
3. View all custom fields added by admin
4. Fields display exactly as admin entered them

## Integration Steps

### Step 1: Run Database Migration
```sql
-- Execute MIGRATE_EVENT_METADATA.sql in your MySQL client
-- Or run via PHP:
$migration = file_get_contents('MIGRATE_EVENT_METADATA.sql');
$conn->multi_query($migration);
```

### Step 2: Verify Files
- ✅ `/api/metadata.php` - API endpoint
- ✅ `/admin/index.html` - Admin modals and functions
- ✅ `/client/js/client.js` - Client metadata functions

### Step 3: Add Display in Admin Event Details
Find your Event Details section (likely in a standalone event-details page or admin dashboard) and add:
```html
<div id="otherInformationContainer">
  <!-- Will be populated by displayEventMetadata() -->
</div>
<!-- Before closing form, add create button -->
<button onclick="openCreateOtherInformationModal(currentEventId)" 
        class="btn btn-primary">+ Add Other Information</button>
```

### Step 4: Initialize on Event Load
When loading event details, call:
```javascript
loadEventMetadata(eventId);
```

## API Examples

### Get Metadata
```javascript
fetch('/api/metadata.php?action=list&event_id=5')
  .then(r => r.json())
  .then(data => console.log(data.data)); // Array of metadata items
```

### Create Metadata
```javascript
fetch('/api/metadata.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create',
    event_id: 5,
    field_name: 'Emergency Contact',
    field_value: '+1 555 0188'
  })
})
.then(r => r.json())
.then(data => console.log(data.message));
```

### Update Metadata
```javascript
fetch('/api/metadata.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update',
    metadata_id: 42,
    field_name: 'Emergency Contact',
    field_value: '+1 555 0199'
  })
})
```

### Delete Metadata
```javascript
fetch('/api/metadata.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'delete',
    metadata_id: 42
  })
})
```

## Security Notes
- All user inputs are HTML-escaped to prevent XSS
- Metadata inherits event's privacy setting (private events don't show metadata to public)
- API validates event_id exists before allowing metadata operations
- Unique constraint prevents duplicate field names per event

## Database Cascade
- Deleting an event automatically deletes all its associated metadata
- This prevents orphaned records

## Future Enhancements (Optional)
- Field type validation (text, date, number, etc.)
- Default field templates ("Emergency Contact", "Venue Details", etc.)
- Metadata visibility controls (admin-only, client-visible, etc.)
- Search/filter within metadata
- Import metadata from CSV
- Export metadata with event details
