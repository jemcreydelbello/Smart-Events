// API Base URL - Updated for nested folder structure
const API_BASE = '../api';

// Load sidebar navigation from separate file - Returns a Promise
function loadSidebarNavigation() {
    return new Promise((resolve, reject) => {
        console.log('Loading sidebar navigation...');
        fetch('sidebar-nav.html')
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
                    // Setup navigation after sidebar is loaded
                    setupNavigation();
                    resolve();
                } else {
                    console.error('✗ Sidebar container not found');
                    reject('Sidebar container not found');
                }
            })
            .catch(error => {
                console.error('✗ Error loading sidebar:', error);
                // Fallback: show error message
                const sidebarContainer = document.getElementById('sidebarContainer');
                if (sidebarContainer) {
                    sidebarContainer.innerHTML = '<div style="color: red; padding: 20px;">Error loading navigation</div>';
                }
                reject(error);
            });
    });
}

// Helper function to fix image URLs for nested folder structure
function getImageUrl(imagePath) {
    if (!imagePath) return null;
    // If it's already a full URL (starts with http), return as-is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    // If path is just a filename (no slashes)
    if (!imagePath.includes('/')) {
        // Gallery images start with "gallery_" and go in events_img folder
        if (imagePath.startsWith('gallery_')) {
            return '../uploads/events_img/' + imagePath;
        }
        // Regular event images go in events folder
        return '../uploads/events/' + imagePath;
    }
    // If path is relative to webroot (uploads/...), prepend ../ for admin nested folder
    if (imagePath.startsWith('uploads/')) {
        return '../' + imagePath;
    }
    // If it's already a full URL or correct path, return as-is
    return imagePath;
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

// Toggle create event private code display
function toggleCreatePrivateCode() {
    const isPrivate = document.getElementById('eventPrivate').checked;
    const codeSection = document.getElementById('createPrivateEventSection');
    const codeInput = document.getElementById('createEventPrivateCode');
    
    if (isPrivate) {
        codeSection.style.display = 'block';
        if (!codeInput.value) {
            codeInput.value = generatePrivateCode();
        }
    } else {
        codeSection.style.display = 'none';
        document.getElementById('eventDepartment').value = ''; // Clear department when unchecked
    }
}

// Toggle edit event private code display
function toggleEditPrivateCode() {
    const isPrivate = document.getElementById('editEventPrivate').checked;
    const codeSection = document.getElementById('editPrivateCodeSection');
    
    if (isPrivate) {
        codeSection.style.display = 'block';
    } else {
        codeSection.style.display = 'none';
    }
}

// Copy create event code to clipboard
function copyCreateCode() {
    const codeInput = document.getElementById('createEventPrivateCode');
    codeInput.select();
    document.execCommand('copy');
    showNotification('Code copied to clipboard!', 'success');
}

// Copy edit event code to clipboard
function copyEditCode() {
    const codeInput = document.getElementById('editEventPrivateCode');
    codeInput.select();
    document.execCommand('copy');
    showNotification('Code copied to clipboard!', 'success');
}

// Chart instances
let registrationChart = null;
let attendanceChart = null;
let capacityChart = null;
let eventTypeChart = null;

// Participant filter state
let currentParticipantFilter = 'all'; // 'all', 'public', or 'private'
let currentParticipantSort = 'newest'; // sorting method
let currentDepartmentFilter = 'all'; // department filter
let allParticipantsData = []; // store all participants for sorting/filtering

// Pagination variables for participants
let participantsCurrentPage = 1;
let participantsPerPage = 10;
let participantsTotalPages = 1;
let participantsFilteredData = []; // store filtered participants for pagination

// Events filter state
let currentEventFilter = 'all'; // 'all', 'public', or 'private'
let currentEventSort = 'newest'; // sorting method
let allEventsData = []; // store all events for sorting/filtering

// Admin users
let allAdminsData = []; // store all admin users for search/filtering

// Pagination variables for admin users
let adminsCurrentPage = 1;
let adminsPerPage = 10;
let adminsTotalPages = 1;
let adminsFilteredData = []; // store filtered admins for pagination

// Activity Logs
let allLogsData = []; // store all activity logs for search/filtering

// Pagination variables for activity logs
let logsCurrentPage = 1;
let logsPerPage = 10;
let logsTotalPages = 1;
let logsFilteredData = []; // store filtered logs for pagination

// Participants
let departmentsLoaded = false; // flag to prevent loading departments multiple times
let allParticipantsDataFull = []; // store complete participant data for suggestions

// Catalogue variables
let currentCatalogueFilter = 'all'; // 'all', 'public', or 'private'
let currentCatalogueSort = 'newest'; // sorting method
let allCatalogueData = []; // store all catalogue events for sorting/filtering

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✓ DOM ContentLoaded fired');
    
    // Check authentication - look for admin login
    let admin = JSON.parse(localStorage.getItem('admin') || 'null');
    let user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Support both admin and user login for backward compatibility
    if (!admin && !user) {
        console.log('✗ Not authenticated - redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    let authenticatedUser = admin || user;
    console.log('✓ User authenticated:', authenticatedUser.email);
    console.log('✓ Starting initialization sequence...');
    
    try {
        // Load sidebar first and wait for it to complete
        console.log('⏳ Loading sidebar...');
        await loadSidebarNavigation();
        console.log('✓ Sidebar ready');
        
        // Setup form handlers
        console.log('⏳ Setting up form handlers...');
        setupFormHandlers();
        console.log('✓ Form handlers ready');
        
        // Restore last visited page
        const lastPage = localStorage.getItem('adminLastPage') || 'dashboard';
        console.log('Restoring page:', lastPage);
        navigateToPage(lastPage);
        console.log('✓ Initialization complete');
    } catch (error) {
        console.error('✗ Initialization error:', error);
        // Fallback to dashboard if sidebar fails to load
        setTimeout(() => navigateToPage('dashboard'), 100);
    }
});

function setupFormHandlers() {
    console.log('Setting up form handlers...');
    
    // Setup create event form
    const createForm = document.getElementById('createEventForm');
    if (createForm) {
        console.log('Found createEventForm, adding submit handler');
        createForm.addEventListener('submit', function(e) {
            console.log('Form submit event fired');
            createEvent(e);
        });
    } else {
        console.error('createEventForm not found!');
    }
    
    // Setup edit event form
    const editForm = document.getElementById('editEventForm');
    if (editForm) {
        console.log('Found editEventForm, adding submit handler');
        editForm.addEventListener('submit', function(e) {
            console.log('Edit form submit event fired');
            updateEvent(e);
        });
    } else {
        console.log('editEventForm not yet available');
    }
    
    // Setup add past event form
    const addPastEventForm = document.getElementById('addPastEventForm');
    if (addPastEventForm) {
        console.log('Found addPastEventForm, adding submit handler');
        addPastEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAddPastEventForm();
        });
    }
    
    // Setup private event checkbox handlers
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

function navigateToPage(page) {
    console.log('Navigating to page:', page);
    
    // Save to localStorage
    localStorage.setItem('adminLastPage', page);
    
    // Update active link
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    navLinks.forEach(l => {
        if (l.getAttribute('data-page') === page) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    
    // Show page
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('✓ Page activated:', page, 'Element:', targetPage);
        
        // Load page-specific content
        if (page === 'dashboard') loadDashboard();
        else if (page === 'calendar') loadCalendar();
        else if (page === 'events') loadEvents();
        else if (page === 'participants') loadParticipants();
        else if (page === 'catalogue') loadCatalogue();
        else if (page === 'reports') renderReportsDisplay(sortReportsArray(filterReportsByType(allReportsData)));
        else if (page === 'qr-scanner') {
            // Reset QR scanner UI when navigating to the page
            const startBtn = document.getElementById('startScanBtn');
            const stopBtn = document.getElementById('stopScanBtn');
            const resultElement = document.getElementById('qrScanResult');
            const preview = document.getElementById('uploadPreview');
            
            if (startBtn && stopBtn && resultElement) {
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
                resultElement.innerHTML = '<p style="color: #999; text-align: center;">Waiting for QR code scan...</p>';
            }
            
            if (preview) {
                preview.innerHTML = '<p style="color: #999; font-size: 12px;">No image selected</p>';
            }
            
            // Stop any running scanner
            if (qrScanner) {
                stopQRScanner();
            }
            
            // Initialize QR scanner page features
            initQRScannerPage();
        }
        else if (page === 'reports') loadReports();
        else if (page === 'users') loadAdmins();
        else if (page === 'logs') {
            loadActivityLogs();
            loadActionTypes();
        }
    } else {
        // Stop QR scanner if navigating away from it
        if (page !== 'qr-scanner' && qrScanner) {
            stopQRScanner();
        }
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    
    // Load admin info from localStorage (check both admin and user for compatibility)
    let userInfo = null;
    let admin = JSON.parse(localStorage.getItem('admin') || '{}');
    let user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Prefer admin data, fallback to user data
    userInfo = (admin && admin.email) ? admin : user;
    
    if (userInfo && userInfo.email) {
        // Update admin name in sidebar profile
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl && userInfo.full_name) {
            adminNameEl.textContent = userInfo.full_name;
        } else if (adminNameEl) {
            adminNameEl.textContent = userInfo.email.split('@')[0];
        }
        
        // Update welcome banner name
        const adminNameBanner = document.getElementById('adminNameBanner');
        if (adminNameBanner && userInfo.full_name) {
            adminNameBanner.textContent = userInfo.full_name.split(' ')[0];
        } else if (adminNameBanner) {
            adminNameBanner.textContent = userInfo.email.split('@')[0];
        }
        
        // Update avatar with first letter if available
        const adminAvatarEl = document.getElementById('adminAvatar');
        if (adminAvatarEl) {
            // Clear previous content
            adminAvatarEl.innerHTML = '';
            adminAvatarEl.style.overflow = 'hidden';
            adminAvatarEl.style.display = 'flex';
            adminAvatarEl.style.alignItems = 'center';
            adminAvatarEl.style.justifyContent = 'center';
            
            // Check if admin has a profile image
            if (userInfo.admin_image) {
                const img = document.createElement('img');
                img.src = userInfo.admin_image;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.alt = userInfo.full_name || 'Admin';
                adminAvatarEl.appendChild(img);
            } else if (userInfo.full_name) {
                // Fallback to initials
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

// ============ DASHBOARD ============
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
    // Update main stat values
    const totalEventsEl = document.getElementById('totalEvents');
    if (totalEventsEl) totalEventsEl.textContent = stats.totalEvents || 0;
    
    const totalRegEl = document.getElementById('totalRegistrations');
    if (totalRegEl) totalRegEl.textContent = stats.totalRegistrations || 0;
    
    const attendedEl = document.getElementById('attendedToday');
    if (attendedEl) attendedEl.textContent = stats.attendedToday || 0;
    
    const eventsThisWeekEl = document.getElementById('eventsThisWeek');
    if (eventsThisWeekEl) eventsThisWeekEl.textContent = stats.eventsThisWeek || 0;
    
    // Update meta information
    const eventsMetaEl = document.getElementById('eventsMetaWeek');
    if (eventsMetaEl) eventsMetaEl.textContent = `+${stats.eventsThisWeek || 0} this week`;
    
    const regPercentEl = document.getElementById('registrationPercent');
    if (regPercentEl) regPercentEl.textContent = `+${stats.registrationPercent || 0}% from last month`;
}

function drawRegistrationTrends(trends) {
    const ctx = document.getElementById('registrationTrendsChart');
    
    if (!ctx) return;
    
    // Destroy existing chart
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
    
    // Destroy existing chart
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
    
    // Destroy existing chart
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
    
    // Destroy existing chart
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

// ============ CALENDAR ============
let calendarCurrentDate = new Date();
let allEventsForCalendar = [];

function loadCalendar() {
    // Load all events (including past ones) for calendar view
    fetch(`${API_BASE}/events.php?action=list_all`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allEventsForCalendar = data.data || [];
                renderCalendar();
            }
        })
        .catch(error => console.error('Error loading calendar events:', error));
}

function renderCalendar() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    let html = '';
    
    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += `<div class="calendar-day other-month">
                    <span class="calendar-day-number">${day}</span>
                </div>`;
    }
    
    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDateForComparison(date);
        const isToday = (date.toDateString() === today.toDateString());
        
        // Get events for this day
        const eventsThisDay = allEventsForCalendar.filter(event => {
            return event.event_date === dateStr;
        });
        
        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' today';
        
        html += `<div class="${dayClass}" onclick="selectCalendarDate('${dateStr}', this)">
                    <span class="calendar-day-number">${day}</span>
                    <div class="calendar-events">`;
        
        // Show first 2 events, indicate if there are more
        if (eventsThisDay.length > 0) {
            for (let i = 0; i < Math.min(2, eventsThisDay.length); i++) {
                const event = eventsThisDay[i];
                const eventType = event.is_private ? 'private' : 'public';
                const eventName = event.event_name.length > 12 ? event.event_name.substring(0, 12) + '...' : event.event_name;
                html += `<div class="calendar-event ${eventType}" title="${event.event_name}">${eventName}</div>`;
            }
            
            if (eventsThisDay.length > 2) {
                html += `<div class="calendar-event multiple" title="${eventsThisDay.length} events">+${eventsThisDay.length - 2}</div>`;
            }
        }
        
        html += `    </div>
                </div>`;
    }
    
    // Next month's days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month">
                    <span class="calendar-day-number">${day}</span>
                </div>`;
    }
    
    document.getElementById('calendarDays').innerHTML = html;
    
    // Reset selected date display on month change
    document.getElementById('selectedDateEvents').style.display = 'none';
    document.getElementById('noEventsMsg').style.display = 'block';
}

function formatDateForComparison(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function selectCalendarDate(dateStr, element) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked date
    element.classList.add('selected');
    
    // Get events for this date
    const eventsThisDate = allEventsForCalendar.filter(event => event.event_date === dateStr);
    
    if (eventsThisDate.length === 0) {
        document.getElementById('selectedDateEvents').style.display = 'none';
        document.getElementById('noEventsMsg').style.display = 'block';
        document.getElementById('participantsSection').style.display = 'none';
        return;
    }
    
    // Format date for display
    const date = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const displayDate = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
    
    document.getElementById('selectedDateTitle').textContent = `Events on ${displayDate}`;
    
    let eventsHtml = '';
    eventsThisDate.forEach(event => {
        const eventType = event.is_private ? 'private' : 'public';
        const typeLabel = event.is_private ? 'Private' : 'Public';
        const timeDisplay = event.start_time ? event.start_time.substring(0, 5) : 'TBA';
        
        eventsHtml += `<div class="event-in-calendar ${eventType}">
                        <div class="event-in-calendar-name">${event.event_name}</div>
                        <span class="event-in-calendar-type ${eventType}">${typeLabel}</span>
                        <div class="event-in-calendar-time"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style="display: inline-block; margin-right: 6px; vertical-align: middle;"><path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z"/><rect width="2" height="7" x="11" y="6" fill="currentColor" rx="1"><animateTransform attributeName="transform" dur="9s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></rect><rect width="2" height="9" x="11" y="11" fill="currentColor" rx="1"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></rect></svg>${timeDisplay}</div>
                        <div class="event-in-calendar-location"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" style="display: inline-block; margin-right: 6px; vertical-align: middle;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 48c-79.5 0-144 61.39-144 137c0 87 96 224.87 131.25 272.49a15.77 15.77 0 0 0 25.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137"/><circle cx="256" cy="192" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>${event.location || 'Location TBA'}</div>
                        <div class="event-in-calendar-action">
                            <button class="btn btn-primary btn-small" onclick="viewEventDetail(${event.event_id})">View Details</button>
                        </div>
                    </div>`;
    });
    
    document.getElementById('selectedDateEvents').innerHTML = eventsHtml;
    document.getElementById('selectedDateEvents').style.display = 'block';
    document.getElementById('noEventsMsg').style.display = 'none';
    
    // Load participants for first event in the list
    if (eventsThisDate.length > 0) {
        loadCalendarEventParticipants(eventsThisDate[0].event_id);
    }
}

function previousMonth() {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
    renderCalendar();
}

// Store current event for modal
let currentCalendarEvent = null;

function viewEventDetail(eventId) {
    const event = allEventsForCalendar.find(e => e.event_id === eventId);
    if (!event) {
        console.error('Event not found:', eventId);
        return;
    }
    
    try {
        currentCalendarEvent = event;
        
        // Populate modal
        const nameEl = document.getElementById('calendarModalEventName');
        if (nameEl) nameEl.textContent = event.event_name || 'Event';
        
        const dateEl = document.getElementById('calendarModalEventDate');
        if (dateEl) {
            try {
                dateEl.textContent = new Date(event.event_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            } catch (e) {
                dateEl.textContent = event.event_date || '-';
            }
        }
        
        const timeDisplay = event.start_time ? event.start_time.substring(0, 5) + ' - ' + (event.end_time ? event.end_time.substring(0, 5) : '') : 'TBA';
        const timeEl = document.getElementById('calendarModalEventTime');
        if (timeEl) timeEl.textContent = timeDisplay;
        
        const locEl = document.getElementById('calendarModalEventLocation');
        if (locEl) locEl.textContent = event.location || 'Not specified';
        
        const typeLabel = event.is_private ? 'Private' : 'Public';
        const typeElement = document.getElementById('calendarModalEventTypeSpan');
        if (typeElement) {
            typeElement.textContent = typeLabel;
            typeElement.style.background = event.is_private ? '#ffe0e0' : '#e8e5ff';
            typeElement.style.color = event.is_private ? '#C41E3A' : '#6c63ff';
        }
        
        const capacity = event.capacity || 'Unlimited';
        const capEl = document.getElementById('calendarModalEventCapacity');
        if (capEl) capEl.textContent = capacity;
        
        const descEl = document.getElementById('calendarModalEventDescription');
        if (descEl) descEl.textContent = event.description || 'No description provided';
        
        // Load participants
        loadCalendarEventParticipants(eventId);
        
        // Open modal with smooth display
        const modal = document.getElementById('calendarEventDetailsModal');
        if (modal) {
            modal.style.display = 'block';
            // Force reflow for animation
            modal.offsetHeight;
            modal.style.opacity = '1';
        }
    } catch (error) {
        console.error('Error opening event details:', error);
    }
}

function closeCalendarEventModal() {
    const modal = document.getElementById('calendarEventDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentCalendarEvent = null;
}

// Close modal when clicking outside of it
function onModalBackgroundClick(event) {
    if (event.target.id === 'calendarEventDetailsModal') {
        closeCalendarEventModal();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCalendarEventModal();
    }
});

function editCalendarEvent() {
    if (!currentCalendarEvent) return;
    
    // Close calendar modal
    closeCalendarEventModal();
    
    // Navigate to events page and open edit modal
    navigateToPage('events');
    setTimeout(() => {
        viewEventDetailsModal(currentCalendarEvent.event_id);
    }, 100);
}

// Store current event participants and filtered participants
let currentEventParticipants = [];
let filteredEventParticipants = [];

function loadCalendarEventParticipants(eventId) {
    document.getElementById('participantsList').innerHTML = '<p style="color: #999; font-size: 12px; text-align: center; padding: 10px;">Loading participants...</p>';
    document.getElementById('participantsSection').style.display = 'block';
    
    fetch(`${API_BASE}/participants.php?action=list&event_id=${eventId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentEventParticipants = data.data || [];
                filteredEventParticipants = [...currentEventParticipants];
                
                // Reset search input
                document.getElementById('participantSearchInput').value = '';
                
                displayCalendarEventParticipants();
            } else {
                document.getElementById('participantsList').innerHTML = '<p style="color: #999; font-size: 12px; text-align: center; padding: 10px;">No participants found</p>';
            }
        })
        .catch(error => {
            console.error('Error loading participants:', error);
            document.getElementById('participantsList').innerHTML = '<p style="color: #d32f2f; font-size: 12px; text-align: center; padding: 10px;">Error loading participants</p>';
        });
}

function displayCalendarEventParticipants() {
    if (filteredEventParticipants.length === 0) {
        document.getElementById('participantsList').innerHTML = '<p style="color: #999; font-size: 12px; text-align: center; padding: 10px;">No participants</p>';
        return;
    }
    
    let html = '';
    filteredEventParticipants.forEach((participant, index) => {
        const statusLabel = participant.status === 'ATTENDED' ? 'Attended' : 'Registered';
        const statusColor = participant.status === 'ATTENDED' ? '#28A745' : '#FFC107';
        
        html += `<div style="padding: 10px; background: white; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid ${statusColor};">
                    <div style="font-weight: 600; color: #333; font-size: 12px; margin-bottom: 3px;">${participant.full_name || 'Unknown'}</div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">${participant.email || 'No email'}</div>
                    <div style="font-size: 11px; color: ${statusColor}; font-weight: 600;">${statusLabel}</div>
                </div>`;
    });
    
    document.getElementById('participantsList').innerHTML = html;
}

function searchCalendarParticipants() {
    const searchTerm = document.getElementById('participantSearchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredEventParticipants = [...currentEventParticipants];
    } else {
        filteredEventParticipants = currentEventParticipants.filter(p => 
            (p.full_name && p.full_name.toLowerCase().includes(searchTerm)) ||
            (p.email && p.email.toLowerCase().includes(searchTerm))
        );
    }
    
    displayCalendarEventParticipants();
}

// ============ EVENTS ============
function loadEvents() {
    console.log('✓ loadEvents() called');
    const container = document.getElementById('eventsContainer');
    if (!container) {
        console.error('✗ eventsContainer not found');
        return;
    }
    
    // Show loading spinner
    container.innerHTML = '<div class="spinner" style="padding: 50px; text-align: center;">Loading events...</div>';
    
    fetch(`${API_BASE}/events.php?action=list`)
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
                displayEvents(data.data);
            } else {
                throw new Error(data.message || 'Failed to load events');
            }
        })
        .catch(error => {
            console.error('✗ Error loading events:', error);
            container.innerHTML = `<div style="padding: 20px; color: #d32f2f; background: #ffebee; border-radius: 4px;">❌ Error loading events: ${error.message}</div>`;
        });
    
    // Setup event search with suggestions
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
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== searchBox) {
                hideEventSuggestions();
            }
        });
    }

    // Catalogue search listener
    const catalogueSearchBox = document.getElementById('catalogueSearch');
    if (catalogueSearchBox) {
        let searchTimeout;
        catalogueSearchBox.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            if (query.length > 0) {
                searchTimeout = setTimeout(() => {
                    searchCatalogueList(query);
                    displayCatalogueSuggestions(query);
                }, 300);
            } else if (query.length === 0) {
                clearTimeout(searchTimeout);
                hideCatalogueSuggestions();
                loadCatalogue();
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== catalogueSearchBox) {
                hideCatalogueSuggestions();
            }
        });
    }

    // Reports search listener
    const reportSearchBox = document.getElementById('reportSearch');
    if (reportSearchBox) {
        let searchTimeout;
        reportSearchBox.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            if (query.length > 0) {
                searchTimeout = setTimeout(() => {
                    searchReportsList(query);
                    displayReportSuggestions(query);
                }, 300);
            } else if (query.length === 0) {
                clearTimeout(searchTimeout);
                hideReportSuggestions();
                renderReportsDisplay(sortReportsArray(filterReportsByType(allReportsData)));
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== reportSearchBox) {
                hideReportSuggestions();
            }
        });
    }
}

function displayEvents(events) {
    // Store the events data
    allEventsData = events;
    
    // Apply filtering and sorting
    renderEvents(sortEventsArray(filterEventsByType(events)));
}

function filterEventsByType(events) {
    if (currentEventFilter === 'public') {
        return events.filter(e => e.is_private != 1);
    } else if (currentEventFilter === 'private') {
        return events.filter(e => e.is_private == 1);
    }
    return events; // 'all'
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
    
    const container = document.getElementById('eventsContainer');
    console.log('✓ Container found:', !!container);
    
    if (!container) {
        console.error('✗ eventsContainer not found');
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
        <div class="event-card" style="position: relative; cursor: pointer; border-radius: 12px; overflow: hidden;" onclick="viewEventDetailsModal(${event.event_id})">
            <div class="event-image" ${imageUrl ? `style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"` : ''}>
                ${!imageUrl ? '📅' : ''}
                ${event.is_private == 1 ? '<span class="event-badge" style="position: absolute; top: 10px; right: 10px; background: #C41E3A; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">Private</span>' : '<span class="event-badge" style="position: absolute; top: 10px; right: 10px; background: #E8E5FF; color: #6c63ff; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">Public</span>'}
            </div>
            <div class="event-content">
                <h3 class="event-name">${event.event_name}</h3>
                <div class="event-date"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="display: inline-block; margin-right: 6px; vertical-align: middle;"><path fill="currentColor" d="M8.5 14a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5m0 3.5a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5m4.75-4.75a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0M12 17.5a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5m4.75-4.75a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0"/><path fill="currentColor" fill-rule="evenodd" d="M8 3.25a.75.75 0 0 1 .75.75v.75h6.5V4a.75.75 0 0 1 1.5 0v.758q.228.006.425.022c.38.03.736.098 1.073.27a2.75 2.75 0 0 1 1.202 1.202c.172.337.24.693.27 1.073c.03.365.03.81.03 1.345v7.66c0 .535 0 .98-.03 1.345c-.03.38-.098.736-.27 1.073a2.75 2.75 0 0 1-1.201 1.202c-.338.172-.694.24-1.074.27c-.365.03-.81.03-1.344.03H8.17c-.535 0-.98 0-1.345-.03c-.38-.03-.736-.098-1.073-.27a2.75 2.75 0 0 1-1.202-1.2c-.172-.338-.24-.694-.27-1.074c-.03-.365-.03-.81-.03-1.344V8.67c0-.535 0-.98.03-1.345c.03-.38.098-.736.27-1.073A2.75 2.75 0 0 1 5.752 5.05c.337-.172.693-.24 1.073-.27q.197-.016.425-.022V4A.75.75 0 0 1 8 3.25m10.25 7H5.75v6.05c0 .572 0 .957.025 1.252c.023.288.065.425.111.515c.12.236.311.427.547.547c.09.046.227.088.514.111c.296.024.68.025 1.253.025h7.6c.572 0 .957 0 1.252-.025c.288-.023.425-.065.515-.111a1.25 1.25 0 0 0 .547-.547c.046-.09.088-.227.111-.515c.024-.295.025-.68.025-1.252zM10.5 7a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5z" clip-rule="evenodd"/></svg> ${new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div class="event-location"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" style="display: inline-block; margin-right: 6px; vertical-align: middle;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 48c-79.5 0-144 61.39-144 137c0 87 96 224.87 131.25 272.49a15.77 15.77 0 0 0 25.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137"/><circle cx="256" cy="192" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg> ${event.location || 'TBD'}</div>
                <div style="margin: 10px 0; padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 12px;">
                    <strong>Capacity:</strong> ${event.capacity} | <strong>Available:</strong> ${event.available_spots >= 0 ? event.available_spots : 'Full'}
                </div>
                <div class="event-stats">
                    <div class="event-stat">
                        <div class="event-stat-value">${event.total_registrations || 0}</div>
                        <div>Registrations</div>
                    </div>
                    <div class="event-stat">
                        <div class="event-stat-value">${event.attended_count || 0}</div>
                        <div>Attended</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    container.innerHTML = html;
    console.log('✓ Events rendered to container');
}


// Search events
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
    const suggestionsContainer = document.getElementById('eventSearchSuggestions');
    if (!suggestionsContainer || query.length === 0) return;
    
    // Filter events that match the query
    const matches = allEventsData.filter(event => {
        return event.event_name.toLowerCase().includes(query) ||
            (event.location && event.location.toLowerCase().includes(query)) ||
            (event.description && event.description.toLowerCase().includes(query));
    }).slice(0, 8); // Limit to 8 suggestions
    
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
    const suggestionsContainer = document.getElementById('eventSearchSuggestions');
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Filter events by type (all, public, private)
function filterEvents(filterType) {
    console.log('Setting event filter to:', filterType);
    currentEventFilter = filterType;
    
    // Clear search box and reload with new filter
    const searchBox = document.getElementById('eventSearch');
    if (searchBox) {
        searchBox.value = '';
    }
    
    renderEvents(sortEventsArray(filterEventsByType(allEventsData)));
}

// Sort events
function sortEvents(sortType) {
    console.log('Setting event sort to:', sortType);
    currentEventSort = sortType;
    
    // Apply sorting to current events and re-render
    renderEvents(sortEventsArray(filterEventsByType(allEventsData)));
}

// ============ CATALOGUE SEARCH & FILTER ============

function searchCatalogueList(query) {
    console.log('Searching catalogue for:', query);
    const filtered = allCatalogueData.filter(event => {
        const matchesSearch = event.event_name.toLowerCase().includes(query) ||
            (event.location && event.location.toLowerCase().includes(query)) ||
            (event.description && event.description.toLowerCase().includes(query));
        return matchesSearch;
    });
    renderCatalogueDisplay(sortCatalogueArray(filterCatalogueByType(filtered)));
}

function displayCatalogueSuggestions(query) {
    const suggestionsContainer = document.getElementById('catalogueSearchSuggestions');
    if (!suggestionsContainer || query.length === 0) return;
    
    // Filter catalogue events that match the query
    const matches = allCatalogueData.filter(event => {
        return event.event_name.toLowerCase().includes(query) ||
            (event.location && event.location.toLowerCase().includes(query)) ||
            (event.description && event.description.toLowerCase().includes(query));
    }).slice(0, 8); // Limit to 8 suggestions
    
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
            <div class="search-suggestion-item" onclick="selectCatalogueSuggestion('${event.event_name}')">
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

function hideCatalogueSuggestions() {
    const suggestionsContainer = document.getElementById('catalogueSearchSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectCatalogueSuggestion(eventName) {
    const searchBox = document.getElementById('catalogueSearch');
    if (searchBox) {
        searchBox.value = eventName;
        hideCatalogueSuggestions();
        searchCatalogueList(eventName.toLowerCase());
    }
}

// Filter catalogue by type (all, public, private)
function filterCatalogue(filterType) {
    console.log('Setting catalogue filter to:', filterType);
    currentCatalogueFilter = filterType;
    
    // Clear search box and reload with new filter
    const searchBox = document.getElementById('catalogueSearch');
    if (searchBox) {
        searchBox.value = '';
    }
    
    renderCatalogueDisplay(sortCatalogueArray(filterCatalogueByType(allCatalogueData)));
}

// Sort catalogue
function sortCatalogue(sortType) {
    console.log('Setting catalogue sort to:', sortType);
    currentCatalogueSort = sortType;
    
    // Apply sorting to current catalogue and re-render
    renderCatalogueDisplay(sortCatalogueArray(filterCatalogueByType(allCatalogueData)));
}

function filterCatalogueByType(events) {
    if (currentCatalogueFilter === 'public') {
        return events.filter(e => e.is_private != 1);
    } else if (currentCatalogueFilter === 'private') {
        return events.filter(e => e.is_private == 1);
    }
    return events; // 'all'
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

function renderCatalogueDisplay(events) {
    const container = document.getElementById('catalogueContainer');
    if (!container) return;
    
    if (!events || events.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #999; padding: 60px 40px; background: white; border-radius: 8px; border: 2px dashed #e0e0e0;"><p style="margin: 0; font-size: 16px; font-weight: 500;">📭 No catalogued events found</p></div>';
        return;
    }
    
    const html = renderCatalogueHTML(events);
    container.innerHTML = html;
}

// View event details in modal
let currentEventDetailsId = null;
let currentEventDetailsParticipants = [];

function viewEventDetailsModal(eventId) {
    console.log('Viewing event details for event ID:', eventId);
    
    currentEventDetailsId = eventId;
    const event = allEventsData.find(e => e.event_id == eventId);
    
    if (!event) {
        console.error('Event not found');
        return;
    }
    
    // Show modal
    const modal = document.getElementById('eventDetailsModal');
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Update event info
    document.getElementById('eventDetailsTitle').textContent = event.event_name;
    document.getElementById('detailsEventDate').textContent = new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('detailsEventLocation').textContent = event.location || 'Not specified';
    document.getElementById('detailsEventType').textContent = event.is_private == 1 ? 'Private' : 'Public';
    document.getElementById('detailsEventCapacity').textContent = `${event.capacity} people`;
    document.getElementById('detailsEventDescription').textContent = event.description || 'No description provided';
    
    // Load participants
    loadEventParticipants(eventId);
    
    // Reset to registered tab
    switchParticipantTabModal('registered');
}

function closeEventDetailsModal() {
    const modal = document.getElementById('eventDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEventDetailsId = null;
    currentEventDetailsParticipants = [];
}

function editEventFromModal() {
    const eventId = currentEventDetailsId;
    if (eventId) {
        closeEventDetailsModal();
        openEditEventModal(eventId);
    }
}

function deleteEventFromModal() {
    if (currentEventDetailsId) {
        const eventId = currentEventDetailsId;
        const event = allEventsData.find(e => e.event_id == eventId);
        if (event) {
            const eventName = event.event_name;
            closeEventDetailsModal();
            deleteEvent(eventId, eventName);
        }
    }
}

function loadEventParticipants(eventId) {
    console.log('Loading participants for event ID:', eventId);
    
    fetch(`${API_BASE}/participants.php?action=list&event_id=${eventId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                console.log('✓ Event participants loaded:', data.data.length);
                currentEventDetailsParticipants = data.data;
                
                // Render registered participants
                renderRegisteredParticipantsModal();
                
                // Render attended participants
                renderAttendedParticipantsModal();
            } else {
                console.error('Failed to load participants');
            }
        })
        .catch(error => {
            console.error('Error loading participants:', error);
        });
}

function renderRegisteredParticipantsModal() {
    const container = document.getElementById('registeredParticipantsModal');
    
    if (!currentEventDetailsParticipants || currentEventDetailsParticipants.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No registrations yet.</p>';
        return;
    }
    
    const html = currentEventDetailsParticipants
        .filter(p => p.full_name) // Avoid null records
        .map(p => `
            <div style="padding: 12px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 3px;">${p.full_name}</div>
                    <div style="font-size: 12px; color: #666;">${p.email}</div>
                    <div style="font-size: 11px; color: #999; margin-top: 3px;"><strong>Code:</strong> ${p.registration_code || '-'}</div>
                </div>
                <span style="background: ${p.status === 'ATTENDED' ? '#28A745' : p.status === 'REGISTERED' ? '#FFC107' : '#dc3545'}; color: white; padding: 4px 10px; border-radius: 3px; font-size: 11px; font-weight: bold;">${p.status || 'UNKNOWN'}</span>
            </div>
        `).join('');
    
    container.innerHTML = html;
}

function renderAttendedParticipantsModal() {
    const container = document.getElementById('attendedParticipantsModal');
    
    const attendedList = currentEventDetailsParticipants.filter(p => p.status === 'ATTENDED' && p.full_name);
    
    if (attendedList.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No attendees yet.</p>';
        return;
    }
    
    const html = attendedList
        .map(p => `
            <div style="padding: 12px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 3px;">✅ ${p.full_name}</div>
                    <div style="font-size: 12px; color: #666;">${p.email}</div>
                    <div style="font-size: 11px; color: #999; margin-top: 3px;"><strong>Code:</strong> ${p.registration_code || '-'}</div>
                </div>
                <span style="background: #28A745; color: white; padding: 4px 10px; border-radius: 3px; font-size: 11px; font-weight: bold;">ATTENDED</span>
            </div>
        `).join('');
    
    container.innerHTML = html;
}

function switchParticipantTabModal(tab) {
    const registeredDiv = document.getElementById('registeredParticipantsModal');
    const attendedDiv = document.getElementById('attendedParticipantsModal');
    const registeredTab = document.getElementById('registeredTabModal');
    const attendedTab = document.getElementById('attendedTabModal');
    
    if (tab === 'registered') {
        registeredDiv.style.display = 'block';
        attendedDiv.style.display = 'none';
        registeredTab.style.color = '#C41E3A';
        registeredTab.style.borderBottom = '3px solid #C41E3A';
        attendedTab.style.color = '#999';
        attendedTab.style.borderBottom = 'none';
    } else if (tab === 'attended') {
        registeredDiv.style.display = 'none';
        attendedDiv.style.display = 'block';
        registeredTab.style.color = '#999';
        registeredTab.style.borderBottom = 'none';
        attendedTab.style.color = '#C41E3A';
        attendedTab.style.borderBottom = '3px solid #C41E3A';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('eventDetailsModal');
    if (event.target == modal) {
        closeEventDetailsModal();
    }
}

// ============ PARTICIPANTS ============
function loadParticipants() {
    console.log('✓ loadParticipants() called with filter:', currentParticipantFilter, 'department:', currentDepartmentFilter);
    const tbody = document.querySelector('#participantsTable tbody');
    
    if (!tbody) {
        console.error('✗ participantsTable tbody not found');
        return;
    }
    
    // Load departments only on first load
    if (!departmentsLoaded) {
        loadDepartmentsFilter();
        departmentsLoaded = true;
    }
    
    // Show loading message
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Loading participants...</td></tr>';
    
    // Build API URL with filter
    let apiUrl = `${API_BASE}/participants.php?action=list`;
    if (currentParticipantFilter !== 'all') {
        apiUrl += `&event_type=${currentParticipantFilter}`;
    }
    if (currentDepartmentFilter !== 'all') {
        apiUrl += `&department_id=${currentDepartmentFilter}`;
    }
    
    fetch(apiUrl)
        .then(response => {
            console.log('✓ Participants API response:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('✓ Participants data received:', data.data?.length, 'participants');
            if (data.success && data.data) {
                displayParticipants(data.data);
            } else {
                throw new Error(data.message || 'Failed to load participants');
            }
        })
        .catch(error => {
            console.error('✗ Error loading participants:', error);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: #d32f2f; padding: 20px;">❌ Error loading participants: ${error.message}</td></tr>`;
        });
    
    // Setup search with suggestions
    const searchBox = document.getElementById('participantSearch');
    if (searchBox) {
        // Remove old listeners to prevent stacking
        const newSearchBox = searchBox.cloneNode(true);
        searchBox.parentNode.replaceChild(newSearchBox, searchBox);
        
        let searchTimeout;
        newSearchBox.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            if (query.length > 2) {
                searchTimeout = setTimeout(() => {
                    searchParticipants(query);
                    displayParticipantSuggestions(query);
                }, 300);
            } else if (query.length === 0) {
                clearTimeout(searchTimeout);
                hideParticipantSuggestions();
                loadParticipants();
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== newSearchBox && e.target.id !== 'participantSearch') {
                hideParticipantSuggestions();
            }
        });
    }
}

function displayParticipants(participants) {
    // Store the participants data - full copy for suggestions
    allParticipantsData = participants;
    allParticipantsDataFull = JSON.parse(JSON.stringify(participants)); // Deep copy for suggestions
    
    // Apply sorting and display
    renderParticipants(sortParticipantsArray(participants));
}

function renderParticipants(participants) {
    const tbody = document.querySelector('#participantsTable tbody');
    
    if (!tbody) return;
    
    // Store filtered data for pagination
    participantsFilteredData = participants;
    participantsCurrentPage = 1; // Reset to first page
    participantsTotalPages = Math.ceil(participants.length / participantsPerPage);
    
    if (participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No participants found.</td></tr>';
        updatePaginationControls();
        return;
    }
    
    // Display current page
    displayParticipantsPage();
    updatePaginationControls();
}

function displayParticipantsPage() {
    const tbody = document.querySelector('#participantsTable tbody');
    if (!tbody) return;
    
    const startIndex = (participantsCurrentPage - 1) * participantsPerPage;
    const endIndex = startIndex + participantsPerPage;
    const pageData = participantsFilteredData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No participants found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = pageData
        .filter(p => p.full_name) // Only show unique participant records
        .map(p => `
            <tr>
                <td>${p.full_name}</td>
                <td>${p.email}</td>
                <td>${p.department_name || '-'}</td>
                <td>${p.event_name || '-'}</td>
                <td>${p.registration_code || '-'}</td>
                <td><span class="status-badge badge-${p.status ? p.status.toLowerCase() : 'registered'}">${p.status || 'REGISTERED'}</span></td>
            </tr>
        `).join('');
}

function updatePaginationControls() {
    const totalRecords = participantsFilteredData.length;
    
    // Update pagination info total
    const totalElement = document.getElementById('paginationTotal');
    if (totalElement) {
        totalElement.textContent = totalRecords;
    }
    
    // Update Previous button
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.disabled = participantsCurrentPage === 1;
    }
    
    // Update Next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = participantsCurrentPage >= participantsTotalPages;
    }
    
    // Update page numbers
    const pageNumbersDiv = document.getElementById('pageNumbers');
    if (pageNumbersDiv) {
        let pageNumbersHtml = '';
        const maxPagesToShow = 5;
        let startPage = Math.max(1, participantsCurrentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(participantsTotalPages, startPage + maxPagesToShow - 1);
        
        // Adjust start page if too close to end
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            pageNumbersHtml += `<button class="page-btn" onclick="goToParticipantsPage(1)">1</button>`;
            if (startPage > 2) {
                pageNumbersHtml += `<span style="color: #999; padding: 0 4px;">...</span>`;
            }
        }
        
        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === participantsCurrentPage ? 'active' : '';
            pageNumbersHtml += `<button class="page-btn ${activeClass}" onclick="goToParticipantsPage(${i})">${i}</button>`;
        }
        
        // Add last page and ellipsis if needed
        if (endPage < participantsTotalPages) {
            if (endPage < participantsTotalPages - 1) {
                pageNumbersHtml += `<span style="color: #999; padding: 0 4px;">...</span>`;
            }
            pageNumbersHtml += `<button class="page-btn" onclick="goToParticipantsPage(${participantsTotalPages})">${participantsTotalPages}</button>`;
        }
        
        pageNumbersDiv.innerHTML = pageNumbersHtml;
    }
}

function nextPage() {
    if (participantsCurrentPage < participantsTotalPages) {
        participantsCurrentPage++;
        displayParticipantsPage();
        updatePaginationControls();
        // Scroll to top of table
        document.querySelector('.table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function previousPage() {
    if (participantsCurrentPage > 1) {
        participantsCurrentPage--;
        displayParticipantsPage();
        updatePaginationControls();
        // Scroll to top of table
        document.querySelector('.table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function goToParticipantsPage(pageNum) {
    if (pageNum >= 1 && pageNum <= participantsTotalPages) {
        participantsCurrentPage = pageNum;
        displayParticipantsPage();
        updatePaginationControls();
        // Scroll to top of table
        document.querySelector('.table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function changeRowsPerPage(newValue) {
    const rowsPerPage = parseInt(newValue);
    if (rowsPerPage > 0) {
        participantsPerPage = rowsPerPage;
        participantsCurrentPage = 1; // Reset to first page
        participantsTotalPages = Math.ceil(participantsFilteredData.length / participantsPerPage);
        displayParticipantsPage();
        updatePaginationControls();
        // Scroll to top of table
        document.querySelector('.table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function sortParticipantsArray(participants) {
    const sorted = [...participants];
    
    if (currentParticipantSort === 'newest') {
        sorted.sort((a, b) => {
            const dateA = new Date(a.registered_at || 0);
            const dateB = new Date(b.registered_at || 0);
            return dateB - dateA; // Newest first
        });
    } else if (currentParticipantSort === 'oldest') {
        sorted.sort((a, b) => {
            const dateA = new Date(a.registered_at || 0);
            const dateB = new Date(b.registered_at || 0);
            return dateA - dateB; // Oldest first
        });
    } else if (currentParticipantSort === 'name-asc') {
        sorted.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    } else if (currentParticipantSort === 'name-desc') {
        sorted.sort((a, b) => (b.full_name || '').localeCompare(a.full_name || ''));
    }
    
    return sorted;
}

function searchParticipants(query) {
    let apiUrl = `${API_BASE}/participants.php?action=search&q=${encodeURIComponent(query)}`;
    if (currentParticipantFilter !== 'all') {
        apiUrl += `&event_type=${currentParticipantFilter}`;
    }
    if (currentDepartmentFilter !== 'all') {
        apiUrl += `&department_id=${currentDepartmentFilter}`;
    }
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Store the search results and render with sorting and pagination
                allParticipantsData = data.data || [];
                renderParticipants(sortParticipantsArray(allParticipantsData));
            }
        });
}

function displayParticipantSuggestions(query) {
    const suggestionsContainer = document.getElementById('participantSearchSuggestions');
    if (!suggestionsContainer || query.length === 0) return;
    
    // Filter participants from the FULL dataset (not search results)
    const matches = allParticipantsDataFull.filter(participant => {
        return participant.full_name.toLowerCase().includes(query) ||
            (participant.email && participant.email.toLowerCase().includes(query));
    }).slice(0, 8); // Limit to 8 suggestions
    
    if (matches.length === 0) {
        suggestionsContainer.innerHTML = '<div style="padding: 15px; color: #999; text-align: center;">No participants found</div>';
        suggestionsContainer.style.display = 'block';
        return;
    }
    
    suggestionsContainer.innerHTML = matches.map(participant => {
        return `
            <div class="search-suggestion-item" onclick="selectParticipantSuggestion('${escapeHtml(participant.full_name)}')">
                <div class="search-suggestion-icon">👤</div>
                <div class="search-suggestion-text">
                    <div class="search-suggestion-name">${escapeHtml(participant.full_name)}</div>
                    <div class="search-suggestion-date">${escapeHtml(participant.email)}${participant.department_name ? ' • ' + escapeHtml(participant.department_name) : ''}</div>
                </div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.style.display = 'block';
}

function hideParticipantSuggestions() {
    const suggestionsContainer = document.getElementById('participantSearchSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectParticipantSuggestion(participantName) {
    const searchBox = document.getElementById('participantSearch');
    if (searchBox) {
        searchBox.value = participantName;
        hideParticipantSuggestions();
        searchParticipants(participantName.toLowerCase());
    }
}

function filterParticipants(filterType) {
    console.log('Setting participant filter to:', filterType);
    currentParticipantFilter = filterType;
    
    // Clear search box and reload with new filter
    const searchBox = document.getElementById('participantSearch');
    if (searchBox) {
        searchBox.value = '';
    }
    
    loadParticipants();
}

// Sort participants
function sortParticipants(sortType) {
    console.log('Setting participant sort to:', sortType);
    currentParticipantSort = sortType;
    
    // Apply sorting to current participants and re-render
    renderParticipants(sortParticipantsArray(allParticipantsData));
}

// Load departments and populate filter dropdown
function loadDepartmentsFilter() {
    const departmentSelect = document.getElementById('participantDepartmentFilter');
    if (!departmentSelect) {
        console.error('✗ participantDepartmentFilter not found');
        return;
    }
    
    fetch(`${API_BASE}/participants.php?action=get_departments`)
        .then(response => {
            console.log('✓ Departments API response:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            console.log('✓ Departments API raw response:', text);
            if (!text || text.trim() === '') {
                throw new Error('Empty response from departments API');
            }
            return JSON.parse(text);
        })
        .then(data => {
            if (data.success && data.data) {
                console.log('✓ Departments loaded:', data.data.length);
                
                // Preserve current selection
                const currentValue = departmentSelect.value;
                
                // Clear existing options (except "All Departments")
                const allOption = departmentSelect.querySelector('option[value="all"]');
                departmentSelect.innerHTML = '';
                if (allOption) {
                    departmentSelect.appendChild(allOption);
                } else {
                    const option = document.createElement('option');
                    option.value = 'all';
                    option.textContent = 'All Departments';
                    departmentSelect.appendChild(option);
                }
                
                // Add department options
                data.data.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.department_id;
                    option.textContent = dept.department_name;
                    departmentSelect.appendChild(option);
                });
                
                // Restore selection
                departmentSelect.value = currentValue;
            } else {
                console.error('✗ API returned error:', data.message);
            }
        })
        .catch(error => {
            console.error('✗ Error loading departments:', error);
        });
}

// Filter participants by department
function filterParticipantsByDepartment(departmentId) {
    console.log('Setting department filter to:', departmentId);
    currentDepartmentFilter = departmentId;
    
    // Clear search box
    const searchBox = document.getElementById('participantSearch');
    if (searchBox) {
        searchBox.value = '';
        hideParticipantSuggestions();
    }
    
    // Reload participants with new department filter
    const tbody = document.querySelector('#participantsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Loading participants...</td></tr>';
    
    // Build API URL with filters
    let apiUrl = `${API_BASE}/participants.php?action=list`;
    if (currentParticipantFilter !== 'all') {
        apiUrl += `&event_type=${currentParticipantFilter}`;
    }
    if (currentDepartmentFilter !== 'all') {
        apiUrl += `&department_id=${currentDepartmentFilter}`;
    }
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log('✓ Filtered participants received:', data.data?.length);
            if (data.success && data.data) {
                displayParticipants(data.data);
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No participants found</td></tr>';
            }
        })
        .catch(error => {
            console.error('✗ Error filtering participants:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color: #d32f2f;">Error loading participants</td></tr>';
        });
}
// ============ QR SCANNER ============
let qrScanner = null;

function initQRScannerPage() {
    console.log('Initializing QR Scanner page...');
    
    // Reset UI elements
    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    const resultElement = document.getElementById('qrScanResult');
    
    if (startBtn) startBtn.style.display = 'block';
    if (stopBtn) stopBtn.style.display = 'none';
    if (resultElement) {
        resultElement.innerHTML = '<p style="color: #999; text-align: center;">Waiting for QR code scan...</p>';
    }
    
    // Stop any running scanner when initializing
    if (qrScanner) {
        stopQRScanner();
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('❌ Please select an image file', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('❌ File too large. Maximum 5MB allowed.', 'error');
        return;
    }
    
    console.log('Processing uploaded image:', file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;
        
        // Show preview
        const preview = document.getElementById('uploadPreview');
        preview.innerHTML = `<img src="${imageData}" style="max-width: 100%; max-height: 200px; border-radius: 4px; margin-bottom: 10px;">
                             <p style="margin: 5px 0; font-size: 12px;">Scanning image...</p>`;
        
        // Stop live scanner if running
        if (qrScanner) {
            stopQRScanner();
        }
        
        // Decode QR from image
        if (typeof Html5Qrcode === 'undefined') {
            showNotification('❌ QR Scanner library not loaded', 'error');
            return;
        }
        
        Html5Qrcode.scanFile(imageData, true)
            .then(decodedText => {
                console.log('QR Code decoded from image:', decodedText);
                preview.innerHTML = `<p style="color: #27ae60; font-weight: bold;">✓ QR Code detected!</p>`;
                handleQRScan(decodedText);
            })
            .catch(error => {
                console.error('No QR code found in image:', error);
                preview.innerHTML = `<p style="color: #d32f2f; font-weight: bold;">❌ No QR code detected in image</p>
                                     <p style="font-size: 12px; margin-top: 5px;">Try a clearer image or use the live scanner</p>`;
                showNotification('❌ No QR code found in the image', 'error');
            });
    };
    reader.readAsDataURL(file);
}

function startQRScanner() {
    console.log('Starting QR Scanner...');
    
    const resultElement = document.getElementById('qrScanResult');
    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    
    // Hide start button, show stop button
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    
    // Clear previous result
    resultElement.innerHTML = '<p style="color: #999; text-align: center;">📷 Scanner active... Position QR code in frame</p>';
    
    // Check if Html5Qrcode is available
    if (typeof Html5Qrcode === 'undefined') {
        resultElement.innerHTML = '<p style="color: #d32f2f; text-align: center;">❌ QR Scanner library not loaded. Please refresh the page.</p>';
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        return;
    }
    
    try {
        qrScanner = new Html5Qrcode('qrReader');
        
        qrScanner.start(
            { facingMode: 'environment' }, // Use back camera
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                console.log('QR Code scanned:', decodedText);
                handleQRScan(decodedText);
            },
            (errorMessage) => {
                // Suppress error messages for better UX
                // console.log('QR Scan error:', errorMessage);
            }
        ).catch(error => {
            console.error('Scanner error:', error);
            resultElement.innerHTML = `<p style="color: #d32f2f; text-align: center;">❌ Camera error: ${error.message}</p>`;
            startBtn.style.display = 'block';
            stopBtn.style.display = 'none';
        });
    } catch (error) {
        console.error('Error starting scanner:', error);
        resultElement.innerHTML = `<p style="color: #d32f2f; text-align: center;">❌ Error: ${error.message}</p>`;
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    }
}

function stopQRScanner() {
    console.log('Stopping QR Scanner...');
    
    if (qrScanner) {
        qrScanner.stop().then(() => {
            qrScanner.clear();
            qrScanner = null;
            
            const startBtn = document.getElementById('startScanBtn');
            const stopBtn = document.getElementById('stopScanBtn');
            const resultElement = document.getElementById('qrScanResult');
            
            startBtn.style.display = 'block';
            stopBtn.style.display = 'none';
            resultElement.innerHTML = '<p style="color: #999; text-align: center;">Waiting for QR code scan...</p>';
        }).catch(error => {
            console.error('Error stopping scanner:', error);
        });
    }
}

function handleQRScan(decodedText) {
    console.log('════════════════════════════════════════');
    console.log('Processing scanned QR code:', decodedText);
    console.log('════════════════════════════════════════');
    
    const resultElement = document.getElementById('qrScanResult');
    
    // Extract registration code from QR data
    // QR data format: "Registration Code: REG-XXXXX"
    const cleanText = decodedText.trim().toUpperCase();
    const regCodeMatch = cleanText.match(/REG-[A-Z0-9]{12,}/);
    const registrationCode = regCodeMatch ? regCodeMatch[0] : null;
    
    console.log('Extracted registration code:', registrationCode);
    console.log('Full scanned text:', decodedText);
    console.log('Cleaned text:', cleanText);
    
    if (!registrationCode) {
        console.error('❌ Invalid QR Code - no registration code found');
        resultElement.innerHTML = `
            <div style="text-align: center; color: #d32f2f;">
                <p style="font-size: 18px; margin-bottom: 10px;">❌ Invalid QR Code</p>
                <p style="font-size: 14px;">This does not appear to be an event registration QR code.</p>
                <p style="font-size: 12px; color: #666; margin-top: 15px;">Scanned: ${decodedText}</p>
            </div>
        `;
        return;
    }
    
    // Look up registration using POST request to get_registration action
    console.log('Looking up registration code:', registrationCode);
    console.log('API Base:', API_BASE);
    console.log('Making POST request to:', API_BASE + '/participants.php');
    
    // Function to look up registration with retry logic
    function lookupRegistration(code, retries = 0) {
        fetch(`${API_BASE}/participants.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'get_registration',
                registration_code: code
            })
        })
            .then(response => {
                console.log('Response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Search result:', data);
                
                if (data.success && data.data) {
                    const participant = data.data;
                    console.log('✅ Registration found:', participant.full_name);
                
                // Display scan result
                resultElement.innerHTML = `
                    <div style="width: 100%; padding: 15px; text-align: left;">
                        <div style="border-left: 4px solid #27ae60; padding-left: 15px; margin-bottom: 20px;">
                            <p style="margin: 5px 0; color: #27ae60; font-weight: bold; font-size: 16px;">✓ Scan Successful</p>
                        </div>
                        
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                            <p style="margin: 8px 0;"><strong>Name:</strong> ${participant.full_name}</p>
                            <p style="margin: 8px 0;"><strong>Email:</strong> ${participant.email}</p>
                            <p style="margin: 8px 0;"><strong>Event:</strong> ${participant.event_name || 'N/A'}</p>
                            <p style="margin: 8px 0;"><strong>Registration Code:</strong> <span style="font-family: monospace; background: #e8e8e8; padding: 2px 6px; border-radius: 3px;">${registrationCode}</span></p>
                            <p style="margin: 8px 0;"><strong>Status:</strong> <span style="background: ${participant.status === 'ATTENDED' ? '#d4edda' : '#fff3cd'}; padding: 4px 8px; border-radius: 3px; font-weight: bold; color: ${participant.status === 'ATTENDED' ? '#155724' : '#856404'};">${participant.status}</span></p>
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-secondary" onclick="stopQRScanner(); setTimeout(() => startQRScanner(), 100);" style="flex: 1;">Scan Next</button>
                        </div>
                    </div>
                `;
                
                // AUTO-MARK ATTENDANCE if not already attended
                console.log('Checking participant status:', participant.status);
                if (participant.status !== 'ATTENDED') {
                    console.log('🔄 Auto-marking attendance for registered participant...');
                    setTimeout(() => {
                        markAttendance(`${registrationCode}`);
                    }, 300); // Small delay to ensure UI updates first
                } else {
                    console.log('⏭️ Participant already attended, skipping auto-mark');
                }
            } else if (!data.success && retries < 2) {
                    // Retry if code not found (might be a timing issue)
                    console.log('Retrying registration lookup... Attempt ' + (retries + 2) + ' of 3');
                    setTimeout(() => {
                        lookupRegistration(code, retries + 1);
                    }, 500); // Wait 500ms before retrying
                } else {
                    console.error('❌ Registration not found:', data.message);
                    resultElement.innerHTML = `
                        <div style="text-align: center; color: #d32f2f;">
                            <p style="font-size: 18px; margin-bottom: 10px;">❌ Registration Not Found</p>
                            <p style="font-size: 14px;">Registration code <strong>${code}</strong> not found in system.</p>
                            <p style="font-size: 12px; color: #666; margin-top: 10px;">${data.message || 'Please verify the QR code and try again.'}</p>
                            <button class="btn btn-secondary" onclick="stopQRScanner(); setTimeout(() => startQRScanner(), 100);" style="margin-top: 15px;">Scan Again</button>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('❌ Error looking up registration:', error);
                if (retries < 2) {
                    console.log('Retrying after error... Attempt ' + (retries + 2) + ' of 3');
                    setTimeout(() => {
                        lookupRegistration(code, retries + 1);
                    }, 500);
                } else {
                    resultElement.innerHTML = `<p style="color: #d32f2f; text-align: center;">❌ Error: ${error.message}</p>`;
                }
            });
    }
    
    // Start the lookup with retry capability
    lookupRegistration(registrationCode);
}

function markAttendance(registrationCode) {
    console.log('════════════════════════════════════════');
    console.log('✋ AUTO-MARKING ATTENDANCE for:', registrationCode);
    console.log('════════════════════════════════════════');
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            registration_code: registrationCode,
            status: 'ATTENDED'
        })
    })
    .then(response => {
        console.log('Attendance update response - Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Parsed response:', data);
        
        if (data.success) {
            console.log('✅✅✅ ATTENDANCE MARKED SUCCESSFULLY ✅✅✅');
            showNotification('✓ ' + (data.data?.full_name || 'Guest') + ' checked in!', 'success');
            
            // Update the status display in results
            const resultElement = document.getElementById('qrScanResult');
            if (resultElement) {
                // Add a green success banner above the content
                const successBanner = `<div style="background: #d4edda; border: 2px solid #28a745; border-radius: 4px; padding: 12px; margin-bottom: 15px; text-align: center; font-weight: bold; color: #155724;">✓ CHECKED IN SUCCESSFULLY</div>`;
                
                // Find the status paragraph and update it
                const statusRegex = /<p style="margin: 8px 0;"><strong>Status:<\/strong>.*?<\/p>/;
                let newHtml = resultElement.innerHTML.replace(
                    statusRegex,
                    '<p style="margin: 8px 0;"><strong>Status:</strong> <span style="background: #d4edda; padding: 4px 8px; border-radius: 3px; font-weight: bold; color: #155724;">ATTENDED</span></p>'
                );
                
                // Add success banner if not already present
                if (!newHtml.includes('CHECKED IN SUCCESSFULLY')) {
                    newHtml = successBanner + newHtml;
                }
                
                resultElement.innerHTML = newHtml;
            }
        } else {
            console.error('❌ Error:', data.message);
            showNotification('❌ ' + (data.message || 'Error marking attendance'), 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error marking attendance:', error);
        console.error('Error details:', error.message);
        showNotification('Error: ' + error.message, 'error');
    });
}

// ============ REPORTS ============
function loadReports() {
    fetch(`${API_BASE}/reports.php?action=event_summary`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                updateReportSummary(data.data);
            }
        })
        .catch(error => console.error('Error loading reports:', error));
}

function updateReportSummary(summary) {
    const container = document.getElementById('reportsSummary');
    if (container) {
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Total Events</div>
                <div class="stat-value">${summary.total_events || 0}</div>
                <div class="stat-meta">${summary.upcoming_events || 0} upcoming</div>
            </div>
            <div class="stat-card blue">
                <div class="stat-label">Total Registrations</div>
                <div class="stat-value">${summary.total_registrations || 0}</div>
                <div class="stat-meta">${summary.total_attended || 0} attended</div>
            </div>
            <div class="stat-card green">
                <div class="stat-label">Attendance Rate</div>
                <div class="stat-value">${summary.attendance_rate || 0}%</div>
            </div>
        `;
    }
}

// ============ UTILITIES ============
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

function copyToClipboard(text) {
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('✓ Copied to clipboard: ' + text, 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy to clipboard', 'error');
    });
}

function openCreateEventModal() {
    console.log('Opening create event modal');
    const modal = document.getElementById('createEventModal');
    if (modal) {
        // Reset form
        document.getElementById('createEventForm').reset();
        document.getElementById('createEventPrivateCode').value = '';
        document.getElementById('createPrivateEventSection').style.display = 'none';
        document.getElementById('eventDepartment').value = '';
        
        modal.style.display = 'block';
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
    console.log('Event object:', e);
    console.log('Event type:', e?.type);
    
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
        console.log('✓ preventDefault called');
    } else {
        console.log('⚠ preventDefault not available or not called');
    }
    
    console.log('✓ API_BASE:', API_BASE);
    
    const formEl = document.getElementById('createEventForm');
    console.log('✓ Form element found:', !!formEl);
    
    if (!formEl) {
        console.error('✗ ERROR: createEventForm not found!');
        showNotification('Form not found', 'error');
        return false;
    }
    
    // Validate and get required fields using form elements
    const eventName = document.getElementById('eventName')?.value?.trim();
    const capacity = document.getElementById('eventCapacity')?.value?.trim();
    const eventDate = document.getElementById('eventDate')?.value?.trim();
    const eventDepartment = document.getElementById('eventDepartment')?.value?.trim();
    
    console.log('Form data:');
    console.log('  Event Name:', eventName);
    console.log('  Capacity:', capacity);
    console.log('  Event Date:', eventDate);
    console.log('  Department:', eventDepartment);
    
    if (!eventName || !capacity || !eventDate || !eventDepartment) {
        console.error('✗ Required fields missing');
        showNotification('Please fill in all required fields (Name, Capacity, Date, Department)', 'error');
        return false;
    }
    
    // Validate capacity is a number
    if (isNaN(parseInt(capacity)) || parseInt(capacity) < 1) {
        console.error('✗ Invalid capacity');
        showNotification('Capacity must be a valid number greater than 0', 'error');
        return false;
    }
    
    // Validate date
    if (!eventDate || eventDate === '') {
        console.error('✗ Invalid date');
        showNotification('Please select a valid event date', 'error');
        return false;
    }
    
    const formData = new FormData(formEl);
    
    // Handle checkbox
    const isPrivateCheckbox = document.getElementById('eventPrivate');
    const isPrivate = isPrivateCheckbox && isPrivateCheckbox.checked ? 1 : 0;
    formData.set('is_private', isPrivate);
    
    // Add private code and department if event is private
    if (isPrivate) {
        const privateCode = document.getElementById('createEventPrivateCode').value;
        const department = document.getElementById('eventDepartment').value;
        formData.append('private_code', privateCode);
        formData.append('department', department);
        console.log('✓ Private code added:', privateCode);
        console.log('✓ Department added:', department);
    }
    
    console.log('✓ Checkbox set, is_private:', isPrivate);
    
    console.log('Complete form data:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value instanceof File ? value.name : value}`);
    }
    
    const url = `${API_BASE}/events.php`;
    console.log('✓ Sending POST request to:', url);
    
    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('✓ Response received:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('✓ API Response:', JSON.stringify(data));
        
        if (data.success) {
            console.log('✓ Event created successfully, ID:', data.event_id);
            logActivity('CREATE', `Created new event: ${eventName}`);
            
            closeCreateEventModal();
            console.log('✓ Modal closed');
            
            formEl.reset();
            console.log('✓ Form reset');
            
            loadEvents();
            console.log('✓ Events reloaded');
        } else {
            console.error('✗ API error:', data.message);
            showNotification(data.message || 'Error creating event', 'error');
        }
    })
    .catch(error => {
        console.error('✗ Fetch error:', error);
        showNotification('Error creating event: ' + error.message, 'error');
    });
    
    console.log('=== END CREATE EVENT ===');
    return false;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function logout() {
    // Show the logout confirmation modal instead of using confirm()
    document.getElementById('logoutConfirmModal').style.display = 'block';
}

function closeLogoutConfirmModal() {
    document.getElementById('logoutConfirmModal').style.display = 'none';
}

function confirmLogout() {
    const admin = JSON.parse(localStorage.getItem('admin') || 'null');
    
    // Log logout to admin_login_logs
    if (admin && admin.admin_id) {
        fetch(`${API_BASE}/admin_login.php?action=logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: admin.admin_id })
        }).catch(error => console.log('Logout logged'));
    }
    
    // Log activity BEFORE clearing localStorage so we have admin/user data
    logActivity('LOGOUT', 'Admin logged out');
    
    // Clear all user/admin data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    localStorage.removeItem('rememberAdmin');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

function openEditEventModal(eventId) {
    console.log('=== OPEN EDIT EVENT MODAL ===');
    console.log('Event ID:', eventId);
    
    // Fetch event details
    fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`)
        .then(response => {
            console.log('✓ Event detail response:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('✓ Event data received:', data.data?.event_name);
            
            if (data.success) {
                const event = data.data;
                
                // Populate edit form
                document.getElementById('editEventId').value = event.event_id;
                document.getElementById('editEventName').value = event.event_name;
                document.getElementById('editEventCapacity').value = event.capacity;
                document.getElementById('editEventDate').value = event.event_date;
                document.getElementById('editEventStartTime').value = event.start_time || '';
                document.getElementById('editEventEndTime').value = event.end_time || '';
                document.getElementById('editEventLocation').value = event.location || '';
                document.getElementById('editEventDepartment').value = event.department || '';
                document.getElementById('editEventDescription').value = event.description || '';
                document.getElementById('editEventPrivate').checked = event.is_private == 1;
                
                // Display private code if event is private
                if (event.is_private == 1 && event.private_code) {
                    document.getElementById('editEventPrivateCode').value = event.private_code;
                    document.getElementById('editPrivateCodeSection').style.display = 'block';
                    console.log('✓ Private code displayed:', event.private_code);
                } else {
                    document.getElementById('editEventPrivateCode').value = '';
                    document.getElementById('editPrivateCodeSection').style.display = 'none';
                }
                
                // Reset file input
                document.getElementById('editEventImage').value = '';
                
                // Display current image
                const currentImageDiv = document.getElementById('editCurrentImage');
                const currentImageUrl = getImageUrl(event.image_url);
                if (currentImageUrl) {
                    currentImageDiv.innerHTML = `
                        <div style="padding: 10px; background: #f0f0f0; border-radius: 4px;">
                            <p style="margin: 0 0 8px 0; font-weight: bold;">Current Image:</p>
                            <img src="${currentImageUrl}" alt="${event.event_name}" style="max-width: 100%; max-height: 150px; border-radius: 4px;">
                        </div>
                    `;
                    console.log('✓ Current image displayed');
                } else {
                    currentImageDiv.innerHTML = '<p style="color: #999; font-size: 12px;">No image selected</p>';
                    console.log('ℹ No current image');
                }
                
                // Open modal
                document.getElementById('editEventModal').style.display = 'block';
                console.log('✓ Edit modal opened');
            } else {
                console.error('✗ API error:', data.message);
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
        console.log('✓ preventDefault called');
    }
    
    const eventId = document.getElementById('editEventId').value;
    const eventName = document.getElementById('editEventName').value;
    const capacity = document.getElementById('editEventCapacity').value;
    const eventDate = document.getElementById('editEventDate').value;
    
    console.log('Event ID:', eventId);
    console.log('Event Name:', eventName);
    
    // Validate required fields
    if (!eventName || !capacity || !eventDate) {
        console.error('✗ Required fields missing');
        showNotification('Please fill in all required fields', 'error');
        return false;
    }
    
    // Create FormData for multipart support (file upload)
    const formData = new FormData();
    formData.append('event_id', eventId);
    formData.append('event_name', eventName);
    formData.append('capacity', capacity);
    formData.append('event_date', eventDate);
    formData.append('start_time', document.getElementById('editEventStartTime').value || '');
    formData.append('end_time', document.getElementById('editEventEndTime').value || '');
    formData.append('location', document.getElementById('editEventLocation').value || '');
    formData.append('department', document.getElementById('editEventDepartment').value || '');
    formData.append('description', document.getElementById('editEventDescription').value || '');
    const isPrivate = document.getElementById('editEventPrivate').checked ? 1 : 0;
    formData.append('is_private', isPrivate);
    
    // Add or keep private code
    const privateCode = document.getElementById('editEventPrivateCode').value;
    if (isPrivate) {
        formData.append('private_code', privateCode);
        console.log('✓ Private code added:', privateCode);
    }
    
    // Add image if selected
    const imageFile = document.getElementById('editEventImage').files[0];
    if (imageFile) {
        console.log('✓ New image selected:', imageFile.name);
        formData.append('image', imageFile);
    } else {
        console.log('ℹ No new image selected, keeping existing image');
    }
    
    console.log('Sending PUT request to update event...');
    
    fetch(`${API_BASE}/events.php`, {
        method: 'PUT',
        body: formData
    })
    .then(response => {
        console.log('✓ Update response received:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('✓ API Response:', JSON.stringify(data));
        
        if (data.success) {
            console.log('✓ Event updated successfully');
            logActivity('UPDATE', `Updated event: ${eventName}`);
            closeEditEventModal();
            loadEvents();
        } else {
            console.error('✗ API error:', data.message);
            showNotification(data.message || 'Error updating event', 'error');
        }
    })
    .catch(error => {
        console.error('✗ Fetch error:', error);
        showNotification('Error updating event: ' + error.message, 'error');
    });
    
    console.log('=== END UPDATE EVENT ===');
    return false;
}

function deleteEvent(eventId, eventName) {
    console.log('=== DELETE EVENT CALLED ===');
    console.log('Raw eventId received:', eventId, 'type:', typeof eventId);
    console.log('Raw eventName received:', eventName, 'type:', typeof eventName);
    
    // Ensure eventId is a number
    const numericEventId = parseInt(eventId, 10);
    console.log('Parsed eventId:', numericEventId, 'type:', typeof numericEventId);
    console.log('Is valid number?', !isNaN(numericEventId) && numericEventId > 0);
    
    if (!numericEventId || isNaN(numericEventId)) {
        console.error('ERROR: Invalid event ID!');
        showNotification('Invalid event ID', 'error');
        return false;
    }

    // Use custom confirmation modal instead of browser confirm
    showConfirmation(
        'Delete Event?',
        `Are you sure you want to delete "${eventName}"? This action cannot be undone.`,
        'Delete',
        function() {
            performDeleteEvent(numericEventId, eventName);
        }
    );
    
    return false;
}

function performDeleteEvent(numericEventId, eventName) {
    console.log('Delete confirmed, sending request with event_id:', numericEventId);
    
    // Create request body
    const requestData = {
        event_id: numericEventId
    };
    console.log('Request body:', JSON.stringify(requestData));
    
    // Send as JSON
    fetch(`${API_BASE}/events.php`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('✓ Delete response received:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('✓ API Response:', JSON.stringify(data));
        
        if (data.success) {
            console.log('✓ Event deleted successfully');
            logActivity('DELETE', `Deleted event: ${eventName}`);
            loadEvents();
        } else {
            console.error('✗ Delete error:', data.message);
            showNotification(data.message || 'Error deleting event', 'error');
        }
    })
    .catch(error => {
        console.error('✗ Fetch error:', error);
        showNotification('Error deleting event: ' + error.message, 'error');
    });
    
    console.log('=== END DELETE EVENT ===');
    return false;
}

// ============ ADMIN USERS MANAGEMENT ============
function loadAdmins() {
    console.log('✓ loadAdmins() called');
    const table = document.getElementById('adminsTable');
    if (!table) return;
    
    table.querySelector('tbody').innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    
    fetch(`${API_BASE}/admins.php?action=list`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            try {
                const data = JSON.parse(text);
                if (data.success && data.data) {
                    displayAdminsList(data.data);
                } else if (data.error) {
                    throw new Error(data.message || 'API Error');
                } else {
                    table.querySelector('tbody').innerHTML = '<tr><td colspan="5" class="text-center">No admins found</td></tr>';
                }
            } catch (e) {
                console.error('JSON Parse error:', e);
                console.error('Response text:', text);
                showNotification('Database tables not initialized. Please run setup-admin-db.html first.', 'warning');
                table.querySelector('tbody').innerHTML = '<tr><td colspan="5" class="text-center">Please initialize admin tables first</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error loading admins:', error);
            showNotification('Error: ' + error.message, 'error');
            table.querySelector('tbody').innerHTML = '<tr><td colspan="5" class="text-center">Error loading admins: ' + error.message + '</td></tr>';
        });
    
    // Setup admin search with suggestions
    const adminSearchBox = document.getElementById('adminSearch');
    if (adminSearchBox) {
        let searchTimeout;
        adminSearchBox.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            if (query.length > 0) {
                searchTimeout = setTimeout(() => {
                    displayAdminSuggestions(query);
                }, 300);
            } else if (query.length === 0) {
                clearTimeout(searchTimeout);
                hideAdminSuggestions();
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== adminSearchBox) {
                hideAdminSuggestions();
            }
        });
    }
}

function displayAdminsList(admins) {
    const tbody = document.getElementById('adminsTable').querySelector('tbody');
    
    // Store all admins data for search/filter/sort
    allAdminsData = admins || [];
    adminsFilteredData = admins || [];
    adminsCurrentPage = 1; // Reset to first page
    adminsTotalPages = Math.ceil(admins.length / adminsPerPage);
    
    if (admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No admins found</td></tr>';
        updateAdminsPaginationControls();
        return;
    }
    
    // Display current page
    displayAdminsPage();
    updateAdminsPaginationControls();
}

function displayAdminsPage() {
    const tbody = document.getElementById('adminsTable').querySelector('tbody');
    if (!tbody) return;
    
    const startIndex = (adminsCurrentPage - 1) * adminsPerPage;
    const endIndex = startIndex + adminsPerPage;
    const pageData = adminsFilteredData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No admins found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    pageData.forEach(admin => {
        const row = document.createElement('tr');
        const createdDate = new Date(admin.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Determine status badge color
        let statusBadgeClass = 'badge-attended'; // default for active
        if (admin.status === 'inactive') {
            statusBadgeClass = 'badge-no-show'; // orange/warning
        } else if (admin.status === 'archived') {
            statusBadgeClass = 'badge-cancelled'; // red
        }
        
        // Escape single quotes in names for use in onclick handlers
        const escapedFullName = admin.full_name.replace(/'/g, "\\'");
        const escapedEmail = admin.email.replace(/'/g, "\\'");
        
        // Create profile image cell
        let profileImageHtml = '<td style="padding: 8px; text-align: center;"><div style="width: 45px; height: 45px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin: 0 auto; overflow: hidden; border: 2px solid #e0e0e0;">';
        if (admin.admin_image) {
            profileImageHtml += `<img src="${admin.admin_image}" style="width: 100%; height: 100%; object-fit: cover;" alt="${admin.full_name}">`;
        } else {
            // Placeholder with initials
            const initials = admin.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            profileImageHtml += `<div style="font-weight: 700; font-size: 16px; color: #666;">${initials}</div>`;
        }
        profileImageHtml += '</div></td>';
        
        // Determine action button based on status
        let actionButton = '';
        if (admin.status === 'inactive') {
            actionButton = `<button class="btn btn-small" style="background: linear-gradient(90deg, #630909 0%, #950B08 27%, #F43535 56%, #F43535 56%); color: white; min-width: 95px;" onclick="activateAdmin(${admin.user_id}, '${escapedFullName}')">Activate</button>`;
        } else if (admin.status === 'active') {
            actionButton = `<button class="btn btn-small" style="background: linear-gradient(90deg, #630909 0%, #950B08 27%, #F43535 56%, #F43535 56%); color: white; min-width: 95px;" onclick="deactivateAdmin(${admin.user_id}, '${escapedFullName}')">Deactivate</button>`;
        } else if (admin.status === 'archived') {
            actionButton = ''; // No action button for archived accounts
        }
        
        row.innerHTML = `${profileImageHtml}
            <td>${admin.full_name || 'N/A'}</td>
            <td>${admin.email}</td>
            <td><span class="status-badge ${statusBadgeClass}">${admin.status}</span></td>
            <td>${createdDate}</td>
            <td style="display: flex; gap: 10px; align-items: center;">
                <button class="btn btn-small" style="background: white; color: #C41E3A; border: 1px solid #C41E3A; min-width: 95px;" onclick="openEditAdminModalById(${admin.user_id})">Edit</button>
                ${actionButton}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateAdminsPaginationControls() {
    const totalRecords = adminsFilteredData.length;
    
    // Update pagination info total
    const totalElement = document.getElementById('adminsPaginationTotal');
    if (totalElement) {
        totalElement.textContent = totalRecords;
    }
    
    // Update Previous button
    const prevBtn = document.getElementById('adminsPrevBtn');
    if (prevBtn) {
        prevBtn.disabled = adminsCurrentPage === 1;
    }
    
    // Update Next button
    const nextBtn = document.getElementById('adminsNextBtn');
    if (nextBtn) {
        nextBtn.disabled = adminsCurrentPage >= adminsTotalPages;
    }
    
    // Update page numbers
    const pageNumbersDiv = document.getElementById('adminsPageNumbers');
    if (pageNumbersDiv) {
        let pageNumbersHtml = '';
        const maxPagesToShow = 5;
        let startPage = Math.max(1, adminsCurrentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(adminsTotalPages, startPage + maxPagesToShow - 1);
        
        // Adjust start page if too close to end
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            pageNumbersHtml += `<button class="page-btn" onclick="goToAdminsPage(1)">1</button>`;
            if (startPage > 2) {
                pageNumbersHtml += `<span style="color: #999; padding: 0 4px;">...</span>`;
            }
        }
        
        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === adminsCurrentPage ? 'active' : '';
            pageNumbersHtml += `<button class="page-btn ${activeClass}" onclick="goToAdminsPage(${i})">${i}</button>`;
        }
        
        // Add last page and ellipsis if needed
        if (endPage < adminsTotalPages) {
            if (endPage < adminsTotalPages - 1) {
                pageNumbersHtml += `<span style="color: #999; padding: 0 4px;">...</span>`;
            }
            pageNumbersHtml += `<button class="page-btn" onclick="goToAdminsPage(${adminsTotalPages})">${adminsTotalPages}</button>`;
        }
        
        pageNumbersDiv.innerHTML = pageNumbersHtml;
    }
}

function adminsNextPage() {
    if (adminsCurrentPage < adminsTotalPages) {
        adminsCurrentPage++;
        displayAdminsPage();
        updateAdminsPaginationControls();
        // Scroll to top of table
        document.querySelector('.table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function adminsPreviousPage() {
    if (adminsCurrentPage > 1) {
        adminsCurrentPage--;
        displayAdminsPage();
        updateAdminsPaginationControls();
        // Scroll to top of table
        document.querySelector('.table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function goToAdminsPage(pageNum) {
    if (pageNum >= 1 && pageNum <= adminsTotalPages) {
        adminsCurrentPage = pageNum;
        displayAdminsPage();
        updateAdminsPaginationControls();
        // Scroll to top of table
        document.querySelector('.table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function changeAdminsRowsPerPage(newValue) {
    const rowsPerPage = parseInt(newValue);
    if (rowsPerPage > 0) {
        adminsPerPage = rowsPerPage;
        adminsCurrentPage = 1; // Reset to first page
        adminsTotalPages = Math.ceil(adminsFilteredData.length / adminsPerPage);
        displayAdminsPage();
        updateAdminsPaginationControls();
        // Scroll to top of table
        document.querySelector('.table-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function displayAdminSuggestions(query) {
    const suggestionsContainer = document.getElementById('adminSearchSuggestions');
    if (!suggestionsContainer) return;
    
    // Filter admins that match the query
    const matches = allAdminsData.filter(admin => {
        return admin.full_name.toLowerCase().includes(query) ||
            (admin.email && admin.email.toLowerCase().includes(query));
    }).slice(0, 5); // Limit to 5 suggestions
    
    if (matches.length === 0) {
        suggestionsContainer.innerHTML = '<div style="padding: 15px; color: #999; text-align: center;">No admins found</div>';
        suggestionsContainer.style.display = 'block';
        return;
    }
    
    suggestionsContainer.innerHTML = matches.map(admin => {
        const createdDate = new Date(admin.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const statusColor = admin.status === 'active' ? '#4caf50' : admin.status === 'inactive' ? '#ff9800' : '#f44336';
        return `
            <div class="search-suggestion-item" onclick="selectAdminSuggestion('${admin.full_name}')">
                <div class="search-suggestion-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>
                <div class="search-suggestion-text">
                    <div class="search-suggestion-name">${escapeHtml(admin.full_name)}</div>
                    <div class="search-suggestion-date">${escapeHtml(admin.email)} • <span style="color: ${statusColor}; font-weight: 600;">${admin.status}</span></div>
                </div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.style.display = 'block';
}

function hideAdminSuggestions() {
    const suggestionsContainer = document.getElementById('adminSearchSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectAdminSuggestion(adminName) {
    const searchBox = document.getElementById('adminSearch');
    if (searchBox) {
        searchBox.value = adminName;
        hideAdminSuggestions();
        // Filter the table to show matching admins
        filterAdminsByName(adminName.toLowerCase());
    }
}

function filterAdminsByName(query) {
    adminsFilteredData = allAdminsData.filter(admin => 
        admin.full_name.toLowerCase().includes(query) ||
        (admin.email && admin.email.toLowerCase().includes(query))
    );
    
    // Reset to first page and recalculate pagination
    adminsCurrentPage = 1;
    adminsTotalPages = Math.ceil(adminsFilteredData.length / adminsPerPage);
    displayAdminsPage();
    updateAdminsPaginationControls();
}

function setupAdminSearch() {
    const searchBox = document.getElementById('adminSearch');
    if (!searchBox) return;
    
    // Clear search when needed
    searchBox.addEventListener('keyup', function(e) {
        if (this.value.trim() === '') {
            loadAdmins();
        }
    });
}

function openCreateAdminModal() {
    document.getElementById('createAdminModal').style.display = 'block';
    document.getElementById('createAdminForm').reset();
    document.getElementById('adminImagePreview').style.borderColor = '#e0e0e0';
    document.getElementById('clearAdminImageBtn').style.display = 'none';
    // Reset the image upload input
    const imageInput = document.getElementById('adminImageUpload');
    if (imageInput) imageInput.value = '';
}

function closeCreateAdminModal() {
    document.getElementById('createAdminModal').style.display = 'none';
}

// New function to open edit modal by ID - retrieves data from allAdminsData
function openEditAdminModalById(userId) {
    // Find the admin in allAdminsData
    const admin = allAdminsData.find(a => a.user_id == userId);
    
    if (!admin) {
        showNotification('Admin not found', 'error');
        return;
    }
    
    // Call the original openEditAdminModal with the data
    openEditAdminModal(
        admin.user_id, 
        admin.full_name, 
        admin.email, 
        admin.status,
        admin.admin_image || ''
    );
}

function openEditAdminModal(userId, fullName, email, status = 'active', adminImage = '') {
    document.getElementById('editAdminId').value = userId;
    document.getElementById('editAdminFullName').value = fullName;
    document.getElementById('editAdminEmail').value = email;
    document.getElementById('editAdminStatus').value = status;
    document.getElementById('editAdminPassword').type = 'text';
    document.getElementById('editAdminPassword').value = '••••••••';
    document.getElementById('togglePasswordBtn').textContent = '🙈';
    document.getElementById('editAdminModal').style.display = 'block';
    
    // Load existing image if available
    const imagePreviewImg = document.getElementById('editAdminImagePreviewImg');
    const imagePlaceholder = document.getElementById('editAdminImagePlaceholder');
    const clearBtn = document.getElementById('clearEditAdminImageBtn');
    const imageInput = document.getElementById('editAdminImageUpload');
    if (imageInput) imageInput.value = '';
    
    if (adminImage && adminImage.trim() !== '') {
        imagePreviewImg.src = adminImage;
        imagePreviewImg.style.display = 'block';
        imagePlaceholder.style.display = 'none';
        clearBtn.style.display = 'block';
    } else {
        imagePreviewImg.style.display = 'none';
        imagePlaceholder.style.display = 'flex';
        clearBtn.style.display = 'none';
    }
    
    // Show/hide deactivate button based on status
    const deactivateBtn = document.getElementById('deactivateBtn');
    if (status === 'active') {
        deactivateBtn.textContent = 'Deactivate';
        deactivateBtn.style.display = 'block';
    } else if (status === 'inactive') {
        deactivateBtn.textContent = 'Activate';
        deactivateBtn.style.display = 'block';
    } else {
        deactivateBtn.style.display = 'none';
    }
}

function toggleCreatePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const eyeIcon = document.getElementById('createPasswordEyeIcon');
    
    if (!passwordInput) {
        console.error('Password input not found');
        return;
    }
    
    if (passwordInput.type === 'password') {
        // Show password - change to Hide icon (eye-with-slash)
        passwordInput.type = 'text';
        eyeIcon.innerHTML = '<path fill="currentColor" d="M11.83 9L15 12.16V12a3 3 0 0 0-3-3zm-4.3.8l1.55 1.55c-.05.21-.08.42-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28l.45.45C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5c1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22L21 20.73L3.27 3M12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75c-1.73-4.39-6-7.5-11-7.5c-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7"/>';
    } else {
        // Hide password - change to Unhide icon (open eye)
        passwordInput.type = 'password';
        eyeIcon.innerHTML = '<path fill="currentColor" d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"/>';
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('editAdminPassword');
    const eyeIcon = document.getElementById('editPasswordEyeIcon');
    
    if (!passwordInput) {
        console.error('Password input not found');
        return;
    }
    
    if (passwordInput.type === 'password') {
        // Show password - change to Hide icon (eye-with-slash)
        passwordInput.type = 'text';
        eyeIcon.innerHTML = '<path fill="currentColor" d="M11.83 9L15 12.16V12a3 3 0 0 0-3-3zm-4.3.8l1.55 1.55c-.05.21-.08.42-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28l.45.45C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5c1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22L21 20.73L3.27 3M12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75c-1.73-4.39-6-7.5-11-7.5c-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7"/>';
    } else {
        // Hide password - change to Unhide icon (open eye)
        passwordInput.type = 'password';
        eyeIcon.innerHTML = '<path fill="currentColor" d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"/>';
    }
}

// Image preview functions for Create Admin modal
function previewAdminImage(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('adminImagePreview');
            preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
            preview.style.borderColor = '#4CAF50';
            document.getElementById('clearAdminImageBtn').style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        showNotification('Please select a valid image file', 'error');
    }
}

function clearAdminImage() {
    const preview = document.getElementById('adminImagePreview');
    preview.innerHTML = `<div style="text-align: center; color: #999;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style="stroke: currentColor; stroke-width: 1.5; margin: 0 auto 8px;">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L3 21"/>
        </svg>
        <p style="margin: 0; font-size: 12px;">Click to upload</p>
    </div>`;
    preview.style.borderColor = '#e0e0e0';
    document.getElementById('clearAdminImageBtn').style.display = 'none';
    document.getElementById('adminImageUpload').value = '';
}

// Image preview functions for Edit Admin modal
function previewEditAdminImage(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imagePreviewImg = document.getElementById('editAdminImagePreviewImg');
            const imagePlaceholder = document.getElementById('editAdminImagePlaceholder');
            imagePreviewImg.src = e.target.result;
            imagePreviewImg.style.display = 'block';
            imagePlaceholder.style.display = 'none';
            document.getElementById('clearEditAdminImageBtn').style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        showNotification('Please select a valid image file', 'error');
    }
}

function clearEditAdminImage() {
    const imagePreviewImg = document.getElementById('editAdminImagePreviewImg');
    const imagePlaceholder = document.getElementById('editAdminImagePlaceholder');
    imagePreviewImg.style.display = 'none';
    imagePlaceholder.style.display = 'flex';
    document.getElementById('clearEditAdminImageBtn').style.display = 'none';
    document.getElementById('editAdminImageUpload').value = '';
}

function closeEditAdminModal() {
    document.getElementById('editAdminModal').style.display = 'none';
}

function deactivateAdminFromModal() {
    const userId = parseInt(document.getElementById('editAdminId').value);
    const fullName = document.getElementById('editAdminFullName').value;
    const currentStatus = document.getElementById('editAdminStatus').value;
    
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    const message = currentStatus === 'active' 
        ? `Are you sure you want to deactivate ${fullName}'s account? They won't be able to login.`
        : `Are you sure you want to activate ${fullName}'s account? They will be able to login again.`;
    
    if (!confirm(message)) return;
    
    fetch(`${API_BASE}/admins.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            admin_id: userId,
            action_type: action
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const actionText = action === 'deactivate' ? 'Deactivated' : 'Activated';
            logActivity('UPDATE', `${actionText} admin account: ${fullName}`);
            showNotification(`Admin account ${action}d successfully!`, 'success');
            closeEditAdminModal();
            loadAdmins();
        } else {
            showNotification(data.message || `Error ${action}ing admin`, 'error');
        }
    })
    .catch(error => {
        showNotification('Error: ' + error.message, 'error');
    });
}

// Submit functions for admin forms
function submitCreateAdmin(formData, adminImage) {
    // Get current admin from localStorage
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const admin_id = admin.admin_id || admin.id || 0;
    
    const submitData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        creator_admin_id: admin_id  // Pass creator admin ID in body
    };
    
    if (adminImage) {
        submitData.admin_image = adminImage;
    }
    
    fetch(`${API_BASE}/admins.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const fullName = formData.get('full_name');
            const email = formData.get('email');
            logActivity('CREATE', `Created new admin account: ${fullName} (${email})`);
            showNotification('Admin created successfully!', 'success');
            closeCreateAdminModal();
            loadAdmins();
        } else {
            showNotification(data.message || 'Error creating admin', 'error');
        }
    })
    .catch(error => {
        showNotification('Error: ' + error.message, 'error');
    });
}

function submitEditAdmin(userId, formData, adminImage) {
    const password = formData.get('password');
    
    const updateData = {
        admin_id: parseInt(userId),
        action_type: 'update',
        full_name: formData.get('full_name'),
        email: formData.get('email')
    };
    
    // Only include password if it's not empty and not the masked placeholder
    if (password && password.trim().length > 0 && password !== '••••••••') {
        updateData.new_password = password;
    }
    
    if (adminImage) {
        updateData.admin_image = adminImage;
    }
    
    fetch(`${API_BASE}/admins.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const fullName = formData.get('full_name');
            const email = formData.get('email');
            logActivity('UPDATE', `Updated admin account: ${fullName} (${email})`);
            showNotification('Admin updated successfully!', 'success');
            closeEditAdminModal();
            loadAdmins();
        } else {
            showNotification(data.message || 'Error updating admin', 'error');
        }
    })
    .catch(error => {
        showNotification('Error: ' + error.message, 'error');
    });
}

// Setup modal backdrop click handlers
document.addEventListener('DOMContentLoaded', function() {
    // Close modals when clicking on backdrop
    const modals = ['createAdminModal', 'editAdminModal', 'deactivatedAccountsModal', 'archivedAccountsModal', 'logoutConfirmModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', function(event) {
                if (event.target === this) {
                    this.style.display = 'none';
                }
            });
        }
    });
    
    const createForm = document.getElementById('createAdminForm');
    if (createForm) {
        createForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const imageInput = document.getElementById('adminImageUpload');
            
            let adminImage = null;
            if (imageInput && imageInput.files.length > 0) {
                const file = imageInput.files[0];
                const reader = new FileReader();
                reader.onload = function(event) {
                    adminImage = event.target.result;
                    submitCreateAdmin(formData, adminImage);
                };
                reader.readAsDataURL(file);
            } else {
                submitCreateAdmin(formData, adminImage);
            }
        });
    }
    
    const editForm = document.getElementById('editAdminForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const userId = document.getElementById('editAdminId').value;
            const formData = new FormData(this);
            const imageInput = document.getElementById('editAdminImageUpload');
            
            let adminImage = null;
            if (imageInput && imageInput.files.length > 0) {
                const file = imageInput.files[0];
                const reader = new FileReader();
                reader.onload = function(event) {
                    adminImage = event.target.result;
                    submitEditAdmin(userId, formData, adminImage);
                };
                reader.readAsDataURL(file);
            } else {
                submitEditAdmin(userId, formData, adminImage);
            }
        });
    }
});

function deleteAdmin(userId) {
    showConfirmation(
        'Delete Admin?',
        'Are you sure you want to delete this admin? This action cannot be undone.',
        'Delete',
        function() {
            performDeleteAdmin(userId);
        }
    );
}

function performDeleteAdmin(userId) {
    fetch(`${API_BASE}/admins.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            logActivity('DELETE', `Deleted admin account (ID: ${userId})`);
            showNotification('Admin deleted successfully!', 'success');
            loadAdmins();
        } else {
            showNotification(data.message || 'Error deleting admin', 'error');
        }
    })
    .catch(error => {
        showNotification('Error: ' + error.message, 'error');
    });
}

function deactivateAdmin(userId, fullName) {
    showConfirmation(
        'Deactivate Admin?',
        `Are you sure you want to deactivate ${fullName}'s account? They won't be able to login.`,
        'Deactivate',
        function() {
            performDeactivateAdmin(userId, fullName);
        }
    );
}

function performDeactivateAdmin(userId, fullName) {
    fetch(`${API_BASE}/admins.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            action_type: 'deactivate'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            logActivity('UPDATE', `Deactivated admin account: ${fullName}`);
            showNotification('Admin account deactivated successfully!', 'success');
            loadAdmins();
        } else {
            showNotification(data.message || 'Error deactivating admin', 'error');
        }
    })
    .catch(error => {
        showNotification('Error: ' + error.message, 'error');
    });
}

function activateAdmin(userId, fullName) {
    showConfirmation(
        'Activate Admin?',
        `Are you sure you want to activate ${fullName}'s account? They will be able to login again.`,
        'Activate',
        function() {
            performActivateAdmin(userId, fullName);
        }
    );
}

function performActivateAdmin(userId, fullName) {
    fetch(`${API_BASE}/admins.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            action_type: 'activate'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            logActivity('UPDATE', `Activated admin account: ${fullName}`);
            showNotification('Admin account activated successfully!', 'success');
            loadAdmins();
        } else {
            showNotification(data.message || 'Error activating admin', 'error');
        }
    })
    .catch(error => {
        showNotification('Error: ' + error.message, 'error');
    });
}

function openArchiveAdminModal(userId, fullName) {
    document.getElementById('archiveAdminId').value = userId;
    document.getElementById('archiveAdminName').textContent = fullName;
    document.getElementById('archiveAdminModal').style.display = 'block';
    document.getElementById('archiveReasonText').value = '';
}

function closeArchiveAdminModal() {
    document.getElementById('archiveAdminModal').style.display = 'none';
}

function openArchivedAccountsModal() {
    document.getElementById('archivedAccountsModal').style.display = 'block';
    
    // Fetch all archived accounts
    fetch(`${API_BASE}/admins.php?action=list`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const archivedAccounts = data.data.filter(admin => admin.status === 'archived');
                displayArchivedAccounts(archivedAccounts);
            } else {
                showNotification('Error loading archived accounts', 'error');
            }
        })
        .catch(error => {
            showNotification('Error: ' + error.message, 'error');
        });
}

function closeArchivedAccountsModal() {
    document.getElementById('archivedAccountsModal').style.display = 'none';
}

function displayArchivedAccounts(accounts) {
    const tbody = document.getElementById('archivedAccountsBody');
    tbody.innerHTML = '';
    
    if (accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 40px; color: #999;">No archived accounts</td></tr>';
        return;
    }
    
    accounts.forEach(account => {
        const archivedDate = new Date(account.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const row = document.createElement('tr');
        const escapedFullName = account.full_name.replace(/'/g, "\\'");
        row.innerHTML = `
            <td>${account.full_name || 'N/A'}</td>
            <td>${account.email}</td>
            <td>${archivedDate}</td>
            <td>
                <button class="btn btn-small" style="background: #28a745; color: white;" onclick="restoreFromArchivedList(${account.user_id}, '${escapedFullName}')">Restore</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function restoreFromArchivedList(userId, fullName) {
    if (!confirm(`Are you sure you want to restore ${fullName}'s account from archive?`)) return;
    
    fetch(`${API_BASE}/admins.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            action_type: 'activate'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            logActivity('UPDATE', `Restored admin account from archive: ${fullName}`);
            showNotification('Admin account restored successfully!', 'success');
            openArchivedAccountsModal(); // Refresh the modal
            loadAdmins(); // Refresh the main admin list
        } else {
            showNotification(data.message || 'Error restoring admin', 'error');
        }
    })
    .catch(error => {
        showNotification('Error: ' + error.message, 'error');
    });
}

function openDeactivatedAccountsModal() {
    document.getElementById('deactivatedAccountsModal').style.display = 'block';
    
    // Fetch all deactivated (inactive) accounts
    fetch(`${API_BASE}/admins.php?action=list`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const deactivatedAccounts = data.data.filter(admin => admin.status === 'inactive');
                displayDeactivatedAccounts(deactivatedAccounts);
            } else {
                showNotification('Error loading deactivated accounts', 'error');
            }
        })
        .catch(error => {
            showNotification('Error: ' + error.message, 'error');
        });
}

function closeDeactivatedAccountsModal() {
    document.getElementById('deactivatedAccountsModal').style.display = 'none';
}

function displayDeactivatedAccounts(accounts) {
    const tbody = document.getElementById('deactivatedAccountsBody');
    tbody.innerHTML = '';
    
    if (accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 40px; color: #999;">No deactivated accounts</td></tr>';
        return;
    }
    
    accounts.forEach(account => {
        const deactivatedDate = new Date(account.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const row = document.createElement('tr');
        const escapedFullName = account.full_name.replace(/'/g, "\\'");
        row.innerHTML = `
            <td>${account.full_name || 'N/A'}</td>
            <td>${account.email}</td>
            <td>${deactivatedDate}</td>
            <td>
                <button class="btn btn-small" style="background: #28a745; color: white;" onclick="activateFromDeactivatedList(${account.user_id}, '${escapedFullName}')">Activate</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function activateFromDeactivatedList(userId, fullName) {
    showConfirmation(
        'Activate Admin?',
        `Are you sure you want to activate ${fullName}'s account? They will be able to login again.`,
        'Activate',
        function() {
            performActivateFromDeactivatedList(userId, fullName);
        }
    );
}

function performActivateFromDeactivatedList(userId, fullName) {
    fetch(`${API_BASE}/admins.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            action_type: 'activate'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            logActivity('UPDATE', `Activated admin account: ${fullName}`);
            showNotification('Admin account activated successfully!', 'success');
            openDeactivatedAccountsModal(); // Refresh the modal
            loadAdmins(); // Refresh the main admin list
        } else {
            showNotification(data.message || 'Error activating admin', 'error');
        }
    })
    .catch(error => {
        showNotification('Error: ' + error.message, 'error');
    });
}

function sortAdmins(sortValue) {
    let sorted = [...adminsFilteredData];
    
    if (sortValue === 'name-asc') {
        sorted.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    } else if (sortValue === 'name-desc') {
        sorted.sort((a, b) => (b.full_name || '').localeCompare(a.full_name || ''));
    } else if (sortValue === 'newest') {
        sorted.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });
    } else if (sortValue === 'oldest') {
        sorted.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateA - dateB;
        });
    }
    
    adminsFilteredData = sorted;
    adminsCurrentPage = 1;
    adminsTotalPages = Math.ceil(adminsFilteredData.length / adminsPerPage);
    displayAdminsPage();
    updateAdminsPaginationControls();
}

function filterAdminsByStatus(status) {
    if (status === '') {
        // Show all admins
        adminsFilteredData = [...allAdminsData];
    } else {
        // Filter admins by status
        adminsFilteredData = allAdminsData.filter(admin => admin.status === status);
    }
    
    // Reset to first page and recalculate pagination
    adminsCurrentPage = 1;
    adminsTotalPages = Math.ceil(adminsFilteredData.length / adminsPerPage);
    displayAdminsPage();
    updateAdminsPaginationControls();
}

// ============ ACTIVITY LOGS ============
// Fallback function when profile image fails to load
function fallbackToInitials(auditId, firstLetter, profileColor) {
    const container = document.getElementById(`imgContainer_${auditId}`);
    if (container) {
        container.innerHTML = `<div style="width: 100%; height: 100%; border-radius: 50%; background: ${profileColor}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; border: 2px solid #e0e0e0;">${firstLetter}</div>`;
    }
}

function logActivity(actionType, actionDescription) {
    // Get admin_id from admin login, or user_id from user login
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const logData = {
        action_type: actionType,
        action_description: actionDescription
    };
    
    // Include appropriate ID based on who's logged in
    if (admin && admin.admin_id) {
        logData.admin_id = admin.admin_id;
    } else if (user && user.user_id) {
        logData.user_id = user.user_id;
    }
    
    fetch(`${API_BASE}/audit_logs.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
    })
    .catch(error => console.log('Activity logged:', actionType));
}

function loadActivityLogs() {
    const tbody = document.getElementById('logsTable');
    if (!tbody) {
        console.error('logsTable element not found!');
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading activity logs...</td></tr>';
    
    console.log('Fetching activity logs from API...');
    
    fetch(`${API_BASE}/audit_logs.php?action=list`)
        .then(response => {
            console.log('API response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('API response data:', data);
            if (data.success && data.data && data.data.length > 0) {
                console.log('✓ Loaded', data.data.length, 'activity logs');
                displayActivityLogs(data.data);
            } else {
                console.log('No data in API response');
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">No activity logs found</td></tr>';
            }
        })
        .catch(error => {
            console.error('✗ Error loading logs:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading activity logs</td></tr>';
        });
}

function displayActivityLogs(logs) {
    const tbody = document.getElementById('logsTable');
    if (!tbody) {
        console.error('logsTable element not found!');
        return;
    }
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No activity logs found</td></tr>';
        return;
    }
    
    // Display logs
    displayLogsPage(logs);
}

function displayLogsPage(logs) {
    const tbody = document.getElementById('logsTable');
    if (!tbody) {
        console.error('logsTable tbody not found');
        return;
    }
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No activity logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    logs.forEach(log => {
        const row = document.createElement('tr');
        const dateTime = new Date(log.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const firstLetter = (log.full_name || 'A')[0].toUpperCase();
        const profileColor = getColorFromLetter(firstLetter);
        
        let actionBadgeStyle = 'background: #28a745; color: white;'; // Green for CREATE
        if (log.action_type === 'UPDATE') {
            actionBadgeStyle = 'background: #007bff; color: white;'; // Blue for UPDATE
        } else if (log.action_type === 'DELETE') {
            actionBadgeStyle = 'background: #dc3545; color: white;'; // Red for DELETE
        } else if (log.action_type === 'LOGIN') {
            actionBadgeStyle = 'background: #6f42c1; color: white;'; // Purple for LOGIN
        } else if (log.action_type === 'LOGOUT') {
            actionBadgeStyle = 'background: #ff9800; color: white;'; // Orange for LOGOUT
        }
        
        // Create profile image cell - show image if available, otherwise show initials
        let profileImageHtml = '';
        if (log.admin_image) {
            profileImageHtml = `<div style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid #e0e0e0; background: #f0f0f0;" id="imgContainer_${log.audit_id}">
                <img src="${log.admin_image}" 
                     style="width: 100%; height: 100%; object-fit: cover;" 
                     alt="${log.user_name || 'User'}"
                     onerror="fallbackToInitials(${log.audit_id}, '${firstLetter}', '${profileColor}')">
            </div>`;
        } else {
            profileImageHtml = `<div style="width: 40px; height: 40px; border-radius: 50%; background: ${profileColor}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; border: 2px solid #e0e0e0;">${firstLetter}</div>`;
        }
        
        row.innerHTML = `
            <td style="font-weight: 600; color: #333;">${log.user_name || 'Unknown'}</td>
            <td><span style="${actionBadgeStyle} padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">${log.action_type}</span></td>
            <td><small>${dateTime}</small></td>
            <td><small>${log.action_description}</small></td>
        `;
        tbody.appendChild(row);
    });
}

function getColorFromLetter(letter) {
    const colors = {
        'A': '#FF6B6B', 'B': '#4ECDC4', 'C': '#45B7D1', 'D': '#FFA07A', 'E': '#98D8C8',
        'F': '#F7DC6F', 'G': '#BB8FCE', 'H': '#85C1E2', 'I': '#F8B88B', 'J': '#52B788',
        'K': '#E56B6F', 'L': '#7209B7', 'M': '#3A86FF', 'N': '#FB5607', 'O': '#FFBE0B',
        'P': '#8338EC', 'Q': '#FFFFB3', 'R': '#FF006E', 'S': '#FB5607', 'T': '#3A86FF',
        'U': '#6A994E', 'V': '#BC4749', 'W': '#2A9D8F', 'X': '#E76F51', 'Y': '#F4A261',
        'Z': '#264653'
    };
    return colors[letter] || '#6C757D';
}

function showLogDetails(auditId, adminName, actionType, description, ipAddress) {
    // Populate modal fields
    document.getElementById('logDetailAdminName').textContent = adminName;
    document.getElementById('logDetailActionType').textContent = actionType;
    document.getElementById('logDetailDescription').textContent = description;
    document.getElementById('logDetailIpAddress').textContent = ipAddress || 'N/A';
    
    // Show modal
    document.getElementById('logDetailsModal').style.display = 'block';
}

function closeLogDetailsModal() {
    document.getElementById('logDetailsModal').style.display = 'none';
}

function loadActionTypes() {
    fetch(`${API_BASE}/audit_logs.php?action=get_actions`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const select = document.getElementById('actionTypeFilter');
                const currentValue = select.value;
                
                // Keep the "All Actions" option
                select.innerHTML = '<option value="">All Actions</option>';
                
                data.data.forEach(action => {
                    const option = document.createElement('option');
                    option.value = action;
                    option.textContent = action;
                    select.appendChild(option);
                });
                
                select.value = currentValue;
            }
        })
        .catch(error => console.error('Error loading action types:', error));
}

// Report functions
function previewReport(reportType) {
    console.log('Previewing report:', reportType);
    
    let apiAction = '';
    let reportTitle = '';
    
    switch(reportType) {
        case 'event_summary':
            apiAction = 'event_summary';
            reportTitle = 'Event Summary Report';
            break;
        case 'participant_list':
            apiAction = 'participant_master';
            reportTitle = 'Participant Master List';
            break;
        case 'attendance':
            apiAction = 'checked_in_attendance';
            reportTitle = 'Checked-in Attendance Report';
            break;
        case 'absentees':
            apiAction = 'absentees';
            reportTitle = 'Absentees / No-show Report';
            break;
        case 'timeline':
            apiAction = 'registration_timeline';
            reportTitle = 'Registration Timeline Report';
            break;
        default:
            return;
    }
    
    // Show loading
    showNotification('Loading report...', 'info');
    
    fetch(`${API_BASE}/reports.php?action=${apiAction}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                displayReportPreview(reportTitle, reportType, data.data);
            } else {
                showNotification('Failed to load report', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading report:', error);
            showNotification('Error loading report: ' + error.message, 'error');
        });
}

function displayReportPreview(title, reportType, data) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('reportPreviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reportPreviewModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    let htmlContent = `<h2>${title}</h2><div style="max-height: 500px; overflow-y: auto;">`;
    
    if (reportType === 'event_summary') {
        htmlContent += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background: #f5f5f5;">
                    <th style="border: 1px solid #ddd; padding: 10px;">Metric</th>
                    <th style="border: 1px solid #ddd; padding: 10px;">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 10px;">Total Events</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${data.total_events || 0}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 10px;">Total Registrations</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${data.total_registrations || 0}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 10px;">Total Attended</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${data.total_attended || 0}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 10px;">Attendance Rate</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${data.attendance_rate || 0}%</td>
                </tr>
            </tbody>
        </table>`;
    } else if (reportType === 'timeline') {
        htmlContent += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background: #f5f5f5;">
                    <th style="border: 1px solid #ddd; padding: 10px;">Date</th>
                    <th style="border: 1px solid #ddd; padding: 10px;">Registrations</th>
                </tr>
            </thead>
            <tbody>`;
        data.forEach(row => {
            htmlContent += `<tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${row.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${row.count}</td>
            </tr>`;
        });
        htmlContent += '</tbody></table>';
    } else {
        // Table preview for other reports
        if (Array.isArray(data) && data.length > 0) {
            const columns = Object.keys(data[0]);
            htmlContent += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background: #f5f5f5;">`;
            
            columns.forEach(col => {
                htmlContent += `<th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-weight: bold;">${col}</th>`;
            });
            
            htmlContent += `</tr></thead><tbody>`;
            
            data.slice(0, 20).forEach(row => {
                htmlContent += '<tr>';
                columns.forEach(col => {
                    htmlContent += `<td style="border: 1px solid #ddd; padding: 10px;">${row[col] || '-'}</td>`;
                });
                htmlContent += '</tr>';
            });
            
            if (data.length > 20) {
                htmlContent += `<tr><td colspan="${columns.length}" style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #666;">... and ${data.length - 20} more rows</td></tr>`;
            }
            
            htmlContent += '</tbody></table>';
        } else {
            htmlContent += '<p style="color: #666; text-align: center; padding: 20px;">No data available</p>';
        }
    }
    
    htmlContent += '</div>';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <span class="modal-close" onclick="closeReportPreview()">&times;</span>
            ${htmlContent}
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeReportPreview() {
    const modal = document.getElementById('reportPreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function downloadReport(reportType) {
    console.log('Downloading report:', reportType);
    
    let downloadUrl = `${API_BASE}/export.php?report=`;
    
    switch(reportType) {
        case 'event_summary':
            downloadUrl += 'event_summary';
            break;
        case 'participant_list':
            downloadUrl += 'participant_list';
            break;
        case 'attendance':
            downloadUrl += 'attendance';
            break;
        case 'absentees':
            downloadUrl += 'absentees';
            break;
        case 'timeline':
            downloadUrl += 'timeline';
            break;
        default:
            return;
    }
    
    showNotification('Download started...', 'success');
    window.open(downloadUrl, '_blank');
}

function downloadAllReportsData() {
    console.log('Downloading all reports data');
    
    showNotification('Preparing all reports for download...', 'info');
    
    // Create a list of all report types to download
    const reports = ['event_summary', 'participant_list', 'attendance', 'absentees', 'timeline'];
    
    // Download each report with a slight delay to avoid server overload
    reports.forEach((report, index) => {
        setTimeout(() => {
            const url = `${API_BASE}/export.php?report=${report}`;
            window.open(url, '_blank');
        }, index * 500);
    });
    
    showNotification('All reports are being downloaded...', 'success');
}

// ============ CATALOGUE ============

// Load catalogue events
function loadCatalogue() {
    console.log('📦 Loading catalogue...');
    fetch(`${API_BASE}/catalogue.php?action=list`)
        .then(response => {
            console.log('📦 Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📦 Catalogue data received:', data);
            if (data.success) {
                console.log('📦 Total events in catalogue:', (data.data || []).length);
                renderCatalogue(data.data || []);
            } else {
                console.error('📦 API error:', data.message);
                showNotification('Failed to load catalogue: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('📦 Error loading catalogue:', error);
            showNotification('Error loading catalogue', 'error');
        });
    
    // Setup catalogue search with suggestions
    const catalogueSearchBox = document.getElementById('catalogueSearch');
    if (catalogueSearchBox) {
        let searchTimeout;
        catalogueSearchBox.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim().toLowerCase();
            
            if (query.length > 0) {
                searchTimeout = setTimeout(() => {
                    searchCatalogueList(query);
                    displayCatalogueSuggestions(query);
                }, 300);
            } else if (query.length === 0) {
                clearTimeout(searchTimeout);
                hideCatalogueSuggestions();
                loadCatalogue();
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== catalogueSearchBox) {
                hideCatalogueSuggestions();
            }
        });
    }
}

// Render catalogue events in grid
function renderCatalogue(catalogueEvents) {
    console.log('📦 Rendering catalogue with', catalogueEvents.length, 'events');
    
    // Store all catalogue data for search/filter/sort
    allCatalogueData = catalogueEvents || [];
    
    const container = document.getElementById('catalogueContainer');
    console.log('📦 Container element:', container);
    
    if (!container) {
        console.error('📦 catalogueContainer element not found!');
        return;
    }
    
    if (!catalogueEvents || catalogueEvents.length === 0) {
        console.log('📦 No catalogued events to display');
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #999; padding: 60px 40px; background: white; border-radius: 8px; border: 2px dashed #e0e0e0;"><p style="margin: 0; font-size: 16px; font-weight: 500;">📭 No catalogued events yet</p><p style="margin: 10px 0 0 0; font-size: 14px;">Use "Lookup Events" or "Add Past Event" to get started.</p></div>';
        return;
    }
    
    // Render with current filters and sort
    renderCatalogueDisplay(sortCatalogueArray(filterCatalogueByType(catalogueEvents)));
}

// Helper function to render catalogue HTML
function renderCatalogueHTML(catalogueEvents) {
    console.log('📦 Building HTML for', catalogueEvents.length, 'events');
    let html = '';
    catalogueEvents.forEach((event, index) => {
        console.log('📦 Processing event', index + 1, ':', event.event_name);
        const imageUrl = getImageUrl(event.image_url);
        const imageHTML = imageUrl ? `<img src="${imageUrl}" alt="${event.event_name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">` : '<div style="width: 100%; height: 200px; background: #f0f0f0; border-radius: 8px 8px 0 0; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 48px;">📷</div>';
        const typeLabel = event.is_private ? 'Private' : 'Public';
        const typeBadgeColor = event.is_private ? '#C41E3A' : '#6c63ff';
        const typeBadgeBg = event.is_private ? '#ffe0e0' : '#e8e5ff';
        
        html += `
            <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s; display: flex; flex-direction: column; height: 100%;">
                <div style="position: relative; flex-shrink: 0;">
                    ${imageHTML}
                    <span style="position: absolute; top: 10px; right: 10px; background: ${typeBadgeBg}; color: ${typeBadgeColor}; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: bold;">${typeLabel}</span>
                </div>
                <div style="padding: 15px; flex: 1; display: flex; flex-direction: column;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333; word-break: break-word; flex-shrink: 0;">${event.event_name}</h3>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; flex-shrink: 0; display: flex; align-items: center; gap: 6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 14a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2m-4-5a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-6-3a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2"/><path fill="currentColor" fill-rule="evenodd" d="M7 1.75a.75.75 0 0 1 .75.75v.763c.662-.013 1.391-.013 2.193-.013h4.113c.803 0 1.532 0 2.194.013V2.5a.75.75 0 0 1 1.5 0v.827q.39.03.739.076c1.172.158 2.121.49 2.87 1.238c.748.749 1.08 1.698 1.238 2.87c.153 1.14.153 2.595.153 4.433v2.112c0 1.838 0 3.294-.153 4.433c-.158 1.172-.49 2.121-1.238 2.87c-.749.748-1.698 1.08-2.87 1.238c-1.14.153-2.595.153-4.433.153H9.945c-1.838 0-3.294 0-4.433-.153c-1.172-.158-2.121-.49-2.87-1.238c-.748-.749-1.08-1.698-1.238-2.87c-.153-1.14-.153-2.595-.153-4.433v-2.112c0-1.838 0-3.294.153-4.433c.158-1.172.49-2.121 1.238-2.87c.749-.748 1.698-1.08 2.87-1.238q.35-.046.739-.076V2.5A.75.75 0 0 1 7 1.75M5.71 4.89c-1.005.135-1.585.389-2.008.812S3.025 6.705 2.89 7.71q-.034.255-.058.539h18.336q-.024-.284-.058-.54c-.135-1.005-.389-1.585-.812-2.008s-1.003-.677-2.009-.812c-1.027-.138-2.382-.14-4.289-.14h-4c-1.907 0-3.261.002-4.29.14M2.75 12c0-.854 0-1.597.013-2.25h18.474c.013.653.013 1.396.013 2.25v2c0 1.907-.002 3.262-.14 4.29c-.135 1.005-.389 1.585-.812 2.008s-1.003.677-2.009.812c-1.027.138-2.382.14-4.289.14h-4c-1.907 0-3.261-.002-4.29-.14c-1.005-.135-1.585-.389-2.008-.812s-.677-1.003-.812-2.009c-.138-1.027-.14-2.382-.14-4.289z" clip-rule="evenodd"/></svg>
                        ${event.event_date}
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #666; flex-shrink: 0; display: flex; align-items: center; gap: 6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 48c-79.5 0-144 61.39-144 137c0 87 96 224.87 131.25 272.49a15.77 15.77 0 0 0 25.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137"/><circle cx="256" cy="192" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>
                        ${event.location || 'Location TBA'}
                    </p>
                    ${event.description ? `<p style="margin: 0 0 12px 0; font-size: 12px; color: #999; line-height: 1.4; flex: 1; overflow: hidden;">${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>` : '<p style="flex: 1;"></p>'}
                    <button class="btn btn-secondary" onclick="removeEventFromCatalogue(${event.catalogue_id})" style="width: 100%; background: #fee; color: #C41E3A; border: 1px solid #C41E3A; flex-shrink: 0; margin-top: auto;">Remove</button>
                </div>
            </div>
        `;
    });
    
    return html;
}

// Display rendered catalogue
function displayCatalogueInternal(catalogueEvents) {
    const container = document.getElementById('catalogueContainer');
    if (!container) {
        console.error('📦 catalogueContainer element not found!');
        return;
    }
    
    console.log('📦 Setting innerHTML to container');
    const html = renderCatalogueHTML(catalogueEvents);
    container.innerHTML = html;
    console.log('📦 Catalogue rendered successfully with', catalogueEvents.length, 'items');
}

// Open lookup events modal
function openLookupEventsModal() {
    document.getElementById('lookupEventsModal').style.display = 'block';
    loadLookupEvents();
}

// Close lookup events modal
function closeLookupEventsModal() {
    document.getElementById('lookupEventsModal').style.display = 'none';
}

// Load events available in lookup (past events not yet in catalogue)
function loadLookupEvents() {
    fetch(`${API_BASE}/catalogue.php?action=lookup`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderLookupEvents(data.data || []);
            } else {
                showNotification('Failed to load events', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading lookup events:', error);
            showNotification('Error loading events', 'error');
        });
}

// Render lookup events
function renderLookupEvents(events) {
    const container = document.getElementById('lookupEventsContainer');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #999; padding: 30px;">No past events available to add.</div>';
        return;
    }
    
    let html = '';
    events.forEach(event => {
        const imageUrl = getImageUrl(event.image_url);
        const imageHTML = imageUrl ? `<img src="${imageUrl}" alt="${event.event_name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px 4px 0 0;">` : '<div style="width: 100%; height: 150px; background: #f0f0f0; border-radius: 4px 4px 0 0; display: flex; align-items: center; justify-content: center; color: #ccc;">No Image</div>';
        const typeLabel = event.is_private ? 'Private' : 'Public';
        const typeBadgeColor = event.is_private ? '#C41E3A' : '#6c63ff';
        const typeBadgeBg = event.is_private ? '#ffe0e0' : '#e8e5ff';
        
        html += `
            <div style="background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
                <div style="position: relative;">
                    ${imageHTML}
                    <span style="position: absolute; top: 5px; right: 5px; background: ${typeBadgeBg}; color: ${typeBadgeColor}; padding: 4px 8px; border-radius: 3px; font-size: 10px; font-weight: bold;">${typeLabel}</span>
                </div>
                <div style="padding: 10px;">
                    <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #333; word-break: break-word;">${event.event_name}</h4>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 14a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2m-4-5a1 1 0 1 1-2 0a1 1 0 0 1 2 0m0 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-6-3a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2"/><path fill="currentColor" fill-rule="evenodd" d="M7 1.75a.75.75 0 0 1 .75.75v.763c.662-.013 1.391-.013 2.193-.013h4.113c.803 0 1.532 0 2.194.013V2.5a.75.75 0 0 1 1.5 0v.827q.39.03.739.076c1.172.158 2.121.49 2.87 1.238c.748.749 1.08 1.698 1.238 2.87c.153 1.14.153 2.595.153 4.433v2.112c0 1.838 0 3.294-.153 4.433c-.158 1.172-.49 2.121-1.238 2.87c-.749.748-1.698 1.08-2.87 1.238c-1.14.153-2.595.153-4.433.153H9.945c-1.838 0-3.294 0-4.433-.153c-1.172-.158-2.121-.49-2.87-1.238c-.748-.749-1.08-1.698-1.238-2.87c-.153-1.14-.153-2.595-.153-4.433v-2.112c0-1.838 0-3.294.153-4.433c.158-1.172.49-2.121 1.238-2.87c.749-.748 1.698-1.08 2.87-1.238q.35-.046.739-.076V2.5A.75.75 0 0 1 7 1.75M5.71 4.89c-1.005.135-1.585.389-2.008.812S3.025 6.705 2.89 7.71q-.034.255-.058.539h18.336q-.024-.284-.058-.54c-.135-1.005-.389-1.585-.812-2.008s-1.003-.677-2.009-.812c-1.027-.138-2.382-.14-4.289-.14h-4c-1.907 0-3.261.002-4.29.14M2.75 12c0-.854 0-1.597.013-2.25h18.474c.013.653.013 1.396.013 2.25v2c0 1.907-.002 3.262-.14 4.29c-.135 1.005-.389 1.585-.812 2.008s-1.003.677-2.009.812c-1.027.138-2.382.14-4.289.14h-4c-1.907 0-3.261-.002-4.29-.14c-1.005-.135-1.585-.389-2.008-.812s-.677-1.003-.812-2.009c-.138-1.027-.14-2.382-.14-4.289z" clip-rule="evenodd"/></svg>
                        ${event.event_date}
                    </p>
                    <button class="btn btn-primary" onclick="addEventToCatalogue(${event.event_id})" style="width: 100%; padding: 8px; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"/></svg> Add</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Add event from lookup to catalogue
function addEventToCatalogue(eventId) {
    // Store the event ID for later use
    window.catalogueEventId = eventId;
    
    // Reset form
    document.getElementById('catalogueImageInput').value = '';
    document.getElementById('catalogueImagePreview').innerHTML = '<span style="font-size: 48px;">📷</span>';
    document.getElementById('catalogueEventName').textContent = 'Event #' + eventId;
    
    // Show modal
    document.getElementById('addCatalogueImageModal').style.display = 'block';
}

// Preview catalogue image
function previewCatalogueImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('catalogueImagePreview').innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);
    }
}

// Close catalogue image modal
function closeAddCatalogueImageModal() {
    document.getElementById('addCatalogueImageModal').style.display = 'none';
    window.catalogueEventId = null;
}

// Submit event to catalogue with image
function submitCatalogueEventWithImage() {
    const eventId = window.catalogueEventId;
    const imageInput = document.getElementById('catalogueImageInput');
    const file = imageInput.files[0];
    
    console.log('submitCatalogueEventWithImage called');
    console.log('Event ID:', eventId);
    console.log('File selected:', file ? file.name : 'No file');
    
    if (!eventId) {
        console.error('Event ID not found');
        showNotification('Event ID not found', 'error');
        return;
    }
    
    // Create FormData to handle image upload
    const formData = new FormData();
    formData.append('action', 'add_with_image');
    formData.append('event_id', eventId);
    
    if (file) {
        console.log('Adding file to FormData, size:', file.size);
        formData.append('image', file);
    }
    
    console.log('Sending request to API...');
    
    fetch(`${API_BASE}/catalogue.php`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Response status:', response.status, response.statusText);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        console.log('Raw response text:', text);
        
        // Check if response is empty
        if (!text || text.trim() === '') {
            throw new Error('Empty response from server');
        }
        
        // Try to parse JSON
        try {
            const data = JSON.parse(text);
            console.log('Parsed response:', data);
            
            if (data.success) {
                showNotification('Event added to catalogue', 'success');
                closeAddCatalogueImageModal();
                loadLookupEvents();
                loadCatalogue();
            } else {
                console.error('API returned success=false:', data.message);
                showNotification(data.message || 'Failed to add event', 'error');
            }
        } catch (e) {
            console.error('JSON Parse Error:', e);
            console.error('Response text:', text);
            showNotification('Invalid response from server: ' + e.message, 'error');
        }
    })
    .catch(error => {
        console.error('Fetch Error:', error);
        showNotification('Error adding event: ' + error.message, 'error');
    });
}

// Remove event from catalogue
function removeEventFromCatalogue(catalogueId) {
    showConfirmation(
        'Remove from Catalogue',
        'Are you sure you want to remove this event from the catalogue?',
        'Remove',
        () => performRemoveCatalogue(catalogueId)
    );
}

function performRemoveCatalogue(catalogueId) {
    fetch(`${API_BASE}/catalogue.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            showNotification(data.message || 'Failed to remove event', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error removing event', 'error');
    });
}

// Open add past event modal
function openAddPastEventModal() {
    document.getElementById('addPastEventForm').reset();
    document.getElementById('addPastEventModal').style.display = 'block';
}

// Close add past event modal
function closeAddPastEventModal() {
    document.getElementById('addPastEventModal').style.display = 'none';
}

// Submit add past event form
function submitAddPastEventForm() {
    const form = document.getElementById('addPastEventForm');
    const formData = new FormData(form);
    formData.append('action', 'add_direct');
    
    // Validate
    const eventName = document.getElementById('pastEventName').value.trim();
    const eventDate = document.getElementById('pastEventDate').value;
    const eventImage = document.getElementById('pastEventImage');
    
    if (!eventName || !eventDate || !eventImage.files.length) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    fetch(`${API_BASE}/catalogue.php`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Event added to catalogue successfully', 'success');
            closeAddPastEventModal();
            loadCatalogue();
        } else {
            showNotification(data.message || 'Failed to add event', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding event', 'error');
    });
}
// ============ REPORTS SEARCH & FILTER ============

let allReportsData = [
    { id: 'event_summary', name: 'Event Summary Report', type: 'event', description: 'Aggregated stats for all events including registration counts and attendance rates.' },
    { id: 'participant_list', name: 'Participant Master List', type: 'event', description: 'Complete list of all registered users across all events with full contact details.' },
    { id: 'attendance', name: 'Checked-in Attendance Report', type: 'attendance', description: 'Detailed breakdown of participants who have successfully scanned their tickets.' },
    { id: 'absentees', name: 'Absentees / No-show Report', type: 'attendance', description: 'List of participants who registered but did not attend the event.' },
    { id: 'timeline', name: 'Registration Timeline Report', type: 'event', description: 'Visual report showing registration peaks and trends over selected time periods.' }
];
let currentReportFilter = 'all';
let currentReportSort = 'name-asc';

function searchReportsList(query) {
    console.log('Searching reports for:', query);
    const filtered = allReportsData.filter(report => {
        const matchesSearch = report.name.toLowerCase().includes(query) ||
            (report.description && report.description.toLowerCase().includes(query));
        return matchesSearch;
    });
    renderReportsDisplay(sortReportsArray(filterReportsByType(filtered)));
}

function displayReportSuggestions(query) {
    const suggestionsContainer = document.getElementById('reportSearchSuggestions');
    if (!suggestionsContainer || query.length === 0) return;
    
    const matches = allReportsData.filter(report => {
        return report.name.toLowerCase().includes(query) ||
            (report.description && report.description.toLowerCase().includes(query));
    }).slice(0, 5);
    
    if (matches.length === 0) {
        suggestionsContainer.innerHTML = '<div style="padding: 15px; color: #999; text-align: center;">No reports found</div>';
        suggestionsContainer.style.display = 'block';
        return;
    }
    
    suggestionsContainer.innerHTML = matches.map(report => {
        return `
            <div class="search-suggestion-item" onclick="selectReportSuggestion('${report.name}')">
                <div class="search-suggestion-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg></div>
                <div class="search-suggestion-text">
                    <div class="search-suggestion-name">${escapeHtml(report.name)}</div>
                    <div class="search-suggestion-date">${report.type}</div>
                </div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.style.display = 'block';
}

function hideReportSuggestions() {
    const suggestionsContainer = document.getElementById('reportSearchSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectReportSuggestion(reportName) {
    const searchBox = document.getElementById('reportSearch');
    if (searchBox) {
        searchBox.value = reportName;
        hideReportSuggestions();
        searchReportsList(reportName.toLowerCase());
    }
}

function filterReports(filterType) {
    console.log('Setting report filter to:', filterType);
    currentReportFilter = filterType;
    
    const searchBox = document.getElementById('reportSearch');
    if (searchBox) {
        searchBox.value = '';
    }
    
    renderReportsDisplay(sortReportsArray(filterReportsByType(allReportsData)));
}

function sortReports(sortType) {
    console.log('Setting report sort to:', sortType);
    currentReportSort = sortType;
    
    renderReportsDisplay(sortReportsArray(filterReportsByType(allReportsData)));
}

function filterReportsByType(reports) {
    if (currentReportFilter === 'event') {
        return reports.filter(r => r.type === 'event');
    } else if (currentReportFilter === 'attendance') {
        return reports.filter(r => r.type === 'attendance');
    }
    return reports; // 'all'
}

function sortReportsArray(reports) {
    const sorted = [...reports];
    
    if (currentReportSort === 'name-asc') {
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (currentReportSort === 'name-desc') {
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }
    
    return sorted;
}

function renderReportsDisplay(reports) {
    const container = document.getElementById('reportsContainer');
    if (!container) return;
    
    if (!reports || reports.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #999; padding: 60px 40px; background: white; border-radius: 8px; border: 2px dashed #e0e0e0;"><p style="margin: 0; font-size: 16px; font-weight: 500;">📋 No reports found</p></div>';
        return;
    }
    
    let html = '';
    reports.forEach((report) => {
        const icons = {
            'event_summary': '📊',
            'participant_list': '👥',
            'attendance': '✅',
            'absentees': '❌',
            'timeline': '📈'
        };
        const icon = icons[report.id] || '📄';
        
        html += `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="font-size: 28px; margin-right: 12px;">${icon}</div>
                    <h3 style="margin: 0; font-size: 18px; color: #333;">${report.name}</h3>
                </div>
                <p style="color: #666; margin: 10px 0; font-size: 14px;">${report.description}</p>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="btn" onclick="previewReport('${report.id}')" style="flex: 1; background: white; color: #6c63ff; border: 1px solid #6c63ff;">👁️ Preview</button>
                    <button class="btn btn-primary" onclick="downloadReport('${report.id}')" style="flex: 1; background: #6c63ff;">⬇️ Download</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============ CONFIRMATION MODAL FUNCTIONS ============
let confirmationCallback = null;

function showConfirmation(title, message, actionText = 'Confirm', callback) {
    confirmationCallback = callback;
    document.getElementById('confirmationTitle').textContent = title;
    document.getElementById('confirmationMessage').textContent = message;
    document.getElementById('confirmationActionBtn').textContent = actionText;
    document.getElementById('confirmationModal').style.display = 'block';
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
    confirmationCallback = null;
}

function confirmAction() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
    if (confirmationCallback) {
        confirmationCallback();
    }
    confirmationCallback = null;
}

// Add click handler to confirmation action button
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('confirmationActionBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmAction);
    }
});