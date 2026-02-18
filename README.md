# Events.Net - Corporate Event Portal - Admin Dashboard

A professional event management system built with PHP, MySQL, HTML, CSS, and JavaScript. This admin dashboard allows you to manage events, participants, track attendance, and generate comprehensive reports.

## Features

✅ **Dashboard** - Real-time statistics and trends
- Total events and registrations
- Daily attendance tracking
- Registration trends chart
- Attendance status visualization

✅ **Events Management**
- Create, view, and manage events
- Set event details (date, time, location)
- Track registrations per event
- Public/Private event options

✅ **Participants Management**
- View all registered participants
- Search functionality
- Filter by status and event
- Department assignment tracking

✅ **QR Code Scanner**
- Real-time check-in system
- Webcam integration
- Recent scans history
- Quick participant lookup

✅ **Reports**
- Event Summary Report
- Participant Master List
- Checked-in Attendance Report
- Absentees/No-show Report
- Registration Timeline
- CSV Export functionality

## System Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- XAMPP (recommended) or any web server with PHP support
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation Steps

### 1. Download/Clone the Project
```bash
# Place the EventSystem folder in your XAMPP htdocs directory:
# C:\xampp\htdocs\EventSystem\
```

### 2. Initialize the Database
1. Open your browser and navigate to:
   ```
   http://localhost/EventSystem/setup.php
   ```
2. The script will automatically create the database and tables
3. Sample data will be inserted including one admin user

### 3. Start XAMPP Services
- Start Apache and MySQL from XAMPP Control Panel

### 4. Access the Admin Dashboard
Navigate to:
```
http://localhost/EventSystem/index.html
```

## Default Admin Credentials

After running setup.php:
- **Email:** admin@eventsystem.local
- **Password:** admin123

⚠️ **Important:** Change these credentials in production!

## Database Schema

### Tables Structure

```sql
- roles: User roles (ADMIN, PARTICIPANT)
- departments: Company departments
- users: User accounts and profiles
- events: Event information
- registrations: Event registrations
- attendance_logs: Check-in history
- event_access_codes: Private event codes
- audit_logs: System activity logs
- system_settings: Configuration storage
```

## API Endpoints

### Dashboard
```
GET /api/dashboard.php
```
Returns: Total events, registrations, attendance stats, trends

### Events
```
GET /api/events.php?action=list
GET /api/events.php?action=detail&event_id=1
POST /api/events.php (Create new event)
```

### Participants
```
GET /api/participants.php?action=list
GET /api/participants.php?action=search&q=query
```

### Attendance
```
POST /api/attendance.php (Mark attendance)
GET /api/attendance.php?action=by_registration&registration_id=1
```

### Reports
```
GET /api/reports.php?action=event_summary
GET /api/reports.php?action=participant_master
GET /api/reports.php?action=checked_in_attendance
GET /api/reports.php?action=absentees
GET /api/reports.php?action=registration_timeline
```

### Exports
```
GET /api/export.php?report=participant_master
GET /api/export.php?report=attendance
```

## File Structure

```
EventSystem/
├── index.html                 # Main admin dashboard
├── qr-scanner.html           # QR code scanner page
├── setup.php                 # Database initialization
├── db_config.php             # Database configuration
├── css/
│   └── styles.css            # Main stylesheet
├── js/
│   └── main.js               # Main JavaScript logic
└── api/
    ├── dashboard.php         # Dashboard API
    ├── events.php            # Events API
    ├── participants.php      # Participants API
    ├── attendance.php        # Attendance API
    ├── reports.php           # Reports API
    └── export.php            # Export API
```

## Features Breakdown

### Dashboard
- **Statistics Cards**: Real-time KPIs
- **Registration Trends**: 30-day trend visualization
- **Attendance Status**: Pie chart showing attended vs pending

### Events Management
- **Event Grid**: Visual event cards with stats
- **Create Event Modal**: Easy event creation form
- **Event Details**: Registration count and attendance tracking

### Participants
- **Search Bar**: Real-time participant search
- **Filters**: Status and event filters
- **Table View**: Comprehensive participant data

### Reports
- **5 Report Types**: Different analysis perspectives
- **Preview Function**: Quick data peek
- **CSV Export**: Download data for further analysis

### QR Scanner
- **Real-time Scanning**: Continuous QR code detection
- **Participant Display**: Instant participant information
- **Quick Check-in**: One-click attendance marking
- **Recent Scans**: History of check-ins

## Customization

### Change Database Connection
Edit `db_config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'eventsystem');
```

### Customize Colors
Edit `css/styles.css`:
```css
:root {
    --primary-red: #C41E3A;      /* Wells Fargo red */
    --dark-blue: #1A3A52;         /* Primary dark */
    --success-green: #28A745;     /* Success color */
}
```

## Troubleshooting

### Database Connection Error
- Check MySQL is running in XAMPP
- Verify credentials in db_config.php
- Ensure 'eventsystem' database exists

### Charts Not Loading
- Verify Chart.js library is loaded
- Check console for JavaScript errors
- Refresh the page

### QR Scanner Not Working
- Enable camera permission in browser
- Check browser console for errors
- Ensure HTTPS or localhost (required for camera access)

## Security Notes

- Change default admin password immediately
- Use HTTPS in production
- Validate all user inputs server-side
- Keep database backups regularly
- Restrict file permissions appropriately

## Support & Maintenance

For issues or enhancements:
1. Check error logs in browser console (F12)
2. Review PHP error logs
3. Verify database connections
4. Check file permissions

## Version History

- **v1.0** - Initial release with full admin dashboard and reporting

## License

This project is provided as-is for corporate event management purposes.

---

**Built with ❤️ for Wells Fargo Events.Net**
