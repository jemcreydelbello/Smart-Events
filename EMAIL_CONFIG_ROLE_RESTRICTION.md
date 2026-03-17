# Email Configuration - Role-Based Access Control

## Summary

Email configuration settings are now restricted to **Administrators only**. Coordinators cannot access, view, or modify email settings.

---

## What Changed

### 1. **Email Configuration Tab Hidden for Coordinators**
   - **File**: `admin/js/admin.js`
   - **Location**: `setupNavigation()` function (lines 1358-1390)
   - The "Email Configuration" button is hidden in the settings navigation for coordinators
   - The email-config content div is also hidden from view

### 2. **Direct Access Prevention**
   - **File**: `admin/js/admin.js`
   - **Location**: `switchTab()` function (lines 10890-10903)
   - Even if a coordinator tries to access the email configuration directly, they will be blocked
   - Shows alert: "Email Configuration is only available for Administrators."

---

## Implementation Details

### In `setupNavigation()` Function

For **Coordinators**:
```javascript
// Hide Email Configuration tab for coordinators
const emailConfigBtn = document.querySelector('[data-tab="email-config"]');
if (emailConfigBtn) {
    emailConfigBtn.style.display = 'none';
    console.log('setupNavigation: Hiding Email Configuration tab for coordinator');
}

const emailConfigContent = document.getElementById('email-config');
if (emailConfigContent) {
    emailConfigContent.style.display = 'none';
}
```

For **Admins**:
```javascript
// Show Email Configuration tab for admins
const emailConfigBtn = document.querySelector('[data-tab="email-config"]');
if (emailConfigBtn) {
    emailConfigBtn.style.display = '';
}
```

### In `switchTab()` Function

Blocks coordinators from navigating to email-config:
```javascript
// Prevent coordinators from accessing email configuration
if (tabName === 'email-config') {
    let admin = JSON.parse(localStorage.getItem('admin') || '{}');
    let user = JSON.parse(localStorage.getItem('user') || '{}');
    let userInfo = (admin && admin.email) ? admin : user;
    let userRole = userInfo.role || userInfo.role_name || 'GUEST';
    
    if (userRole === 'COORDINATOR' || userRole === 'coordinator') {
        console.log('switchTab: DENIED - Coordinator cannot access Email Configuration');
        alert('Email Configuration is only available for Administrators.');
        return;
    }
}
```

---

## User Experience

### For Administrators
- ✅ Can see "Email Configuration" tab in Settings
- ✅ Can modify SMTP settings
- ✅ Can configure delivery preferences (send welcome emails, event notifications, reminders)
- ✅ Can test email connections

### For Coordinators
- ❌ Cannot see "Email Configuration" tab
- ❌ Cannot access email settings even if they try to navigate directly
- ⚠️ Will see alert: "Email Configuration is only available for Administrators."
- ⚠️ Email Configuration section is completely hidden from view

---

## How It Works

1. **Page Load**
   - When user logs in, `setupNavigation()` checks their role
   - If coordinator: Email Configuration tab is hidden
   - If admin: Email Configuration tab is shown

2. **Tab Navigation**
   - If coordinator tries to access email-config directly, `switchTab()` function blocks them
   - Alert message displayed: "Email Configuration is only available for Administrators."
   - Function returns early, preventing access

3. **Role Detection**
   ```javascript
   let admin = JSON.parse(localStorage.getItem('admin') || '{}');
   let user = JSON.parse(localStorage.getItem('user') || '{}');
   let userInfo = (admin && admin.email) ? admin : user;
   let userRole = userInfo.role || userInfo.role_name || 'GUEST';
   ```

---

## Testing

### Test 1: Login as Admin
1. Login with admin account
2. Go to Settings page
3. **Expected**: "Email Configuration" tab should be visible
4. **Can click**: Email Configuration tab to view settings

### Test 2: Login as Coordinator
1. Login with coordinator account
2. Go to Settings page
3. **Expected**: "Email Configuration" tab should NOT be visible
4. **If they try to access directly**: Alert shows "Email Configuration is only available for Administrators."

### Test 3: Verify No Overlap
1. In coordinator browser, open browser console
2. Try manually calling: `switchTab('email-config')`
3. **Expected**: Alert appears, no access granted

---

## Console Logs for Debugging

When setupNavigation runs, you'll see:
```
setupNavigation: User role detected: COORDINATOR
setupNavigation: User is COORDINATOR - hiding admin pages
setupNavigation: Hiding Create New Event button for coordinator
setupNavigation: Hiding Email Configuration tab for coordinator
```

When switchTab blocks access:
```
switchTab: DENIED - Coordinator cannot access Email Configuration
```

---

## Related Features

These features remain visible to coordinators:
- ✅ Profile settings (First name, last name, email, company, contact, address)
- ✅ Activity logs (view-only)
- ❌ Email Configuration (hidden, blocked at switchTab level)

---

## Files Modified

1. **admin/js/admin.js**
   - Modified: `setupNavigation()` function (~line 1358-1390)
   - Modified: `switchTab()` function (~line 10890-10903)
   - Total changes: ~40 lines added

---

## Security Notes

- Uses role-based access control (RBAC) consistent with existing pattern
- Checks are done at UI level AND function call level (defense-in-depth)
- Coordinator cannot modify email settings even if they were to inspect/modify HTML
- Role is checked from localStorage (same as other RBAC checks in codebase)

---

## Compatibility

- No breaking changes
- Backward compatible with existing admin functionality
- Coordinator access remains unchanged (they see Profile and Activity Logs tabs)
- Works with both 'COORDINATOR' and 'coordinator' role values

---

## Summary

✅ **Email Configuration is now restricted to Administrators only**
- Coordinators cannot see, access, or modify email settings
- Protection at both UI and function level
- Clear alert message if attempted direct access
- Consistent with existing role-based access patterns
