# CSS Quick Reference Guide

## 📍 Where CSS Files Are Located

| Page/Section | CSS File | Location |
|--------------|----------|----------|
| Event Details | `event-details.css` | `/admin/css/` |
| Admin Pages | `styles.css` | `/admin/css/` |
| Login Page | `login.css` | `/admin/css/` |
| Client Portal | `styles.css` | `/client/css/` |
| Shared Admin | `admin-dashboard.css` | `/assets/css/` |

## 🎨 CSS Classes by Category

### Button Classes
```css
.btn-primary        /* Red button - main action */
.btn-secondary      /* Dark button */
.btn-danger         /* Red/destructive action */
.btn-success        /* Green button */
.btn-outline        /* Transparent with border */
.btn-sm             /* Smaller button */
.btn-block          /* Full width */
.btn-disabled       /* Disabled state */
```

**Usage:**
```html
<button class="btn btn-primary">Click Me</button>
<button class="btn btn-danger btn-sm">Delete</button>
<button class="btn btn-outline btn-block">Submit</button>
```

### Card Classes
```css
.card               /* White card with shadow */
.card-header        /* Card top section */
.card-body          /* Card middle section */
.card-footer        /* Card bottom section */
```

**Usage:**
```html
<div class="card">
    <div class="card-header">
        <h3>Title</h3>
    </div>
    <div class="card-body">
        Content here
    </div>
    <div class="card-footer">
        Footer content
    </div>
</div>
```

### Layout Classes
```css
.container          /* Max-width centered */
.section            /* Page section */
.flex               /* Flexbox layout */
.flex-center        /* Flex centered */
.flex-between       /* Flex space-between */
.grid               /* CSS Grid */
```

**Usage:**
```html
<div class="flex gap-2">
    <div>Item 1</div>
    <div>Item 2</div>
</div>

<div class="container">
    <!-- Centered content -->
</div>
```

### Gap Classes (Flex/Grid)
```css
.gap-1              /* 0.5rem gap */
.gap-2              /* 1rem gap */
.gap-3              /* 1.5rem gap */
.gap-4              /* 2rem gap */
```

**Usage:**
```html
<div class="flex gap-2">
    <!-- Items with 1rem gap -->
</div>
```

### Margin Classes
```css
.mt-1 .mt-2 .mt-3 .mt-4    /* Margin top */
.mb-1 .mb-2 .mb-3 .mb-4    /* Margin bottom */
.my-1 .my-2 .my-3 .my-4    /* Margin vertical */
```

**Usage:**
```html
<div class="mt-2 mb-3">
    Content with top and bottom margin
</div>
```

### Padding Classes
```css
.py-1 .py-2 .py-3 .py-4    /* Padding vertical */
.px-1 .px-2 .px-3 .px-4    /* Padding horizontal */
.p-1 .p-2 .p-3 .p-4        /* Padding all */
```

**Usage:**
```html
<div class="py-2 px-3">
    Content with padding
</div>
```

### Text Classes
```css
.text-center                /* Center text */
.text-left                  /* Left align */
.text-right                 /* Right align */
.text-primary              /* Main text color */
.text-secondary            /* Secondary color */
```

**Usage:**
```html
<p class="text-center text-secondary">Centered secondary text</p>
```

### Display/Visibility Classes
```css
.hidden                     /* display: none */
.visible                    /* display: block */
.flex                       /* display: flex */
.grid                       /* display: grid */
```

**Usage:**
```html
<div class="hidden" id="myModal">
    Hidden by default
</div>

<div class="visible">
    Visible element
</div>
```

### Utility Classes
```css
.w-full                     /* width: 100% */
.h-full                     /* height: 100% */
.cursor-pointer             /* cursor: pointer */
.rounded                    /* border-radius: 8px */
.rounded-lg                 /* border-radius: 12px */
.shadow                     /* box-shadow (small) */
.shadow-lg                  /* box-shadow (large) */
```

**Usage:**
```html
<div class="w-full shadow rounded">
    Full width card with shadow
</div>

<button class="cursor-pointer">
    Clickable button
</button>
```

### Alert Classes
```css
.alert                      /* Base alert */
.alert-success              /* Green alert */
.alert-error .alert-danger  /* Red alert */
.alert-warning              /* Yellow alert */
.alert-info                 /* Blue alert */
```

**Usage:**
```html
<div class="alert alert-success">
    Operation successful!
</div>

<div class="alert alert-error">
    An error occurred.
</div>
```

### Table Classes
```css
.table                      /* Main table */
table thead                 /* Table header */
table tbody                 /* Table body */
table tr:hover              /* Row hover effect */
```

**Usage:**
```html
<table class="table">
    <thead>
        <tr><th>Column 1</th><th>Column 2</th></tr>
    </thead>
    <tbody>
        <tr><td>Data 1</td><td>Data 2</td></tr>
    </tbody>
</table>
```

### Modal Classes
```css
.modal                      /* Modal container */
.modal.active               /* Show modal */
.modal-content              /* Modal wrapper */
.modal-header               /* Modal header */
.modal-title                /* Modal title */
.modal-close                /* Close button */
```

**Usage:**
```html
<div class="modal active">
    <div class="modal-content">
        <div class="modal-header">
            <h2 class="modal-title">Modal Title</h2>
            <button class="modal-close">✕</button>
        </div>
        <!-- Content -->
    </div>
</div>
```

### Form Classes
```css
input, textarea, select     /* All form inputs */
input:focus                 /* Focus state */
.form-group                 /* Form group wrapper */
label                       /* Label styling */
```

**Usage:**
```html
<div class="form-group">
    <label>Email</label>
    <input type="email" placeholder="Enter email">
</div>

<div class="form-group">
    <label>Message</label>
    <textarea placeholder="Enter message"></textarea>
</div>
```

### Event Card Classes (Client)
```css
.event-card                 /* Event card container */
.event-image                /* Event image */
.event-content              /* Card content */
.event-title                /* Event title */
.event-date                 /* Date text */
.event-location             /* Location text */
.event-description          /* Description */
.event-footer               /* Card footer */
.event-status               /* Status badge */
.event-status.active        /* Active status */
```

**Usage:**
```html
<div class="event-card">
    <img class="event-image" src="event.jpg">
    <div class="event-content">
        <h3 class="event-title">Event Name</h3>
        <p class="event-date">March 15, 2024</p>
        <p class="event-location">New York, NY</p>
        <p class="event-description">Event description</p>
        <div class="event-footer">
            <span class="event-status active">Active</span>
        </div>
    </div>
</div>
```

### Stat Card Classes
```css
.stat-card                  /* Stat card */
.stat-card.purple           /* Purple gradient */
.stat-card.pink             /* Pink gradient */
.stat-card.cyan             /* Cyan gradient */
.stat-card.green            /* Green gradient */
.stat-value                 /* Large number */
.stat-label                 /* Label text */
```

**Usage:**
```html
<div class="stat-card purple">
    <div class="stat-value">42</div>
    <div class="stat-label">Total Events</div>
</div>
```

### Tab Classes
```css
.event-tab-btn              /* Tab button */
.event-tab-btn.active       /* Active tab */
.event-tab-content          /* Tab content */
.event-tab-content.active   /* Visible content */
```

**Usage:**
```html
<button class="event-tab-btn active">Tab 1</button>
<button class="event-tab-btn">Tab 2</button>

<div class="event-tab-content active">Content 1</div>
<div class="event-tab-content">Content 2</div>
```

## 🎯 Common Patterns

### Card with Header and Footer
```html
<div class="card">
    <div class="card-header">
        <h3>My Section</h3>
    </div>
    <div class="card-body">
        Content here
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">Save</button>
    </div>
</div>
```

### Centered Flex Layout
```html
<div class="flex flex-center gap-2">
    <button class="btn btn-primary">Cancel</button>
    <button class="btn btn-secondary">Submit</button>
</div>
```

### Space Between Layout
```html
<div class="flex flex-between">
    <h3>Title</h3>
    <button class="btn btn-sm">Add</button>
</div>
```

### Alert Message
```html
<div class="alert alert-success">
    ✓ Changes saved successfully!
</div>
```

### Loading State
```html
<div class="loading"></div>
```

### Empty State
```html
<div class="empty-state">
    <div class="empty-state-icon">📭</div>
    <div class="empty-state-text">No items found</div>
</div>
```

## 📱 Responsive Note

All classes work on all screen sizes. For mobile-specific styles, the CSS includes media queries for:
- **Tablets**: 768px and below
- **Mobile**: 480px and below

## 🌙 Dark Mode

Dark mode styles are included (via `@media (prefers-color-scheme: dark)`) and work automatically based on user's system preference.

## 🔍 Finding Styles

**To find a specific style:**
1. Open the appropriate CSS file
2. Search for the class name
3. Read the comments above the class
4. Modify as needed

**Common files:**
- `admin/css/event-details.css` - Most admin styles
- `admin/css/styles.css` - General admin styles
- `client/css/styles.css` - All client styles

## 💡 Best Practices

1. **Use existing classes** - Check this guide before adding new styles
2. **Combine classes** - Use multiple classes: `btn btn-primary btn-sm`
3. **No inline styles** - Always use CSS classes
4. **Consistent spacing** - Use margin/padding classes
5. **Color consistency** - Use the defined color variables
6. **Mobile first** - Test on mobile before desktop

## 🚀 Tips

- Use `.gap-*` classes for flex spacing
- Use `.mt-*` and `.mb-*` for vertical spacing  
- Use `.px-*` for horizontal padding
- Chain classes together for combinations
- Check responsive breakpoints for mobile

---

**Last Updated**: February 2026
**CSS Files**: 2 main files (admin + client)
**Total Classes**: 200+
**Color Variables**: 15
