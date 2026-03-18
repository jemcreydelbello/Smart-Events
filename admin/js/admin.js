// ================================================================================
// SMART EVENTS - CONSOLIDATED ADMIN JAVASCRIPT
// One unified file consolidating all admin functionality
// Includes: main.js, event-details.js, dashboard-api.js, coordinators.js, catalogue.js
// ================================================================================

// Set API_BASE on both window and local scope for maximum compatibility
window.API_BASE = '../api';
const API_BASE = window.API_BASE;

// ================================================================================
// SECTION 1: UTILITY FUNCTIONS & HELPERS
// ================================================================================

// Helper function to fix image URLs for nested folder structure
function getImageUrl(imagePath) {
    if (!imagePath) return null;
    
    // If it's already a full URL (starts with http), return as-is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // If it's just a filename (no slashes), construct the full path
    if (!imagePath.includes('/')) {
        // Gallery images start with "gallery_" and go in events_img folder
        if (imagePath.startsWith('gallery_')) {
            return '../uploads/events_img/' + imagePath;
        }
        // Regular event images go in events folder
        return '../uploads/events/' + imagePath;
    }
    
    // Otherwise return as-is
    return imagePath;
}

// Helper function to get user headers for API requests with role-based access control
function getUserHeaders() {
    try {
        const admin = JSON.parse(localStorage.getItem('admin') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userInfo = (admin && admin.id) ? admin : user;
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (userInfo.role) {
            headers['X-User-Role'] = userInfo.role;
        } else if (userInfo.role_name) {
            headers['X-User-Role'] = userInfo.role_name;
        } else {
            headers['X-User-Role'] = 'GUEST';
        }
        
        if (userInfo.id) {
            headers['X-User-Id'] = userInfo.id;
        } else if (userInfo.user_id) {
            headers['X-User-Id'] = userInfo.user_id;
        }
        
        if (userInfo.coordinator_id) {
            headers['X-Coordinator-Id'] = userInfo.coordinator_id;
        }
        
        // Add user name/username for activity logging
        if (userInfo.full_name) {
            headers['X-User-Name'] = userInfo.full_name;
        } else if (userInfo.username) {
            headers['X-User-Name'] = userInfo.username;
        } else if (userInfo.coordinator_name) {
            headers['X-User-Name'] = userInfo.coordinator_name;
        } else if (userInfo.email) {
            headers['X-User-Name'] = userInfo.email;
        }
        
        return headers;
    } catch (error) {
        console.error('Error building user headers:', error);
        return { 'Content-Type': 'application/json', 'X-User-Role': 'GUEST' };
    }
}

// Helper function to check if user is admin
function isCurrentUserAdmin() {
    try {
        const admin = JSON.parse(localStorage.getItem('admin') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userInfo = (admin && admin.id) ? admin : user;
        const role = (userInfo.role || userInfo.role_name || '').toLowerCase();
        const adminStatus = role === 'admin';
        console.log('[ADMIN-CHECK] Current user admin status:', adminStatus, 'Role:', role);
        return adminStatus;
    } catch (e) {
        console.error('[ADMIN-CHECK] Error:', e);
        return false;
    }
}

// Modern Toast Notification Function
function showToast(message, type = 'success', duration = 4000) {
    const toastId = 'toast-' + Date.now();
    const backgroundColor = type === 'success' ? '#10b981' : 
                           type === 'error' ? '#ef4444' : 
                           type === 'warning' ? '#f59e0b' : '#3b82f6';
    const icon = type === 'success' ? '✓' : 
                type === 'error' ? '✕' : 
                type === 'warning' ? '⚠' : 'ℹ';
    
    // Add animation styles if not already added
    if (!document.querySelector('style[data-toast-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-toast-styles', 'true');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        font-weight: 500;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    toast.innerHTML = `<span style="font-size: 18px; font-weight: bold;">${icon}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Helper function to ensure Finance and Postmortem tabs are visible for admins
function ensureAdminTabsVisible() {
    console.log('[ENSURE-TABS] Checking admin tabs visibility...');
    const isAdmin = isCurrentUserAdmin();
    
    if (isAdmin) {
        console.log('[ENSURE-TABS] User is admin - showing Finance & Postmortem tabs');
        ['finance', 'postmortem'].forEach(tabName => {
            const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
            if (tabBtn) {
                tabBtn.style.display = 'inline-block';
                tabBtn.classList.remove('hidden');
                console.log(`[ENSURE-TABS] ✓ Showing ${tabName} tab`);
            }
        });
    } else {
        console.log('[ENSURE-TABS] User is not admin - hiding Finance & Postmortem tabs');
        ['finance', 'postmortem'].forEach(tabName => {
            const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
            if (tabBtn) {
                tabBtn.style.display = 'none';
                tabBtn.classList.add('hidden');
                console.log(`[ENSURE-TABS]  Hiding ${tabName} tab`);
            }
        });
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureAdminTabsVisible, 100);
});

// Call periodically to ensure tabs stay visible
setInterval(ensureAdminTabsVisible, 2000);

// Helper function to generate random private event code
function generatePrivateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Helper function to convert 24-hour time to 12-hour format
function convert24To12Hour(timeStr) {
    if (!timeStr) return '-';
    try {
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
}

// HTML escaping function
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// Show notification helper
function showNotification(message, type = 'success') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(notificationContainer);
    }

    // Create notification toast
    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const bgColor = isSuccess ? '#1E73BB' : '#ef4444';
    
    toast.style.cssText = `
        background-color: ${bgColor};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        font-weight: 500;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
        pointer-events: auto;
        min-width: 300px;
        max-width: 400px;
    `;
    
    toast.innerHTML = `<span>${message}</span>`;
    
    // Add animation styles if not already present
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    notificationContainer.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Copy to clipboard helper
function copyToClipboard(text) {
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('✓ Copied to clipboard: ' + text, 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy to clipboard', 'error');
    });
}

// Helper function to check if user is admin
function isUserAdmin() {
    try {
        const admin = JSON.parse(localStorage.getItem('admin') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userInfo = (admin && admin.id) ? admin : user;
        
        const role = userInfo.role || userInfo.role_name || '';
        return role.toLowerCase() === 'admin';
    } catch (error) {
        console.error('Error checking user admin status:', error);
        return false;
    }
}

// Function to update tab visibility based on user role
function updateTabVisibility() {
    try {
        const isAdmin = isUserAdmin();
        const adminOnlyTabs = ['finance', 'postmortem'];
        
        adminOnlyTabs.forEach(tabName => {
            const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (tabButton) {
                if (isAdmin) {
                    tabButton.style.display = '';
                    tabButton.classList.remove('hidden');
                } else {
                    tabButton.style.display = 'none';
                    tabButton.classList.add('hidden');
                }
            }
        });
    } catch (error) {
        console.error('Error updating tab visibility:', error);
    }
}

// Show confirmation dialog
function showConfirmation(title, message, actionText, callback) {
    const modalContent = `
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-width: 400px; z-index: 3000;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">${escapeHtml(title)}</h3>
            <p style="margin: 0 0 25px 0; color: #666; font-size: 14px; line-height: 1.5;">${escapeHtml(message)}</p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="this.closest('div').parentElement.remove()" style="padding: 10px 20px; background: #f0f0f0; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Cancel</button>
                <button onclick="this.closest('div').parentElement.remove(); (${callback.toString()})()" style="padding: 10px 20px; background: #C41E3A; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">${escapeHtml(actionText)}</button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
}

// Log activity to audit logs
function logActivity(actionType, actionDescription) {
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const logData = {
        action_type: actionType,
        action_description: actionDescription
    };
    
    if (admin && admin.admin_id) {
        logData.admin_id = admin.admin_id;
    } else if (user && user.user_id) {
        logData.user_id = user.user_id;
    }
    
    fetch(`${API_BASE}/audit_logs.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify(logData)
    })
    .catch(error => console.log('Activity logged:', actionType));
}

// ================================================================================
// SECTION 2: SIDEBAR & NAVIGATION
// ================================================================================

// Update user profile in sidebar from localStorage
function updateUserProfile() {
    console.log('[PROFILE-UPDATE] Starting profile update...');
    try {
        var adminStr = localStorage.getItem('admin');
        var userStr = localStorage.getItem('user');
        console.log('[PROFILE-UPDATE] admin data:', adminStr ? 'exists (' + adminStr.length + ' chars)' : 'empty');
        console.log('[PROFILE-UPDATE] user data:', userStr ? 'exists (' + userStr.length + ' chars)' : 'empty');
        
        var profile = null;
        var isAdmin = false;
        var isCoordinator = false;
        
        if (adminStr) {
            try {
                profile = JSON.parse(adminStr);
                isAdmin = true;
                console.log('[PROFILE-UPDATE] Parsed admin profile:', profile);
            } catch (e) {
                console.error('[PROFILE-UPDATE] Failed to parse admin:', e);
            }
        } else if (userStr) {
            try {
                profile = JSON.parse(userStr);
                isCoordinator = true;
                console.log('[PROFILE-UPDATE] Parsed user profile:', profile);
            } catch (e) {
                console.error('[PROFILE-UPDATE] Failed to parse user:', e);
            }
        }
        
        // Get DOM elements - wait for them to exist
        var nameEl = document.getElementById('userNameDisplay');
        var emailEl = document.getElementById('userEmail');
        var accountTypeEl = document.getElementById('userAccountType');
        
        console.log('[PROFILE-UPDATE] DOM elements:', {
            nameEl: nameEl ? 'found' : 'NOT FOUND',
            emailEl: emailEl ? 'found' : 'NOT FOUND',
            accountTypeEl: accountTypeEl ? 'found' : 'NOT FOUND'
        });
        
        if (!nameEl || !emailEl || !accountTypeEl) {
            console.warn('[PROFILE-UPDATE] Profile elements not found in DOM yet');
            return;
        }
        
        if (profile) {
            // Try multiple possible name fields (same as sidebar)
            var nameToDisplay = profile.full_name || 
                               profile.name || 
                               profile.username || 
                               profile.coordinator_name ||
                               profile.email ||
                               'Not Logged In';
            
            var emailToDisplay = profile.email || 'user@smartevents.com';
            
            nameEl.textContent = nameToDisplay;
            emailEl.textContent = emailToDisplay;
            
            if (isAdmin) {
                accountTypeEl.textContent = 'Admin';
                accountTypeEl.className = 'session-meta text-blue-600 font-semibold';
                console.log('[PROFILE-UPDATE] SUCCESS - Admin profile updated');
            } else if (isCoordinator) {
                accountTypeEl.textContent = 'Coordinator';
                accountTypeEl.className = 'session-meta text-purple-600 font-semibold';
                console.log('[PROFILE-UPDATE] SUCCESS - Coordinator profile updated');
            }
            
            console.log('[PROFILE-UPDATE] COMPLETE - Name:', nameToDisplay, '| Email:', emailToDisplay);
        } else {
            console.log('[PROFILE-UPDATE] No profile in localStorage - showing defaults');
            nameEl.textContent = 'Not Logged In';
            emailEl.textContent = 'Please log in';
            accountTypeEl.textContent = 'Guest';
        }
    } catch (e) {
        console.error('[PROFILE-UPDATE] Error:', e);
    }
}

// Listen for storage changes to update profile dynamically
window.addEventListener('storage', function(e) {
    if (e.key === 'admin' || e.key === 'user' || !e.key) {
        console.log('[PROFILE-UPDATE] Storage changed, updating profile...');
        updateUserProfile();
    }
});

function loadSidebarNavigation() {
    return new Promise((resolve, reject) => {
        console.log('Loading sidebar navigation...');
        fetch('sidebar-nav.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load sidebar: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                const sidebarContainer = document.getElementById('sidebarContainer');
                if (sidebarContainer) {
                    sidebarContainer.innerHTML = html;
                    console.log('✓ Sidebar loaded successfully');
                    updateUserProfile();
                    setupNavigation();
                    resolve();
                } else {
                    console.error('✗ Sidebar container not found');
                    reject('Sidebar container not found');
                }
            })
            .catch(error => {
                console.error('✗ Error loading sidebar:', error);
                const sidebarContainer = document.getElementById('sidebarContainer');
                if (sidebarContainer) {
                    sidebarContainer.innerHTML = '<div style="color: red; padding: 20px;">Error loading navigation</div>';
                }
                reject(error);
            });
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-item');
    
    let userInfo = null;
    let admin = JSON.parse(localStorage.getItem('admin') || '{}');
    let user = JSON.parse(localStorage.getItem('user') || '{}');
    
    userInfo = (admin && admin.email) ? admin : user;
    const userRole = userInfo.role || userInfo.role_name || 'GUEST';
    
    console.log('setupNavigation: User role detected:', userRole);
    console.log('setupNavigation: User info:', userInfo);
    
    // Hide menu items for coordinators (they should only access Events)
    if (userRole === 'COORDINATOR' || userRole === 'coordinator') {
        console.log('setupNavigation: User is COORDINATOR - hiding admin pages');
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (page !== 'events') {
                link.style.display = 'none';
            }
        });
        
        // Hide Create New Event button for coordinators
        const createEventBtn = document.getElementById('createEventBtn');
        if (createEventBtn) {
            createEventBtn.style.display = 'none';
            console.log('setupNavigation: Hiding Create New Event button for coordinator');
        }
    } else {
        console.log('setupNavigation: User is ADMIN - showing all pages');
        navLinks.forEach(link => {
            link.style.display = '';
        });
        
        // Show Create New Event button for admins
        const createEventBtn = document.getElementById('createEventBtn');
        if (createEventBtn) {
            createEventBtn.style.display = '';
        }
    }
    
    if (userInfo && userInfo.email) {
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl && userInfo.full_name) {
            adminNameEl.textContent = userInfo.full_name;
        }
        
        const adminLabelEl = document.querySelector('.admin-label');
        if (adminLabelEl) {
            adminLabelEl.textContent = (userRole === 'COORDINATOR' || userRole === 'coordinator') ? 'COORDINATOR' : 'ADMIN';
        }
        
        const adminNameBanner = document.getElementById('adminNameBanner');
        if (adminNameBanner && userInfo.full_name) {
            adminNameBanner.textContent = userInfo.full_name.split(' ')[0];
        }
        
        const adminAvatarEl = document.getElementById('adminAvatar');
        if (adminAvatarEl) {
            adminAvatarEl.innerHTML = '';
            adminAvatarEl.style.overflow = 'hidden';
            adminAvatarEl.style.display = 'flex';
            adminAvatarEl.style.alignItems = 'center';
            adminAvatarEl.style.justifyContent = 'center';
            
            if (userInfo.admin_image) {
                const img = document.createElement('img');
                img.src = userInfo.admin_image;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.alt = userInfo.full_name || 'Admin';
                adminAvatarEl.appendChild(img);
            } else if (userInfo.full_name) {
                const initials = userInfo.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
                adminAvatarEl.textContent = initials;
                adminAvatarEl.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                adminAvatarEl.style.color = 'white';
                adminAvatarEl.style.fontWeight = 'bold';
            } else {
                adminAvatarEl.textContent = '👤';
            }
        }
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            
            if ((userRole === 'COORDINATOR' || userRole === 'coordinator') && page !== 'events') {
                alert('You do not have permission to access this page.');
                return;
            }
            
            navigateToPage(page);
        });
    });
}

// Navigate function called from sidebar links
function navigateTo(event, page) {
    event.preventDefault();
    navigateToPage(page);
}

function navigateToPage(page) {
    console.log('🔄 Navigating to page:', page);
    
    localStorage.setItem('adminLastPage', page);
    
    // Update active nav link
    const navLinks = document.querySelectorAll('#adminNav a, .sidebar-menu a');
    navLinks.forEach(l => {
        if (l.getAttribute('data-page') === page) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    // Ensure main container is visible
    const pagesContainer = document.querySelector('.main-content > div[style*="flex-direction"]');
    if (pagesContainer) {
        pagesContainer.style.display = 'flex';
        pagesContainer.style.flexDirection = 'column';
        pagesContainer.style.width = '100%';
        pagesContainer.style.overflow = 'visible';
    }
    
    // Show target page
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
        
        console.log('✓ Page activated:', page);
        
        // Restore deadline details panel visibility when calendar is shown
        if (page === 'calendar') {
            const deadlinePanel = document.getElementById('deadlineDetails');
            if (deadlinePanel) {
                deadlinePanel.style.display = 'block';
            }
        }
        
        // Load content for the page
        if (page === 'dashboard') loadDashboard();
        else if (page === 'calendar') loadCalendar();
        else if (page === 'events') loadEvents();
        else if (page === 'participants') loadParticipants();
        else if (page === 'catalogue') loadCatalogue();
        else if (page === 'reports') loadReports();
        else if (page === 'qr-scanner') initQRScannerPage();
        else if (page === 'users') loadAllUsers();
        else if (page === 'logs') {
            loadActivityLogs();
            loadActionTypes();
        }
    } else {
        console.error('Target page not found:', page);
    }
}

// ================================================================================
// SECTION 3: INITIALIZATION & SETUP
// ================================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('✓ DOM ContentLoaded fired');
    
    let admin = JSON.parse(localStorage.getItem('admin') || 'null');
    let user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!admin && !user) {
        console.log('✗ Not authenticated - redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    let authenticatedUser = admin || user;
    console.log('✓ User authenticated:', authenticatedUser.email);
    console.log('✓ Starting initialization sequence...');
    
    // Update tab visibility immediately based on user role
    setTimeout(() => {
        updateTabVisibility();
    }, 100);
    
    // CRITICAL FIX: Move all misplaced pages to the correct container
    const pagesContainer = document.querySelector('.main-content > div[style*="flex-direction"]');
    if (pagesContainer) {
        const eventDetailsPage = document.getElementById('event-details');
        if (eventDetailsPage) {
            // Collect all pages that are incorrectly nested inside event-details
            const misplacedPages = eventDetailsPage.querySelectorAll(':scope > div.page');
            console.log('🔧 Found', misplacedPages.length, 'misplaced pages inside event-details');
            
            misplacedPages.forEach(page => {
                if (page.id && page.id !== 'event-details') {
                    console.log('  - Moving #' + page.id + ' from event-details to p-8 container');
                    pagesContainer.appendChild(page);
                }
            });
            
            console.log('✓ All pages reorganized - P-8 now has', pagesContainer.children.length, 'direct children');
        }
    }
    
    try {
        console.log('⏳ Loading sidebar...');
        await loadSidebarNavigation();
        console.log('✓ Sidebar ready');
        
        console.log('⏳ Setting up form handlers...');
        setupFormHandlers();
        console.log('✓ Form handlers ready');
        
        const usersSearchBox = document.getElementById('usersSearch');
        if (usersSearchBox) {
            usersSearchBox.addEventListener('input', function() {
                searchUsers(this.value);
            });
        }
        
        const addCoordForm = document.getElementById('addCoordinatorForm');
        if (addCoordForm) {
            addCoordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                submitAddCoordinator();
            });
        }
        
        // Only navigate to page if we're on index.html (multi-page layout)
        const isMainPage = document.getElementById('events') !== null;
        if (isMainPage) {
            console.log('✓ Multi-page layout detected');
            
            // Check if there's an event ID in URL parameters to restore
            const params = new URLSearchParams(window.location.search);
            const eventIdFromEventDetailsPage = params.get('id');
            const eventIdFromModal = params.get('eventId');
            
            let eventIdToRestore = eventIdFromEventDetailsPage || eventIdFromModal;
            let isEventDetailsPageRestore = !!eventIdFromEventDetailsPage;
            
            if (eventIdToRestore) {
                console.log('📋 Restoring event view for event ID:', eventIdToRestore);
                // Store the event ID and restoration type to open after page loads
                window.eventIdToRestoreOnLoad = eventIdToRestore;
                window.isEventDetailsPageRestore = isEventDetailsPageRestore;
            }
            
            const lastPage = localStorage.getItem('adminLastPage') || 'calendar';
            console.log('Restoring page:', lastPage);
            // Small delay to ensure sidebar DOM is fully ready
            setTimeout(() => {
                console.log('🔄 Calling navigateToPage...');
                navigateToPage(lastPage);
                
                // Verify page was activated
                setTimeout(() => {
                    const activePage = document.querySelector('.page.active');
                    if (activePage) {
                        console.log('✓ Verification: Active page is:', activePage.id);
                    } else {
                        console.error('✗ Verification failed: No active page found!');
                    }
                    
                    // Restore event view if needed
                    if (window.eventIdToRestoreOnLoad) {
                        console.log('🔄 Attempting to restore event view...');
                        setTimeout(() => {
                            if (window.isEventDetailsPageRestore) {
                                // Restore event-details page
                                console.log('🔄 Restoring event-details page for event:', window.eventIdToRestoreOnLoad);
                                viewEventDetails(window.eventIdToRestoreOnLoad);
                            } else {
                                // Restore modal view
                                restoreEventModalOnLoad(window.eventIdToRestoreOnLoad);
                            }
                        }, 500);
                    }
                }, 100);
            }, 50);
        } else {
            console.warn('⚠ Multi-page layout NOT detected - this might be a different admin page');
        }
        
        console.log('✓ Initialization complete');
    } catch (error) {
        console.error('✗ Initialization error:', error);
        // Only navigate if this is the main page
        if (document.getElementById('events')) {
            setTimeout(() => navigateToPage('dashboard'), 100);
        }
    }
    
    // CRITICAL: Global monitor to ensure pages container never hides
    setInterval(() => {
        const pageContainer = document.querySelector('.main-content > div[style*="flex-direction"]');
        if (pageContainer) {
            const display = window.getComputedStyle(pageContainer).display;
            const overflow = window.getComputedStyle(pageContainer).overflow;
            
            let needsFix = false;
            if (display === 'none' || pageContainer.offsetHeight === 0) {
                console.error('🚨 CRITICAL: Page container display is hidden!');
                needsFix = true;
            }
            if (overflow === 'hidden') {
                console.error('🚨 CRITICAL: Page container overflow is hidden!');
                needsFix = true;
            }
            
            if (needsFix) {
                pageContainer.style.cssText = 'display: flex !important; flex-direction: column !important; width: 100% !important; height: auto !important; overflow: visible !important; visibility: visible !important; opacity: 1 !important; position: relative !important;';
                console.log('✓ Fixed page container styles');
            }
        }
    }, 300); // Check every 300ms
});

function setupFormHandlers() {
    console.log('Setting up form handlers...');
    
    // Note: createEventForm is handled in index.html - skip it here to avoid conflicts
    // const createForm = document.getElementById('createEventForm');
    // if (createForm) {
    //     console.log('Found createEventForm, adding submit handler');
    //     createForm.addEventListener('submit', function(e) {
    //         createEvent(e);
    //     });
    // }
    
    const editForm = document.getElementById('editEventForm');
    if (editForm) {
        console.log('Found editEventForm, adding submit handler');
        editForm.addEventListener('submit', function(e) {
            updateEvent(e);
        });
    }
    
    const addPastEventForm = document.getElementById('addPastEventForm');
    if (addPastEventForm) {
        console.log('Found addPastEventForm, adding submit handler');
        addPastEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAddPastEventForm();
        });
    }
    
    const coordinatorForm = document.getElementById('coordinatorForm');
    if (coordinatorForm) {
        console.log('Found coordinatorForm, adding submit handler');
        coordinatorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCoordinatorFormSubmit();
        });
    }
    
    const coordinatorResetBtn = document.getElementById('coordinatorResetBtn');
    if (coordinatorResetBtn) {
        coordinatorResetBtn.addEventListener('click', resetCoordinatorForm);
    }
    
    const createPrivateCheckbox = document.getElementById('eventPrivate');
    if (createPrivateCheckbox) {
        createPrivateCheckbox.addEventListener('change', function() {
            toggleCreatePrivateCode();
        });
    }
    
    const editPrivateCheckbox = document.getElementById('editEventPrivate');
    if (editPrivateCheckbox) {
        editPrivateCheckbox.addEventListener('change', function() {
            toggleEditPrivateCode();
        });
    }
}

// ================================================================================
// SECTION 4: DASHBOARD
// ================================================================================

let registrationChart = null;
let attendanceChart = null;
let capacityChart = null;
let eventTypeChart = null;

function loadDashboard() {
    fetch(`${API_BASE}/dashboard.php`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardStats(data.data);
                drawRegistrationTrends(data.data.registrationTrends);
                drawAttendanceChart(data.data.attendanceStatus);
                drawEventTypeDistribution(data.data.eventTypeDistribution || {});
                drawCapacityUtilization(data.data.capacityUtilization || []);
                displayRecentEvents(data.data.recentEvents);
            }
        })
        .catch(error => console.error('Error loading dashboard:', error));
}

function updateDashboardStats(stats) {
    const totalEventsEl = document.getElementById('totalEvents');
    if (totalEventsEl) totalEventsEl.textContent = stats.totalEvents || 0;
    
    const totalRegEl = document.getElementById('totalRegistrations');
    if (totalRegEl) totalRegEl.textContent = stats.totalRegistrations || 0;
    
    const attendedEl = document.getElementById('attendedToday');
    if (attendedEl) attendedEl.textContent = stats.attendedToday || 0;
    
    const eventsThisWeekEl = document.getElementById('eventsThisWeek');
    if (eventsThisWeekEl) eventsThisWeekEl.textContent = stats.eventsThisWeek || 0;
    
    const eventsMetaEl = document.getElementById('eventsMetaWeek');
    if (eventsMetaEl) eventsMetaEl.textContent = `+${stats.eventsThisWeek || 0} this week`;
    
    const regPercentEl = document.getElementById('registrationPercent');
    if (regPercentEl) regPercentEl.textContent = `+${stats.registrationPercent || 0}% from last month`;
}

function drawRegistrationTrends(trends) {
    const ctx = document.getElementById('registrationTrendsChart');
    if (!ctx) return;
    
    if (registrationChart) {
        registrationChart.destroy();
    }
    
    const eventNames = trends.map(t => t.event_name);
    const counts = trends.map(t => t.count);
    
    registrationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: eventNames,
            datasets: [{
                label: 'Participants per Event',
                data: counts,
                backgroundColor: 'rgba(244, 53, 53, 0.7)',
                borderColor: 'rgba(244, 53, 53, 0.7)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 11 },
                        padding: 10
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 10 }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

function drawAttendanceChart(stats) {
    const ctx = document.getElementById('attendanceStatusChart');
    if (!ctx) return;
    
    if (attendanceChart) {
        attendanceChart.destroy();
    }
    
    attendanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Attended', 'Pending'],
            datasets: [{
                data: [stats.attended, stats.pending],
                backgroundColor: [
                    '#28A745',
                    'rgba(244, 53, 53, 0.7)'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 11 },
                        padding: 10
                    }
                }
            }
        }
    });
}

function displayRecentEvents(events) {
    const container = document.getElementById('recentEventsContainer');
    if (!container) return;
    
    if (!events || events.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">No recent events</p>';
        return;
    }
    
    let html = '';
    events.forEach((event, index) => {
        const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const createdDate = new Date(event.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        html += `
            <div style="padding: 12px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(90deg, #630909 0%, #950B08 27%, #F43535 56%, #ECB9B2 90%); flex-shrink: 0;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="20" height="20">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 4px;">${event.event_name}</div>
                    <div style="font-size: 12px; color: #666;">Event: ${eventDate}</div>
                    <div style="font-size: 12px; color: #999;">Created: ${createdDate}</div>
                </div>
                <div style="background: #C41E3A; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; margin-left: 10px; white-space: nowrap;">
                    #${event.event_id}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function drawEventTypeDistribution(typeData) {
    const ctx = document.getElementById('eventTypeDistributionChart');
    if (!ctx) return;
    
    if (eventTypeChart) {
        eventTypeChart.destroy();
    }
    
    const publicCount = typeData.public_count || 0;
    const privateCount = typeData.private_count || 0;
    
    eventTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Public Events', 'Private Events'],
            datasets: [{
                data: [publicCount, privateCount],
                backgroundColor: [
                    '#5B6FD8',
                    'rgba(244, 53, 53, 0.7)'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 11 },
                        padding: 10
                    }
                }
            }
        }
    });
}

function drawCapacityUtilization(capacityData) {
    const ctx = document.getElementById('capacityUtilizationChart');
    if (!ctx) return;
    
    if (capacityChart) {
        capacityChart.destroy();
    }
    
    const eventNames = capacityData.map(d => d.event_name);
    const registered = capacityData.map(d => d.registered);
    const available = capacityData.map(d => Math.max(0, d.capacity - d.registered));
    
    capacityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: eventNames,
            datasets: [
                {
                    label: 'Registered',
                    data: registered,
                    backgroundColor: 'rgba(244, 53, 53, 0.7)',
                    borderColor: 'rgba(244, 53, 53, 0.7)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Available Spots',
                    data: available,
                    backgroundColor: '#E0E0E0',
                    borderColor: '#999',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 11 },
                        padding: 10
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 10 }
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

// ================================================================================
// SECTION 5: EVENTS MANAGEMENT
// ================================================================================

let currentEventFilter = 'all';
let currentEventSort = 'newest';
let allEventsData = [];

function loadEvents() {
    console.log('✓ loadEvents() called');
    const container = document.getElementById('eventsList');
    if (!container) {
        console.error('✗ eventsList not found');
        return;
    }
    
    container.innerHTML = '';
    
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = (admin && admin.id) ? admin : user;
    const userRole = userInfo.role || userInfo.role_name || 'GUEST';
    const coordinatorId = userInfo.coordinator_id || userInfo.id;
    
    console.log('User Role:', userRole, 'Coordinator ID:', coordinatorId);
    
    fetch(`${API_BASE}/events.php?action=list`, {
        headers: getUserHeaders()
    })
        .then(response => {
            console.log('✓ Events API response:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('✓ API Response:', JSON.stringify(data).substring(0, 200));
            console.log('✓ Events data received:', data.data?.length, 'events');
            if (data.success && Array.isArray(data.data)) {
                let events = data.data;
                console.log('Raw events:', events.length);
                
                if (userRole === 'COORDINATOR' || userRole === 'coordinator') {
                    events = events.filter(event => {
                        return event.coordinator_id == coordinatorId;
                    });
                    console.log(`✓ Filtered to ${events.length} event(s) for coordinator`);
                }
                
                console.log('Calling displayEvents with:', events.length, 'events');
                displayEvents(events);
            } else {
                throw new Error(data.message || 'Failed to load events - success: ' + data.success + ', data type: ' + typeof data.data);
            }
        })
        .catch(error => {
            console.error('✗ Error loading events:', error);
            container.innerHTML = `<div style="padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 4px;">❌ Error loading events: ${error.message}</div>`;
        });
    
    const searchBox = document.getElementById('eventSearch');
    if (searchBox) {
        console.log('✓ Search box found, attaching listeners');
        let searchTimeout;
        searchBox.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            console.log('Search input:', query);
            
            if (query.length > 0) {
                searchTimeout = setTimeout(() => {
                    searchEventsList(query);
                }, 300);
            } else if (query.length === 0) {
                clearTimeout(searchTimeout);
                displayEvents(allEventsData);
            }
        });
    } else {
        console.warn('⚠ eventSearch box not found - search functionality unavailable');
    }
}

function displayEvents(events) {
    console.log('✓ displayEvents() called with', events.length, 'events');
    allEventsData = events;
    window.allEventsData = events;  // Also store on window for modal access
    window.cachedEvents = events; // Cache events for modal use
    
    console.log('Filtering by type...');
    const filtered = filterEventsByType(events);
    console.log('After filter:', filtered.length, 'events');
    
    console.log('Sorting events...');
    const sorted = sortEventsArray(filtered);
    console.log('After sort:', sorted.length, 'events');
    
    console.log('Calling renderEvents...');
    renderEvents(sorted);
    console.log('displayEvents complete');
}

function filterEventsByType(events) {
    if (currentEventFilter === 'public') {
        return events.filter(e => e.is_private != 1);
    } else if (currentEventFilter === 'private') {
        return events.filter(e => e.is_private == 1);
    }
    return events;
}

function sortEventsArray(events) {
    const sorted = [...events];
    
    if (currentEventSort === 'newest') {
        sorted.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    } else if (currentEventSort === 'oldest') {
        sorted.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    } else if (currentEventSort === 'name-asc') {
        sorted.sort((a, b) => (a.event_name || '').localeCompare(b.event_name || ''));
    } else if (currentEventSort === 'name-desc') {
        sorted.sort((a, b) => (b.event_name || '').localeCompare(a.event_name || ''));
    }
    
    return sorted;
}

function renderEvents(events) {
    console.log('✓ renderEvents() called with', events.length, 'events');
    
    const container = document.getElementById('eventsList');
    
    if (!container) {
        console.error('✗ eventsList container not found!');
        return;
    }
    
    console.log('Container found:', container.id);
    console.log('Container parent:', container.parentElement.id);
    console.log('Container computed style before:', {
        display: window.getComputedStyle(container).display,
        visibility: window.getComputedStyle(container).visibility,
        opacity: window.getComputedStyle(container).opacity,
        width: window.getComputedStyle(container).width,
        height: window.getComputedStyle(container).height,
        overflow: window.getComputedStyle(container).overflow
    });
    
    if (!events || events.length === 0) {
        console.log('ℹ No events to display');
        container.innerHTML = '<p class="text-center text-muted">No events found.</p>';
        return;
    }
    
    // Rich event cards with images
    const html = events.map((event, index) => {
        const imageUrl = event.image_url ? getImageUrl(event.image_url) : null;
        const eventDate = new Date(event.event_date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        
        // Format 24-hour time to 12-hour AM/PM format
        const formatTime = (timeStr) => {
            if (!timeStr) return '';
            const [hours, minutes] = timeStr.split(':');
            let h = parseInt(hours);
            const m = minutes;
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${m} ${ampm}`;
        };
        
        // Build start date/time display
        const startTime = event.start_time ? formatTime(event.start_time) : '';
        const startDisplay = startTime ? `${formattedDate} ${startTime}` : formattedDate;
        
        // Build end date/time display if available
        let dateTimeDisplay = startDisplay;
        if (event.end_date) {
            const endDate = new Date(event.end_date);
            const formattedEndDate = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const endTime = event.end_time ? formatTime(event.end_time) : '';
            const endDisplay = endTime ? `${formattedEndDate} ${endTime}` : formattedEndDate;
            dateTimeDisplay = `${startDisplay} - ${endDisplay}`;
        }
        
        return `
            <div onclick="navigateToEventDetailsPage(${event.event_id})" style="
                display: flex !important;
                flex-direction: column !important;
                background: white !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                cursor: pointer !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                height: 260px !important;
                padding: 0 !important;
                width: 100% !important;
            ">
                <!-- Image -->
                <div style="
                    height: 100px !important;
                    width: 100% !important;
                    background-color: #f0f0f0 !important;
                    background-size: cover !important;
                    background-position: center !important;
                    background-image: ${imageUrl ? `url('${imageUrl}')` : "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 200%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22400%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2224%22%3E📅%3C/text%3E%3C/svg%3E')"} !important;
                    position: relative !important;
                    flex-shrink: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                ">
                    <span style="
                        position: absolute !important;
                        top: 8px !important;
                        right: 8px !important;
                        background: ${event.is_private == 1 ? '#C41E3A' : '#E8E5FF'} !important;
                        color: ${event.is_private == 1 ? 'white' : '#6c63ff'} !important;
                        padding: 4px 8px !important;
                        border-radius: 4px !important;
                        font-size: 10px !important;
                        font-weight: 600 !important;
                        z-index: 10 !important;
                    ">${event.is_private == 1 ? 'Private' : 'Public'}</span>
                </div>
                
                <!-- Content -->
                <div style="
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    padding: 12px !important;
                    gap: 6px !important;
                    overflow: hidden !important;
                    justify-content: flex-start !important;
                ">
                    <h3 style="
                        margin: 0 !important;
                        font-size: 16px !important;
                        font-weight: 600 !important;
                        color: #000000 !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        white-space: nowrap !important;
                    ">${event.event_name || 'Untitled Event'}</h3>
                    
                    <div style="
                        font-size: 12px !important;
                        color: #6b7280 !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        white-space: nowrap !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 6px !important;
                    "><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="none" stroke="#6b7280" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm12-4v4M8 3v4m-4 4h16m-9 4h1m0 0v3"/></svg> ${dateTimeDisplay}</div>
                    
                    ${event.location && event.location !== 'undefined' && event.location !== 'null' && event.location.trim() ? `<div style="
                        font-size: 12px !important;
                        color: #6b7280 !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        white-space: nowrap !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 6px !important;
                    "><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="#6b7280" d="M16 10c0-2.21-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4m-6 0c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2"/><path fill="#6b7280" d="M11.42 21.81c.17.12.38.19.58.19s.41-.06.58-.19c.3-.22 7.45-5.37 7.42-11.82c0-4.41-3.59-8-8-8s-8 3.59-8 8c-.03 6.44 7.12 11.6 7.42 11.82M12 4c3.31 0 6 2.69 6 6c.02 4.44-4.39 8.43-6 9.74c-1.61-1.31-6.02-5.29-6-9.74c0-3.31 2.69-6 6-6"/></svg> ${event.location}</div>` : ''}
                </div>
                
                <!-- Footer Guide -->
                <div style="
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    padding: 12px !important;
                    border-top: 1px solid #f3f4f6 !important;
                    background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,1) 100%) !important;
                    flex-shrink: 0 !important;
                    gap: 8px !important;
                    transition: all 0.3s ease !important;
                ">
                    <span style="
                        font-size: 13px !important;
                        font-weight: 600 !important;
                        color: #1E73BB !important;
                    ">View Details</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="
                        flex-shrink: 0 !important;
                        color: #1E73BB !important;
                        transition: transform 0.3s ease !important;
                    ">
                        <path fill="currentColor" d="M8.59 16.59L10 18l8-8-8-8-1.41 1.41L14.17 9H6v2h8.17z"/>
                    </svg>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Generated HTML, length:', html.length);
    container.innerHTML = html;
    console.log('✓ HTML set in container');
    
    console.log('Container computed style after:', {
        display: window.getComputedStyle(container).display,
        visibility: window.getComputedStyle(container).visibility,
        gridTemplateColumns: window.getComputedStyle(container).gridTemplateColumns,
        width: window.getComputedStyle(container).width,
        height: window.getComputedStyle(container).height
    });
    
    console.log('✓ Events rendered successfully');
}

function searchEventsList(query) {
    console.log('Searching events for:', query);
    const filtered = allEventsData.filter(event => {
        const matchesSearch = event.event_name.toLowerCase().includes(query) ||
            (event.location && event.location.toLowerCase().includes(query)) ||
            (event.description && event.description.toLowerCase().includes(query));
        return matchesSearch;
    });
    renderEvents(sortEventsArray(filterEventsByType(filtered)));
}

function displayEventSuggestions(query) {
    const suggestionsContainer = document.getElementById('eventSuggestions');
    if (!suggestionsContainer || query.length === 0) return;
    
    const matches = allEventsData.filter(event => {
        return event.event_name.toLowerCase().includes(query) ||
            (event.location && event.location.toLowerCase().includes(query)) ||
            (event.description && event.description.toLowerCase().includes(query));
    }).slice(0, 8);
    
    if (matches.length === 0) {
        suggestionsContainer.innerHTML = '<div style="padding: 15px; color: #999; text-align: center;">No events found</div>';
        suggestionsContainer.style.display = 'block';
        return;
    }
    
    suggestionsContainer.innerHTML = matches.map(event => {
        const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        return `
            <div class="search-suggestion-item" onclick="selectEventSuggestion('${event.event_name}')">
                <div class="search-suggestion-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M21 17V8H7v9zm0-14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V1h2v2h8V1h2v2zm-3.47 8.06l-4.44 4.44l-2.68-2.68l1.06-1.06l1.62 1.62L16.47 10zM3 21h14v2H3a2 2 0 0 1-2-2V9h2z"/></svg></div>
                <div class="search-suggestion-text">
                    <div class="search-suggestion-name">${escapeHtml(event.event_name)}</div>
                    <div class="search-suggestion-date">${eventDate}${event.location && event.location !== 'undefined' && event.location !== 'null' && event.location.trim() ? ' • ' + escapeHtml(event.location) : ''}</div>
                </div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.style.display = 'block';
}

function hideEventSuggestions() {
    const suggestionsContainer = document.getElementById('eventSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectEventSuggestion(eventName) {
    const searchBox = document.getElementById('eventSearch');
    if (searchBox) {
        searchBox.value = eventName;
        hideEventSuggestions();
        searchEventsList(eventName.toLowerCase());
    }
}

function filterEvents(filterType) {
    console.log('Setting event filter to:', filterType);
    currentEventFilter = filterType;
    
    // Update active button styling
    const filterButtons = {
        'all': document.getElementById('filterAll'),
        'public': document.getElementById('filterPublic'),
        'private': document.getElementById('filterPrivate')
    };
    
    for (let key in filterButtons) {
        if (filterButtons[key]) {
            if (key === filterType) {
                filterButtons[key].style.background = '#1f2937';
                filterButtons[key].style.color = 'white';
            } else {
                filterButtons[key].style.background = 'transparent';
                filterButtons[key].style.color = '#666';
            }
        }
    }
    
    const searchBox = document.getElementById('eventSearch');
    if (searchBox) {
        searchBox.value = '';
    }
    
    renderEvents(sortEventsArray(filterEventsByType(allEventsData)));
}

function sortEvents(sortType) {
    console.log('Setting event sort to:', sortType);
    currentEventSort = sortType;
    
    renderEvents(sortEventsArray(filterEventsByType(allEventsData)));
}

// Restore event modal on page load when event ID is in URL
function restoreEventModalOnLoad(eventId) {
    console.log('📋 Restoring event modal for event ID:', eventId);
    
    // Fetch event details from API
    fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.success && data.data) {
            const event = data.data;
            console.log('✓ Event data fetched:', event);
            
            // Store in window.allEventsData so openEventDetailsModal can find it
            if (!window.allEventsData) {
                window.allEventsData = [];
            }
            
            // Check if event already exists in allEventsData
            const existingIndex = window.allEventsData.findIndex(e => e.event_id == eventId);
            if (existingIndex >= 0) {
                window.allEventsData[existingIndex] = event;
            } else {
                window.allEventsData.push(event);
            }
            
            // Now open the modal with the event
            openEventDetailsModal(eventId);
        } else {
            console.error('✗ Failed to fetch event:', data.message);
            showNotification('Failed to load event details', 'error');
        }
    })
    .catch(error => {
        console.error('✗ Error restoring event:', error);
        showNotification('Error loading event: ' + error.message, 'error');
    });
}

function toggleCreatePrivateCode() {
    const isPrivate = document.getElementById('eventPrivate').checked;
    const codeDisplay = document.getElementById('createPrivateCodeDisplay');
    const codeInput = document.getElementById('createEventPrivateCode');
    
    if (isPrivate) {
        codeDisplay.style.display = 'block';
        if (!codeInput.value) {
            codeInput.value = generatePrivateCode();
        }
    } else {
        codeDisplay.style.display = 'none';
        document.getElementById('eventDepartment').value = '';
    }
}

function toggleEditPrivateCode() {
    const isPrivate = document.getElementById('editEventPrivate').checked;
    const codeDisplay = document.getElementById('editPrivateCodeDisplay');
    
    if (isPrivate) {
        codeDisplay.style.display = 'block';
    } else {
        codeDisplay.style.display = 'none';
    }
}

function copyCreateCode() {
    const codeInput = document.getElementById('createEventPrivateCode');
    codeInput.select();
    document.execCommand('copy');
    showNotification('Code copied to clipboard!', 'success');
}

function copyEditCode() {
    const codeInput = document.getElementById('editEventPrivateCode');
    codeInput.select();
    document.execCommand('copy');
    showNotification('Code copied to clipboard!', 'success');
}

function navigateToEventDetailsPage(eventId) {
    console.log('navigateToEventDetailsPage called for event:', eventId);
    // Navigate to event-details page within index.html
    viewEventDetails(eventId);
}

function openEventDetailsModal(eventId) {
    console.log('[Events] Opening event details modal for event:', eventId);
    
    // Add event ID to URL for persistence on reload
    const url = new URL(window.location);
    url.searchParams.set('eventId', eventId);
    window.history.pushState({ eventId: eventId }, '', url);
    
    // Try multiple sources for event data
    let event = null;
    
    // Try window.allEventsData first
    if (window.allEventsData && Array.isArray(window.allEventsData)) {
        event = window.allEventsData.find(e => e.event_id === eventId);
    }
    
    // Try local allEventsData
    if (!event && typeof allEventsData !== 'undefined' && Array.isArray(allEventsData)) {
        event = allEventsData.find(e => e.event_id === eventId);
    }
    
    // Try allEventsForCalendar (in case clicked from calendar)
    if (!event && typeof allEventsForCalendar !== 'undefined' && Array.isArray(allEventsForCalendar)) {
        event = allEventsForCalendar.find(e => e.event_id === eventId);
    }
    
    console.log('[Events] Event found:', event);
    
    if (!event) {
        console.error('[Events] Event not found in any cache. Available caches:');
        console.error('  allEventsData:', typeof allEventsData, allEventsData ? allEventsData.length + ' events' : 'undefined');
        console.error('  allEventsForCalendar:', typeof allEventsForCalendar, allEventsForCalendar ? allEventsForCalendar.length + ' events' : 'undefined');
        showNotification('Event not found', 'error');
        return;
    }
    
    // Store current event in window for reference
    window.currentEventDetails = event;
    
    // Set the global currentEventId so other functions can use it
    currentEventId = event.event_id;
    window.currentEventId = event.event_id;  // Also set on window object for cross-module access
    
    console.log('[Event Selection] Event selected:', event.event_name, '(ID:', event.event_id, ')');
    
    // Update modal title
    const modalTitle = document.getElementById('modalEventTitle');
    if (modalTitle) {
        modalTitle.textContent = event.event_name;
    }
    
    // Show modal
    const modal = document.getElementById('eventDetailsModal');
    if (modal) {
        modal.classList.add('active');
        
        // Setup tabs immediately (before showing modal) - don't delay
        console.log('[Events] Setting up modal tabs immediately');
        setupEventModalTabs(event);
        
        // Update tab visibility based on user role
        setTimeout(() => {
            if (typeof updateTabVisibility === 'function') {
                updateTabVisibility();
            }
        }, 100);
    } else {
        console.error('[Events] eventDetailsModal not found');
    }
}

function setupEventModalTabs(event) {
    console.log('═══════════════════════════════════════════');
    console.log('[MODAL SETUP] Setting up tabs for event:', event.event_id);
    
    const dashboardBtn = document.getElementById('eventDashboardTab');
    const detailsBtn = document.getElementById('eventDetailsTab');
    const attendeesBtn = document.getElementById('eventAttendeesTab');
    const tasksBtn = document.getElementById('eventTasksTab');
    
    console.log('[MODAL SETUP] Tab buttons found:');
    console.log('  - Dashboard:', !!dashboardBtn);
    console.log('  - Details:', !!detailsBtn);
    console.log('  - Attendees:', !!attendeesBtn);
    console.log('  - Tasks:', !!tasksBtn);
    
    // Add event listeners to tabs
    if (dashboardBtn) {
        dashboardBtn.onclick = (e) => {
            e.preventDefault();
            console.log('[MODAL TAB CLICK] Dashboard clicked');
            switchEventTab('dashboard', event);
        };
        console.log('[MODAL SETUP] ✓ Dashboard listener attached');
    }
    
    if (detailsBtn) {
        detailsBtn.onclick = (e) => {
            e.preventDefault();
            console.log('[MODAL TAB CLICK] Details clicked');
            switchEventTab('details', event);
        };
        console.log('[MODAL SETUP] ✓ Details listener attached');
    }
    
    if (attendeesBtn) {
        attendeesBtn.onclick = (e) => {
            e.preventDefault();
            console.log('[MODAL TAB CLICK] Attendees clicked');
            switchEventTab('attendees', event);
        };
        console.log('[MODAL SETUP] ✓ Attendees listener attached');
    }
    
    if (tasksBtn) {
        tasksBtn.onclick = (e) => {
            e.preventDefault();
            console.log('[MODAL TAB CLICK] Tasks clicked');
            switchEventTab('tasks', event);
        };
        console.log('[MODAL SETUP] ✓ Tasks listener attached');
    }
    
    console.log('[MODAL SETUP] ✓ All listeners attached, showing dashboard by default');
    // Show dashboard tab by default
    switchEventTab('dashboard', event);
    console.log('═══════════════════════════════════════════');
}

function switchEventTab(tabName, event) {
    console.log('════════════════════════════════════════════════════');
    console.log('[MODAL TAB SWITCH] 🔀 SWITCHING TO TAB:', tabName);
    console.log('[MODAL TAB SWITCH] Event ID:', event?.event_id);
    console.log('[MODAL TAB SWITCH] Event name:', event?.event_name);
    
    const dashboardBtn = document.getElementById('eventDashboardTab');
    const detailsBtn = document.getElementById('eventDetailsTab');
    const attendeesBtn = document.getElementById('eventAttendeesTab');
    const tasksBtn = document.getElementById('eventTasksTab');
    
    const eventTabContent = document.getElementById('eventTabContent');
    
    console.log('[MODAL TAB SWITCH] eventTabContent element found:', !!eventTabContent);
    
    // Reset all button styles
    [dashboardBtn, detailsBtn, attendeesBtn, tasksBtn].forEach(btn => {
        if (btn) {
            btn.style.background = '#f3f4f6';
            btn.style.color = '#374151';
        }
    });
    
    // Hide eventTabContent by default
    if (eventTabContent) eventTabContent.style.display = 'none';
    
    // Show selected tab content
    if (tabName === 'dashboard') {
        console.log('[MODAL TAB SWITCH] ✓ Dashboard tab selected - calling renderEventDashboardTab');
        if (dashboardBtn) {
            dashboardBtn.style.background = '#3b82f6';
            dashboardBtn.style.color = '#ffffff';
        }
        if (eventTabContent) eventTabContent.style.display = 'block';
        renderEventDashboardTab(event);
    } else if (tabName === 'details') {
        console.log('[MODAL TAB SWITCH] ✓ Details tab selected - calling renderEventDetailsTab');
        if (detailsBtn) {
            detailsBtn.style.background = '#3b82f6';
            detailsBtn.style.color = '#ffffff';
        }
        if (eventTabContent) eventTabContent.style.display = 'block';
        renderEventDetailsTab(event);
    } else if (tabName === 'attendees') {
        console.log('[MODAL TAB SWITCH] ✓ Attendees tab selected - calling renderEventAttendeesTab');
        if (attendeesBtn) {
            attendeesBtn.style.background = '#3b82f6';
            attendeesBtn.style.color = '#ffffff';
        }
        if (eventTabContent) {
            console.log('[MODAL TAB SWITCH] ✓ Setting eventTabContent display to block');
            eventTabContent.style.display = 'block';
        }
        try {
            console.log('[MODAL TAB SWITCH] Calling renderEventAttendeesTab...');
            renderEventAttendeesTab(event);
            console.log('[MODAL TAB SWITCH] ✓ renderEventAttendeesTab completed successfully');
        } catch (err) {
            console.error('[MODAL TAB SWITCH] ✗ Error in renderEventAttendeesTab:', err);
            console.error('[MODAL TAB SWITCH] Stack:', err.stack);
        }
    } else if (tabName === 'tasks') {
        console.log('[MODAL TAB SWITCH] ✓ Tasks tab selected - calling renderEventTasksTab');
        if (tasksBtn) {
            tasksBtn.style.background = '#3b82f6';
            tasksBtn.style.color = '#ffffff';
        }
        if (eventTabContent) {
            console.log('[MODAL TAB SWITCH] ✓ Setting eventTabContent display to block');
            eventTabContent.style.display = 'block';
        }
        try {
            console.log('[MODAL TAB SWITCH] Calling renderEventTasksTab...');
            renderEventTasksTab(event);
            console.log('[MODAL TAB SWITCH] ✓ renderEventTasksTab completed successfully');
        } catch (err) {
            console.error('[MODAL TAB SWITCH] ✗ Error in renderEventTasksTab:', err);
            console.error('[MODAL TAB SWITCH] Stack:', err.stack);
        }
    }
    console.log('[MODAL TAB SWITCH] ✓ Tab activation complete');
    console.log('════════════════════════════════════════════════════');
}

function renderEventDashboardTab(event) {
    console.log('[Events] Rendering dashboard tab for event:', event.event_id);
    
    const content = document.getElementById('eventTabContent');
    if (!content) return;
    
    const attendedPercentage = event.capacity > 0 ? Math.round((event.attended_count / event.total_registrations) * 100) : 0;
    
    content.innerHTML = `
      <div class="space-y-6">
        <div class="grid grid-cols-3 gap-4">
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
            <div style="font-size: 12px; color: #6b7280;">Total Registrations</div>
            <div style="font-size: 28px; font-weight: bold; color: #1e40af; margin-top: 8px;">${event.total_registrations || 0}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">of ${event.capacity || '∞'} capacity</div>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
            <div style="font-size: 12px; color: #6b7280;">Checked In</div>
            <div style="font-size: 28px; font-weight: bold; color: #15803d; margin-top: 8px;">${event.attended_count || 0}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">${attendedPercentage}% attended</div>
          </div>
          <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px;">
            <div style="font-size: 12px; color: #6b7280;">Available Spots</div>
            <div style="font-size: 28px; font-weight: bold; color: #7c3aed; margin-top: 8px;">${event.available_spots || 0}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">Remaining</div>
          </div>
        </div>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Quick Info</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">Event Date</p>
              <p style="color: #111827; font-weight: 500; margin-top: 4px;">${new Date(event.event_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">Location</p>
              <p style="color: #111827; font-weight: 500; margin-top: 4px;">${event.location || 'TBA'}</p>
            </div>
          </div>
        </div>
      </div>
    `;
}

function renderEventDetailsTab(event) {
    console.log('[Events] Rendering details tab for event:', event.event_id);
    
    const content = document.getElementById('eventTabContent');
    if (!content) return;
    
    const eventDate = new Date(event.event_date);
    const dateStr = eventDate.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'});
    const timeStr = event.start_time ? `${event.start_time.substring(0, 5)}${event.end_time ? ' - ' + event.end_time.substring(0, 5) : ''}` : 'TBA';
    
    content.innerHTML = `
      <div class="space-y-6">
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Event Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <label style="font-size: 12px; color: #6b7280;">Event Title</label>
              <p style="color: #111827; font-weight: 500; margin-top: 4px;">${event.event_name}</p>
            </div>
            <div>
              <label style="font-size: 12px; color: #6b7280;">Date</label>
              <p style="color: #111827; font-weight: 500; margin-top: 4px;">${dateStr}</p>
            </div>
            <div>
              <label style="font-size: 12px; color: #6b7280;">Time</label>
              <p style="color: #111827; font-weight: 500; margin-top: 4px;">${timeStr}</p>
            </div>
            <div>
              <label style="font-size: 12px; color: #6b7280;">Location</label>
              <p style="color: #111827; font-weight: 500; margin-top: 4px;">${event.location || 'TBA'}</p>
            </div>
            <div>
              <label style="font-size: 12px; color: #6b7280;">Capacity</label>
              <p style="color: #111827; font-weight: 500; margin-top: 4px;">${event.capacity}</p>
            </div>
            <div>
              <label style="font-size: 12px; color: #6b7280;">Status</label>
              <p style="color: #111827; font-weight: 500; margin-top: 4px;">${event.is_private ? '🔒 Private' : '🌐 Public'}</p>
            </div>
          </div>
        </div>
        
        ${event.description ? `
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
            <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Description</h3>
            <p style="color: #6b7280; line-height: 1.6;">${event.description}</p>
          </div>
        ` : ''}
      </div>
    `;
}

function renderEventAttendeesTab(event) {
    console.log('═══════════════════════════════════════════');
    console.log('[Attendees] RENDERING ATTENDEES TAB');
    console.log('[Attendees] Event ID:', event?.event_id);
    console.log('[Attendees] Event name:', event?.event_name);
    
    // Determine context: modal or full page
    // Check if modal EXISTS and is ACTIVE (has 'active' class)
    const modalElement = document.getElementById('eventDetailsModal');
    const modalContent = document.getElementById('eventTabContent');
    const isModalContext = !!(modalElement && modalElement.classList.contains('active') && modalContent);
    
    console.log('[Attendees] Modal element exists:', !!modalElement);
    console.log('[Attendees] Modal is active:', modalElement?.classList.contains('active'));
    console.log('[Attendees] Modal content exists:', !!modalContent);
    console.log('[Attendees] Context:', isModalContext ? 'modal' : 'full-page');
    
    if (!isModalContext) {
        // Full page context - just load data into existing table
        console.log('[Attendees] Using full-page attendees mode (updating existing table)');
        loadEventAttendees(event, false);
        return;
    }
    
    // Modal context - render custom layout
    const content = modalContent;
    console.log('[Attendees] Using modal eventTabContent');
    console.log('[Attendees] Target container found:', !!content);
    
    if (!content) {
        console.error('[Attendees] ✗ CRITICAL: Container not found!');
        return;
    }
    
    // Clear content and render new layout
    content.innerHTML = '';
    console.log('[Attendees] Content cleared');
    
    // Store event for attendees filtering
    window.currentEventAttendees = {
        initial: [],
        actual: [],
        all: []
    };
    
    // Modal layout - with Initial/Actual tabs (matching Participants section layout)
    const htmlContent = `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin: 0;">
        <!-- Header - All in one row -->
        <div style="padding: 24px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap; gap: 24px;">
          <!-- Left: Title and Description -->
          <div style="min-width: 300px;">
            <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 4px 0;">Attendees</h2>
            <p style="font-size: 13px; color: #6b7280; margin: 0;">Manage attendee lists and quickly switch between stages.</p>
          </div>
          
          <!-- Right: Sub-tabs, Search, and Action Buttons -->
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: nowrap;">
            <!-- Sub-tabs with counts -->
            <div style="display: flex; gap: 8px; background: #f3f4f6; padding: 4px; border-radius: 8px; white-space: nowrap;">
              <button id="eventAttendeesInitialTab" onclick="switchEventAttendeesTab('initial')" style="padding: 8px 16px; font-weight: 600; color: white; background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%); border: none; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: opacity 0.2s; font-size: 13px;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                Initial <span id="eventAttendeesInitialCount" style="color: #ffffff; font-size: 12px;">(0)</span>
              </button>
              <button id="eventAttendeesActualTab" onclick="switchEventAttendeesTab('actual')" style="padding: 8px 16px; font-weight: 600; color: #4b5563; background: white; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-size: 13px;">
                Actual <span id="eventAttendeesActualCount" style="color: #999; font-size: 12px;">(0)</span>
              </button>
            </div>
            
            <!-- Search Bar -->
            <input type="text" id="eventAttendeesSearch" placeholder="Search..." onkeyup="searchEventAttendees(this.value)" style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 12px; color: #111827; width: 140px;" />
            
            <!-- Export Button -->
            <button onclick="exportEventAttendees('${event.event_id}')" style="padding: 8px 14px; background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%); color: white; font-weight: 500; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap; font-size: 12px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Export</button>
            
            <!-- Add Button -->
            <button onclick="addEventAttendee('${event.event_id}')" style="padding: 8px 14px; background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%); color: white; font-weight: 500; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap; font-size: 12px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">+ Add</button>
          </div>
        </div>

        <!-- Initial List Table -->
        <div id="eventAttendeesInitialContent" style="overflow-x: auto; padding: 0;">
          <table style="width: 100%; font-size: 14px;">
            <thead style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <tr>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">NO.</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">FULL NAME</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">COMPANY</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">JOB TITLE</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">EMAIL ADDRESS</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">CONTACT NUMBER</th>
                <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #4b5563; font-size: 12px;">ACTIONS</th>
              </tr>
            </thead>
            <tbody id="eventAttendeesInitialTable" style="border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td colspan="7" style="padding: 32px 16px; text-align: center; color: #6b7280;">Loading attendees...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actual Attendees Table -->
        <div id="eventAttendeesActualContent" style="overflow-x: auto; padding: 0; display: none;">
          <table style="width: 100%; font-size: 14px;">
            <thead style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <tr>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">NO.</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">FULL NAME</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">COMPANY</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">JOB TITLE</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">EMAIL ADDRESS</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">CONTACT NUMBER</th>
                <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #4b5563; font-size: 12px;">ACTIONS</th>
              </tr>
            </thead>
            <tbody id="eventAttendeesActualTable" style="border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td colspan="7" style="padding: 32px 16px; text-align: center; color: #6b7280;">No actual attendees yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    try {
        console.log('[Attendees] Setting HTML content, length:', htmlContent.length);
        content.innerHTML = htmlContent;
        console.log('[Attendees] ✓ HTML content set successfully');
        
        // Verify the new elements exist after a brief delay
        setTimeout(() => {
            const initialTab = document.getElementById('eventAttendeesInitialTab');
            const actualTab = document.getElementById('eventAttendeesActualTab');
            const searchInput = document.getElementById('eventAttendeesSearch');
            console.log('[Attendees] Element verification:');
            console.log('  - Initial tab found:', !!initialTab);
            console.log('  - Actual tab found:', !!actualTab);
            console.log('  - Search input found:', !!searchInput);
            if (initialTab && actualTab && searchInput) {
                console.log('[Attendees] ✓ New attendees layout rendered successfully');
            }
        }, 100);
    } catch (error) {
        console.error('[Attendees] ✗ Error setting HTML:', error);
        content.innerHTML = '<p style="color: red;">Error rendering attendees: ' + error.message + '</p>';
    }
    
    // Load attendees data
    console.log('[Attendees] Calling loadEventAttendees');
    loadEventAttendees(event, true);
    console.log('═══════════════════════════════════════════');
}

// Load event attendees from API
async function loadEventAttendees(event, isModalContext = true) {
    console.log('═══════════════════════════════════════════');
    console.log('[Attendees] LOADING ATTENDEES DATA');
    console.log('[Attendees] Event ID:', event?.event_id);
    console.log('[Attendees] Context:', isModalContext ? 'modal' : 'full-page');
    
    let initialTable, actualTable;
    
    if (isModalContext) {
        // Modal context - two tables
        initialTable = document.getElementById('eventAttendeesInitialTable');
        actualTable = document.getElementById('eventAttendeesActualTable');
        
        console.log('[Attendees] Table elements found:');
        console.log('  - Initial table:', !!initialTable);
        console.log('  - Actual table:', !!actualTable);
        
        if (!initialTable || !actualTable) {
            console.error('[Attendees] ✗ CRITICAL: Tables not found!');
            return;
        }
    } else {
        // Full page context - use the new initialListBody and actualAttendeesBody
        initialTable = document.getElementById('initialListBody');
        actualTable = document.getElementById('actualAttendeesBody');
        console.log('[Attendees] Full-page table elements found:');
        console.log('  - Initial table:', !!initialTable);
        console.log('  - Actual table:', !!actualTable);
        
        if (!initialTable || !actualTable) {
            console.error('[Attendees] ✗ CRITICAL: Table bodies not found!');
            return;
        }
    }
    
    try {
        console.log('[Attendees] Fetching from API...');
        const url = `${API_BASE}/participants.php?action=list&event_id=${event.event_id}`;
        console.log('[Attendees] URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getUserHeaders()
        });
        
        console.log('[Attendees] Response status:', response.status, response.ok);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch attendees`);
        const result = await response.json();
        
        console.log('[Attendees] Raw API response :', JSON.stringify(result).substring(0, 200));
        console.log('[Attendees] API response received');
        const attendeesData = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
        console.log('[Attendees] ✓ Attendees data received:', attendeesData.length, 'attendees');
        console.log('[Attendees] Attendees array check: isArray?', Array.isArray(attendeesData), 'length?', attendeesData.length);
        
        // Store attendees data globally for search
        window.currentEventAttendees = window.currentEventAttendees || {};
        window.currentEventAttendees.all = attendeesData;
        
        const initialAttendees = attendeesData.filter(a => (a.status || '').toUpperCase() !== 'ATTENDED');
        const actualAttendees = attendeesData.filter(a => (a.status || '').toUpperCase() === 'ATTENDED');
        
        if (isModalContext) {
            window.currentEventAttendees.initial = initialAttendees;
            window.currentEventAttendees.actual = actualAttendees;
            
            console.log('[Attendees] Data split:');
            console.log('  - Initial:', window.currentEventAttendees.initial.length);
            console.log('  - Actual:', window.currentEventAttendees.actual.length);
            
            // Render both tables for modal
            console.log('[Attendees] Rendering initial table...');
            renderAttendeesTable(window.currentEventAttendees.initial, initialTable);
            console.log('[Attendees] ✓ Initial table rendered');
            
            console.log('[Attendees] Rendering actual table...');
            renderAttendeesTable(window.currentEventAttendees.actual, actualTable);
            console.log('[Attendees] ✓ Actual table rendered');
            
            // Set initial tab to active
            console.log('[Attendees] Switching to initial tab...');
            switchEventAttendeesTab('initial');
            console.log('[Attendees] ✓ Tab switched');
            
            // Update counts in tab labels
            updateEventAttendeesCounts(window.currentEventAttendees.initial.length, window.currentEventAttendees.actual.length);
            console.log('[Attendees] ✓ Counts updated');
        } else {
            // Render data for full page - separate tables
            console.log('[Attendees] Data split for full-page:');
            console.log('  - Initial:', initialAttendees.length);
            console.log('  - Actual:', actualAttendees.length);
            
            // Expose data to window.attendeesData for search function to use
            if (!window.attendeesData) {
                window.attendeesData = {};
            }
            window.attendeesData.initial = initialAttendees;
            window.attendeesData.actual = actualAttendees;
            
            console.log('[Attendees] ✓ Data exposed to window.attendeesData');
            console.log('[Attendees] window.attendeesData:', window.attendeesData);
            
            // Render full-page tables with proper structure
            console.log('[Attendees] Rendering full-page initial list...');
            renderFullPageAttendees(initialAttendees, initialTable);
            console.log('[Attendees] ✓ Full-page initial list rendered');
            
            console.log('[Attendees] Rendering full-page actual attendees...');
            renderFullPageAttendees(actualAttendees, actualTable);
            console.log('[Attendees] ✓ Full-page actual attendees rendered');
            
            // Update counts
            document.getElementById('initialCount').textContent = initialAttendees.length;
            document.getElementById('actualCount').textContent = actualAttendees.length;
        }
        
        console.log('[Attendees] ✓ ATTENDEES DATA LOADED SUCCESSFULLY');
        
    } catch (error) {
        console.error('[Attendees] ✗ Error loading attendees:', error);
        console.error('[Attendees] Error details:', error.message, error.stack);
        
        if (isModalContext) {
            initialTable.innerHTML = `<tr><td colspan="7" style="padding: 32px 16px; text-align: center; color: #dc2626;">Error loading attendees: ${error.message}</td></tr>`;
        } else {
            initialTable.innerHTML = `<tr><td colspan="7" style="padding: 32px 16px; text-align: center; color: #dc2626;">Error loading attendees: ${error.message}</td></tr>`;
        }
        showNotification('Error loading attendees: ' + error.message, 'error');
    }
    console.log('═══════════════════════════════════════════');
}

// Render attendees table
function renderAttendeesTable(attendees, tableBody) {
    console.log('[Attendees] renderAttendeesTable called');
    console.log('  - Attendees count:', attendees?.length);
    console.log('  - Table body found:', !!tableBody);
    
    if (!tableBody) {
        console.error('[Attendees] ✗ Table body not provided!');
        return;
    }
    
    tableBody.innerHTML = '';
    console.log('[Attendees] Table cleared');
    
    if (!attendees || attendees.length === 0) {
        console.log('[Attendees] No attendees to render');
        tableBody.innerHTML = '<tr style="border-bottom: 1px solid #e5e7eb;"><td colspan="7" style="padding: 32px 16px; text-align: center; color: #6b7280;">No attendees found.</td></tr>';
        return;
    }
    
    console.log('[Attendees] Rendering', attendees.length, 'attendees...');
    attendees.forEach((attendee, idx) => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #e5e7eb';
        
        // Create walk-in badge if applicable
        const walkInBadge = attendee.is_walkIn === 1 || attendee.is_walkIn === '1' 
            ? '<span style="display: inline-block; padding: 2px 8px; background: #fef08a; color: #854d0e; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 6px;">Walk-in</span>'
            : '';
        
        const fullName = escapeHtml(attendee.full_name || attendee.name || '-');
        
        row.innerHTML = `
            <td style="padding: 12px 16px; color: #111827; font-size: 14px;">${idx + 1}</td>
            <td style="padding: 12px 16px; color: #111827; font-size: 14px;">${fullName}${walkInBadge}</td>
            <td style="padding: 12px 16px; color: #4b5563; font-size: 14px;">${escapeHtml(attendee.company || '-')}</td>
            <td style="padding: 12px 16px; color: #4b5563; font-size: 14px;">${escapeHtml(attendee.job_title || '-')}</td>
            <td style="padding: 12px 16px; color: #4b5563; font-size: 14px;">${escapeHtml(attendee.email || '-')}</td>
            <td style="padding: 12px 16px; color: #4b5563; font-size: 14px;">${escapeHtml(attendee.phone || attendee.contact_number || '-')}</td>
            <td style="padding: 12px 16px; text-align: right;">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button onclick="viewEventAttendee('${attendee.id}')" style="padding: 4px 8px; background: none; border: none; cursor: pointer; color: #6b7280;" title="View"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>
                    <button onclick="editEventAttendee('${attendee.id}')" style="padding: 4px 8px; background: none; border: none; cursor: pointer; color: #6b7280;" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
                    <button onclick="deleteEventAttendee('${attendee.id}')" style="padding: 4px 8px; background: none; border: none; cursor: pointer; color: #ef4444;" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4zm2 2h6V4H9zM6.074 8l.857 12H17.07l.857-12zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1m4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1"/></svg></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    console.log('[Attendees] ✓ All rows rendered in table');
}

// Render attendees table for full page view
function renderPageAttendeesList(attendees, tableBody) {
    console.log('═══════════════════════════════════════════');
    console.log('[Page Attendees] renderPageAttendeesList called');
    console.log('  - Attendees count:', attendees?.length);
    console.log('  - Table body element:', !!tableBody);
    console.log('  - Table body ID:', tableBody?.id);
    console.log('  - Table body class:', tableBody?.className);
    
    if (!tableBody) {
        console.error('[Page Attendees] ✗ Table body not provided!');
        return;
    }
    
    console.log('[Page Attendees] Current innerHTML before clear:');
    console.log('  - Length:', tableBody.innerHTML.length);
    console.log('  - Content:', tableBody.innerHTML.substring(0, 100));
    
    tableBody.innerHTML = '';
    console.log('[Page Attendees] ✓ Table cleared');
    
    if (!attendees || attendees.length === 0) {
        console.log('[Page Attendees] No attendees to render - showing empty message');
        tableBody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">No attendees yet</td></tr>';
        console.log('[Page Attendees] Empty message added');
        return;
    }
    
    console.log('[Page Attendees] Rendering', attendees.length, 'attendees...');
    
    attendees.forEach((attendee, idx) => {
        console.log(`[Page Attendees] Processing attendee ${idx + 1}/${attendees.length}:`);
        console.log(`  - Name: ${attendee.full_name || attendee.name}`);
        console.log(`  - Email: ${attendee.email}`);
        console.log(`  - Company: ${attendee.company}`);
        console.log(`  - Status: ${attendee.status}`);
        
        const row = document.createElement('tr');
        const statusColor = (attendee.status || '').toUpperCase() === 'ATTENDED' ? 'green' : 'gray';
        const statusText = (attendee.status || '').toUpperCase() === 'ATTENDED' ? 'Attended' : 'Registered';
        
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900">${escapeHtml(attendee.full_name || attendee.name || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(attendee.email || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(attendee.company || '-')}</td>
            <td class="px-4 py-3 text-sm"><span class="inline-block px-2 py-1 text-xs font-medium rounded-full" style="background-color: ${statusColor === 'green' ? '#d1fae5' : '#f3f4f6'}; color: ${statusColor === 'green' ? '#065f46' : '#374151'};">${statusText}</span></td>
        `;
        
        console.log('[Page Attendees] Row HTML created, length:', row.innerHTML.length);
        tableBody.appendChild(row);
        console.log('[Page Attendees] ✓ Row appended to table');
    });
    
    console.log('[Page Attendees] Verifying final state:');
    console.log('  - Table body children count:', tableBody.children.length);
    console.log('  - Table body innerHTML length:', tableBody.innerHTML.length);
    console.log('[Page Attendees] ✓ All rows rendered in table');
    console.log('═══════════════════════════════════════════');
}

// Render attendees for full-page view with proper 8-column structure
function renderFullPageAttendees(attendees, tableBody) {
    console.log('[Full Page Attendees] Rendering', attendees?.length, 'attendees');
    
    if (!tableBody) {
        console.error('[Full Page Attendees] ✗ Table body not provided!');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (!attendees || attendees.length === 0) {
        const colspan = tableBody.closest('table')?.querySelectorAll('thead th').length || 8;
        tableBody.innerHTML = `<tr><td colspan="${colspan}" style="padding: 40px 15px; text-align: center; color: #999; font-size: 14px;">No participants yet</td></tr>`;
        return;
    }
    
    attendees.forEach((attendee, index) => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #e8e8e8';
        row.style.background = index % 2 === 0 ? 'white' : '#fafafa';
        row.style.height = '60px';
        
        const regCode = attendee.registration_code || '';
        const fullName = attendee.full_name || attendee.name || 'Attendee';
        const status = (attendee.status || '').toUpperCase();
        const isAttended = status === 'ATTENDED';
        
        // Context-aware button: checkmark for REGISTERED, undo for ATTENDED
        const statusButton = isAttended 
            ? `<button onclick="markAttendeeAsInitial('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #ff9800;" title="Move to Initial List"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21"><g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M6.499 6.498L3.5 9.5l3 3"/><path d="M8.5 15.5h5q3 0 3-3c0-3-1-3-3-3h-10"/></g></svg></button>`
            : `<button onclick="markAttendeeAsAttended('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #10b981;" title="Mark as Attended"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m9.55 15.15l8.475-8.475q.3-.3.7-.3t.7.3t.3.713t-.3.712l-9.175 9.2q-.3.3-.7.3t-.7-.3L4.55 13q-.3-.3-.288-.712t.313-.713t.713-.3t.712.3z"/></svg></button>`;
        
        const actions = `
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button onclick="showQRCode('${escapeHtml(regCode)}', '${escapeHtml(fullName)}')" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6b7280;" title="View QR Code"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3z"/></svg></button>
                ${statusButton}
                <button onclick="deleteAttendee('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #ef4444;" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4zm2 2h6V4H9zM6.074 8l.857 12H17.07l.857-12zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1m4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1"/></svg></button>
            </div>
        `;
        
        row.innerHTML = `
            <td style="padding: 15px; color: #333; font-size: 13px;">${index + 1}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.full_name || attendee.name || '')}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.company || '')}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.job_title || '')}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.email || '')}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.phone || attendee.contact_number || '')}</td>
            <td style="padding: 15px; text-align: right;">${actions}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    console.log('[Full Page Attendees] ✓ Rendered', attendees.length, 'rows');
}

// Switch between Initial List and Actual Attendees tabs
function switchEventAttendeesTab(tab) {
    console.log(`Switching event attendees tab to: ${tab}`);
    
    const initialTab = document.getElementById('eventAttendeesInitialTab');
    const actualTab = document.getElementById('eventAttendeesActualTab');
    const initialContent = document.getElementById('eventAttendeesInitialContent');
    const actualContent = document.getElementById('eventAttendeesActualContent');
    
    if (!initialTab || !actualTab) return;
    
    if (tab === 'initial') {
        // Update Initial tab styling (active - gradient background)
        initialTab.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
        initialTab.style.color = 'white';
        initialTab.style.padding = '8px 20px';
        initialTab.style.borderRadius = '6px';
        initialTab.style.border = 'none';
        
        // Update Actual tab styling (inactive - white background)
        actualTab.style.background = 'white';
        actualTab.style.color = '#4b5563';
        actualTab.style.padding = '8px 20px';
        actualTab.style.borderRadius = '6px';
        actualTab.style.border = 'none';
        
        if (initialContent && actualContent) {
            initialContent.style.display = 'block';
            actualContent.style.display = 'none';
        }
    } else if (tab === 'actual') {
        // Update Actual tab styling (active - gradient background)
        actualTab.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
        actualTab.style.color = 'white';
        actualTab.style.padding = '8px 20px';
        actualTab.style.borderRadius = '6px';
        actualTab.style.border = 'none';
        
        // Update Initial tab styling (inactive - white background)
        initialTab.style.background = 'white';
        initialTab.style.color = '#4b5563';
        initialTab.style.padding = '8px 20px';
        initialTab.style.borderRadius = '6px';
        initialTab.style.border = 'none';
        
        if (initialContent && actualContent) {
            initialContent.style.display = 'none';
            actualContent.style.display = 'block';
        }
    }
}

// Update event attendees counts
function updateEventAttendeesCounts(initialCount, actualCount) {
    const initialCountSpan = document.getElementById('eventAttendeesInitialCount');
    const actualCountSpan = document.getElementById('eventAttendeesActualCount');
    
    if (initialCountSpan) initialCountSpan.textContent = `(${initialCount})`;
    if (actualCountSpan) actualCountSpan.textContent = `(${actualCount})`;
}

// Switch global participants tab (for Participants section)
function switchParticipantsTab(tab) {
    console.log(`Switching global participants tab to: ${tab}`);
    
    const initialTab = document.getElementById('participantsInitialTab');
    const actualTab = document.getElementById('participantsActualTab');
    const initialContent = document.getElementById('participantsInitialContent');
    const actualContent = document.getElementById('participantsActualContent');
    
    if (!initialTab || !actualTab) return;
    
    if (tab === 'initial') {
        // Update Initial tab styling (active - gradient background)
        initialTab.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
        initialTab.style.color = 'white';
        initialTab.style.padding = '8px 24px';
        initialTab.style.borderRadius = '6px';
        initialTab.style.border = 'none';
        
        // Update Actual tab styling (inactive - white background)
        actualTab.style.background = 'white';
        actualTab.style.color = '#4b5563';
        actualTab.style.padding = '8px 24px';
        actualTab.style.borderRadius = '6px';
        actualTab.style.border = 'none';
        
        if (initialContent && actualContent) {
            initialContent.style.display = 'block';
            actualContent.style.display = 'none';
        }
    } else if (tab === 'actual') {
        // Update Actual tab styling (active - gradient background)
        actualTab.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
        actualTab.style.color = 'white';
        actualTab.style.padding = '8px 24px';
        actualTab.style.borderRadius = '6px';
        actualTab.style.border = 'none';
        
        // Update Initial tab styling (inactive - white background)
        initialTab.style.background = 'white';
        initialTab.style.color = '#4b5563';
        initialTab.style.padding = '8px 24px';
        initialTab.style.borderRadius = '6px';
        initialTab.style.border = 'none';
        
        if (initialContent && actualContent) {
            initialContent.style.display = 'none';
            actualContent.style.display = 'block';
        }
    }
}

// Search participants (for Participants section)
function searchParticipants(query) {
    const initialTable = document.getElementById('participantsInitialTable');
    const actualTable = document.getElementById('participantsActualTable');
    
    if (!initialTable || !actualTable) return;
    
    const q = query.toLowerCase();
    const allParticipants = [...(allParticipantsData || [])];
    
    // Filter for both tables
    const filteredInitial = allParticipants.filter(p => 
        (p.status || '').toUpperCase() !== 'ATTENDED' &&
        ((p.full_name || '').toLowerCase().includes(q) ||
        (p.company || '').toLowerCase().includes(q) ||
        (p.job_title || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q))
    );
    
    const filteredActual = allParticipants.filter(p =>
        (p.status || '').toUpperCase() === 'ATTENDED' &&
        ((p.full_name || '').toLowerCase().includes(q) ||
        (p.company || '').toLowerCase().includes(q) ||
        (p.job_title || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q))
    );
    
    renderParticipantsTable(filteredInitial, initialTable);
    renderParticipantsTable(filteredActual, actualTable);
}

// Render participants table (for Participants section)
function renderParticipantsTable(participants, tableBody) {
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!participants || participants.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No participants found.</td></tr>';
        return;
    }
    
    participants.forEach((participant, idx) => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900">${idx + 1}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${escapeHtml(participant.full_name || participant.name || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(participant.company || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(participant.job_title || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(participant.email || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(participant.phone || participant.contact_number || '-')}</td>
            <td class="px-4 py-3 text-right text-sm">
              <div class="flex gap-2 justify-end">
                <button class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" title="View">👁️</button>
                <button class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" title="Edit">✏️</button>
                <button class="px-2 py-1 text-red-600 hover:bg-red-50 rounded" title="Delete">🗑️</button>
              </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Search event attendees
function searchEventAttendees(query) {
    const initialTable = document.getElementById('eventAttendeesInitialTable');
    const actualTable = document.getElementById('eventAttendeesActualTable');
    
    if (!initialTable || !actualTable || !window.currentEventAttendees) return;
    
    const q = query.toLowerCase();
    
    // Filter attendees
    const filteredInitial = window.currentEventAttendees.initial.filter(a =>
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.company || '').toLowerCase().includes(q) ||
        (a.job_title || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
    );
    
    const filteredActual = window.currentEventAttendees.actual.filter(a =>
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.company || '').toLowerCase().includes(q) ||
        (a.job_title || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
    );
    
    renderAttendeesTable(filteredInitial, initialTable);
    renderAttendeesTable(filteredActual, actualTable);
}

// Export participants (global)
function exportParticipants() {
    console.log('Exporting all participants');
    
    const initialList = window.currentEventAttendees?.initial || [];
    const actualList = window.currentEventAttendees?.actual || [];
    const allData = [...initialList, ...actualList];
    
    if (allData.length === 0) {
        showNotification('No participants to export', 'warning');
        return;
    }
    
    // Create CSV content
    let csv = 'NO.,FULL NAME,COMPANY,JOB TITLE,EMAIL ADDRESS,CONTACT NUMBER,STATUS\n';
    
    allData.forEach((participant, idx) => {
        const fullName = (participant.full_name || participant.name || '-').replace(/"/g, '""');
        const company = (participant.company || '-').replace(/"/g, '""');
        const jobTitle = (participant.job_title || '-').replace(/"/g, '""');
        const email = (participant.email || '-').replace(/"/g, '""');
        const phone = (participant.phone || participant.contact_number || '-').replace(/"/g, '""');
        const status = (participant.status || 'PENDING').replace(/"/g, '""');
        
        csv += `${idx + 1},"${fullName}","${company}","${jobTitle}","${email}","${phone}","${status}"\n`;
    });
    
    // Create a blob and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `participants-export-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Participants exported successfully', 'success');
}

// Add participant (global)
function addParticipant() {
    console.log('Opening add attendee modal for global participants');
    
    // Reset form
    document.getElementById('addAttendeeForm').reset();
    document.getElementById('addAttendeeEventId').value = '';  // Clear event ID - this is for global participants
    document.getElementById('addAttendeeEventField').style.display = 'block';  // Show event selection
    document.getElementById('addAttendeeErrorMessage').style.display = 'none';
    document.getElementById('addAttendeeSuccessMessage').style.display = 'none';
    
    // Load events for the dropdown
    loadEventsForAttendeeModal();
    
    // Show modal
    document.getElementById('addAttendeeModal').classList.add('active');
    
    // Focus on event select
    setTimeout(() => document.getElementById('addAttendeeEventSelect').focus(), 100);
}

// Export event attendees
function exportEventAttendees(eventId) {
    console.log('Exporting attendees for event:', eventId);
    
    const initialList = window.currentEventAttendees?.initial || [];
    const actualList = window.currentEventAttendees?.actual || [];
    const allData = [...initialList, ...actualList];
    
    if (allData.length === 0) {
        showNotification('No attendees to export', 'warning');
        return;
    }
    
    try {
        if (typeof window.jspdf === 'undefined') {
            showNotification('PDF library not available. Please try again.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get event name
        const eventName = window.currentEventData?.title || 'Event Attendees';
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Event Attendees Report', 14, 20);
        
        // Event info
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Event: ${eventName}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);
        doc.text(`Total Attendees: ${allData.length}`, 14, 46);
        
        // Create table
        const columns = ['No.', 'Full Name', 'Company', 'Job Title', 'Email', 'Phone', 'Status'];
        const rows = allData.map((attendee, idx) => [
            idx + 1,
            attendee.full_name || attendee.name || '-',
            attendee.company || '-',
            attendee.job_title || '-',
            attendee.email || '-',
            attendee.phone || attendee.contact_number || '-',
            attendee.status || 'PENDING'
        ]);
        
        // Apply table styling
        doc.autoTable({
            startY: 55,
            head: [columns],
            body: rows,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [85, 156, 218], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                6: { halign: 'center' }
            }
        });
        
        // Footer with page numbers
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);
        }
        
        // Download
        const filename = `event-attendees-${eventName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        showNotification('Attendees exported to PDF successfully', 'success');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showNotification('Error exporting to PDF. Please try again.', 'error');
    }
}

// Add event attendee
function addEventAttendee(eventId) {
    console.log('Opening add attendee modal for event:', eventId);
    
    // Reset form
    document.getElementById('addAttendeeForm').reset();
    document.getElementById('addAttendeeEventId').value = eventId;
    document.getElementById('addAttendeeEventField').style.display = 'none';  // Hide event selection when event is pre-selected
    document.getElementById('addAttendeeErrorMessage').style.display = 'none';
    document.getElementById('addAttendeeSuccessMessage').style.display = 'none';
    
    // Show modal
    document.getElementById('addAttendeeModal').classList.add('active');
    
    // Focus on first field (First Name)
    setTimeout(() => document.getElementById('addAttendeeFirstName').focus(), 100);
}

// Close add attendee modal
function closeAddAttendeeModal() {
    document.getElementById('addAttendeeModal').classList.remove('active');
    document.getElementById('addAttendeeForm').reset();
    document.getElementById('addAttendeeErrorMessage').style.display = 'none';
    document.getElementById('addAttendeeSuccessMessage').style.display = 'none';
    document.getElementById('addAttendeeEventField').style.display = 'none';  // Hide event field
}

// Show error message in add attendee modal
function showAddAttendeeError(message) {
    const errorDiv = document.getElementById('addAttendeeErrorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Show success message in add attendee modal
function showAddAttendeeSuccess(message) {
    const successDiv = document.getElementById('addAttendeeSuccessMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

// Load events for the event dropdown (when adding from Participants page)
async function loadEventsForAttendeeModal() {
    const eventSelect = document.getElementById('addAttendeeEventSelect');
    
    try {
        const response = await fetch(`${API_BASE}/events.php?action=list`, {
            headers: getUserHeaders()
        });
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
            // Clear existing options except the placeholder
            eventSelect.innerHTML = '<option value="">-- Select an event --</option>';
            
            // Add event options
            data.data.forEach(event => {
                const option = document.createElement('option');
                option.value = event.event_id;
                option.textContent = event.event_name || 'Unnamed Event';
                eventSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Handle add attendee form submission
function handleAddAttendeeSubmit(event) {
    event.preventDefault();
    
    let eventId = document.getElementById('addAttendeeEventId').value;
    
    // If no event preset, check if one was selected in dropdown
    if (!eventId) {
        eventId = document.getElementById('addAttendeeEventSelect').value;
    }
    
    // Validate event selection
    if (!eventId) {
        showAddAttendeeError('Please select an event');
        return;
    }
    
    // Get name components
    const firstName = document.getElementById('addAttendeeFirstName').value.trim();
    const middleName = document.getElementById('addAttendeeMiddleName').value.trim();
    const surname = document.getElementById('addAttendeeSurname').value.trim();
    
    // Combine into full name
    let fullName = firstName;
    if (middleName) {
        fullName += ' ' + middleName;
    }
    fullName += ' ' + surname;
    
    const email = document.getElementById('addAttendeeEmail').value.trim();
    const company = document.getElementById('addAttendeeCompany').value.trim();
    const jobTitle = document.getElementById('addAttendeeJobTitle').value.trim();
    const phone = document.getElementById('addAttendeePhone').value.trim();
    
    // Validate all required fields
    console.log('🔍 Field validation:');
    console.log('  eventId:', eventId, eventId ? '✓' : '✗ EMPTY');
    console.log('  firstName:', firstName, firstName ? '✓' : '✗ EMPTY');
    console.log('  surname:', surname, surname ? '✓' : '✗ EMPTY');
    console.log('  email:', email, email ? '✓' : '✗ EMPTY');
    console.log('  company:', company, company ? '✓' : '✗ EMPTY');
    console.log('  jobTitle:', jobTitle, jobTitle ? '✓' : '✗ EMPTY');
    console.log('  phone:', phone, phone ? '✓' : '✗ EMPTY');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAddAttendeeError('Invalid email address');
        return;
    }
    
    // Validate phone (must be at least 7 digits/characters)
    if (phone.length < 7) {
        showAddAttendeeError('Phone number must be at least 7 digits');
        return;
    }
    
    const submitBtn = document.getElementById('addAttendeeSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
    // Get user headers for API request
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = (admin && admin.id) ? admin : user;
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (userInfo.role || userInfo.role_name) {
        headers['X-User-Role'] = userInfo.role || userInfo.role_name;
    }
    
    if (userInfo.id || userInfo.user_id) {
        headers['X-User-Id'] = userInfo.id || userInfo.user_id;
    }
    
    if (userInfo.coordinator_id) {
        headers['X-Coordinator-Id'] = userInfo.coordinator_id;
    }
    
    // Send to API
    // All attendees added through this form are automatically considered walk-in attendees
    // Walk-in attendees are marked as ATTENDED since they're physically present
    const requestPayload = {
        event_id: parseInt(eventId),
        first_name: firstName,
        middle_name: middleName,
        last_name: surname,
        participant_email: email,
        company: company,
        job_title: jobTitle,
        participant_phone: phone,
        status: 'ATTENDED',  // Walk-in = already attended
        is_walkIn: 1  // Always 1 for attendees added via Add Attendee modal
    };
    
    console.log('📤 Sending to API:', JSON.stringify(requestPayload, null, 2));
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestPayload)
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json().then(data => ({status: response.status, data: data}));
    })
    .then(({status, data}) => {
        console.log('📥 API Response Status:', status);
        console.log('📥 API Response Data:', data);
        
        if (data.success) {
            console.log('✓ Attendee added successfully:', data);
            showAddAttendeeSuccess('Attendee added successfully! Registration code: ' + (data.registration_code || 'Generated'));
            
            // Clear form and reload attendees after a short delay
            setTimeout(() => {
                closeAddAttendeeModal();
                
                // Determine which context we're in and reload accordingly
                if (window.currentEventId) {
                    // We're in the full-page admin context
                    loadEventAttendees({event_id: window.currentEventId}, false);
                } else if (typeof loadParticipants === 'function') {
                    // We're in the participants page
                    loadParticipants();
                }
            }, 1500);
        } else {
            showAddAttendeeError(data.message || 'Failed to add attendee');
        }
    })
    .catch(error => {
        console.error('🔴 Fetch Error:', error);
        showAddAttendeeError('Error: ' + error.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

// View event attendee details
function viewEventAttendee(attendeeId) {
    console.log('Viewing attendee:', attendeeId);
    showNotification('View attendee feature coming soon', 'info');
}

// Edit event attendee
function editEventAttendee(attendeeId) {
    console.log('Editing attendee:', attendeeId);
    showNotification('Edit attendee feature coming soon', 'info');
}

// Delete event attendee
function deleteEventAttendee(attendeeId) {
    console.log('Deleting attendee:', attendeeId);
    showNotification('Delete attendee feature coming soon', 'info');
}

// Switch attendees list (fallback - delegates to event-details.js if defined there)
function switchAttendeesList(tab) {
    console.log('🔄 Switching attendees list to:', tab);
    
    // Try to use the function from event-details.js first
    if (typeof switchAttendeesTab === 'function') {
        console.log('✓ Using switchAttendeesTab from event-details.js');
        switchAttendeesTab(tab);
        return;
    }
    
    // Fallback: direct DOM manipulation if switchAttendeesTab is not available
    const initialBtn = document.getElementById('initialListTab');
    const actualBtn = document.getElementById('actualListTab');
    const initialContent = document.getElementById('initialListContent');
    const actualContent = document.getElementById('actualAttendeesContent');
    
    if (!initialBtn || !actualBtn || !initialContent || !actualContent) {
        console.error('❌ Missing elements for tab switching!');
        return;
    }
    
    if (tab === 'initial') {
        initialBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
        initialBtn.style.color = 'white';
        actualBtn.style.background = 'white';
        actualBtn.style.color = '#4b5563';
        initialContent.style.display = 'block';
        actualContent.style.display = 'none';
        console.log('✓ Switched to Initial List tab');
    } else if (tab === 'actual') {
        initialBtn.style.background = 'white';
        initialBtn.style.color = '#4b5563';
        actualBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
        actualBtn.style.color = 'white';
        initialContent.style.display = 'none';
        actualContent.style.display = 'block';
        console.log('✓ Switched to Actual Attendees tab');
    }
}

// Search attendees (delegates to event-details.js implementation)
function searchAttendees(query) {
    console.log('🔍 searchAttendees called in admin.js with query:', query);
    
    // The actual implementation is in event-details.js
    // Just call it if available
    if (typeof window.searchAttendeesImpl === 'function') {
        console.log('✓ Delegating to event-details.js searchAttendees');
        window.searchAttendeesImpl(query);
        return;
    }
    
    console.log('ℹ event-details.js searchAttendees not ready yet, using local implementation');
    
    // Fallback local implementation
    const initialBody = document.getElementById('initialListBody');
    const actualBody = document.getElementById('actualAttendeesBody');
    
    if (!initialBody || !actualBody) {
        console.error('❌ Table bodies not found');
        return;
    }
    
    // Try to get attendees data
    let attendeesData = window.attendeesData;
    if (!attendeesData) {
        console.warn('⚠️ window.attendeesData not available, trying window.currentEventAttendees');
        if (window.currentEventAttendees && window.currentEventAttendees.initial && window.currentEventAttendees.actual) {
            attendeesData = {
                initial: window.currentEventAttendees.initial,
                actual: window.currentEventAttendees.actual
            };
        } else {
            console.warn('⚠️ No attendees data found');
            return;
        }
    }
    
    const q = query.toLowerCase();
    
    if (!query || query.trim() === '') {
        // Show all attendees
        initialBody.innerHTML = attendeesData.initial.length > 0 
            ? attendeesData.initial.map((a, i) => createAttendeeRow(a, i, false)).join('')
            : '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No attendees found</td></tr>';
        actualBody.innerHTML = attendeesData.actual.length > 0
            ? attendeesData.actual.map((a, i) => createAttendeeRow(a, i, true)).join('')
            : '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No attendees found</td></tr>';
        return;
    }
    
    // Filter attendees - search by full_name, first_name, middle_name, last_name, company, job_title, email
    const filteredInitial = attendeesData.initial.filter(a =>
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.first_name || '').toLowerCase().includes(q) ||
        (a.middle_name || '').toLowerCase().includes(q) ||
        (a.last_name || '').toLowerCase().includes(q) ||
        (a.company || '').toLowerCase().includes(q) ||
        (a.job_title || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
    );
    
    const filteredActual = attendeesData.actual.filter(a =>
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.first_name || '').toLowerCase().includes(q) ||
        (a.middle_name || '').toLowerCase().includes(q) ||
        (a.last_name || '').toLowerCase().includes(q) ||
        (a.company || '').toLowerCase().includes(q) ||
        (a.job_title || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
    );
    
    // Render filtered results
    initialBody.innerHTML = filteredInitial.length > 0
        ? filteredInitial.map((a, i) => createAttendeeRow(a, i, false)).join('')
        : '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No attendees found</td></tr>';
    
    actualBody.innerHTML = filteredActual.length > 0
        ? filteredActual.map((a, i) => createAttendeeRow(a, i, true)).join('')
        : '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No attendees found</td></tr>';
    
    console.log('✓ Search complete: Initial=' + filteredInitial.length + ', Actual=' + filteredActual.length);
}

// Helper function to create attendee row HTML
function createAttendeeRow(attendee, index, isActual) {
    const regCode = attendee.registration_code || '';
    const getField = (obj, field) => {
        const val = obj[field];
        if (val === null || val === undefined) return '';
        return String(val).trim();
    };
    
    return `
        <tr style="border-bottom: 1px solid #e8e8e8; background: ${index % 2 === 0 ? 'white' : '#fafafa'}; height: 60px;">
            <td style="padding: 15px; color: #333; font-size: 13px;">${index + 1}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'full_name'))}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'company'))}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'job_title'))}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'email'))}</td>
            <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'phone'))}</td>
            <td style="padding: 15px; text-align: right;">
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button onclick="showQRCode('${escapeHtml(regCode)}')" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px;" title="View QR Code">📱</button>
                    ${isActual ? `<button onclick="markAttendeeAsInitial('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #FF9800;" title="Mark as Initial">↩</button>` : `<button onclick="markAttendeeAsAttended('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #4CAF50;" title="Mark as Attended">✓</button>`}
                    <button onclick="deleteAttendee('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #f44336;" title="Delete">🗑</button>
                </div>
            </td>
        </tr>
    `;
}

// Export attendees to CSV (delegates to event-details.js implementation)
function exportAttendees() {
    console.log('📥 exportAttendees called - exporting to PDF');
    
    const allAttendees = (window.attendeesData?.initial || []).concat(window.attendeesData?.actual || []);
    
    if (allAttendees.length === 0) {
        alert('No attendees to export');
        return;
    }
    
    try {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library not available. Please try again.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get event name
        const eventName = window.currentEventData?.title || window.selectedEventTitle || 'Event Attendees';
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Event Attendees Report', 14, 20);
        
        // Event info
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Event: ${eventName}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);
        doc.text(`Total Attendees: ${allAttendees.length}`, 14, 46);
        
        // Create table
        const columns = ['No.', 'Full Name', 'Company', 'Job Title', 'Email', 'Phone', 'Status'];
        const rows = allAttendees.map((attendee, idx) => [
            idx + 1,
            attendee.full_name || '-',
            attendee.company || '-',
            attendee.job_title || '-',
            attendee.email || '-',
            attendee.phone || '-',
            (window.attendeesData?.actual || []).includes(attendee) ? 'ATTENDED' : 'INITIAL'
        ]);
        
        // Apply table styling
        doc.autoTable({
            startY: 55,
            head: [columns],
            body: rows,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [85, 156, 218], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                6: { halign: 'center' }
            }
        });
        
        // Footer with page numbers
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);
        }
        
        // Download
        const filename = `attendees-${eventName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        console.log('✓ Export complete - PDF saved');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Error exporting to PDF. Please try again.');
    }
}

// Add new attendee (redirects to addEventAttendee for modal-based form)
function addAttendee() {
    console.log('Opening add attendee modal...');
    
    const eventId = window.currentEventId;
    if (!eventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    // Use the new modal-based system
    addEventAttendee(eventId);
}

// Switch Tasks view between List and Calendar
function switchTasksView(view) {
    console.log('Switching tasks view to:', view);
    
    const listView = document.getElementById('tasksListView');
    const calendarView = document.getElementById('tasksCalendarView');
    const listBtn = document.getElementById('taskListViewBtn');
    const calendarBtn = document.getElementById('taskMonthViewBtn');
    
    console.log('Elements found:', { listView: !!listView, calendarView: !!calendarView, listBtn: !!listBtn, calendarBtn: !!calendarBtn });
    
    try {
        if (view === 'list') {
            console.log('Switching to list view');
            if (listView) {
                listView.classList.remove('hidden');
                listView.style.display = 'block';
            }
            if (calendarView) {
                calendarView.classList.add('hidden');
                calendarView.style.display = 'none';
            }
            if (listBtn) {
                listBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
                listBtn.style.color = 'white';
                // Remove hover effects from active button
                listBtn.onmouseover = null;
                listBtn.onmouseout = null;
            }
            if (calendarBtn) {
                calendarBtn.style.background = '#f3f4f6';
                calendarBtn.style.color = '#4b5563';
                // Add hover effects to inactive button
                calendarBtn.onmouseover = () => calendarBtn.style.background = '#e5e7eb';
                calendarBtn.onmouseout = () => calendarBtn.style.background = '#f3f4f6';
            }
        } else if (view === 'calendar') {
            console.log('Switching to calendar view');
            if (listView) {
                listView.classList.add('hidden');
                listView.style.display = 'none';
            }
            if (calendarView) {
                calendarView.classList.remove('hidden');
                calendarView.style.display = 'grid';
                console.log('Calendar view is now visible');
            } else {
                console.error('Calendar view element not found');
            }
            if (listBtn) {
                listBtn.style.background = '#f3f4f6';
                listBtn.style.color = '#4b5563';
                // Add hover effects to inactive button
                listBtn.onmouseover = () => listBtn.style.background = '#e5e7eb';
                listBtn.onmouseout = () => listBtn.style.background = '#f3f4f6';
            }
            if (calendarBtn) {
                calendarBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
                calendarBtn.style.color = 'white';
                // Remove hover effects from active button
                calendarBtn.onmouseover = null;
                calendarBtn.onmouseout = null;
            }
            
            // Render calendar when switching to calendar view
            console.log('About to render calendar');
            renderTasksCalendar();
            console.log('Calendar rendered');
        }
    } catch (error) {
        console.error('Error in switchTasksView:', error);
    }
}

// Initialize calendar state for full-page view
let tasksCalendarState = {
    currentDate: new Date(),
    tasks: []
};

// Render the calendar for full-page view
function renderTasksCalendar() {
    try {
        console.log('renderTasksCalendar: Starting');
        const currentMonth = tasksCalendarState.currentDate.getMonth();
        const currentYear = tasksCalendarState.currentDate.getFullYear();
        const tasks = window.currentEventTasks?.all || [];
        
        console.log('renderTasksCalendar: Month:', currentMonth, 'Year:', currentYear, 'Tasks:', tasks.length);
        
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthDisplay = document.getElementById('tasksCurrentMonth');
        if (monthDisplay) {
            monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
            console.log('Month display updated');
        }
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        console.log('renderTasksCalendar: firstDay:', firstDay, 'daysInMonth:', daysInMonth);
        
        // Create task map by date
        const tasksByDate = {};
        tasks.forEach(task => {
            if (task.due_date) {
                const taskDate = new Date(task.due_date);
                if (taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear) {
                    const day = taskDate.getDate();
                    if (!tasksByDate[day]) {
                        tasksByDate[day] = [];
                    }
                    tasksByDate[day].push(task);
                }
            }
        });
        
        console.log('renderTasksCalendar: tasksByDate:', Object.keys(tasksByDate).length, 'days with tasks');
        
        // Render calendar days
        const calendarDays = document.getElementById('tasksCalendarDays');
        if (!calendarDays) {
            console.error('renderTasksCalendar: Calendar days container not found!');
            return;
        }
        
        console.log('renderTasksCalendar: Clearing calendar');
        calendarDays.innerHTML = '';
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.style.background = '#ffffff';
            emptyCell.style.padding = '8px';
            calendarDays.appendChild(emptyCell);
        }
        
        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.style.background = '#ffffff';
            dayCell.style.padding = '8px';
            dayCell.style.cursor = 'pointer';
            dayCell.style.position = 'relative';
            dayCell.style.display = 'flex';
            dayCell.style.flexDirection = 'column';
            dayCell.style.minHeight = '80px';
            dayCell.style.fontSize = '13px';
            dayCell.style.transition = 'background-color 0.2s ease';
            dayCell.onmouseover = function() { this.style.background = '#f0f9ff'; };
            dayCell.onmouseout = function() { 
                const today = new Date();
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                this.style.background = isToday ? '#dbeafe' : '#ffffff';
            };
            
            // Check if today
            const today = new Date();
            if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                dayCell.style.background = '#dbeafe';
                dayCell.style.borderLeft = '3px solid #0369a1';
            }
            
            // Day number
            const dayNum = document.createElement('div');
            dayNum.textContent = day;
            dayNum.style.fontWeight = '600';
            dayNum.style.color = '#111827';
            dayNum.style.marginBottom = '4px';
            dayNum.style.fontSize = '13px';
            dayCell.appendChild(dayNum);
            
            // Tasks for this day
            const dayTasks = tasksByDate[day] || [];
            if (dayTasks.length > 0) {
                const tasksContainer = document.createElement('div');
                tasksContainer.style.fontSize = '11px';
                tasksContainer.style.flex = '1';
                tasksContainer.style.overflow = 'hidden';
                
                dayTasks.slice(0, 2).forEach(task => {
                    const taskElement = document.createElement('div');
                    taskElement.textContent = task.task_name;
                    taskElement.style.background = '#fef3c7';
                    taskElement.style.color = '#78350f';
                    taskElement.style.padding = '2px 4px';
                    taskElement.style.borderRadius = '2px';
                    taskElement.style.marginBottom = '2px';
                    taskElement.style.whiteSpace = 'nowrap';
                    taskElement.style.overflow = 'hidden';
                    taskElement.style.textOverflow = 'ellipsis';
                    taskElement.style.fontWeight = '500';
                    taskElement.style.cursor = 'pointer';
                    taskElement.onclick = (e) => {
                        e.stopPropagation();
                        showTasksDayDetails(day, dayTasks);
                    };
                    tasksContainer.appendChild(taskElement);
                });
                
                if (dayTasks.length > 2) {
                    const moreElement = document.createElement('div');
                    moreElement.textContent = `+${dayTasks.length - 2} more`;
                    moreElement.style.fontSize = '10px';
                    moreElement.style.color = '#6b7280';
                    moreElement.style.cursor = 'pointer';
                    moreElement.onclick = (e) => {
                        e.stopPropagation();
                        showTasksDayDetails(day, dayTasks);
                    };
                    tasksContainer.appendChild(moreElement);
                }
                
                dayCell.appendChild(tasksContainer);
            }
            
            // Click handler to show details
            dayCell.onclick = () => showTasksDayDetails(day, dayTasks);
            
            calendarDays.appendChild(dayCell);
        }
        
        console.log('renderTasksCalendar: Calendar rendered successfully');
    } catch (error) {
        console.error('renderTasksCalendar: Error:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Show deadline details for selected day
function showTasksDayDetails(day, tasks) {
    const detailsContainer = document.getElementById('tasksDeadlineDetails');
    const countElement = document.getElementById('tasksDeadlineCount');
    
    if (!detailsContainer || !countElement) return;
    
    const currentMonth = tasksCalendarState.currentDate.getMonth();
    const currentYear = tasksCalendarState.currentDate.getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dateStr = `${monthNames[currentMonth]} ${day}, ${currentYear}`;
    
    if (tasks.length === 0) {
        countElement.innerHTML = `<p style="margin: 0;">No tasks on ${dateStr}</p>`;
        detailsContainer.innerHTML = '';
        return;
    }
    
    countElement.innerHTML = `<p style="margin: 0; font-weight: 600; color: #111827;">${tasks.length} task${tasks.length > 1 ? 's' : ''} on ${dateStr}</p>`;
    
    let html = '';
    tasks.forEach(task => {
        html += `
            <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                <div style="font-weight: 600; color: #111827; font-size: 14px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">${escapeHtml(task.task_name)}</div>
                <div style="color: #6b7280; font-size: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">
                    <strong>Due:</strong> ${task.due_date}
                </div>
                <div style="color: #6b7280; font-size: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">
                    <strong>Responsible:</strong> ${escapeHtml(task.party_responsible || '-')}
                </div>
                <div style="color: #6b7280; font-size: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">
                    <strong>Status:</strong> ${task.status}
                </div>
                <div style="color: #6b7280; font-size: 12px;">
                    <strong>Remarks:</strong> ${task.remarks ? escapeHtml(task.remarks) : '-'}
                </div>
            </div>
        `;
    });
    
    detailsContainer.innerHTML = html;
}

// Navigate to previous month
function previousTasksMonth() {
    tasksCalendarState.currentDate.setMonth(tasksCalendarState.currentDate.getMonth() - 1);
    renderTasksCalendar();
}

// Navigate to next month
function nextTasksMonth() {
    tasksCalendarState.currentDate.setMonth(tasksCalendarState.currentDate.getMonth() + 1);
    renderTasksCalendar();
}

// Go to today
function goToTasksToday() {
    tasksCalendarState.currentDate = new Date();
    renderTasksCalendar();
}

// Switch between month and list view in tasks calendar
function switchTasksCalendarView(view) {
    try {
        const monthViewContainer = document.getElementById('tasksMonthViewContainer');
        const listViewContainer = document.getElementById('tasksListViewContainer');
        const monthBtn = document.getElementById('tasksMonthViewBtn');
        const listBtn = document.getElementById('tasksListViewBtn');

        if (view === 'month') {
            if (monthViewContainer) {
                monthViewContainer.style.display = 'flex';
            }
            if (listViewContainer) {
                listViewContainer.style.display = 'none';
            }
            if (monthBtn) {
                monthBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
                monthBtn.style.color = 'white';
                // Remove hover effects from active button
                monthBtn.onmouseover = null;
                monthBtn.onmouseout = null;
            }
            if (listBtn) {
                listBtn.style.background = '#f3f4f6';
                listBtn.style.color = '#4b5563';
                // Add hover effects to inactive button
                listBtn.onmouseover = () => listBtn.style.background = '#e5e7eb';
                listBtn.onmouseout = () => listBtn.style.background = '#f3f4f6';
            }
        } else if (view === 'list') {
            if (monthViewContainer) {
                monthViewContainer.style.display = 'none';
            }
            if (listViewContainer) {
                listViewContainer.style.display = 'flex';
                console.log('[Tasks] List container set to flex, styles:', listViewContainer.getAttribute('style'));
            }
            if (monthBtn) {
                monthBtn.style.background = '#f3f4f6';
                monthBtn.style.color = '#4b5563';
                // Add hover effects to inactive button
                monthBtn.onmouseover = () => monthBtn.style.background = '#e5e7eb';
                monthBtn.onmouseout = () => monthBtn.style.background = '#f3f4f6';
            }
            if (listBtn) {
                listBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
                listBtn.style.color = 'white';
                // Remove hover effects from active button
                listBtn.onmouseover = null;
                listBtn.onmouseout = null;
            }
            
            // Render tasks list
            console.log('[Tasks] Calling renderTasksListView...');
            renderTasksListView();
        }
    } catch (error) {
        console.error('Error in switchTasksCalendarView:', error);
    }
}

// Render tasks in list view
function renderTasksListView() {
    try {
        const listContainer = document.getElementById('tasksEventsList');
        if (!listContainer) {
            console.error('tasksEventsList container not found');
            return;
        }

        const tasks = window.currentEventTasks?.all || [];
        console.log('[Tasks List] Current tasks count:', tasks.length);
        console.log('[Tasks List] Tasks data:', tasks);
        
        // Get current month and year from calendar state
        const currentMonth = tasksCalendarState.currentDate.getMonth();
        const currentYear = tasksCalendarState.currentDate.getFullYear();
        console.log('[Tasks List] Filtering for month:', currentMonth, 'year:', currentYear);
        
        // Filter tasks for current month
        const monthTasks = tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
        });
        
        console.log('[Tasks List] Month tasks count:', monthTasks.length);
        
        if (monthTasks.length === 0) {
            listContainer.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 20px;">No tasks found for this month</div>';
            return;
        }

        // Sort tasks by due date
        const sortedTasks = [...monthTasks].sort((a, b) => {
            return new Date(a.due_date) - new Date(b.due_date);
        });

        let html = '';
        sortedTasks.forEach(task => {
            html += `
                <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: transform 0.2s ease;" onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='translateX(0)'">
                    <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${escapeHtml(task.task_name)}</div>
                    <div style="color: #6b7280; font-size: 12px; margin-bottom: 2px;">
                        <strong>Due:</strong> ${task.due_date}
                    </div>
                    <div style="color: #6b7280; font-size: 12px; margin-bottom: 2px;">
                        <strong>Responsible:</strong> ${escapeHtml(task.party_responsible || '-')}
                    </div>
                    <div style="color: #6b7280; font-size: 12px;">
                        <strong>Status:</strong> <span style="padding: 2px 6px; border-radius: 3px;">${task.status}</span>
                    </div>
                </div>
            `;
        });

        listContainer.innerHTML = html;
        console.log('[Tasks List] ✓ HTML rendered successfully, length:', html.length);
        console.log('[Tasks List] Container:', listContainer);
    } catch (error) {
        console.error('Error in renderTasksListView:', error);
    }
}

// Add new task
function addTask() {
    console.log('Opening Add Task modal...');
    
    const eventId = window.currentEventId;
    if (!eventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    // Clear editing flag
    window.editingTaskId = null;
    
    // Reset form
    document.getElementById('addTaskForm').reset();
    
    // Reset modal title and button
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        const heading = modal.querySelector('.text-2xl');
        const submitBtn = modal.querySelector('button[type="submit"]');
        
        if (heading) heading.textContent = 'Add Task';
        if (submitBtn) submitBtn.textContent = 'Create';
        
        // Open modal
        modal.classList.add('active');
    }
}

// Close Add Task Modal
function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Reset modal title and button
        const heading = modal.querySelector('.text-2xl');
        const submitBtn = modal.querySelector('button[type="submit"]');
        
        if (heading) heading.textContent = 'Add Task';
        if (submitBtn) submitBtn.textContent = 'Create';
    }
    
    // Reset form
    document.getElementById('addTaskForm').reset();
    
    // Clear editing flag
    window.editingTaskId = null;
}

// ========== TASK COORDINATOR LOOKUP FUNCTIONS ==========

function openLookupCoordinatorTaskModal() {
    if (!window.currentEventId) {
        alert('Please save the event first before assigning coordinators to tasks');
        return;
    }
    console.log('🔍 Opening Task Coordinator Lookup modal for event:', window.currentEventId);
    const modal = document.getElementById('lookupCoordinatorTaskModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    const searchInput = document.getElementById('coordinatorTaskSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    loadEventAssignedCoordinatorsForTask();
}

function closeLookupCoordinatorTaskModal() {
    console.log('✕ Closing Task Coordinator Lookup modal');
    const modal = document.getElementById('lookupCoordinatorTaskModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const searchInput = document.getElementById('coordinatorTaskSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
}

async function loadEventAssignedCoordinatorsForTask() {
    try {
        console.log('📥 Fetching coordinators for event:', window.currentEventId);
        
        // Build the API URL
        const apiUrl = `${API_BASE}/events.php?action=get_event_coordinators&event_id=${window.currentEventId}`;
        console.log('API URL:', apiUrl);
        
        // Fetch coordinators assigned to this specific event
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: getUserHeaders()
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            console.log('✓ Coordinators loaded:', data.data);
            displayEventCoordinatorsForTask(data.data || []);
        } else {
            console.error('❌ API returned error:', data.message);
            const listContainer = document.getElementById('coordinatorsTaskList');
            if (listContainer) {
                listContainer.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 20px;">Error loading coordinators: ' + (data.message || 'Unknown error') + '</p>';
            }
        }
    } catch (error) {
        console.error('❌ Error loading coordinators:', error);
        const listContainer = document.getElementById('coordinatorsTaskList');
        if (listContainer) {
            listContainer.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 20px;">Error loading coordinators: ' + error.message + '</p>';
        }
    }
}

// Store selected coordinators for multi-select
let selectedCoordinatorsForTask = new Map(); // Map of coordinator_id -> full coordinator object
let allEventCoordinators = []; // Store all coordinators for reference

function displayEventCoordinatorsForTask(coordinators) {
    const listContainer = document.getElementById('coordinatorsTaskList');
    
    if (!listContainer) {
        console.error('❌ coordinatorsTaskList container not found');
        return;
    }
    
    // Store all coordinators for later reference
    allEventCoordinators = coordinators;
    
    console.log('🎨 Displaying coordinators:', coordinators);
    console.log('📊 Current selections:', Array.from(selectedCoordinatorsForTask.keys()));
    
    if (!coordinators || coordinators.length === 0) {
        console.warn('⚠️ No coordinators found');
        listContainer.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No coordinators assigned to this event. Please assign coordinators in the Event Details tab first.</p>';
        return;
    }
    
    let html = '';
    coordinators.forEach(coordinator => {
        // Skip coordinators that are already selected (already in preview)
        if (selectedCoordinatorsForTask.has(coordinator.coordinator_id)) {
            console.log(`⊘ Skipping already selected: ${coordinator.coordinator_name}`);
            return;
        }
        
        // Build profile image path
        let profileImageUrl = '/assets/placeholder-avatar.png'; // Default placeholder
        if (coordinator.coordinator_image) {
            // Check if it's a full URL or just a filename
            if (coordinator.coordinator_image.includes('data:image')) {
                profileImageUrl = coordinator.coordinator_image;
            } else if (coordinator.coordinator_image.includes('http')) {
                profileImageUrl = coordinator.coordinator_image;
            } else {
                // Assume it's a filename in uploads/coordinators directory
                profileImageUrl = `../uploads/coordinators/${coordinator.coordinator_image}`;
            }
        }
        
        // Encode coordinator data for safe passing through onclick
        const coordDataJson = JSON.stringify(coordinator).replace(/"/g, '&quot;');
        
        html += `
            <label class="coordinator-card-task" data-coordinator-id="${coordinator.coordinator_id}" style="border: 2px solid #e5e7eb; border-radius: 6px; padding: 16px; display: flex; align-items: center; background: white; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#f9fafb'; this.style.borderColor='#1E73BB'" onmouseout="this.style.background='white'; this.style.borderColor='#e5e7eb'" onclick="toggleCoordinatorSelection(${coordinator.coordinator_id}, '${coordinator.coordinator_name.replace(/'/g, "\\'")}', null, '${coordDataJson}')">
                <input type="checkbox" class="coordinator-checkbox" data-coordinator-id="${coordinator.coordinator_id}" data-coordinator-name="${coordinator.coordinator_name.replace(/"/g, '&quot;')}" style="width: 20px; height: 20px; margin-right: 12px; cursor: pointer;" onchange="toggleCoordinatorSelection(${coordinator.coordinator_id}, '${coordinator.coordinator_name.replace(/'/g, "\\'")}', event, '${coordDataJson}')">
                <div style="display: flex; gap: 12px; align-items: center; flex: 1; margin-left: 12px;">
                    <!-- Profile Picture -->
                    <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; background: #e5e7eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <img src="${profileImageUrl}" alt="${coordinator.coordinator_name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/assets/placeholder-avatar.png'">
                    </div>
                    <div style="flex: 1;">
                        <p style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937; font-size: 14px;">${coordinator.coordinator_name}</p>
                        <p style="margin: 0 0 2px 0; font-size: 13px; color: #6b7280;">${coordinator.email || 'No email'}</p>
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">${coordinator.contact_number || 'No phone'}</p>
                    </div>
                </div>
            </label>
        `;
    });
    
    if (html === '') {
        html = '<p style="text-align: center; color: #9ca3af; padding: 20px;">All assigned coordinators have been selected. ✓</p>';
    }
    
    listContainer.innerHTML = html;
    console.log('✓ Coordinators rendered with checkboxes');
}

function toggleCoordinatorSelection(coordinatorId, coordinatorName, event, coordinatorDataJson) {
    if (event) {
        event.stopPropagation();
    }
    
    // Parse coordinator data if provided
    let coordinatorData = null;
    if (coordinatorDataJson) {
        try {
            coordinatorData = JSON.parse(coordinatorDataJson);
        } catch (e) {
            console.error('Failed to parse coordinator data:', e);
            coordinatorData = {
                coordinator_id: coordinatorId,
                coordinator_name: coordinatorName
            };
        }
    }
    
    if (selectedCoordinatorsForTask.has(coordinatorId)) {
        selectedCoordinatorsForTask.delete(coordinatorId);
        console.log(`✖️ Removed coordinator: ${coordinatorName}`);
    } else {
        selectedCoordinatorsForTask.set(coordinatorId, coordinatorData || {
            coordinator_id: coordinatorId,
            coordinator_name: coordinatorName
        });
        console.log(`✅ Added coordinator: ${coordinatorName}`);
    }
    
    // Update checkbox visually
    const checkbox = document.querySelector(`.coordinator-checkbox[data-coordinator-id="${coordinatorId}"]`);
    if (checkbox) {
        checkbox.checked = selectedCoordinatorsForTask.has(coordinatorId);
    }
    
    // Update card styling
    const card = document.querySelector(`.coordinator-card-task[data-coordinator-id="${coordinatorId}"]`);
    if (card) {
        if (selectedCoordinatorsForTask.has(coordinatorId)) {
            card.style.borderColor = '#1E73BB';
            card.style.background = '#EFF5FB';
        } else {
            card.style.borderColor = '#e5e7eb';
            card.style.background = 'white';
        }
    }
    
    updateConfirmButtonState();
    console.log(`📊 Selected coordinators: ${selectedCoordinatorsForTask.size}`);
}

function updateConfirmButtonState() {
    const confirmBtn = document.getElementById('confirmCoordinatorSelectionBtn');
    if (!confirmBtn) return;
    
    if (selectedCoordinatorsForTask.size > 0) {
        confirmBtn.style.opacity = '1';
        confirmBtn.style.pointerEvents = 'auto';
        confirmBtn.style.background = '#1E73BB';
        confirmBtn.textContent = `Confirm Selection (${selectedCoordinatorsForTask.size})`;
    } else {
        confirmBtn.style.opacity = '0.5';
        confirmBtn.style.pointerEvents = 'none';
        confirmBtn.style.background = '#9ca3af';
        confirmBtn.textContent = 'Confirm Selection';
    }
}

function confirmCoordinatorSelection() {
    if (selectedCoordinatorsForTask.size === 0) {
        alert('Please select at least one coordinator');
        return;
    }
    
    const coordinatorNames = Array.from(selectedCoordinatorsForTask.values()).map(c => c.coordinator_name).join(', ');
    const coordinatorIds = Array.from(selectedCoordinatorsForTask.keys()).join(',');
    
    // Set the values in the task form
    const responsibleField = document.getElementById('taskResponsible');
    if (responsibleField) {
        responsibleField.value = coordinatorNames;
        // Store coordinator IDs in a data attribute for submission
        responsibleField.dataset.coordinatorIds = coordinatorIds;
    }
    
    // Display preview of selected coordinators
    displaySelectedCoordinatorsPreview();
    
    console.log(`✅ Selected ${selectedCoordinatorsForTask.size} coordinators: ${coordinatorNames}`);
    closeLookupCoordinatorTaskModal();
}

function displaySelectedCoordinatorsPreview() {
    const previewContainer = document.getElementById('selectedCoordinatorsPreview');
    const previewContent = document.getElementById('selectedCoordinatorsPreviewContent');
    
    if (!previewContainer || !previewContent) return;
    
    if (selectedCoordinatorsForTask.size === 0) {
        previewContainer.style.display = 'none';
        return;
    }
    
    // Calculate if scrolling is needed (more than 4 coordinators)
    const isScrollable = selectedCoordinatorsForTask.size > 4;
    const maxHeight = isScrollable ? '280px' : 'auto';
    const overflowStyle = isScrollable ? 'overflow-y: auto; overflow-x: hidden;' : '';
    
    let previewHtml = `
        <div style="${overflowStyle} ${isScrollable ? 'max-height: ' + maxHeight + '; border: 1px solid #e5e7eb; border-radius: 6px;' : ''}">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="border-bottom: 2px solid #e5e7eb; background: #f9fafb; ${isScrollable ? 'position: sticky; top: 0; z-index: 10;' : ''}">
                        <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; width: 50px;">PHOTO</th>
                        <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; width: 20%;">NAME</th>
                        <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; width: 25%;">EMAIL ADDRESS</th>
                        <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; width: 18%;">COMPANY</th>
                        <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; width: 18%;">CONTACT NUMBER</th>
                        <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #6b7280; width: 50px;">ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    selectedCoordinatorsForTask.forEach(coordinator => {
        // Build profile image path
        let profileImageUrl = '/assets/placeholder-avatar.png';
        if (coordinator.coordinator_image) {
            if (coordinator.coordinator_image.includes('data:image')) {
                profileImageUrl = coordinator.coordinator_image;
            } else if (coordinator.coordinator_image.includes('http')) {
                profileImageUrl = coordinator.coordinator_image;
            } else {
                profileImageUrl = `../uploads/coordinators/${coordinator.coordinator_image}`;
            }
        }
        
        previewHtml += `
            <tr style="border-bottom: 1px solid #e5e7eb; background: white;">
                <td style="padding: 12px 8px; text-align: center;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #e5e7eb; display: flex; align-items: center; justify-content: center;">
                        <img src="${profileImageUrl}" alt="${coordinator.coordinator_name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/assets/placeholder-avatar.png'">
                    </div>
                </td>
                <td style="padding: 12px 8px; color: #1f2937; font-weight: 500;">${coordinator.coordinator_name}</td>
                <td style="padding: 12px 8px; color: #6b7280; word-break: break-all;">${coordinator.email || 'No email'}</td>
                <td style="padding: 12px 8px; color: #6b7280;">${coordinator.company || 'N/A'}</td>
                <td style="padding: 12px 8px; color: #6b7280;">${coordinator.contact_number || 'No phone'}</td>
                <td style="padding: 12px 8px; text-align: center;">
                    <button type="button" onclick="removeCoordinatorFromSelection(${coordinator.coordinator_id})" style="background: none; border: 1px solid #ef4444; color: #ef4444; width: 36px; height: 36px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.borderColor='#dc2626'" onmouseout="this.style.background='none'; this.style.borderColor='#ef4444'">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            </tr>
        `;
    });
    
    previewHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    previewContent.innerHTML = previewHtml;
    previewContainer.style.display = 'block';
    console.log('✓ Preview table displayed', selectedCoordinatorsForTask.size, 'coordinators', isScrollable ? '(scrollable)' : '(fixed height)');
}

function removeCoordinatorFromSelection(coordinatorId) {
    selectedCoordinatorsForTask.delete(coordinatorId);
    console.log(`✖️ Removed coordinator ${coordinatorId} from selection`);
    
    // Update the preview
    displaySelectedCoordinatorsPreview();
    
    // Update preview in form if still needed
    updateTaskResponsibleField();
    
    // Refresh the lookup list to show the deleted coordinator again
    console.log('🔄 Refreshing lookup coordinator list...');
    displayEventCoordinatorsForTask(allEventCoordinators);
}

function updateTaskResponsibleField() {
    const responsibleField = document.getElementById('taskResponsible');
    if (!responsibleField) return;
    
    if (selectedCoordinatorsForTask.size === 0) {
        responsibleField.value = '';
        responsibleField.dataset.coordinatorIds = '';
        const previewContainer = document.getElementById('selectedCoordinatorsPreview');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    } else {
        const coordinatorNames = Array.from(selectedCoordinatorsForTask.values()).map(c => c.coordinator_name).join(', ');
        const coordinatorIds = Array.from(selectedCoordinatorsForTask.keys()).join(',');
        responsibleField.value = coordinatorNames;
        responsibleField.dataset.coordinatorIds = coordinatorIds;
    }
}

function filterCoordinatorsTaskList() {
    const searchInput = document.getElementById('coordinatorTaskSearchInput');
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
    console.log('🔎 Filtering coordinators with:', searchValue);
    const cards = document.querySelectorAll('.coordinator-card-task');
    
    let visibleCount = 0;
    cards.forEach(card => {
        const name = card.querySelector('p').textContent.toLowerCase();
        const emailElement = card.querySelectorAll('p')[1];
        const email = emailElement ? emailElement.textContent.toLowerCase() : '';
        
        if (name.includes(searchValue) || email.includes(searchValue)) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    console.log('Found', visibleCount, 'matching coordinators');
}

function selectCoordinatorForTask(coordinatorId, coordinatorName, event) {
    if (event) event.stopPropagation();
    
    console.log('✓ Old selectCoordinatorForTask called - using new toggle selection');
    toggleCoordinatorSelection(coordinatorId, coordinatorName, event);
}

// Handle Add Task Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const eventId = window.currentEventId;
            if (!eventId) {
                showNotification('No event selected', 'error');
                return;
            }
            
            const dueDate = document.getElementById('taskDueDate').value;
            const taskName = document.getElementById('taskName').value;
            const responsible = document.getElementById('taskResponsible').value;
            const status = document.getElementById('taskStatus').value;
            const remarks = document.getElementById('taskRemarks').value;
            
            // Validate required fields
            if (!dueDate || !taskName || !responsible) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Check if editing or creating
            const isEditing = window.editingTaskId;
            const action = isEditing ? 'update' : 'create';
            const taskId = isEditing ? window.editingTaskId : null;
            
            console.log('Submitting task:', {
                action,
                taskId,
                eventId,
                dueDate,
                taskName,
                responsible,
                status,
                remarks
            });
            
            // Send to API to save task
            const headers = getUserHeaders();
            headers['Content-Type'] = 'application/json';
            
            const taskData = {
                event_id: eventId,
                task_name: taskName,
                due_date: dueDate,
                party_responsible: responsible,
                status: status,
                remarks: remarks
            };
            
            if (isEditing) {
                taskData.task_id = taskId;
            }
            
            fetch(`${API_BASE}/tasks.php?action=${action}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(taskData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const successMsg = isEditing ? 'Task updated successfully' : 'Task created successfully';
                console.log('✓ ' + successMsg + ':', data);
                if (data.success) {
                    showNotification(successMsg + ': ' + taskName, 'success');
                    closeAddTaskModal();
                    
                    // Clear editing flag
                    window.editingTaskId = null;
                    
                    // Reload tasks table if available
                    if (window.currentEventData) {
                        loadEventTasks(window.currentEventData);
                    }
                } else {
                    showNotification('Failed to save task: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('✗ Error saving task:', error);
                showNotification('Error saving task: ' + error.message, 'error');
            });
        });
    }
});


function closeEventDetailsModal() {

    const modal = document.getElementById('eventDetailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Clear the current event ID
    currentEventId = null;
    window.currentEventId = null;  // Also clear from window object
    window.currentEventDetails = null;
    
    // Remove event ID from URL when modal is closed
    const url = new URL(window.location);
    url.searchParams.delete('eventId');
    window.history.pushState({}, '', url);
}

function renderEventTasksTab(event) {
    console.log('═══════════════════════════════════════════');
    console.log('[Tasks] RENDERING TASKS TAB');
    console.log('[Tasks] Event ID:', event?.event_id);
    console.log('[Tasks] Event name:', event?.event_name);
    
    const content = document.getElementById('eventTabContent');
    console.log('[Tasks] eventTabContent element found:', !!content);
    
    if (!content) {
        console.error('[Tasks] ✗ CRITICAL: Container not found!');
        return;
    }
    
    // Clear content and render new layout
    content.innerHTML = '';
    console.log('[Tasks] Content cleared');
    
    // Store event for tasks filtering
    window.currentEventTasks = {
        list: [],
        all: []
    };
    
    const htmlContent = `
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin: 0;">
        <!-- Header -->
        <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">Tasks</h2>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Manage and track event tasks.</p>
        </div>

        <!-- Controls Row -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; gap: 16px;">
          <!-- Left: View Toggle -->
          <div style="display: flex; gap: 2px; background: #f0f0f0; padding: 4px; border-radius: 8px;">
            <button id="eventTasksListBtn" onclick="switchEventTasksView('list')" style="padding: 8px 16px; background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%); color: white; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap; font-size: 14px; transition: all 0.2s ease;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">List</button>
            <button id="eventTasksCalendarBtn" onclick="switchEventTasksView('calendar')" style="padding: 8px 16px; background: white; color: #4b5563; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap; font-size: 14px; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='white'">Calendar</button>
          </div>
          
          <!-- Right: Add Task Button -->
          <button onclick="addEventTask('${event.event_id}')" style="padding: 8px 24px; background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%); color: white; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; white-space: nowrap; font-size: 14px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Add Task</button>
        </div>

        <!-- Tasks List View (Default) -->
        <div id="eventTasksListContent" style="overflow-x: auto; padding: 0;">
          <table style="width: 100%; font-size: 14px;">
            <thead style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <tr>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">DATE OF COMPLETION / DUE DATE</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">TASK</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">PARTY RESPONSIBLE</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">STATUS</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #4b5563; font-size: 12px;">REMARKS</th>
                <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #4b5563; font-size: 12px;">ACTIONS</th>
              </tr>
            </thead>
            <tbody id="eventTasksTableBody" style="border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td colspan="6" style="padding: 32px 16px; text-align: center; color: #6b7280;">Loading tasks...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tasks Calendar View -->
        <div id="eventTasksCalendarContent" style="padding: 24px; display: none;">
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
            <!-- Calendar Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <button onclick="previousEventTasksMonth()" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 8px;">←</button>
              <div style="text-align: center;">
                <div id="eventTasksCurrentMonth" style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 4px;">March 2026</div>
                <button onclick="goToEventTasksToday()" style="background: #f0f0f0; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; color: #4b5563;">Today</button>
              </div>
              <button onclick="nextEventTasksMonth()" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 8px;">→</button>
            </div>

            <!-- Calendar Grid -->
            <div style="margin-bottom: 20px;">
              <!-- Weekday Headers -->
              <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; margin-bottom: 8px;">
                <div style="text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; padding: 8px;">SUN</div>
                <div style="text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; padding: 8px;">MON</div>
                <div style="text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; padding: 8px;">TUE</div>
                <div style="text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; padding: 8px;">WED</div>
                <div style="text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; padding: 8px;">THU</div>
                <div style="text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; padding: 8px;">FRI</div>
                <div style="text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; padding: 8px;">SAT</div>
              </div>

              <!-- Calendar Days -->
              <div id="eventTasksCalendarDays" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e5e7eb; padding: 1px; border-radius: 4px;">
                <!-- Days will be populated by JavaScript -->
              </div>
            </div>

            <!-- Deadline Details Panel -->
            <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
              <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #111827;">Deadline Details</h4>
              <div id="eventTasksDeadlineDetails" style="font-size: 13px; color: #6b7280;">
                <p style="margin: 0;">No deadlines selected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    try {
        console.log('[Tasks] Setting HTML content, length:', htmlContent.length);
        content.innerHTML = htmlContent;
        console.log('[Tasks] ✓ HTML content set successfully');
        console.log('[Tasks] Content innerHTML length:', content.innerHTML.length);
        
        // Verify elements exist
        setTimeout(() => {
            const listBtn = document.getElementById('eventTasksListBtn');
            const calendarBtn = document.getElementById('eventTasksCalendarBtn');
            const tableBody = document.getElementById('eventTasksTableBody');
            console.log('[Tasks] Element verification:');
            console.log('  - List button found:', !!listBtn);
            console.log('  - Calendar button found:', !!calendarBtn);
            console.log('  - Table body found:', !!tableBody);
            if (listBtn && calendarBtn && tableBody) {
                console.log('[Tasks] ✓ New tasks layout rendered successfully');
                // Initialize to List view with gradient color
                switchEventTasksView('list');
                console.log('[Tasks] ✓ Initialized to List view with gradient');
            } else {
                console.error('[Tasks] ✗ New layout elements missing after render');
            }
        }, 100);
    } catch (error) {
        console.error('[Tasks] ✗ Error setting HTML:', error);
        content.innerHTML = '<p style="color: red;">Error rendering tasks: ' + error.message + '</p>';
    }
    
    // Load tasks data
    console.log('[Tasks] Calling loadEventTasks');
    loadEventTasks(event);
    console.log('═══════════════════════════════════════════');
}

// Load event tasks from API
async function loadEventTasks(event) {
    console.log('═══════════════════════════════════════════');
    console.log('[Tasks] LOADING TASKS DATA');
    console.log('[Tasks] Event ID:', event?.event_id);
    
    const tableBody = document.getElementById('eventTasksTableBody');
    
    console.log('[Tasks] Table body element found:', !!tableBody);
    
    if (!tableBody) {
        console.error('[Tasks] ✗ CRITICAL: Table body not found!');
        console.error('  - eventTasksTableBody:', document.getElementById('eventTasksTableBody'));
        return;
    }
    
    try {
        console.log('[Tasks] Fetching from API...');
        const url = `${API_BASE}/tasks.php?action=list&event_id=${event.event_id}`;
        console.log('[Tasks] URL:', url);
        
        const response = await fetch(url, {
            headers: getUserHeaders()
        });
        
        console.log('[Tasks] Response status:', response.status, response.ok);
        
        if (!response.ok) throw new Error('Failed to load tasks');
        const data = await response.json();
        
        console.log('[Tasks] API response received');
        console.log('[Tasks] Response structure:', {
            success: data.success,
            hasData: !!data.data,
            isArray: Array.isArray(data.data),
            length: data.data?.length
        });
        
        if (data.success && Array.isArray(data.data)) {
            // Initialize window.currentEventTasks if not already done
            if (!window.currentEventTasks) {
                window.currentEventTasks = { list: [], all: [] };
            }
            window.currentEventTasks.list = data.data;
            window.currentEventTasks.all = data.data;
            console.log('[Tasks] ✓ Loaded', data.data.length, 'tasks');
            
            // Render tasks table
            console.log('[Tasks] Rendering tasks table...');
            renderEventTasksTable(data.data, tableBody);
            console.log('[Tasks] ✓ Table rendered');
        } else {
            console.log('[Tasks] No tasks or invalid response structure');
            tableBody.innerHTML = '<tr style="border-bottom: 1px solid #e5e7eb;"><td colspan="6" style="padding: 32px 16px; text-align: center; color: #6b7280;">No tasks found.</td></tr>';
        }
        console.log('[Tasks] ✓ TASKS DATA LOADED SUCCESSFULLY');
    } catch (error) {
        console.error('[Tasks] ✗ Error loading tasks:', error);
        console.error('[Tasks] Error details:', error.message, error.stack);
        tableBody.innerHTML = `<tr style="border-bottom: 1px solid #e5e7eb;"><td colspan="6" style="padding: 32px 16px; text-align: center; color: #dc2626;">Error loading tasks: ${error.message}</td></tr>`;
    }
    console.log('═══════════════════════════════════════════');
}

// Render tasks table
function renderEventTasksTable(tasks, tableBody) {
    console.log('[Tasks] renderEventTasksTable called');
    console.log('  - Tasks count:', tasks?.length);
    console.log('  - Table body found:', !!tableBody);
    
    if (!tableBody) {
        console.error('[Tasks] ✗ Table body not provided!');
        return;
    }
    
    tableBody.innerHTML = '';
    console.log('[Tasks] Table cleared');
    
    if (!tasks || tasks.length === 0) {
        console.log('[Tasks] No tasks to render');
        tableBody.innerHTML = '<tr style="border-bottom: 1px solid #e5e7eb;"><td colspan="6" style="padding: 32px 16px; text-align: center; color: #6b7280;">No tasks found.</td></tr>';
        return;
    }
    
    console.log('[Tasks] Rendering', tasks.length, 'tasks...');
    tasks.forEach((task, idx) => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #d1d5db';
        
        // Format date
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '-';
        
        // Status badge styling - background and text color
        let statusStyle = '';
        let statusText = task.status || 'Pending';
        
        if (statusText === 'Done') {
            statusStyle = 'background: #dbeafe; color: #0369a1;';
        } else if (statusText === 'In Progress') {
            statusStyle = 'background: #fef3c7; color: #b45309;';
        } else {
            statusStyle = 'background: #e5e7eb; color: #6b7280;';
        }
        
        row.innerHTML = `
            <td style="padding: 12px 16px; color: #111827; font-size: 14px; word-break: break-word;">
                <input type="text" value="${dueDate}" readonly style="border: 1px solid #d1d5db; background: white; cursor: pointer; color: #111827; font-size: 14px; width: 120px; padding: 6px 8px; border-radius: 4px;" />
            </td>
            <td style="padding: 12px 16px; color: #111827; font-size: 14px; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(task.task_name || '-')}</td>
            <td style="padding: 12px 16px; color: #4b5563; font-size: 14px; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(task.party_responsible || '-')}</td>
            <td style="padding: 12px 16px; word-break: break-word;">
                <select onchange="updateEventTaskStatus(${task.task_id}, this.value)" style="padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; font-weight: 500; width: 130px; ${statusStyle} cursor: pointer;">
                    <option value="Pending" ${statusText === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${statusText === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Done" ${statusText === 'Done' ? 'selected' : ''}>Done</option>
                </select>
            </td>
            <td style="padding: 12px 16px; color: #4b5563; font-size: 14px; word-break: break-word; overflow-wrap: break-word;">${escapeHtml(task.remarks || '-')}</td>
            <td style="padding: 12px 16px; text-align: center; display: flex; gap: 4px; justify-content: center; align-items: center; height: 100%; min-height: 36px;">
                <button onclick="editEventTask(${task.task_id})" style="background: none; border: 1px solid #3b82f6; color: #3b82f6; width: 36px; height: 36px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;" onmouseover="this.style.background='#eff6ff'; this.style.borderColor='#1e40af'" onmouseout="this.style.background='none'; this.style.borderColor='#3b82f6'" title="Edit task">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g class="edit-outline"><g fill="currentColor" fill-rule="evenodd" class="Vector" clip-rule="evenodd"><path d="M2 6.857A4.857 4.857 0 0 1 6.857 2H12a1 1 0 1 1 0 2H6.857A2.857 2.857 0 0 0 4 6.857v10.286A2.857 2.857 0 0 0 6.857 20h10.286A2.857 2.857 0 0 0 20 17.143V12a1 1 0 1 1 2 0v5.143A4.857 4.857 0 0 1 17.143 22H6.857A4.857 4.857 0 0 1 2 17.143z"/><path d="m15.137 13.219l-2.205 1.33l-1.033-1.713l2.205-1.33l.003-.002a1.2 1.2 0 0 0 .232-.182l5.01-5.036a3 3 0 0 0 .145-.157c.331-.386.821-1.15.228-1.746c-.501-.504-1.219-.028-1.684.381a6 6 0 0 0-.36.345l-.034.034l-4.94 4.965a1.2 1.2 0 0 0-.27.41l-.824 2.073a.2.2 0 0 0 .29.245l1.032 1.713c-1.805 1.088-3.96-.74-3.18-2.698l.825-2.072a3.2 3.2 0 0 1 .71-1.081l4.939-4.966l.029-.029c.147-.15.641-.656 1.24-1.02c.327-.197.849-.458 1.494-.508c.74-.059 1.53.174 2.15.797a2.9 2.9 0 0 1 .845 1.75a3.15 3.15 0 0 1-.23 1.517c-.29.717-.774 1.244-.987 1.457l-5.01 5.036q-.28.281-.62.487m4.453-7.126s-.004.003-.013.006z"/></g></g></svg>
                </button>
                <button onclick="deleteEventTask(${task.task_id})" style="background: none; border: 1px solid #ef4444; color: #ef4444; width: 36px; height: 36px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;" onmouseover="this.style.background='#fee2e2'; this.style.borderColor='#dc2626'" onmouseout="this.style.background='none'; this.style.borderColor='#ef4444'" title="Delete task">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    console.log('[Tasks] ✓ All rows rendered in table');
}

// Switch between List and Calendar views
function switchEventTasksView(view) {
    console.log('[Tasks] Switching to view:', view);
    
    const listBtn = document.getElementById('eventTasksListBtn');
    const calendarBtn = document.getElementById('eventTasksCalendarBtn');
    const listContent = document.getElementById('eventTasksListContent');
    const calendarContent = document.getElementById('eventTasksCalendarContent');
    
    if (view === 'list') {
        // Show List button with gradient, Calendar button white
        if (listBtn) {
            listBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
            listBtn.style.color = 'white';
            listBtn.style.opacity = '1';
        }
        if (calendarBtn) {
            calendarBtn.style.background = 'white';
            calendarBtn.style.color = '#4b5563';
            calendarBtn.style.opacity = '1';
        }
        
        if (listContent) listContent.style.display = 'block';
        if (calendarContent) calendarContent.style.display = 'none';
        console.log('[Tasks] ✓ Switched to List view');
    } else if (view === 'calendar') {
        // Show Calendar button with gradient, List button white
        if (calendarBtn) {
            calendarBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
            calendarBtn.style.color = 'white';
            calendarBtn.style.opacity = '1';
        }
        if (listBtn) {
            listBtn.style.background = 'white';
            listBtn.style.color = '#4b5563';
            listBtn.style.opacity = '1';
        }
        
        if (listContent) listContent.style.display = 'none';
        if (calendarContent) calendarContent.style.display = 'block';
        
        // Render calendar
        renderEventTasksCalendar();
        console.log('[Tasks] ✓ Switched to Calendar view');
    }
}

// Initialize calendar state
let eventTasksCalendarState = {
    currentDate: new Date(),
    tasks: []
};

// Render the calendar
function renderEventTasksCalendar() {
    const currentMonth = eventTasksCalendarState.currentDate.getMonth();
    const currentYear = eventTasksCalendarState.currentDate.getFullYear();
    const tasks = window.currentEventTasks?.all || [];
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthDisplay = document.getElementById('eventTasksCurrentMonth');
    if (monthDisplay) {
        monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Create task map by date
    const tasksByDate = {};
    tasks.forEach(task => {
        if (task.due_date) {
            const taskDate = new Date(task.due_date);
            if (taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear) {
                const day = taskDate.getDate();
                if (!tasksByDate[day]) {
                    tasksByDate[day] = [];
                }
                tasksByDate[day].push(task);
            }
        }
    });
    
    // Render calendar days
    const calendarDays = document.getElementById('eventTasksCalendarDays');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = '';
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.style.background = '#ffffff';
        emptyCell.style.height = '120px';
        calendarDays.appendChild(emptyCell);
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.style.background = '#ffffff';
        dayCell.style.height = '120px';
        dayCell.style.padding = '8px';
        dayCell.style.cursor = 'pointer';
        dayCell.style.borderRadius = '4px';
        dayCell.style.position = 'relative';
        dayCell.style.overflow = 'hidden';
        dayCell.style.display = 'flex';
        dayCell.style.flexDirection = 'column';
        dayCell.style.boxSizing = 'border-box';
        
        // Check if today
        const today = new Date();
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayCell.style.background = '#dbeafe';
            dayCell.style.borderLeft = '3px solid #0369a1';
        }
        
        // Day number
        const dayNum = document.createElement('div');
        dayNum.textContent = day;
        dayNum.style.fontWeight = '600';
        dayNum.style.color = '#111827';
        dayNum.style.marginBottom = '4px';
        dayNum.style.fontSize = '14px';
        dayNum.style.flexShrink = '0';
        dayCell.appendChild(dayNum);
        
        // Tasks for this day
        const dayTasks = tasksByDate[day] || [];
        if (dayTasks.length > 0) {
            const tasksContainer = document.createElement('div');
            tasksContainer.style.fontSize = '11px';
            tasksContainer.style.overflow = 'hidden';
            tasksContainer.style.flex = '1';
            tasksContainer.style.display = 'flex';
            tasksContainer.style.flexDirection = 'column';
            tasksContainer.style.minHeight = '0';
            
            dayTasks.slice(0, 2).forEach(task => {
                const taskElement = document.createElement('div');
                const truncatedName = task.task_name.length > 10 ? task.task_name.substring(0, 10) + '...' : task.task_name;
                taskElement.textContent = truncatedName;
                taskElement.style.background = '#fef3c7';
                taskElement.style.color = '#78350f';
                taskElement.style.padding = '2px 4px';
                taskElement.style.borderRadius = '2px';
                taskElement.style.marginBottom = '2px';
                taskElement.style.whiteSpace = 'nowrap';
                taskElement.style.overflow = 'hidden';
                taskElement.style.textOverflow = 'ellipsis';
                taskElement.style.fontWeight = '500';
                taskElement.style.maxWidth = '100%';
                taskElement.style.flexShrink = '0';
                tasksContainer.appendChild(taskElement);
            });
            
            if (dayTasks.length > 2) {
                const moreElement = document.createElement('div');
                moreElement.textContent = `+${dayTasks.length - 2} more`;
                moreElement.style.fontSize = '10px';
                moreElement.style.color = '#6b7280';
                moreElement.style.whiteSpace = 'nowrap';
                moreElement.style.overflow = 'hidden';
                moreElement.style.textOverflow = 'ellipsis';
                moreElement.style.flexShrink = '0';
                tasksContainer.appendChild(moreElement);
            }
            
            dayCell.appendChild(tasksContainer);
        }
        
        // Click handler to show details
        dayCell.onclick = () => showEventTasksDayDetails(day, dayTasks);
        
        calendarDays.appendChild(dayCell);
    }
}

// Show deadline details for selected day
function showEventTasksDayDetails(day, tasks) {
    const detailsPanel = document.getElementById('eventTasksDeadlineDetails');
    if (!detailsPanel) return;
    
    if (tasks.length === 0) {
        detailsPanel.innerHTML = '<p style="margin: 0; color: #6b7280;">No tasks on this day</p>';
        return;
    }
    
    let html = `<p style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">${tasks.length} task${tasks.length > 1 ? 's' : ''} found</p>`;
    
    tasks.forEach(task => {
        html += `
            <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e5e7eb;">
                <div style="font-weight: 600; color: #111827; font-size: 14px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">${escapeHtml(task.task_name)}</div>
                <div style="color: #6b7280; font-size: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">
                    <strong>Due:</strong> ${task.due_date || '-'}
                </div>
                <div style="color: #6b7280; font-size: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">
                    <strong>Responsible:</strong> ${escapeHtml(task.party_responsible || '-')}
                </div>
                <div style="color: #6b7280; font-size: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px;">
                    <strong>Status:</strong> ${task.status}
                </div>
                <div style="color: #6b7280; font-size: 12px;">
                    <strong>Remarks:</strong> ${task.remarks ? escapeHtml(task.remarks) : '-'}
                </div>
            </div>
        `;
    });
    
    detailsPanel.innerHTML = html;
}

// Navigate to previous month
function previousEventTasksMonth() {
    eventTasksCalendarState.currentDate.setMonth(eventTasksCalendarState.currentDate.getMonth() - 1);
    renderEventTasksCalendar();
}

// Navigate to next month
function nextEventTasksMonth() {
    eventTasksCalendarState.currentDate.setMonth(eventTasksCalendarState.currentDate.getMonth() + 1);
    renderEventTasksCalendar();
}

// Go to today
function goToEventTasksToday() {
    eventTasksCalendarState.currentDate = new Date();
    renderEventTasksCalendar();
}

// Add new task (placeholder)
function addEventTask(eventId) {
    console.log('[Tasks] Add task for event:', eventId);
    showNotification('Add task feature coming soon', 'info');
}

// Update task status
async function updateEventTaskStatus(taskId, newStatus) {
    console.log('[Tasks] Updating task', taskId, 'status to:', newStatus);
    
    // Store values globally for modal submission
    window.pendingTaskStatusUpdate = {
        taskId: taskId,
        newStatus: newStatus
    };
    
    // Show modal for remarks
    const modal = document.getElementById('taskStatusRemarksModal');
    const statusDisplay = document.getElementById('modalStatusDisplay');
    const remarksInput = document.getElementById('taskRemarksInput');
    
    if (modal && statusDisplay && remarksInput) {
        statusDisplay.textContent = newStatus;
        remarksInput.value = '';
        remarksInput.focus();
        modal.style.display = 'flex';
    }
}

// Delete task
async function deleteEventTask(taskId) {
    console.log('[Tasks] Deleting task:', taskId);
    
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/tasks.php?action=delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getUserHeaders()
            },
            body: JSON.stringify({
                task_id: taskId
            })
        });
        
        if (response.ok) {
            console.log('[Tasks] ✓ Task deleted');
            // Reload tasks
            if (window.currentEventDetails) {
                loadEventTasks(window.currentEventDetails);
            }
            showNotification('Task deleted successfully', 'success');
        }
    } catch (error) {
        console.error('[Tasks] Error deleting task:', error);
        showNotification('Error deleting task', 'error');
    }
}

// Edit task
async function editEventTask(taskId) {
    console.log('[Tasks] Editing task:', taskId);
    
    try {
        // Fetch task details
        const response = await fetch(`${API_BASE}/tasks.php?action=get&task_id=${taskId}`, {
            headers: getUserHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch task');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            const task = data.data;
            
            // Populate form fields
            document.getElementById('taskDueDate').value = task.due_date ? task.due_date.split(' ')[0] : '';
            document.getElementById('taskName').value = task.task_name || '';
            document.getElementById('taskResponsible').value = task.party_responsible || '';
            document.getElementById('taskStatus').value = task.status || 'Pending';
            document.getElementById('taskRemarks').value = task.remarks || '';
            
            // Store task ID for update
            window.editingTaskId = taskId;
            
            // Change modal title and button
            const modal = document.getElementById('addTaskModal');
            const heading = modal.querySelector('.text-2xl');
            const submitBtn = document.querySelector('#addTaskForm button[type="submit"]');
            
            heading.textContent = 'Edit Task';
            submitBtn.textContent = 'Update';
            
            // Open modal
            modal.classList.add('active');
            console.log('[Tasks] ✓ Task loaded for editing');
        } else {
            showNotification('Failed to load task details', 'error');
        }
    } catch (error) {
        console.error('[Tasks] Error editing task:', error);
        showNotification('Error loading task: ' + error.message, 'error');
    }
}

// Modal functions for task status remarks
function closeTaskStatusRemarksModal() {
    const modal = document.getElementById('taskStatusRemarksModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.pendingTaskStatusUpdate = null;
}

async function submitTaskStatusRemarksModal() {
    const remarksInput = document.getElementById('taskRemarksInput');
    const remarks = remarksInput ? remarksInput.value : '';
    
    if (!window.pendingTaskStatusUpdate) {
        console.error('[Tasks] No pending task status update');
        showNotification('Error: No task update in progress', 'error');
        return;
    }
    
    const { taskId, newStatus } = window.pendingTaskStatusUpdate;
    
    try {
        const response = await fetch(`${API_BASE}/tasks.php?action=update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getUserHeaders()
            },
            body: JSON.stringify({
                task_id: taskId,
                status: newStatus,
                remarks: remarks
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('[Tasks] ✓ Task status updated');
            showNotification(`Task status changed to "${newStatus}"`, 'success');
            
            // Close modal
            closeTaskStatusRemarksModal();
            
            // Reload tasks table to show updated data
            if (window.currentEventData) {
                loadEventTasks(window.currentEventData);
            }
        } else {
            console.error('[Tasks] Error:', data.message);
            showNotification('Error updating task: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('[Tasks] Error updating status:', error);
        showNotification('Error updating task status', 'error');
    }
}

function openCreateEventModal() {
    console.log('Opening create event modal');
    
    // Check if user is a coordinator - they cannot create events
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userRole = userInfo.role || userInfo.role_name || 'GUEST';
    
    if (userRole === 'COORDINATOR' || userRole === 'coordinator') {
        showNotification('Only admins can create events. You can only manage assigned events.', 'warning');
        return;
    }
    
    const modal = document.getElementById('createEventModal');
    if (modal) {
        // Reset form with safe chaining
        document.getElementById('createEventForm')?.reset();
        document.getElementById('createEventPrivateCode')?.value || '';
        document.getElementById('createPrivateCodeDisplay')?.style && (document.getElementById('createPrivateCodeDisplay').style.display = 'none');
        document.getElementById('eventDepartment')?.value || '';
        
        // Load coordinators if function exists
        if (typeof loadCoordinatorsDropdown === 'function') {
            loadCoordinatorsDropdown('eventCoordinator');
        }
        
        // Add active class to show modal
        modal.classList.add('active');
        console.log('Modal opened');
    } else {
        console.error('createEventModal not found');
    }
}

function closeCreateEventModal() {
    console.log('Closing create event modal');
    const modal = document.getElementById('createEventModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal closed');
    }
}

function submitCreateEventForm(e) {
    console.log('=== CREATE EVENT CALLED ===');
    
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    
    const formEl = document.getElementById('createEventForm');
    if (!formEl) {
        console.error('✗ ERROR: createEventForm not found!');
        showNotification('Form not found', 'error');
        return false;
    }
    
    // Use FormData to get actual form input values (bypasses duplicate ID issues)
    const formData = new FormData(formEl);
    
    const eventName = (formData.get('event_name') || '').trim();
    const capacity = (formData.get('capacity') || '').trim();
    const startEvent = (formData.get('start_event') || '').trim();
    const endEvent = (formData.get('end_event') || '').trim();
    const eventLocation = (formData.get('location') || '').trim();
    const eventDescription = (formData.get('description') || '').trim();
    
    console.log('✓ Form values from FormData:', {
        eventName,
        capacity,
        startEvent,
        endEvent,
        eventLocation,
        eventDescription
    });
    
    // Validate required fields with specific error messages
    const missingFields = [];
    const requiredFields = [
        { name: 'event_name', label: 'Event Title', value: eventName },
        { name: 'capacity', label: 'Capacity', value: capacity },
        { name: 'start_event', label: 'Start Event', value: startEvent },
        { name: 'end_event', label: 'End Event', value: endEvent },
        { name: 'location', label: 'Location', value: eventLocation }
    ];
    
    // Check for missing fields
    requiredFields.forEach(field => {
        console.log(`Checking ${field.label}: value="${field.value}" (empty: ${!field.value})`);
        if (!field.value) {
            missingFields.push(field.label);
        }
    });
    
    if (missingFields.length > 0) {
        const fieldList = missingFields.join(', ');
        showNotification(`Missing required fields: ${fieldList}`, 'error');
        console.warn('✗ Missing fields:', missingFields);
        return false;
    }
    
    console.log('✓ All required fields present');
    
    if (isNaN(parseInt(capacity)) || parseInt(capacity) < 1) {
        showNotification('Capacity must be a valid number greater than 0', 'error');
        return false;
    }
    
    // Validate that end date/time is after start date/time
    const startDateTime = new Date(startEvent);
    const endDateTime = new Date(endEvent);
    
    if (endDateTime <= startDateTime) {
        showNotification('End Event must be after Start Event', 'error');
        return false;
    }
    
    console.log('✓ All validations passed, preparing form data...');
    
    // Create fresh FormData with validated values
    const finalFormData = new FormData(formEl);
    
    // Format datetime-local values for database (2026-03-01T14:30 -> 2026-03-01 14:30:00)
    const startFormatted = startEvent.replace('T', ' ') + ':00';
    const endFormatted = endEvent.replace('T', ' ') + ':00';
    
    // Set formatted datetime values
    finalFormData.set('start_event', startFormatted);
    finalFormData.set('end_event', endFormatted);
    
    console.log('✓ FormData prepared:', {
        event_name: finalFormData.get('event_name'),
        description: finalFormData.get('description'),
        location: finalFormData.get('location'),
        capacity: finalFormData.get('capacity'),
        start_event: finalFormData.get('start_event'),
        end_event: finalFormData.get('end_event')
    });
    
    // Also extract date and times for optional legacy fields
    const eventDate = startEvent.split('T')[0];
    const startTime = startEvent.split('T')[1] + ':00';
    const endTime = endEvent.split('T')[1] + ':00';
    formData.set('event_date', eventDate);
    formData.set('start_time', startTime);
    formData.set('end_time', endTime);
    
    // Add registration period fields if provided
    const registrationStart = document.getElementById('registrationStart')?.value?.trim();
    const registrationEnd = document.getElementById('registrationEnd')?.value?.trim();
    if (registrationStart && registrationEnd) {
        // Validate registration period
        const regStartDate = new Date(registrationStart);
        const regEndDate = new Date(registrationEnd);
        
        if (regEndDate <= regStartDate) {
            showNotification('Registration close time must be after open time', 'error');
            return false;
        }
        
        const registrationStartFormatted = registrationStart.replace('T', ' ') + ':00';
        const registrationEndFormatted = registrationEnd.replace('T', ' ') + ':00';
        finalFormData.set('registration_start', registrationStartFormatted);
        finalFormData.set('registration_end', registrationEndFormatted);
    }
    
    const isPrivateCheckbox = document.getElementById('createEventPrivate');
    const isPrivate = isPrivateCheckbox && isPrivateCheckbox.checked ? 1 : 0;
    finalFormData.set('is_private', isPrivate);
    
    if (isPrivate) {
        const privateCode = document.getElementById('createEventPrivateCode')?.value;
        if (privateCode) finalFormData.append('private_code', privateCode);
    }
    
    console.log('✓ Sending event creation request...');
    fetch(`${API_BASE}/events.php`, {
        method: 'POST',
        body: finalFormData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('✓ Event created successfully:', data);
            logActivity('CREATE', `Created new event: ${eventName}`);
            closeCreateEventModal();
            formEl.reset();
            loadEvents();
            showNotification(`Event "${eventName}" created successfully!`, 'success');
            
            // Auto-fetch and display the newly created event in Event Details
            if (data.event_id) {
                console.log(`📋 Loading newly created event ID: ${data.event_id}`);
                setTimeout(() => {
                    viewEventDetails(data.event_id);
                }, 500);
            }
        } else {
            console.error('✗ API Error:', data);
            showNotification(data.message || 'Error creating event', 'error');
        }
    })
    .catch(error => {
        console.error('✗ Fetch error:', error);
        showNotification('Error creating event: ' + error.message, 'error');
    });
    
    return false;
}

function openEditEventModal(eventId) {
    console.log('=== OPEN EDIT EVENT MODAL ===');
    
    loadCoordinatorsDropdown('editEventCoordinator');
    
    fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const event = data.data;
                
                document.getElementById('editEventId').value = event.event_id;
                document.getElementById('editEventName').value = event.event_name;
                document.getElementById('editEventCapacity').value = event.capacity;
                document.getElementById('editEventDate').value = event.event_date;
                document.getElementById('editEventStartTime').value = event.start_time || '';
                document.getElementById('editEventEndTime').value = event.end_time || '';
                document.getElementById('editEventLocation').value = (event.location && event.location !== 'undefined' && event.location !== 'null') ? event.location : '';
                document.getElementById('editEventDepartment').value = event.department || '';
                document.getElementById('editEventCoordinator').value = event.coordinator_id || '';
                document.getElementById('editEventDescription').value = event.description || '';
                document.getElementById('editEventPrivate').checked = event.is_private == 1;
                
                if (event.is_private == 1 && event.access_code) {
                    document.getElementById('editEventPrivateCode').value = event.access_code;
                    document.getElementById('editPrivateCodeDisplay').style.display = 'block';
                } else {
                    document.getElementById('editEventPrivateCode').value = '';
                    document.getElementById('editPrivateCodeDisplay').style.display = 'none';
                }
                
                document.getElementById('editEventImage').value = '';
                
                const currentImageDiv = document.getElementById('editCurrentImage');
                const currentImageUrl = getImageUrl(event.image_url);
                if (currentImageUrl) {
                    currentImageDiv.innerHTML = `
                        <div style="padding: 10px; background: #f0f0f0; border-radius: 4px;">
                            <p style="margin: 0 0 8px 0; font-weight: bold;">Current Image:</p>
                            <img src="${currentImageUrl}" alt="${event.event_name}" style="max-width: 100%; max-height: 150px; border-radius: 4px;">
                        </div>
                    `;
                } else {
                    currentImageDiv.innerHTML = '<p style="color: #999; font-size: 12px;">No image selected</p>';
                }
                
                document.getElementById('editEventModal').style.display = 'block';
            } else {
                showNotification('Failed to load event details', 'error');
            }
        })
        .catch(error => {
            console.error('✗ Fetch error:', error);
            showNotification('Error loading event', 'error');
        });
}

function closeEditEventModal() {
    document.getElementById('editEventModal').style.display = 'none';
}

function updateEvent(e) {
    console.log('=== UPDATE EVENT CALLED ===');
    
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    
    const eventId = document.getElementById('editEventId').value;
    const eventName = document.getElementById('editEventName').value;
    const capacity = document.getElementById('editEventCapacity').value;
    const eventDate = document.getElementById('editEventDate').value;
    
    if (!eventName || !capacity || !eventDate) {
        showNotification('Please fill in all required fields', 'error');
        return false;
    }
    
    const formData = new FormData();
    formData.append('event_id', eventId);
    formData.append('event_name', eventName);
    formData.append('capacity', capacity);
    formData.append('event_date', eventDate);
    formData.append('start_time', document.getElementById('editEventStartTime').value || '');
    formData.append('end_time', document.getElementById('editEventEndTime').value || '');
    formData.append('location', document.getElementById('editEventLocation').value || '');
    formData.append('department', document.getElementById('editEventDepartment').value || '');
    formData.append('coordinator_id', document.getElementById('editEventCoordinator').value || '');
    formData.append('description', document.getElementById('editEventDescription').value || '');
    const isPrivate = document.getElementById('editEventPrivate').checked ? 1 : 0;
    formData.append('is_private', isPrivate);
    
    const imageFile = document.getElementById('editEventImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    fetch(`${API_BASE}/events.php`, {
        method: 'PUT',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            logActivity('UPDATE', `Updated event: ${eventName}`);
            closeEditEventModal();
            loadEvents();
        } else {
            showNotification(data.message || 'Error updating event', 'error');
        }
    })
    .catch(error => {
        console.error('✗ Fetch error:', error);
        showNotification('Error updating event: ' + error.message, 'error');
    });
    
    return false;
}

function deleteEvent(eventId, eventName) {
    if (!eventId) {
        showNotification('Invalid event ID', 'error');
        return false;
    }

    showConfirmation(
        'Delete Event?',
        `Are you sure you want to delete "${eventName}"? This action cannot be undone.`,
        'Delete',
        function() {
            performDeleteEvent(eventId, eventName);
        }
    );
    
    return false;
}

function performDeleteEvent(eventId, eventName) {
    fetch(`${API_BASE}/events.php`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            event_id: eventId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            logActivity('DELETE', `Deleted event: ${eventName}`);
            loadEvents();
        } else {
            showNotification(data.message || 'Error deleting event', 'error');
        }
    })
    .catch(error => {
        console.error('✗ Fetch error:', error);
        showNotification('Error deleting event: ' + error.message, 'error');
    });
}

function loadCoordinatorsDropdown(selectId) {
    const coordinatorSelect = document.getElementById(selectId);
    if (!coordinatorSelect) {
        console.error('✗ Coordinator select element not found:', selectId);
        return;
    }
    
    fetch(`${API_BASE}/coordinators.php?action=list`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.data && data.data.length > 0) {
                const currentValue = coordinatorSelect.value;
                const options = Array.from(coordinatorSelect.options);
                const firstOption = options[0];
                coordinatorSelect.innerHTML = '';
                if (firstOption) {
                    coordinatorSelect.appendChild(firstOption.cloneNode(true));
                }
                
                data.data.forEach(coordinator => {
                    const option = document.createElement('option');
                    option.value = coordinator.coordinator_id;
                    option.textContent = coordinator.coordinator_name;
                    coordinatorSelect.appendChild(option);
                });
                
                if (currentValue) {
                    coordinatorSelect.value = currentValue;
                }
                
                coordinatorSelect.disabled = false;
            } else {
                coordinatorSelect.innerHTML = '<option value="">Coordinators not available</option>';
                coordinatorSelect.disabled = true;
            }
        })
        .catch(error => {
            console.error('✗ Error loading coordinators:', error);
            coordinatorSelect.innerHTML = '<option value="">Coordinators feature not available yet</option>';
            coordinatorSelect.disabled = true;
        });
}

//================================================================================
// REMAINING SECTIONS PLACEHOLDER
// (CALENDAR, PARTICIPANTS, REPORTS, QR SCANNER, USERS MANAGEMENT, LOGS, CATALOGUE, 
// EVENT DETAILS PAGE, TASKS, ATTENDEES, COORDINATORS MANAGEMENT)
// ================================================================================

// These sections are extensive and will be added in continuation.
// For now, stub functions prevent errors.

// ================================================================================
// CALENDAR FUNCTIONS
// ================================================================================

let calendarCurrentDate = new Date();
let calendarCurrentMonth = new Date().getMonth();
let calendarCurrentYear = new Date().getFullYear();
let allEventsForCalendar = [];
let allTasksForCalendar = [];
let allEmailsForCalendar = [];
let allLogisticsForCalendar = [];
let calendarSelectedDate = new Date();
let calendarCurrentView = 'month'; // 'month' or 'list'

// Helper function to generate status badge SVG based on task status
function getStatusBadgeSVG(status) {
    const statusNorm = (status || 'Pending').toLowerCase();
    
    if (statusNorm === 'pending') {
        // Broken/dashed circle for pending (gray color)
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; margin-right: 4px;">
            <circle cx="12" cy="12" r="10" stroke="#4b5563" stroke-width="2" stroke-dasharray="4 3" fill="none"/>
        </svg>`;
    } else if (statusNorm === 'in progress') {
        // Half-filled circle for in progress (right half filled)
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; margin-right: 4px;">
            <circle cx="12" cy="12" r="10" stroke="#60a5fa" stroke-width="1.5" fill="none"/>
            <path d="M 12 2 A 10 10 0 0 1 12 22 L 12 12 Z" fill="#60a5fa"/>
        </svg>`;
    } else if (statusNorm === 'done') {
        // Filled green circle with white checkmark for done
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; margin-right: 4px;">
            <circle cx="12" cy="12" r="11" fill="#10b981" stroke="#059669" stroke-width="1"/>
            <path d="M 7 12.5 L 10.5 16 L 17 9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
    }
    
    // Default: pending
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; margin-right: 4px;">
        <circle cx="12" cy="12" r="10" stroke="#4b5563" stroke-width="2" stroke-dasharray="4 3" fill="none"/>
    </svg>`;
}

function loadCalendar() {
    console.log('📅 Loading calendar for', calendarCurrentMonth + 1, '/', calendarCurrentYear);
    console.log('🔗 API URLs:', `${API_BASE}/events.php?action=list_all`, `${API_BASE}/events.php?action=list_all_tasks`);
    
    // Clear any eventId or id parameters from URL so they don't persist on reload
    const url = new URL(window.location);
    url.searchParams.delete('eventId');
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url);
    
    // Fetch both events and tasks in parallel
    Promise.all([
        // Fetch all events from API
        fetch(`${API_BASE}/events.php?action=list_all`, {
            headers: getUserHeaders()
        })
        .then(response => {
            console.log('📡 Events API Response status:', response.status);
            return response.json();
        }),
        
        // Fetch all tasks from dedicated tasks-calendar API
        fetch(`${API_BASE}/tasks-calendar.php?action=list_all`, {
            headers: getUserHeaders()
        })
        .then(response => {
            console.log('📡 Tasks API Response status:', response.status);
            return response.json();
        })
        .catch(error => {
            console.warn('⚠️ Tasks API not available, continuing with events only:', error);
            return { success: true, data: [] };
        }),
        
        // Fetch all emails from email-calendar API
        fetch(`${API_BASE}/email-calendar.php?action=list_all`, {
            headers: getUserHeaders()
        })
        .then(response => {
            console.log('📡 Email-Calendar API Response status:', response.status);
            return response.json();
        })
        .catch(error => {
            console.warn('⚠️ Email-Calendar API not available, continuing without emails:', error);
            return { success: true, data: [] };
        }),
        
        // Fetch all logistics from logistics API
        fetch(`${API_BASE}/logistics.php?action=list_all`, {
            headers: getUserHeaders()
        })
        .then(response => {
            console.log('📡 Logistics API Response status:', response.status);
            return response.json();
        })
        .catch(error => {
            console.warn('⚠️ Logistics API not available, continuing without logistics:', error);
            return { success: true, data: [] };
        })
    ])
    .then(([eventsData, tasksData, emailsData, logisticsData]) => {
        console.log('📥 Events API Response data:', eventsData);
        console.log('📥 Tasks API Response data:', tasksData);
        console.log('📥 Emails API Response data:', emailsData);
        
        if (eventsData.success && eventsData.data) {
            allEventsForCalendar = eventsData.data || [];
            window.allEventsForCalendar = allEventsForCalendar;  // Store on window for modal access
            console.log('✅ Loaded', allEventsForCalendar.length, 'events for calendar');
            console.log('📋 Events array:', allEventsForCalendar);
        } else {
            console.warn('❌ Failed to load calendar events:', eventsData.message);
            allEventsForCalendar = [];
        }
        
        if (tasksData.success && tasksData.data) {
            allTasksForCalendar = tasksData.data || [];
            window.allTasksForCalendar = allTasksForCalendar;  // Store on window for modal access
            console.log('✅ Loaded', allTasksForCalendar.length, 'tasks for calendar');
            console.log('📋 Tasks array:', allTasksForCalendar);
        } else {
            console.warn('⚠️ No tasks loaded:', tasksData.message);
            allTasksForCalendar = [];
        }
        
        if (emailsData.success && emailsData.data) {
            allEmailsForCalendar = emailsData.data || [];
            window.allEmailsForCalendar = allEmailsForCalendar;  // Store on window for modal access
            console.log('✅ Loaded', allEmailsForCalendar.length, 'emails for calendar');
            console.log('📧 Emails array:', allEmailsForCalendar);
        } else {
            console.warn('⚠️ No emails loaded:', emailsData.message);
            allEmailsForCalendar = [];
        }
        
        if (logisticsData.success && logisticsData.data) {
            allLogisticsForCalendar = logisticsData.data || [];
            window.allLogisticsForCalendar = allLogisticsForCalendar;  // Store on window for modal access
            console.log('✅ Loaded', allLogisticsForCalendar.length, 'logistics for calendar');
            console.log('📦 Logistics array:', allLogisticsForCalendar);
        } else {
            console.warn('⚠️ No logistics loaded:', logisticsData.message);
            allLogisticsForCalendar = [];
        }
        
        renderCalendarMonth();
        
        // Automatically show today's events, tasks, emails, and logistics in Deadline Details
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayEvents = allEventsForCalendar.filter(event => event.event_date === todayStr);
        const todayTasks = allTasksForCalendar.filter(task => task.event_date === todayStr);
        const todayEmails = allEmailsForCalendar.filter(email => email.event_date === todayStr);
        const todayLogistics = allLogisticsForCalendar.filter(log => log.event_date === todayStr);
        const todayItems = [...todayEvents, ...todayTasks, ...todayEmails, ...todayLogistics];
        
        if (todayItems.length > 0) {
            console.log(`🎯 Found ${todayItems.length} item(s) for today (${todayStr})`);
            updateDeadlineDetails(todayItems);
        } else {
            console.log(`📅 No items found for today (${todayStr})`);
            updateDeadlineDetails([]);
        }
    })
    .catch(error => {
        console.error('❌ Error loading calendar:', error);
        allEventsForCalendar = [];
        allTasksForCalendar = [];
        allEmailsForCalendar = [];
        renderCalendarMonth();
        updateDeadlineDetails([]);
    });
}

function renderCalendarMonth() {
    const year = calendarCurrentYear;
    const month = calendarCurrentMonth;
    
    console.log(`🎨 Rendering calendar for ${year}-${String(month + 1).padStart(2, '0')}`);
    console.log(`📊 Total events in cache: ${allEventsForCalendar.length}`);
    
    // Get first day and days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarDateRange').textContent = `${monthNames[month]} ${year}`;
    
    // Get grid container
    const grid = document.getElementById('calendarGrid');
    
    // Remove existing days (keep headers)
    const dayHeaders = grid.querySelectorAll('.day-header');
    while (grid.children.length > 7) {
        grid.removeChild(grid.lastChild);
    }
    
    // Add previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = createCalendarDayElement(day, dateStr, 'prev-month');
        grid.appendChild(dayEl);
    }
    
    // Add current month's days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = createCalendarDayElement(day, dateStr, 'current-month');
        grid.appendChild(dayEl);
    }
    
    // Add next month's days
    const totalCells = 35 - (firstDay - 1 + daysInMonth);
    for (let day = 1; day <= totalCells; day++) {
        const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = createCalendarDayElement(day, dateStr, 'next-month');
        grid.appendChild(dayEl);
    }
    
    console.log('✓ Calendar month rendered');
}

function createCalendarDayElement(day, dateStr, monthType) {
    const dayEl = document.createElement('div');
    dayEl.setAttribute('data-date', dateStr);
    dayEl.className = 'calendar-day';
    
    // Parse date
    const [year, month, date] = dateStr.split('-').map(Number);
    const cellDate = new Date(year, month - 1, date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Base styles
    let bgColor = '#fff';
    let borderColor = '#e5e7eb';
    let textColor = '#333';
    
    if (monthType === 'prev-month' || monthType === 'next-month') {
        bgColor = '#f9fafb';
        textColor = '#ccc';
    }
    
    // Highlight today
    if (monthType === 'current-month' && cellDate.getTime() === today.getTime()) {
        bgColor = '#dbeafe';
        borderColor = '#0284c7';
    }
    
    dayEl.style.cssText = `
        background: ${bgColor};
        border: 1px solid ${borderColor};
        padding: 8px;
        min-height: 80px;
        cursor: ${monthType === 'current-month' ? 'pointer' : 'default'};
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        color: ${textColor};
    `;
    
    // Add day number
    const dayNum = document.createElement('div');
    dayNum.style.cssText = 'font-weight: 600; font-size: 14px; margin-bottom: 4px;';
    dayNum.textContent = day;
    dayEl.appendChild(dayNum);
    
    // Get events, tasks, and emails for this day
    const dayItems = getEventsForDate(dateStr);
    console.log(`📅 Date ${dateStr}: Found ${dayItems.length} items (events, tasks & emails)`);
    
    // Separate events, tasks, and emails
    const dayEvents = dayItems.filter(item => item.event_name && !item.task_id && !item.email_id);
    const dayTasks = dayItems.filter(item => item.task_id);
    const dayEmails = dayItems.filter(item => item.email_id);
    
    // Add event/task/email display
    if (dayItems.length > 0) {
        const indicatorContainer = document.createElement('div');
        indicatorContainer.style.cssText = 'display: flex; flex-direction: column; gap: 3px; margin-top: 4px; flex: 1;';
        
        dayItems.slice(0, 2).forEach((item, idx) => {
            const itemElement = document.createElement('div');
            
            // Determine if it's a task, email, logistics, or event and apply appropriate styling
            const isTask = item.task_id;
            const isEmail = item.email_id;
            const isLogistics = item.logistics_id;
            const itemName = isTask ? item.task_name : (isEmail ? item.email_blast_name : (isLogistics ? item.item : (item.event_name || item.event_title || 'Untitled Event')));
            
            if (isTask || isEmail || isLogistics) {
                // Task/Email/Logistics styling - same appearance with status badge and word wrapping
                // Check if item is overdue and needs red highlighting
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const itemDate = new Date(item.event_date);
                itemDate.setHours(0, 0, 0, 0);
                const isOverdue = itemDate < today;
                
                // Determine if should show as red (overdue + specific status conditions)
                let isRedAlert = false;
                if (isEmail && isOverdue && item.status === 'Draft') {
                    isRedAlert = true;
                } else if (isTask && isOverdue && (item.status === 'Pending' || item.status === 'In Progress')) {
                    isRedAlert = true;
                }
                
                const bgColor = isRedAlert ? '#fee2e2' : '#f3f4f6';
                const textColor = isRedAlert ? '#991b1b' : '#6b7280';
                const borderColor = isRedAlert ? '#dc2626' : '#d1d5db';
                
                itemElement.style.cssText = `
                    font-size: 10px;
                    padding: 2px 4px;
                    background: ${bgColor};
                    color: ${textColor};
                    border-radius: 3px;
                    border-left: 2px solid ${borderColor};
                    overflow: hidden;
                    font-weight: 600;
                    display: flex;
                    align-items: flex-start;
                    gap: 2px;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    max-height: 30px;
                    line-height: 1.2;
                `;
                console.log(`  ├─ ${isTask ? 'Task' : (isEmail ? 'Email' : 'Logistics')} ${idx + 1}: "${itemName}"`);
                // Create a small SVG badge for the status
                const svgBadge = document.createElement('span');
                if (isTask) {
                    svgBadge.innerHTML = '<i class="bi bi-check2-square"></i>';
                } else if (isEmail) {
                    // For email, use mail icon
                    svgBadge.innerHTML = '<i class="bi bi-envelope"></i>';
                } else if (isLogistics) {
                    // For logistics, use box icon
                    svgBadge.innerHTML = '<i class="bi bi-box"></i>';
                }
                svgBadge.style.display = 'flex';
                svgBadge.style.alignItems = 'center';
                svgBadge.style.flexShrink = 0;
                svgBadge.style.marginTop = '1px';
                // Set SVG size to fit calendar cell
                const svg = svgBadge.querySelector('svg');
                if (svg) {
                    svg.setAttribute('width', '12');
                    svg.setAttribute('height', '12');
                }
                
                const textSpan = document.createElement('span');
                textSpan.textContent = escapeHtml(itemName.substring(0, 18));
                textSpan.style.wordWrap = 'break-word';
                textSpan.style.overflowWrap = 'break-word';
                textSpan.style.wordBreak = 'break-word';
                
                itemElement.appendChild(svgBadge);
                itemElement.appendChild(textSpan);
            } else {
                itemElement.style.cssText = `
                    font-size: 10px;
                    padding: 2px 4px;
                    background: #e3f2fd;
                    color: #1976d2;
                    border-radius: 3px;
                    border-left: 2px solid #1976d2;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-weight: 600;
                `;
                console.log(`  ├─ Event ${idx + 1}: "${itemName}"`);
                itemElement.textContent = itemName.substring(0, 18);
            }
            
            itemElement.title = itemName;
            indicatorContainer.appendChild(itemElement);
        });
        
        if (dayItems.length > 2) {
            const more = document.createElement('div');
            more.style.cssText = 'font-size: 9px; color: #666; font-weight: 600; padding: 0 4px;';
            more.textContent = `+${dayItems.length - 2} more`;
            indicatorContainer.appendChild(more);
        }
        
        dayEl.appendChild(indicatorContainer);
    }
    
    // Click handler
    if (monthType === 'current-month') {
        dayEl.addEventListener('click', () => {
            calendarSelectedDate = cellDate;
            updateDeadlineDetails(dayItems);
            
            // Update selected styling
            document.querySelectorAll('[data-date]').forEach(el => {
                el.style.background = '#fff';
                el.style.borderColor = '#e5e7eb';
            });
            dayEl.style.background = '#e0f2fe';
            dayEl.style.borderColor = '#0284c7';
        });
        
        dayEl.addEventListener('mouseover', () => {
            if (cellDate.getTime() !== today.getTime()) {
                dayEl.style.background = '#f0f9ff';
                dayEl.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }
        });
        
        dayEl.addEventListener('mouseout', () => {
            if (cellDate.getTime() === today.getTime()) {
                dayEl.style.background = '#dbeafe';
            } else {
                dayEl.style.background = '#fff';
                dayEl.style.boxShadow = 'none';
            }
        });
    }
    
    return dayEl;
}

function getEventsForDate(dateStr) {
    const events = allEventsForCalendar.filter(event => {
        if (!event.event_date) {
            console.warn('Event missing event_date:', event);
            return false;
        }
        const eventDate = event.event_date.split(' ')[0];
        const match = eventDate === dateStr;
        
        if (match) {
            console.log(`📅 ${dateStr}: Found event "${event.event_name}"`, event);
        }
        
        return match;
    });
    
    // Also include tasks for this date
    const tasks = allTasksForCalendar.filter(task => {
        if (!task.event_date) {
            return false;
        }
        const taskDate = task.event_date.split(' ')[0];
        const match = taskDate === dateStr;
        
        if (match) {
            console.log(`📅 ${dateStr}: Found task "${task.task_name}"`, task);
        }
        
        return match;
    });
    
    // Also include emails for this date
    const emails = allEmailsForCalendar.filter(email => {
        if (!email.event_date) {
            return false;
        }
        const emailDate = email.event_date.split(' ')[0];
        const match = emailDate === dateStr;
        
        if (match) {
            console.log(`📅 ${dateStr}: Found email "${email.email_blast_name}"`, email);
        }
        
        return match;
    });
    
    // Also include logistics for this date
    const logistics = allLogisticsForCalendar.filter(log => {
        if (!log.event_date) {
            return false;
        }
        const logDate = log.event_date.split(' ')[0];
        const match = logDate === dateStr;
        
        if (match) {
            console.log(`📅 ${dateStr}: Found logistics "${log.item}"`, log);
        }
        
        return match;
    });
    
    // Combine and return events, tasks, emails, and logistics
    return [...events, ...tasks, ...emails, ...logistics];
}

let calendarListWeekOffset = 0; // Track which week we're viewing in list mode
let calendarListHideEmptyDays = false; // Track whether to hide empty days

function getWeekDates(year, month, weekOffset = 0) {
    // Get the first day of the current month view
    const monthStart = new Date(year, month, 1);
    const monthStartDay = monthStart.getDay();
    
    // Calculate the Sunday of the first week that contains a day in this month
    const firstSunday = new Date(year, month, 1 - monthStartDay);
    
    // Add weekOffset to navigate through weeks
    const weekStart = new Date(firstSunday);
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);
    
    // Get all 7 days of the week (Sunday to Saturday)
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        // Format date as YYYY-MM-DD in local timezone (not UTC)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        weekDates.push({ date: date, dateStr: dateStr });
    }
    
    return weekDates;
}

function renderCalendarList() {
    const listContainer = document.getElementById('calendarEventsList');
    listContainer.innerHTML = '';
    
    // Check if there are any items (events, tasks, or emails)
    if (allEventsForCalendar.length === 0 && allTasksForCalendar.length === 0 && allEmailsForCalendar.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-500 text-sm text-center py-8">No events, tasks, or emails found</p>';
        return;
    }
    
    // Get the week dates based on current calendar month/year and week offset
    const weekDates = getWeekDates(calendarCurrentYear, calendarCurrentMonth, calendarListWeekOffset);
    
    // Update header with week date range
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const firstDateObj = weekDates[0].date;
    const lastDateObj = weekDates[6].date;
    const firstMonth = monthNames[firstDateObj.getMonth()];
    const lastMonth = monthNames[lastDateObj.getMonth()];
    const firstDay = firstDateObj.getDate();
    const lastDay = lastDateObj.getDate();
    
    let dateRangeText = '';
    if (firstMonth === lastMonth) {
        // Same month: "March 15 - 21"
        dateRangeText = `${firstMonth} ${firstDay} - ${lastDay}`;
    } else {
        // Different months: "March 15 - April 2"
        dateRangeText = `${firstMonth} ${firstDay} - ${lastMonth} ${lastDay}`;
    }
    document.getElementById('calendarDateRange').textContent = dateRangeText;
    
    // Add toggle button for hiding empty days
    const toggleBtn = document.createElement('button');
    toggleBtn.style.cssText = `
        padding: 8px 16px;
        background: ${calendarListHideEmptyDays ? '#3b82f6' : '#e5e7eb'};
        color: ${calendarListHideEmptyDays ? 'white' : '#374151'};
        border: 1px solid ${calendarListHideEmptyDays ? '#3b82f6' : '#d1d5db'};
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    `;
    toggleBtn.textContent = calendarListHideEmptyDays ? 'Show all days' : 'Hide empty days';
    toggleBtn.addEventListener('click', () => {
        calendarListHideEmptyDays = !calendarListHideEmptyDays;
        renderCalendarList();
    });
    
    // Create sticky wrapper for button positioned on the right
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        position: sticky;
        top: 0;
        right: 0;
        display: flex;
        justify-content: flex-end;
        padding: 12px 0;
        margin-bottom: 12px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        z-index: 10;
    `;
    wrapper.appendChild(toggleBtn);
    listContainer.appendChild(wrapper);
    
    // Group events, tasks, emails, and logistics by date for this week
    const itemsByDate = {};
    
    // Add events
    allEventsForCalendar.forEach(event => {
        const date = event.event_date;
        if (!itemsByDate[date]) {
            itemsByDate[date] = [];
        }
        itemsByDate[date].push(event);
    });
    
    // Add tasks
    allTasksForCalendar.forEach(task => {
        const date = task.event_date;
        if (!itemsByDate[date]) {
            itemsByDate[date] = [];
        }
        itemsByDate[date].push(task);
    });
    
    // Add emails
    allEmailsForCalendar.forEach(email => {
        const date = email.event_date;
        if (!itemsByDate[date]) {
            itemsByDate[date] = [];
        }
        itemsByDate[date].push(email);
    });
    
    // Add logistics
    allLogisticsForCalendar.forEach(log => {
        const date = log.event_date;
        if (!itemsByDate[date]) {
            itemsByDate[date] = [];
        }
        itemsByDate[date].push(log);
    });
    
    // For each day of the week, create entries for all days
    weekDates.forEach(({ date: dateObj, dateStr }) => {
        const items = itemsByDate[dateStr] || [];
        
        // Skip empty days if toggle is on
        if (calendarListHideEmptyDays && items.length === 0) {
            return;
        }
        
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const monthDay = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        // Create day header - centered, single column
        const dayHeaderEl = document.createElement('div');
        dayHeaderEl.style.cssText = `
            padding: 12px 16px;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px 8px 0 0;
            font-weight: 600;
            color: #111827;
            font-size: 14px;
            margin-top: 12px;
            text-align: center;
        `;
        dayHeaderEl.innerHTML = `${dayName} | ${monthDay}`;
        listContainer.appendChild(dayHeaderEl);
        
        if (items.length === 0) {
            // Show "No items" message for days with no events or tasks
            const noEventEl = document.createElement('div');
            noEventEl.style.cssText = `
                padding: 12px 16px;
                border: 1px solid #e5e7eb;
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
                background: white;
                color: #999;
                font-size: 13px;
                text-align: center;
            `;
            noEventEl.innerHTML = 'No events, tasks, or emails on this day';
            listContainer.appendChild(noEventEl);
        } else {
            // Sort items: events first by start time, then tasks, then emails
            items.sort((a, b) => {
                // Events come first
                const aIsEvent = a.event_name && !a.task_id && !a.email_id;
                const bIsEvent = b.event_name && !b.task_id && !b.email_id;
                
                const aIsTask = a.task_id;
                const bIsTask = b.task_id;
                
                const aIsEmail = a.email_id;
                const bIsEmail = b.email_id;
                
                if (aIsEvent && !bIsEvent) return -1;
                if (!aIsEvent && bIsEvent) return 1;
                
                if (aIsTask && !bIsTask && !aIsEmail) return -1;
                if (!aIsTask && bIsTask && !bIsEmail) return 1;
                
                if (aIsEmail && !bIsEmail) return 1;
                if (!aIsEmail && bIsEmail) return -1;
                
                // Within same type, sort by time
                const timeA = aIsEvent ? (a.start_time || '23:59') : (aIsEmail ? (a.scheduled_date || '99:99') : '00:00');
                const timeB = bIsEvent ? (b.start_time || '23:59') : (bIsEmail ? (b.scheduled_date || '99:99') : '00:00');
                return String(timeA).localeCompare(String(timeB));
            });
        
            // Create rows with time/badge | item name
            items.forEach((item, index) => {
                const formatTime = (timeStr) => {
                    if (!timeStr) return '-';
                    const [hours, minutes] = timeStr.split(':');
                    let h = parseInt(hours);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    h = h % 12;
                    h = h ? h : 12;
                    return `${h}:${minutes} ${ampm}`;
                };
                
                const isTask = item.task_id;
                const isEmail = item.email_id;
                const isLogistics = item.logistics_id;
                const itemName = isTask ? item.task_name : (isEmail ? item.email_blast_name : (isLogistics ? item.item : item.event_name));
                
                const itemEl = document.createElement('div');
                itemEl.style.cssText = `
                    display: grid;
                    grid-template-columns: 140px 1fr 100px;
                    gap: 16px;
                    padding: 12px 16px;
                    border: 1px solid #e5e7eb;
                    border-right: 1px solid #e5e7eb;
                    border-left: 1px solid #e5e7eb;
                    ${index === items.length - 1 ? 'border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; border-bottom: 1px solid #e5e7eb;' : 'border-bottom: none;'}
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: white;
                    align-items: center;
                `;
                
                if (isTask) {
                    // Task formatting with text status badge for list view
                    // Check if task is overdue
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const itemDate = new Date(item.event_date);
                    itemDate.setHours(0, 0, 0, 0);
                    const isTaskOverdue = itemDate < today && (item.status === 'Pending' || item.status === 'In Progress');
                    
                    // Status color mapping for deadline details style
                    let statusColorMap = {
                        'Pending': '#2196F3',
                        'In Progress': '#FF9800',
                        'Done': '#4CAF50'
                    };
                    let statusBgColorMap = {
                        'Pending': '#e3f2fd',
                        'In Progress': '#fff3e0',
                        'Done': '#f1f8e9'
                    };
                    
                    // Override with red if overdue
                    if (isTaskOverdue) {
                        statusColorMap[item.status] = '#991b1b';
                        statusBgColorMap[item.status] = '#fee2e2';
                    }
                    
                    const status = item.status || 'Pending';
                    const statusColor = statusColorMap[status] || '#999';
                    const statusBgColor = statusBgColorMap[status] || '#f9f9f9';
                    
                    itemEl.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; background: ${statusBgColor}; color: ${statusColor}; padding: 3px 10px; border-radius: 3px; font-size: 11px; font-weight: 600; white-space: nowrap; min-height: 24px;">${status}</div>
                        <h4 style="margin: 0; font-weight: 500; color: #111827; font-size: 14px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(itemName)}</h4>
                        <div style="background: #f3f4f6; color: #6b7280; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-align: center; white-space: nowrap; border-left: 2px solid #d1d5db;">Task</div>
                    `;
                } else if (isEmail) {
                    // Email formatting with status badge matching task style
                    // Check if email is overdue (passed scheduled date and still draft)
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const itemDate = new Date(item.event_date);
                    itemDate.setHours(0, 0, 0, 0);
                    const isEmailOverdue = itemDate < today && item.status === 'Draft';
                    
                    let statusColorMap = {
                        'Draft': '#6b7280',
                        'Scheduled': '#3b82f6',
                        'Sent': '#10b981',
                        'Cancelled': '#ef4444'
                    };
                    let statusBgColorMap = {
                        'Draft': '#f3f4f6',
                        'Scheduled': '#eff6ff',
                        'Sent': '#ecfdf5',
                        'Cancelled': '#fef2f2'
                    };
                    
                    // Override with red if overdue
                    if (isEmailOverdue) {
                        statusColorMap['Draft'] = '#991b1b';
                        statusBgColorMap['Draft'] = '#fee2e2';
                    }
                    
                    const status = item.status || 'Draft';
                    const statusColor = statusColorMap[status] || '#999';
                    const statusBgColor = statusBgColorMap[status] || '#f9f9f9';
                    
                    itemEl.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; background: ${statusBgColor}; color: ${statusColor}; padding: 3px 10px; border-radius: 3px; font-size: 11px; font-weight: 600; white-space: nowrap; min-height: 24px;">${status}</div>
                        <h4 style="margin: 0; font-weight: 500; color: #111827; font-size: 14px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(itemName)}</h4>
                        <div style="background: #f3f4f6; color: #6b7280; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-align: center; white-space: nowrap; border-left: 2px solid #d1d5db;">Email</div>
                    `;
                } else if (isLogistics) {
                    // Logistics formatting with status badge (matching task color scheme)
                    const statusColorMap = {
                        'Pending': '#2196F3',
                        'In Progress': '#FF9800',
                        'Completed': '#4CAF50',
                        'Cancelled': '#ef4444'
                    };
                    const statusBgColorMap = {
                        'Pending': '#e3f2fd',
                        'In Progress': '#fff3e0',
                        'Completed': '#f1f8e9',
                        'Cancelled': '#fef2f2'
                    };
                    const status = item.status || 'Pending';
                    const statusColor = statusColorMap[status] || '#999';
                    const statusBgColor = statusBgColorMap[status] || '#f9f9f9';
                    
                    itemEl.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; background: ${statusBgColor}; color: ${statusColor}; padding: 3px 10px; border-radius: 3px; font-size: 11px; font-weight: 600; white-space: nowrap; min-height: 24px;">${status}</div>
                        <h4 style="margin: 0; font-weight: 500; color: #111827; font-size: 14px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(itemName)}</h4>
                        <div style="background: #f3f4f6; color: #6b7280; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-align: center; white-space: nowrap; border-left: 2px solid #d1d5db;">Logistics</div>
                    `;
                } else {
                    // Event formatting
                    const startTime = formatTime(item.start_time);
                    const endTime = formatTime(item.end_time);
                    const timeRange = `${startTime} - ${endTime}`;
                    
                    itemEl.innerHTML = `
                        <div style="font-weight: 500; color: #666; font-size: 13px; text-align: center;">${timeRange}</div>
                        <h4 style="margin: 0; font-weight: 500; color: #111827; font-size: 14px;">${escapeHtml(itemName)}</h4>
                        <div style="background: #dbeafe; color: #0284c7; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-align: center; white-space: nowrap;">Event</div>
                    `;
                }
                
                itemEl.addEventListener('click', () => {
                    updateDeadlineDetails([item], true);
                });
                
                itemEl.addEventListener('mouseover', () => {
                    // Check for overdue conditions
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const itemDateObj = new Date(item.event_date);
                    itemDateObj.setHours(0, 0, 0, 0);
                    const isItemOverdue = itemDateObj < today;
                    
                    let isRedAlert = false;
                    if (isEmail && isItemOverdue && item.status === 'Draft') {
                        isRedAlert = true;
                    } else if (isTask && isItemOverdue && (item.status === 'Pending' || item.status === 'In Progress')) {
                        isRedAlert = true;
                    }
                    
                    if (isRedAlert) {
                        itemEl.style.background = '#fecaca';
                        itemEl.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.1)';
                    } else if (isEmail) {
                        itemEl.style.background = '#f3f2ff';
                        itemEl.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.1)';
                    } else if (isTask) {
                        itemEl.style.background = '#fef3c7';
                        itemEl.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.1)';
                    } else if (isLogistics) {
                        itemEl.style.background = '#fef3c7';
                        itemEl.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.1)';
                    } else {
                        itemEl.style.background = '#f0f9ff';
                        itemEl.style.boxShadow = '0 2px 8px rgba(2, 132, 199, 0.1)';
                    }
                });
                
                itemEl.addEventListener('mouseout', () => {
                    itemEl.style.background = 'white';
                    itemEl.style.boxShadow = 'none';
                });
                
                listContainer.appendChild(itemEl);
            });
        }
    });
}

function switchCalendarView(view) {
    calendarCurrentView = view;
    
    const monthContainer = document.getElementById('monthViewContainer');
    const listContainer = document.getElementById('listViewContainer');
    const monthBtn = document.getElementById('monthViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    
    if (view === 'month') {
        monthContainer.style.display = 'block';
        listContainer.style.display = 'none';
        // Restore gradient background for month button
        monthBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
        monthBtn.style.color = 'white';
        listBtn.style.background = '#f3f4f6';
        listBtn.style.color = '#6b7280';
        renderCalendarMonth();
    } else {
        monthContainer.style.display = 'none';
        listContainer.style.display = 'block';
        monthBtn.style.background = '#f3f4f6';
        monthBtn.style.color = '#6b7280';
        listBtn.style.background = '#dbeafe';
        listBtn.style.color = '#0284c7';
        calendarListWeekOffset = 0; // Reset to current week
        renderCalendarList();
    }
}

function previousMonth() {
    if (calendarCurrentView === 'list') {
        // In list view, navigate by weeks
        calendarListWeekOffset--;
        renderCalendarList();
    } else {
        // In month view, navigate by months
        if (calendarCurrentMonth === 0) {
            calendarCurrentMonth = 11;
            calendarCurrentYear--;
        } else {
            calendarCurrentMonth--;
        }
        renderCalendarMonth();
    }
}

function nextMonth() {
    if (calendarCurrentView === 'list') {
        // In list view, navigate by weeks
        calendarListWeekOffset++;
        renderCalendarList();
    } else {
        // In month view, navigate by months
        if (calendarCurrentMonth === 11) {
            calendarCurrentMonth = 0;
            calendarCurrentYear++;
        } else {
            calendarCurrentMonth++;
        }
        renderCalendarMonth();
    }
}

function goToToday() {
    const today = new Date();
    calendarCurrentMonth = today.getMonth();
    calendarCurrentYear = today.getFullYear();
    calendarSelectedDate = new Date(today);
    calendarListWeekOffset = 0; // Reset to current week when switching to today
    
    if (calendarCurrentView === 'month') {
        renderCalendarMonth();
    } else if (calendarCurrentView === 'list') {
        renderCalendarList();
    }
}

function updateDeadlineDetails(items, isFromListView = false) {
    const detailsDiv = document.getElementById('deadlineDetails');
    const deadlineCountEl = document.getElementById('deadlineCount');
    
    // Helper function to convert military time to 12-hour format
    const formatTimeAmPm = (timeStr) => {
        if (!timeStr) return '';
        const [hours, mins] = timeStr.substring(0, 5).split(':');
        let h = parseInt(hours);
        const m = mins;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
    };
    
    if (!items || items.length === 0) {
        detailsDiv.innerHTML = '';
        if (calendarSelectedDate) {
            const selectedDateStr = calendarSelectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric'
            });
            deadlineCountEl.textContent = `0 events/tasks happening on ${selectedDateStr}`;
        } else {
            deadlineCountEl.textContent = `0 events/tasks`;
        }
        return;
    }
    
    // Build HTML for ALL items (events, tasks, and emails)
    let itemsHTML = '';
    items.forEach((item, index) => {
        const isTask = item.task_id;
        const isEmail = item.email_id;
        const itemDate = new Date(item.event_date);
        const dateStr = itemDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
        });
        
        if (isTask) {
            // Task display - find the event this task belongs to
            const taskEventId = item.event_id;
            const taskEvent = allEventsForCalendar.find(e => e.event_id == taskEventId);
            const eventName = taskEvent ? taskEvent.event_name : 'Unknown Event';
            const taskDetailsId = 'task-details-' + Math.random().toString(36).substr(2, 9);
            
            itemsHTML += `
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
                        <h4 style="margin: 0; font-weight: 700; font-size: 15px; color: #111827; flex: 1;">${escapeHtml(item.task_name)}</h4>
                        <span style="display: inline-block; padding: 4px 10px; background: #0284c7; color: white; border-radius: 3px; font-size: 10px; font-weight: 600; white-space: nowrap;">TASK</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="color: #666; font-size: 12px;">${escapeHtml(eventName)}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button onclick="document.getElementById('${taskDetailsId}').style.display = document.getElementById('${taskDetailsId}').style.display === 'none' ? 'block' : 'none'; this.textContent = this.textContent === 'View Details' ? 'Hide Details' : 'View Details';" style="background: none; border: none; color: #0284c7; padding: 0; cursor: pointer; font-size: 12px; font-weight: 600; text-decoration: underline;">View Details</button>
                        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #e5e7eb; color: ${(item.status || 'Pending').toLowerCase() === 'pending' ? '#4b5563' : (item.status || 'Pending').toLowerCase() === 'in progress' ? '#60a5fa' : '#34d399'}; border-radius: 20px; font-size: 10px; font-weight: 600; white-space: nowrap;">${getStatusBadgeSVG(item.status).replace('width="24"', 'width="14"').replace('height="24"', 'height="14"').replace('style="display: inline-block; margin-right: 4px;"', 'style="display: inline-block;"')} ${item.status || 'Pending'}</span>
                    </div>
                    <div id="${taskDetailsId}" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${item.party_responsible ? `<div style="color: #000; font-size: 13px;">Assigned to:<br /><span style="margin-left: 4px;">${escapeHtml(item.party_responsible)}</span></div>` : ''}
                            ${item.remarks ? `<div style="color: #000; font-size: 13px;">Remarks:<br /><span style="margin-left: 4px;">${escapeHtml(item.remarks)}</span></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else if (isEmail) {
            // Email display
            const emailEvent = allEventsForCalendar.find(e => e.event_id == item.event_id);
            const eventName = emailEvent ? emailEvent.event_name : 'Unknown Event';
            const emailDetailsId = 'email-details-' + Math.random().toString(36).substr(2, 9);
            
            const statusColorMap = {
                'Draft': '#6b7280',
                'Scheduled': '#3b82f6',
                'Sent': '#10b981',
                'Cancelled': '#ef4444'
            };
            const statusBgColorMap = {
                'Draft': '#f3f4f6',
                'Scheduled': '#eff6ff',
                'Sent': '#ecfdf5',
                'Cancelled': '#fef2f2'
            };
            const status = item.status || 'Draft';
            const statusColor = statusColorMap[status] || '#999';
            const statusBgColor = statusBgColorMap[status] || '#f9f9f9';
            
            // Define status icons
            let statusIcon = '';
            if (status === 'Draft') {
                statusIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;"><path d="M3 8L10.89 13.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" stroke="${statusColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            } else if (status === 'Scheduled') {
                statusIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;"><circle cx="12" cy="12" r="9" stroke="${statusColor}" stroke-width="1.5"/><polyline points="12 6 12 12 16 14" stroke="${statusColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            } else if (status === 'Sent') {
                statusIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;"><polyline points="20 6 9 17 4 12" stroke="${statusColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            } else if (status === 'Cancelled') {
                statusIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;"><circle cx="12" cy="12" r="10" stroke="${statusColor}" stroke-width="1.5"/><line x1="8" y1="8" x2="16" y2="16" stroke="${statusColor}" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="8" x2="8" y2="16" stroke="${statusColor}" stroke-width="2" stroke-linecap="round"/></svg>`;
            }
            
            itemsHTML += `
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
                        <h4 style="margin: 0; font-weight: 700; font-size: 15px; color: #111827; flex: 1; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(item.email_blast_name)}</h4>
                        <span style="display: inline-block; padding: 4px 10px; background: #3b82f6; color: white; border-radius: 3px; font-size: 10px; font-weight: 600; white-space: nowrap;">EMAIL</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="color: #666; font-size: 12px;">${escapeHtml(eventName)}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button onclick="viewEmailBlast(${item.event_id})" style="background: none; border: none; color: #3b82f6; padding: 0; cursor: pointer; font-size: 12px; font-weight: 600; text-decoration: underline;">View Email</button>
                        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: ${statusBgColor}; color: ${statusColor}; border-radius: 20px; font-size: 10px; font-weight: 600; white-space: nowrap;">${statusIcon}${status}</span>
                    </div>
                    <div id="${emailDetailsId}" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div style="color: #000; font-size: 13px;">Audience:<br /><span style="margin-left: 4px; color: #666; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(item.audience)}</span></div>
                            ${item.details ? `<div style="color: #000; font-size: 13px;">Details:<br /><span style="margin-left: 4px; color: #666; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(item.details)}</span></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else if (item.logistics_id) {
            // Logistics display
            const logisticsEvent = allEventsForCalendar.find(e => e.event_id == item.event_id);
            const eventName = logisticsEvent ? logisticsEvent.event_name : 'Unknown Event';
            const logisticsDetailsId = 'logistics-details-' + Math.random().toString(36).substr(2, 9);
            
            const statusColorMap = {
                'Pending': '#6b7280',
                'In Progress': '#f59e0b',
                'Completed': '#10b981',
                'Cancelled': '#ef4444'
            };
            const statusBgColorMap = {
                'Pending': '#f3f4f6',
                'In Progress': '#fef3c7',
                'Completed': '#ecfdf5',
                'Cancelled': '#fef2f2'
            };
            const status = item.status || 'Pending';
            const statusColor = statusColorMap[status] || '#999';
            const statusBgColor = statusBgColorMap[status] || '#f9f9f9';
            
            itemsHTML += `
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
                        <h4 style="margin: 0; font-weight: 700; font-size: 15px; color: #111827; flex: 1; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(item.item)}</h4>
                        <span style="display: inline-block; padding: 4px 10px; background: #0284c7; color: white; border-radius: 3px; font-size: 10px; font-weight: 600; white-space: nowrap;">LOGISTICS</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="color: #666; font-size: 12px;">${escapeHtml(eventName)}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button onclick="document.getElementById('${logisticsDetailsId}').style.display = document.getElementById('${logisticsDetailsId}').style.display === 'none' ? 'block' : 'none'; this.textContent = this.textContent === 'View Details' ? 'Hide Details' : 'View Details';" style="background: none; border: none; color: #0284c7; padding: 0; cursor: pointer; font-size: 12px; font-weight: 600; text-decoration: underline;">View Details</button>
                        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: ${statusBgColor}; color: ${statusColor}; border-radius: 20px; font-size: 10px; font-weight: 600; white-space: nowrap;">${status}</span>
                    </div>
                    <div id="${logisticsDetailsId}" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${item.category ? `<div style="color: #000; font-size: 13px;">Category:<br /><span style="margin-left: 4px; color: #666;">${escapeHtml(item.category)}</span></div>` : ''}
                            ${item.partner ? `<div style="color: #000; font-size: 13px;">Partner:<br /><span style="margin-left: 4px; color: #666;">${escapeHtml(item.partner)}</span></div>` : ''}
                            ${item.quantity ? `<div style="color: #000; font-size: 13px;">Quantity:<br /><span style="margin-left: 4px; color: #666;">${item.quantity}</span></div>` : ''}
                            ${item.notes ? `<div style="color: #000; font-size: 13px;">Notes:<br /><span style="margin-left: 4px; color: #666; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(item.notes)}</span></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Event display
            let timeStr = dateStr;
            if (item.start_time) {
                const [hours, mins] = item.start_time.split(':');
                const startTime = new Date(itemDate);
                startTime.setHours(parseInt(hours), parseInt(mins));
                const startTimeFormatted = formatTimeAmPm(item.start_time);
                const endTimeFormatted = item.end_time ? formatTimeAmPm(item.end_time) : '';
                
                let endDateTimeStr = '';
                if (endTimeFormatted) {
                    const endDate = item.end_date ? new Date(item.end_date) : itemDate;
                    const endDateStr = endDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric'
                    });
                    endDateTimeStr = ` to ${endDateStr} ${endTimeFormatted}`;
                }
                
                timeStr = `${dateStr} ${startTimeFormatted}${endDateTimeStr}`;
            }
            
            // Extract location separately for proper display
            const locationValue = item.location && item.location !== 'undefined' && item.location !== 'null' && item.location.trim() ? item.location : 'TBA';
            const eventDetailsId = 'event-details-' + Math.random().toString(36).substr(2, 9);
            
            itemsHTML += `
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
                        <h4 style="margin: 0; font-weight: 700; font-size: 15px; color: #111827; flex: 1;">${escapeHtml(item.event_name)}</h4>
                        <span style="display: inline-block; padding: 4px 10px; background: #0284c7; color: white; border-radius: 3px; font-size: 10px; font-weight: 600; white-space: nowrap;">EVENT</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button onclick="document.getElementById('${eventDetailsId}').style.display = document.getElementById('${eventDetailsId}').style.display === 'none' ? 'block' : 'none'; this.textContent = this.textContent === 'View Details' ? 'Hide Details' : 'View Details';" style="background: none; border: none; color: #0284c7; padding: 0; cursor: pointer; font-size: 12px; font-weight: 600; text-decoration: underline;">View Details</button>
                    </div>
                    <div id="${eventDetailsId}" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; align-items: flex-start; gap: 12px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style="color: #6b7280; flex-shrink: 0; margin-top: 2px;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm12-4v4M8 3v4m-4 4h16m-9 4h1m0 0v3"/></svg>
                                <div style="color: #374151; font-size: 14px;">${timeStr}</div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 12px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style="color: #6b7280; flex-shrink: 0; margin-top: 2px;"><g fill="none"><path d="M12 2a8 8 0 0 1 8 8c0 6.5-8 12-8 12s-8-5.5-8-12a8 8 0 0 1 8-8m0 5a3 3 0 1 0 0 6a3 3 0 0 0 0-6" clip-rule="evenodd"/><path stroke="currentColor" stroke-width="2" d="M20 10c0 6.5-8 12-8 12s-8-5.5-8-12a8 8 0 1 1 16 0Z"/><path stroke="currentColor" stroke-width="2" d="M15 10a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z"/></g></svg>
                                <div style="color: #374151; font-size: 14px;">${escapeHtml(locationValue)}</div>
                            </div>
                            ${item.capacity ? `<div style="display: flex; align-items: flex-start; gap: 12px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style="color: #6b7280; flex-shrink: 0; margin-top: 2px;"><path fill="currentColor" d="M16 4c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2m4.78 3.58A6.95 6.95 0 0 0 18 7c-.67 0-1.31.1-1.92.28c.58.55.92 1.32.92 2.15V10h5v-.57c0-.81-.48-1.53-1.22-1.85M6 6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2m1.92 1.28C7.31 7.1 6.67 7 6 7c-.99 0-1.93.21-2.78.58A2.01 2.01 0 0 0 2 9.43V10h5v-.57c0-.83.34-1.6.92-2.15M10 4c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2m6 6H8v-.57c0-.81.48-1.53 1.22-1.85a6.95 6.95 0 0 1 5.56 0A2.01 2.01 0 0 1 16 9.43zm-1 6c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2m6 6h-8v-.57c0-.81.48-1.53 1.22-1.85a6.95 6.95 0 0 1 5.56 0A2.01 2.01 0 0 1 21 21.43zM5 16c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2m6 6H3v-.57c0-.81.48-1.53 1.22-1.85a6.95 6.95 0 0 1 5.56 0A2.01 2.01 0 0 1 11 21.43zm1.75-9v-2h-1.5v2H9l3 3l3-3z"/></svg>
                                <div style="color: #374151; font-size: 14px;">${item.capacity}</div>
                            </div>` : ''}
                            ${item.total_registrations !== undefined ? `<div style="display: flex; align-items: flex-start; gap: 12px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style="color: #6b7280; flex-shrink: 0; margin-top: 2px;"><circle cx="12" cy="6" r="2" fill="currentColor"/><circle cx="6" cy="18" r="2" fill="currentColor"/><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="6" cy="6" r="2" fill="currentColor"/><circle cx="18" cy="6" r="2" fill="currentColor"/><path fill="currentColor" d="M11 18.07v1.43c0 .28.22.5.5.5h1.4c.13 0 .26-.05.35-.15l5.83-5.83l-2.12-2.12l-5.81 5.81c-.1.1-.15.23-.15.36M12.03 14L14 12.03V12c0-1.1-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm8.82-2.44l-1.41-1.41c-.2-.2-.51-.2-.71 0l-1.06 1.06l2.12 2.12l1.06-1.06c.2-.2.2-.51 0-.71"/></svg>
                                <div style="color: #374151; font-size: 14px;">${item.total_registrations}/${item.capacity || '∞'}</div>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    // Wrap with scrolling container if multiple items
    const scrollStyle = items.length > 2 ? 'max-height: 400px; overflow-y: auto;' : '';
    detailsDiv.innerHTML = `<div style="${scrollStyle}">${itemsHTML}</div>`;
    
    // Set max-height to match calendar grid height but let content determine actual height
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarEventsList = document.getElementById('calendarEventsList');
    const targetCalendar = calendarGrid || calendarEventsList;
    
    if (targetCalendar) {
        // Use setTimeout to ensure DOM has been fully laid out
        setTimeout(() => {
            const calendarHeight = targetCalendar.offsetHeight;
            if (calendarHeight > 0) {
                detailsDiv.style.maxHeight = calendarHeight + 'px';
                detailsDiv.style.overflowY = 'auto';
                detailsDiv.style.height = 'auto';
            }
        }, 0);
    }
    
    // Update count to show items for the selected date
    const itemCount = items.length;
    const eventCount = items.filter(i => !i.task_id && !i.email_id && !i.logistics_id).length;
    const taskCount = items.filter(i => i.task_id).length;
    const emailCount = items.filter(i => i.email_id).length;
    const logisticsCount = items.filter(i => i.logistics_id).length;
    
    if (itemCount > 1) {
        const selectedDate = new Date(items[0].event_date);
        const selectedDateStr = selectedDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric'
        });
        let countText = ``;
        if (eventCount > 0) countText += `${eventCount} event${eventCount !== 1 ? 's' : ''} scheduled`;
        if (taskCount > 0) {
            if (countText) countText += ` & `;
            countText += `${taskCount} task${taskCount !== 1 ? 's' : ''} due`;
        }
        if (emailCount > 0) {
            if (countText) countText += ` & `;
            countText += `${emailCount} email${emailCount !== 1 ? 's' : ''} queued`;
        }
        if (logisticsCount > 0) {
            if (countText) countText += ` & `;
            countText += `${logisticsCount} logistic${logisticsCount !== 1 ? 's' : ''} to manage`;
        }
        countText += ` on ${selectedDateStr}`;
        deadlineCountEl.textContent = countText;
    } else if (itemCount === 1 && isFromListView) {
        // Single item from list view - hide the count message
        deadlineCountEl.textContent = '';
    } else if (itemCount === 1 && !isFromListView) {
        // Single item from month view - show the count message
        const selectedDate = new Date(items[0].event_date);
        const selectedDateStr = selectedDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric'
        });
        let itemLabel = 'event scheduled';
        if (items[0].task_id) itemLabel = 'task due';
        if (items[0].email_id) itemLabel = 'email queued';
        if (items[0].logistics_id) itemLabel = 'logistic to manage';
        deadlineCountEl.textContent = `1 ${itemLabel} on ${selectedDateStr}`;
    }
}

function viewEmailBlast(eventId) {
    console.log('📧 View Email clicked with eventId:', eventId);
    
    // Set the current event ID
    window.currentEventId = eventId;
    
    // Navigate to event details which will load all the event data
    console.log('📧 Navigating to event details');
    viewEventDetails(eventId);
    
    // After a short delay, switch to emails tab and load emails
    setTimeout(() => {
        console.log('📧 Switching to emails tab');
        // Click the emails tab button to switch tabs
        const emailTabBtn = document.querySelector('[data-tab="emails"]') || 
                           document.querySelector('button[onclick*="switchTab"]');
        
        // Try to switch tab using the switchTab function if available
        if (typeof switchTab === 'function') {
            console.log('📧 Using switchTab function');
            switchTab('emails');
        } else if (emailTabBtn) {
            console.log('📧 Clicking emails tab button');
            emailTabBtn.click();
        }
        
        // Load emails for this event
        if (typeof window.loadEmailBlasts === 'function') {
            console.log('📧 Loading emails for event:', eventId);
            window.loadEmailBlasts(eventId);
        }
        
        // Scroll to emails section
        const emailsSection = document.getElementById('emails');
        if (emailsSection) {
            console.log('📧 Scrolling to emails section');
            emailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
}

let currentParticipantFilter = 'all';
let currentParticipantSort = 'newest';
let allParticipantsData = [];
let departmentsLoaded = false;
async function loadParticipants() {
    const initialTableBody = document.getElementById('participantsInitialTable');
    const actualTableBody = document.getElementById('participantsActualTable');
    const initialCountSpan = document.getElementById('participantsInitialCount');
    const actualCountSpan = document.getElementById('participantsActualCount');
    const searchInput = document.getElementById('participantsSearch');
    
    if (!initialTableBody || !actualTableBody) {
        console.error('Participants tables not found');
        return;
    }

    // Set loading state (7 columns - removed EMPLOYEE CODE)
    initialTableBody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Loading participants...</td></tr>';
    actualTableBody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Loading participants...</td></tr>';

    let initialList = [];
    let actualList = [];

    try {
        const response = await fetch(`${API_BASE}/participants.php?action=list`, {
            method: 'GET',
            headers: getUserHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch participants');
        const result = await response.json();
        
        console.log('Participants API Response:', result);
        
        const participantsData = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);
        
        // Split into initial/actual based on status
        initialList = participantsData.filter(p => (p.status || '').toUpperCase() !== 'ATTENDED');
        actualList = participantsData.filter(p => (p.status || '').toUpperCase() === 'ATTENDED');
        
        // Store for search
        allParticipantsData = participantsData;
        
    } catch (error) {
        const errorMsg = `Error loading participants: ${error.message}`;
        console.error(errorMsg, error);
        initialTableBody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-red-600">${errorMsg}</td></tr>`;
        actualTableBody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-red-600">${errorMsg}</td></tr>`;
        return;
    }

    // Update counts
    updateParticipantsCounts(initialList.length, actualList.length);

    // Render function
    function renderTable(list, tableBody) {
        tableBody.innerHTML = '';
        if (list.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No participants found.</td></tr>';
            return;
        }
        list.forEach((participant, idx) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-3 text-sm text-gray-900">${idx + 1}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${escapeHtml(participant.full_name || participant.name || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(participant.company || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(participant.job_title || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(participant.email || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(participant.phone || participant.contact_number || '-')}</td>
                <td class="px-4 py-3 text-right text-sm">
                  <div class="flex gap-2 justify-end">
                    <button class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" title="View">👁️</button>
                    <button class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded" title="Edit">✏️</button>
                    <button class="px-2 py-1 text-red-600 hover:bg-red-50 rounded" title="Delete">🗑️</button>
                  </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Initial render
    renderTable(initialList, initialTableBody);
    renderTable(actualList, actualTableBody);

    // Search functionality
    if (searchInput) {
        searchInput.oninput = function() {
            const q = searchInput.value.toLowerCase();
            const filteredInitial = initialList.filter(p =>
                (p.full_name || '').toLowerCase().includes(q) ||
                (p.company || '').toLowerCase().includes(q) ||
                (p.job_title || '').toLowerCase().includes(q) ||
                (p.email || '').toLowerCase().includes(q)
            );
            const filteredActual = actualList.filter(p =>
                (p.full_name || '').toLowerCase().includes(q) ||
                (p.company || '').toLowerCase().includes(q) ||
                (p.job_title || '').toLowerCase().includes(q) ||
                (p.email || '').toLowerCase().includes(q)
            );
            renderTable(filteredInitial, initialTableBody);
            renderTable(filteredActual, actualTableBody);
        };
    }
}

function updateParticipantsCounts(initialCount, actualCount) {
    const initialCountSpan = document.getElementById('participantsInitialCount');
    const actualCountSpan = document.getElementById('participantsActualCount');
    
    if (initialCountSpan) initialCountSpan.textContent = `(${initialCount})`;
    if (actualCountSpan) actualCountSpan.textContent = `(${actualCount})`;
}

// ====== REPORTS SECTION ======
let reportCurrentSelection = 'all';
let reportAllParticipants = [];
let reportFilteredParticipants = [];
let reportAllEvents = [];

async function loadReports() {
    console.log('Loading reports...');
    try {
        // Fetch all events
        const eventsResponse = await fetch(`${API_BASE}/events.php`, {
            headers: getUserHeaders()
        });
        reportAllEvents = await eventsResponse.json();
        
        // Fetch all participants data
        const participantsResponse = await fetch(`${API_BASE}/participants.php`, {
            headers: getUserHeaders()
        });
        
        const participantsData = await participantsResponse.json();
        if (Array.isArray(participantsData)) {
            reportAllParticipants = participantsData;
        } else if (participantsData.data && Array.isArray(participantsData.data)) {
            reportAllParticipants = participantsData.data;
        }
        
        // Build event tabs
        buildReportEventTabs();
        
    } catch (error) {
        console.error('Error loading reports:', error);
        showToast('Error loading report data', 'error');
    }
}

function buildReportEventTabs() {
    const container = document.getElementById('eventTabsContainer');
    if (!container || !Array.isArray(reportAllEvents)) return;
    
    container.innerHTML = '';
    
    reportAllEvents.forEach(event => {
        const button = document.createElement('button');
        button.onclick = () => selectReportEvent(event.id);
        button.style.cssText = `
            padding: 12px 24px; 
            background: white; 
            color: #6b7280; 
            border: 2px solid #e5e7eb; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: 600; 
            font-size: 14px; 
            transition: all 0.2s;
        `;
        button.textContent = event.title || 'Unnamed Event';
        button.id = `eventTab-${event.id}`;
        container.appendChild(button);
    });
}

function selectReportEvent(eventId) {
    reportCurrentSelection = eventId;
    
    // Update button states
    document.getElementById('allEventsBtn').style.background = eventId === 'all' ? '#3b82f6' : 'white';
    document.getElementById('allEventsBtn').style.color = eventId === 'all' ? 'white' : '#6b7280';
    document.getElementById('allEventsBtn').style.borderColor = eventId === 'all' ? '#3b82f6' : '#e5e7eb';
    
    // Update event tabs
    document.querySelectorAll('[id^="eventTab-"]').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = '#6b7280';
        btn.style.borderColor = '#e5e7eb';
    });
    
    if (eventId !== 'all') {
        const selectedTab = document.getElementById(`eventTab-${eventId}`);
        if (selectedTab) {
            selectedTab.style.background = '#3b82f6';
            selectedTab.style.color = 'white';
            selectedTab.style.borderColor = '#3b82f6';
        }
    }
    
    // Load participants for selected event(s)
    loadReportParticipants();
}

function loadReportParticipants() {
    let participants = [];
    
    if (reportCurrentSelection === 'all') {
        participants = reportAllParticipants;
        document.getElementById('selectedEventInfo').innerHTML = 
            `<strong>All Events</strong> - Showing participants from all events`;
    } else {
        const selectedEvent = reportAllEvents.find(e => e.id == reportCurrentSelection);
        if (selectedEvent) {
            participants = reportAllParticipants.filter(p => p.event_id == reportCurrentSelection);
            document.getElementById('selectedEventInfo').innerHTML = 
                `<strong>${selectedEvent.title}</strong> - ${participants.length} participant(s)`;
        }
    }
    
    reportFilteredParticipants = participants;
    
    // Update stats
    updateReportStats(participants);
    
    // Show containers
    document.getElementById('reportStatsContainer').style.display = 'grid';
    document.getElementById('exportButtonsContainer').style.display = 'flex';
    document.getElementById('participantFiltersContainer').style.display = 'grid';
    document.getElementById('participantTableContainer').style.display = 'block';
    
    // Render table
    renderReportParticipantsTable(participants);
}

function updateReportStats(participants) {
    const total = participants.length;
    const attended = participants.filter(p => p.attended === '1' || p.attended === 1).length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    
    document.getElementById('reportTotalParticipants').textContent = total;
    document.getElementById('reportTotalAttended').textContent = attended;
    document.getElementById('reportAttendanceRate').textContent = rate + '%';
}

function renderReportParticipantsTable(participants) {
    const tbody = document.getElementById('participantReportTableBody');
    const noMsg = document.getElementById('noParticipantsMessage');
    
    if (!participants || participants.length === 0) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }
    
    noMsg.style.display = 'none';
    tbody.innerHTML = participants.map((p, index) => {
        const eventName = reportAllEvents.find(e => e.id == p.event_id)?.title || 'Unknown Event';
        const attended = p.attended === '1' || p.attended === 1;
        return `
            <tr style="border-bottom: 1px solid #e5e7eb; hover: background-color: #f9fafb;">
                <td style="padding: 14px; color: #1f2937; font-weight: 500;">${p.first_name || ''} ${p.last_name || ''}</td>
                <td style="padding: 14px; color: #6b7280;">${p.email || '-'}</td>
                <td style="padding: 14px; color: #6b7280;">${p.company || '-'}</td>
                <td style="padding: 14px; color: #6b7280;">${p.job_title || '-'}</td>
                <td style="padding: 14px; text-align: center;">
                    <span style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${attended ? '#d1fae5' : '#fee2e2'}; color: ${attended ? '#065f46' : '#991b1b'};">
                        ${attended ? '✓ Attended' : 'Registered'}
                    </span>
                </td>
                <td style="padding: 14px; color: #6b7280; font-size: 13px;">${eventName}</td>
            </tr>
        `;
    }).join('');
}

function filterParticipantReport() {
    const searchText = document.getElementById('participantReportSearch').value.toLowerCase();
    const statusFilter = document.getElementById('participantReportStatusFilter').value;
    
    let filtered = reportFilteredParticipants;
    
    // Apply search filter
    if (searchText) {
        filtered = filtered.filter(p => {
            const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
            const email = (p.email || '').toLowerCase();
            const company = (p.company || '').toLowerCase();
            return fullName.includes(searchText) || email.includes(searchText) || company.includes(searchText);
        });
    }
    
    // Apply status filter
    if (statusFilter) {
        if (statusFilter === 'attended') {
            filtered = filtered.filter(p => p.attended === '1' || p.attended === 1);
        } else if (statusFilter === 'registered') {
            filtered = filtered.filter(p => p.attended !== '1' && p.attended !== 1);
        }
    }
    
    renderReportParticipantsTable(filtered);
}

function exportParticipantsToExcel() {
    try {
        const participants = reportFilteredParticipants;
        if (participants.length === 0) {
            showToast('No participants to export', 'warning');
            return;
        }
        
        // Create CSV content
        let csv = 'First Name,Last Name,Email,Company,Job Title,Contact,Attendance,Event,Registration Date\n';
        
        participants.forEach(p => {
            const eventName = reportAllEvents.find(e => e.id == p.event_id)?.title || 'Unknown';
            const attended = p.attended === '1' || p.attended === 1 ? 'Attended' : 'Registered';
            const regDate = p.registration_date ? new Date(p.registration_date).toLocaleDateString() : '-';
            
            // Escape CSV values
            const escape = (val) => {
                if (!val) return '';
                return `"${String(val).replace(/"/g, '""')}"`;
            };
            
            csv += `${escape(p.first_name)},${escape(p.last_name)},${escape(p.email)},${escape(p.company)},${escape(p.job_title)},${escape(p.contact || p.phone)},${attended},${escape(eventName)},${regDate}\n`;
        });
        
        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const eventName = reportCurrentSelection === 'all' ? 'All_Events' : 
                         reportAllEvents.find(e => e.id == reportCurrentSelection)?.title || 'Report';
        const filename = `Participants_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Participants exported to Excel successfully!', 'success');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showToast('Error exporting data', 'error');
    }
}

function exportParticipantsToPDF() {
    try {
        const participants = reportFilteredParticipants;
        if (participants.length === 0) {
            showToast('No participants to export', 'warning');
            return;
        }
        
        // Generate PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        const eventName = reportCurrentSelection === 'all' ? 'All Events' : 
                         reportAllEvents.find(e => e.id == reportCurrentSelection)?.title || 'Event Report';
        
        doc.setFontSize(18);
        doc.text('Participant Report', 14, 20);
        
        doc.setFontSize(12);
        doc.text(`Event: ${eventName}`, 14, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);
        doc.text(`Total Participants: ${participants.length}`, 14, 46);
        
        // Create table
        const columns = ['Name', 'Email', 'Company', 'Job Title', 'Attendance'];
        const rows = participants.map(p => {
            const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
            const attended = p.attended === '1' || p.attended === 1 ? 'Attended' : 'Registered';
            return [
                fullName,
                p.email || '-',
                p.company || '-',
                p.job_title || '-',
                attended
            ];
        });
        
        doc.autoTable({
            startY: 55,
            head: [columns],
            body: rows,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] }
        });
        
        // Download
        const filename = `Participants_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        showToast('Participants exported to PDF successfully!', 'success');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showToast('Error exporting PDF. Make sure jsPDF is loaded.', 'error');
    }
}

// ================================================================================
// REPORT TYPE SWITCHING SYSTEM
// ================================================================================

function switchReportType(reportType) {
    // Hide all report content
    document.getElementById('reportContent-participants').style.display = 'none';
    document.getElementById('reportContent-events').style.display = 'none';
    document.getElementById('reportContent-attendance').style.display = 'none';
    
    // Update button styles
    document.getElementById('reportTypeBtn-participants').style.background = reportType === 'participants' ? '#3b82f6' : 'white';
    document.getElementById('reportTypeBtn-participants').style.color = reportType === 'participants' ? 'white' : '#6b7280';
    document.getElementById('reportTypeBtn-participants').style.borderColor = reportType === 'participants' ? '#3b82f6' : '#e5e7eb';
    
    document.getElementById('reportTypeBtn-events').style.background = reportType === 'events' ? '#3b82f6' : 'white';
    document.getElementById('reportTypeBtn-events').style.color = reportType === 'events' ? 'white' : '#6b7280';
    document.getElementById('reportTypeBtn-events').style.borderColor = reportType === 'events' ? '#3b82f6' : '#e5e7eb';
    
    document.getElementById('reportTypeBtn-attendance').style.background = reportType === 'attendance' ? '#3b82f6' : 'white';
    document.getElementById('reportTypeBtn-attendance').style.color = reportType === 'attendance' ? 'white' : '#6b7280';
    document.getElementById('reportTypeBtn-attendance').style.borderColor = reportType === 'attendance' ? '#3b82f6' : '#e5e7eb';
    
    // Show the selected report type
    if (reportType === 'participants') {
        document.getElementById('reportContent-participants').style.display = 'block';
    } else if (reportType === 'events') {
        document.getElementById('reportContent-events').style.display = 'block';
        loadEventSummaryReport();
    } else if (reportType === 'attendance') {
        document.getElementById('reportContent-attendance').style.display = 'block';
        loadAttendanceReport();
    }
}

// ================================================================================
// EVENT SUMMARY REPORT
// ================================================================================

async function loadEventSummaryReport() {
    try {
        const tbody = document.getElementById('eventSummaryTableBody');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6b7280;">Loading...</td></tr>';
        
        // Get all events and participants data
        const events = reportAllEvents || [];
        const participants = reportAllParticipants || [];
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #9ca3af;">No events found</td></tr>';
            return;
        }
        
        // Build summary data
        const summaryData = events.map(event => {
            const eventParticipants = participants.filter(p => p.event_id == event.id);
            const attended = eventParticipants.filter(p => p.attended === '1' || p.attended === 1).length;
            
            return {
                id: event.id,
                title: event.title || 'Unnamed Event',
                location: event.location || '-',
                date: event.event_date ? new Date(event.event_date).toLocaleDateString() : '-',
                registrations: eventParticipants.length,
                attended: attended,
                rate: eventParticipants.length > 0 ? Math.round((attended / eventParticipants.length) * 100) : 0
            };
        });
        
        // Render table
        tbody.innerHTML = summaryData.map(event => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 14px; color: #1f2937; font-weight: 500;">${event.title}</td>
                <td style="padding: 14px; color: #6b7280;">${event.location}</td>
                <td style="padding: 14px; text-align: center; color: #6b7280;">${event.date}</td>
                <td style="padding: 14px; text-align: center; font-weight: 600;">${event.registrations}</td>
                <td style="padding: 14px; text-align: center; font-weight: 600; color: #10b981;">${event.attended}</td>
                <td style="padding: 14px; text-align: center;">
                    <span style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${event.rate >= 80 ? '#d1fae5' : event.rate >= 50 ? '#fef3c7' : '#fee2e2'}; color: ${event.rate >= 80 ? '#065f46' : event.rate >= 50 ? '#92400e' : '#991b1b'};">
                        ${event.rate}%
                    </span>
                </td>
            </tr>
        `).join('');
        
        // Store summary data for export
        window.currentEventSummaryData = summaryData;
        
    } catch (error) {
        console.error('Error loading event summary:', error);
        showToast('Error loading event summary', 'error');
    }
}

function filterEventSummaryReport() {
    const searchText = document.getElementById('eventSummarySearch').value.toLowerCase();
    const tbody = document.getElementById('eventSummaryTableBody');
    
    if (!window.currentEventSummaryData) return;
    
    let filtered = window.currentEventSummaryData;
    
    if (searchText) {
        filtered = filtered.filter(event => 
            event.title.toLowerCase().includes(searchText) || 
            event.location.toLowerCase().includes(searchText)
        );
    }
    
    tbody.innerHTML = filtered.map(event => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 14px; color: #1f2937; font-weight: 500;">${event.title}</td>
            <td style="padding: 14px; color: #6b7280;">${event.location}</td>
            <td style="padding: 14px; text-align: center; color: #6b7280;">${event.date}</td>
            <td style="padding: 14px; text-align: center; font-weight: 600;">${event.registrations}</td>
            <td style="padding: 14px; text-align: center; font-weight: 600; color: #10b981;">${event.attended}</td>
            <td style="padding: 14px; text-align: center;">
                <span style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${event.rate >= 80 ? '#d1fae5' : event.rate >= 50 ? '#fef3c7' : '#fee2e2'}; color: ${event.rate >= 80 ? '#065f46' : event.rate >= 50 ? '#92400e' : '#991b1b'};">
                ${event.rate}%
            </span>
            </td>
        </tr>
    `).join('');
}

function exportEventSummaryToExcel() {
    try {
        const summaryData = window.currentEventSummaryData || [];
        if (summaryData.length === 0) {
            showToast('No events to export', 'warning');
            return;
        }
        
        let csv = 'Event Title,Location,Date,Total Registrations,Total Attended,Attendance Rate (%)\n';
        
        summaryData.forEach(event => {
            const escape = (val) => {
                if (!val) return '';
                return `"${String(val).replace(/"/g, '""')}"`;
            };
            
            csv += `${escape(event.title)},${escape(event.location)},${escape(event.date)},${event.registrations},${event.attended},${event.rate}%\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const filename = `Event_Summary_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Event summary exported to Excel successfully!', 'success');
    } catch (error) {
        console.error('Error exporting event summary:', error);
        showToast('Error exporting data', 'error');
    }
}

function exportEventSummaryToPDF() {
    try {
        const summaryData = window.currentEventSummaryData || [];
        if (summaryData.length === 0) {
            showToast('No events to export', 'warning');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Event Summary Report', 14, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.text(`Total Events: ${summaryData.length}`, 14, 38);
        
        const columns = ['Event Title', 'Location', 'Date', 'Registrations', 'Attended', 'Rate (%)'];
        const rows = summaryData.map(event => [
            event.title,
            event.location,
            event.date,
            event.registrations.toString(),
            event.attended.toString(),
            event.rate + '%'
        ]);
        
        doc.autoTable({
            startY: 45,
            head: [columns],
            body: rows,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] }
        });
        
        const filename = `Event_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        showToast('Event summary exported to PDF successfully!', 'success');
    } catch (error) {
        console.error('Error exporting event summary PDF:', error);
        showToast('Error exporting PDF', 'error');
    }
}

// ================================================================================
// ATTENDANCE REPORT
// ================================================================================

async function loadAttendanceReport() {
    try {
        const tbody = document.getElementById('attendanceTableBody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">Loading...</td></tr>';
        
        const events = reportAllEvents || [];
        const participants = reportAllParticipants || [];
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #9ca3af;">No events found</td></tr>';
            return;
        }
        
        // Build attendance data
        const attendanceData = events.map(event => {
            const eventParticipants = participants.filter(p => p.event_id == event.id);
            const attended = eventParticipants.filter(p => p.attended === '1' || p.attended === 1).length;
            const noShow = eventParticipants.length - attended;
            const rate = eventParticipants.length > 0 ? Math.round((attended / eventParticipants.length) * 100) : 0;
            
            return {
                title: event.title || 'Unnamed Event',
                registrations: eventParticipants.length,
                attended: attended,
                noShow: noShow,
                rate: rate
            };
        });
        
        // Calculate overall stats
        const totalReg = attendanceData.reduce((sum, e) => sum + e.registrations, 0);
        const totalAtt = attendanceData.reduce((sum, e) => sum + e.attended, 0);
        const overallRate = totalReg > 0 ? Math.round((totalAtt / totalReg) * 100) : 0;
        
        document.getElementById('attendanceTotalReg').textContent = totalReg;
        document.getElementById('attendanceTotalAtt').textContent = totalAtt;
        document.getElementById('attendanceOverallRate').textContent = overallRate + '%';
        
        // Render table
        tbody.innerHTML = attendanceData.map(event => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 14px; color: #1f2937; font-weight: 500;">${event.title}</td>
                <td style="padding: 14px; text-align: center; font-weight: 600;">${event.registrations}</td>
                <td style="padding: 14px; text-align: center; font-weight: 600; color: #10b981;">${event.attended}</td>
                <td style="padding: 14px; text-align: center; font-weight: 600; color: #ef4444;">${event.noShow}</td>
                <td style="padding: 14px; text-align: center;">
                    <span style="display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${event.rate >= 80 ? '#d1fae5' : event.rate >= 50 ? '#fef3c7' : '#fee2e2'}; color: ${event.rate >= 80 ? '#065f46' : event.rate >= 50 ? '#92400e' : '#991b1b'};">
                        ${event.rate}%
                    </span>
                </td>
            </tr>
        `).join('');
        
        // Store for export
        window.currentAttendanceData = attendanceData;
        
    } catch (error) {
        console.error('Error loading attendance report:', error);
        showToast('Error loading attendance report', 'error');
    }
}

function exportAttendanceReportToExcel() {
    try {
        const attendanceData = window.currentAttendanceData || [];
        if (attendanceData.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }
        
        let csv = 'Event,Registrations,Attended,No-Show,Attendance Rate (%)\n';
        
        attendanceData.forEach(event => {
            const escape = (val) => {
                if (!val) return '';
                return `"${String(val).replace(/"/g, '""')}"`;
            };
            
            csv += `${escape(event.title)},${event.registrations},${event.attended},${event.noShow},${event.rate}%\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Attendance report exported to Excel successfully!', 'success');
    } catch (error) {
        console.error('Error exporting attendance report:', error);
        showToast('Error exporting data', 'error');
    }
}

function exportAttendanceReportToPDF() {
    try {
        const attendanceData = window.currentAttendanceData || [];
        if (attendanceData.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Attendance Report', 14, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
        
        const columns = ['Event', 'Registrations', 'Attended', 'No-Show', 'Rate (%)'];
        const rows = attendanceData.map(event => [
            event.title,
            event.registrations.toString(),
            event.attended.toString(),
            event.noShow.toString(),
            event.rate + '%'
        ]);
        
        doc.autoTable({
            startY: 40,
            head: [columns],
            body: rows,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 247, 250] }
        });
        
        const filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        showToast('Attendance report exported to PDF successfully!', 'success');
    } catch (error) {
        console.error('Error exporting attendance PDF:', error);
        showToast('Error exporting PDF', 'error');
    }
}

let qrScanner = null;
function initQRScannerPage() { console.log('QR Scanner initializing...'); }

let allUsersData = [];
let usersCurrentPage = 1;
let usersPerPage = 10;
let usersFilteredData = [];
let allActivityLogs = []; // Store all logs for search functionality
let selectedActionTypeFilter = ''; // Store selected action type filter

function loadActivityLogs() {
    console.log('✓ loadActivityLogs() called');
    
    const logsTable = document.getElementById('logsTable');
    if (!logsTable) {
        console.error('✗ logsTable not found');
        return;
    }
    
    logsTable.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Loading...</td></tr>';
    
    fetch('../api/activity-logs.php?page=1&limit=100', {
        method: 'GET',
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        console.log('Activity logs response:', data);
        
        if (!data.success) {
            logsTable.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #e74c3c;">Error: ${data.message}</td></tr>`;
            return;
        }
        
        if (!data.data || data.data.length === 0) {
            logsTable.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">No activity logs found</td></tr>';
            return;
        }
        
        // Store all logs data for search functionality
        allActivityLogs = data.data;
        
        // Display all logs
        displayActivityLogs(data.data);
        
        // Populate action type filter dropdown
        populateActionTypeFilter();
        
        // Set up search event listener
        setupLogsSearchListener();
        
        console.log(`✓ Displayed ${data.data.length} activity logs`);
        
    })
    .catch(error => {
        console.error('✗ Error loading activity logs:', error);
        logsTable.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #e74c3c;">Error loading logs: ${error.message}</td></tr>`;
    });
}

function displayActivityLogs(logsToDisplay) {
    const logsTable = document.getElementById('logsTable');
    if (!logsTable) {
        console.error('✗ logsTable not found');
        return;
    }
    
    if (!logsToDisplay || logsToDisplay.length === 0) {
        logsTable.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">No activity logs found</td></tr>';
        return;
    }
    
    logsTable.innerHTML = '';
    
    logsToDisplay.forEach(log => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #f0f0f0';
        
        // Format timestamp
        const logDate = new Date(log.timestamp);
        const formattedDate = logDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        // Format action type (convert SNAKE_CASE to Readable Text)
        const actionFormatted = log.action_type
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        // Build description
        let description = log.description || '';
        if (log.entity_type && log.entity_id) {
            description += (description ? ' | ' : '') + `${log.entity_type} (ID: ${log.entity_id})`;
        }
        
        row.innerHTML = `
            <td class="px-4 py-3" style="color: #1f2937; font-size: 14px;">${log.user_name || 'System'}</td>
            <td class="px-4 py-3" style="color: #1f2937; font-size: 14px;">
                <span style="display: inline-block; padding: 4px 8px; background: #e3f2fd; color: #1976d2; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${actionFormatted}
                </span>
            </td>
            <td class="px-4 py-3" style="color: #666; font-size: 13px;">${formattedDate}</td>
            <td class="px-4 py-3" style="color: #666; font-size: 13px;">${description || '-'}</td>
        `;
        
        logsTable.appendChild(row);
    });
}

function setupLogsSearchListener() {
    const searchInput = document.getElementById('logsSearchInput');
    if (!searchInput) {
        console.error('✗ logsSearchInput not found');
        return;
    }
    
    // Add event listener for real-time search
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filterActivityLogs(searchTerm);
        showLogsSuggestions(searchTerm);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== searchInput) {
            const dropdown = document.getElementById('logsSuggestionsDropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    });
    
    // Show suggestions on focus
    searchInput.addEventListener('focus', function() {
        const searchTerm = this.value.toLowerCase().trim();
        showLogsSuggestions(searchTerm, true);
    });
}

function filterActivityLogs(searchTerm) {
    if (!searchTerm || searchTerm === '') {
        // Display all logs if search term is empty, but apply action type filter if set
        if (selectedActionTypeFilter) {
            const filteredByAction = allActivityLogs.filter(log => 
                log.action_type === selectedActionTypeFilter
            );
            displayActivityLogs(filteredByAction);
        } else {
            displayActivityLogs(allActivityLogs);
        }
        return;
    }
    
    // Filter logs based on search term
    let filteredLogs = allActivityLogs.filter(log => {
        const userName = (log.user_name || '').toLowerCase();
        const actionType = (log.action_type || '').toLowerCase();
        
        // Search in user name and action type
        return userName.includes(searchTerm) || actionType.includes(searchTerm);
    });
    
    // Apply action type filter if selected
    if (selectedActionTypeFilter) {
        filteredLogs = filteredLogs.filter(log => 
            log.action_type === selectedActionTypeFilter
        );
    }
    
    displayActivityLogs(filteredLogs);
}

function populateActionTypeFilter() {
    const filterSelect = document.getElementById('actionTypeFilter');
    if (!filterSelect) {
        console.error('✗ actionTypeFilter not found');
        return;
    }
    
    // Get unique action types
    const actionTypes = new Set();
    allActivityLogs.forEach(log => {
        if (log.action_type) {
            actionTypes.add(log.action_type);
        }
    });
    
    // Sort action types
    const sortedActionTypes = Array.from(actionTypes).sort();
    
    // Clear existing options except the first one
    filterSelect.innerHTML = '<option value="">Select Action Type</option>';
    
    // Add action type options
    sortedActionTypes.forEach(actionType => {
        const option = document.createElement('option');
        option.value = actionType;
        
        // Format action type for display
        const formattedAction = actionType
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        option.textContent = formattedAction;
        filterSelect.appendChild(option);
    });
}

function applyActionTypeFilter(actionType) {
    selectedActionTypeFilter = actionType;
    
    // Get current search term
    const searchInput = document.getElementById('logsSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Reapply filters
    filterActivityLogs(searchTerm);
}

function showLogsSuggestions(searchTerm, showAll = false) {
    const dropdown = document.getElementById('logsSuggestionsDropdown');
    if (!dropdown) {
        console.error('✗ logsSuggestionsDropdown not found');
        return;
    }
    
    // Collect unique suggestions from logs
    const suggestions = new Set();
    let userSuggestions = [];
    let actionSuggestions = [];
    
    allActivityLogs.forEach(log => {
        const userName = (log.user_name || '').toLowerCase();
        const actionType = (log.action_type || '').toLowerCase();
        
        // If no search term or showAll is true, add all suggestions
        if (!searchTerm || showAll) {
            if (log.user_name && !userSuggestions.find(u => u.original === log.user_name)) {
                userSuggestions.push({
                    type: 'user',
                    text: log.user_name,
                    original: log.user_name
                });
            }
            
            const actionFormatted = log.action_type
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            
            if (!actionSuggestions.find(a => a.original === log.action_type)) {
                actionSuggestions.push({
                    type: 'action',
                    text: actionFormatted,
                    original: log.action_type
                });
            }
        } else {
            // Filter based on search term
            if (userName.includes(searchTerm) && !userSuggestions.find(u => u.original === log.user_name)) {
                userSuggestions.push({
                    type: 'user',
                    text: log.user_name,
                    original: log.user_name
                });
            }
            
            if (actionType.includes(searchTerm)) {
                const actionFormatted = log.action_type
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                
                if (!actionSuggestions.find(a => a.original === log.action_type)) {
                    actionSuggestions.push({
                        type: 'action',
                        text: actionFormatted,
                        original: log.action_type
                    });
                }
            }
        }
    });
    
    const suggestionsArray = [...userSuggestions, ...actionSuggestions];
    
    // Limit to 8 suggestions
    const limitedSuggestions = suggestionsArray.slice(0, 8);
    
    dropdown.innerHTML = '';
    
    if (limitedSuggestions.length === 0) {
        // Show "No suggestions" message
        const noSuggestionsItem = document.createElement('div');
        noSuggestionsItem.style.cssText = `
            padding: 12px 16px;
            color: #999;
            font-size: 13px;
            text-align: center;
        `;
        noSuggestionsItem.textContent = 'No suggestions';
        dropdown.appendChild(noSuggestionsItem);
        dropdown.style.display = 'block';
        return;
    }
    
    limitedSuggestions.forEach((suggestion, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.style.cssText = `
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s ease;
            font-size: 14px;
        `;
        
        if (suggestion.type === 'user') {
            suggestionItem.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; margin-right: 8px; vertical-align: middle; color: #6b7280;">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span style="color: #1f2937; font-weight: 500;">${suggestion.text}</span>
                <span style="color: #9ca3af; font-size: 12px; margin-left: 8px;">User</span>
            `;
        } else {
            suggestionItem.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; margin-right: 8px; vertical-align: middle; color: #6b7280;">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <span style="color: #1f2937; font-weight: 500;">${suggestion.text}</span>
                <span style="color: #9ca3af; font-size: 12px; margin-left: 8px;">Action</span>
            `;
        }
        
        suggestionItem.onmouseover = function() {
            this.style.backgroundColor = '#f3f4f6';
        };
        
        suggestionItem.onmouseout = function() {
            this.style.backgroundColor = 'transparent';
        };
        
        suggestionItem.onclick = function() {
            document.getElementById('logsSearchInput').value = suggestion.original;
            filterActivityLogs(suggestion.original.toLowerCase());
            dropdown.style.display = 'none';
        };
        
        // Remove border from last item
        if (index === limitedSuggestions.length - 1) {
            suggestionItem.style.borderBottom = 'none';
        }
        
        dropdown.appendChild(suggestionItem);
    });
    
    dropdown.style.display = 'block';
}



function loadActionTypes() { 
    console.log('✓ loadActionTypes() called');
    // This function is optional - it can be used to populate filters if needed
}

function loadCatalogue() {
    console.log('✓ loadCatalogue() called');
    const container = document.getElementById('catalogueGrid');
    if (!container) {
        console.error('✗ catalogueGrid not found');
        return;
    }
    
    container.innerHTML = '';
    
    console.log('📡 Fetching from:', `${API_BASE}/catalogue.php?action=list`);
    
    fetch(`${API_BASE}/catalogue.php?action=list`, {
        headers: getUserHeaders()
    })
        .then(response => {
            console.log('✓ Catalogue API response:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('✓ Catalogue data received:', data);
            console.log('  - Success:', data.success);
            console.log('  - Events count:', data.data?.length);
            console.log('  - Events:', data.data);
            if (data.success && data.data) {
                displayCatalogue(data.data);
            } else {
                throw new Error(data.message || 'Failed to load catalogue');
            }
        })
        .catch(error => {
            console.error('✗ Error loading catalogue:', error);
            container.innerHTML = `<div style="padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 4px; grid-column: 1/-1;">❌ Error loading catalogue: ${error.message}</div>`;
        });
}

let currentEventId = null;
let currentEventData = null;
let attendeesData = { initial: [], actual: [] };

let allTasks = [];

function searchUsers(query) { console.log('Searching users...'); }

// ================================================================================
// LOGOUT & AUTHENTICATION
// ================================================================================

function logout() {
    const logoutModal = document.getElementById('logoutConfirmModal');
    
    // If logout modal exists (on index.html), show it
    if (logoutModal) {
        logoutModal.style.display = 'block';
    } else {
        // Otherwise, proceed directly with logout (on other pages like event-details.html)
        confirmLogout();
    }
}

function closeLogoutConfirmModal() {
    const logoutModal = document.getElementById('logoutConfirmModal');
    if (logoutModal) {
        logoutModal.style.display = 'none';
    }
}

function confirmLogout() {
    const admin = JSON.parse(localStorage.getItem('admin') || 'null');
    
    if (admin && admin.admin_id) {
        fetch(`${API_BASE}/admin_login.php?action=logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: admin.admin_id })
        }).catch(error => console.log('Logout logged'));
    }
    
    // Log activity if function exists (only on index.html)
    if (typeof logActivity === 'function') {
        logActivity('LOGOUT', 'Admin logged out');
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    localStorage.removeItem('rememberAdmin');
    localStorage.removeItem('adminLastPage');
    localStorage.removeItem('token');
    
    // Redirect to login - use relative path for event-details.html, absolute for index.html
    const currentPath = window.location.pathname;
    if (currentPath.includes('event-details.html')) {
        window.location.href = 'login.html';
    } else {
        window.location.href = 'login.html';
    }
}

// Additional stub functions for coordinators and other features
function submitAddCoordinator() { console.log('Adding coordinator...'); }
function resetCoordinatorForm() { console.log('Resetting coordinator form...'); }
function submitAddPastEventForm() { console.log('Adding past event...'); }
function handleCoordinatorFormSubmit() { console.log('Handling coordinator form...'); }

// ================================================================================
// CRITICAL VARIABLE DECLARATIONS FOR HTML COMPATIBILITY
// ================================================================================

// Pagination variables
let participantsCurrentPage = 1;
let participantsPerPage = 10;
let participantsFilteredData = [];
let participantsTotalPages = 1;
let allParticipantsDataFull = [];
let currentDepartmentFilter = 'all';

// Admin/Users variables
let usersTotalPages = 1;
let usersTypeFilter = '';
let usersStatusFilter = '';

// Admins pagination variables
let allAdminsData = [];
let adminsCurrentPage = 1;
let adminsPerPage = 10;
let adminsFilteredData = [];
let adminsTotalPages = 1;

// Logs pagination variables
let allLogsData = [];
let logsCurrentPage = 1;
let logsPerPage = 10;
let logsFilteredData = [];
let logsTotalPages = 1;

// Catalogue variables
let allCatalogueData = [];
let currentCatalogueFilter = 'all';
let currentCatalogueSort = 'newest';

// Reports variables
let currentReportFilter = 'all';
let currentReportSort = 'name-asc';

// ================================================================================
// MINIMAL IMPLEMENTATIONS FOR CRITICAL FUNCTIONS
// Functions that are called from HTML but may not have full impl yet
// ================================================================================

function filterParticipants(filterType) {
    currentParticipantFilter = filterType;
    loadParticipants();
}

function sortParticipants(sortType) {
    currentParticipantSort = sortType;
    loadParticipants();
}

function filterParticipantsByDepartment(deptId) {
    currentDepartmentFilter = deptId;
    loadParticipants();
}

function nextPage() { if (participantsCurrentPage < participantsTotalPages) { participantsCurrentPage++; loadParticipants(); } }
function previousPage() { if (participantsCurrentPage > 1) { participantsCurrentPage--; loadParticipants(); } }
function goToParticipantsPage(pageNum) { participantsCurrentPage = pageNum; loadParticipants(); }
function changeRowsPerPage(newValue) { participantsPerPage = parseInt(newValue); participantsCurrentPage = 1; loadParticipants(); }

function usersNextPage() { if (usersCurrentPage < usersTotalPages) { usersCurrentPage++; loadAllUsers(); } }
function usersPreviousPage() { if (usersCurrentPage > 1) { usersCurrentPage--; loadAllUsers(); } }
function  goToUsersPage(pageNum) { usersCurrentPage = pageNum; loadAllUsers(); }
function changeUsersRowsPerPage(newValue) { usersPerPage = parseInt(newValue); usersCurrentPage = 1; loadAllUsers(); }

function adminsNextPage() { if (adminsCurrentPage < adminsTotalPages) { adminsCurrentPage++; loadAdmins(); } }
function adminsPreviousPage() { if (adminsCurrentPage > 1) { adminsCurrentPage--; loadAdmins(); } }
function goToAdminsPage(pageNum) { adminsCurrentPage = pageNum; loadAdmins(); }
function changeAdminsRowsPerPage(newValue) { adminsPerPage = parseInt(newValue); adminsCurrentPage = 1; loadAdmins(); }

function logsNextPage() { if (logsCurrentPage < logsTotalPages) { logsCurrentPage++; loadActivityLogs(); } }
function logsPreviousPage() { if (logsCurrentPage > 1) { logsCurrentPage--; loadActivityLogs(); } }
function goToLogsPage(pageNum) { logsCurrentPage = pageNum; loadActivityLogs(); }
function changeLogsRowsPerPage(newValue) { logsPerPage = parseInt(newValue); logsCurrentPage = 1; loadActivityLogs(); }

function filterReports(filterType) { currentReportFilter = filterType; loadReports(); }
function sortReports(sortType) { currentReportSort = sortType; loadReports(); }

function openAddCoordinatorModal() { document.getElementById('addCoordinatorModal')?.style && (document.getElementById('addCoordinatorModal').style.display = 'block'); }
function closeAddCoordinatorModal() { document.getElementById('addCoordinatorModal')?.style && (document.getElementById('addCoordinatorModal').style.display = 'none'); }  

function openEditAdminModalById(userId) { openEditAdminModal(userId, '', '', 'active', ''); }

function loadEventsForDropdown(selectId) { loadCoordinatorsDropdown(selectId); }

// DashboardManager polyfill for index.html compatibility  
const DashboardManager = {
    switchPage: function(page) { navigateToPage(page); },
    previousMonth: function() { previousMonth(); },
    nextMonth: function() { nextMonth(); },
    goToToday: function() { goToToday(); },
    switchCalendarView: function(view) { switchCalendarView(view); },
    selectEventDetails: function(eventId) { openEventDetailsModal(eventId); },
    closeEventDetailsModal: function() { 
        const modal = document.getElementById('eventDetailsModal');
        if (modal) modal.classList.remove('active');
    }
};

// Handle sidebar loading for all pages
function loadSidebar() {
    if (!document.getElementById('sidebarContainer')) {
        console.warn('Sidebar container not found');
        return;
    }
    loadSidebarNavigation().catch(err => console.warn('Sidebar load issue:', err));
}

// Show error messages
function showError(message) {
    showNotification('Error: ' + message, 'error');
}

// ================================================================================
// RENDER/DISPLAY STUB FUNCTIONS
// ================================================================================

function renderCatalogueDisplay(events) { renderCatalogue(events); }
function renderCatalogueHTML(events) { 
    renderCatalogue(events);
}

function filterCatalogueByType(events) { return currentCatalogueFilter === 'all' ? events : events.filter(e => currentCatalogueFilter === 'public' ? !e.is_private : e.is_private); }
function sortCatalogueArray(events) { return [...events]; }

function renderReportsDisplay(reports) { 
    const container = document.getElementById('reportsContainer');
    if (container) container.innerHTML = '<p>Reports loading...</p>';
}

function filterReportsByType(reports) { return reports; }
function sortReportsArray(reports) { return reports; }

// Export function stub  
function downloadAllReportsData() { showNotification('Report download feature available soon', 'info'); }

// Sidebar navigation helper
function loadSidebarNavigationFromFiles() { return loadSidebarNavigation(); }

// Catalogue functions
function filterCatalogue(type) { currentCatalogueFilter = type; loadCatalogue(); }
function sortCatalogue(type) { currentCatalogueSort = type; loadCatalogue(); }

function displayCatalogue(events) {
    allCatalogueData = events;
    renderCatalogue(sortCatalogueArray(filterCatalogueByType(events)));
}

function filterCatalogueByType(events) {
    if (currentCatalogueFilter === 'public') {
        return events.filter(e => e.is_private != 1);
    } else if (currentCatalogueFilter === 'private') {
        return events.filter(e => e.is_private == 1);
    }
    return events;
}

function sortCatalogueArray(events) {
    const sorted = [...events];
    
    if (currentCatalogueSort === 'newest') {
        sorted.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    } else if (currentCatalogueSort === 'oldest') {
        sorted.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    } else if (currentCatalogueSort === 'name-asc') {
        sorted.sort((a, b) => (a.event_name || '').localeCompare(b.event_name || ''));
    } else if (currentCatalogueSort === 'name-desc') {
        sorted.sort((a, b) => (b.event_name || '').localeCompare(a.event_name || ''));
    }
    
    return sorted;
}

function renderCatalogue(events) {
    console.log('✓ renderCatalogue() called with', events.length, 'events');
    
    const container = document.getElementById('catalogueGrid');
    
    if (!container) {
        console.error('✗ catalogueGrid not found');
        return;
    }
    
    if (!events || events.length === 0) {
        console.log('ℹ No catalogue events to display');
        container.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1; padding: 50px;">No events in catalogue yet.</p>';
        return;
    }
    
    console.log('📊 Rendering', events.length, 'catalogue events');
    console.log('   Sample event:', events[0]);
    
    const html = events.map(event => {
        const imageUrl = event.image_url ? getImageUrl(event.image_url) : null;
        const eventDate = new Date(event.event_date);
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const month = monthNames[eventDate.getMonth()];
        const day = eventDate.getDate();
        const year = eventDate.getFullYear();
        const formattedDate = `${month} ${day}, ${year}`;
        
        const badgeColor = event.is_private == 1 ? '#fecaca' : '#dbeafe';
        const badgeTextColor = event.is_private == 1 ? '#991b1b' : '#1d4ed8';
        const badgeText = event.is_private == 1 ? 'Private' : 'Public';
        const uniqueId = `menu-${event.catalogue_id}`;
        
        return `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:scale-[1.02] catalogue-event-card" 
             style="cursor: default;">
            <div class="h-40 bg-cover bg-center bg-gray-100 relative" style="${imageUrl ? `background-image:url('${imageUrl}');` : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'}">
                <button class="absolute top-4 right-4 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-slate-100 transition shadow-md" style="border: none; cursor: pointer; padding: 0;" onclick="event.stopPropagation(); toggleCatalogueMenu('${uniqueId}')" title="Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: #374151;"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </button>
                <div id="${uniqueId}" class="hidden absolute top-14 right-4 bg-white rounded-lg shadow-lg border border-gray-200 w-64 z-50" style="min-width: 240px;">
                    <button class="w-full text-left px-4 py-2 hover:bg-gray-100 transition text-sm font-medium text-gray-700 border-b border-gray-100" onclick="event.stopPropagation(); editEventCover(${event.catalogue_id}, '${event.event_name.replace(/'/g, "\\'") }'); setTimeout(() => closeCatalogueMenu('${uniqueId}'), 50);" style="border: none; text-decoration: none;">
                        <i class="bi bi-image" style="margin-right: 8px;"></i>Change Event cover
                    </button>
                    <button class="w-full text-left px-4 py-2 hover:bg-gray-100 transition text-sm font-medium text-gray-700 border-b border-gray-100" onclick="event.stopPropagation(); openEditGalleryModal(${event.catalogue_id}, '${event.event_name.replace(/'/g, "\\'") }'); setTimeout(() => closeCatalogueMenu('${uniqueId}'), 50);" style="border: none; text-decoration: none;">
                        <i class="bi bi-collection" style="margin-right: 8px;"></i>Edit event gallery
                    </button>
                    <button class="w-full text-left px-4 py-2 hover:bg-red-50 transition text-sm font-medium text-red-600" onclick="event.stopPropagation(); CatalogueManager.showRemoveConfirmation(${event.catalogue_id}, '${event.event_name.replace(/'/g, "\\'") }'); setTimeout(() => closeCatalogueMenu('${uniqueId}'), 50);" style="border: none; text-decoration: none;">
                        <i class="bi bi-trash" style="margin-right: 8px;"></i>Remove
                    </button>
                </div>
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <h3 class="text-lg font-semibold text-gray-900">${event.event_name}</h3>
                <div class="mt-2 text-sm text-slate-500 space-y-1">
                    <div style="display: flex; align-items: center; gap: 6px;"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="none" stroke="#64748b" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm12-4v4M8 3v4m-4 4h16m-9 4h1m0 0v3"/></svg> ${formattedDate}</div>
                    ${event.location && event.location !== 'undefined' && event.location !== 'null' && event.location.trim() ? `<div style="display: flex; align-items: center; gap: 6px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="#64748b" d="M16 10c0-2.21-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4m-6 0c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2"/><path fill="#64748b" d="M11.42 21.81c.17.12.38.19.58.19s.41-.06.58-.19c.3-.22 7.45-5.37 7.42-11.82c0-4.41-3.59-8-8-8s-8 3.59-8 8c-.03 6.44 7.12 11.6 7.42 11.82M12 4c3.31 0 6 2.69 6 6c.02 4.44-4.39 8.43-6 9.74c-1.61-1.31-6.02-5.29-6-9.74c0-3.31 2.69-6 6-6"/></svg> ${event.location}</div>` : ''}
                </div>
                <p class="mt-3 text-sm text-slate-600 line-clamp-3">${event.description || 'No description provided'}</p>
            </div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    console.log('✓ Catalogue rendered to container');
    
    // Attach dropdown menu handlers after rendering
    attachCatalogueDropdownHandlers();
}

// Handle catalogue dropdown menu behavior
function attachCatalogueDropdownHandlers() {
    const menus = document.querySelectorAll('[id^="menu-"]');
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        // Check if click is outside all menus and buttons
        if (!e.target.closest('[id^="menu-"]') && !e.target.closest('svg')) {
            menus.forEach(menu => menu.classList.add('hidden'));
        }
    });
}

// Toggle a specific catalogue menu
function toggleCatalogueMenu(menuId) {
    const clickedMenu = document.getElementById(menuId);
    if (!clickedMenu) return;
    
    // Close all other menus
    document.querySelectorAll('[id^="menu-"]').forEach(menu => {
        if (menu.id !== menuId) {
            menu.classList.add('hidden');
        }
    });
    
    // Toggle current menu
    clickedMenu.classList.toggle('hidden');
}

// Close catalogue dropdown menu
function closeCatalogueMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.add('hidden');
    }
}

const CatalogueManager = {
    isAddManyMode: false,
    selectedEventIds: new Set(),
    allPastEvents: [],
    
    refreshCatalogue: function() {
        loadCatalogue();
    },
    
    openLookupModal: function() {
        const modal = document.getElementById('lookupEventsModal');
        if (modal) {
            modal.classList.add('active');
            this.loadPastEvents();
        }
    },
    
    closeLookupModal: function() {
        const modal = document.getElementById('lookupEventsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    loadPastEvents: function() {
        console.log('Loading past events for catalogue...');
        const container = document.getElementById('lookupEventsContainer');
        if (!container) return;
        
        container.innerHTML = '<p class="text-center text-gray-500 py-4">Loading past events...</p>';
        
        fetch(`${API_BASE}/catalogue.php?action=lookup`, {
            headers: getUserHeaders()
        })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    this.allPastEvents = data.data;
                    this.renderPastEventsList(data.data);
                } else {
                    container.innerHTML = '<p class="text-center text-gray-500 py-4">No past events available</p>';
                }
            })
            .catch(error => {
                console.error('Error loading past events:', error);
                container.innerHTML = '<p class="text-center text-red-500 py-4">Error loading events</p>';
            });
    },
    
    renderPastEventsList: function(events) {
        const container = document.getElementById('lookupEventsContainer');
        if (!container) return;
        
        const html = events.map(event => {
            const eventDate = new Date(event.event_date);
            const formattedDate = eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const startTime = event.start_time ? event.start_time.substring(0, 5) : '9:00 AM';
            const endTime = event.end_time ? event.end_time.substring(0, 5) : '10:30 AM';
            const eventImage = event.image_url ? getImageUrl(event.image_url) : null;
            // Determine which ID to use (event_id for new/non-manual events, catalogue_id for manual)
            const eventId = event.event_id || event.catalogue_id;
            const buttonOnClick = `CatalogueManager.addEventToCatalogue(${eventId}, '${event.event_name.replace(/'/g, "\\'")}')`; 
            const buttonText = 'Add';
            
            // Determine action element (button or checkbox)
            let actionElement = '';
            if (this.isAddManyMode) {
                const isChecked = this.selectedEventIds.has(eventId);
                actionElement = `
                    <input 
                        type="checkbox" 
                        id="event-checkbox-${eventId}"
                        onchange="CatalogueManager.toggleEventSelection(${eventId}, '${event.event_name.replace(/'/g, "\\'")}')"
                        ${isChecked ? 'checked' : ''}
                        style="width: 24px; height: 24px; cursor: pointer; flex-shrink: 0; accent-color: #1E73BB;"
                    >
                `;
            } else {
                actionElement = `<button onclick="${buttonOnClick}" style="padding: 8px 18px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; height: fit-content;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">${buttonText}</button>`;
            }
            
            return `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; display: flex; gap: 16px; padding: 12px; background: white; transition: all 0.2s; align-items: center;" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'" data-event-name="${event.event_name}" data-event-location="${event.location || ''}">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 36px; overflow: hidden; background-image: ${eventImage ? `url('${eventImage}')` : 'none'}; background-size: cover; background-position: center;">${!eventImage ? '📷' : ''}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: #1f2937; margin-bottom: 4px; font-size: 14px;">${event.event_name}</div>
                    <div style="font-size: 13px; color: #6b7280; margin-bottom: 2px;">${formattedDate} · ${startTime} to ${endTime}</div>
                    ${event.location ? `<div style="font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 6px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#6b7280" d="M16 10c0-2.21-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4m-6 0c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2"/><path fill="#6b7280" d="M11.42 21.81c.17.12.38.19.58.19s.41-.06.58-.19c.3-.22 7.45-5.37 7.42-11.82c0-4.41-3.59-8-8-8s-8 3.59-8 8c-.03 6.44 7.12 11.6 7.42 11.82M12 4c3.31 0 6 2.69 6 6c.02 4.44-4.39 8.43-6 9.74c-1.61-1.31-6.02-5.29-6-9.74c0-3.31 2.69-6 6-6"/></svg>${event.location}</div>` : ''}
                </div>
                ${actionElement}
            </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    },
    
    filterPastEvents: function() {
        const searchInput = document.getElementById('eventSearchInput');
        if (!searchInput) return;
        
        const query = searchInput.value.trim().toLowerCase();
        const eventsContainer = document.getElementById('lookupEventsContainer');
        if (!eventsContainer) return;
        
        const items = eventsContainer.querySelectorAll('[data-event-name]');
        items.forEach(item => {
            const eventName = item.getAttribute('data-event-name').toLowerCase();
            const eventLocation = item.getAttribute('data-event-location').toLowerCase();
            const matches = eventName.includes(query) || eventLocation.includes(query);
            item.style.display = matches ? '' : 'none';
        });
    },
    
    republishManualEvent: function(catalogueId, eventName) {
        console.log('Republishing manual event:', catalogueId);
        
        fetch(`${API_BASE}/catalogue.php`, {
            method: 'POST',
            headers: { ...getUserHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'republish',
                catalogue_id: catalogueId
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification(eventName + ' is now published!', 'success');
                    this.closeLookupModal();
                    loadCatalogue();
                } else {
                    showNotification('Error: ' + (data.message || 'Failed to republish event'), 'error');
                }
            })
            .catch(error => {
                console.error('Error republishing event:', error);
                showNotification('Error republishing event', 'error');
            });
    },
    
    addEventToCatalogue: function(eventId) {
        console.log('Adding event', eventId, 'to catalogue...');
        
        const formData = new FormData();
        formData.append('action', 'add_with_image');
        formData.append('event_id', eventId);
        
        // Get auth headers but remove Content-Type so FormData can set it with boundary
        const headers = getUserHeaders();
        delete headers['Content-Type'];
        
        fetch(`${API_BASE}/catalogue.php`, {
            method: 'POST',
            headers: headers,
            body: formData
        })
            .then(response => {
                console.log('API response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('API response:', data);
                if (data.success) {
                    showNotification('Event added to catalogue!', 'success');
                    this.closeLookupModal();
                    loadCatalogue();
                } else {
                    showNotification('Error: ' + (data.message || 'Failed to add event'), 'error');
                }
            })
            .catch(error => {
                console.error('Error adding event:', error);
                showNotification('Error adding event to catalogue', 'error');
            });
    },
    
    showRemoveConfirmation: function(catalogueId, eventName) {
        // Create modal HTML
        const modalHTML = `
            <div id="removeConfirmationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div class="px-6 py-6">
                        <h2 class="text-lg font-semibold text-gray-900 mb-2">Remove Event</h2>
                        <p class="text-gray-600">Are you sure you want to remove <strong>${eventName}</strong> from catalogue?</p>
                    </div>
                    <div class="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
                        <button onclick="document.getElementById('removeConfirmationModal')?.remove()" 
                                class="px-4 py-2 rounded-lg text-gray-700 border border-gray-300 font-medium hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button onclick="CatalogueManager.removeEvent(${catalogueId}); document.getElementById('removeConfirmationModal')?.remove()" 
                                class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Add click handler for outside modal
        document.getElementById('removeConfirmationModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'removeConfirmationModal') {
                e.target.remove();
            }
        });
    },
    
    removeEvent: function(catalogueId) {
        console.log('Removing catalogue event', catalogueId);
        
        fetch(`${API_BASE}/catalogue.php`, {
            method: 'POST',
            headers: { ...getUserHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'remove',
                catalogue_id: catalogueId
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Event removed from catalogue', 'success');
                    loadCatalogue();
                } else {
                    showNotification('Error: ' + (data.message || 'Failed to remove event'), 'error');
                }
            })
            .catch(error => {
                console.error('Error removing event:', error);
                showNotification('Error removing event', 'error');
            });
    },
    
    viewEvent: function(catalogueId) {
        const event = allCatalogueData.find(e => e.catalogue_id == catalogueId);
        if (event) {
            console.log('Viewing catalogue event:', event);
            showNotification('Event: ' + event.event_name, 'info');
        }
    },
    
    // Add event to catalogue directly without modal
    addEventToCatalogue: function(eventId, eventName) {
        console.log('📤 Adding event to catalogue:', { eventId, eventName });
        
        const formData = new FormData();
        formData.append('action', 'add_with_image');
        
        // Send the ID as both catalogue_id and event_id - the API will use whichever one applies
        // For regular events, event_id will be used; for manually added events, catalogue_id will be used
        formData.append('event_id', eventId);
        formData.append('catalogue_id', eventId);
        
        const headers = getUserHeaders();
        delete headers['Content-Type'];
        
        fetch(`${API_BASE}/catalogue.php`, {
            method: 'POST',
            headers: headers,
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Event "' + eventName + '" added to catalogue!', 'success');
                    CatalogueManager.closeLookupModal();
                    console.log('🔄 Refreshing catalogue...');
                    loadCatalogue();
                } else {
                    showNotification('Error: ' + (data.message || 'Failed to add event'), 'error');
                }
            })
            .catch(error => {
                console.error('❌ Error adding event:', error);
                showNotification('Error adding event to catalogue: ' + error.message, 'error');
            });
    },
    
    // Open image modal for managing event gallery
    
    // Toggle "Add Many" mode
    toggleAddMany: function() {
        this.isAddManyMode = !this.isAddManyMode;
        
        if (this.isAddManyMode) {
            // Entering Add Many mode
            this.selectedEventIds.clear();
            document.getElementById('addManyToggleLink').style.opacity = '0.7';
            document.getElementById('selectedCountDiv').style.display = 'flex';
            document.getElementById('addManyButtonsDiv').style.display = 'flex';
            document.getElementById('selectedCount').textContent = '0';
        } else {
            // Exiting Add Many mode
            this.selectedEventIds.clear();
            document.getElementById('addManyToggleLink').style.opacity = '1';
            document.getElementById('selectedCountDiv').style.display = 'none';
            document.getElementById('addManyButtonsDiv').style.display = 'none';
            document.getElementById('confirmAddManyBtn').disabled = true;
            document.getElementById('confirmAddManyBtn').style.opacity = '0.5';
            document.getElementById('cancelAddManyBtn').disabled = true;
            document.getElementById('cancelAddManyBtn').style.opacity = '0.5';
        }
        
        // Re-render events list with new mode
        this.renderPastEventsList(this.allPastEvents);
    },
    
    // Toggle event selection in Add Many mode
    toggleEventSelection: function(eventId, eventName) {
        if (this.selectedEventIds.has(eventId)) {
            this.selectedEventIds.delete(eventId);
        } else {
            this.selectedEventIds.add(eventId);
        }
        
        // Update selected count display
        document.getElementById('selectedCount').textContent = this.selectedEventIds.size;
        
        // Enable/disable buttons based on selection
        const hasSelection = this.selectedEventIds.size > 0;
        const confirmBtn = document.getElementById('confirmAddManyBtn');
        const cancelBtn = document.getElementById('cancelAddManyBtn');
        
        confirmBtn.disabled = !hasSelection;
        confirmBtn.style.opacity = hasSelection ? '1' : '0.5';
        confirmBtn.style.cursor = hasSelection ? 'pointer' : 'not-allowed';
        
        cancelBtn.disabled = !hasSelection;
        cancelBtn.style.opacity = hasSelection ? '1' : '0.5';
        cancelBtn.style.cursor = hasSelection ? 'pointer' : 'not-allowed';
    },
    
    // Confirm and add all selected events
    confirmAddMany: function() {
        if (this.selectedEventIds.size === 0) {
            showNotification('Please select at least one event', 'error');
            return;
        }
        
        const selectedIds = Array.from(this.selectedEventIds);
        const selectedEvents = this.allPastEvents.filter(event => {
            const eventId = event.event_id || event.catalogue_id;
            return selectedIds.includes(eventId);
        });
        
        console.log('Adding', selectedEvents.length, 'events to catalogue');
        
        // Show loading state
        const confirmBtn = document.getElementById('confirmAddManyBtn');
        const cancelBtn = document.getElementById('cancelAddManyBtn');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        confirmBtn.textContent = '⏳ Adding...';
        
        // Add all events one by one
        let completed = 0;
        let failed = 0;
        const self = this;  // Capture 'this' context for use in promises
        
        selectedEvents.forEach((event, index) => {
            const eventId = event.event_id || event.catalogue_id;
            
            const formData = new FormData();
            formData.append('action', 'add_with_image');
            formData.append('event_id', eventId);
            formData.append('catalogue_id', eventId);
            
            const headers = getUserHeaders();
            delete headers['Content-Type'];
            
            fetch(`${API_BASE}/catalogue.php`, {
                method: 'POST',
                headers: headers,
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        completed++;
                    } else {
                        failed++;
                    }
                    
                    // Check if all requests are done
                    if (completed + failed === selectedEvents.length) {
                        console.log('✅ All Add Many requests completed');
                        
                        // Restore button
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = originalText;
                        confirmBtn.style.opacity = '1';
                        cancelBtn.disabled = false;
                        
                        // Show result notification
                        if (failed === 0) {
                            showNotification(completed + ' event(s) added to catalogue!', 'success');
                        } else {
                            showNotification(completed + ' added, ' + failed + ' failed', 'error');
                        }
                        
                        // Close the lookup modal BEFORE calling cancelAddMany
                        console.log('🔴 Attempting to close lookup modal from Add Many');
                        const modal = document.getElementById('lookupEventsModal');
                        console.log('Modal found:', !!modal, 'Modal classes:', modal ? modal.className : 'N/A');
                        if (modal) {
                            modal.classList.remove('active');
                            console.log('✅ Modal closed, new classes:', modal.className);
                        }
                        
                        // Reset and refresh - this must come after modal close
                        setTimeout(() => {
                            self.cancelAddMany();
                            loadCatalogue();
                        }, 100);
                    }
                })
                .catch(error => {
                    failed++;
                    console.error('Error adding event:', error);
                    
                    if (completed + failed === selectedEvents.length) {
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = originalText;
                        confirmBtn.style.opacity = '1';
                        cancelBtn.disabled = false;
                        showNotification('Error adding events', 'error');
                        
                        // Close the lookup modal
                        console.log('🔴 Attempting to close lookup modal from Add Many (error)');
                        const modal = document.getElementById('lookupEventsModal');
                        if (modal) {
                            modal.classList.remove('active');
                        }
                        
                        setTimeout(() => {
                            self.cancelAddMany();
                        }, 100);
                    }
                });
        });
    },
    
    // Cancel Add Many mode
    cancelAddMany: function() {
        this.isAddManyMode = false;
        this.selectedEventIds.clear();
        
        document.getElementById('addManyToggleLink').style.opacity = '1';
        document.getElementById('addManyToggleLink').style.pointerEvents = 'auto';
        document.getElementById('selectedCountDiv').style.display = 'none';
        document.getElementById('addManyButtonsDiv').style.display = 'none';
        document.getElementById('selectedCount').textContent = '0';
        
        // Disable buttons
        const confirmBtn = document.getElementById('confirmAddManyBtn');
        const cancelBtn = document.getElementById('cancelAddManyBtn');
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
        confirmBtn.style.cursor = 'not-allowed';
        cancelBtn.disabled = true;
        cancelBtn.style.opacity = '0.5';
        cancelBtn.style.cursor = 'not-allowed';
        
        // Re-render events list
        this.renderPastEventsList(this.allPastEvents);
    }
};

// Edit event cover image
function editEventCover(catalogueId, eventName) {
    console.log('Editing event cover for:', { catalogueId, eventName });
    
    // Set the hidden fields
    document.getElementById('editCoverCatalogueId').value = catalogueId;
    document.getElementById('editCoverEventName').value = eventName;
    
    // Reset the form
    document.getElementById('editCoverImageInput').value = '';
    document.getElementById('editCoverImagePreview').innerHTML = `
        <svg style="width: 48px; height: 48px; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span>Click to upload or drag & drop</span>
    `;
    
    // Show the modal
    document.getElementById('editEventCoverModal').classList.add('active');
    
    // Setup drag and drop for the preview area
    const previewArea = document.getElementById('editCoverImagePreview');
    previewArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        previewArea.style.borderColor = '#3b82f6';
        previewArea.style.backgroundColor = '#f0f4f8';
    });
    
    previewArea.addEventListener('dragleave', () => {
        previewArea.style.borderColor = '#cbd5e1';
        previewArea.style.backgroundColor = 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)';
    });
    
    previewArea.addEventListener('drop', (e) => {
        e.preventDefault();
        previewArea.style.borderColor = '#cbd5e1';
        previewArea.style.backgroundColor = 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            document.getElementById('editCoverImageInput').files = files;
            previewEditCoverImage({ target: { files: files } });
        }
    });
}

// Close edit event cover modal
function closeEditEventCoverModal() {
    document.getElementById('editEventCoverModal').classList.remove('active');
}

// Preview the selected cover image
function previewEditCoverImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showNotification('Image size must be less than 5MB', 'error');
        document.getElementById('editCoverImageInput').value = '';
        return;
    }
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewArea = document.getElementById('editCoverImagePreview');
        previewArea.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
        previewArea.style.backgroundColor = '#fff';
    };
    
    reader.readAsDataURL(file);
}

// Submit the edit cover form
function submitEditEventCover() {
    const catalogueId = document.getElementById('editCoverCatalogueId').value;
    const eventName = document.getElementById('editCoverEventName').value;
    const fileInput = document.getElementById('editCoverImageInput');
    
    if (!catalogueId) {
        showNotification('Missing event information', 'error');
        return;
    }
    
    if (!fileInput.files[0]) {
        showNotification('Please select an image to upload', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('catalogue_id', catalogueId);
    formData.append('action', 'update_cover');
    formData.append('cover_image', file);
    
    // Get user headers
    const headers = getUserHeaders ? getUserHeaders() : {};
    const fetchOptions = {
        method: 'POST',
        body: formData
    };
    
    // Add custom headers for authorization (exclude Content-Type for FormData)
    const customHeaders = {};
    if (headers['X-User-Role']) customHeaders['X-User-Role'] = headers['X-User-Role'];
    if (headers['X-User-Id']) customHeaders['X-User-Id'] = headers['X-User-Id'];
    if (headers['X-Coordinator-Id']) customHeaders['X-Coordinator-Id'] = headers['X-Coordinator-Id'];
    if (headers['Authorization']) customHeaders['Authorization'] = headers['Authorization'];
    if (headers['X-Admin-Token']) customHeaders['X-Admin-Token'] = headers['X-Admin-Token'];
    
    if (Object.keys(customHeaders).length > 0) {
        fetchOptions.headers = customHeaders;
    }
    
    // Send the upload request
    fetch(`${API_BASE}/catalogue.php`, fetchOptions)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Event cover updated successfully!', 'success');
                closeEditEventCoverModal();
                // Reload the catalogue to show the updated cover
                loadCatalogue();
            } else {
                showNotification('Error: ' + (data.message || data.error || 'Failed to update cover'), 'error');
            }
        })
        .catch(error => {
            console.error('Error uploading cover:', error);
            showNotification('Error uploading cover image: ' + error.message, 'error');
        });
}

// Store gallery files for edit gallery modal
let editGalleryFilesStore = [];
let editGalleryExistingImages = []; // Track existing images from database

// Open edit event gallery modal
function openEditGalleryModal(catalogueId, eventName) {
    console.log('Opening edit gallery modal for:', { catalogueId, eventName });
    
    document.getElementById('editGalleryCatalogueId').value = catalogueId;
    document.getElementById('editGalleryEventName').value = eventName;
    
    // Reset the form and gallery
    document.getElementById('editGalleryImageInput').value = '';
    editGalleryFilesStore = [];
    editGalleryExistingImages = [];
    
    const container = document.getElementById('editGalleryImagesContainer');
    const plusBox = document.getElementById('editGalleryPlusBox');
    
    // Remove all existing image divs (keep only the plus box)
    const imageElements = container.querySelectorAll('div[style*="aspect-ratio"], div[style*="position: relative"]');
    imageElements.forEach(el => el.remove());
    
    // Show the plus box
    plusBox.style.display = 'flex';
    
    // Show the modal
    document.getElementById('editEventGalleryModal').classList.add('active');
    
    // Fetch existing gallery images
    fetch(`${API_BASE}/catalogue.php?action=get_gallery&catalogue_id=${catalogueId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            console.log('Gallery fetch response:', data);
            if (data.success && data.data && Array.isArray(data.data)) {
                editGalleryExistingImages = data.data;
                displayExistingGalleryImages(data.data);
                
                // Hide plus box if already have 5 images
                if (data.data.length >= 5) {
                    document.getElementById('editGalleryPlusBox').style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching gallery images:', error);
        });
}

// Display existing gallery images
function displayExistingGalleryImages(images) {
    if (!images || images.length === 0) return;
    
    const container = document.getElementById('editGalleryImagesContainer');
    const plusBox = document.getElementById('editGalleryPlusBox');
    
    images.forEach(image => {
        const imageDiv = document.createElement('div');
        imageDiv.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; background: #f0f0f0; aspect-ratio: 1; width: 100px; height: 100px;';
        imageDiv.innerHTML = `
            <img src="${getImageUrl(image.image_url)}" alt="Gallery image" style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" onclick="removeExistingGalleryImage(${image.image_id})" 
                    style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">×</button>
        `;
        container.insertBefore(imageDiv, plusBox);
    });
}

// Close edit gallery modal
function closeEditGalleryModal() {
    document.getElementById('editEventGalleryModal').classList.remove('active');
}

// Preview gallery images for edit modal
function previewEditGalleryImages(event) {
    const files = event.target.files;
    const container = document.getElementById('editGalleryImagesContainer');
    const plusBox = document.getElementById('editGalleryPlusBox');
    
    if (!files || files.length === 0) {
        return;
    }
    
    // Count existing images (excluding plus box)
    const existingImages = container.children.length - 1; // -1 for plus box
    const remainingSlots = 5 - existingImages;
    
    if (remainingSlots <= 0) {
        showNotification('Maximum 5 images allowed for the gallery.', 'error');
        event.target.value = '';
        return;
    }
    
    // Only process up to remaining slots
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    
    filesToAdd.forEach((file) => {
        // Store the actual file object
        editGalleryFilesStore.push(file);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDiv = document.createElement('div');
            imageDiv.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; background: #f0f0f0; aspect-ratio: 1; width: 100px; height: 100px;';
            imageDiv.innerHTML = `
                <img src="${e.target.result}" alt="Gallery image" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" onclick="removeEditGalleryImage(this, '${file.name}')" 
                        style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">×</button>
            `;
            // Insert before the plus box
            container.insertBefore(imageDiv, plusBox);
        };
        reader.readAsDataURL(file);
    });
    
    // Check if max images reached
    const newImageCount = existingImages + filesToAdd.length;
    if (newImageCount >= 5) {
        plusBox.style.display = 'none';
    }
    
    // Reset the file input
    event.target.value = '';
}

// Remove image from edit gallery
function removeEditGalleryImage(btn, fileName) {
    btn.parentElement.remove();
    // Remove from gallery files store
    editGalleryFilesStore = editGalleryFilesStore.filter(f => f.name !== fileName);
    
    // Show plus button if we're below max
    const container = document.getElementById('editGalleryImagesContainer');
    const plusBox = document.getElementById('editGalleryPlusBox');
    
    // Count images (excluding plus box)
    const imageCount = container.children.length - 1;
    if (imageCount < 5) {
        plusBox.style.display = 'flex';
    }
}

// Remove existing gallery image from database
function removeExistingGalleryImage(imageId) {
    window.pendingGalleryImageId = imageId;
    document.getElementById('removeExistingGalleryImageModal').classList.add('active');
}

function closeRemoveGalleryImageModal() {
    document.getElementById('removeExistingGalleryImageModal').classList.remove('active');
    window.pendingGalleryImageId = null;
}

function confirmRemoveGalleryImage() {
    const imageId = window.pendingGalleryImageId;
    closeRemoveGalleryImageModal();
    
    const catalogueId = document.getElementById('editGalleryCatalogueId').value;
    
    fetch(`${API_BASE}/catalogue.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getUserHeaders()
        },
        body: JSON.stringify({
            action: 'delete_gallery_image',
            image_id: imageId,
            catalogue_id: catalogueId
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Image deleted successfully', 'success');
                // Remove from DOM
                const container = document.getElementById('editGalleryImagesContainer');
                const imageDiv = Array.from(container.querySelectorAll('div')).find(div => 
                    div.innerHTML.includes(`onclick="removeExistingGalleryImage(${imageId})`)
                );
                if (imageDiv) imageDiv.remove();
                
                // Show plus button if we're below max
                const plusBox = document.getElementById('editGalleryPlusBox');
                const imageCount = container.children.length - 1;
                if (imageCount < 5) {
                    plusBox.style.display = 'flex';
                }
            } else {
                showNotification('Error deleting image: ' + (data.message || data.error), 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting image:', error);
            showNotification('Error deleting image', 'error');
        });
}

// Submit edit gallery images
function submitEditGalleryImages() {
    const catalogueId = document.getElementById('editGalleryCatalogueId').value;
    const eventName = document.getElementById('editGalleryEventName').value;
    
    if (!catalogueId) {
        showNotification('Missing event information', 'error');
        return;
    }
    
    // If no new images to add, just close the modal
    if (editGalleryFilesStore.length === 0) {
        showNotification('No new images to upload', 'info');
        closeEditGalleryModal();
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'add_gallery');
    formData.append('catalogue_id', catalogueId);
    
    // Add gallery images
    editGalleryFilesStore.forEach((file, index) => {
        formData.append(`gallery_images[${index}]`, file);
    });
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    const fetchOptions = {
        method: 'POST',
        body: formData
    };
    
    // Add custom headers for authorization (exclude Content-Type for FormData)
    const customHeaders = {};
    if (headers['X-User-Role']) customHeaders['X-User-Role'] = headers['X-User-Role'];
    if (headers['X-User-Id']) customHeaders['X-User-Id'] = headers['X-User-Id'];
    if (headers['X-Coordinator-Id']) customHeaders['X-Coordinator-Id'] = headers['X-Coordinator-Id'];
    if (headers['Authorization']) customHeaders['Authorization'] = headers['Authorization'];
    if (headers['X-Admin-Token']) customHeaders['X-Admin-Token'] = headers['X-Admin-Token'];
    
    if (Object.keys(customHeaders).length > 0) {
        fetchOptions.headers = customHeaders;
    }
    
    // Send the upload request
    fetch(`${API_BASE}/catalogue.php`, fetchOptions)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(editGalleryFilesStore.length + ' image(s) added to gallery!', 'success');
                closeEditGalleryModal();
                loadCatalogue();
            } else {
                showNotification('Error: ' + (data.message || data.error || 'Failed to add images'), 'error');
            }
        })
        .catch(error => {
            console.error('Error uploading gallery images:', error);
            showNotification('Error uploading gallery images: ' + error.message, 'error');
        });
}

// Toggle catalogue event visibility (private/public)
function toggleCatalogueVisibility(catalogueId, currentPrivateStatus) {
    const isCurrentlyPrivate = currentPrivateStatus == 1;
    const newStatus = isCurrentlyPrivate ? 0 : 1;
    const statusText = isCurrentlyPrivate ? 'public' : 'private';
    
    const headers = getUserHeaders();
    delete headers['Content-Type'];
    
    fetch(`${API_BASE}/catalogue.php`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            action: 'toggle_private',
            catalogue_id: catalogueId,
            is_private: newStatus
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(`Event marked as ${statusText}!`, 'success');
                loadCatalogue();
            } else {
                showNotification('Error: ' + (data.message || 'Failed to toggle visibility'), 'error');
            }
        })
        .catch(error => {
            console.error('Error toggling visibility:', error);
            showNotification('Error updating event visibility', 'error');
        });
}

function editCoordinator(coordinatorId) { console.log('Edit coordinator:', coordinatorId); }
function deleteCoordinator(coordinatorId) { console.log('Delete coordinator:', coordinatorId); }
function deleteCoordinatorRecord(coordinatorId) { deleteCoordinator(coordinatorId); }

function openEditCoordinatorModal(id, name, email, contact, eventId) { 
    console.log('Edit coordinator modal for:', id);
}

function submitCreateCoordinator() { submitAddCoordinator(); }

// Confirmation modal  
function showConfirmation(title, message, action, callback) {
    if (confirm(message)) {
        callback();
    }
}
function openLookupEventsModal() { console.log('Lookup events'); }
function closeLookupEventsModal() { console.log('Close lookup'); }
function openAddPastEventModal() { console.log('Add past event'); }
function closeAddPastEventModal() { console.log('Close add past'); }
function addEventToCatalogue(eventId) { console.log('Add to catalogue:', eventId); }
function removeEventFromCatalogue(catalogueId) { console.log('Remove from catalogue:', catalogueId); }
function previewCatalogueImage(event) { console.log('Preview image'); }
function closeAddCatalogueImageModal() { console.log('Close modal'); }
function submitCatalogueEventWithImage() { console.log('Submit event'); }

// Event details page functions
// NOTE: These are now implemented in event-details.js for the standalone event-details.html page

// Task functions
function handleTaskFormSubmit(e) { if (e) e.preventDefault(); console.log('Task submitted'); }
function editTask(taskId) { console.log('Edit task:', taskId); }
function deleteTask(taskId) { console.log('Delete task:', taskId); }

// Reports modal/preview
function previewReport(reportType) { console.log('Preview report:', reportType); }
function closeReportPreview() { console.log('Close report'); }
function downloadReport(reportType) { console.log('Download report:', reportType); }

// Attendee functions  
function markAttendeeAsAttended(attendeeId, code) { console.log('Mark attended:', code); }
function markAttendeeAsInitial(registrationCode, index) {
    if (!window.currentEventId) {
        alert('No event selected');
        return;
    }
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            event_id: window.currentEventId,
            registration_code: registrationCode,
            status: 'REGISTERED'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload attendees list
            loadEventAttendees({event_id: window.currentEventId}, false);
        } else {
            alert(data.message || 'Failed to move attendee to initial list');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error moving attendee to initial list');
    });
}

// Mark attendee as attended (full-page view)
function markAttendeeAsAttended(registrationCode, index) {
    if (!window.currentEventId) {
        alert('No event selected');
        return;
    }
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            event_id: window.currentEventId,
            registration_code: registrationCode,
            status: 'ATTENDED'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload attendees list
            loadEventAttendees({event_id: window.currentEventId}, false);
        } else {
            alert(data.message || 'Failed to mark attendee as attended');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error marking attendee as attended');
    });
}

// Delete attendee (full-page view)
function deleteAttendee(registrationCode, index) {
    if (!window.currentEventId) {
        alert('No event selected');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this attendee?')) {
        return;
    }
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            event_id: window.currentEventId,
            registration_code: registrationCode
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload attendees list
            loadEventAttendees({event_id: window.currentEventId}, false);
        } else {
            alert(data.message || 'Failed to delete attendee');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error deleting attendee');
    });
}

// Show QR Code for attendee registration
function showQRCode(registrationCode, name) {
    // Show QR code modal for the registration code
    const qrModal = document.createElement('div');
    qrModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const qrContent = document.createElement('div');
    qrContent.style.cssText = `
        background: white;
        border-radius: 8px;
        text-align: center;
        max-width: 500px;
        width: 500px;
        overflow: hidden;
    `;
    
    // Add gradient header
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%);
        padding: 20px;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const closeX = document.createElement('button');
    closeX.innerHTML = '&times;';
    closeX.style.cssText = `
        background: transparent;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = 'Registration QR Code';
    headerTitle.style.cssText = `
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: white;
        font-family: 'Poppins', sans-serif;
    `;
    
    headerDiv.appendChild(headerTitle);
    headerDiv.appendChild(closeX);
    
    // Store reference to qrModal for close button
    let qrModalRef = null;
    closeX.onclick = (e) => {
        e.stopPropagation();
        if (qrModalRef) qrModalRef.remove();
    };
    
    qrContent.appendChild(headerDiv);
    
    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
        padding: 30px;
    `;
    
    // Create container for QR code
    const qrCodeDiv = document.createElement('div');
    qrCodeDiv.id = 'qrCodeContainer_' + Date.now();
    qrCodeDiv.style.cssText = `
        margin: 20px 0;
        display: flex;
        justify-content: center;
    `;
    
    contentWrapper.innerHTML = `
        ${name ? `<p style="color: #666; margin: 0 0 15px 0; font-size: 14px;"><strong>${escapeHtml(name)}</strong></p>` : ''}
    `;
    contentWrapper.appendChild(qrCodeDiv);
    
    // Generate QR code using library
    try {
        new QRCode(qrCodeDiv.id, {
            text: registrationCode,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (error) {
        // Fallback if QRCode library not available
        qrCodeDiv.innerHTML = `
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registrationCode)}" 
                 alt="QR Code" style="border: 1px solid #ddd; border-radius: 4px;">
        `;
    }
    
    // Add code display
    const codeDisplay = document.createElement('div');
    codeDisplay.style.cssText = `
        margin-top: 20px;
        padding: 15px;
        background: #f5f5f5;
        border-radius: 4px;
    `;
    codeDisplay.innerHTML = `
        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">Registration Code:</p>
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1E73BB; letter-spacing: 1px;">${escapeHtml(registrationCode)}</p>
    `;
    contentWrapper.appendChild(codeDisplay);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
        margin-top: 20px;
        padding: 10px 20px;
        background: #1E73BB;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        font-weight: 500;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = '#1560A0';
    closeBtn.onmouseout = () => closeBtn.style.background = '#1E73BB';
    closeBtn.onclick = () => qrModal.remove();
    contentWrapper.appendChild(closeBtn);
    
    qrContent.appendChild(contentWrapper);
    
    qrModal.appendChild(qrContent);
    qrModalRef = qrModal; // Store reference for close button
    qrModal.onclick = (e) => {
        if (e.target === qrModal) qrModal.remove();
    };
    
    document.body.appendChild(qrModal);
}

function viewAttendeeQR(code, name) { showQRCode(code, name); }

// Admin management functions
function openCreateAdminModal() { console.log('Open create admin'); }
function closeCreateAdminModal() { console.log('Close create admin'); }
function filterAdminsByName(query) { console.log('Filter admins'); }
function openEditAdminModal(id, name, email, status, image) { console.log('Edit admin:', id); }
function closeEditAdminModal() { console.log('Close edit admin'); }
function deleteAdmin(userId) { console.log('Delete admin:', userId); }
function deactivateAdmin(userId, name) { console.log('Deactivate:', name); }
function activateAdmin(userId, name) { console.log('Activate:', name); }
function deactivateAdminFromModal() { console.log('Deactivate from modal'); }
function sortAdmins(sortValue) { console.log('Sort admins'); }
function filterAdminsByStatus(status) { console.log('Filter by status'); }
function openArchivedAccountsModal() { console.log('Open archived'); }
function closeArchivedAccountsModal() { console.log('Close archived'); }
function openDeactivatedAccountsModal() { console.log('Open deactivated'); }
function closeDeactivatedAccountsModal() { console.log('Close deactivated'); }

// Activity logs functions
function filterLogsByAction(actionType) { console.log('Filter logs'); }
function sortLogs(sortValue) { console.log('Sort logs'); }
function refreshLogs() { loadActivityLogs(); }
function showLogDetails(id, name, action, desc, ip) { console.log('Show log details'); }
function closeLogDetailsModal() { console.log('Close log details'); }

// Image functions
function previewAdminImage(event) { console.log('Preview admin image'); }
function clearAdminImage() { console.log('Clear admin image'); }
function previewEditAdminImage(event) { console.log('Preview edit image'); }
function clearEditAdminImage() { console.log('Clear edit image'); }
function toggleCreatePasswordVisibility() { console.log('Toggle password'); }
function togglePasswordVisibility() { console.log('Toggle password'); }

// ================================================================================
// CALENDAR DIAGNOSTIC UTILITY
// ================================================================================
// Call this from the browser console: calendarDiagnostic()
window.calendarDiagnostic = function() {
    console.clear();
    console.log('%c=== CALENDAR DIAGNOSTIC REPORT ===', 'color: #0284c7; font-size: 14px; font-weight: bold;');
    
    // Check 1: Events loaded
    console.log('\n%c1. EVENTS DATA:', 'color: #1976d2; font-weight: bold;');
    console.log(`   📊 Total events in cache: ${allEventsForCalendar.length}`);
    if (allEventsForCalendar.length > 0) {
        console.log(`   ✅ First event:`, allEventsForCalendar[0]);
        console.log(`   📅 Event date format: "${allEventsForCalendar[0].event_date}"`);
        console.log(`   🏷️  Event name field: "${allEventsForCalendar[0].event_name}"`);
    } else {
        console.warn('   ❌ NO EVENTS LOADED! Check API response.');
    }
    
    // Check 2: Current calendar view
    console.log('\n%c2. CALENDAR VIEW:', 'color: #1976d2; font-weight: bold;');
    console.log(`   📅 Current month: ${calendarCurrentMonth + 1}/${calendarCurrentYear}`);
    console.log(`   📍 Selected date: ${calendarSelectedDate || 'None selected'}`);
    
    // Check 3: Date matching test
    if (allEventsForCalendar.length > 0 && allEventsForCalendar[0].event_date) {
        console.log('\n%c3. DATE MATCHING TEST:', 'color: #1976d2; font-weight: bold;');
        const testDate = allEventsForCalendar[0].event_date.split(' ')[0];
        const matching = allEventsForCalendar.filter(e => e.event_date?.split(' ')[0] === testDate);
        console.log(`   🔍 Test date: "${testDate}"`);
        console.log(`   ✅ Found ${matching.length} event(s) on this date`);
        console.log(`   Events:`, matching.map(e => e.event_name));
    }
    
    // Check 4: DOM structure
    console.log('\n%c4. DOM ELEMENTS:', 'color: #1976d2; font-weight: bold;');
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarPage = document.getElementById('calendar');
    const dateRange = document.getElementById('calendarDateRange');
    
    console.log(`   🎨 Calendar page element: ${calendarPage ? '✅ Found' : '❌ Missing'}`);
    console.log(`   📊 Calendar grid: ${calendarGrid ? '✅ Found' : '❌ Missing'}`);
    console.log(`   🗓️  Date range element: ${dateRange ? '✅ Found' : '❌ Missing'}`);
    
    if (calendarGrid) {
        const dayCells = calendarGrid.querySelectorAll('[data-date]');
        console.log(`   📍 Day cells rendered: ${dayCells.length}`);
        
        // Check which cells have events
        let cellsWithEvents = 0;
        dayCells.forEach(cell => {
            const eventDivs = cell.querySelectorAll('div');
            if (eventDivs.length > 1) {
                cellsWithEvents++;
            }
        });
        console.log(`   🎯 Cells with events: ${cellsWithEvents}`);
    }
    
    // Check 5: Page activity
    console.log('\n%c5. PAGE STATUS:', 'color: #1976d2; font-weight: bold;');
    console.log(`   👤 User: ${JSON.parse(localStorage.getItem('admin') || 'null')?.email || JSON.parse(localStorage.getItem('user') || 'null')?.email || 'Unknown'}`);
    console.log(`   📍 Last page: ${localStorage.getItem('adminLastPage')}`);
    
    console.log('%c\n=== END DIAGNOSTIC REPORT ===', 'color: #0284c7; font-size: 14px; font-weight: bold;');
    console.log('%cTo reload events: loadCalendar()', 'color: #c026d3; font-style: italic;');
    console.log('%cTo re-render calendar: renderCalendarMonth()', 'color: #c026d3; font-style: italic;');
};

// ================================================================================
// USERS PAGE FUNCTIONS
// ================================================================================

let allUsers = [];

// Load all users from API
async function loadAllUsers() {
    try {
        // Fetch admins and coordinators separately and merge
        const [adminsResponse, coordinatorsResponse] = await Promise.all([
            fetch(`${API_BASE}/admins.php?action=list`, { method: 'GET', headers: getUserHeaders() }),
            fetch(`${API_BASE}/coordinators.php?action=list`, { method: 'GET', headers: getUserHeaders() })
        ]);
        
        // Parse admins
        const adminsText = await adminsResponse.text();
        if (!adminsText) throw new Error('Empty response from admins API');
        const adminsData = JSON.parse(adminsText);
        console.log('Admins API Response:', adminsData);
        
        // Parse coordinators
        const coordinatorsText = await coordinatorsResponse.text();
        if (!coordinatorsText) throw new Error('Empty response from coordinators API');
        const coordinatorsData = JSON.parse(coordinatorsText);
        console.log('Coordinators API Response:', coordinatorsData);
        
        // Merge data
        let merged = [];
        
        // Add admins with standardized fields
        if (adminsData.success && Array.isArray(adminsData.data)) {
            console.log('Processing ' + adminsData.data.length + ' admins');
            adminsData.data.forEach(admin => {
                console.log('Admin record:', admin);
                merged.push({
                    id: admin.user_id,
                    username: admin.full_name,
                    email: admin.email,
                    full_name: admin.full_name,
                    admin_image: admin.admin_image,
                    role_name: 'Admin',
                    is_active: admin.status === 'active' ? 1 : 0,
                    created_at: admin.created_at,
                    updated_at: admin.created_at
                });
            });
        } else {
            console.warn('Admins data not in expected format:', adminsData);
        }
        
        // Add coordinators (they already have most fields we need)
        if (coordinatorsData.success && Array.isArray(coordinatorsData.data)) {
            console.log('Processing ' + coordinatorsData.data.length + ' coordinators');
            coordinatorsData.data.forEach(coord => {
                merged.push({
                    id: coord.coordinator_id,
                    username: coord.coordinator_name,
                    email: coord.email,
                    full_name: coord.coordinator_name,
                    coordinator_image: coord.coordinator_image,
                    company: coord.company,
                    contact_number: coord.contact_number,
                    role_name: 'Coordinator',
                    is_active: coord.is_active,
                    reset_token: coord.reset_token,
                    created_at: coord.created_at,
                    updated_at: coord.updated_at
                });
            });
        } else {
            console.warn('Coordinators data not in expected format:', coordinatorsData);
        }
        
        // Sort by created_at descending
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        allUsers = merged;
        console.log('Loaded ' + allUsers.length + ' users (merged from admins and coordinators)');
        console.log('Final merged users array:', allUsers);
        filterUsersTable();
        updateUserStatistics();
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users: ' + error.message);
    }
}

// Display users in table
// Display users in table
function displayUsers(users) {
    const usersTable = document.getElementById('usersTable');
    if (!usersTable) return;
    
    if (!users || users.length === 0) {
        usersTable.innerHTML = '<tr><td colspan="6" style="padding: 32px; text-align: center; color: #9ca3af;">No users found</td></tr>';
        return;
    }
    
    usersTable.innerHTML = users.map(user => {
        // Convert is_active to proper boolean (API might return 0/1 or "0"/"1")
        const isActiveValue = user.is_active;
        const isActive = isActiveValue === 1 || isActiveValue === '1' || isActiveValue === true;
        
        // Determine status: "Pending Setup" if coordinator has reset_token, else Active/Inactive
        // NOTE: When a "Pending Setup" user is deactivated, they become "Inactive"
        // (is_active = 0). The reset_token is preserved, so if reactivated, they remain "Pending Setup"
        let status = 'Inactive';
        let statusColor = '#ef4444';
        let statusBgColor = '#fee2e2';
        
        // Check if coordinator has pending reset token (hasn't reset password yet)
        if (user.reset_token && user.reset_token.trim() !== '' && user.role_name === 'Coordinator') {
            status = 'Pending Setup';
            statusColor = '#f59e0b';
            statusBgColor = '#fffbeb';
        } else if (isActive) {
            status = 'Active';
            statusColor = '#10b981';
            statusBgColor = '#ecfdf5';
        }
        
        // Get profile image
        let profileImage = user.admin_image || user.coordinator_image || null;
        
        let profileImageHtml;
        if (profileImage) {
            // Construct proper path based on image type
            let imgSrc = profileImage;
            if (user.admin_image && !profileImage.includes('/')) {
                imgSrc = `../uploads/admins/${profileImage}`;
            } else if (user.coordinator_image && !profileImage.includes('/')) {
                imgSrc = `../uploads/coordinators/${profileImage}`;
            }
            const fallbackInitial = (user.full_name || user.username || 'U').charAt(0).toUpperCase();
            // Use background-image for perfect circular crop
            profileImageHtml = `<td style="padding: 12px 16px; text-align: center;">
                <div style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); background-image: url('${imgSrc}'); background-size: cover; background-position: center; background-color: #3b82f6;" onerror="this.style.backgroundImage='none'">
                </div>
            </td>`;
        } else {
            const initials = (user.full_name || user.username || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            profileImageHtml = `<td style="padding: 12px 16px; text-align: center;">
                <div style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; color: white;">
                    ${initials}
                </div>
            </td>`;
        }
        
        return `
            <tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">
                ${profileImageHtml}
                <td style="padding: 12px 16px; color: #1f2937; font-weight: 500;">${user.full_name || user.username || '-'}</td>
                <td style="padding: 12px 16px; color: #6b7280;">${user.email || '-'}</td>
                <td style="padding: 12px 16px;">
                    <span style="color: #1E73BB; font-weight: 500;">${user.role_name || user.role || '-'}</span>
                </td>
                <td style="padding: 12px 16px;">
                    <span style="background: ${statusBgColor}; color: ${statusColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${status}</span>
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                    <div style="display: flex; gap: 10px; justify-content: center; align-items: center;">
                        <button class="edit-user-btn action-btn" data-user-id="${user.id}" data-user-role="${user.role_name || user.role}" data-user-name="${user.full_name || user.username || ''}" data-user-email="${user.email || ''}" data-user-company="${user.company || ''}" data-user-contact="${user.contact_number || ''}" title="Edit User" style="padding: 6px; background: white; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="#5a5f68" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M19.09 14.441v4.44a2.37 2.37 0 0 1-2.369 2.369H5.12a2.37 2.37 0 0 1-2.369-2.383V7.279a2.356 2.356 0 0 1 2.37-2.37H9.56"/><path d="M6.835 15.803v-2.165c.002-.357.144-.7.395-.953l9.532-9.532a1.36 1.36 0 0 1 1.934 0l2.151 2.151a1.36 1.36 0 0 1 0 1.934l-9.532 9.532a1.36 1.36 0 0 1-.953.395H8.197a1.36 1.36 0 0 1-1.362-1.362M19.09 8.995l-4.085-4.086"/></g></svg>
                        </button>
                        
                        ${isActive ? `<button class="deactivate-user-btn action-btn" data-user-id="${user.id}" data-user-name="${(user.full_name || user.username || 'User').replace(/"/g, '&quot;')}" data-user-role="${user.role_name || user.role}" title="Deactivate User" style="padding: 6px; background: white; border: 1px solid #ef4444; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#ef4444" d="M6 22q-.825 0-1.412-.587T4 20V10q0-.825.588-1.412T6 8h1V6q0-2.075 1.463-3.537T12 1t3.538 1.463T17 6v2h1q.825 0 1.413.588T20 10v10q0 .825-.587 1.413T18 22zm0-2h12V10H6zm7.413-3.588Q14 15.826 14 15t-.587-1.412T12 13t-1.412.588T10 15t.588 1.413T12 17t1.413-.587M9 8h6V6q0-1.25-.875-2.125T12 3t-2.125.875T9 6zM6 20V10z"/></svg>
                        </button>` : `<button class="reactivate-user-btn action-btn" data-user-id="${user.id}" data-user-name="${(user.full_name || user.username || 'User').replace(/"/g, '&quot;')}" data-user-role="${user.role_name || user.role}" title="Activate User" style="padding: 6px; background: white; border: 1px solid #10b981; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#10b981" d="M10.5 16a1.5 1.5 0 1 1 3 0a1.5 1.5 0 0 1-3 0"/><path fill="#10b981" fill-rule="evenodd" d="M9.81 4.005a3.2 3.2 0 0 1 4.164 1.808l.075.192q.14.359.198.738l.217 1.423l1.483-.226l-.217-1.423a5 5 0 0 0-.283-1.057l-.075-.193a4.7 4.7 0 0 0-9.024 2.418l.03.204q.084.545.284 1.058l.655 1.675l-.382.03a2.36 2.36 0 0 0-2.142 1.972a20.9 20.9 0 0 0 0 6.752a2.36 2.36 0 0 0 2.142 1.972l1.496.12c2.376.19 4.762.19 7.138 0l1.496-.12a2.36 2.36 0 0 0 2.142-1.972a20.9 20.9 0 0 0 0-6.752a2.36 2.36 0 0 0-2.142-1.972l-1.496-.12a45 45 0 0 0-6.69-.033l-.82-2.098a3.5 3.5 0 0 1-.197-.738L7.83 7.46a3.2 3.2 0 0 1 1.98-3.455m5.64 8.023a43.4 43.4 0 0 0-6.9 0l-1.496.12a.86.86 0 0 0-.781.719a19.4 19.4 0 0 0 0 6.266a.86.86 0 0 0 .781.72l1.497.12c2.296.183 4.602.183 6.898 0l1.496-.12a.86.86 0 0 0 .782-.72a19.4 19.4 0 0 0 0-6.266a.86.86 0 0 0-.782-.72z" clip-rule="evenodd"/></svg>
                        </button>`}
                        
                        <button class="resend-link-btn action-btn" data-user-id="${user.id}" data-user-name="${(user.full_name || user.username || 'User').replace(/"/g, '&quot;')}" data-user-email="${user.email}" data-user-role="${user.role_name || user.role}" title="Resend Setup Link" style="padding: 6px; background: white; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; ${user.role_name === 'Admin' ? 'pointer-events: none; opacity: 0.5;' : ''}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="#5a5f68" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14L21 3m0 0l-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1z"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add event listeners to buttons using event delegation
    setTimeout(() => {
        const usersTable = document.getElementById('usersTable');
        if (!usersTable) return;
        
        // Add hover effects to all action buttons with color transitions
        usersTable.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('mouseover', function() {
                this.style.transform = 'scale(1.15)';
                this.style.backgroundColor = '#f3f4f6';
                this.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.2)';
            });
            btn.addEventListener('mouseout', function() {
                this.style.transform = 'scale(1)';
                this.style.backgroundColor = 'white';
                this.style.boxShadow = 'none';
            });
        });
        
        usersTable.querySelectorAll('.deactivate-user-btn').forEach(btn => {
            btn.addEventListener('mouseover', function() {
                this.style.transform = 'scale(1.15)';
                this.style.backgroundColor = '#fef2f2';
                this.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
            });
            btn.addEventListener('mouseout', function() {
                this.style.transform = 'scale(1)';
                this.style.backgroundColor = 'white';
                this.style.boxShadow = 'none';
            });
        });
        
        usersTable.querySelectorAll('.reactivate-user-btn').forEach(btn => {
            btn.addEventListener('mouseover', function() {
                this.style.transform = 'scale(1.15)';
                this.style.backgroundColor = '#f0fdf4';
                this.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
            });
            btn.addEventListener('mouseout', function() {
                this.style.transform = 'scale(1)';
                this.style.backgroundColor = 'white';
                this.style.boxShadow = 'none';
            });
        });
        
        usersTable.querySelectorAll('.resend-link-btn').forEach(btn => {
            btn.addEventListener('mouseover', function() {
                this.style.transform = 'scale(1.15)';
                this.style.backgroundColor = '#f3f4f6';
                this.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.2)';
            });
            btn.addEventListener('mouseout', function() {
                this.style.transform = 'scale(1)';
                this.style.backgroundColor = 'white';
                this.style.boxShadow = 'none';
            });
        });
        
        // Edit button listeners
        usersTable.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const userId = this.dataset.userId;
                const userRole = this.dataset.userRole;
                const userName = this.dataset.userName;
                const userEmail = this.dataset.userEmail;
                const userCompany = this.dataset.userCompany;
                const userContact = this.dataset.userContact;
                openEditUserModal(userId, userRole, userName, userEmail, userCompany, userContact);
            });
        });
        
        // Deactivate button listeners
        usersTable.querySelectorAll('.deactivate-user-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const userId = this.dataset.userId;
                const userName = this.dataset.userName;
                const userRole = this.dataset.userRole;
                openDeactivateUserModal(userId, userName, userRole);
            });
        });
        
        // Reactivate button listeners
        usersTable.querySelectorAll('.reactivate-user-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const userId = this.dataset.userId;
                const userName = this.dataset.userName;
                const userRole = this.dataset.userRole;
                openReactivateUserModal(userId, userName, userRole);
            });
        });
        
        // Resend link button listeners
        usersTable.querySelectorAll('.resend-link-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const userId = this.dataset.userId;
                const userName = this.dataset.userName;
                const userEmail = this.dataset.userEmail;
                const userRole = this.dataset.userRole;
                openResendSetupLinkModal(userId, userName, userEmail, userRole);
            });
        });
    }, 0);
}

// Filter users based on search and filters
function filterUsersTable() {
    const searchText = document.getElementById('usersSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    let filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchText || 
            (user.full_name && user.full_name.toLowerCase().includes(searchText)) ||
            (user.username && user.username.toLowerCase().includes(searchText)) ||
            (user.email && user.email.toLowerCase().includes(searchText));
        
        const matchesRole = !roleFilter || (user.role_name === roleFilter) || (user.role === roleFilter);
        
        // Determine current status for filtering
        // Convert is_active to proper boolean (API might return 0/1 or "0"/"1")
        const isActiveValue = user.is_active;
        const isActive = isActiveValue === 1 || isActiveValue === '1' || isActiveValue === true;
        let currentStatus = 'Inactive';
        
        // "Pending Setup" only applies when: has reset_token (regardless of is_active value)
        // When deactivated, is_active becomes 0 → status becomes "Inactive"
        // reset_token is preserved, so reactivation restores "Pending Setup"
        if (user.reset_token && user.reset_token.trim() !== '' && user.role_name === 'Coordinator') {
            currentStatus = 'Pending Setup';
        } else if (isActive) {
            currentStatus = 'Active';
        }
        const matchesStatus = !statusFilter || currentStatus === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    displayUsers(filteredUsers);
}

// Update user statistics
function updateUserStatistics() {
    const totalAccounts = allUsers.length;
    
    // Calculate proper counts based on status logic
    let activeCount = 0;
    let pendingSetupCount = 0;
    
    allUsers.forEach(user => {
        const isActiveValue = user.is_active;
        const isActive = isActiveValue === 1 || isActiveValue === '1' || isActiveValue === true;
        
        if (isActive) {
            // Check if coordinator has pending reset token (hasn't reset password yet)
            if (user.reset_token && user.reset_token.trim() !== '' && user.role_name === 'Coordinator') {
                pendingSetupCount++;
            } else {
                activeCount++;
            }
        }
        // Inactive users are not counted in these stats
    });
    
    const totalEl = document.getElementById('totalAccountsCount');
    const pendingEl = document.getElementById('pendingSetupCount');
    const activeEl = document.getElementById('activeAccountsCount');
    
    if (totalEl) totalEl.textContent = totalAccounts;
    if (pendingEl) pendingEl.textContent = pendingSetupCount;
    if (activeEl) activeEl.textContent = activeCount;
}

// Open create account modal (placeholder)
function openCreateAccountModal() {
  // Reset forms
  document.getElementById('coordinatorForm').reset();
  document.getElementById('adminForm').reset();
  
  // Show coordinator form by default
  document.querySelectorAll('input[name="accountRole"]').forEach(radio => {
    radio.checked = radio.value === 'coordinator';
  });
  document.getElementById('coordinatorFormSection').style.display = 'block';
  document.getElementById('adminFormSection').style.display = 'none';
  
  // Add role switcher listener
  document.querySelectorAll('input[name="accountRole"]').forEach(radio => {
    radio.onchange = function() {
      const role = this.value;
      if (role === 'coordinator') {
        document.getElementById('coordinatorFormSection').style.display = 'block';
        document.getElementById('adminFormSection').style.display = 'none';
      } else {
        document.getElementById('coordinatorFormSection').style.display = 'none';
        document.getElementById('adminFormSection').style.display = 'block';
      }
    };
  });
  
  // Open modal
  document.getElementById('createAccountModal').classList.add('active');
}

function closeCreateAccountModal() {
  document.getElementById('createAccountModal').classList.remove('active');
  document.getElementById('coordinatorForm').reset();
  document.getElementById('adminForm').reset();
}

async function submitCreateAccount() {
  const selectedRole = document.querySelector('input[name="accountRole"]:checked').value;
  const btnEl = document.getElementById('createAccountBtn');
  
  try {
    btnEl.disabled = true;
    btnEl.textContent = 'Creating...';
    
    if (selectedRole === 'coordinator') {
      await createCoordinatorAccount();
    } else {
      await createAdminAccount();
    }
  } finally {
    btnEl.disabled = false;
    btnEl.textContent = 'Create Account';
  }
}

async function createCoordinatorAccount() {
  const name = document.getElementById('createCoord_name').value.trim();
  const email = document.getElementById('createCoord_email').value.trim();
  const company = document.getElementById('createCoord_company').value.trim();
  const jobTitle = document.getElementById('createCoord_jobTitle').value.trim();
  const contact = document.getElementById('createCoord_contact').value.trim();
  
  // Get image file from the file input
  const imageFileInput = document.getElementById('previewImageInput');
  const imageFile = imageFileInput ? imageFileInput.files[0] : null;
  
  // Validation
  if (!name || !email) {
    alert('Name and Email are required');
    return;
  }
  
  if (!email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }
  
  // Create FormData for file upload
  const formData = new FormData();
  formData.append('coordinator_name', name);
  formData.append('email', email);
  formData.append('company', company);
  formData.append('job_title', jobTitle);
  formData.append('contact_number', contact);
  
  // Add creator admin ID
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');
  const creator_admin_id = admin.admin_id || admin.id || 0;
  if (creator_admin_id > 0) {
    formData.append('creator_admin_id', creator_admin_id);
  }
  
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  try {
    // Get user headers and add to fetch request
    const headers = getUserHeaders();
    // Remove Content-Type for FormData - let browser set it automatically with boundary
    delete headers['Content-Type'];
    
    const response = await fetch(`${API_BASE}/coordinators.php`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    let data;
    const responseText = await response.text(); // Read as text first
    
    try {
      data = JSON.parse(responseText); // Then parse as JSON
    } catch (parseError) {
      console.error('API returned invalid JSON:', responseText);
      console.error('Response status:', response.status);
      alert('Error: API returned invalid response. Check browser console for details.');
      return;
    }
    
    if (data.success) {
      alert(`Coordinator Account Created Successfully!\n\nName: ${name}\nEmail: ${email}\n\nAccount Status: Pending Setup ⏳\n\n📧 A password setup link has been sent to ${email}\n\nThe coordinator can use this link to set their password and complete their account setup.`);
      closeCreateAccountModal();
      loadAllUsers(); // Refresh users list
      updateUserStatistics(); // Update stats
    } else {
      alert('Error: ' + (data.message || 'Failed to create coordinator account'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error creating coordinator account: ' + error.message);
  }
}

async function createAdminAccount() {
  const fullName = document.getElementById('createAdmin_fullName').value.trim();
  const email = document.getElementById('createAdmin_email').value.trim();
  const password = document.getElementById('createAdmin_password').value;
  
  // Get image file from the file input
  const imageFileInput = document.getElementById('previewImageInput');
  const imageFile = imageFileInput ? imageFileInput.files[0] : null;
  
  // Validation
  if (!fullName || !email || !password) {
    alert('Full Name, Email, and Password are required');
    return;
  }
  
  if (!email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }
  
  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }
  
  // Create FormData for file upload
  const formData = new FormData();
  formData.append('full_name', fullName);
  formData.append('email', email);
  formData.append('password', password);
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  try {
    // Do NOT pass headers with FormData - let browser set Content-Type automatically
    const response = await fetch(`${API_BASE}/admins.php`, {
      method: 'POST',
      body: formData
    });
    
    let data;
    const responseText = await response.text(); // Read as text first
    
    try {
      data = JSON.parse(responseText); // Then parse as JSON
    } catch (parseError) {
      console.error('API returned invalid JSON:', responseText);
      console.error('Response status:', response.status);
      alert('Error: API returned invalid response. Check browser console for details.');
      return;
    }
    
    if (data.success) {
      alert(`Admin Account Created Successfully! ✅\n\nName: ${fullName}\nEmail: ${email}\n\nAccount Status: Active ✓\n\nThe admin can now login immediately to the admin dashboard using their credentials.`);
      closeCreateAccountModal();
      loadAllUsers(); // Refresh users list
      updateUserStatistics(); // Update stats
    } else {
      alert('Error: ' + (data.message || 'Failed to create admin account'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error creating admin account: ' + error.message);
  }
}

// Edit user (placeholder)
function editUser(userId) {
    alert(`Edit user ${userId} - Feature coming soon`);
}

// Delete user (placeholder)
function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        alert(`Delete user ${userId} - Feature coming soon`);
    }
}

// Resend setup link (placeholder)
function resendSetupLink(userId) {
    alert(`Resend setup link for user ${userId} - Feature coming soon`);
}

// User tab tracking
let currentUserTab = 'all';

// Switch user tabs
// Tabs removed - now using Status filter instead
function switchUserTab(tab) {
    // Deprecated - tabs have been replaced with Status filter
    console.log('Tab switching deprecated - use Status filter instead');
}

// Actions tracking
let currentActionUserId = null;
let currentActionUserEmail = null;
let currentActionUserRole = null;

// Open Resend Setup Link Modal
function openResendSetupLinkModal(userId, userName, userEmail, userRole) {
    currentActionUserId = parseInt(userId, 10);
    currentActionUserEmail = userEmail;
    currentActionUserRole = userRole;
    document.getElementById('resendUserNameDisplay').textContent = userName;
    document.getElementById('resendSetupLinkModal').classList.add('active');
}

function closeResendSetupLinkModal() {
    document.getElementById('resendSetupLinkModal').classList.remove('active');
}

async function confirmResendSetupLink() {
    if (!currentActionUserId || !currentActionUserEmail) return;
    
    const sendBtn = document.getElementById('sendSetupLinkBtn');
    const btnText = document.getElementById('sendLinkBtnText');
    const spinner = document.getElementById('sendLinkLoadingSpinner');
    
    try {
        // Disable button and show loading state
        sendBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        
        let endpoint = '';
        if (currentActionUserRole === 'Coordinator') {
            endpoint = `${API_BASE}/coordinator-send-reset.php`;
        } else if (currentActionUserRole === 'Admin' || currentActionUserRole === 'Super Admin') {
            endpoint = `${API_BASE}/send-reset.php`;
        }
        
        if (!endpoint) {
            showToast('Invalid user role', 'error');
            resetSendLinkButton();
            return;
        }
        
        // Send email as form data (not JSON)
        const formData = new FormData();
        formData.append('email', currentActionUserEmail);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const text = await response.text();
        
        if (response.ok || text.includes('successfully') || text.includes('receive')) {
            showToast('Setup link sent successfully! Check your email.', 'success');
            // Close modal after a brief delay
            setTimeout(() => {
                closeResendSetupLinkModal();
                resetSendLinkButton();
            }, 1500);
        } else {
            showToast('Error sending setup link: ' + text, 'error');
            resetSendLinkButton();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error sending setup link: ' + error.message, 'error');
        resetSendLinkButton();
    }
}

// Helper function to reset the Send Link button
function resetSendLinkButton() {
    const sendBtn = document.getElementById('sendSetupLinkBtn');
    const btnText = document.getElementById('sendLinkBtnText');
    const spinner = document.getElementById('sendLinkLoadingSpinner');
    
    sendBtn.disabled = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
}

// Open Deactivate User Modal
function openDeactivateUserModal(userId, userName, userRole) {
    currentActionUserId = parseInt(userId, 10);
    currentActionUserRole = userRole;
    document.getElementById('deactivateUserNameDisplay').textContent = userName;
    document.getElementById('deactivateUserModal').classList.add('active');
}

function closeDeactivateUserModal() {
    document.getElementById('deactivateUserModal').classList.remove('active');
}

async function confirmDeactivateUser() {
    if (!currentActionUserId) {
        console.error('No action user ID set');
        return;
    }
    
    try {
        console.log('Deactivating user:', currentActionUserId, 'Role:', currentActionUserRole);
        
        if (currentActionUserRole === 'Coordinator') {
            const response = await fetch(`${API_BASE}/coordinators.php`, {
                method: 'POST',
                headers: getUserHeaders(),
                body: JSON.stringify({
                    coordinator_id: currentActionUserId,
                    action_type: 'deactivate'
                })
            });
            
            console.log('Deactivate response status:', response.status);
            const data = await response.json();
            console.log('Deactivate response data:', data);
            
            if (data.success) {
                showToast('Coordinator deactivated successfully', 'success');
                closeDeactivateUserModal();
                await loadAllUsers();
                // Auto-set filter to show "Inactive" users
                const statusFilterEl = document.getElementById('statusFilter');
                if (statusFilterEl) {
                    statusFilterEl.value = 'Inactive';
                    filterUsersTable();
                }
            } else {
                showToast('Error deactivating coordinator: ' + (data.message || 'Unknown error'), 'error');
            }
        } else if (currentActionUserRole === 'Admin' || currentActionUserRole === 'Super Admin') {
            const response = await fetch(`${API_BASE}/admins.php`, {
                method: 'PUT',
                headers: getUserHeaders(),
                body: JSON.stringify({
                    admin_id: currentActionUserId,
                    action_type: 'deactivate'
                })
            });
            
            console.log('Deactivate response status:', response.status);
            const data = await response.json();
            console.log('Deactivate response data:', data);
            
            if (data.success) {
                showToast('Admin deactivated successfully', 'success');
                closeDeactivateUserModal();
                await loadAllUsers();
                // Auto-set filter to show "Inactive" users
                const statusFilterEl = document.getElementById('statusFilter');
                if (statusFilterEl) {
                    statusFilterEl.value = 'Inactive';
                    filterUsersTable();
                }
            } else {
                showToast('Error deactivating admin: ' + (data.message || 'Unknown error'), 'error');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deactivating user: ' + error.message);
    }
}

// Open Reactivate User Modal
function openReactivateUserModal(userId, userName, userRole) {
    currentActionUserId = parseInt(userId, 10);
    currentActionUserRole = userRole;
    document.getElementById('reactivateUserNameDisplay').textContent = userName;
    document.getElementById('reactivateUserModal').classList.add('active');
}

function closeReactivateUserModal() {
    document.getElementById('reactivateUserModal').classList.remove('active');
}

async function confirmReactivateUser() {
    if (!currentActionUserId) return;
    
    try {
        if (currentActionUserRole === 'Coordinator') {
            const response = await fetch(`${API_BASE}/coordinators.php`, {
                method: 'POST',
                headers: getUserHeaders(),
                body: JSON.stringify({
                    coordinator_id: currentActionUserId,
                    action_type: 'activate'
                })
            });
            
            const data = await response.json();
            if (data.success) {
                showToast('Coordinator reactivated successfully', 'success');
                closeReactivateUserModal();
                await loadAllUsers();
                // Auto-set filter to show "Active" users
                const statusFilterEl = document.getElementById('statusFilter');
                if (statusFilterEl) {
                    statusFilterEl.value = 'Active';
                    filterUsersTable();
                }
            } else {
                showToast('Error reactivating coordinator: ' + (data.message || 'Unknown error'), 'error');
            }
        } else if (currentActionUserRole === 'Admin' || currentActionUserRole === 'Super Admin') {
            const response = await fetch(`${API_BASE}/admins.php`, {
                method: 'PUT',
                headers: getUserHeaders(),
                body: JSON.stringify({
                    admin_id: currentActionUserId,
                    action_type: 'activate'
                })
            });
            
            const data = await response.json();
            if (data.success) {
                showToast('Admin reactivated successfully', 'success');
                closeReactivateUserModal();
                await loadAllUsers();
                // Auto-set filter to show "Active" users
                const statusFilterEl = document.getElementById('statusFilter');
                if (statusFilterEl) {
                    statusFilterEl.value = 'Active';
                    filterUsersTable();
                }
            } else {
                showToast('Error reactivating admin: ' + (data.message || 'Unknown error'), 'error');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error reactivating user: ' + error.message, 'error');
    }
}

// ================================================================================
// COORDINATOR ASSIGNMENT FUNCTIONS
// ================================================================================

let currentEventIdForCoordinator = null;
let allCoordinators = [];

// Load and display available coordinators
// Load pending setup coordinators
async function loadPendingCoordinators() {
    try {
        const response = await fetch(`${API_BASE}/coordinators.php?action=list`, {
            method: 'GET',
            headers: getUserHeaders()
        });
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
            allCoordinators = data.data;
            displayCoordinatorsList(allCoordinators);
        } else {
            allCoordinators = [];
            displayCoordinatorsList([]);
        }
    } catch (error) {
        console.error('Error loading coordinators:', error);
        allCoordinators = [];
        displayCoordinatorsList([]);
    }
}

// Display coordinators list
function displayCoordinatorsList(coordinators) {
    const container = document.getElementById('coordinatorsListContainer');
    if (!container) return;
    
    if (!coordinators || coordinators.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No coordinators available</p>';
        return;
    }
    
    container.innerHTML = coordinators.map(coordinator => {
        // Get profile image
        let profileImage = coordinator.coordinator_image || null;
        let profileImageHtml = '<div style="width: 45px; height: 45px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid #e0e0e0; flex-shrink: 0;">';
        
        if (profileImage) {
            let imgSrc = profileImage;
            if (!profileImage.includes('/')) {
                imgSrc = `../uploads/coordinators/${profileImage}`;
            }
            profileImageHtml += `<img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;" alt="${coordinator.coordinator_name || coordinator.full_name}" onerror="this.parentElement.innerHTML='<div style=\"font-weight:700;font-size:16px;color:#666;\">${(coordinator.coordinator_name || coordinator.full_name || 'U').charAt(0).toUpperCase()}</div>'">`;
        } else {
            // Show initials if no image
            const initials = (coordinator.coordinator_name || coordinator.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            profileImageHtml += `<div style="font-weight:700;font-size:16px;color:#666;">${initials}</div>`;
        }
        profileImageHtml += '</div>';
        
        return `
        <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                ${profileImageHtml}
                <div>
                    <p style="margin: 0; font-weight: 600; color: #1f2937;">${coordinator.coordinator_name || coordinator.full_name || 'Unknown'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">${coordinator.email || 'No email'}</p>
                </div>
            </div>
            <button 
                onclick="assignCoordinatorToEvent(${coordinator.coordinator_id})" 
                style="padding: 8px 16px; background: #1E73BB; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 13px; white-space: nowrap;"
            >
                Assign
            </button>
        </div>
    `;
    }).join('');
}

// Filter coordinators list
function filterCoordinatorsList() {
    const searchText = document.getElementById('coordinatorSearchInput')?.value.toLowerCase() || '';
    
    const filteredCoordinators = allCoordinators.filter(coordinator => {
        return !searchText || 
            (coordinator.coordinator_name && coordinator.coordinator_name.toLowerCase().includes(searchText)) ||
            (coordinator.email && coordinator.email.toLowerCase().includes(searchText));
    });
    
    displayCoordinatorsList(filteredCoordinators);
}

// Filter other information list
function filterOtherInfoList() {
    const searchValue = document.getElementById('otherInfoSearchInput')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('#eventOtherInfoList tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? '' : 'none';
    });
}

// Assign coordinator to event
async function assignCoordinatorToEvent(coordinatorId) {
    try {
        if (!currentEventIdForCoordinator) {
            alert('Event ID not found');
            return;
        }
        
        // Update event with coordinator
        const updateResponse = await fetch(`${API_BASE}/events.php`, {
            method: 'PUT',
            headers: {
                ...getUserHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_id: currentEventIdForCoordinator,
                coordinator_id: coordinatorId,
                action: 'assign_coordinator'
            })
        });
        
        const updateData = await updateResponse.json();
        
        if (updateData.success) {
            // Update coordinator status to active
            const coordinatorResponse = await fetch(`${API_BASE}/coordinators.php`, {
                method: 'PUT',
                headers: {
                    ...getUserHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    coordinator_id: coordinatorId,
                    is_active: 1,
                    action: 'activate'
                })
            });
            
            const coordinatorData = await coordinatorResponse.json();
            
            if (coordinatorData.success) {
                alert('Coordinator assigned successfully! Status updated to Active.');
                closeLookupCoordinatorModal();
                // Refresh the event details
                const currentEvent = JSON.parse(localStorage.getItem('currentEventDetails') || '{}');
                if (currentEvent.event_id) {
                    openEventDetailsModal(currentEvent.event_id);
                }
                // Refresh users list
                loadAllUsers();
            } else {
                alert('Coordinator assigned but status update failed. Please refresh.');
                closeLookupCoordinatorModal();
            }
        } else {
            alert('Error assigning coordinator: ' + (updateData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error assigning coordinator:', error);
        alert('Error assigning coordinator: ' + error.message);
    }
}

// ================================================================================
// EVENT DETAILS PAGE FUNCTIONS (Integrated from event-details.html)
// ================================================================================

// Switch to event details page
function viewEventDetails(eventId) {
    currentEventId = eventId;
    window.currentEventId = eventId;  // Ensure window.currentEventId is set for other functions
    
    // Add event ID to URL for persistence on reload
    const url = new URL(window.location);
    url.searchParams.set('id', eventId);
    window.history.pushState({ eventId: eventId }, '', url);
    
    // Reset event details tabs to dashboard
    const eventTabContents = document.querySelectorAll('.event-tab-content');
    eventTabContents.forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });
    
    // Reset tab buttons
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activate dashboard tab as default
    const dashboardTab = document.getElementById('dashboard');
    const dashboardBtn = document.querySelector('[data-tab="dashboard"]');
    if (dashboardTab) {
        dashboardTab.classList.remove('hidden');
        dashboardTab.classList.add('active');
    }
    if (dashboardBtn) {
        dashboardBtn.classList.add('active');
    }
    
    // Switch to event details page
    DashboardManager.switchPage('event-details');
    
    // Update sidebar active state - keep "events" link active when viewing event details
    const sidebarLinks = document.querySelectorAll('.nav-item');
    const eventsLink = document.querySelector('[data-page="events"]');
    if (eventsLink) {
        sidebarLinks.forEach(link => link.classList.remove('active'));
        eventsLink.classList.add('active');
    }
    
    loadEventDetails();
}

// Go back to events list
function backToEventsList() {
    currentEventId = null;
    currentEventData = null;
    
    // Remove event ID from URL
    const url = new URL(window.location);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
    
    // Reset event details tabs to dashboard
    const eventTabContents = document.querySelectorAll('.event-tab-content');
    eventTabContents.forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });
    
    // Reset tab buttons
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activate dashboard tab as default
    const dashboardTab = document.getElementById('dashboard');
    const dashboardBtn = document.querySelector('[data-tab="dashboard"]');
    if (dashboardTab) {
        dashboardTab.classList.remove('hidden');
        dashboardTab.classList.add('active');
    }
    if (dashboardBtn) {
        dashboardBtn.classList.add('active');
    }
    
    // Switch page to events
    DashboardManager.switchPage('events');
    
    // Update sidebar active state
    const sidebarLinks = document.querySelectorAll('.nav-item');
    const eventsLink = document.querySelector('[data-page="events"]');
    if (eventsLink) {
        sidebarLinks.forEach(link => link.classList.remove('active'));
        eventsLink.classList.add('active');
    }
}

// Helper function to convert 24-hour time to 12-hour format
function convert24To12Hour(timeStr) {
    if (!timeStr) return '-';
    try {
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
}

// Switch between dashboard, details, attendees, tasks tabs
function switchTab(tabName) {
    
    // Update tab visibility based on user role
    if (typeof updateTabVisibility === 'function') {
        updateTabVisibility();
    }
    
    // Hide all tabs by adding hidden class and removing active class
    document.querySelectorAll('.event-tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
        tab.style.display = 'none';
        tab.style.visibility = 'hidden';
        tab.style.opacity = '0';
        tab.style.pointerEvents = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab by removing hidden class and adding active class
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.remove('hidden');
        tabElement.classList.add('active');
        tabElement.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;';
    }
    
    // Activate the corresponding button
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Get current event data
    let eventData = window.currentEventDetails || currentEventData;
    
    // If we have currentEventId but no event data yet, we need to wait or use currentEventId
    if (!eventData && currentEventId) {
        // Create minimal event object from currentEventId to fetch attendees
        eventData = { event_id: currentEventId };
    }
    
    // Load/Render data for specific tabs when they're opened
    if (tabName === 'details') {
        loadEventDetailsForTab();
    } else if (tabName === 'attendees') {
        // Check if we're in modal view or full-page view
        const modalContent = document.getElementById('eventTabContent');
        const fullPageAttendeesTable = document.getElementById('initialListBody');
        
        if (modalContent && modalContent.parentElement?.parentElement?.id === 'eventDetailsModal') {
            // Modal view
            if (eventData && eventData.event_id) {
                renderEventAttendeesTab(eventData);
            }
        } else if (fullPageAttendeesTable) {
            // Full page view - use loadEventAttendees with isModalContext = false
            if (typeof loadEventAttendees === 'function') {
                const eventToLoad = eventData || (currentEventId ? {event_id: currentEventId} : null);
                if (eventToLoad && eventToLoad.event_id) {
                    loadEventAttendees(eventToLoad, false); // false = not modal context
                }
            }
        }
    } else if (tabName === 'tasks') {
        if (eventData && eventData.event_id) {
            // Check if this is modal view or full page view
            const modalContent = document.getElementById('eventTabContent');
            const fullPageTasksTable = document.getElementById('eventTasksTableBody');
            
            if (modalContent && modalContent.parentElement?.parentElement?.id === 'eventDetailsModal') {
                // Modal view - use renderEventTasksTab
                renderEventTasksTab(eventData);
            } else if (fullPageTasksTable) {
                // Full page view - load tasks directly
                loadEventTasks(eventData);
            }
        }
    } else if (tabName === 'program') {
        if (currentEventId) {
            window.currentEventId = currentEventId;
            loadProgramItems();
        }
    } else if (tabName === 'marketing') {
        if (currentEventId) {
            window.currentEventId = currentEventId;
            loadMarketingAssets();
            loadGiveaways();
        }
    } else if (tabName === 'logistics') {
        if (currentEventId) {
            window.currentEventId = currentEventId;
            loadLogistics();
        }
    } else if (tabName === 'finance') {
        if (currentEventId) {
            window.currentEventId = currentEventId;
            loadExpenses();
        }
    } else if (tabName === 'postmortem') {
        if (currentEventId) {
            window.currentEventId = currentEventId;
            // Automatically generate the postmortem report when viewing this tab
            if (typeof generateAutomatedReport === 'function') {
                generateAutomatedReport();
            }
        }
    }
}

// Load event details from API
function loadEventDetails() {
    if (!currentEventId) {
        return;
    }
    
    // Ensure window.currentEventId is set for other functions
    window.currentEventId = currentEventId;
    
    const headers = getUserHeaders();
    
    fetch(`${API_BASE}/events.php?action=detail&event_id=${currentEventId}`, { headers })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.data) {
                currentEventData = data.data;
                window.currentEventData = data.data;  // Ensure window.currentEventData is set for other functions
                displayEventDetailsData(data.data);
            } else {
                alert('Failed to load event details');
            }
        })
        .catch(error => {
            console.error('✗ Error loading event details:', error);
            alert('Error loading event details: ' + error.message);
        });
}

// Display event details in the form fields
function displayEventDetailsData(event) {
    if (!event) return;
    
    // Dashboard Stats
    const registered = event.total_registrations || 0;
    const attended = event.attended_count || 0;
    
    document.getElementById('dashRegistrations').textContent = registered;
    document.getElementById('dashRegistrationsDetail').textContent = `Checked in: ${attended} (${registered > 0 ? Math.round((attended/registered)*100) : 0}%)`;
    document.getElementById('dashTaskCompletion').textContent = '0%';
    document.getElementById('dashTaskDetail').textContent = '0/0 tasks done';
    document.getElementById('dashLogistics').textContent = '0%';
    document.getElementById('dashLogisticsDetail').textContent = '0 logistics items tracked';
    document.getElementById('dashBudget').textContent = '₱0.00';
    document.getElementById('dashBudgetDetail').textContent = '0 expense line items';
    
    // Load real data for dashboard from APIs
    loadDashboardTaskData();
    
    // ============ BASIC INFORMATION ============
    document.getElementById('detailsEventTitle').value = event.event_name || '-';
    
    // Handle location - show "TBA" if empty, undefined, or null
    const locationValue = event.location && event.location.trim() && event.location !== 'undefined' && event.location !== 'null' ? event.location : 'TBA';
    document.getElementById('detailsEventLocation').value = locationValue;
    
    document.getElementById('detailsEventDate').value = event.event_date || '';
    document.getElementById('detailsStartTime').value = convert24To12Hour(event.start_time) || '-';
    document.getElementById('detailsEndTime').value = convert24To12Hour(event.end_time) || '-';
    document.getElementById('detailsEventCapacity').value = event.capacity || '-';
    
    // Handle description - show actual value or "-"
    const descValue = event.description && event.description.trim() && event.description !== 'undefined' && event.description !== 'null' ? event.description : '-';
    document.getElementById('detailsEventDescription').value = descValue;
    
    // Event Image
    const imageContainer = document.getElementById('detailsEventImage');
    if (event.image_url) {
        const imageUrl = getImageUrl(event.image_url);
        imageContainer.innerHTML = `<img src="${imageUrl}" alt="${event.event_name}" style="max-width: 100%; max-height: 400px; border-radius: 4px; object-fit: contain;">`;
    } else {
        imageContainer.innerHTML = '<span class="text-gray-400">📷 No image available</span>';
    }
    
    // ============ REGISTRATION & WEB LINKS ============
    document.getElementById('detailsRegistrationLink').value = event.registration_link || '-';
    document.getElementById('detailsWebsite').value = event.website || '-';
    
    // ============ PRIVACY ACCESS ============
    const privateCheckbox = document.getElementById('detailsPrivateEvent');
    privateCheckbox.checked = event.is_private == 1;
}


// Load task data for dashboard KPIs
function loadDashboardTaskData() {
    if (!currentEventId) {
        return;
    }
    
    fetch(`${API_BASE}/tasks.php?action=list&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to load tasks');
        return response.json();
    })
    .then(data => {
        if (data.success && Array.isArray(data.data)) {
            const tasks = data.data;
            
            // Count tasks by status
            const taskCounts = {
                done: tasks.filter(t => t.status === 'Done').length,
                inProgress: tasks.filter(t => t.status === 'In Progress').length,
                pending: tasks.filter(t => t.status === 'Pending').length
            };
            
            const total = tasks.length;
            const completionPercentage = total > 0 ? Math.round((taskCounts.done / total) * 100) : 0;
            
            // Update Task Completion KPI
            document.getElementById('dashTaskCompletion').textContent = completionPercentage + '%';
            document.getElementById('dashTaskDetail').textContent = `${taskCounts.done}/${total} tasks done`;
            
            // Update Task Status Mix with proportional bars
            const doneWidth = total > 0 ? (taskCounts.done / total) * 100 : 0;
            const inProgressWidth = total > 0 ? (taskCounts.inProgress / total) * 100 : 0;
            const pendingWidth = total > 0 ? (taskCounts.pending / total) * 100 : 0;
            
            // Create bar HTML for all statuses with consistent layout
            const createBar = (label, color, width, count) => {
                return `
                    <div class="flex items-center justify-between gap-3 mb-3">
                        <span class="text-gray-600 min-w-20">${label}</span>
                        <div style="width: 300px; height: 8px; background: #e8e8e8; border-radius: 4px; overflow: hidden;">
                            ${count > 0 ? `<div style="height: 100%; background: ${color}; width: ${width}%;"></div>` : ''}
                        </div>
                        <span class="font-semibold text-gray-900 min-w-8 text-right">${count}</span>
                    </div>
                `;
            };
            
            document.getElementById('taskStatusList').innerHTML = `
                ${createBar('Done', '#10b981', doneWidth, taskCounts.done)}
                ${createBar('In Progress', '#f59e0b', inProgressWidth, taskCounts.inProgress)}
                ${createBar('Pending', '#9ca3af', pendingWidth, taskCounts.pending)}
            `;
            
            document.getElementById('taskStatusTotal').textContent = `${total} total tasks`;
        }
    })
    .catch(error => {
        // Silently fail - dashboard shows 0% tasks which is acceptable
    });
}

// Load event details for the Event Details tab
function loadEventDetailsForTab() {
    if (!currentEventId) {
        console.warn('⚠ No event ID available');
        return;
    }
    
    console.log('📋 Loading complete event details tab data for event:', currentEventId);
    
    // Fetch full event details
    fetch(`${API_BASE}/events.php?action=detail&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch event details');
        return response.json();
    })
    .then(data => {
        if (data.success && data.data) {
            const event = data.data;
            console.log('✓ Full event data received:', event);
            
            // Display all collected event data
            displayEventDetailsForTab(event);
            
            // Load related data
            loadEventPrivacyInfo();
            loadEventCoordinators();
            loadEventOtherInfo();
        } else {
            console.error('✗ Failed to load event details:', data.message);
        }
    })
    .catch(error => {
        console.error('✗ Error loading event details for tab:', error);
    });
}

// Display event details in the Details tab
function displayEventDetailsForTab(event) {
    if (!event) return;
    
    console.log('📝 Displaying all event details in tab');
    
    // ============ BASIC INFORMATION ============
    document.getElementById('detailsEventTitle').value = event.event_name || '-';
    
    const locationValue = event.location && event.location.trim() && event.location !== 'undefined' && event.location !== 'null' ? event.location : 'TBA';
    document.getElementById('detailsEventLocation').value = locationValue;
    
    document.getElementById('detailsEventDate').value = event.event_date || '';
    
    // Combine date and time for Start Event datetime-local field
    const startDateTime = event.event_date && event.start_time ? 
        `${event.event_date}T${event.start_time.substring(0, 5)}` : '';
    document.getElementById('detailsStartTime').value = startDateTime;
    
    // Combine date and time for End Event datetime-local field
    const endDateTime = event.event_date && event.end_time ? 
        `${event.event_date}T${event.end_time.substring(0, 5)}` : '';
    document.getElementById('detailsEndTime').value = endDateTime;
    
    // Registration Period
    document.getElementById('detailsRegistrationStart').value = event.registration_start || '';
    document.getElementById('detailsRegistrationEnd').value = event.registration_end || '';
    
    document.getElementById('detailsEventCapacity').value = event.capacity || '-';
    
    const descValue = event.description && event.description.trim() && event.description !== 'undefined' && event.description !== 'null' ? event.description : '-';
    document.getElementById('detailsEventDescription').value = descValue;
    
    // Event Image
    const imageContainer = document.getElementById('detailsEventImage');
    if (event.image_url) {
        const imageUrl = getImageUrl(event.image_url);
        imageContainer.innerHTML = `<img src="${imageUrl}" alt="${event.event_name}" style="max-width: 100%; max-height: 400px; border-radius: 4px; object-fit: contain;">`;
    } else {
        imageContainer.innerHTML = '<span class="text-gray-400">📷 No image available</span>';
    }
    
    // ============ REGISTRATION & WEB LINKS ============
    document.getElementById('detailsRegistrationLink').value = event.registration_link || '-';
    document.getElementById('detailsWebsite').value = event.website || '-';
    
    // ============ PRIVACY ACCESS ============
    const privateCheckbox = document.getElementById('detailsPrivateEvent');
    if (privateCheckbox) {
        privateCheckbox.checked = event.is_private == 1;
    }
    
    // Log all event fields for debugging
    console.log('✓ Event Details Tab populated with all available data');
    console.log('  - Event ID:', event.event_id);
    console.log('  - Event Name:', event.event_name);
    console.log('  - Location:', event.location);
    console.log('  - Date:', event.event_date);
    console.log('  - Time:', event.start_time, '-', event.end_time);
    console.log('  - Capacity:', event.capacity);
    console.log('  - Registrations:', event.total_registrations);
    console.log('  - Private:', event.is_private);
    console.log('  - Registration Link:', event.registration_link);
    console.log('  - Website:', event.website);
}

// Load private event access code
function loadEventPrivacyInfo() {
    if (!currentEventId) return;
    
    console.log('🔒 Loading privacy info for event:', currentEventId);
    
    fetch(`${API_BASE}/events.php?action=detail&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            const event = data.data;
            
            // Update Privacy Access - check if private
            const privateCheckbox = document.getElementById('detailsPrivateEvent');
            if (privateCheckbox) {
                privateCheckbox.checked = event.is_private == 1;
            }
            
            // Load access code if private
            if (event.is_private == 1) {
                console.log('🔑 Event is private, fetching access code...');
                fetch(`${API_BASE}/events.php?action=access_code&event_id=${currentEventId}`, {
                    headers: getUserHeaders()
                })
                .then(r => r.json())
                .then(d => {
                    if (d.success && d.access_code) {
                        document.getElementById('detailsPrivateAccessCode').value = d.access_code;
                        console.log('✓ Access code loaded');
                    } else {
                        document.getElementById('detailsPrivateAccessCode').value = '—';
                    }
                })
                .catch(err => {
                    console.warn('⚠ Could not fetch access code:', err.message);
                    document.getElementById('detailsPrivateAccessCode').value = '—';
                });
            } else {
                console.log('ℹ Event is public, no access code needed');
                document.getElementById('detailsPrivateAccessCode').value = '—';
            }
            
            console.log('✓ Privacy info loaded');
        }
    })
    .catch(error => {
        console.warn('⚠ Could not load privacy info:', error.message);
    });
}

// Load event coordinators
function loadEventCoordinators() {
    if (!currentEventId) return;
    
    console.log('👥 Loading coordinators for event:', currentEventId);
    
    // Fetch all coordinators assigned to this event from the junction table
    fetch(`${API_BASE}/events.php?action=get_event_coordinators&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch event coordinators');
        return response.json();
    })
    .then(data => {
        const coordinatorsList = document.getElementById('eventCoordinatorsList');
        if (!coordinatorsList) return;
        
        if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
            // Display all assigned coordinators
            const rows = data.data.map(coordinator => {
                const profileImage = coordinator.coordinator_image;
                
                let profileImageHtml;
                if (profileImage) {
                    let imgSrc = profileImage;
                    if (!profileImage.includes('/')) {
                        imgSrc = `../uploads/coordinators/${profileImage}`;
                    }
                    profileImageHtml = `<td style="padding: 12px 16px; text-align: center;">
                        <div style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); background-image: url('${imgSrc}'); background-size: cover; background-position: center; background-color: #3b82f6;">
                        </div>
                    </td>`;
                } else {
                    const initials = (coordinator.coordinator_name || 'C').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    profileImageHtml = `<td style="padding: 12px 16px; text-align: center;">
                        <div style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; color: white;">
                            ${initials}
                        </div>
                    </td>`;
                }
                
                return `
                    <tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">
                        ${profileImageHtml}
                        <td style="padding: 10px 12px; color: #1f2937; font-weight: 500; font-size: 13px;">${coordinator.coordinator_name || '-'}</td>
                        <td style="padding: 10px 12px; color: #6b7280; font-size: 13px;">${coordinator.email || '-'}</td>
                        <td style="padding: 10px 12px; color: #6b7280; font-size: 13px;">${coordinator.company || '-'}</td>
                        <td style="padding: 10px 12px; color: #6b7280; font-size: 13px;">${coordinator.contact_number || '-'}</td>
                        <td style="padding: 10px 12px; text-align: center;">
                            <button class="action-btn" onclick="removeCoordinatorFromEvent(${coordinator.coordinator_id})" title="Remove Coordinator" style="padding: 6px; background: white; border: 1px solid #ef4444; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#ef4444" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-6.287 10.713Q11 16.425 11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17t.713-.288m4 0Q15 16.426 15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17t.713-.288M7 6v13z"/></svg>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            coordinatorsList.innerHTML = rows;
            console.log('✓ Coordinators loaded:', data.data.length);
            
            // Add hover effects to remove buttons
            coordinatorsList.querySelectorAll('.action-btn').forEach(btn => {
                btn.addEventListener('mouseover', function() {
                    this.style.transform = 'scale(1.15)';
                    this.style.backgroundColor = '#fef2f2';
                    this.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
                });
                btn.addEventListener('mouseout', function() {
                    this.style.transform = 'scale(1)';
                    this.style.backgroundColor = 'white';
                    this.style.boxShadow = 'none';
                });
            });
        } else {
            coordinatorsList.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #9ca3af;">No coordinators assigned yet</td></tr>';
            console.log('✓ No coordinators assigned');
        }
    })
    .catch(error => {
        console.error('✗ Error loading coordinators:', error);
        const coordinatorsList = document.getElementById('eventCoordinatorsList');
        if (coordinatorsList) {
            coordinatorsList.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #9ca3af;">Error loading coordinators</td></tr>';
        }
    });
}

// Load event other info/custom fields
function loadEventOtherInfo() {
    if (!currentEventId) return;
    
    console.log('📝 Loading other information for event:', currentEventId);
    
    // Fetch metadata from API
    fetch(`${API_BASE}/metadata.php?action=list&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch metadata');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayEventOtherInfo(data.data || []);
            // Add event listener for search
            const searchInput = document.getElementById('otherInfoSearchInput');
            if (searchInput) {
                searchInput.removeEventListener('keyup', filterOtherInfoList);
                searchInput.addEventListener('keyup', filterOtherInfoList);
            }
        } else {
            const otherInfoList = document.getElementById('eventOtherInfoList');
            if (otherInfoList) {
                otherInfoList.innerHTML = '<tr><td colspan="3" class="px-4 py-6 text-center text-gray-500">No custom fields added yet</td></tr>';
            }
        }
    })
    .catch(error => {
        console.error('✗ Error loading other info:', error);
        const otherInfoList = document.getElementById('eventOtherInfoList');
        if (otherInfoList) {
            otherInfoList.innerHTML = '<tr><td colspan="3" class="px-4 py-6 text-center text-gray-500">No custom fields added yet</td></tr>';
        }
    });
}

// Display event other information in table
function displayEventOtherInfo(metadata) {
    const otherInfoList = document.getElementById('eventOtherInfoList');
    if (!otherInfoList) return;
    
    if (!metadata || metadata.length === 0) {
        otherInfoList.innerHTML = '<tr><td colspan="3" class="px-4 py-6 text-center text-gray-500">No custom fields added yet</td></tr>';
        return;
    }
    
    const html = metadata.map(item => {
        const fieldNameEscaped = escapeHtml(item.field_name).replace(/'/g, "&#39;");
        const fieldValueEscaped = escapeHtml(item.field_value).replace(/'/g, "&#39;");
        return `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-2.5 text-sm text-gray-900">${escapeHtml(item.field_name)}</td>
            <td class="px-4 py-2.5 text-sm text-gray-700">${escapeHtml(item.field_value)}</td>
            <td class="px-4 py-2.5 text-right text-sm space-x-2 flex justify-end gap-2">
                <button class="action-btn" title="Edit Other Information" onclick="openEditOtherInfoModal(${item.metadata_id}, '${fieldNameEscaped}', '${fieldValueEscaped}')" style="padding: 6px; background: white; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="#5a5f68" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M19.09 14.441v4.44a2.37 2.37 0 0 1-2.369 2.369H5.12a2.37 2.37 0 0 1-2.369-2.383V7.279a2.356 2.356 0 0 1 2.37-2.37H9.56"/><path d="M6.835 15.803v-2.165c.002-.357.144-.7.395-.953l9.532-9.532a1.36 1.36 0 0 1 1.934 0l2.151 2.151a1.36 1.36 0 0 1 0 1.934l-9.532 9.532a1.36 1.36 0 0 1-.953.395H8.197a1.36 1.36 0 0 1-1.362-1.362M19.09 8.995l-4.085-4.086"/></g></svg>
                </button>
                <button class="action-btn" title="Delete Other Information" onclick="deleteOtherInfo(${item.metadata_id})" style="padding: 6px; background: white; border: 1px solid #ef4444; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#ef4444" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-6.287 10.713Q11 16.425 11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17t.713-.288m4 0Q15 16.426 15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17t.713-.288M7 6v13z"/></svg>
                </button>
            </td>
        </tr>
    `;
    }).join('');
    
    
    otherInfoList.innerHTML = html;
    console.log('✓ Other information displayed:', metadata.length);
    
    // Add hover effects to action buttons
    otherInfoList.querySelectorAll('.action-btn').forEach((btn, index) => {
        const isDeleteBtn = index % 2 === 1; // Delete buttons are at odd indices
        btn.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.15)';
            if (isDeleteBtn) {
                this.style.backgroundColor = '#fef2f2';
                this.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
            } else {
                this.style.backgroundColor = '#f3f4f6';
                this.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.2)';
            }
        });
        btn.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
            this.style.backgroundColor = 'white';
            this.style.boxShadow = 'none';
        });
    });
}

// Open edit other information modal
function openEditOtherInfoModal(metadataId, fieldName, fieldValue) {
    document.getElementById('editOtherInfoMetadataId').value = metadataId;
    document.getElementById('editOtherInfoFieldName').value = fieldName;
    document.getElementById('editOtherInfoFieldValue').value = fieldValue;
    document.getElementById('editOtherInformationModal').classList.add('active');
}

// Delete other information
function deleteOtherInfo(metadataId) {
    console.log('🔍 deleteOtherInfo called:', { metadataId });
    
    let modal = document.getElementById('deleteOtherInformationModal');
    console.log('🔍 Modal found:', !!modal);
    
    if (!modal) {
        console.log('🔍 Modal not found, creating modals...');
        if (typeof createOtherInformationModals === 'function') {
            createOtherInformationModals();
            modal = document.getElementById('deleteOtherInformationModal');
        }
    }
    
    if (!modal) {
        console.error('❌ Modal still not available');
        showNotification('Error: Modal not available', 'error');
        return;
    }
    
    console.log('✅ Showing modal for deletion');
    window.pendingDeleteMetadataId = metadataId;
    modal.classList.add('active');
}

// Copy access code to clipboard
function copyAccessCode() {
    const codeField = document.getElementById('detailsPrivateAccessCode');
    if (codeField && codeField.value && codeField.value !== '—') {
        navigator.clipboard.writeText(codeField.value).then(() => {
            showNotification('Access code copied to clipboard!', 'success');
        }).catch(() => {
            alert('Failed to copy access code');
        });
    }
}

// Filter coordinators list
function filterCoordinatorsList() {
    const searchValue = document.getElementById('coordinatorSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#eventCoordinatorsList tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? '' : 'none';
    });
}

// Open create other info modal
function openCreateOtherInfoModal() {
    if (!currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    // Reset form
    document.getElementById('otherInformationForm').reset();
    document.getElementById('otherInfoEventId').value = currentEventId;
    
    // Open modal
    const modal = document.getElementById('createOtherInformationModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Save event details
// ================================================================================
// EVENT DETAILS BUTTON STATE MANAGEMENT
// ================================================================================

function enableEventEdit() {
    console.log('✏️ Enabling event edit mode');
    
    // Get all input and textarea fields in the event details section
    const eventDetailsForm = document.querySelector('.event-details-form');
    if (!eventDetailsForm) {
        console.error('❌ Event details form not found');
        return;
    }
    
    // Enable all form fields
    const inputs = eventDetailsForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.removeAttribute('disabled');
        input.style.opacity = '1';
        input.style.cursor = 'text';
    });
    
    // Hide Cancel and Edit buttons, show Save button
    document.getElementById('cancelEventDetailsBtn').style.display = 'none';
    document.getElementById('editEventDetailsBtn').style.display = 'none';
    document.getElementById('saveEventDetailsBtn').style.display = 'inline-block';
    
    console.log('✓ Event edit mode enabled');
}

function cancelEventEdit() {
    console.log('✕ Cancelling event edit mode');
    
    // Get all input and textarea fields in the event details section
    const eventDetailsForm = document.querySelector('.event-details-form');
    if (!eventDetailsForm) {
        console.error('❌ Event details form not found');
        return;
    }
    
    // Disable all form fields (make readonly)
    const inputs = eventDetailsForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('disabled', 'disabled');
        input.style.opacity = '0.7';
        input.style.cursor = 'not-allowed';
    });
    
    // Show Cancel and Edit buttons, hide Save button
    document.getElementById('cancelEventDetailsBtn').style.display = 'inline-block';
    document.getElementById('editEventDetailsBtn').style.display = 'inline-block';
    document.getElementById('saveEventDetailsBtn').style.display = 'none';
    
    console.log('✓ Edit mode cancelled, form fields disabled');
}

function toggleEventDetailsEditMode() {
    console.log('🔄 Toggling event details edit mode');
    
    // Check current state of Cancel button (if visible, we're in editing mode)
    const cancelBtn = document.getElementById('cancelEventDetailsBtn');
    if (cancelBtn.style.display !== 'none') {
        cancelEventEdit(); // Currently in view mode, go to edit via cancel click
    } else {
        enableEventEdit(); // Currently in edit mode, go back to view
    }
}

function saveEventDetails() {
    if (!currentEventId) {
        alert('No event selected');
        return;
    }
    
    console.log('💾 Saving event details for event ID:', currentEventId);
    
    // Get all input and textarea fields in the event details section
    const eventDetailsForm = document.querySelector('.event-details-form');
    if (!eventDetailsForm) {
        console.error('❌ Event details form not found');
        return;
    }
    
    // Collect all updated values using correct field IDs
    const eventDateVal = document.getElementById('detailsEventDate')?.value || '';
    const startTimeVal = document.getElementById('detailsStartTime')?.value || '';
    const endTimeVal = document.getElementById('detailsEndTime')?.value || '';
    
    // Extract time from datetime-local format (2026-03-01T14:30 -> 14:30:00)
    const startTime = startTimeVal ? startTimeVal.split('T')[1] + ':00' : '';
    const endTime = endTimeVal ? endTimeVal.split('T')[1] + ':00' : '';
    
    const capacityVal = document.getElementById('detailsEventCapacity')?.value || '0';
    const isPrivateCheckbox = document.getElementById('detailsPrivateEvent');
    
    const eventData = {
        event_id: currentEventId,
        event_name: document.getElementById('detailsEventTitle')?.value || '',
        description: document.getElementById('detailsEventDescription')?.value || '',
        event_date: eventDateVal,
        start_time: startTime,
        end_time: endTime,
        location: document.getElementById('detailsEventLocation')?.value || '',
        capacity: parseInt(capacityVal, 10) || 0,  // Convert to integer for API
        website_link: document.getElementById('detailsWebsite')?.value || '',  // Matches API expectation: website_link not website
        registration_link: document.getElementById('detailsRegistrationLink')?.value || '',
        is_private: isPrivateCheckbox?.checked ? 1 : 0  // Get from checkbox .checked property
    };
    
    console.log('📋 DETAILED FIELD DEBUG:');
    console.log('  Event Title:', document.getElementById('detailsEventTitle')?.value, '-> eventData.event_name:', eventData.event_name);
    console.log('  Event Location:', document.getElementById('detailsEventLocation')?.value, '-> eventData.location:', eventData.location);
    console.log('  Event Capacity:', document.getElementById('detailsEventCapacity')?.value, '-> eventData.capacity:', eventData.capacity);
    console.log('  Event Date:', eventDateVal, '-> eventData.event_date:', eventData.event_date);
    console.log('  Start Time:', startTimeVal, '-> eventData.start_time:', eventData.start_time);
    console.log('  End Time:', endTimeVal, '-> eventData.end_time:', eventData.end_time);
    console.log('  Website:', document.getElementById('detailsWebsite')?.value, '-> eventData.website_link:', eventData.website_link);
    console.log('  Is Private:', isPrivateCheckbox?.checked, '-> eventData.is_private:', eventData.is_private);
    console.log('📤 Complete event data to send:');
    console.log(eventData);
    
    // Send UPDATE request to API using PUT method (not POST, to avoid creating duplicates)
    fetch(`${API_BASE}/events.php`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getUserHeaders()
        },
        body: JSON.stringify(eventData)
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('✓ API Response:', data);
        
        if (data.success) {
            // Disable all form fields after save
            const inputs = eventDetailsForm.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.setAttribute('readonly', 'readonly');
                input.setAttribute('disabled', 'disabled');
                input.style.opacity = '0.7';
                input.style.cursor = 'not-allowed';
            });
            
            // Show Cancel and Edit buttons, hide Save button
            document.getElementById('cancelEventDetailsBtn').style.display = 'inline-block';
            document.getElementById('editEventDetailsBtn').style.display = 'inline-block';
            document.getElementById('saveEventDetailsBtn').style.display = 'none';
            
            showNotification('✓ Event details saved successfully!', 'success');
            console.log('✓ Event saved successfully to database');
            
            // Reload event details to reflect changes
            if (typeof loadEventDetails === 'function') {
                setTimeout(() => loadEventDetails(currentEventId), 500);
            }
        } else {
            showNotification('Error: ' + (data.message || 'Failed to save event'), 'error');
            console.error('❌ API returned error:', data.message);
        }
    })
    .catch(error => {
        console.error('❌ Error saving event details:', error);
        showNotification('Error saving event: ' + error.message, 'error');
    });
}

// ================================================================================
// COORDINATOR LOOKUP & ASSIGNMENT (Event Details)
// ================================================================================

function openLookupCoordinatorModal() {
    console.log('🔍 Opening Lookup Coordinator modal');
    
    const modal = document.getElementById('lookupCoordinatorModal');
    if (!modal) {
        console.error('❌ Lookup Coordinator modal not found');
        return;
    }
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Fetch and populate available coordinators
    fetch(`${API_BASE}/coordinators.php?action=list`, {
        headers: getUserHeaders()
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch coordinators');
        return response.json();
    })
    .then(data => {
        const list = document.getElementById('coordinatorsLookupList');
        if (!list) return;
        
        if (data.success && Array.isArray(data.data)) {
            list.innerHTML = data.data.map(coordinator => {
                const profileImage = coordinator.profile_image || coordinator.coordinator_image;
                
                let profileImageHtml;
                if (profileImage) {
                    let imgSrc = profileImage;
                    if (!profileImage.includes('/')) {
                        imgSrc = `../uploads/coordinators/${profileImage}`;
                    }
                    profileImageHtml = `
                        <div style="width: 48px; height: 48px; border-radius: 50%; background-image: url('${imgSrc}'); background-size: cover; background-position: center; background-color: #3b82f6; flex-shrink: 0;">
                        </div>
                    `;
                } else {
                    const initials = (coordinator.coordinator_name || 'C').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    profileImageHtml = `
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: white; flex-shrink: 0;">
                            ${initials}
                        </div>
                    `;
                }
                
                return `
                    <div class="coordinator-item" style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; transition: all 0.3s; cursor: pointer;" onclick="toggleCoordinatorCheckbox(this, ${coordinator.coordinator_id})" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                        <input type="checkbox" class="coordinator-checkbox" data-coordinator-id="${coordinator.coordinator_id}" style="width: 20px; height: 20px; cursor: pointer; accent-color: #1E73BB;" onclick="event.stopPropagation()">
                        ${profileImageHtml}
                        <div style="flex: 1; min-width: 0;">
                            <h4 style="margin: 0; font-weight: 600; color: #1f2937; font-size: 15px;">${coordinator.coordinator_name || '-'}</h4>
                            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${coordinator.email || '-'}</p>
                            <p style="margin: 2px 0 0 0; font-size: 13px; color: #6b7280;">${coordinator.company || 'No company'}</p>
                        </div>
                    </div>
                `;
            }).join('');
            console.log('✓ Coordinators loaded:', data.data.length);
        } else {
            list.innerHTML = '<div style="padding: 32px; text-align: center; color: #9ca3af;">No coordinators found</div>';
            console.warn('⚠ No coordinators found or invalid response');
        }
    })
    .catch(error => {
        console.error('✗ Error fetching coordinators:', error);
        const list = document.getElementById('coordinatorsLookupList');
        if (list) {
            list.innerHTML = '<div style="padding: 32px; text-align: center; color: #ef4444;">Error loading coordinators</div>';
        }
        showNotification('Error loading coordinators', 'error');
    });
}

function toggleCoordinatorCheckbox(element, coordinatorId) {
    const checkbox = element.querySelector('.coordinator-checkbox');
    checkbox.checked = !checkbox.checked;
}

function closeLookupCoordinatorModal() {
    console.log('✕ Closing Lookup Coordinator modal');
    const modal = document.getElementById('lookupCoordinatorModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function filterCoordinatorsLookup() {
    const searchInput = document.getElementById('coordinatorSearchFilterInput');
    const searchTerm = searchInput.value.toLowerCase();
    const coordinatorItems = document.querySelectorAll('.coordinator-item');
    
    coordinatorItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
}

function assignMultipleCoordinators() {
    if (!currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const checkboxes = document.querySelectorAll('.coordinator-checkbox:checked');
    if (checkboxes.length === 0) {
        showNotification('Please select at least one coordinator', 'error');
        return;
    }
    
    // Collect ALL selected coordinator IDs
    const coordinatorIds = Array.from(checkboxes).map(checkbox => parseInt(checkbox.dataset.coordinatorId));
    console.log(`📋 Assigning ${coordinatorIds.length} coordinator(s) to event ${currentEventId}`, coordinatorIds);
    
    // Show loading state
    const assignButton = document.getElementById('assignCoordinatorsBtn');
    if (assignButton) {
        assignButton.disabled = true;
        assignButton.textContent = '⏳ Assigning...';
    }
    
    // Assign all selected coordinators via API
    fetch(`${API_BASE}/events.php`, {
        method: 'PUT',
        headers: {
            ...getUserHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            event_id: currentEventId,
            coordinator_ids: coordinatorIds,
            action: 'assign_multiple_coordinators'
        })
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log(`✓ ${coordinatorIds.length} coordinator(s) assigned successfully`);
            showNotification(`${coordinatorIds.length} coordinator(s) assigned successfully!`, 'success');
            
            // Close modal
            closeLookupCoordinatorModal();
            
            // Reload the coordinators list
            setTimeout(() => {
                loadEventCoordinators();
            }, 300);
        } else {
            throw new Error(data.message || 'Failed to assign coordinators');
        }
    })
    .catch(error => {
        console.error('✗ Error assigning coordinators:', error);
        showNotification('Error assigning coordinators: ' + error.message, 'error');
    })
    .finally(() => {
        if (assignButton) {
            assignButton.disabled = false;
            assignButton.textContent = '✓ Assign Selected';
        }
    });
}

function removeCoordinatorFromEvent(coordinatorId) {
    if (!currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    // Show modal confirmation instead of browser alert
    let modal = document.getElementById('removeCoordinatorModal');
    if (!modal) {
        // Modal not found, create it if possible
        if (typeof createOtherInformationModals === 'function') {
            createOtherInformationModals();
        }
        modal = document.getElementById('removeCoordinatorModal');
    }
    
    if (modal) {
        window.pendingRemoveCoordinatorId = coordinatorId;
        window.pendingRemoveEventId = currentEventId;
        modal.classList.add('active');
    } else {
        // Fallback if modal cannot be created
        showNotification('Modal not available', 'error');
    }
}

// ============ PROGRAM MANAGEMENT ============

function openAddProgramModal() {
    const modal = document.getElementById('addProgramModal');
    if (modal) {
        const addProgramForm = document.getElementById('addProgramForm');
        addProgramForm.reset();
        delete addProgramForm.dataset.editTimelineId;
        delete addProgramForm.dataset.editFlowId;
        delete addProgramForm.dataset.isEditing;
        delete addProgramForm.dataset.flowOnly;
        const submitBtn = document.querySelector('#addProgramForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Create';
        
        // Show Entry Type dropdown
        const entryTypeDiv = document.querySelector('#addProgramForm > div:first-child');
        if (entryTypeDiv) entryTypeDiv.style.display = 'block';
        
        document.getElementById('programEntryType').value = 'timeline';
        updateProgramFormFields();
        modal.classList.add('active');
    }
}

function closeProgramModal() {
    const modal = document.getElementById('addProgramModal');
    if (modal) {
        modal.classList.remove('active');
    }
    const addProgramForm = document.getElementById('addProgramForm');
    if (addProgramForm) {
        addProgramForm.reset();
        delete addProgramForm.dataset.editTimelineId;
        delete addProgramForm.dataset.editFlowId;
        delete addProgramForm.dataset.isEditing;
        delete addProgramForm.dataset.flowOnly;
        const submitBtn = document.querySelector('#addProgramForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Create';
    }
}

function updateProgramFormFields() {
    const entryType = document.getElementById('programEntryType').value;
    const timelineFields = document.getElementById('timelineFields');
    const flowFields = document.getElementById('flowFields');
    
    if (entryType === 'timeline') {
        timelineFields.style.display = 'block';
        flowFields.style.display = 'none';
    } else {
        timelineFields.style.display = 'none';
        flowFields.style.display = 'block';
    }
}

function openAddFlowModal() {
    const modal = document.getElementById('addProgramModal');
    if (modal) {
        const addProgramForm = document.getElementById('addProgramForm');
        addProgramForm.reset();
        delete addProgramForm.dataset.editTimelineId;
        delete addProgramForm.dataset.editFlowId;
        delete addProgramForm.dataset.isEditing;
        addProgramForm.dataset.flowOnly = 'true';
        const submitBtn = document.querySelector('#addProgramForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Create';
        
        // Hide Entry Type dropdown
        const entryTypeDiv = document.querySelector('#addProgramForm > div:first-child');
        if (entryTypeDiv) entryTypeDiv.style.display = 'none';
        
        document.getElementById('programEntryType').value = 'flow';
        updateProgramFormFields();
        modal.classList.add('active');
    }
}

// Load program items
function loadProgramItems() {
    if (!window.currentEventId) {
        console.log('[Program] No event ID available');
        return;
    }
    
    console.log('[Program] Loading program items for event:', window.currentEventId);
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    // Load timeline items
    fetch(`${API_BASE}/program.php?action=list-timeline&event_id=${window.currentEventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderProgramTimeline(data.data);
            }
        })
        .catch(error => console.error('[Program] Error loading timeline:', error));
    
    // Load program flow items
    fetch(`${API_BASE}/program.php?action=list-flow&event_id=${window.currentEventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderProgramFlow(data.data);
            }
        })
        .catch(error => console.error('[Program] Error loading flow:', error));
}

function renderProgramTimeline(items) {
    const container = document.getElementById('programTimeline');
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No timeline items yet. Click "Add Program Item" and select "Timeline".</p>';
        return;
    }
    
    // Helper function to format date
    function formatDateDisplay(dateStr) {
        if (!dateStr) return '';
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Handle format YYYY-MM (month input)
        if (dateStr.match(/^\d{4}-\d{2}$/)) {
            const [year, month] = dateStr.split('-');
            const monthIndex = parseInt(month) - 1;
            return `${monthNames[monthIndex]} ${year}`;
        }
        
        // Fallback for old YYYY-MM-DD format if any exist
        const date = new Date(dateStr + 'T00:00:00');
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${month} ${year}`;
    }
    
    container.innerHTML = items.map((item, index) => {
        const dateDisplay = item.month ? formatDateDisplay(item.month) : '';
        const weekText = `Week ${item.week_number}${dateDisplay ? ` in Month of ${dateDisplay}` : ''}`;
        
        return `
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-center gap-4">
                <div class="flex-1">
                    <div class="mb-2">
                        <h4 class="font-semibold text-gray-900 mb-1">${weekText}</h4>
                        <h4 class="font-semibold text-gray-900 text-blue-600">${item.title}</h4>
                    </div>
                    <p class="text-sm text-gray-600">${item.description || ''}</p>
                </div>
                <div class="flex gap-1.5 items-center">
                    <button onclick="editProgramTimeline(${item.timeline_id})" 
                            style="background: transparent; border: 1px solid #3b82f6; color: #3b82f6; cursor: pointer; padding: 8px 12px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" 
                            title="Edit timeline item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g class="edit-outline"><g fill="currentColor" fill-rule="evenodd" class="Vector" clip-rule="evenodd"><path d="M2 6.857A4.857 4.857 0 0 1 6.857 2H12a1 1 0 1 1 0 2H6.857A2.857 2.857 0 0 0 4 6.857v10.286A2.857 2.857 0 0 0 6.857 20h10.286A2.857 2.857 0 0 0 20 17.143V12a1 1 0 1 1 2 0v5.143A4.857 4.857 0 0 1 17.143 22H6.857A4.857 4.857 0 0 1 2 17.143z"/><path d="m15.137 13.219l-2.205 1.33l-1.033-1.713l2.205-1.33l.003-.002a1.2 1.2 0 0 0 .232-.182l5.01-5.036a3 3 0 0 0 .145-.157c.331-.386.821-1.15.228-1.746c-.501-.504-1.219-.028-1.684.381a6 6 0 0 0-.36.345l-.034.034l-4.94 4.965a1.2 1.2 0 0 0-.27.41l-.824 2.073a.2.2 0 0 0 .29.245l1.032 1.713c-1.805 1.088-3.96-.74-3.18-2.698l.825-2.072a3.2 3.2 0 0 1 .71-1.081l4.939-4.966l.029-.029c.147-.15.641-.656 1.24-1.02c.327-.197.849-.458 1.494-.508c.74-.059 1.53.174 2.15.797a2.9 2.9 0 0 1 .845 1.75a3.15 3.15 0 0 1-.23 1.517c-.29.717-.774 1.244-.987 1.457l-5.01 5.036q-.28.281-.62.487m4.453-7.126s-.004.003-.013.006z"/></g></g></svg>
                    </button>
                    <button onclick="deleteProgramTimeline(${item.timeline_id})" 
                            style="background: transparent; border: 1px solid #ef5350; color: #ef5350; cursor: pointer; padding: 8px 12px; display: flex; align-items: center; justify-content: center; border-radius: 4px;" 
                            title="Delete timeline item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 12"><path fill="currentColor" d="M5 3h2a1 1 0 0 0-2 0M4 3a2 2 0 1 1 4 0h2.5a.5.5 0 0 1 0 1h-.441l-.443 5.17A2 2 0 0 1 7.623 11H4.377a2 2 0 0 1-1.993-1.83L1.941 4H1.5a.5.5 0 0 1 0-1zm3.5 3a.5.5 0 0 0-1 0v2a.5.5 0 0 0 1 0zM5 5.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M3.38 9.085a1 1 0 0 0 .997.915h3.246a1 1 0 0 0 .996-.915L9.055 4h-6.11z"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

function renderProgramFlow(items) {
    const tbody = document.getElementById('programFlowTableBody');
    
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">No program flow items yet.</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr style="border-bottom: 1px solid #e8e8e8;">
            <td class="px-4 py-3 text-sm text-gray-900">${item.time || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.location || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.activity || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.time_frame || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.speaker || '-'}</td>
            <td class="px-4 py-3 text-center text-sm">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button onclick="editProgramFlow(${item.flow_id})" 
                            style="background: transparent; border: 1px solid #3b82f6; color: #3b82f6; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 4px;" 
                            title="Edit program flow item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g class="edit-outline"><g fill="currentColor" fill-rule="evenodd" class="Vector" clip-rule="evenodd"><path d="M2 6.857A4.857 4.857 0 0 1 6.857 2H12a1 1 0 1 1 0 2H6.857A2.857 2.857 0 0 0 4 6.857v10.286A2.857 2.857 0 0 0 6.857 20h10.286A2.857 2.857 0 0 0 20 17.143V12a1 1 0 1 1 2 0v5.143A4.857 4.857 0 0 1 17.143 22H6.857A4.857 4.857 0 0 1 2 17.143z"/><path d="m15.137 13.219l-2.205 1.33l-1.033-1.713l2.205-1.33l.003-.002a1.2 1.2 0 0 0 .232-.182l5.01-5.036a3 3 0 0 0 .145-.157c.331-.386.821-1.15.228-1.746c-.501-.504-1.219-.028-1.684.381a6 6 0 0 0-.36.345l-.034.034l-4.94 4.965a1.2 1.2 0 0 0-.27.41l-.824 2.073a.2.2 0 0 0 .29.245l1.032 1.713c-1.805 1.088-3.96-.74-3.18-2.698l.825-2.072a3.2 3.2 0 0 1 .71-1.081l4.939-4.966l.029-.029c.147-.15.641-.656 1.24-1.02c.327-.197.849-.458 1.494-.508c.74-.059 1.53.174 2.15.797a2.9 2.9 0 0 1 .845 1.75a3.15 3.15 0 0 1-.23 1.517c-.29.717-.774 1.244-.987 1.457l-5.01 5.036q-.28.281-.62.487m4.453-7.126s-.004.003-.013.006z"/></g></g></svg>
                    </button>
                    <button onclick="deleteProgramFlow(${item.flow_id})" 
                            style="background: transparent; border: 1px solid #ef5350; color: #ef5350; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 4px;" 
                            title="Delete program flow item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 12"><path fill="currentColor" d="M5 3h2a1 1 0 0 0-2 0M4 3a2 2 0 1 1 4 0h2.5a.5.5 0 0 1 0 1h-.441l-.443 5.17A2 2 0 0 1 7.623 11H4.377a2 2 0 0 1-1.993-1.83L1.941 4H1.5a.5.5 0 0 1 0-1zm3.5 3a.5.5 0 0 0-1 0v2a.5.5 0 0 0 1 0zM5 5.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M3.38 9.085a1 1 0 0 0 .997.915h3.246a1 1 0 0 0 .996-.915L9.055 4h-6.11z"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Save program item
document.addEventListener('DOMContentLoaded', function() {
    const addProgramForm = document.getElementById('addProgramForm');
    if (addProgramForm) {
        addProgramForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const isEditing = addProgramForm.dataset.isEditing === 'true';
            const entryType = document.getElementById('programEntryType').value;
            const eventId = window.currentEventId;
            
            if (!eventId) {
                showNotification('No event selected', 'error');
                return;
            }
            
            const headers = getUserHeaders ? getUserHeaders() : {};
            headers['Content-Type'] = 'application/json';
            
            if (entryType === 'timeline') {
                const weekNumber = document.getElementById('programWeek').value;
                const dateValue = document.getElementById('programDate').value;
                const title = document.getElementById('programTitle').value;
                const description = document.getElementById('programNotes').value;
                
                if (!title) {
                    showNotification('Please enter a title', 'error');
                    return;
                }
                
                const editTimelineId = addProgramForm.dataset.editTimelineId;
                const action = editTimelineId ? 'update-timeline' : 'create-timeline';
                const body = {
                    event_id: eventId,
                    entry_type: 'timeline',
                    month: dateValue,
                    week_number: weekNumber,
                    title: title,
                    description: description
                };
                if (editTimelineId) {
                    body.timeline_id = editTimelineId;
                }
                
                fetch(`${API_BASE}/program.php?action=${action}`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const msg = editTimelineId ? 'Timeline item updated successfully' : 'Timeline item created successfully';
                        showNotification(msg, 'success');
                        closeProgramModal();
                        loadProgramItems();
                    } else {
                        showNotification('Error: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    const errMsg = editTimelineId ? 'Error updating timeline item' : 'Error creating timeline item';
                    showNotification(errMsg, 'error');
                });
            } else {
                const time = document.getElementById('programFlowTime').value;
                const location = document.getElementById('programFlowLocation').value;
                const activity = document.getElementById('programFlowActivity').value;
                const timeFrame = document.getElementById('programFlowTimeFrame').value;
                const speaker = document.getElementById('programFlowSpeaker').value;
                
                if (!time || !activity) {
                    showNotification('Please enter time and activity', 'error');
                    return;
                }
                
                const editFlowId = addProgramForm.dataset.editFlowId;
                const action = editFlowId ? 'update-flow' : 'create-flow';
                const body = {
                    event_id: eventId,
                    time: time,
                    location: location,
                    activity: activity,
                    time_frame: timeFrame,
                    speaker: speaker
                };
                if (editFlowId) {
                    body.flow_id = editFlowId;
                }
                
                fetch(`${API_BASE}/program.php?action=${action}`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const msg = editFlowId ? 'Program flow item updated successfully' : 'Program flow item created successfully';
                        showNotification(msg, 'success');
                        closeProgramModal();
                        loadProgramItems();
                    } else {
                        showNotification('Error: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    const errMsg = editFlowId ? 'Error updating program flow item' : 'Error creating program flow item';
                    showNotification(errMsg, 'error');
                });
            }
        });
    }
});

function editProgramTimeline(timelineId) {
    if (!window.currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/program.php?action=get-timeline&timeline_id=${timelineId}&event_id=${window.currentEventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const item = data.data;
                document.getElementById('programWeek').value = item.week_number || '';
                document.getElementById('programDate').value = item.month || '';
                document.getElementById('programTitle').value = item.title || '';
                document.getElementById('programNotes').value = item.description || '';
                updateProgramFormFields();
                
                // Store the ID for update operation
                document.getElementById('addProgramForm').dataset.editTimelineId = timelineId;
                document.getElementById('addProgramForm').dataset.isEditing = 'true';
                
                // Change button text
                const submitBtn = document.querySelector('#addProgramForm button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Update';
                
                const modal = document.getElementById('addProgramModal');
                if (modal) modal.classList.add('active');
            } else {
                showNotification('Failed to load timeline item', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading timeline:', error);
            showNotification('Error loading timeline item', 'error');
        });
}

function editProgramFlow(flowId) {
    if (!window.currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    // Note: We'll need to add a get-flow endpoint to the API
    // For now, fetch from list and find the item
    fetch(`${API_BASE}/program.php?action=list-flow&event_id=${window.currentEventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success && Array.isArray(data.data)) {
                const item = data.data.find(i => i.flow_id == flowId);
                if (item) {
                    document.getElementById('programEntryType').value = 'flow';
                    document.getElementById('programFlowTime').value = item.time || '';
                    document.getElementById('programFlowLocation').value = item.location || '';
                    document.getElementById('programFlowActivity').value = item.activity || '';
                    document.getElementById('programFlowTimeFrame').value = item.time_frame || '';
                    document.getElementById('programFlowSpeaker').value = item.speaker || '';
                    updateProgramFormFields();
                    
                    // Store the ID for update operation
                    document.getElementById('addProgramForm').dataset.editFlowId = flowId;
                    document.getElementById('addProgramForm').dataset.isEditing = 'true';
                    
                    // Change button text
                    const submitBtn = document.querySelector('#addProgramForm button[type="submit"]');
                    if (submitBtn) submitBtn.textContent = 'Update';
                    
                    const modal = document.getElementById('addProgramModal');
                    if (modal) modal.classList.add('active');
                } else {
                    showNotification('Program flow item not found', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error loading flow:', error);
            showNotification('Error loading program flow item', 'error');
        });
}

function deleteProgramTimeline(timelineId) {
    if (!confirm('Are you sure you want to delete this timeline item?')) return;
    
    const eventId = window.currentEventId;
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/program.php?action=delete-timeline`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            event_id: eventId,
            timeline_id: timelineId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Timeline item deleted', 'success');
            loadProgramItems();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error deleting item', 'error');
    });
}

function deleteProgramFlow(flowId) {
    if (!confirm('Are you sure you want to delete this program flow item?')) return;
    
    const eventId = window.currentEventId;
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/program.php?action=delete-flow`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            event_id: eventId,
            flow_id: flowId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Program flow item deleted', 'success');
            loadProgramItems();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error deleting item', 'error');
    });
}

// ============ GIVEAWAYS MANAGEMENT ============

function handlePosterUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('posterFileName').textContent = file.name;
    }
}

function handleBannerUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('bannerFileName').textContent = file.name;
    }
}

function handleSocialUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('socialFileName').textContent = file.name;
    }
}

function openAddGiveawayModal() {
    // Check if event is selected - try multiple sources
    let eventId = window.currentEventId;
    
    console.log('[Giveaway Modal] Step 1 - Checking window.currentEventId:', eventId);
    
    // If not found, check local currentEventId (from main page)
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
        console.log('[Giveaway Modal] Step 1b - Found local currentEventId:', eventId);
    }
    
    // If still not found, try to get from URL parameter
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id');
        const eventIdAlt1 = params.get('eventId');
        const eventIdAlt2 = params.get('event_id');
        
        // Also try alternative parameter names
        if (!eventId) eventId = eventIdAlt1;
        if (!eventId) eventId = eventIdAlt2;
        
        console.log('[Giveaway Modal] Step 2 - URL parameters found:', {
            'id': params.get('id'),
            'eventId': eventIdAlt1,
            'event_id': eventIdAlt2,
            'using': eventId
        });
        
        // If found in URL, set it to window so it's available for other functions
        if (eventId) {
            window.currentEventId = eventId;
            console.log('[Giveaway Modal] Step 3 - Set window.currentEventId from URL:', eventId);
        }
    }
    
    if (!eventId) {
        console.error('[Giveaway Modal] ❌ NO EVENT ID FOUND!');
        console.error('  - window.currentEventId:', window.currentEventId);
        console.error('  - currentEventId:', typeof currentEventId !== 'undefined' ? currentEventId : 'undefined');
        console.error('  - window.location.search:', window.location.search);
        console.error('  - SOLUTION: Please select an event first by clicking on an event in the sidebar or calendar');
        showNotification('Please select an event from the sidebar or calendar first', 'error');
        return;
    }
    
    console.log('[Giveaway Modal] ✓ Opening modal for event:', eventId);
    window.currentEventId = eventId;  // Ensure it's set
    
    const modal = document.getElementById('addGiveawayModal');
    if (modal) {
        const form = document.getElementById('addGiveawayForm');
        form.reset();
        delete form.dataset.editGiveawayId;
        delete form.dataset.isEditing;
        const submitBtn = document.querySelector('#addGiveawayForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Create';
        modal.classList.add('active');
    }
}

function closeGiveawayModal() {
    const modal = document.getElementById('addGiveawayModal');
    if (modal) {
        modal.classList.remove('active');
    }
    const form = document.getElementById('addGiveawayForm');
    if (form) {
        form.reset();
        delete form.dataset.editGiveawayId;
        delete form.dataset.isEditing;
        const submitBtn = document.querySelector('#addGiveawayForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Create';
    }
}

function openEditGiveawayImagesModal(giveawayId, giveawayName) {
    const modal = document.getElementById('editGiveawayImagesModal');
    if (!modal) {
        console.error('Edit Giveaway Images Modal not found');
        return;
    }
    
    // Set form values
    document.getElementById('editGiveawayId').value = giveawayId;
    document.getElementById('editGiveawayNameDisplay').textContent = giveawayName;
    
    // Reset file inputs and previews
    document.getElementById('giveawayPosterInput').value = '';
    document.getElementById('giveawayBannerInput').value = '';
    document.getElementById('giveawaySocialPackInput').value = '';
    
    document.getElementById('posterPreview').style.display = 'none';
    document.getElementById('bannerPreview').style.display = 'none';
    document.getElementById('socialPackPreview').style.display = 'none';
    
    document.getElementById('posterPlaceholder').style.display = 'block';
    document.getElementById('bannerPlaceholder').style.display = 'block';
    document.getElementById('socialPackPlaceholder').style.display = 'block';
    
    // Show modal
    modal.classList.add('active');
    
    // Setup file input listeners
    setupGiveawayImageInputs();
}

function closeEditGiveawayImagesModal() {
    const modal = document.getElementById('editGiveawayImagesModal');
    if (modal) {
        modal.classList.remove('active');
    }
    const form = document.getElementById('editGiveawayImagesForm');
    if (form) {
        form.reset();
        document.getElementById('editGiveawayId').value = '';
        document.getElementById('posterPreview').style.display = 'none';
        document.getElementById('bannerPreview').style.display = 'none';
        document.getElementById('socialPackPreview').style.display = 'none';
    }
}

function setupGiveawayImageInputs() {
    // Poster preview
    const posterInput = document.getElementById('giveawayPosterInput');
    if (posterInput) {
        posterInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.getElementById('posterImg').src = event.target.result;
                    document.getElementById('posterPreview').style.display = 'block';
                    document.getElementById('posterPlaceholder').style.display = 'none';
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Banner preview
    const bannerInput = document.getElementById('giveawayBannerInput');
    if (bannerInput) {
        bannerInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.getElementById('bannerImg').src = event.target.result;
                    document.getElementById('bannerPreview').style.display = 'block';
                    document.getElementById('bannerPlaceholder').style.display = 'none';
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Social pack preview
    const socialPackInput = document.getElementById('giveawaySocialPackInput');
    if (socialPackInput) {
        socialPackInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                document.getElementById('socialPackName').textContent = '<strong>File selected:</strong> ' + this.files[0].name;
                document.getElementById('socialPackPreview').style.display = 'block';
                document.getElementById('socialPackPlaceholder').style.display = 'none';
            }
        });
    }
    
    // Form submission
    const form = document.getElementById('editGiveawayImagesForm');
    if (form) {
        form.addEventListener('submit', handleSaveGiveawayImages);
    }
}

function handleSaveGiveawayImages(e) {
    e.preventDefault();
    
    const giveawayId = document.getElementById('editGiveawayId').value;
    const posterInput = document.getElementById('giveawayPosterInput');
    const bannerInput = document.getElementById('giveawayBannerInput');
    const socialPackInput = document.getElementById('giveawaySocialPackInput');
    
    // Get event ID from multiple sources
    let eventId = window.currentEventId;
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
        if (eventId) window.currentEventId = eventId;
    }
    
    if (!giveawayId || !eventId) {
        alert('Missing giveaway or event information');
        return;
    }
    
    // Check if at least one file is selected
    if (!posterInput.files[0] && !bannerInput.files[0] && !socialPackInput.files[0]) {
        alert('Please select at least one image');
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('giveaway_id', giveawayId);
    formData.append('event_id', eventId);
    formData.append('action', 'update_images');
    
    if (posterInput.files[0]) {
        formData.append('poster', posterInput.files[0]);
    }
    if (bannerInput.files[0]) {
        formData.append('banner', bannerInput.files[0]);
    }
    if (socialPackInput.files[0]) {
        formData.append('social_pack', socialPackInput.files[0]);
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    
    // Create request options with proper headers for FormData (don't set Content-Type - browser handles it)
    const fetchOptions = {
        method: 'POST',
        body: formData
    };
    
    // Add custom headers for authorization
    const customHeaders = {};
    if (headers['X-User-Role']) customHeaders['X-User-Role'] = headers['X-User-Role'];
    if (headers['X-User-Id']) customHeaders['X-User-Id'] = headers['X-User-Id'];
    if (headers['X-Coordinator-Id']) customHeaders['X-Coordinator-Id'] = headers['X-Coordinator-Id'];
    if (headers['Authorization']) customHeaders['Authorization'] = headers['Authorization'];
    if (headers['X-Admin-Token']) customHeaders['X-Admin-Token'] = headers['X-Admin-Token'];
    
    if (Object.keys(customHeaders).length > 0) {
        fetchOptions.headers = customHeaders;
    }
    
    fetch(`${API_BASE}/giveaways.php`, fetchOptions)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Images updated successfully');
            closeEditGiveawayImagesModal();
            loadGiveaways(); // Reload the table
        } else {
            alert('Error: ' + (data.error || 'Failed to update images'));
        }
    })
    .catch(error => {
        console.error('Error uploading images:', error);
        alert('Error uploading images');
    });
}

function loadGiveaways() {
    // Get event ID from multiple sources
    let eventId = window.currentEventId;
    
    // If not in window, try local variable first
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    // If still not found, try URL parameters
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
        if (eventId) window.currentEventId = eventId;
    }
    
    if (!eventId) {
        console.log('[Giveaways] No event ID available');
        // Show user-friendly message in the table area
        const tableBody = document.querySelector('#giveawaysList');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Please select an event from the sidebar to view giveaways</td></tr>';
        }
        return;
    }

    console.log('[Giveaways] Loading giveaways for event:', eventId);
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/giveaways.php?action=list&event_id=${eventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderGiveawaysTable(data.data);
            } else {
                console.error('[Giveaways] API error:', data.message);
            }
        })
        .catch(error => {
            console.error('[Giveaways] Error loading:', error);
            const tableBody = document.querySelector('#giveawaysList');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: red;">Error loading giveaways</td></tr>';
            }
        });
}

function handleMarketingUpload(event, assetType) {
    const file = event.target.files[0];
    if (!file || !window.currentEventId) return;
    
    const fileNameMap = {
        'poster': 'posterFileName',
        'banner': 'bannerFileName',
        'social_pack': 'socialFileName'
    };
    const previewMap = {
        'poster': 'posterPreview',
        'banner': 'bannerPreview',
        'social_pack': 'socialPreview'
    };
    
    // Show file info while uploading
    const nameDisplay = document.getElementById(fileNameMap[assetType]);
    nameDisplay.textContent = `Uploading ${file.name}...`;
    
    // Upload the file
    const formData = new FormData();
    formData.append('action', 'upload');
    formData.append('event_id', window.currentEventId);
    formData.append('asset_type', assetType);
    formData.append('file', file);
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    const fetchOptions = {
        method: 'POST',
        body: formData
    };
    
    // Add custom headers for authorization (don't set Content-Type - browser will handle it for FormData)
    const customHeaders = {};
    if (headers['X-User-Role']) customHeaders['X-User-Role'] = headers['X-User-Role'];
    if (headers['X-User-Id']) customHeaders['X-User-Id'] = headers['X-User-Id'];
    if (headers['X-Coordinator-Id']) customHeaders['X-Coordinator-Id'] = headers['X-Coordinator-Id'];
    if (headers['Authorization']) customHeaders['Authorization'] = headers['Authorization'];
    if (headers['X-Admin-Token']) customHeaders['X-Admin-Token'] = headers['X-Admin-Token'];
    
    if (Object.keys(customHeaders).length > 0) {
        fetchOptions.headers = customHeaders;
    }
    
    fetch(`${API_BASE}/marketing-assets.php`, fetchOptions)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show file info
            const typeLabel = getFileTypeLabel(data.mime_type);
            const fileInfo = `
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 8px;">
                    <p style="margin: 0; color: #1f2937; font-weight: 500; font-size: 14px;">${file.name}</p>
                    <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">${typeLabel}</p>
                    <div style="margin-top: 8px;">
                        <a href="../${data.file_path}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 500;">Preview</a>
                    </div>
                </div>
            `;
            document.getElementById(previewMap[assetType]).innerHTML = fileInfo;
            nameDisplay.textContent = file.name;
            showNotification(`${assetType.replace('_', ' ').toUpperCase()} uploaded successfully`, 'success');
            // Reload assets from database to ensure consistency
            loadMarketingAssets();
        } else {
            nameDisplay.textContent = 'Error uploading file';
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        nameDisplay.textContent = 'Upload failed';
        showNotification('Upload failed', 'error');
    });
}

function getFileTypeLabel(mimeType) {
    const typeMap = {
        'image/svg+xml': 'image/svg+xml',
        'image/png': 'image/png',
        'image/jpeg': 'image/jpeg',
        'image/jpg': 'image/jpeg',
        'image/gif': 'image/gif',
        'image/webp': 'image/webp',
        'application/pdf': 'application/pdf',
        'text/plain': 'text/plain'
    };
    return typeMap[mimeType] || mimeType;
}

function deleteMarketingAsset(assetType) {
    if (!confirm('Delete this asset?')) return;
    
    const previewMap = {
        'poster': 'posterPreview',
        'banner': 'bannerPreview',
        'social_pack': 'socialPreview'
    };
    const fileNameMap = {
        'poster': 'posterFileName',
        'banner': 'bannerFileName',
        'social_pack': 'socialFileName'
    };
    
    // TODO: Implement delete via API
    document.getElementById(previewMap[assetType]).innerHTML = '';
    document.getElementById(fileNameMap[assetType]).textContent = 'No file chosen';
}

function loadMarketingAssets() {
    if (!window.currentEventId) return;
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/marketing-assets.php?action=list&event_id=${window.currentEventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayMarketingAssets(data.data);
            }
        })
        .catch(error => console.error('Error loading assets:', error));
}

function displayMarketingAssets(assets) {
    const mapType = {
        'poster': 'posterPreview',
        'banner': 'bannerPreview',
        'social_pack': 'socialPreview'
    };
    const fileNameMap = {
        'poster': 'posterFileName',
        'banner': 'bannerFileName',
        'social_pack': 'socialFileName'
    };
    
    // Clear all previews first
    for (const type of ['poster', 'banner', 'social_pack']) {
        document.getElementById(mapType[type]).innerHTML = '';
        document.getElementById(fileNameMap[type]).textContent = '';
    }
    
    // Group assets by type and get the most recent
    const assetsByType = {};
    for (const asset of assets) {
        if (!assetsByType[asset.asset_type]) {
            assetsByType[asset.asset_type] = asset;
        }
    }
    
    // Display the most recent asset for each type
    for (const type of ['poster', 'banner', 'social_pack']) {
        const asset = assetsByType[type];
        if (asset) {
            const typeLabel = getFileTypeLabel(asset.mime_type);
            const isImage = asset.mime_type && asset.mime_type.startsWith('image/');
            const fileInfo = `
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 8px; cursor: ${isImage ? 'pointer' : 'default'};" 
                     onclick="${isImage ? `openImagePreviewModal('${asset.file_path}', '${asset.filename.replace(/'/g, "\\'")}')` : ''}">
                    <p style="margin: 0; color: #1f2937; font-weight: 500; font-size: 14px;">${asset.filename}</p>
                    <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">${typeLabel}</p>
                    <div style="margin-top: 8px;">
                        ${isImage ? '<span style="color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 500; cursor: pointer;">Preview</span>' : '<span style="color: #6b7280; font-size: 12px;">📄 Non-image file</span>'}
                    </div>
                </div>
            `;
            document.getElementById(mapType[type]).innerHTML = fileInfo;
            document.getElementById(fileNameMap[type]).textContent = asset.filename;
        }
    }
}

function deleteMarketingAssetFromDB(assetId, assetType) {
    if (!confirm('Delete this asset?')) return;
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/marketing-assets.php`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            action: 'delete',
            event_id: window.currentEventId,
            asset_id: assetId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Asset deleted', 'success');
            loadMarketingAssets();
        }
    })
    .catch(error => console.error('Error:', error));
}

function handlePosterUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('posterFileName').textContent = file.name;
    }
}

function handleBannerUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('bannerFileName').textContent = file.name;
    }
}

function handleSocialUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('socialFileName').textContent = file.name;
    }
}

function renderGiveawaysTable(items) {
    const tbody = document.getElementById('giveawaysTableBody');
    
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">No giveaways yet. Click "Add Giveaway" to create one.</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => {
        return `
        <tr style="border-bottom: 1px solid #e8e8e8;">
            <td class="px-4 py-3 text-sm text-gray-900">${item.name || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.location || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${((item.bundle_inclusion || '').substring(0, 40)) || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.estimated_price ? '₱' + parseFloat(item.estimated_price).toFixed(2) : '-'}</td>
            <td class="px-4 py-3 text-center text-sm flex gap-2 justify-center">
                <button onclick="editGiveaway(${item.giveaway_id})" 
                        style="background: transparent; border: none; color: #3b82f6; cursor: pointer; display: flex; align-items: center; justify-content: center;" 
                        title="Edit giveaway">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g class="edit-outline"><g fill="currentColor" fill-rule="evenodd" class="Vector" clip-rule="evenodd"><path d="M2 6.857A4.857 4.857 0 0 1 6.857 2H12a1 1 0 1 1 0 2H6.857A2.857 2.857 0 0 0 4 6.857v10.286A2.857 2.857 0 0 0 6.857 20h10.286A2.857 2.857 0 0 0 20 17.143V12a1 1 0 1 1 2 0v5.143A4.857 4.857 0 0 1 17.143 22H6.857A4.857 4.857 0 0 1 2 17.143z"/><path d="m15.137 13.219l-2.205 1.33l-1.033-1.713l2.205-1.33l.003-.002a1.2 1.2 0 0 0 .232-.182l5.01-5.036a3 3 0 0 0 .145-.157c.331-.386.821-1.15.228-1.746c-.501-.504-1.219-.028-1.684.381a6 6 0 0 0-.36.345l-.034.034l-4.94 4.965a1.2 1.2 0 0 0-.27.41l-.824 2.073a.2.2 0 0 0 .29.245l1.032 1.713c-1.805 1.088-3.96-.74-3.18-2.698l.825-2.072a3.2 3.2 0 0 1 .71-1.081l4.939-4.966l.029-.029c.147-.15.641-.656 1.24-1.02c.327-.197.849-.458 1.494-.508c.74-.059 1.53.174 2.15.797a2.9 2.9 0 0 1 .845 1.75a3.15 3.15 0 0 1-.23 1.517c-.29.717-.774 1.244-.987 1.457l-5.01 5.036q-.28.281-.62.487m4.453-7.126s-.004.003-.013.006z"/></g></g></svg>
                </button>
                <button onclick="deleteGiveaway(${item.giveaway_id})" 
                        style="background: transparent; border: none; color: #ef5350; cursor: pointer; display: flex; align-items: center; justify-content: center;" 
                        title="Delete giveaway">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M5 3h2a1 1 0 0 0-2 0M4 3a2 2 0 1 1 4 0h2.5a.5.5 0 0 1 0 1h-.441l-.443 5.17A2 2 0 0 1 7.623 11H4.377a2 2 0 0 1-1.993-1.83L1.941 4H1.5a.5.5 0 0 1 0-1zm3.5 3a.5.5 0 0 0-1 0v2a.5.5 0 0 0 1 0zM5 5.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M3.38 9.085a1 1 0 0 0 .997.915h3.246a1 1 0 0 0 .996-.915L9.055 4h-6.11z"/></svg>
                </button>
            </td>
        </tr>
    `}).join('');
}


function editGiveaway(giveawayId) {
    // Get event ID from multiple sources
    let eventId = window.currentEventId;
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
        if (eventId) window.currentEventId = eventId;
    }
    
    if (!eventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/giveaways.php?action=get&giveaway_id=${giveawayId}&event_id=${eventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const item = data.data;
                document.getElementById('giveawayName').value = item.name || '';
                document.getElementById('giveawayLocation').value = item.location || '';
                document.getElementById('giveawayBundle').value = item.bundle_inclusion || '';
                document.getElementById('giveawayPrice').value = item.estimated_price || '';
                document.getElementById('giveawayReference').value = item.reference || '';
                document.getElementById('giveawayLeadTime').value = item.lead_time || '';
                document.getElementById('giveawayFurtherInfo').value = item.further_info || '';
                
                const form = document.getElementById('addGiveawayForm');
                form.dataset.editGiveawayId = giveawayId;
                form.dataset.isEditing = 'true';
                
                const submitBtn = document.querySelector('#addGiveawayForm button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Update';
                
                const modal = document.getElementById('addGiveawayModal');
                if (modal) modal.classList.add('active');
            } else {
                showNotification('Failed to load giveaway', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading giveaway:', error);
            showNotification('Error loading giveaway', 'error');
        });
}

function deleteGiveaway(giveawayId) {
    if (!confirm('Are you sure you want to delete this giveaway?')) return;
    
    // Get event ID from multiple sources
    let eventId = window.currentEventId;
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
        if (eventId) window.currentEventId = eventId;
    }
    
    if (!eventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/giveaways.php?action=delete`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            event_id: eventId,
            giveaway_id: giveawayId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Giveaway deleted', 'success');
            loadGiveaways();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error deleting giveaway', 'error');
    });
}

// Save giveaway
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addGiveawayForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get event ID from multiple sources
            let eventId = window.currentEventId;
            
            if (!eventId) {
                const params = new URLSearchParams(window.location.search);
                eventId = params.get('id') || params.get('eventId') || params.get('event_id');
                if (eventId) window.currentEventId = eventId;
            }
            
            if (!eventId) {
                showNotification('No event selected', 'error');
                return;
            }
            
            const isEditing = form.dataset.isEditing === 'true';
            const action = isEditing ? 'update' : 'create';
            
            const headers = getUserHeaders ? getUserHeaders() : {};
            headers['Content-Type'] = 'application/json';
            
            const body = {
                event_id: eventId,
                name: document.getElementById('giveawayName').value,
                location: document.getElementById('giveawayLocation').value,
                bundle_inclusion: document.getElementById('giveawayBundle').value,
                estimated_price: document.getElementById('giveawayPrice').value,
                reference: document.getElementById('giveawayReference').value,
                lead_time: document.getElementById('giveawayLeadTime').value,
                further_info: document.getElementById('giveawayFurtherInfo').value
            };
            
            if (isEditing) {
                body.giveaway_id = form.dataset.editGiveawayId;
            }
            
            if (!body.name) {
                showNotification('Please enter a giveaway name', 'error');
                return;
            }
            
            fetch(`${API_BASE}/giveaways.php?action=${action}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const msg = isEditing ? 'Giveaway updated successfully' : 'Giveaway created successfully';
                    showNotification(msg, 'success');
                    closeGiveawayModal();
                    loadGiveaways();
                } else {
                    showNotification('Error: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                const errMsg = isEditing ? 'Error updating giveaway' : 'Error creating giveaway';
                showNotification(errMsg, 'error');
            });
        });
    }
});

// ==================== LOGISTICS FUNCTIONS ====================

function openAddLogisticsModal() {
    let eventId = window.currentEventId;
    
    // If not found, check local variable
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    // If still not found, try URL parameters
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
        if (eventId) window.currentEventId = eventId;
    }
    
    if (!eventId) {
        showNotification('Please select an event from the sidebar or calendar first', 'error');
        return;
    }
    
    window.currentEventId = eventId;
    
    const modal = document.getElementById('addLogisticsModal');
    const form = document.getElementById('addLogisticsForm');
    
    if (modal && form) {
        form.reset();
        delete form.dataset.editId;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Create';
        modal.classList.add('active');
    }
}

function closeAddLogisticsModal() {
    const modal = document.getElementById('addLogisticsModal');
    if (modal) {
        modal.classList.remove('active');
    }
    const form = document.getElementById('addLogisticsForm');
    if (form) {
        form.reset();
        delete form.dataset.editId;
    }
}

function loadLogistics() {
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
        if (eventId) window.currentEventId = eventId;
    }
    
    if (!eventId) {
        console.log('[Logistics] No event ID available');
        const tableBody = document.getElementById('logisticsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Please select an event from the sidebar to view logistics</td></tr>';
        }
        return;
    }
    
    console.log('[Logistics] Loading for event:', eventId);
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/logistics.php?action=list&event_id=${eventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderLogisticsTable(data.data);
                updateLogisticsCounts(data.data);
            } else {
                console.error('[Logistics] Error:', data.message);
            }
        })
        .catch(error => {
            console.error('[Logistics] Error loading:', error);
            const tableBody = document.getElementById('logisticsTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: red;">Error loading logistics</td></tr>';
            }
        });
}

function updateLogisticsCounts(items) {
    const toShip = items.filter(item => item.category === 'To Ship').length;
    const toReceive = items.filter(item => item.category === 'To Receive').length;
    const toRetrieve = items.filter(item => item.category === 'To Retrieve').length;
    
    document.getElementById('logisticsShipCount').textContent = toShip;
    document.getElementById('logisticsReceiveCount').textContent = toReceive;
    document.getElementById('logisticsRetrieveCount').textContent = toRetrieve;
}

function renderLogisticsTable(items) {
    const tbody = document.getElementById('logisticsTableBody');
    
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No logistics items yet. <a href="#" onclick="openAddLogisticsModal(); return false;">Add one</a></td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => {
        const statusColors = {
            'Pending': '#fbbf24',
            'In Transit': '#3b82f6',
            'Packed': '#60a5fa',
            'Delivered': '#10b981',
            'Received': '#10b981',
            'Scheduled': '#f59e0b'
        };
        
        const statusColor = statusColors[item.status] || '#666';
        
        return `
        <tr style="border-bottom: 1px solid #e8e8e8;">
            <td class="px-4 py-3 text-sm text-gray-900"><span style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${escapeHtml(item.category || '')}</span></td>
            <td class="px-4 py-3 text-sm text-gray-900">${escapeHtml(item.item || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${escapeHtml(item.partner || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.quantity || 1}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.schedule_date ? item.schedule_date : '-'}</td>
            <td class="px-4 py-3 text-sm">
                <select onchange="updateLogisticsStatus(${item.logistics_id}, this.value)" style="background: ${statusColor}; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px;">
                    <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Transit" ${item.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
                    <option value="Packed" ${item.status === 'Packed' ? 'selected' : ''}>Packed</option>
                    <option value="Delivered" ${item.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Received" ${item.status === 'Received' ? 'selected' : ''}>Received</option>
                    <option value="Scheduled" ${item.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                </select>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700" title="${escapeHtml(item.notes || '')}">${(item.notes || '').substring(0, 30)}${(item.notes || '').length > 30 ? '...' : ''}</td>
            <td class="px-4 py-3 text-center text-sm flex gap-2 justify-center">
                <button onclick="editLogistics(${item.logistics_id})" 
                        style="background: transparent; border: none; color: #3b82f6; cursor: pointer; display: flex; align-items: center; justify-content: center;" 
                        title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="currentColor" fill-rule="evenodd"><path d="M2 6.857A4.857 4.857 0 0 1 6.857 2H12a1 1 0 1 1 0 2H6.857A2.857 2.857 0 0 0 4 6.857v10.286A2.857 2.857 0 0 0 6.857 20h10.286A2.857 2.857 0 0 0 20 17.143V12a1 1 0 1 1 2 0v5.143A4.857 4.857 0 0 1 17.143 22H6.857A4.857 4.857 0 0 1 2 17.143z"/><path d="m15.137 13.219l-2.205 1.33l-1.033-1.713l2.205-1.33l.003-.002a1.2 1.2 0 0 0 .232-.182l5.01-5.036a3 3 0 0 0 .145-.157c.331-.386.821-1.15.228-1.746c-.501-.504-1.219-.028-1.684.381a6 6 0 0 0-.36.345l-.034.034l-4.94 4.965a1.2 1.2 0 0 0-.27.41l-.824 2.073a.2.2 0 0 0 .29.245l1.032 1.713c-1.805 1.088-3.96-.74-3.18-2.698l.825-2.072a3.2 3.2 0 0 1 .71-1.081l4.939-4.966l.029-.029c.147-.15.641-.656 1.24-1.02c.327-.197.849-.458 1.494-.508c.74-.059 1.53.174 2.15.797a2.9 2.9 0 0 1 .845 1.75a3.15 3.15 0 0 1-.23 1.517c-.29.717-.774 1.244-.987 1.457l-5.01 5.036q-.28.281-.62.487m4.453-7.126s-.004.003-.013.006z"/></g></svg>
                </button>
                <button onclick="deleteLogistics(${item.logistics_id})" 
                        style="background: transparent; border: none; color: #ef5350; cursor: pointer; display: flex; align-items: center; justify-content: center;" 
                        title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M5 3h2a1 1 0 0 0-2 0M4 3a2 2 0 1 1 4 0h2.5a.5.5 0 0 1 0 1h-.441l-.443 5.17A2 2 0 0 1 7.623 11H4.377a2 2 0 0 1-1.993-1.83L1.941 4H1.5a.5.5 0 0 1 0-1zm3.5 3a.5.5 0 0 0-1 0v2a.5.5 0 0 0 1 0zM5 5.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M3.38 9.085a1 1 0 0 0 .997.915h3.246a1 1 0 0 0 .996-.915L9.055 4h-6.11z"/></svg>
                </button>
            </td>
        </tr>
    `}).join('');
}

function editLogistics(logisticsId) {
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
    }
    
    if (!eventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/logistics.php?action=get&logistics_id=${logisticsId}&event_id=${eventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const item = data.data;
                document.getElementById('logisticsCategory').value = item.category || '';
                document.getElementById('logisticsItem').value = item.item || '';
                document.getElementById('logisticsPartner').value = item.partner || '';
                document.getElementById('logisticsQuantity').value = item.quantity || 1;
                document.getElementById('logisticsScheduleDate').value = item.schedule_date || '';
                document.getElementById('logisticsStatus').value = item.status || 'Pending';
                document.getElementById('logisticsNotes').value = item.notes || '';
                
                const form = document.getElementById('addLogisticsForm');
                form.dataset.editId = logisticsId;
                
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Update';
                
                const modal = document.getElementById('addLogisticsModal');
                if (modal) {
                    modal.classList.add('active');
                }
            } else {
                showNotification('Failed to load logistics item', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading logistics item', 'error');
        });
}

function deleteLogistics(logisticsId) {
    if (!confirm('Are you sure you want to delete this logistics item?')) return;
    
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
    }
    
    if (!eventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/logistics.php?action=delete`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            event_id: eventId,
            logistics_id: logisticsId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Logistics item deleted', 'success');
            loadLogistics();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error deleting logistics item', 'error');
    });
}

function updateLogisticsStatus(logisticsId, newStatus) {
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
    }
    
    if (!eventId) return;
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    // Get current item data
    const row = document.querySelector(`tr:has(button[onclick*="${logisticsId}"])`);
    if (!row) return;
    
    const cells = row.querySelectorAll('td');
    const category = cells[0].textContent.trim();
    const item = cells[1].textContent.trim();
    const partner = cells[2].textContent.trim();
    const quantity = cells[3].textContent.trim();
    const scheduleDate = cells[4].textContent.trim() === '-' ? '' : cells[4].textContent.trim();
    const notes = row.cells[6]?.title || '';
    
    fetch(`${API_BASE}/logistics.php?action=update`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            event_id: eventId,
            logistics_id: logisticsId,
            category: category,
            item: item,
            partner: partner,
            quantity: parseInt(quantity),
            schedule_date: scheduleDate,
            status: newStatus,
            notes: notes
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadLogistics();
        } else {
            showNotification('Error updating status', 'error');
            loadLogistics();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        loadLogistics();
    });
}

// Save logistics item form
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addLogisticsForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let eventId = window.currentEventId;
            
            if (!eventId && typeof currentEventId !== 'undefined') {
                eventId = currentEventId;
            }
            
            if (!eventId) {
                const params = new URLSearchParams(window.location.search);
                eventId = params.get('id') || params.get('eventId') || params.get('event_id');
                if (eventId) window.currentEventId = eventId;
            }
            
            if (!eventId) {
                showNotification('Please select an event first', 'error');
                return;
            }
            
            const isEditing = !!this.dataset.editId;
            const category = document.getElementById('logisticsCategory').value;
            const item = document.getElementById('logisticsItem').value;
            const partner = document.getElementById('logisticsPartner').value;
            const quantity = parseInt(document.getElementById('logisticsQuantity').value) || 1;
            const scheduleDate = document.getElementById('logisticsScheduleDate').value;
            const status = document.getElementById('logisticsStatus').value;
            const notes = document.getElementById('logisticsNotes').value;
            
            if (!category || !item) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            const headers = getUserHeaders ? getUserHeaders() : {};
            headers['Content-Type'] = 'application/json';
            
            const data = {
                event_id: eventId,
                category: category,
                item: item,
                partner: partner,
                quantity: quantity,
                schedule_date: scheduleDate,
                status: status,
                notes: notes
            };
            
            if (isEditing) {
                data.logistics_id = this.dataset.editId;
            }
            
            const action = isEditing ? 'update' : 'create';
            
            fetch(`${API_BASE}/logistics.php?action=${action}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const msg = isEditing ? 'Logistics item updated' : 'Logistics item created';
                    showNotification(msg, 'success');
                    closeAddLogisticsModal();
                    loadLogistics();
                } else {
                    showNotification('Error: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                const errMsg = isEditing ? 'Error updating logistics item' : 'Error creating logistics item';
                showNotification(errMsg, 'error');
            });
        });
    }
});

// ==================== FINANCE FUNCTIONS ====================

function openAddExpenseModal() {
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
        if (eventId) window.currentEventId = eventId;
    }
    
    if (!eventId) {
        showNotification('Please select an event from the sidebar or calendar first', 'error');
        return;
    }
    
    window.currentEventId = eventId;
    
    const modal = document.getElementById('addExpenseModal');
    const form = document.getElementById('addExpenseForm');
    
    if (modal && form) {
        form.reset();
        delete form.dataset.editId;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Create';
        modal.classList.add('active');
    }
}

function closeAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
        modal.classList.remove('active');
    }
    const form = document.getElementById('addExpenseForm');
    if (form) {
        form.reset();
        delete form.dataset.editId;
    }
}

function loadExpenses() {
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
        if (eventId) window.currentEventId = eventId;
    }
    
    if (!eventId) {
        console.log('[Finance] No event ID available');
        const tableBody = document.getElementById('expensesTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Please select an event from the sidebar to view expenses</td></tr>';
        }
        return;
    }
    
    console.log('[Finance] Loading for event:', eventId);
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/finance.php?action=list&event_id=${eventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderExpensesTable(data.data);
                updateGrandTotal(data.grand_total || 0);
                updateBudgetDisplay(data.budget || 0, data.grand_total || 0, data.balance || 0);
                updateModalBudgetDisplay(data.budget || 0, data.balance || 0);
            } else {
                console.error('[Finance] Error:', data.message);
            }
        })
        .catch(error => {
            console.error('[Finance] Error loading:', error);
            const tableBody = document.getElementById('expensesTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: red;">Error loading expenses</td></tr>';
            }
        });
    
    // Also load budget into the input field
    loadBudgetInput(eventId);
}

function updateBudgetDisplay(budget, total, balance) {
    // Update KPI cards
    const budgetDisplay = document.getElementById('budgetAmount');
    const balanceDisplay = document.getElementById('balanceAmount');
    const balanceStatus = document.getElementById('balanceStatus');
    
    if (budgetDisplay) {
        const formattedBudget = parseFloat(budget).toFixed(2);
        budgetDisplay.textContent = '₱' + formattedBudget.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    if (balanceDisplay) {
        const isNegative = balance < 0;
        const absBalance = Math.abs(parseFloat(balance)).toFixed(2);
        balanceDisplay.textContent = (isNegative ? '-' : '') + '₱' + absBalance.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        balanceDisplay.style.color = isNegative ? '#ef5350' : '#22c55e';
    }
    
    if (balanceStatus) {
        balanceStatus.textContent = balance < 0 ? 'Over Budget' : 'Remaining';
        balanceStatus.style.color = balance < 0 ? '#ef5350' : '#666';
    }
    
    // Show warning notification if needed
    const budgetWarning = document.getElementById('budgetWarning');
    const warningTitle = document.getElementById('warningTitle');
    const warningMessage = document.getElementById('warningMessage');
    
    if (budgetWarning && warningTitle && warningMessage) {
        const budgetNum = parseFloat(budget);
        const balanceNum = parseFloat(balance);
        
        if (budgetNum > 0) {
            const percentRemaining = (balanceNum / budgetNum) * 100;
            
            if (balanceNum < 0) {
                // Over budget
                budgetWarning.style.display = 'block';
                budgetWarning.style.backgroundColor = '#fef2f2';
                budgetWarning.style.borderLeftColor = '#ef5350';
                warningTitle.textContent = ' Budget Exceeded';
                warningMessage.textContent = `You have exceeded your budget by ₱${Math.abs(balanceNum).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
            } else if (percentRemaining < 20) {
                // Warning - less than 20% remaining
                budgetWarning.style.display = 'block';
                budgetWarning.style.backgroundColor = '#fffbeb';
                budgetWarning.style.borderLeftColor = '#f59e0b';
                warningTitle.textContent = ' Budget Low';
                warningMessage.textContent = `You have only ${percentRemaining.toFixed(1)}% of your budget remaining. Be cautious with additional expenses.`;
            } else {
                // No warning needed
                budgetWarning.style.display = 'none';
            }
        } else {
            // No budget set
            budgetWarning.style.display = 'none';
        }
    }
}

function updateModalBudgetDisplay(budget, balance) {
    // Update modal budget display
    const modalBudget = document.getElementById('modalBudgetDisplay');
    const modalBalance = document.getElementById('modalBalanceDisplay');
    
    if (modalBudget) {
        const formattedBudget = parseFloat(budget).toFixed(2);
        modalBudget.textContent = '₱' + formattedBudget.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    if (modalBalance) {
        const isNegative = balance < 0;
        const absBalance = Math.abs(parseFloat(balance)).toFixed(2);
        modalBalance.textContent = (isNegative ? '-' : '') + '₱' + absBalance.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        modalBalance.style.color = isNegative ? '#ef5350' : '#22c55e';
    }
}

function loadBudgetInput(eventId) {
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/finance.php?action=get_budget&event_id=${eventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const budgetInput = document.getElementById('budgetInput');
                if (budgetInput) {
                    budgetInput.value = data.budget || 0;
                }
            }
        })
        .catch(error => console.error('Error loading budget:', error));
}

function saveBudget() {
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
    }
    
    if (!eventId) {
        showNotification('Please select an event first', 'error');
        return;
    }
    
    const budgetInput = document.getElementById('budgetInput');
    const budget = parseFloat(budgetInput.value || 0);
    
    if (budget < 0) {
        showNotification('Budget cannot be negative', 'error');
        return;
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    headers['X-User-Role'] = (JSON.parse(localStorage.getItem('admin') || '{}') || {}).role || 'admin';
    headers['X-User-Id'] = (JSON.parse(localStorage.getItem('admin') || '{}') || {}).id || 0;
    
    fetch(`${API_BASE}/finance.php?action=set_budget`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            event_id: eventId,
            budget: budget
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Budget saved successfully', 'success');
            loadExpenses(); // Reload to update all displays
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error saving budget', 'error');
    });
}


function updateGrandTotal(total) {
    const totalDisplay = document.getElementById('grandTotalDisplay');
    if (totalDisplay) {
        const formattedTotal = parseFloat(total).toFixed(2);
        totalDisplay.textContent = '₱' + formattedTotal.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

function renderExpensesTable(items) {
    const tbody = document.getElementById('expensesTableBody');
    
    if (!tbody) return;
    
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No expenses yet. <a href="#" onclick="openAddExpenseModal(); return false;">Add one</a></td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => {
        const total = parseFloat(item.total).toFixed(2);
        const unitPrice = parseFloat(item.unit_price).toFixed(2);
        
        return `
        <tr style="border-bottom: 1px solid #e8e8e8;">
            <td class="px-4 py-3 text-sm text-gray-900">${escapeHtml(item.description || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${item.quantity || 1}</td>
            <td class="px-4 py-3 text-sm text-gray-900">₱${unitPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
            <td class="px-4 py-3 text-sm text-gray-900 font-semibold">₱${total.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
            <td class="px-4 py-3 text-center text-sm">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button onclick="editExpense(${item.expense_id})" 
                            style="background: transparent; border: 1px solid #3b82f6; color: #3b82f6; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 4px;" 
                            title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="currentColor" fill-rule="evenodd"><path d="M2 6.857A4.857 4.857 0 0 1 6.857 2H12a1 1 0 1 1 0 2H6.857A2.857 2.857 0 0 0 4 6.857v10.286A2.857 2.857 0 0 0 6.857 20h10.286A2.857 2.857 0 0 0 20 17.143V12a1 1 0 1 1 2 0v5.143A4.857 4.857 0 0 1 17.143 22H6.857A4.857 4.857 0 0 1 2 17.143z"/><path d="m15.137 13.219l-2.205 1.33l-1.033-1.713l2.205-1.33l.003-.002a1.2 1.2 0 0 0 .232-.182l5.01-5.036a3 3 0 0 0 .145-.157c.331-.386.821-1.15.228-1.746c-.501-.504-1.219-.028-1.684.381a6 6 0 0 0-.36.345l-.034.034l-4.94 4.965a1.2 1.2 0 0 0-.27.41l-.824 2.073a.2.2 0 0 0 .29.245l1.032 1.713c-1.805 1.088-3.96-.74-3.18-2.698l.825-2.072a3.2 3.2 0 0 1 .71-1.081l4.939-4.966l.029-.029c.147-.15.641-.656 1.24-1.02c.327-.197.849-.458 1.494-.508c.74-.059 1.53.174 2.15.797a2.9 2.9 0 0 1 .845 1.75a3.15 3.15 0 0 1-.23 1.517c-.29.717-.774 1.244-.987 1.457l-5.01 5.036q-.28.281-.62.487m4.453-7.126s-.004.003-.013.006z"/></g></svg>
                    </button>
                    <button onclick="deleteExpense(${item.expense_id})" 
                            style="background: transparent; border: 1px solid #ef5350; color: #ef5350; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 4px;" 
                            title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 12"><path fill="currentColor" d="M5 3h2a1 1 0 0 0-2 0M4 3a2 2 0 1 1 4 0h2.5a.5.5 0 0 1 0 1h-.441l-.443 5.17A2 2 0 0 1 7.623 11H4.377a2 2 0 0 1-1.993-1.83L1.941 4H1.5a.5.5 0 0 1 0-1zm3.5 3a.5.5 0 0 0-1 0v2a.5.5 0 0 0 1 0zM5 5.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M3.38 9.085a1 1 0 0 0 .997.915h3.246a1 1 0 0 0 .996-.915L9.055 4h-6.11z"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

function editExpense(expenseId) {
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
    }
    
    if (!eventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/finance.php?action=get&expense_id=${expenseId}&event_id=${eventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const item = data.data;
                document.getElementById('expenseDescription').value = item.description || '';
                document.getElementById('expenseQuantity').value = item.quantity || 1;
                document.getElementById('expenseUnitPrice').value = item.unit_price || '';
                
                const form = document.getElementById('addExpenseForm');
                form.dataset.editId = expenseId;
                
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Update';
                
                const modal = document.getElementById('addExpenseModal');
                if (modal) {
                    modal.classList.add('active');
                }
            } else {
                showNotification('Failed to load expense', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading expense', 'error');
        });
}

function deleteExpense(expenseId) {
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
    }
    
    if (!eventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    // Store the expense data for confirmation
    window.pendingDeleteData = {
        eventId: eventId,
        expenseId: expenseId
    };
    
    // Show the delete confirmation modal
    showDeleteConfirmModal();
    
    // Show the delete confirmation modal
    showDeleteConfirmModal();
}

function showDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    window.pendingDeleteData = null;
}

function confirmDeleteExpense() {
    if (!window.pendingDeleteData) return;
    
    const { eventId, expenseId } = window.pendingDeleteData;
    closeDeleteConfirmModal();
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/finance.php?action=delete`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            event_id: eventId,
            expense_id: expenseId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Expense deleted', 'success');
            loadExpenses();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error deleting expense', 'error');
    });
}

function exportExpenses() {
    let eventId = window.currentEventId;
    
    if (!eventId && typeof currentEventId !== 'undefined') {
        eventId = currentEventId;
    }
    
    if (!eventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    // Fetch expenses data
    fetch(`${API_BASE}/finance.php?action=list&event_id=${eventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const items = data.data;
                
                // Get event name from API response (now it should include this)
                const eventName = data.event_name || `Event ${eventId}`;
                
                // Create PDF document - check for jsPDF availability
                if (!window.jspdf || !window.jspdf.jsPDF) {
                    showNotification('PDF library not loaded. Please refresh the page.', 'error');
                    return;
                }
                
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Add title
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('Finance Report', 14, 22);
                
                // Add event info
                doc.setFontSize(11);
                doc.setFont(undefined, 'normal');
                doc.text(`Event: ${eventName}`, 14, 35);
                doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 42);
                
                // Calculate totals
                let grandTotal = 0;
                items.forEach(item => {
                    grandTotal += parseFloat(item.total);
                });
                
                // Get budget and balance
                const budget = parseFloat(data.budget || 0);
                const balance = parseFloat(data.balance || 0);
                
                // Format currency for budget summary
                const budgetFormatted = budget.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                const totalFormatted = grandTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                const balanceFormatted = balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                
                // Add Budget Summary Table with blue header
                const budgetSummaryData = [[
                    `P ${budgetFormatted}`,
                    `P ${totalFormatted}`,
                    `P ${balanceFormatted}`
                ]];
                
                doc.autoTable({
                    head: [['Budget Alloted', 'Total Expenses', 'Balance']],
                    body: budgetSummaryData,
                    startY: 50,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [59, 130, 246],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        halign: 'center',
                        fontSize: 11
                    },
                    bodyStyles: {
                        textColor: [50, 50, 50],
                        halign: 'center',
                        valign: 'middle',
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    columnStyles: {
                        0: { cellWidth: 60 },
                        1: { cellWidth: 61 },
                        2: { cellWidth: 61 }
                    },
                    margin: { left: 14, right: 14 }
                });
                
                // Get Y position after budget table
                const budgetTableEndY = doc.lastAutoTable.finalY + 5;
                
                // Prepare table data with proper formatting
                const tableData = items.map(item => {
                    const unitPrice = parseFloat(item.unit_price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    const total = parseFloat(item.total).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    return [
                        item.description,
                        item.quantity,
                        `P ${unitPrice}`,
                        `P ${total}`
                    ];
                });
                
                // Add grand total row
                const gTotal = grandTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                tableData.push(['', '', 'Grand Total:', `P ${gTotal}`]);
                
                // Add expenses table with matching widths
                doc.autoTable({
                    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
                    body: tableData,
                    startY: budgetTableEndY,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [59, 130, 246],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        halign: 'left',
                        fontSize: 10
                    },
                    bodyStyles: {
                        textColor: [50, 50, 50],
                        halign: 'left',
                        fontSize: 9
                    },
                    columnStyles: {
                        0: { cellWidth: 80 },
                        1: { halign: 'center', cellWidth: 20 },
                        2: { halign: 'right', cellWidth: 41 },
                        3: { halign: 'right', cellWidth: 41 }
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245]
                    },
                    margin: { top: 75, left: 14, right: 14 }
                });
                
                
                // Save PDF with event name and "Finance" label
                const sanitizedFileName = eventName.replace(/[/\\?%*:|"<>]/g, '');
                doc.save(`${sanitizedFileName} - Finance.pdf`);
                showNotification('Expenses exported as PDF successfully', 'success');
            } else {
                showNotification('Error exporting expenses', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error exporting expenses', 'error');
        });
}

// Save expense form
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addExpenseForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let eventId = window.currentEventId;
            
            if (!eventId && typeof currentEventId !== 'undefined') {
                eventId = currentEventId;
            }
            
            if (!eventId) {
                const params = new URLSearchParams(window.location.search);
                eventId = params.get('id') || params.get('eventId') || params.get('event_id');
                if (eventId) window.currentEventId = eventId;
            }
            
            if (!eventId) {
                showNotification('Please select an event first', 'error');
                return;
            }
            
            const isEditing = !!this.dataset.editId;
            const description = document.getElementById('expenseDescription').value;
            const quantity = parseInt(document.getElementById('expenseQuantity').value) || 1;
            const unit_price = parseFloat(document.getElementById('expenseUnitPrice').value) || 0;
            
            if (!description || unit_price <= 0) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            const newExpenseTotal = quantity * unit_price;
            
            // Check if expense would exceed budget (only for new expenses, not edits)
            if (!isEditing) {
                const headers = getUserHeaders ? getUserHeaders() : {};
                headers['Content-Type'] = 'application/json';
                
                // Fetch current budget and balance to check if new expense would exceed
                fetch(`${API_BASE}/finance.php?action=list&event_id=${eventId}`, { headers })
                    .then(response => response.json())
                    .then(budgetData => {
                        const currentBudget = parseFloat(budgetData.budget || 0);
                        const currentBalance = parseFloat(budgetData.balance || 0);
                        const newBalance = currentBalance - newExpenseTotal;
                        
                        // If new expense would cause budget to be exceeded
                        if (currentBudget > 0 && newBalance < 0) {
                            const exceedAmount = Math.abs(newBalance).toFixed(2);
                            showBudgetOverflowModal(eventId, isEditing, description, quantity, unit_price, exceedAmount);
                            return;
                        }
                        
                        // Proceed with creating the expense
                        submitExpense(eventId, isEditing, description, quantity, unit_price);
                    })
                    .catch(error => {
                        console.error('Error checking budget:', error);
                        // Proceed anyway if there's an error checking budget
                        submitExpense(eventId, isEditing, description, quantity, unit_price);
                    });
            } else {
                // For editing, proceed directly
                submitExpense(eventId, isEditing, description, quantity, unit_price);
            }
        });
    }
});

function showBudgetOverflowModal(eventId, isEditing, description, quantity, unit_price, exceedAmount) {
    const modal = document.getElementById('budgetOverflowModal');
    const message = document.getElementById('budgetOverflowMessage');
    
    if (modal && message) {
        message.textContent = `Your amount exceeds the Budget Allotted for this Event by ₱${exceedAmount}. Do you still want to Add Expense?`;
        
        // Store the expense data for confirmation
        window.pendingExpenseData = {
            eventId: eventId,
            isEditing: isEditing,
            description: description,
            quantity: quantity,
            unit_price: unit_price
        };
        
        modal.classList.remove('hidden');
    }
}

function closeBudgetOverflowModal() {
    const modal = document.getElementById('budgetOverflowModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    window.pendingExpenseData = null;
}

function confirmBudgetOverflow() {
    if (window.pendingExpenseData) {
        const data = window.pendingExpenseData;
        submitExpense(data.eventId, data.isEditing, data.description, data.quantity, data.unit_price);
        closeBudgetOverflowModal();
    }
}

function submitExpense(eventId, isEditing, description, quantity, unit_price) {
    const form = document.getElementById('addExpenseForm');
    const headers = getUserHeaders ? getUserHeaders() : {};
    headers['Content-Type'] = 'application/json';
    
    const data = {
        event_id: eventId,
        description: description,
        quantity: quantity,
        unit_price: unit_price
    };
    
    if (isEditing) {
        data.expense_id = form.dataset.editId;
    }
    
    const action = isEditing ? 'update' : 'create';
    
    fetch(`${API_BASE}/finance.php?action=${action}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const msg = isEditing ? 'Expense updated' : 'Expense created';
            showNotification(msg, 'success');
            closeAddExpenseModal();
            loadExpenses();
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        const errMsg = isEditing ? 'Error updating expense' : 'Error creating expense';
        showNotification(errMsg, 'error');
    });
}

// ============ IMAGE PREVIEW MODAL FUNCTIONS ============

function openImagePreviewModal(filePath, fileName) {
    const modal = document.getElementById('imagePreviewModal');
    const img = document.getElementById('previewModalImage');
    const title = document.getElementById('previewModalTitle');
    
    // Store file path for download functionality
    window.currentPreviewFile = {
        path: filePath,
        name: fileName
    };
    
    img.src = '../' + filePath;
    title.textContent = fileName;
    modal.classList.add('active');
}

function closeImagePreviewModal() {
    const modal = document.getElementById('imagePreviewModal');
    modal.classList.remove('active');
    window.currentPreviewFile = null;
}

function downloadAsset() {
    if (!window.currentPreviewFile) return;
    
    const link = document.createElement('a');
    link.href = '../' + window.currentPreviewFile.path;
    link.download = window.currentPreviewFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper function to submit edit user form
function submitEditUserForm() {
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        // Trigger form submission
        editUserForm.dispatchEvent(new Event('submit'));
    }
}

// Add event listener for edit user form
document.addEventListener('DOMContentLoaded', function() {
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userId = document.getElementById('editUserId').value;
            const userRole = document.getElementById('editUserRole').value;
            const name = document.getElementById('editUserName').value.trim();
            const email = document.getElementById('editUserEmail').value.trim();
            
            if (!name || !email) {
                showToast('Name and Email are required', 'warning');
                return;
            }
            
            try {
                // Check for image file upload
                const imageFileInput = document.getElementById('editPreviewImageInput');
                const imageFile = imageFileInput && imageFileInput.files.length > 0 ? imageFileInput.files[0] : null;
                
                if (userRole === 'Coordinator') {
                    const company = document.getElementById('editUserCompany').value.trim();
                    const contact = document.getElementById('editUserContact').value.trim();
                    
                    // Use FormData if there's an image, otherwise use JSON
                    let response;
                    if (imageFile) {
                        const formData = new FormData();
                        formData.append('coordinator_id', parseInt(userId));
                        formData.append('coordinator_name', name);
                        formData.append('email', email);
                        formData.append('company', company);
                        formData.append('contact_number', contact);
                        formData.append('image', imageFile);
                        
                        response = await fetch(`${API_BASE}/coordinators.php?action=update`, {
                            method: 'POST',
                            body: formData
                        });
                    } else {
                        response = await fetch(`${API_BASE}/coordinators.php`, {
                            method: 'PUT',
                            headers: getUserHeaders(),
                            body: JSON.stringify({
                                coordinator_id: parseInt(userId),
                                action_type: 'update',
                                coordinator_name: name,
                                email: email,
                                company: company,
                                contact_number: contact
                            })
                        });
                    }
                    
                    const data = await response.json();
                    if (data.success) {
                        showToast('Coordinator updated successfully', 'success');
                        closeEditUserModal();
                        loadAllUsers();
                    } else {
                        showToast('Error updating coordinator: ' + (data.message || 'Unknown error'), 'error');
                    }
                } else if (userRole === 'Admin' || userRole === 'Super Admin') {
                    // Update admin user
                    let response;
                    if (imageFile) {
                        const formData = new FormData();
                        formData.append('admin_id', parseInt(userId));
                        formData.append('full_name', name);
                        formData.append('email', email);
                        formData.append('image', imageFile);
                        
                        response = await fetch(`${API_BASE}/admins.php`, {
                            method: 'POST',
                            body: formData
                        });
                    } else {
                        response = await fetch(`${API_BASE}/admins.php`, {
                            method: 'PUT',
                            headers: getUserHeaders(),
                            body: JSON.stringify({
                                admin_id: parseInt(userId),
                                action_type: 'update',
                                full_name: name,
                                email: email
                            })
                        });
                    }
                    
                    const data = await response.json();
                    if (data.success) {
                        showToast('Admin updated successfully', 'success');
                        closeEditUserModal();
                        loadAllUsers();
                    } else {
                        showToast('Error updating user: ' + (data.message || 'Unknown error'), 'error');
                    }
                }
            } catch (error) {
                console.error('Error updating user:', error);
                showToast('Error: ' + error.message, 'error');
            }
        });
    }
});

// ===== EDIT USER MODAL - LIVE PREVIEW FUNCTIONS =====

// Store original image state for edit modal
let editModalOriginalImage = null;

function openEditUserModal(userId, userRole, userName, userEmail, userCompany, userContact) {
    // Populate form fields
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUserRole').value = userRole;
    document.getElementById('editUserName').value = userName;
    document.getElementById('editUserEmail').value = userEmail;
    
    // Handle company field (only for Coordinators)
    const companyDiv = document.getElementById('editUserCompanyDiv');
    if (userRole === 'Coordinator') {
        document.getElementById('editUserCompany').value = userCompany || '';
        companyDiv.style.display = 'block';
    } else {
        companyDiv.style.display = 'none';
    }
    
    // Handle contact field (only for Coordinators)
    const contactDiv = document.getElementById('editUserContactDiv');
    if (userRole === 'Coordinator') {
        document.getElementById('editUserContact').value = userContact || '';
        contactDiv.style.display = 'block';
    } else {
        contactDiv.style.display = 'none';
    }
    
    // Find user in allUsers to get profile image
    const userIdNum = parseInt(userId, 10);
    const user = allUsers.find(u => parseInt(u.id, 10) === userIdNum);
    
    // Update preview with initial values
    updateEditPreviewName();
    updateEditPreviewEmail();
    updateEditPreviewRole();
    if (userRole === 'Coordinator') {
        updateEditPreviewCompany();
        updateEditPreviewContact();
    }
    
    // Load user profile image if available and store original state
    if (user) {
        const circle = document.getElementById('editProfilePreviewCircle');
        const initialsSpan = document.getElementById('editProfileInitials');
        
        if (user.admin_image) {
            // Admin with image - stored as filename only
            let imgSrc;
            if (user.admin_image.includes('data:image')) {
                // Already base64 encoded from preview
                imgSrc = user.admin_image;
            } else {
                // File path - add directory prefix if needed
                imgSrc = user.admin_image;
                if (!imgSrc.includes('/')) {
                    imgSrc = `../uploads/admins/${imgSrc}`;
                }
            }
            circle.style.background = 'none';
            circle.style.backgroundImage = `url('${imgSrc}')`;
            circle.style.backgroundSize = 'cover';
            circle.style.backgroundPosition = 'center';
            circle.style.backgroundRepeat = 'no-repeat';
            initialsSpan.style.display = 'none';
            // Store original for restoration if file is cleared
            editModalOriginalImage = {
                type: 'image',
                imgSrc: imgSrc,
                backgroundImage: circle.style.backgroundImage
            };
        } else if (user.coordinator_image) {
            // Coordinator with image file - stored as filename only
            let imgSrc;
            if (user.coordinator_image.includes('data:image')) {
                // Already base64 encoded from preview
                imgSrc = user.coordinator_image;
            } else {
                // File path - add directory prefix if needed
                imgSrc = user.coordinator_image;
                if (!imgSrc.includes('/')) {
                    imgSrc = `../uploads/coordinators/${imgSrc}`;
                }
            }
            circle.style.background = 'none';
            circle.style.backgroundImage = `url('${imgSrc}')`;
            circle.style.backgroundSize = 'cover';
            circle.style.backgroundPosition = 'center';
            circle.style.backgroundRepeat = 'no-repeat';
            initialsSpan.style.display = 'none';
            // Store original for restoration if file is cleared
            editModalOriginalImage = {
                type: 'image',
                imgSrc: imgSrc,
                backgroundImage: circle.style.backgroundImage
            };
        } else {
            // No image - show initials with gradient background matching users table style
            const initials = (userName || 'AB').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            initialsSpan.textContent = initials;
            initialsSpan.style.display = 'block';
            initialsSpan.style.fontSize = '48px';
            initialsSpan.style.fontWeight = '700';
            initialsSpan.style.color = 'white';
            
            // Apply gradient background matching users table style
            circle.style.backgroundImage = 'none';
            circle.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
            circle.style.display = 'flex';
            circle.style.alignItems = 'center';
            circle.style.justifyContent = 'center';
            // Store original for restoration if file is cleared
            editModalOriginalImage = {
                type: 'initials',
                initials: initials
            };
        }
    }
    
    // Reset file input
    document.getElementById('editPreviewImageInput').value = '';
    
    // Show modal
    document.getElementById('editUserModal').style.display = 'flex';
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
    document.getElementById('editUserForm').reset();
}

function updateEditPreviewName() {
    const name = document.getElementById('editUserName').value.trim();
    document.getElementById('editPreviewName').textContent = name || 'Name Here';
    
    // Update initials
    const initials = name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'AB';
    
    const circle = document.getElementById('editProfilePreviewCircle');
    const initialsSpan = document.getElementById('editProfileInitials');
    
    // Check if image is loaded
    if (circle.style.backgroundImage && circle.style.backgroundImage !== 'none') {
        initialsSpan.style.display = 'none';
    } else {
        initialsSpan.style.display = 'block';
        initialsSpan.textContent = initials;
        initialsSpan.style.fontSize = '48px';
        initialsSpan.style.fontWeight = '700';
        initialsSpan.style.color = 'white';
        // Apply gradient background matching users table
        circle.style.backgroundImage = 'none';
        circle.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
        circle.style.display = 'flex';
        circle.style.alignItems = 'center';
        circle.style.justifyContent = 'center';
    }
}

function updateEditPreviewEmail() {
    const email = document.getElementById('editUserEmail').value || '-';
    document.getElementById('editPreviewEmail').textContent = email;
}

function updateEditPreviewCompany() {
    const company = document.getElementById('editUserCompany').value;
    const companyDiv = document.getElementById('editPreviewCompanyDiv');
    const companyText = document.getElementById('editPreviewCompany');
    
    if (company) {
        companyText.textContent = company;
        companyDiv.style.display = 'block';
    } else {
        companyDiv.style.display = 'none';
    }
}

function updateEditPreviewContact() {
    const contact = document.getElementById('editUserContact').value;
    const contactDiv = document.getElementById('editPreviewContactDiv');
    const contactText = document.getElementById('editPreviewContact');
    
    if (contact) {
        contactText.textContent = contact;
        contactDiv.style.display = 'block';
    } else {
        contactDiv.style.display = 'none';
    }
}

function updateEditPreviewRole() {
    const role = document.getElementById('editUserRole').value || 'Role';
    document.getElementById('editPreviewRole').textContent = role;
}

// Image upload handler for edit modal
document.addEventListener('DOMContentLoaded', function() {
    const editImageInput = document.getElementById('editPreviewImageInput');
    if (editImageInput) {
        editImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const circle = document.getElementById('editProfilePreviewCircle');
            const initialsSpan = document.getElementById('editProfileInitials');
            
            if (file) {
                // User selected a new file - show preview
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Clear gradient background and set image
                    circle.style.background = 'none';
                    circle.style.backgroundImage = `url('${event.target.result}')`;
                    circle.style.backgroundSize = 'cover';
                    circle.style.backgroundPosition = 'center';
                    circle.style.backgroundRepeat = 'no-repeat';
                    initialsSpan.style.display = 'none';
                };
                reader.readAsDataURL(file);
            } else {
                // File cleared - restore original image/initials
                if (editModalOriginalImage) {
                    if (editModalOriginalImage.type === 'image') {
                        // Restore original image
                        circle.style.background = 'none';
                        circle.style.backgroundImage = editModalOriginalImage.backgroundImage;
                        circle.style.backgroundSize = 'cover';
                        circle.style.backgroundPosition = 'center';
                        circle.style.backgroundRepeat = 'no-repeat';
                        initialsSpan.style.display = 'none';
                    } else if (editModalOriginalImage.type === 'initials') {
                        // Restore original initials
                        initialsSpan.textContent = editModalOriginalImage.initials;
                        initialsSpan.style.display = 'block';
                        initialsSpan.style.fontSize = '48px';
                        initialsSpan.style.fontWeight = '700';
                        initialsSpan.style.color = 'white';
                        
                        circle.style.backgroundImage = 'none';
                        circle.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
                        circle.style.display = 'flex';
                        circle.style.alignItems = 'center';
                        circle.style.justifyContent = 'center';
                    }
                }
            }
        });
    }
});

console.log('✓ Admin.js consolidated - All function stubs loaded');

// ========================================
// STUB FUNCTIONS FOR EVENT DETAILS EDIT
// (Will be immediately replaced by event-details.js)
// ========================================
if (!window.enableEventDetailsEdit) {
    window.enableEventDetailsEdit = function() {
        console.warn('⚠️ enableEventDetailsEdit stub - event-details.js not loaded yet');
    };
}

if (!window.cancelEventDetailsEdit) {
    window.cancelEventDetailsEdit = function() {
        console.warn('⚠️ cancelEventDetailsEdit stub - event-details.js not loaded yet');
    };
}

if (!window.handleEditEventImage) {
    window.handleEditEventImage = function(event) {
        console.warn('⚠️ handleEditEventImage stub - event-details.js not loaded yet');
    };
}

if (!window.saveEventDetails) {
    window.saveEventDetails = function() {
        console.warn('⚠️ saveEventDetails stub - event-details.js not loaded yet');
    };
}
