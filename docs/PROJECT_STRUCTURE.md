# Smart Events - Project Organization Guide

## 📁 Directory Structure

```
Smart-Events/
├── admin/                      # Admin Panel
│   ├── pages/                  # Page templates
│   ├── includes/               # Shared PHP includes
│   ├── css/
│   │   ├── event-details.css   # Event details page styles
│   │   ├── login.css           # Login page styles
│   │   └── styles.css          # General admin styles
│   ├── js/
│   │   ├── event-details.js    # Event details page logic
│   │   ├── catalogue.js        # Catalogue feature
│   │   ├── coordinators.js     # Coordinators management
│   │   ├── dashboard-api.js    # Dashboard API calls
│   │   └── main.js             # Main admin script
│   ├── images/                 # Admin images/uploads
│   ├── event-details.html      # Event details page
│   ├── index.html              # Admin dashboard
│   ├── login.html              # Admin login
│   ├── coordinators.html       # Coordinators page
│   └── ...                     # Other admin pages
│
├── client/                     # Client Portal
│   ├── pages/                  # Client page templates
│   ├── css/
│   │   ├── styles.css          # Main client stylesheet
│   │   └── client.css          # Client specific styles
│   ├── js/
│   │   ├── client.js           # Main client script
│   │   └── ...                 # Client-specific JS
│   ├── index.html              # Client homepage
│   └── ...                     # Other client pages
│
├── api/                        # RESTful API
│   ├── endpoints/              # Organized API endpoints
│   │   ├── events.php
│   │   ├── participants.php
│   │   ├── tasks.php
│   │   ├── auth.php
│   │   └── ...
│   ├── events.php              # Events API
│   ├── participants.php        # Participants API
│   ├── tasks.php               # Tasks API
│   └── ...                     # Other API files
│
├── config/                     # Configuration
│   ├── db_config.php           # Database configuration
│   ├── constants.php           # Application constants
│   └── ...                     # Other configs
│
├── includes/                   # Shared Includes
│   ├── helpers.php             # Helper functions
│   ├── validators.php          # Form validators
│   ├── middleware.php          # Authentication middleware
│   └── ...                     # Other shared includes
│
├── assets/                     # Static Assets
│   ├── css/
│   │   └── admin-dashboard.css # Shared admin styles
│   ├── js/
│   │   ├── qrcodejs/
│   │   └── jsQR.js
│   ├── images/
│   ├── fonts/
│   └── logo2.png
│
├── uploads/                    # User Uploads
│   ├── events/                 # Event images
│   ├── profiles/               # User profile images
│   └── ...
│
├── tests/                      # Test Files
│   ├── unit/
│   ├── integration/
│   └── test-*.php              # Individual test files
│
├── scripts/                    # One-off Scripts
│   ├── setup.php               # Initial setup
│   ├── migrations/
│   │   └── migrate_*.php
│   └── ...
│
├── docs/                       # Documentation
│   ├── DATABASE_SETUP.md
│   ├── API_REFERENCE.md
│   ├── INSTALLATION_GUIDE.md
│   └── ...
│
├── db_config.php               # Main DB config
├── index.html                  # Root index
├── composer.json               # Dependencies
├── README.md                   # Project README
└── .git/                       # Git repository
```

## 📋 File Organization Rules

### CSS Files
- **Admin Panel**: All styles in `admin/css/event-details.css` for event details page
- **Client Portal**: All styles in `client/css/styles.css`
- **Shared**: Base styles in `assets/css/admin-dashboard.css`
- **No inline styles** in HTML (use CSS classes)

### JavaScript Files
- **Feature-specific**: Keep in dedicated files (e.g., `catalogue.js`, `coordinators.js`)
- **Location**: Store in `admin/js/` or `client/js/`
- **Naming**: Use descriptive names (e.g., `event-details.js`, not `script.js`)

### PHP Files
- **API endpoints**: Move to `api/endpoints/` and organize by resource type
- **Shared functions**: Keep in `includes/`
- **Configuration**: Keep in `config/`
- **Tests**: Move test files to `tests/` folder
- **Scripts**: Move setup/migration scripts to `scripts/` folder

### Documentation
- **Guides**: Move to `docs/` folder
- **Quick reference**: Prefix with `QUICK_REFERENCE_`
- **Implementation notes**: Prefix with `IMPLEMENTATION_` or `FEATURE_`

## 🎯 Next Steps

### Phase 1: File Organization (In Progress)
- [x] Create folder structure
- [x] Create CSS files
- [ ] Move test files to `/tests`
- [ ] Move scripts to `/scripts`
- [ ] Move docs to `/docs`
- [ ] Organize API endpoints in `/api/endpoints`

### Phase 2: Code Refactoring
- [ ] Remove all inline styles from HTML
- [ ] Consolidate duplicate CSS rules
- [ ] Update all file paths in HTML/PHP
- [ ] Create CSS utility class library

### Phase 3: Documentation
- [ ] Create API reference documentation
- [ ] Create deployment guide
- [ ] Create development setup guide
- [ ] Create database schema documentation

## 🔍 Current Files to Migrate

### Move to `/tests/`
```
comprehensive-test.php
comprehensive-test.php
test-api-direct.php
test-api-http.php
test-columns.php
test-coordinator-create.php
test-create-coordinator.php
test-db.php
test-endpoints.php
test-fix.php
test-post-direct.php
test-table.php
test.php
test_attendees.php
test_calendar.php
test_password.php
check_malolos.php
check-endpoints.php
check-events.php
check-images.php
quick-test.php
simple-test.php
final-test.php
minimal-test.php
```

### Move to `/scripts/`
```
setup.php
setup-coordinator.php
create_test_coordinator.php
create_test_registrations.php
create_test_tasks.php
fix_event_type.php
fix_password_hash.php
migrate_users_table.php
migrate-coordinator-event.php
add_more_registrations.php
run_migration.php
update_test_data.php
write-events.php
diagnostic.php
debug-*.php
```

### Move to `/docs/`
```
*.md (all markdown documentation files)
*.txt (documentation text files)
```

## 🎨 CSS Class Examples

### Buttons
```css
.btn-primary       /* Red button */
.btn-secondary     /* Dark button */
.btn-outline       /* Outlined button */
.btn-sm            /* Small button */
.btn-block         /* Full width button */
```

### Cards
```css
.card              /* White card with shadow */
.card-header       /* Card header section */
.card-body         /* Card content section */
.card-footer       /* Card footer section */
```

### Layout
```css
.container         /* Max-width centered container */
.flex              /* Flexbox layout */
.flex-center       /* Centered flex layout */
.flex-between      /* Space-between flex layout */
.gap-1/2/3/4       /* Gap between flex items */
```

### Utilities
```css
.mt-1/2/3/4        /* Margin top */
.mb-1/2/3/4        /* Margin bottom */
.py-1/2/3/4        /* Padding vertical */
.px-1/2/3/4        /* Padding horizontal */
.hidden            /* Display none */
.visible           /* Display block */
.text-center       /* Center text */
.cursor-pointer    /* Pointer cursor */
.shadow            /* Drop shadow */
.rounded           /* Rounded corners */
```

## 📝 Naming Conventions

### Files
- `kebab-case` for file names: `event-details.js`, `admin-dashboard.css`
- Prefixes for organization: `test-`, `debug-`, `migrate-`

### Classes
- `kebab-case` for CSS classes: `.event-card`, `.stat-value`
- BEM methodology: `.card__header`, `.card__body`
- State classes: `.active`, `.disabled`, `.loading`

### JavaScript Variables
- `camelCase`: `currentEventId`, `attendeesData`
- Constants: `UPPER_SNAKE_CASE`: `API_BASE`

### PHP Functions
- `snake_case`: `check_event_access()`, `load_attendees()`
- Class methods: `camelCase()` or `snake_case()` consistently

## 🚀 Best Practices

1. **CSS**: Use CSS files, never inline styles
2. **JavaScript**: Keep files focused on specific features
3. **PHP**: Group related functionality together
4. **Documentation**: Keep docs close to the code they describe
5. **Tests**: Run tests regularly and keep them isolated
6. **Git**: Commit organized changes with clear messages

## 📞 Support

For questions about the organization structure, refer to:
- This file for overview
- Specific `IMPLEMENTATION_*` files for feature details
- Code comments for complex logic
