# Smart Events - Unified Frontend Structure

## Overview
This document outlines the standardized frontend structure for the Smart Events application. All HTML files should follow this pattern for consistency, styling, and functionality.

---

## File Organization Structure

```
Smart-Events/
├── index.html                              # Main entry point (Modern SPA)
├── assets/                                 # Shared assets
│   ├── css/
│   │   ├── tailwind.css                   # Tailwind config & utilities
│   │   └── global-styles.css              # Global overrides
│   ├── js/
│   │   ├── app.js                         # Main application logic
│   │   ├── api-client.js                  # API communication
│   │   └── utilities.js                   # Helper functions
│   └── images/                            # All images
├── admin/                                  # Admin Dashboard (SPA)
│   ├── index.html                         # Admin entry point
│   ├── css/
│   │   ├── admin-theme.css               # Admin-specific overrides
│   │   └── admin-components.css          # Admin component styles
│   └── js/
│       ├── admin-app.js                  # Admin logic
│       └── admin-modules/
│           ├── dashboard.js
│           ├── events.js
│           ├── coordinators.js
│           ├── users.js
│           └── tasks.js
└── client/                                 # Client Portal (SPA)
    ├── index.html                         # Client entry point
    ├── css/
    │   └── client-theme.css              # Client-specific overrides
    └── js/
        ├── client-app.js                 # Client logic
        └── client-modules/
            ├── browse-events.js
            ├── my-registrations.js
            └── calendar.js
```

---

## HTML Template Structure

Every HTML file should follow this standardized structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Events - [Page Title]</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Third-party Libraries -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js"></script>
  
  <!-- Tailwind Config -->
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#2563EB',
            secondary: '#1D4ED8',
          }
        }
      }
    }
  </script>
  
  <!-- Global Styles -->
  <style>
    body { font-family: 'Inter', sans-serif; }
    /* Global CSS here */
  </style>
  
  <!-- Page-specific Styles -->
  <style>
    /* Page-specific CSS here */
  </style>
</head>

<body class="bg-white text-slate-900 min-h-screen">
  <!-- Splash Screen -->
  <div id="splashScreen" class="fixed inset-0 bg-white flex items-center justify-center z-50">
    <!-- Loader content -->
  </div>

  <!-- Main App Container -->
  <div id="app" class="min-h-screen">
    <!-- Navigation -->
    <nav></nav>
    
    <!-- Main Content -->
    <main></main>
    
    <!-- Modals -->
    <div id="modalBackdrop"></div>
  </div>

  <!-- Scripts -->
  <script src="../assets/js/utilities.js"></script>
  <script src="../assets/js/api-client.js"></script>
  <script>
    // Page-specific logic
  </script>
</body>
</html>
```

---

## CSS Organization

### Global Styles (assets/css/global-styles.css)
```css
:root {
  --primary: #2563EB;
  --secondary: #1D4ED8;
  --bg: #ffffff;
  --text: #111827;
  --border: #f1f5f9;
  --muted: #94a3b8;
}

body {
  font-family: 'Inter', sans-serif;
  color: var(--text);
  background: var(--bg);
}

/* Reusable components */
.ui-card { /* card styling */ }
.ui-btn { /* button styling */ }
.ui-input { /* input styling */ }
```

### Theme-specific Overrides
- **admin/css/admin-theme.css** - Admin dashboard styling
- **client/css/client-theme.css** - Client portal styling

---

## JavaScript Organization

### API Client (assets/js/api-client.js)
```javascript
class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  async request(endpoint, method = 'GET', data = null) {
    // API request logic
  }

  async getEvents() { }
  async getRegistrations() { }
  async loginAdmin(email, password) { }
  // ... other methods
}

const api = new APIClient();
```

### Utilities (assets/js/utilities.js)
```javascript
const UI = {
  showModal: (id) => { },
  hideModal: (id) => { },
  showNotification: (message, type) => { },
  // ... other utilities
}

const state = {
  user: null,
  events: [],
  // ... app state
}
```

### App Logic (page-specific JS files)
```javascript
// admin/js/admin-app.js
class AdminDashboard {
  constructor() {
    this.api = new APIClient();
  }

  async init() {
    // Initialize admin dashboard
  }

  async renderDashboard() { }
  async renderEvents() { }
  // ... other methods
}

const dashboard = new AdminDashboard();
```

---

## Component Classes & Utilities

### Tailwind Utility Classes Used
- **Spacing**: `p-6`, `m-4`, `gap-6` (padding, margin, gap)
- **Colors**: `bg-blue-600`, `text-slate-900`, `border-slate-200`
- **Typography**: `text-lg`, `font-semibold`, `font-500`
- **Layout**: `flex`, `grid`, `md:grid-cols-2`, `lg:grid-cols-3`
- **Sizing**: `w-full`, `h-screen`, `max-w-7xl`
- **Effects**: `shadow-sm`, `rounded-xl`, `transition`

### Reusable Component HTML Patterns

#### Card Component
```html
<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
  <h2 class="text-lg font-semibold text-slate-900">Title</h2>
  <!-- Content -->
</div>
```

#### Button Styles
```html
<!-- Primary -->
<button class="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
  Action
</button>

<!-- Secondary -->
<button class="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition">
  Secondary
</button>
```

#### Table Component
```html
<div class="bg-white rounded-xl shadow-sm overflow-hidden">
  <table class="w-full">
    <thead class="bg-slate-50 border-b border-slate-200">
      <tr>
        <th class="px-6 py-3 text-left text-sm font-semibold text-slate-900">Column</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b hover:bg-slate-50">
        <td class="px-6 py-3 text-sm text-slate-700">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Modal Component
```html
<div id="myModal" class="fixed inset-0 bg-black/40 hidden items-center justify-center z-50">
  <div class="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
    <h2 class="text-xl font-semibold mb-4">Modal Title</h2>
    <!-- Content -->
    <div class="flex gap-3 justify-end mt-6">
      <button class="...">Cancel</button>
      <button class="...">Confirm</button>
    </div>
  </div>
</div>
```

---

## Backend Integration

### API Endpoints Structure
```
/api/
├── admin_login.php          # Admin authentication
├── events.php               # Events CRUD
├── coordinators.php         # Coordinators management
├── participants.php         # Participants/Registrations
├── users.php                # User management
├── tasks.php                # Task management
├── attendance.php           # Check-in/attendance
└── reports.php              # Reporting & analytics
```

### API Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "error": null
}
```

### Frontend API Calls
```javascript
// Getting events
const events = await api.request('/api/events.php', 'GET');

// Creating event
await api.request('/api/events.php', 'POST', {
  title: 'Event Name',
  date: '2024-02-20',
  // ... other fields
});

// Authenticating
const auth = await api.request('/api/admin_login.php', 'POST', {
  email: 'admin@example.com',
  password: 'password'
});
```

---

## Responsive Design Guidelines

### Breakpoints (Tailwind)
- **Mobile**: < 640px (`sm:` classname)
- **Tablet**: 640px - 768px (`md:` classname)
- **Desktop**: > 769px (`lg:` classname)

### Example Responsive Layout
```html
<!-- Mobile: 1 column | Tablet: 2 columns | Desktop: 3 columns -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Items -->
</div>

<!-- Mobile: full width | Desktop: sidebar layout -->
<div class="flex flex-col lg:flex-row gap-6">
  <aside class="lg:w-64"><!-- Sidebar --></aside>
  <main class="flex-1"><!-- Content --></main>
</div>
```

---

## Color Scheme

### Primary Colors
- **Blue 600**: `#2563EB` - Primary actions, links
- **Blue 700**: `#1D4ED8` - Hover states
- **Slate 50**: `#f8fafc` - Light backgrounds
- **Slate 900**: `#111827` - Text content

### Status Colors
- **Green**: Success, attended
- **Red**: Errors, not attended
- **Yellow**: Pending, warnings
- **Blue**: Info, active

---

## Best Practices

1. **CSS First**: Use Tailwind utility classes before custom CSS
2. **Responsive Design**: Always test mobile, tablet, desktop views
3. **Accessibility**: Use semantic HTML, proper ARIA labels
4. **Performance**: Minimize custom JS, use event delegation
5. **Modularity**: Keep JS organized in separate files by feature
6. **Consistency**: Follow the same patterns across all pages
7. **DRY**: Don't repeat code - create reusable functions/components

---

## Implementation Steps

1. ✅ Create unified assets/js structure
2. ✅ Create unified assets/css structure
3. ✅ Refactor admin/index.html to match template
4. ✅ Refactor admin subpages (coordinators.html, etc.)
5. ✅ Refactor client/index.html to match template
6. ✅ Update all CSS files to use Tailwind
7. ✅ Consolidate JS files
8. ✅ Test all API integrations
9. ✅ Test responsive design
10. ✅ Cross-browser testing

---
