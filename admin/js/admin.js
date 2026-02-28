// ================================================================================
// SMART EVENTS - CONSOLIDATED ADMIN JAVASCRIPT
// One unified file consolidating all admin functionality
// Includes: main.js, event-details.js, dashboard-api.js, coordinators.js, catalogue.js
// ================================================================================

const API_BASE = '../api';

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
    
    // If it contains /Smart-Events/ (from database), convert to relative path
    if (imagePath.includes('/Smart-Events/')) {
        return imagePath.replace('/Smart-Events/', '../');
    }
    
    // If path is relative to webroot (uploads/...), prepend ../ for admin nested folder
    if (imagePath.startsWith('uploads/')) {
        return '../' + imagePath;
    }
    
    // If path starts with /, use it as-is (from webroot)
    if (imagePath.startsWith('/')) {
        return imagePath;
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
        
        return headers;
    } catch (error) {
        console.error('Error building user headers:', error);
        return { 'Content-Type': 'application/json', 'X-User-Role': 'GUEST' };
    }
}

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
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.main-content');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
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
        console.log('[PROFILE-UPDATE] admin data length:', adminStr ? adminStr.length : 0);
        console.log('[PROFILE-UPDATE] user data length:', userStr ? userStr.length : 0);
        
        var profile = null;
        var isAdmin = false;
        var isCoordinator = false;
        
        if (adminStr) {
            profile = JSON.parse(adminStr);
            isAdmin = true;
            console.log('[PROFILE-UPDATE] Parsed admin profile:', profile);
        } else if (userStr) {
            profile = JSON.parse(userStr);
            isCoordinator = true;
            console.log('[PROFILE-UPDATE] Parsed coordinator profile:', profile);
        }
        
        if (profile && profile.full_name) {
            var nameEl = document.getElementById('userNameDisplay');
            var emailEl = document.getElementById('userEmail');
            var roleEl = document.getElementById('userRole');
            var accountTypeEl = document.getElementById('userAccountType');
            
            if (nameEl) {
                nameEl.textContent = profile.full_name;
                console.log('[PROFILE-UPDATE] Updated name to:', profile.full_name);
            }
            if (emailEl) {
                emailEl.textContent = profile.email || 'user@smartevents.com';
                console.log('[PROFILE-UPDATE] Updated email to:', profile.email);
            }
            if (accountTypeEl) {
                if (isAdmin) {
                    accountTypeEl.textContent = 'Admin';
                    accountTypeEl.className = 'session-meta text-blue-600 font-semibold';
                    console.log('[PROFILE-UPDATE] Set account type to Admin');
                } else if (isCoordinator) {
                    accountTypeEl.textContent = 'Coordinator';
                    accountTypeEl.className = 'session-meta text-purple-600 font-semibold';
                    console.log('[PROFILE-UPDATE] Set account type to Coordinator');
                }
            }
            if (roleEl) {
                if (isAdmin) {
                    roleEl.textContent = 'Admin View';
                    roleEl.className = 'session-badge text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700';
                    console.log('[PROFILE-UPDATE] Set role to Admin');
                } else if (isCoordinator) {
                    roleEl.textContent = 'Coordinator View';
                    roleEl.className = 'session-badge text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700';
                    console.log('[PROFILE-UPDATE] Set role to Coordinator');
                }
            }
            console.log('[PROFILE-UPDATE] SUCCESS: Profile updated!');
        } else {
            console.log('[PROFILE-UPDATE] No profile name found in data');
        }
    } catch (e) {
        console.error('[PROFILE-UPDATE] Error:', e);
    }
}

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
    
    // Hide menu items for coordinators (they should only access Events)
    if (userRole === 'COORDINATOR' || userRole === 'coordinator') {
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (page !== 'events') {
                link.style.display = 'none';
            }
        });
    }
    
    // Add click handlers to set active state
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
        });
    });
    
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
            navigateToPage(page);
        });
    });
}

function navigateToPage(page) {
    console.log('🔄 Navigating to page:', page);
    
    // Save current page to localStorage
    localStorage.setItem('adminLastPage', page);
    console.log('💾 Saved to localStorage: adminLastPage =', page);
    
    const navLinks = document.querySelectorAll('.sidebar-menu a, a[data-page]');
    navLinks.forEach(l => {
        if (l.getAttribute('data-page') === page) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('✓ Page activated:', page);
        
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
        console.warn('⚠️  Page not found:', page);
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
        const isMainPage = document.getElementById('calendar') !== null;
        if (isMainPage) {
            // Check URL params first
            const urlParams = new URLSearchParams(window.location.search);
            let pageToLoad = urlParams.get('page');
            
            // If no URL param, get from localStorage
            if (!pageToLoad) {
                pageToLoad = localStorage.getItem('adminLastPage') || 'calendar';
            }
            
            // Fallback to calendar if stored page doesn't exist
            const pageExists = document.getElementById(pageToLoad) !== null;
            const finalPage = pageExists ? pageToLoad : 'calendar';
            
            console.log('📄 Restoring page:', finalPage, '(from', pageToLoad === urlParams.get('page') ? 'URL' : 'localStorage', ')');
            console.log('📄 Saved pages available:', Array.from(document.querySelectorAll('.page')).map(p => p.id).join(', '));
            
            // Check if page is already active (from early script)
            const currentActivePage = document.querySelector('.page.active');
            const isAlreadyCorrect = currentActivePage && currentActivePage.id === finalPage;
            
            if (isAlreadyCorrect) {
                console.log('✅ Page already correct, loading page content only');
                // Just load the page content without delay
                if (finalPage === 'calendar') loadCalendar();
                else if (finalPage === 'participants') loadParticipants();
                else if (finalPage === 'catalogue') loadCatalogue();
                else if (finalPage === 'reports') loadReports();
                else if (finalPage === 'qr-scanner') initQRScannerPage();
                else if (finalPage === 'users') loadAllUsers();
                else if (finalPage === 'logs') {
                    loadActivityLogs();
                    loadActionTypes();
                }
            } else {
                // Only delay if we need to switch pages
                console.log('🔄 Switching to different page');
                setTimeout(() => navigateToPage(finalPage), 10);
            }
        }
        
        console.log('✓ Initialization complete');
    } catch (error) {
        console.error('✗ Initialization error:', error);
        // Only navigate if this is the main page
        if (document.getElementById('calendar')) {
            setTimeout(() => navigateToPage('calendar'), 100);
        }
    }
});

function setupFormHandlers() {
    console.log('Setting up form handlers...');
    
    const createForm = document.getElementById('createEventForm');
    if (createForm) {
        console.log('Found createEventForm, adding submit handler');
        createForm.addEventListener('submit', function(e) {
            createEvent(e);
        });
    }
    
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
    
    container.innerHTML = '<div class="spinner" style="padding: 50px; text-align: center;">Loading events...</div>';
    
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = (admin && admin.id) ? admin : user;
    const userRole = userInfo.role || userInfo.role_name || 'GUEST';
    const coordinatorId = userInfo.coordinator_id || userInfo.id;
    
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
            console.log('✓ Events data received:', data.data?.length, 'events');
            if (data.success && data.data) {
                let events = data.data;
                
                if (userRole === 'COORDINATOR' || userRole === 'coordinator') {
                    events = events.filter(event => {
                        return event.coordinator_id == coordinatorId;
                    });
                    console.log(`✓ Filtered to ${events.length} event(s) for coordinator`);
                }
                
                displayEvents(events);
            } else {
                throw new Error(data.message || 'Failed to load events');
            }
        })
        .catch(error => {
            console.error('✗ Error loading events:', error);
            container.innerHTML = `<div style="padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 4px;">❌ Error loading events: ${error.message}</div>`;
        });
    
    const searchBox = document.getElementById('eventSearch');
    if (searchBox) {
        let searchTimeout;
        searchBox.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            if (query.length > 0) {
                searchTimeout = setTimeout(() => {
                    searchEventsList(query);
                    displayEventSuggestions(query);
                }, 300);
            } else if (query.length === 0) {
                clearTimeout(searchTimeout);
                hideEventSuggestions();
                loadEvents();
            }
        });
        
        document.addEventListener('click', function(e) {
            if (e.target !== searchBox) {
                hideEventSuggestions();
            }
        });
    }
}

function displayEvents(events) {
    allEventsData = events;
    window.cachedEvents = events; // Cache events for modal use
    renderEvents(sortEventsArray(filterEventsByType(events)));
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
        console.error('✗ eventsList not found');
        return;
    }
    
    if (!events || events.length === 0) {
        console.log('ℹ No events to display');
        container.innerHTML = '<p class="text-center text-muted">No events found.</p>';
        return;
    }
    
    console.log('Rendering', events.length, 'events');
    const html = events.map(event => {
        const imageUrl = getImageUrl(event.image_url);
        return `
        <div class="event-card" style="position: relative; cursor: pointer; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onclick="navigateToEventDetailsPage(${event.event_id}); return false;" ondblclick="return false;">
            <div class="event-image" style="height: 140px; background-size: cover; background-position: center; background-color: #f0f0f0; position: relative; ${imageUrl ? `background-image: url('${imageUrl}');` : ''}">
                ${!imageUrl ? '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">📅</div>' : ''}
                ${event.is_private == 1 ? '<span class="event-badge" style="position: absolute; top: 8px; right: 8px; background: #C41E3A; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">Private</span>' : '<span class="event-badge" style="position: absolute; top: 8px; right: 8px; background: #E8E5FF; color: #6c63ff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">Public</span>'}
            </div>
            <div class="event-content" style="flex: 1; display: flex; flex-direction: column; padding: 12px;">
                <h3 class="event-name" style="font-size: 15px; font-weight: 600; margin: 0 0 6px 0; color: #222;">${event.event_name}</h3>
                <div class="event-date" style="font-size: 12px; color: #666; margin: 3px 0;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style="display: inline-block; margin-right: 4px; vertical-align: middle;"><path fill="currentColor" d="M8.5 14a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5m0 3.5a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5m4.75-4.75a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0M12 17.5a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5m4.75-4.75a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0"/><path fill="currentColor" fill-rule="evenodd" d="M8 3.25a.75.75 0 0 1 .75.75v.75h6.5V4a.75.75 0 0 1 1.5 0v.758q.228.006.425.022c.38.03.736.098 1.073.27a2.75 2.75 0 0 1 1.202 1.202c.172.337.24.693.27 1.073c.03.365.03.81.03 1.345v7.66c0 .535 0 .98-.03 1.345c-.03.38-.098.736-.27 1.073a2.75 2.75 0 0 1-1.201 1.202c-.338.172-.694.24-1.074.27c-.365.03-.81.03-1.344.03H8.17c-.535 0-.98 0-1.345-.03c-.38-.03-.736-.098-1.073-.27a2.75 2.75 0 0 1-1.202-1.2c-.172-.338-.24-.694-.27-1.074c-.03-.365-.03-.81-.03-1.344V8.67c0-.535 0-.98.03-1.345c.03-.38.098-.736.27-1.073A2.75 2.75 0 0 1 5.752 5.05c.337-.172.693-.24 1.073-.27q.197-.016.425-.022V4A.75.75 0 0 1 8 3.25m10.25 7H5.75v6.05c0 .572 0 .957.025 1.252c.023.288.065.425.111.515c.12.236.311.427.547.547c.09.046.227.088.514.111c.296.024.68.025 1.253.025h7.6c.572 0 .957 0 1.252-.025c.288-.023.425-.065.515-.111a1.25 1.25 0 0 0 .547-.547c.046-.09.088-.227.111-.515c.024-.295.025-.68.025-1.252zM10.5 7a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5z" clip-rule="evenodd"/></svg> ${new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                <div class="event-time" style="font-size: 12px; color: #666; margin: 2px 0;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style="display: inline-block; margin-right: 4px; vertical-align: middle;"><path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m.5-13H11v6l5.2 3.2l.8-1.3l-4.5-2.7z"/></svg>
                    ${event.start_time && event.end_time ? `${convert24To12Hour(event.start_time)} - ${convert24To12Hour(event.end_time)}` : 'Time TBD'}
                </div>
                <div class="event-location" style="font-size: 12px; color: #666; margin: 2px 0;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 512 512" style="display: inline-block; margin-right: 4px; vertical-align: middle;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 48c-79.5 0-144 61.39-144 137c0 87 96 224.87 131.25 272.49a15.77 15.77 0 0 0 25.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137"/><circle cx="256" cy="192" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg> ${event.location || 'TBD'}</div>
                <div style="margin: 6px 0 0 0; padding: 6px; background: #f5f5f5; border-radius: 4px; font-size: 11px;">
                    <strong>Capacity:</strong> ${event.capacity} | <strong>Available:</strong> ${event.available_spots >= 0 ? event.available_spots : 'Full'}
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    console.log('✓ Events rendered to container');
    console.log('📊 Container HTML length:', container.innerHTML.length);
    console.log('📊 Container children count:', container.children.length);
    console.log('📊 Container element:', container);
    
    // Force visibility
    container.style.display = 'grid';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    container.style.pointerEvents = 'auto';
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
                    <div class="search-suggestion-date">${eventDate}${event.location ? ' • ' + escapeHtml(event.location) : ''}</div>
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

function filterEventsByTypeUI(filterType) {
    console.log('Setting event filter to:', filterType);
    currentEventFilter = filterType;
    renderEvents(sortEventsArray(filterEventsByType(allEventsData)));
}

function sortEventsByUI(sortType) {
    console.log('Setting event sort to:', sortType);
    currentEventSort = sortType;
    renderEvents(sortEventsArray(filterEventsByType(allEventsData)));
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
    window.location.href = 'event-details.html?id=' + eventId;
}

function openEventDetailsModal(eventId) {
    console.log('[Events] Opening event details modal for event:', eventId);
    
    // Get events from global variable or from API
    let event = null;
    
    // Try to find event in cached events first
    if (window.cachedEvents && Array.isArray(window.cachedEvents)) {
        event = window.cachedEvents.find(e => e.event_id === eventId);
    }
    
    if (!event) {
        console.error('[Events] Event not found:', eventId);
        showNotification('Event not found', 'error');
        return;
    }
    
    // Update modal title
    const modalTitle = document.getElementById('modalEventTitle');
    if (modalTitle) {
        modalTitle.textContent = event.event_name;
    }
    
    // Show modal
    const modal = document.getElementById('eventDetailsModal');
    if (modal) {
        modal.classList.add('active');
        
        // Setup tabs after a small delay to ensure modal is visible
        setTimeout(() => {
            setupEventModalTabs(event);
        }, 100);
    } else {
        console.error('[Events] eventDetailsModal not found');
    }
}

function setupEventModalTabs(event) {
    console.log('[Events] Setting up tabs for event:', event.event_id);
    
    const dashboardBtn = document.getElementById('eventDashboardTab');
    const detailsBtn = document.getElementById('eventDetailsTab');
    const attendeesBtn = document.getElementById('eventAttendeesTab');
    const tasksBtn = document.getElementById('eventTasksTab');
    
    // Add event listeners to tabs
    if (dashboardBtn) {
        dashboardBtn.onclick = (e) => {
            e.preventDefault();
            switchEventTab('dashboard', event);
        };
    }
    
    if (detailsBtn) {
        detailsBtn.onclick = (e) => {
            e.preventDefault();
            switchEventTab('details', event);
        };
    }
    
    if (attendeesBtn) {
        attendeesBtn.onclick = (e) => {
            e.preventDefault();
            switchEventTab('attendees', event);
        };
    }
    
    if (tasksBtn) {
        tasksBtn.onclick = (e) => {
            e.preventDefault();
            switchEventTab('tasks', event);
        };
    }
    
    // Show dashboard tab by default
    switchEventTab('dashboard', event);
}

function switchEventTab(tabName, event) {
    console.log('[Events] Switching to tab:', tabName);
    
    const dashboardBtn = document.getElementById('eventDashboardTab');
    const detailsBtn = document.getElementById('eventDetailsTab');
    const attendeesBtn = document.getElementById('eventAttendeesTab');
    const tasksBtn = document.getElementById('eventTasksTab');
    
    const tasksListSection = document.getElementById('tasksListSection');
    const tasksCalendarSection = document.getElementById('tasksCalendarSection');
    const eventTabContent = document.getElementById('eventTabContent');
    
    // Reset all button styles
    [dashboardBtn, detailsBtn, attendeesBtn, tasksBtn].forEach(btn => {
        if (btn) {
            btn.style.background = '#f3f4f6';
            btn.style.color = '#374151';
        }
    });
    
    // Hide all content sections by default
    if (eventTabContent) eventTabContent.style.display = 'none';
    if (tasksListSection) tasksListSection.style.display = 'none';
    if (tasksCalendarSection) tasksCalendarSection.style.display = 'none';
    
    // Show selected tab content
    if (tabName === 'dashboard') {
        if (dashboardBtn) {
            dashboardBtn.style.background = '#3b82f6';
            dashboardBtn.style.color = '#ffffff';
        }
        if (eventTabContent) eventTabContent.style.display = 'block';
        renderEventDashboardTab(event);
    } else if (tabName === 'details') {
        if (detailsBtn) {
            detailsBtn.style.background = '#3b82f6';
            detailsBtn.style.color = '#ffffff';
        }
        if (eventTabContent) eventTabContent.style.display = 'block';
        renderEventDetailsTab(event);
    } else if (tabName === 'attendees') {
        if (attendeesBtn) {
            attendeesBtn.style.background = '#3b82f6';
            attendeesBtn.style.color = '#ffffff';
        }
        if (eventTabContent) eventTabContent.style.display = 'block';
        renderEventAttendeesTab(event);
    } else if (tabName === 'tasks') {
        if (tasksBtn) {
            tasksBtn.style.background = '#3b82f6';
            tasksBtn.style.color = '#ffffff';
        }
        // Show tasks list section by default
        if (tasksListSection) {
            tasksListSection.style.display = 'block';
        }
        renderEventTasksTab(event);
    }
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
    console.log('[Events] Rendering attendees tab for event:', event.event_id);
    
    const content = document.getElementById('eventTabContent');
    if (!content) return;
    
    content.innerHTML = `
      <div>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">Attendees List (${event.total_registrations || 0} registered)</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; font-size: 14px;">
              <thead style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <tr>
                  <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #111827;">Name</th>
                  <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #111827;">Email</th>
                  <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #111827;">Registration Status</th>
                  <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #111827;">Check-in</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 16px; color: #6b7280;">Loading attendees...</td>
                  <td style="padding: 12px 16px;"></td>
                  <td style="padding: 12px 16px;"></td>
                  <td style="padding: 12px 16px;"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
}

function renderEventTasksTab(event) {
    console.log('[Events] Rendering tasks tab for event:', event.event_id);
    // Tasks section is already visible in HTML, just make sure it's shown
    const tasksListSection = document.getElementById('tasksListSection');
    if (tasksListSection) {
        tasksListSection.style.display = 'block';
    }
}

function openCreateEventModal() {
    console.log('Opening create event modal');
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

function createEvent(e) {
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
    
    const eventName = document.getElementById('eventName')?.value?.trim();
    const capacity = document.getElementById('eventCapacity')?.value?.trim();
    const eventDate = document.getElementById('eventDate')?.value?.trim();
    const eventDepartment = document.getElementById('eventDepartment')?.value?.trim();
    
    if (!eventName || !capacity || !eventDate) {
        showNotification('Please fill in all required fields (Name, Capacity, Date)', 'error');
        return false;
    }
    
    if (isNaN(parseInt(capacity)) || parseInt(capacity) < 1) {
        showNotification('Capacity must be a valid number greater than 0', 'error');
        return false;
    }
    
    const formData = new FormData(formEl);
    
    const isPrivateCheckbox = document.getElementById('eventPrivate');
    const isPrivate = isPrivateCheckbox && isPrivateCheckbox.checked ? 1 : 0;
    formData.set('is_private', isPrivate);
    
    if (isPrivate) {
        const privateCode = document.getElementById('createEventPrivateCode').value;
        const department = document.getElementById('eventDepartment').value;
        formData.append('private_code', privateCode);
        formData.append('department', department);
    }
    
    fetch(`${API_BASE}/events.php`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            logActivity('CREATE', `Created new event: ${eventName}`);
            closeCreateEventModal();
            formEl.reset();
            loadEvents();
        } else {
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
                document.getElementById('editEventLocation').value = event.location || '';
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
let calendarSelectedDate = new Date();
let calendarCurrentView = 'month'; // 'month' or 'list'

function loadCalendar() {
    console.log('📅 Loading calendar for', calendarCurrentMonth + 1, '/', calendarCurrentYear);
    console.log('🔗 API URL:', `${API_BASE}/events.php?action=list_all`);
    
    // Fetch all events from API
    fetch(`${API_BASE}/events.php?action=list_all`, {
        headers: getUserHeaders()
    })
    .then(response => {
        console.log('📡 API Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📥 API Response data:', data);
        if (data.success && data.data) {
            allEventsForCalendar = data.data || [];
            console.log('✅ Loaded', allEventsForCalendar.length, 'events for calendar');
            console.log('📋 Events array:', allEventsForCalendar);
            if (allEventsForCalendar.length > 0) {
                console.log('🔍 First event:', allEventsForCalendar[0]);
                console.log('📅 First event date:', allEventsForCalendar[0].event_date);
            }
            renderCalendarMonth();
            
            // Automatically show today's events in Deadline Details
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const todayEvents = allEventsForCalendar.filter(event => event.event_date === todayStr);
            
            if (todayEvents.length > 0) {
                console.log(`🎯 Found ${todayEvents.length} event(s) for today (${todayStr})`);
                updateDeadlineDetails(todayEvents);
            } else {
                console.log(`📅 No events found for today (${todayStr})`);
                updateDeadlineDetails([]);
            }
        } else {
            console.warn('❌ Failed to load calendar events:', data.message);
            allEventsForCalendar = [];
            renderCalendarMonth();
            updateDeadlineDetails([]);
        }
    })
    .catch(error => {
        console.error('❌ Error loading calendar:', error);
        allEventsForCalendar = [];
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
    const totalCells = 42 - (firstDay - 1 + daysInMonth);
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
    
    // Get events for this day
    const dayEvents = getEventsForDate(dateStr);
    console.log(`📅 Date ${dateStr}: Found ${dayEvents.length} events`);
    
    // Add event display
    if (dayEvents.length > 0) {
        const indicatorContainer = document.createElement('div');
        indicatorContainer.style.cssText = 'display: flex; flex-direction: column; gap: 3px; margin-top: 4px; flex: 1;';
        
        dayEvents.slice(0, 2).forEach((event, idx) => {
            const eventItem = document.createElement('div');
            eventItem.style.cssText = `
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
            const eventName = event.event_name || event.event_title || 'Untitled Event';
            console.log(`  ├─ Event ${idx + 1}: "${eventName}"`);
            eventItem.textContent = eventName.substring(0, 18);
            eventItem.title = eventName;
            indicatorContainer.appendChild(eventItem);
        });
        
        if (dayEvents.length > 2) {
            const more = document.createElement('div');
            more.style.cssText = 'font-size: 9px; color: #666; font-weight: 600; padding: 0 4px;';
            more.textContent = `+${dayEvents.length - 2} more`;
            indicatorContainer.appendChild(more);
        }
        
        dayEl.appendChild(indicatorContainer);
    }
    
    // Click handler
    if (monthType === 'current-month') {
        dayEl.addEventListener('click', () => {
            calendarSelectedDate = cellDate;
            updateDeadlineDetails(dayEvents);
            
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
    
    return events;
}

function renderCalendarList() {
    const listContainer = document.getElementById('eventsList');
    listContainer.innerHTML = '';
    
    if (allEventsForCalendar.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-500 text-sm text-center py-8">No events found</p>';
        return;
    }
    
    // Sort by date
    const sorted = [...allEventsForCalendar].sort((a, b) => {
        return new Date(a.event_date) - new Date(b.event_date);
    });
    
    sorted.forEach(event => {
        const eventDate = new Date(event.event_date);
        const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = event.start_time ? event.start_time.substring(0, 5) : 'TBA';
        
        const eventEl = document.createElement('div');
        eventEl.style.cssText = `
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #f9fafb;
        `;
        
        eventEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #333; font-size: 13px;">${escapeHtml(event.event_name)}</p>
                    <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">📅 ${dateStr} · 🕐 ${timeStr}</p>
                    ${event.location ? `<p style="margin: 0; color: #999; font-size: 12px;">📍 ${escapeHtml(event.location)}</p>` : ''}
                </div>
            </div>
        `;
        
        eventEl.addEventListener('click', () => {
            updateDeadlineDetails([event]);
        });
        
        eventEl.addEventListener('mouseover', () => {
            eventEl.style.background = '#f0f9ff';
            eventEl.style.borderColor = '#0284c7';
        });
        
        eventEl.addEventListener('mouseout', () => {
            eventEl.style.background = '#f9fafb';
            eventEl.style.borderColor = '#e5e7eb';
        });
        
        listContainer.appendChild(eventEl);
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
        monthBtn.style.background = '#dbeafe';
        monthBtn.style.color = '#0284c7';
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
        renderCalendarList();
    }
}

function previousMonth() {
    if (calendarCurrentMonth === 0) {
        calendarCurrentMonth = 11;
        calendarCurrentYear--;
    } else {
        calendarCurrentMonth--;
    }
    if (calendarCurrentView === 'month') {
        renderCalendarMonth();
    }
}

function nextMonth() {
    if (calendarCurrentMonth === 11) {
        calendarCurrentMonth = 0;
        calendarCurrentYear++;
    } else {
        calendarCurrentMonth++;
    }
    if (calendarCurrentView === 'month') {
        renderCalendarMonth();
    }
}

function goToToday() {
    const today = new Date();
    calendarCurrentMonth = today.getMonth();
    calendarCurrentYear = today.getFullYear();
    calendarSelectedDate = new Date(today);
    
    if (calendarCurrentView === 'month') {
        renderCalendarMonth();
    }
}

function updateDeadlineDetails(events) {
    const detailsDiv = document.getElementById('deadlineDetails');
    const deadlineCountEl = document.getElementById('deadlineCount');
    
    if (!events || events.length === 0) {
        detailsDiv.innerHTML = '<p class="text-gray-500 text-sm">Select an event to view details</p>';
        deadlineCountEl.textContent = `0 events happening today`;
        return;
    }
    
    // Build HTML for ALL events
    let eventsHTML = '';
    events.forEach((event, index) => {
        const eventDate = new Date(event.event_date);
        const dateStr = eventDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
        });
        
        let timeStr = dateStr;
        if (event.start_time) {
            const [hours, mins] = event.start_time.split(':');
            const startTime = new Date(eventDate);
            startTime.setHours(parseInt(hours), parseInt(mins));
            const endTime = event.end_time ? event.end_time.substring(0, 5) : '';
            
            timeStr += ` · ${event.start_time.substring(0, 5)}${endTime ? ' - ' + endTime : ''}`;
        }
        
        if (event.location) {
            timeStr += ` | ${event.location}`;
        }
        
        eventsHTML += `
            <div class="space-y-3 pb-4 ${index < events.length - 1 ? 'border-b border-gray-200' : ''}">
                <div>
                    <h4 class="font-semibold text-gray-900 text-lg mb-2">${escapeHtml(event.event_name)}</h4>
                    <span style="display: inline-block; padding: 4px 12px; background: #dbeafe; color: #0284c7; border-radius: 4px; font-size: 11px; font-weight: 600;">EVENT</span>
                </div>
                <div class="space-y-2 text-sm">
                    <p class="text-gray-700"><strong>📅 Date & Time:</strong> ${timeStr}</p>
                    ${event.capacity ? `<p class="text-gray-700"><strong>👥 Capacity:</strong> ${event.capacity}</p>` : ''}
                    ${event.total_registrations !== undefined ? `<p class="text-gray-700"><strong>📊 Registrations:</strong> ${event.total_registrations}/${event.capacity || '∞'}</p>` : ''}
                    ${event.description ? `<p class="text-gray-700 mt-3 text-justify">${escapeHtml(event.description)}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    // Wrap with scrolling container if multiple events
    const scrollStyle = events.length > 2 ? 'max-height: 400px; overflow-y: auto;' : '';
    detailsDiv.innerHTML = `<div style="${scrollStyle}">${eventsHTML}</div>`;
    
    // Update count to show events for the selected date
    const eventCount = events.length;
    deadlineCountEl.textContent = `${eventCount} event${eventCount !== 1 ? 's' : ''} happening today`;
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

    // Set loading state
    initialTableBody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">Loading participants...</td></tr>';
    actualTableBody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">Loading participants...</td></tr>';

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
        
    } catch (error) {
        const errorMsg = `Error loading participants: ${error.message}`;
        console.error(errorMsg, error);
        initialTableBody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-red-600">${errorMsg}</td></tr>`;
        actualTableBody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-red-600">${errorMsg}</td></tr>`;
        return;
    }

    // Update counts
    updateParticipantsCounts(initialList.length, actualList.length);

    // Render function
    function renderTable(list, tableBody) {
        tableBody.innerHTML = '';
        if (list.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">No participants found.</td></tr>';
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
                <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(participant.employee_code || '-')}</td>
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

function loadReports() { console.log('Reports loading...'); }

let qrScanner = null;
function initQRScannerPage() { console.log('QR Scanner initializing...'); }

let allUsersData = [];
let usersCurrentPage = 1;
let usersPerPage = 10;
let usersFilteredData = [];
function loadAllUsers() { console.log('Users loading...'); }

function loadActivityLogs() { console.log('Activity logs loading...'); }
function loadActionTypes() { console.log('Action types loading...'); }

function loadCatalogue() {
    console.log('✓ loadCatalogue() called');
    const container = document.getElementById('catalogueGrid');
    if (!container) {
        console.error('✗ catalogueGrid not found');
        return;
    }
    
    container.innerHTML = '<div class="spinner" style="padding: 50px; text-align: center; grid-column: 1/-1;">Loading catalogue...</div>';
    
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
            console.log('✓ Catalogue data received:', data.data?.length, 'events');
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
    
    console.log('Rendering', events.length, 'catalogue events');
    const html = events.map(event => {
        const imageUrl = event.image_url ? getImageUrl(event.image_url) : null;
        const eventDate = new Date(event.event_date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        
        return `
        <div class="catalogue-card" style="position: relative; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: white; aspect-ratio: 1 / 1;">
            <div class="catalogue-image" style="height: 50%; background-size: cover; background-position: center; background-color: #f0f0f0; position: relative; ${imageUrl ? `background-image: url('${imageUrl}');` : ''}">
                ${!imageUrl ? '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">📷</div>' : ''}
                ${event.is_private == 1 ? '<span class="event-badge" style="position: absolute; top: 8px; right: 8px; background: #C41E3A; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">Private</span>' : '<span class="event-badge" style="position: absolute; top: 8px; right: 8px; background: #E8E5FF; color: #6c63ff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">Public</span>'}
            </div>
            <div class="catalogue-content" style="flex: 1; display: flex; flex-direction: column; padding: 12px; overflow: hidden;">
                <h3 class="catalogue-name" style="font-size: 14px; font-weight: 600; margin: 0 0 4px 0; color: #222; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${event.event_name}</h3>
                <div class="catalogue-date" style="font-size: 11px; color: #666; margin: 2px 0; display: flex; align-items: center; gap: 3px;"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="currentColor" d="M8.5 14a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5m0 3.5a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5m4.75-4.75a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0M12 17.5a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5m4.75-4.75a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0"/><path fill="currentColor" fill-rule="evenodd" d="M8 3.25a.75.75 0 0 1 .75.75v.75h6.5V4a.75.75 0 0 1 1.5 0v.758q.228.006.425.022c.38.03.736.098 1.073.27a2.75 2.75 0 0 1 1.202 1.202c.172.337.24.693.27 1.073c.03.365.03.81.03 1.345v7.66c0 .535 0 .98-.03 1.345c-.03.38-.098.736-.27 1.073a2.75 2.75 0 0 1-1.201 1.202c-.338.172-.694.24-1.074.27c-.365.03-.81.03-1.344.03H8.17c-.535 0-.98 0-1.345-.03c-.38-.03-.736-.098-1.073-.27a2.75 2.75 0 0 1-1.202-1.2c-.172-.338-.24-.694-.27-1.074c-.03-.365-.03-.81-.03-1.344V8.67c0-.535 0-.98.03-1.345c.03-.38.098-.736.27-1.073A2.75 2.75 0 0 1 5.752 5.05c.337-.172.693-.24 1.073-.27q.197-.016.425-.022V4A.75.75 0 0 1 8 3.25m10.25 7H5.75v6.05c0 .572 0 .957.025 1.252c.023.288.065.425.111.515c.12.236.311.427.547.547c.09.046.227.088.514.111c.296.024.68.025 1.253.025h7.6c.572 0 .957 0 1.252-.025c.288-.023.425-.065.515-.111a1.25 1.25 0 0 0 .547-.547c.046-.09.088-.227.111-.515c.024-.295.025-.68.025-1.252zM10.5 7a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5z" clip-rule="evenodd"/></svg> <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formattedDate}</span></div>
                ${event.location ? `<div class="catalogue-location" style="font-size: 11px; color: #666; margin: 2px 0; display: flex; align-items: center; gap: 3px; overflow: hidden;"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 512 512" style="flex-shrink: 0;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 48c-79.5 0-144 61.39-144 137c0 87 96 224.87 131.25 272.49a15.77 15.77 0 0 0 25.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137"/><circle cx="256" cy="192" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg> <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${event.location}</span></div>` : ''}
                <div class="catalogue-actions" style="margin-top: auto; padding-top: 8px; border-top: 1px solid #eee; display: flex; gap: 6px;">
                    <button class="btn-text" style="flex: 1; padding: 6px; text-align: center; color: #0284c7; font-size: 11px; font-weight: 600; border: none; background: none; cursor: pointer; border-radius: 4px; transition: all 0.2s;" onclick="CatalogueManager.viewEvent(${event.catalogue_id})" onmouseover="this.style.background='#e0f2fe'" onmouseout="this.style.background='none'">👁️ View</button>
                    <button class="btn-text" style="flex: 1; padding: 6px; text-align: center; color: #dc2626; font-size: 11px; font-weight: 600; border: none; background: none; cursor: pointer; border-radius: 4px; transition: all 0.2s;" onclick="CatalogueManager.removeEvent(${event.catalogue_id})" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='none'">🗑️ Remove</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    console.log('✓ Catalogue rendered to container');
}

const CatalogueManager = {
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
            
            return `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; display: flex; gap: 12px; padding: 12px; background: white; transition: all 0.2s; align-items: flex-start;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'" data-event-name="${event.event_name}" data-event-location="${event.location || ''}">
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 24px;">📅</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #222; margin-bottom: 4px;">${event.event_name}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 2px;">📅 ${formattedDate}</div>
                    ${event.location ? `<div style="font-size: 12px; color: #666;">📍 ${event.location}</div>` : ''}
                </div>
                <button onclick="openLookupImageModal(${event.event_id}, '${event.event_name.replace(/'/g, "\\'")}')" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; height: fit-content;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">+ Add</button>
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
    
    removeEvent: function(catalogueId) {
        if (!confirm('Are you sure you want to remove this event from the catalogue?')) {
            return;
        }
        
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
    }
};

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
function switchTasksView(view) { console.log('Switch tasks view:', view); }

// Reports modal/preview
function previewReport(reportType) { console.log('Preview report:', reportType); }
function closeReportPreview() { console.log('Close report'); }
function downloadReport(reportType) { console.log('Download report:', reportType); }

// Attendee functions  
function markAttendeeAsAttended(attendeeId, code) { console.log('Mark attended:', code); }
function markAttendeeAsInitial(attendeeId, code) { console.log('Mark initial:', code); }
function deleteAttendee(attendeeId, code) { console.log('Delete attendee'); }
function searchAttendees(query) { console.log('Search attendees:', query); }
function exportAttendees() { console.log('Export attendees'); }
function showQRCode(code, name) { console.log('Show QR:', code); }
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
        const response = await fetch(`${API_BASE}/users.php`, {
            method: 'GET',
            headers: getUserHeaders()
        });
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
            allUsers = data.data;
            displayUsers(allUsers);
            updateUserStatistics();
        } else {
            console.error('Failed to load users:', data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Display users in table
function displayUsers(users) {
    const usersTable = document.getElementById('usersTable');
    if (!usersTable) return;
    
    if (!users || users.length === 0) {
        usersTable.innerHTML = '<tr><td colspan="5" style="padding: 32px; text-align: center; color: #9ca3af;">No users found</td></tr>';
        return;
    }
    
    usersTable.innerHTML = users.map(user => {
        const status = user.is_active ? 'Active' : (user.setup_complete ? 'Pending Setup' : 'Pending Setup');
        const statusColor = status === 'Active' ? '#10b981' : '#f59e0b';
        const statusBgColor = status === 'Active' ? '#ecfdf5' : '#fffbeb';
        
        return `
            <tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">
                <td style="padding: 12px 16px; color: #1f2937; font-weight: 500;">${user.full_name || user.username || '-'}</td>
                <td style="padding: 12px 16px; color: #6b7280;">${user.email || '-'}</td>
                <td style="padding: 12px 16px;">
                    <span style="color: #1E73BB; font-weight: 500;">${user.role_name || user.role || '-'}</span>
                </td>
                <td style="padding: 12px 16px;">
                    <span style="background: ${statusBgColor}; color: ${statusColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${status}</span>
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                    <button onclick="editUser(${user.id})" style="background: none; border: none; cursor: pointer; color: #6b7280; font-size: 16px; margin: 0 8px;">✏️</button>
                    <button onclick="deleteUser(${user.id})" style="background: none; border: none; cursor: pointer; color: #6b7280; font-size: 16px; margin: 0 8px;">🗑️</button>
                    <button onclick="resendSetupLink(${user.id})" style="background: none; border: none; cursor: pointer; color: #6b7280; font-size: 16px; margin: 0 8px;">📤</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter users based on search and filters
function filterUsersTable() {
    const searchText = document.getElementById('usersSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    const filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchText || 
            (user.full_name && user.full_name.toLowerCase().includes(searchText)) ||
            (user.username && user.username.toLowerCase().includes(searchText)) ||
            (user.email && user.email.toLowerCase().includes(searchText));
        
        const matchesRole = !roleFilter || (user.role_name === roleFilter) || (user.role === roleFilter);
        
        let matchesStatus = true;
        if (statusFilter) {
            const userStatus = user.is_active ? 'Active' : 'Pending Setup';
            matchesStatus = userStatus === statusFilter;
        }
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    displayUsers(filteredUsers);
}

// Update user statistics
function updateUserStatistics() {
    const totalAccounts = allUsers.length;
    const activeAccounts = allUsers.filter(u => u.is_active).length;
    const pendingSetup = totalAccounts - activeAccounts;
    
    const totalEl = document.getElementById('totalAccountsCount');
    const pendingEl = document.getElementById('pendingSetupCount');
    const activeEl = document.getElementById('activeAccountsCount');
    
    if (totalEl) totalEl.textContent = totalAccounts;
    if (pendingEl) pendingEl.textContent = pendingSetup;
    if (activeEl) activeEl.textContent = activeAccounts;
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
  const imageFile = document.getElementById('createCoord_image').files[0];
  
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
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  try {
    // Do NOT pass headers with FormData - let browser set Content-Type automatically
    const response = await fetch(`${API_BASE}/coordinators.php`, {
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
      alert(`Coordinator Account Created Successfully!\n\nName: ${name}\nEmail: ${email}\n\nAccount Status: Pending Setup\n\nNext Step: Assign to Event in Users Page`);
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
  const imageFile = document.getElementById('createAdmin_image').files[0];
  
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
      alert(`Admin Account Created Successfully!\n\nName: ${fullName}\nEmail: ${email}\n\nAccount Status: Active\n\nThey can now login to the admin dashboard`);
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

// ================================================================================
// COORDINATOR ASSIGNMENT FUNCTIONS
// ================================================================================

let currentEventIdForCoordinator = null;
let allCoordinators = [];

// Open lookup coordinator modal
async function openLookupCoordinatorModal() {
    try {
        // Get current event ID from modal
        const eventTitle = document.getElementById('modalEventTitle')?.textContent || '';
        
        // Store event ID from the current event being viewed
        const currentEvent = JSON.parse(localStorage.getItem('currentEventDetails') || '{}');
        currentEventIdForCoordinator = currentEvent.event_id || null;
        
        if (!currentEventIdForCoordinator) {
            alert('No event selected. Please close and select an event first.');
            return;
        }
        
        // Load coordinators with pending setup status
        await loadPendingCoordinators();
        
        // Open modal
        const modal = document.getElementById('lookupCoordinatorModal');
        if (modal) {
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Error opening coordinator lookup:', error);
        alert('Error loading coordinators');
    }
}

// Close lookup coordinator modal
function closeLookupCoordinatorModal() {
    const modal = document.getElementById('lookupCoordinatorModal');
    if (modal) {
        modal.classList.remove('active');
    }
    currentEventIdForCoordinator = null;
}

// Load pending setup coordinators
async function loadPendingCoordinators() {
    try {
        const response = await fetch(`${API_BASE}/coordinators.php?action=list_pending`, {
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
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No pending coordinators available</p>';
        return;
    }
    
    container.innerHTML = coordinators.map(coordinator => `
        <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <p style="margin: 0; font-weight: 600; color: #1f2937;">${coordinator.coordinator_name || coordinator.full_name || 'Unknown'}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">${coordinator.email || 'No email'}</p>
            </div>
            <button 
                onclick="assignCoordinatorToEvent(${coordinator.coordinator_id})" 
                style="padding: 8px 16px; background: #1E73BB; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 13px; white-space: nowrap;"
            >
                Assign
            </button>
        </div>
    `).join('');
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

console.log('✓ Admin.js consolidated - All function stubs loaded');

