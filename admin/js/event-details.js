// Event Details Page JavaScript

const API_BASE = '../api';
let currentEventId = null;
let currentEventData = null; // Store current event data for Tasks section

// Store all attendees data
let attendeesData = {
    initial: [],    // Registered but not attended
    actual: []      // Marked as attended
};

// Helper function to get user headers for API requests
function getUserHeaders() {
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
    
    return headers;
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

// Helper function to get correct image URL path
function getImageUrl(imagePath) {
    if (!imagePath) {
        console.log('🖼️ getImageUrl: No path provided');
        return null;
    }
    
    let result = imagePath;
    
    // If it's already a full URL (starts with http), return as-is
    if (imagePath.startsWith('http')) {
        console.log('🖼️ getImageUrl: Full URL detected, returning as-is:', imagePath);
        return imagePath;
    }
    
    // If it contains /Smart-Events/ (from database), convert to relative path
    if (imagePath.includes('/Smart-Events/')) {
        result = imagePath.replace('/Smart-Events/', '../');
        console.log('🖼️ getImageUrl: Converted from:', imagePath, 'to:', result);
        return result;
    }
    
    // If path is relative to webroot (uploads/...), prepend ../ for admin nested folder
    if (imagePath.startsWith('uploads/')) {
        result = '../' + imagePath;
        console.log('🖼️ getImageUrl: Converted from:', imagePath, 'to:', result);
        return result;
    }
    
    // If path starts with /, use it as-is (from webroot)
    if (imagePath.startsWith('/')) {
        console.log('🖼️ getImageUrl: Root path detected, returning as-is:', imagePath);
        return imagePath;
    }
    
    // Otherwise return as-is
    console.log('🖼️ getImageUrl: Unknown format, returning as-is:', imagePath);
    return imagePath;
}

// Navigation function to go back to Events List
function backToEventsList() {
    window.location.href = 'index.html?page=events';
}

// Check if user has access to this event (role-based access control)
async function checkAccessToEvent(eventId, userRole, userId, coordinatorId) {
    // Admins have access to all events
    if (userRole === 'ADMIN' || userRole === 'admin') {
        return true;
    }
    
    // Coordinators can only access their assigned events
    if (userRole === 'COORDINATOR' || userRole === 'coordinator') {
        try {
            const response = await fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                const event = data.data;
                // Check if this coordinator is assigned to this event
                return event.coordinator_id == coordinatorId;
            }
        } catch (error) {
            console.error('Error checking access:', error);
        }
        return false;
    }
    
    return false;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Load sidebar navigation
    await loadSidebarNavigation();
    
    const params = new URLSearchParams(window.location.search);
    currentEventId = params.get('id');
    
    if (!currentEventId) {
        document.querySelector('.tab-content-wrapper').innerHTML = '<p style="text-align: center; color: #999;">No event ID provided.</p>';
        return;
    }
    
    // Get user info from localStorage
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userInfo = (admin && admin.id) ? admin : user;
    const userRole = userInfo.role || userInfo.role_name || 'GUEST';
    const userId = userInfo.id || userInfo.user_id || userInfo.coordinator_id;
    const coordinatorId = userInfo.coordinator_id || userInfo.id;
    
    console.log('Event Details Page Load:', {
        currentEventId,
        userRole,
        userInfo: { role: userInfo.role, role_name: userInfo.role_name, id: userInfo.id }
    });
    
    // For now, proceed without strict access control - allow page to load
    // Check if user has access to this event only if they're a coordinator
    if (userRole === 'COORDINATOR' || userRole === 'coordinator') {
        const hasAccess = await checkAccessToEvent(currentEventId, userRole, userId, coordinatorId);
        if (!hasAccess) {
            document.querySelector('.tab-content-wrapper').innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2 style="color: #c41e3a; margin-bottom: 20px;">Access Denied</h2>
                    <p style="color: #666; margin-bottom: 30px;">You do not have permission to access this event. As a coordinator, you can only manage events assigned to you.</p>
                    <button onclick="window.location.href='index.html?page=events'" style="background: #c41e3a; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500;">Back to Events</button>
                </div>
            `;
            return;
        }
    }
    
    loadEventDetails();
});

// Load sidebar navigation from separate file
function loadSidebarNavigation() {
    return new Promise((resolve, reject) => {
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
                    setupNavigationForEventDetails();
                    console.log('✓ Sidebar loaded successfully on event-details page');
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

// Setup navigation for event details page
function setupNavigationForEventDetails() {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    
    // Load admin info from localStorage
    let admin = JSON.parse(localStorage.getItem('admin') || '{}');
    let user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Prefer admin data, fallback to user data
    let userInfo = (admin && admin.email) ? admin : user;
    const userRole = userInfo.role || userInfo.role_name || 'GUEST';
    
    // Filter menu items based on user role
    if (userRole === 'COORDINATOR' || userRole === 'coordinator') {
        // For coordinators, only show: Event, Calendar, QR Scanner
        const allowedPages = ['events', 'calendar', 'qr-scanner'];
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (!allowedPages.includes(page)) {
                link.style.display = 'none';
            }
        });
        
        // Hide the divider between regular and admin menu items
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            const dividers = sidebar.querySelectorAll('.border-t.border-gray-200');
            if (dividers.length > 0) {
                dividers[dividers.length - 1].style.display = 'none'; // Hide last divider
            }
        }
        
        // Update sidebar label
        const sidebarHeader = document.querySelector('.sidebar > div:first-child p:nth-child(2)');
        if (sidebarHeader) {
            sidebarHeader.textContent = 'Coordinator';
        }
    }
    
    // Add click handlers to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            
            // Coordinators can only access allowed pages
            if ((userRole === 'COORDINATOR' || userRole === 'coordinator') && !['events', 'calendar', 'qr-scanner'].includes(page)) {
                alert('You do not have permission to access this page.');
                return;
            }
            
            // Navigate back to main dashboard
            window.location.href = `index.html?page=${page}`;
        });
    });
    
    // Setup logout button
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Setup admin profile information from localStorage
function setupAdminProfile() {
    const adminName = localStorage.getItem('adminName') || 'Admin User';
    const adminAvatar = localStorage.getItem('adminAvatar') || '👤';
    
    const adminNameEl = document.getElementById('adminName');
    const adminAvatarEl = document.getElementById('adminAvatar');
    
    if (adminNameEl) adminNameEl.textContent = adminName;
    if (adminAvatarEl) adminAvatarEl.textContent = adminAvatar;
}

function loadEventDetails() {
    console.log('Loading event details for event ID:', currentEventId);
    fetch(`${API_BASE}/events.php?action=detail&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
        .then(response => {
            console.log('API Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Event data received:', data);
            if (data.success && data.data) {
                console.log('✓ Event found:', data.data.event_name);
                displayEventDetails(data.data);
                loadEventTasks(); // Load tasks after event details are displayed
                loadAttendees(); // Load attendees after event details are displayed
            } else {
                console.error('✗ API returned error or no data:', data);
                showError('Failed to load event details: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('✗ Fetch error loading event details:', error);
            showError('Error loading event details: ' + error.message);
        });
}

// Fetch and display the access code for private events
function loadEventAccessCode(eventId) {
    const codeField = document.getElementById('detailsPrivateAccessCode');
    if (!codeField) return;
    
    fetch(`${API_BASE}/events.php?action=access_code&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.access_code) {
                codeField.value = data.access_code;
                codeField.style.color = '#2563eb';
                codeField.style.fontWeight = 'bold';
                codeField.style.fontSize = '16px';
                codeField.style.textAlign = 'center';
                codeField.style.letterSpacing = '2px';
                console.log('✓ Loaded access code for event');
            } else {
                codeField.value = '—';
            }
        })
        .catch(error => {
            console.error('Error loading access code:', error);
            codeField.value = '—';
        });
}

function displayEventDetails(event) {
    console.log('displayEventDetails() called with:', event);
    
    if (!event || !event.event_id) {
        console.error('✗ Invalid event data');
        showError('Invalid event data received');
        return;
    }
    
    // Store current event data for use in Tasks section and other places
    currentEventData = event;
    
    // Update header
    try {
        const titleEl = document.getElementById('eventTitle');
        if (titleEl) {
            titleEl.textContent = event.event_name || 'Event Details';
            console.log('✓ Updated page title to:', event.event_name);
        }
    } catch (e) {
        console.error('Error updating title:', e);
    }
    
    // Get event stats
    const registered = event.total_registrations || 0;
    const attended = event.attended_count || 0;
    const capacity = event.capacity || 0;
    const available = event.available_spots || 0;
    const attendanceRate = capacity > 0 && registered > 0 ? Math.round((attended / registered) * 100) : 0;
    
    // Details tab - populate all fields with error checking
    try {
        const fields = [
            { id: 'detailsEventTitle', value: event.event_name || '-', label: 'Event Title' },
            { id: 'detailsEventLocation', value: event.location || '-', label: 'Location' },
            { id: 'detailsEventDate', value: event.event_date || '', label: 'Date' },
            { id: 'detailsStartTime', value: convert24To12Hour(event.start_time) || '-', label: 'Start Time' },
            { id: 'detailsEndTime', value: convert24To12Hour(event.end_time) || '-', label: 'End Time' },
            { id: 'detailsEventDescription', value: event.description || '-', label: 'Description' },
            { id: 'detailsRegistrationLink', value: event.registration_link || '-', label: 'Registration Link' },
            { id: 'detailsEventCapacity', value: capacity || '-', label: 'Capacity' },
            { id: 'detailsEventTypeField', value: (event.is_private == 1 ? 'Private' : 'Public'), label: 'Event Type' }
        ];
        
        fields.forEach(field => {
            const el = document.getElementById(field.id);
            if (el) {
                if (el.tagName === 'TEXTAREA') {
                    el.textContent = field.value;
                } else {
                    el.value = field.value;
                }
                console.log(`✓ Set ${field.label}:`, field.value);
            } else {
                console.warn(`⚠ Field not found: #${field.id}`);
            }
        });
    } catch (e) {
        console.error('✗ Error setting form fields:', e.message, e);
    }
    
    // Event Image - Display visually
    try {
        const imageContainer = document.getElementById('detailsEventImage');
        if (imageContainer) {
            if (event.image_url || event.image) {
                const imageUrl = getImageUrl(event.image_url || event.image);
                imageContainer.innerHTML = `<img src="${imageUrl}" alt="${event.event_name}" style="max-width: 100%; max-height: 400px; border-radius: 4px; object-fit: contain;">`;
            } else {
                imageContainer.innerHTML = '<span style="color: #999;">📷 No image available</span>';
            }
            console.log('✓ Set event image');
        }
    } catch (e) {
        console.error('Error setting image:', e);
    }
    
    console.log('✓ displayEventDetails completed successfully');
    
    // Load additional data after displaying basic event info
    setTimeout(() => {
        console.log('Loading coordinators, access code, other info, attendees, and dashboard...');
        try {
            loadCoordinators(currentEventId);
        } catch (e) { console.error('Error loading coordinators:', e); }
        try {
            loadEventAccessCode(currentEventId);
        } catch (e) { console.error('Error loading access code:', e); }
        try {
            loadOtherInfo(currentEventId);
        } catch (e) { console.error('Error loading other info:', e); }
        try {
            loadAttendees(currentEventId);
        } catch (e) { console.error('Error loading attendees:', e); }
        try {
            loadDashboard(currentEventId);
        } catch (e) { console.error('Error loading dashboard:', e); }
    }, 500);
}

function switchTab(tabName) {
    console.log('🔀 Switching to tab:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.event-tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
        tabElement.style.display = 'block';
        console.log('✓ Activated tab element:', tabName, 'Display:', window.getComputedStyle(tabElement).display);
    } else {
        console.error('❌ Tab element not found:', tabName);
    }
    
    // Find and activate the corresponding button
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes(`switchTab('${tabName}')`)) {
            btn.classList.add('active');
        }
    });
    
    // Load data when specific tabs are clicked
    if (tabName === 'tasks') {
        console.log('📋 Loading tasks...');
        loadEventTasks();
    }
    
    if (tabName === 'attendees') {
        console.log('👥 Loading attendees...');
        const attendeesEl = document.getElementById('attendees');
        console.log('Attendees element found:', attendeesEl ? 'YES' : 'NO');
        console.log('Attendees computed style:', window.getComputedStyle(attendeesEl).display);
        console.log('Attendees innerHTML length:', attendeesEl?.innerHTML?.length);
        loadAttendees();
    }
}

function switchAttendeesTab(subTab) {
    const registeredContent = document.getElementById('registeredAttendeesContent');
    const attendedContent = document.getElementById('attendedAttendeesContent');
    const registeredBtn = document.getElementById('registeredBtn');
    const attendedBtn = document.getElementById('attendedBtn');
    
    if (subTab === 'registered') {
        registeredContent.style.display = 'block';
        attendedContent.style.display = 'none';
        registeredBtn.classList.add('active');
        attendedBtn.classList.remove('active');
        registeredBtn.style.color = '#C41E3A';
        registeredBtn.style.borderBottom = '3px solid #C41E3A';
        registeredBtn.style.marginBottom = '-2px';
        attendedBtn.style.color = '#999';
        attendedBtn.style.borderBottom = 'none';
    } else {
        registeredContent.style.display = 'none';
        attendedContent.style.display = 'block';
        registeredBtn.classList.remove('active');
        attendedBtn.classList.add('active');
        registeredBtn.style.color = '#999';
        registeredBtn.style.borderBottom = 'none';
        attendedBtn.style.color = '#C41E3A';
        attendedBtn.style.borderBottom = '3px solid #C41E3A';
        attendedBtn.style.marginBottom = '-2px';
    }
}

function loadCoordinators(eventId) {
    const table = document.getElementById('coordinatorsTable');
    
    fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const event = data.data;
                
                // Check if coordinator is assigned
                if (event.coordinator_id && event.coordinator_name) {
                    const html = `
                        <tr>
                            <td class="px-4 py-3">${escapeHtml(event.coordinator_name)}</td>
                            <td class="px-4 py-3">${escapeHtml(event.coordinator_email || '—')}</td>
                            <td class="px-4 py-3">${escapeHtml(event.coordinator_contact || '—')}</td>
                            <td class="px-4 py-3 flex gap-2">
                                <button onclick="removeCoordinatorFromEvent(${event.coordinator_id}, ${eventId})" class="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">🗑️ Remove</button>
                            </td>
                        </tr>
                    `;
                    table.innerHTML = html;
                } else {
                    table.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500 text-sm">No coordinators assigned to this event</td></tr>';
                }
            } else {
                table.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500 text-sm">Error loading coordinators</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error loading coordinators:', error);
            table.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500 text-sm">Error loading coordinators</td></tr>';
        });
}

function loadOtherInfo(eventId) {
    // Fetch and display other information from metadata API
    fetch(`${API_BASE}/metadata.php?action=list&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            const table = document.getElementById('otherInfoTable');
            
            if (data.success && data.data && data.data.length > 0) {
                const html = data.data.map(item => `
                    <tr>
                        <td class="px-4 py-3">${escapeHtml(item.field_name)}</td>
                        <td class="px-4 py-3">${escapeHtml(item.field_value)}</td>
                        <td class="px-4 py-3 flex gap-2">
                            <button onclick="openEditOtherInformationModal(${item.metadata_id}, '${escapeHtml(item.field_name)}', '${escapeHtml(item.field_value)}')" class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">✏️ Edit</button>
                            <button onclick="deleteOtherInformation(${item.metadata_id})" class="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">🗑️ Delete</button>
                        </td>
                    </tr>
                `).join('');
                table.innerHTML = html;
            } else {
                table.innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center text-gray-500 text-sm">No custom information added yet</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error loading other info:', error);
            const table = document.getElementById('otherInfoTable');
            table.innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center text-gray-500 text-sm">Error loading information</td></tr>';
        });
}

function removeCoordinatorFromEvent(coordinatorId, eventId) {
    if (!confirm('Are you sure you want to remove this coordinator from the event?')) {
        return;
    }
    
    fetch(`${API_BASE}/events.php?action=assign_coordinator&event_id=${eventId}`, {
        method: 'PUT',
        headers: getUserHeaders(),
        body: JSON.stringify({
            coordinator_id: null
        })
    })
        .then(response => response.text())
        .then(responseText => {
            const data = JSON.parse(responseText);
            
            if (data.success) {
                // Refresh the coordinator list
                loadCoordinators(currentEventId);
                showNotification('Coordinator removed successfully', 'success');
            } else {
                showNotification(data.message || 'Failed to remove coordinator', 'error');
            }
        })
        .catch(error => {
            console.error('Error removing coordinator:', error);
            showNotification('Error removing coordinator', 'error');
        });
}

// Note: The actual loadAttendees() function is defined later in the file (line 2252)
// It uses the newer implementation with renderAttendees()

function generateAttendeesTable(attendees) {
    let html = '<table class="event-table"><thead><tr><th>NO.</th><th>FULL NAME</th><th>EMAIL ADDRESS</th><th>DEPARTMENT</th><th>CONTACT NUMBER</th><th>REG CODE</th><th>ACTION</th></tr></thead><tbody>';
    
    attendees.forEach((attendee, index) => {
        const attendeeId = attendee.registration_id || attendee.user_id;
        const regCode = attendee.registration_code || '';
        const isAttended = attendee.status === 'ATTENDED';
        const rowNumber = index + 1;
        
        html += `<tr>
            <td>${rowNumber}</td>
            <td>${escapeHtml(attendee.full_name || attendee.name || '-')}</td>
            <td>${escapeHtml(attendee.company || '-')}</td>
            <td>${escapeHtml(attendee.job_title || '-')}</td>
            <td>${escapeHtml(attendee.email || '-')}</td>
            <td>${escapeHtml(regCode || '-')}</td>
            <td>${escapeHtml(attendee.phone || '-')}</td>
            <td style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                <button type="button" onclick="viewAttendeeQR('${escapeHtml(regCode)}', '${escapeHtml(attendee.full_name || attendee.name || 'Attendee')}')" 
                        title="View QR Code" 
                        style="background: white; color: #2196f3; border: 1px solid #2196f3; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500;">
                    📱
                </button>
                ${!isAttended ? `<button type="button" onclick="markParticipantAsAttended(${attendeeId}, '${escapeHtml(regCode)}')" 
                        title="Mark as Attended" 
                        style="background: #4caf50; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500;">
                    ✓ Mark as Attended
                </button>` : ''}
                <button type="button" onclick="deleteParticipant(${attendeeId}, '${escapeHtml(regCode)}')" 
                        title="Delete" 
                        style="background: white; color: #f44336; border: 1px solid #f44336; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 12px; font-weight: 500;">
                    Delete
                </button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    return html;
}

// Attendee action functions
function viewAttendeeQR(registrationCode, attendeeName) {
    console.log('Viewing QR for:', registrationCode, attendeeName);
    
    if (!registrationCode) {
        alert('Registration code is missing');
        return;
    }
    
    // Generate QR code URL
    const qrContent = registrationCode || 'NO_CODE';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;
    
    console.log('QR URL:', qrUrl);
    
    // Create modal to show QR code
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000;';
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-width: 400px;">
            <h3 style="margin: 0 0 20px 0; color: #333;">${escapeHtml(attendeeName)}</h3>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 13px;">Registration Code</p>
            <img src="${qrUrl}" alt="QR Code" style="width: 300px; height: 300px; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 10px 0 20px 0; color: #333; font-size: 14px; font-weight: bold; font-family: monospace;">${escapeHtml(registrationCode)}</p>
            <button onclick="this.closest('div').parentElement.remove()" style="background: #C41E3A; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 500;">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
}

function markParticipantAsAttended(registrationId, registrationCode) {
    if (!registrationCode) {
        alert('Unable to mark as attended: missing registration code');
        return;
    }
    
    if (!confirm('Mark this participant as attended?')) return;
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            registration_code: registrationCode,
            status: 'ATTENDED'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Participant marked as attended');
            loadAttendees(currentEventId); // Refresh the attendees list
        } else {
            alert('Failed to mark as attended: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error marking participant as attended');
    });
}

function moveParticipantToInitial(registrationId, registrationCode) {
    if (!registrationCode) {
        alert('Unable to move to initial: missing registration code');
        return;
    }
    
    if (!confirm('Move this participant back to Initial List (change status to Registered)?')) return;
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            registration_code: registrationCode,
            status: 'REGISTERED'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Participant moved to Initial List');
            loadAttendees(currentEventId); // Refresh the attendees list
        } else {
            alert('Failed to move to initial: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error moving participant to initial list');
    });
}

function deleteParticipant(registrationId, registrationCode) {
    if (!confirm('Are you sure you want to delete this participant from the event?')) return;
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            registration_id: registrationId,
            registration_code: registrationCode
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Participant deleted successfully');
            loadAttendees(currentEventId); // Refresh the attendees list
        } else {
            alert('Failed to delete participant: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error deleting participant');
    });
}

// Helper function to search attendees
function searchAttendees(searchTerm) {
    const rows = document.querySelectorAll('#registeredAttendees tr, #attendedAttendees tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;
        
        // Search in name (column 1), company (column 2), job title (column 3), and email (column 4)
        const text = Array.from(cells).slice(1, 5).map(cell => cell.textContent.toLowerCase()).join(' ');
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// Helper function to export attendees
function exportAttendees() {
    alert('Export functionality coming soon');
}

// Helper function to add attendees
function addAttendees() {
    alert('Add attendees functionality coming soon');
}

function openCoordinatorModal() {
    alert('Coordinator management coming soon');
}

function openOtherInfoModal() {
    alert('Other info management coming soon');
}

// Load Dashboard Data
function loadDashboard(eventId) {
    if (!eventId) return;
    
    // Fetch event details for KPI cards
    fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardKPIs(data.data);
            }
        })
        .catch(error => console.error('Error loading dashboard:', error));
    
    // Fetch attendees for registration stats
    fetch(`${API_BASE}/participants.php?action=list&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardAttendees(data.data);
            }
        })
        .catch(error => console.error('Error loading attendees for dashboard:', error));
    
    // Fetch real tasks for the event
    fetch(`${API_BASE}/tasks.php?action=list&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardTasks(data.data);
            } else {
                updateDashboardTasks([]);
            }
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
            updateDashboardTasks([]);
        });
    
    // Initialize other dashboard sections with sample data for now
    updateDashboardEmails();
    updateDashboardProgram();
}

function updateDashboardKPIs(event) {
    // Update Registrations KPI
    const registered = event.total_registrations || 0;
    const attended = event.attended_count || 0;
    
    document.getElementById('dashRegistrations').textContent = registered;
    document.getElementById('dashRegistrationsDetail').textContent = `CHECKED IN: ${attended} (${registered > 0 ? Math.round((attended/registered)*100) : 0}%)`;
    
    // Update Budget KPI (placeholder for now)
    document.getElementById('dashBudget').textContent = '$0.00';
    document.getElementById('dashBudgetDetail').textContent = '0 EXPENSE LINE ITEMS';
    
    // Update Logistics Readiness (placeholder)
    document.getElementById('dashLogistics').textContent = '0%';
    document.getElementById('dashLogisticsDetail').textContent = '0 LOGISTICS ITEMS TRACKED';
    
    // Update KPI Actual vs Target
    const capacity = event.capacity || 100;
    document.getElementById('kpiActualVsTarget').textContent = `${attended}/${capacity}`;
}

function updateDashboardAttendees(attendees) {
    if (!attendees) return;
    
    const registered = attendees.filter(a => a.status !== 'ATTENDED').length;
    const attended = attendees.filter(a => a.status === 'ATTENDED').length;
    
    // Note: Task completion is now handled by updateDashboardTasks() using real task data
    // This function only updates the registrations KPI based on attendee data
}

function updateDashboardTasks(tasks) {
    // Initialize counters
    let taskCounts = {
        done: 0,
        inProgress: 0,
        pending: 0
    };
    
    // Count tasks by status if we have real data
    if (tasks && Array.isArray(tasks)) {
        tasks.forEach(task => {
            if (task.status === 'Done') {
                taskCounts.done++;
            } else if (task.status === 'In Progress') {
                taskCounts.inProgress++;
            } else {
                taskCounts.pending++;
            }
        });
    }
    
    const total = taskCounts.done + taskCounts.inProgress + taskCounts.pending;
    
    // Update Task Completion KPI
    const completionPercentage = total > 0 ? Math.round((taskCounts.done / total) * 100) : 0;
    document.getElementById('dashTaskCompletion').textContent = completionPercentage + '%';
    document.getElementById('dashTaskDetail').textContent = `${taskCounts.done}/${total} TASKS DONE`;
    
    // Update Task Status Mix chart with proportional bar widths
    const doneWidth = total > 0 ? (taskCounts.done / total) * 100 : 0;
    const inProgressWidth = total > 0 ? (taskCounts.inProgress / total) * 100 : 0;
    const pendingWidth = total > 0 ? (taskCounts.pending / total) * 100 : 0;
    
    document.getElementById('taskStatusList').innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span>Done</span>
                <div style="height: 8px; background: #4caf50; border-radius: 4px; width: ${doneWidth}%; min-width: 4px;"></div>
            </div>
            <span style="font-weight: 600; min-width: 30px; text-align: right;">${taskCounts.done}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span>In Progress</span>
                <div style="height: 8px; background: #ff9800; border-radius: 4px; width: ${inProgressWidth}%; min-width: 4px;"></div>
            </div>
            <span style="font-weight: 600; min-width: 30px; text-align: right;">${taskCounts.inProgress}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span>Pending</span>
                <div style="height: 8px; background: #9e9e9e; border-radius: 4px; width: ${pendingWidth}%; min-width: 4px;"></div>
            </div>
            <span style="font-weight: 600; min-width: 30px; text-align: right;">${taskCounts.pending}</span>
        </div>
    `;
    
    document.getElementById('taskStatusTotal').textContent = `${total} total tasks`;
    
    // Top Cost Drivers (sample data for now - can be connected to a budget table later)
    document.getElementById('costDriversList').innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
            <span>Hall Rental</span>
            <span style="font-weight: 600;">$4,200.00</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
            <span>Lunch Pack</span>
            <span style="font-weight: 600;">$3,960.00</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Badge Printing</span>
            <span style="font-weight: 600;">$420.00</span>
        </div>
    `;
    
    document.getElementById('costDriversTotal').textContent = '3 shown';
}

function updateDashboardEmails() {
    // Sample email activity data
    const emails = {
        sent: 3,
        scheduled: 1,
        draft: 2
    };
    
    const total = emails.sent + emails.scheduled + emails.draft;
    
    document.getElementById('emailActivityList').innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span>Sent</span>
                <div style="height: 8px; background: #2196f3; border-radius: 4px; flex: 1;"></div>
            </div>
            <span style="font-weight: 600; min-width: 30px; text-align: right;">${emails.sent}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span>Scheduled</span>
                <div style="height: 8px; background: #9c27b0; border-radius: 4px; flex: 1;"></div>
            </div>
            <span style="font-weight: 600; min-width: 30px; text-align: right;">${emails.scheduled}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span>Draft</span>
                <div style="height: 8px; background: #bdbdbd; border-radius: 4px; flex: 1;"></div>
            </div>
            <span style="font-weight: 600; min-width: 30px; text-align: right;">${emails.draft}</span>
        </div>
    `;
    
    document.getElementById('emailActivityTotal').textContent = `${total} total sends`;
}

function updateDashboardProgram() {
    // Sample program coverage data
    const program = {
        milestones: 3,
        flowSlots: 4
    };
    
    const total = program.milestones + program.flowSlots;
    
    document.getElementById('programCoverageList').innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span>Timeline Milestones</span>
                <div style="height: 8px; background: #ff9800; border-radius: 4px; flex: 1;"></div>
            </div>
            <span style="font-weight: 600; min-width: 30px; text-align: right;">${program.milestones}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <span>Program Flow Slots</span>
                <div style="height: 8px; background: #00bcd4; border-radius: 4px; flex: 1;"></div>
            </div>
            <span style="font-weight: 600; min-width: 30px; text-align: right;">${program.flowSlots}</span>
        </div>
    `;
    
    document.getElementById('programCoverageTotal').textContent = `${total} entries`;
}
function editEvent() {
    // Load current event data into the form and open edit modal
    console.log('🔧 Opening edit modal for event ID:', currentEventId);
    loadEventDataIntoEditForm();
    
    // Open the modal after a brief delay to ensure data is loaded
    setTimeout(() => {
        const modal = document.getElementById('editEventModal');
        modal.style.display = 'flex';
        modal.style.alignItems = 'flex-start';
        modal.style.justifyContent = 'center';
        document.body.style.overflow = 'hidden';
        console.log('✓ Edit modal opened');
    }, 300);
}

function deleteEvent() {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        fetch(`${API_BASE}/events.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
            body: JSON.stringify({ event_id: currentEventId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Event deleted successfully');
                window.location.href = 'index.html?page=events';
            } else {
                alert('Failed to delete event: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting event');
        });
    }
}

// Edit Event Modal Functions
function closeEditEventModal() {
    document.getElementById('editEventModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('editEventForm').reset();
}

function loadEventDataIntoEditForm() {
    // Load current event data from the page into the form
    console.log('📋 Loading event data for ID:', currentEventId);
    
    fetch(`${API_BASE}/events.php?action=detail&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            console.log('📥 Event data received:', data);
            
            if (data.success && data.data) {
                const event = data.data;
                
                // Set the hidden event ID field
                document.getElementById('editEventId').value = event.event_id;
                console.log('✓ Event ID set to:', event.event_id);
                
                // Populate form fields
                document.getElementById('editEventTitle').value = event.event_name || '';
                document.getElementById('editEventDate').value = event.event_date || '';
                document.getElementById('editEventCapacity').value = event.capacity || '';
                document.getElementById('editStartTime').value = event.start_time || '';
                document.getElementById('editEndTime').value = event.end_time || '';
                document.getElementById('editEventLocation').value = event.location || '';
                document.getElementById('editEventDescription').value = event.description || '';
                
                console.log('✓ All form fields populated');
                
                // Display current image if available
                const imagePreview = document.getElementById('editEventImagePreview');
                if (event.image_url) {
                    const imageUrl = getImageUrl(event.image_url);
                    console.log('🖼️ Loading image:', imageUrl);
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = 'Event Image';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    imagePreview.innerHTML = '';
                    imagePreview.appendChild(img);
                } else {
                    imagePreview.innerHTML = '<span style="color: #999; text-align: center;">📷 No image</span>';
                }
                
                // Add image preview update listener
                attachImagePreviewListener();
                console.log('✓ Event form loaded and ready');
            } else {
                alert('Failed to load event data: ' + (data.message || 'Unknown error'));
                console.error('❌ Failed to load event:', data);
            }
        })
        .catch(error => {
            console.error('❌ Error loading event:', error);
            alert('Error loading event data: ' + error.message);
        });
}

function attachImagePreviewListener() {
    const fileInput = document.getElementById('editEventImage');
    // Clone to remove old event listeners
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    // Add new listener to the cloned element
    const freshFileInput = document.getElementById('editEventImage');
    freshFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imagePreview = document.getElementById('editEventImagePreview');
                const img = document.createElement('img');
                img.src = event.target.result;
                img.alt = 'Event Image Preview';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

function handleEditEventSubmit(event) {
    event.preventDefault();
    
    // Use currentEventId as backup
    const eventId = document.getElementById('editEventId').value || currentEventId;
    
    if (!eventId) {
        alert('Error: Event ID not found. Please refresh and try again.');
        console.error('❌ Event ID is missing. editEventId:', document.getElementById('editEventId').value, 'currentEventId:', currentEventId);
        return;
    }
    
    console.log('💾 Saving event ID:', eventId);
    
    const submitBtn = document.getElementById('editEventSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    // Check if an image file is being uploaded
    const imageInput = document.getElementById('editEventImage');
    const hasNewImage = imageInput.files && imageInput.files[0];
    
    let fetchOptions = {
        method: 'PUT',
        headers: getUserHeaders()
    };
    
    if (hasNewImage) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('event_id', eventId);
        formData.append('event_name', document.getElementById('editEventTitle').value);
        formData.append('event_date', document.getElementById('editEventDate').value);
        formData.append('capacity', document.getElementById('editEventCapacity').value);
        formData.append('start_time', document.getElementById('editStartTime').value);
        formData.append('end_time', document.getElementById('editEndTime').value);
        formData.append('location', document.getElementById('editEventLocation').value);
        formData.append('description', document.getElementById('editEventDescription').value);
        formData.append('image', imageInput.files[0]);
        
        fetchOptions.body = formData;
        
        console.log('📤 Sending FormData with image:', imageInput.files[0].name);
    } else {
        // Use JSON for text-only update
        const jsonData = {
            event_id: eventId,
            event_name: document.getElementById('editEventTitle').value,
            event_date: document.getElementById('editEventDate').value,
            capacity: document.getElementById('editEventCapacity').value,
            start_time: document.getElementById('editStartTime').value,
            end_time: document.getElementById('editEndTime').value,
            location: document.getElementById('editEventLocation').value,
            description: document.getElementById('editEventDescription').value
        };
        
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(jsonData);
        
        console.log('📤 Sending JSON data:', jsonData);
    }
    
    fetch(`${API_BASE}/events.php`, fetchOptions)
    .then(response => response.json())
    .then(data => {
        console.log('📥 Response from server:', data);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
        if (data.success) {
            alert('✓ Event updated successfully');
            closeEditEventModal();
            // Reload event details
            loadEventDetails();
        } else {
            alert('❌ Failed to update event: ' + (data.message || 'Unknown error'));
            console.error('Update failed:', data);
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        alert('Error updating event: ' + error.message);
    });
}

function formatEventDateTime(date, startTime, endTime) {
    const formattedDate = formatDate(date);
    const start = convert24To12Hour(startTime);
    const end = convert24To12Hour(endTime);
    return `${formattedDate}, ${start} - ${end}`;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function getEventStatus(eventDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(eventDate);
    date.setHours(0, 0, 0, 0);
    
    if (date < today) return 'Past';
    if (date.getTime() === today.getTime()) return 'Today';
    return 'Upcoming';
}

function escapeHtml(text) {
    if (text === null || text === undefined || text === '') return '';
    text = String(text);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showError(message) {
    document.querySelector('.event-details-container').innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #999;">
            <p>${escapeHtml(message)}</p>
            <a href="index.html?page=events" style="color: #C41E3A; text-decoration: none; font-weight: 600;">← Back to Events</a>
        </div>
    `;
}
// ============ LOGOUT FUNCTIONS ============
function logout() {
    // Show the logout confirmation modal if it exists
    const logoutModal = document.getElementById('logoutConfirmModal');
    if (logoutModal) {
        logoutModal.style.display = 'block';
    } else {
        // If modal doesn't exist, proceed directly with logout
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
    
    // Log logout to admin_login_logs
    if (admin && admin.admin_id) {
        fetch(`${API_BASE}/admin_login.php?action=logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
            body: JSON.stringify({ admin_id: admin.admin_id })
        }).catch(error => console.log('Logout logged'));
    }
    
    // Log activity BEFORE clearing localStorage so we have admin/user data
    if (typeof logActivity === 'function') {
        logActivity('LOGOUT', 'Admin logged out');
    }
    
    // Clear all user/admin data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    localStorage.removeItem('rememberAdmin');
    localStorage.removeItem('adminLastPage');
    localStorage.removeItem('token');
    
    // Redirect to login page
    window.location.href = 'login.html';
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
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify(logData)
    })
    .catch(error => console.log('Activity logged:', actionType));
}

// ====================================================================
// TASK MANAGEMENT FUNCTIONS
// ====================================================================

function openAddTaskModal() {
    document.getElementById('taskModalTitle').textContent = 'Add Task';
    document.getElementById('taskForm').reset();
    document.getElementById('task_id').value = '';
    document.getElementById('event_id_hidden').value = currentEventId;
    document.getElementById('taskErrorMessage').style.display = 'none';
    document.getElementById('taskErrorMessage').textContent = '';
    document.getElementById('taskSubmitBtn').textContent = 'Create';
    document.getElementById('addTaskModal').style.display = 'flex';
}

function closeAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'none';
    document.getElementById('taskForm').reset();
    document.getElementById('taskErrorMessage').style.display = 'none';
}

function handleTaskFormSubmit(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('task_id').value;
    const taskName = document.getElementById('task_name').value.trim();
    const dueDate = document.getElementById('task_due_date').value;
    const partyResponsible = document.getElementById('party_responsible').value.trim();
    const status = document.getElementById('task_status').value;
    const remarks = document.getElementById('task_remarks').value.trim();
    const submitBtn = document.getElementById('taskSubmitBtn');
    const errorDiv = document.getElementById('taskErrorMessage');
    
    // Validation
    if (!taskName || !dueDate) {
        errorDiv.textContent = 'Please fill in all required fields';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (taskName.length < 3) {
        errorDiv.textContent = 'Task name must be at least 3 characters long';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Convert date from yyyy-mm-dd to mm/dd/yyyy for API
    const dateObj = new Date(dueDate + 'T00:00:00Z');
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    const year = dateObj.getUTCFullYear();
    const formattedDate = `${month}/${day}/${year}`;
    
    const payload = {
        event_id: currentEventId,
        task_name: taskName,
        due_date: formattedDate,
        party_responsible: partyResponsible,
        status: status,
        remarks: remarks
    };
    
    const isEdit = taskId !== '';
    const method = isEdit ? 'PUT' : 'POST';
    
    if (isEdit) {
        payload.task_id = taskId;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = isEdit ? 'Updating...' : 'Creating...';
    
    fetch(`${API_BASE}/tasks.php`, {
        method: method,
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            closeAddTaskModal();
            loadEventTasks();
        } else {
            errorDiv.textContent = data.message || 'Failed to save task';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = isEdit ? 'Update' : 'Create';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        errorDiv.textContent = 'Error saving task. Please try again.';
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Update' : 'Create';
    });
}

function loadEventTasks() {
    console.log('loadEventTasks() called with currentEventId:', currentEventId);
    
    // Safety check: make sure event ID exists
    if (!currentEventId) {
        console.log('No event ID available');
        return;
    }
    
    // Safety check: make sure the tasks table body element exists
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) {
        console.log('Tasks table not found');
        return;
    }
    
    console.log('Fetching tasks from API for event:', currentEventId);
    fetch(`${API_BASE}/tasks.php?action=list&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
    .then(response => {
        console.log('API response status:', response.status);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Tasks data received:', data);
        if (data.success) {
            // Store tasks for calendar view
            allTasks = data.data || [];
            console.log('Rendering', allTasks.length, 'tasks');
            renderTasksTable(data.data);
        } else {
            console.error('Error loading tasks:', data.message);
            // If table doesn't exist yet, show placeholder
            if (data.message && data.message.includes('event_tasks')) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;"><p style="margin: 0; font-size: 14px;">Tasks table not initialized. Please run the migration SQL first.</p></td></tr>';
            }
        }
    })
    .catch(error => {
        console.error('Error loading tasks:', error);
        // Show error in table
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;"><p style="margin: 0; font-size: 14px;">Error loading tasks. Check console for details.</p></td></tr>';
    });
}

function renderTasksTable(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    
    if (!tasks || tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;"><p style="margin: 0; font-size: 14px;">No tasks yet. Click "Add Task" to create one.</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = tasks.map((task, index) => {
        const dueDate = formatDate(task.due_date);
        const statusColor = {
            'Pending': '#E3F2FD',
            'In Progress': '#FFE0B2',
            'Done': '#C8E6C9'
        }[task.status] || '#f5f5f5';
        
        const statusTextColor = {
            'Pending': '#1976D2',
            'In Progress': '#F57C00',
            'Done': '#388E3C'
        }[task.status] || '#666';
        
        return `
            <tr style="border-bottom: 1px solid #e8e8e8; background: ${index % 2 === 0 ? 'white' : '#fafafa'}; transition: background 0.2s;">
                <td style="padding: 14px 15px; color: #333; font-size: 13px;">${dueDate}</td>
                <td style="padding: 14px 15px; color: #333; font-size: 13px; word-break: break-word;">${escapeHtml(task.task_name)}</td>
                <td style="padding: 14px 15px; color: #333; font-size: 13px;">${escapeHtml(task.party_responsible || '-')}</td>
                <td style="padding: 14px 15px;">
                    <span style="display: inline-block; background: ${statusColor}; color: ${statusTextColor}; padding: 5px 12px; border-radius: 3px; font-size: 12px; font-weight: 500;">
                        ${task.status}
                    </span>
                </td>
                <td style="padding: 14px 15px; color: #666; font-size: 13px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(task.remarks || '')}">${escapeHtml(task.remarks || '-')}</td>
                <td style="padding: 14px 15px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                    <button type="button" onclick="editTask(${task.task_id})" style="background: transparent; color: #3b82f6; border: none; padding: 0; cursor: pointer; font-size: 16px; line-height: 1;" title="Edit">✏️</button>
                    <button type="button" onclick="deleteTask(${task.task_id})" style="background: transparent; color: #ef5350; border: none; padding: 0; cursor: pointer; font-size: 16px; line-height: 1;" title="Delete">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function editTask(taskId) {
    fetch(`${API_BASE}/tasks.php?action=detail&task_id=${taskId}`, {
        headers: getUserHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.data) {
            const task = data.data;
            document.getElementById('taskModalTitle').textContent = 'Edit Task';
            document.getElementById('task_id').value = task.task_id;
            document.getElementById('event_id_hidden').value = currentEventId;
            document.getElementById('task_name').value = task.task_name;
            document.getElementById('task_due_date').value = convertToDateInputFormat(task.due_date);
            document.getElementById('party_responsible').value = task.party_responsible || '';
            document.getElementById('task_status').value = task.status;
            document.getElementById('task_remarks').value = task.remarks || '';
            document.getElementById('taskErrorMessage').style.display = 'none';
            document.getElementById('addTaskModal').style.display = 'flex';
            document.getElementById('taskSubmitBtn').textContent = 'Update';
        } else {
            alert('Failed to load task details');
        }
    })
    .catch(error => {
        console.error('Error loading task:', error);
        alert('Error loading task');
    });
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        fetch(`${API_BASE}/tasks.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
            body: JSON.stringify({ task_id: taskId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                loadEventTasks();
            } else {
                alert(data.message || 'Failed to delete task');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting task');
        });
    }
}

function convertToDateInputFormat(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr + 'T00:00:00Z');
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return dateStr;
    }
}

function escapeHtml(text) {
    if (text === null || text === undefined || text === '') return '';
    text = String(text);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Calendar View Functions
let calendarCurrentDate = new Date();
let allTasks = [];

function switchTasksView(view) {
    const listViewBtn = document.getElementById('tasksListViewBtn');
    const calendarViewBtn = document.getElementById('tasksCalendarViewBtn');
    const listView = document.getElementById('tasksListView');
    const calendarView = document.getElementById('tasksCalendarView');

    if (view === 'list') {
        listView.style.display = 'block';
        calendarView.style.display = 'none';
        listViewBtn.style.background = '#60a5fa';
        listViewBtn.style.color = 'white';
        calendarViewBtn.style.background = '#e5e7eb';
        calendarViewBtn.style.color = '#374151';
    } else if (view === 'calendar') {
        listView.style.display = 'none';
        calendarView.style.display = 'block';
        listViewBtn.style.background = '#e5e7eb';
        listViewBtn.style.color = '#374151';
        calendarViewBtn.style.background = '#60a5fa';
        calendarViewBtn.style.color = 'white';
        
        // Render calendar and deadline details when switching to it
        if (typeof renderMonthCalendarGrid === 'function') {
            renderMonthCalendarGrid();
        }
        if (typeof populateDeadlineDetails === 'function') {
            populateDeadlineDetails();
        }
        
        // Initialize calendar view toggle buttons
        if (typeof toggleCalendarView === 'function') {
            toggleCalendarView('month');
        }
    }
}

// Toggle between calendar month grid view and task list view
function toggleCalendarView(view) {
    const monthBtn = document.getElementById('calendarMonthBtn');
    const listBtn = document.getElementById('calendarListBtn');
    const calendarDaysContainer = document.getElementById('calendarDaysContainer');
    const monthTasksListContainer = document.getElementById('monthTasksListContainer');
    
    if (!monthTasksListContainer) {
        // Create list container if doesn't exist
        const newListContainer = document.createElement('div');
        newListContainer.id = 'monthTasksListContainer';
        newListContainer.style.cssText = `
            display: none;
            background: white;
            border-radius: 8px;
            padding: 16px 0;
        `;
        calendarDaysContainer.parentNode.insertBefore(newListContainer, calendarDaysContainer.nextSibling);
    }
    
    const listContainer = document.getElementById('monthTasksListContainer');
    
    if (view === 'month') {
        // Switch to month/grid view
        calendarDaysContainer.style.display = 'grid';
        listContainer.style.display = 'none';
        monthBtn.style.background = '#60a5fa';
        monthBtn.style.color = 'white';
        listBtn.style.background = '#e5e7eb';
        listBtn.style.color = '#374151';
    } else if (view === 'list') {
        // Switch to list view
        calendarDaysContainer.style.display = 'none';
        listContainer.style.display = 'block';
        monthBtn.style.background = '#e5e7eb';
        monthBtn.style.color = '#374151';
        listBtn.style.background = '#60a5fa';
        listBtn.style.color = 'white';
        renderMonthTasksListView();
    }
}

// Render tasks as a list for current month
function renderMonthTasksListView() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    // Get first and last day of month
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    // Filter and sort tasks for current month
    const monthTasks = allTasks.filter(task => {
        return task.due_date >= monthStart && task.due_date <= monthEnd;
    }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    const listContainer = document.getElementById('monthTasksListContainer');
    listContainer.innerHTML = '';
    
    if (monthTasks.length === 0) {
        listContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
                <p>No tasks scheduled for this month</p>
            </div>
        `;
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    `;
    
    // Add header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="border-bottom: 2px solid #e0e0e0; background: #f9f9f9;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #333;">Due Date</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #333;">Task</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #333;">Responsible</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #333;">Status</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Add rows
    const tbody = document.createElement('tbody');
    monthTasks.forEach((task, index) => {
        const row = document.createElement('tr');
        row.style.cssText = `
            border-bottom: 1px solid #e0e0e0;
            ${index % 2 === 0 ? 'background: #f9f9f9;' : ''}
        `;
        
        const date = new Date(task.due_date);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        let statusColor = '#999';
        let statusBg = '#f0f0f0';
        if (task.status === 'Pending') {
            statusColor = '#2196F3';
            statusBg = '#e3f2fd';
        } else if (task.status === 'In Progress') {
            statusColor = '#FF9800';
            statusBg = '#fff3e0';
        } else if (task.status === 'Done') {
            statusColor = '#4CAF50';
            statusBg = '#f1f8e9';
        }
        
        row.innerHTML = `
            <td style="padding: 12px; color: #555;">${formattedDate}</td>
            <td style="padding: 12px; color: #333; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(task.task_name)}</td>
            <td style="padding: 12px; color: #666;">${escapeHtml(task.party_responsible || '-')}</td>
            <td style="padding: 12px;">
                <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                    ${task.status}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    listContainer.appendChild(table);
}

// Render full month calendar grid
function renderMonthCalendarGrid() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    // Update month/year heading
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const daysContainer = document.getElementById('calendarDaysContainer');
    daysContainer.innerHTML = '';
    
    // Add empty cells for days before month starts (from previous month)
    for (let i = firstDay - 1; i >= 0; i--) {
        const emptyDay = document.createElement('div');
        const prevMonthDay = daysInPrevMonth - i;
        emptyDay.style.cssText = `
            padding: 12px;
            min-height: 70px;
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            text-align: center;
            cursor: default;
            position: relative;
        `;
        const dayText = document.createElement('div');
        dayText.style.cssText = `
            font-size: 13px;
            color: #aaa;
            font-weight: 500;
        `;
        dayText.textContent = prevMonthDay;
        emptyDay.appendChild(dayText);
        daysContainer.appendChild(emptyDay);
    }
    
    // Add actual days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        
        // Get tasks for this date
        const tasksForDate = allTasks.filter(task => task.due_date === dateStr);
        
        const dayElement = document.createElement('div');
        dayElement.style.cssText = `
            padding: 12px;
            border: 1px solid #e0e0e0;
            min-height: 70px;
            background: ${isToday ? '#e3f2fd' : 'white'};
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            display: flex;
            flex-direction: column;
        `;
        
        const dayHeader = document.createElement('div');
        dayHeader.style.cssText = `
            font-weight: ${isToday ? '700' : '600'};
            color: ${isToday ? '#1976d2' : '#333'};
            margin-bottom: 8px;
            font-size: 15px;
        `;
        dayHeader.textContent = day;
        
        const tasksList = document.createElement('div');
        tasksList.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            flex: 1;
            align-content: flex-start;
        `;
        
        if (tasksForDate.length > 0) {
            tasksForDate.slice(0, 2).forEach(task => {
                const taskItem = document.createElement('div');
                let statusColor = '#999';
                let statusBgColor = '#f0f0f0';
                if (task.status === 'Pending') {
                    statusColor = '#2196F3';
                    statusBgColor = '#e3f2fd';
                }
                if (task.status === 'In Progress') {
                    statusColor = '#FF9800';
                    statusBgColor = '#fff3e0';
                }
                if (task.status === 'Done') {
                    statusColor = '#4CAF50';
                    statusBgColor = '#f1f8e9';
                }
                
                taskItem.style.cssText = `
                    font-size: 11px;
                    padding: 3px 6px;
                    background: ${statusBgColor};
                    color: ${statusColor};
                    border-radius: 3px;
                    border-left: 3px solid ${statusColor};
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-weight: 600;
                    display: block;
                    width: 100%;
                `;
                taskItem.textContent = task.task_name.substring(0, 20);
                taskItem.title = task.task_name;
                tasksList.appendChild(taskItem);
            });
            
            if (tasksForDate.length > 2) {
                const more = document.createElement('div');
                more.style.cssText = `
                    font-size: 10px;
                    color: #666;
                    font-weight: 600;
                    padding: 0 6px;
                `;
                more.textContent = `+${tasksForDate.length - 2} more`;
                tasksList.appendChild(more);
            }
        }
        
        dayElement.appendChild(dayHeader);
        dayElement.appendChild(tasksList);
        
        // Add click handler to show tasks for this date
        dayElement.addEventListener('click', function() {
            const date = new Date(year, month, day);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
            displayDeadlinesForDate(dateStr, formattedDate);
        });
        
        dayElement.addEventListener('mouseover', function() {
            this.style.background = isToday ? '#e3f2fd' : '#f9f9f9';
            this.style.borderColor = '#2196F3';
            this.style.boxShadow = '0 0 0 1px #2196F3';
        });
        dayElement.addEventListener('mouseout', function() {
            this.style.background = isToday ? '#e3f2fd' : 'white';
            this.style.borderColor = '#e0e0e0';
            this.style.boxShadow = 'none';
        });
        
        daysContainer.appendChild(dayElement);
    }
    
    // Add empty cells for remaining days (next month)
    const totalCells = firstDay + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.style.cssText = `
            padding: 12px;
            min-height: 70px;
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            text-align: center;
            cursor: default;
            position: relative;
        `;
        const dayText = document.createElement('div');
        dayText.style.cssText = `
            font-size: 13px;
            color: #aaa;
            font-weight: 500;
        `;
        dayText.textContent = i;
        emptyDay.appendChild(dayText);
        daysContainer.appendChild(emptyDay);
    }
    
    // Update deadline details list
    populateDeadlineDetails();
}

// Render list view of all tasks for the current month
function renderMonthTasksList() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    // Filter tasks for current month
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    const monthTasks = allTasks.filter(task => {
        return task.due_date >= monthStart && task.due_date <= monthEnd;
    }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    const listContent = document.getElementById('monthTasksListContent');
    
    if (monthTasks.length === 0) {
        listContent.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center; padding: 20px 0;">No tasks in this month</p>';
        return;
    }
    
    listContent.innerHTML = '';
    monthTasks.forEach(task => {
        const taskEl = document.createElement('div');
        
        // Status color mapping
        let statusColor = '#f0f0f0';
        if (task.status === 'Pending') statusColor = '#ffc107';
        if (task.status === 'In Progress') statusColor = '#2196f3';
        if (task.status === 'Done') statusColor = '#4caf50';
        
        // Format date
        const dateObj = new Date(task.due_date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        taskEl.style.cssText = `
            padding: 14px;
            border-left: 4px solid ${statusColor};
            background: #f8f8f8;
            margin-bottom: 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        taskEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <p style="margin: 0 0 6px 0; color: #333; font-weight: 500; font-size: 13px;">${escapeHtml(task.task_name)}</p>
                    <p style="margin: 0 0 4px 0; color: #999; font-size: 12px;">${dateStr}</p>
                    <span style="display: inline-block; padding: 2px 8px; background: ${statusColor}; color: white; border-radius: 3px; font-size: 11px; font-weight: 500;">${escapeHtml(task.status)}</span>
                </div>
                <div style="display: flex; gap: 6px;">
                    <button type="button" onclick="editTask(${task.task_id})" style="background: none; border: none; color: #2196f3; cursor: pointer; font-weight: 500; font-size: 12px; padding: 4px 8px;">Edit</button>
                    <button type="button" onclick="deleteTask(${task.task_id})" style="background: none; border: none; color: #f44336; cursor: pointer; font-weight: 500; font-size: 12px; padding: 4px 8px;">Delete</button>
                </div>
            </div>
        `;
        
        taskEl.addEventListener('mouseover', function() {
            this.style.background = '#e8e8e8';
        });
        taskEl.addEventListener('mouseout', function() {
            this.style.background = '#f8f8f8';
        });
        
        listContent.appendChild(taskEl);
    });
}

function previousMonth()  {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
    const view = document.getElementById('calendarMonthViewContainer').style.display === 'none' ? 'list' : 'month';
    switchCalendarView(view);
}

function nextMonth() {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
    const view = document.getElementById('calendarMonthViewContainer').style.display === 'none' ? 'list' : 'month';
    switchCalendarView(view);
}

function goToToday() {
    calendarCurrentDate = new Date();
    const view = document.getElementById('calendarMonthViewContainer').style.display === 'none' ? 'list' : 'month';
    switchCalendarView(view);
}

function renderCalendar() {
    // Get the start of the week (Sunday)
    const date = new Date(calendarCurrentDate);
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date.setDate(diff));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Update week range display
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = monthNames[weekStart.getMonth()];
    const endMonth = monthNames[weekEnd.getMonth()];
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const year = weekEnd.getFullYear();
    
    let weekDisplay = `${startMonth} ${startDay}`;
    if (weekStart.getMonth() !== weekEnd.getMonth()) {
        weekDisplay += ` – ${endMonth} ${endDay}`;
    } else {
        weekDisplay += ` – ${endDay}`;
    }
    weekDisplay += `, ${year}`;
    
    document.getElementById('calendarWeekRange').textContent = weekDisplay;
    
    const container = document.getElementById('calendarDaysContainer');
    container.innerHTML = '';
    
    // Add 7 days for the week
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + i);
        const dayNum = dayDate.getDate();
        const dateObj = {
            year: dayDate.getFullYear(),
            month: dayDate.getMonth(),
            day: dayNum
        };
        const dayEl = createCalendarDayElement(dayNum, dateObj, false);
        container.appendChild(dayEl);
    }
    
    // Update pending tasks list
    populatePendingTasks();
}

function createCalendarDayElement(day, dateObj, isOtherMonth) {
    const div = document.createElement('div');
    div.style.cssText = `
        padding: 12px;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
        min-height: 80px;
        background: ${isOtherMonth ? '#fafafa' : 'white'};
        color: ${isOtherMonth ? '#ccc' : '#333'};
        font-weight: ${isOtherMonth ? '400' : '500'};
        cursor: ${isOtherMonth ? 'default' : 'pointer'};
        position: relative;
        transition: all 0.2s;
    `;
    
    // Add day number
    const dayNum = document.createElement('div');
    dayNum.textContent = day;
    dayNum.style.cssText = 'font-size: 14px; font-weight: 600; margin-bottom: 6px;';
    div.appendChild(dayNum);
    
    // Highlight today
    if (!isOtherMonth && dateObj) {
        const today = new Date();
        if (dateObj.day === today.getDate() && 
            dateObj.month === today.getMonth() && 
            dateObj.year === today.getFullYear()) {
            div.style.background = '#e3f2fd';
            div.style.border = '2px solid #1976d2';
        }
    }
    
    // Add task indicators for this day
    if (!isOtherMonth && dateObj) {
        const dateStr = `${dateObj.year}-${String(dateObj.month + 1).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
        const tasksOnDay = allTasks.filter(task => task.due_date === dateStr);
        
        if (tasksOnDay.length > 0) {
            const taskIndicators = document.createElement('div');
            taskIndicators.style.cssText = 'margin-top: 6px; display: flex; gap: 3px; flex-wrap: wrap;';
            
            tasksOnDay.slice(0, 3).forEach(task => {
                const indicator = document.createElement('div');
                const statusColor = {
                    'Pending': '#ff9800',
                    'In Progress': '#2196f3',
                    'Done': '#4caf50'
                }[task.status] || '#999';
                
                indicator.style.cssText = `
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: ${statusColor};
                    display: inline-block;
                `;
                taskIndicators.appendChild(indicator);
            });
            
            if (tasksOnDay.length > 3) {
                const moreText = document.createElement('span');
                moreText.textContent = '+' + (tasksOnDay.length - 3);
                moreText.style.cssText = 'font-size: 10px; color: #999; margin-left: 3px;';
                taskIndicators.appendChild(moreText);
            }
            
            div.appendChild(taskIndicators);
        }
        
        div.onmouseover = () => {
            if (!isOtherMonth) div.style.background = '#f9f9f9';
        };
        div.onmouseout = () => {
            const today = new Date();
            if (dateObj.day === today.getDate() && 
                dateObj.month === today.getMonth() && 
                dateObj.year === today.getFullYear()) {
                div.style.background = '#e3f2fd';
            } else {
                div.style.background = 'white';
            }
        };
    }
    
    return div;
}

function populateDeadlineDetails() {
    const container = document.getElementById('deadlineDetailsContainer');
    const countEl = document.getElementById('deadlineCount');
    
    // Sort all tasks by due date (nearest first)
    const sortedTasks = [...allTasks].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    if (sortedTasks.length === 0) {
        countEl.textContent = 'No deadlines found';
        container.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center; padding: 20px 0;">No tasks yet</p>';
        return;
    }
    
    countEl.innerHTML = `${sortedTasks.length} ${sortedTasks.length === 1 ? 'deadline' : 'deadlines'} found`;
    renderDeadlineTasksList(sortedTasks);
}

function displayDeadlinesForDate(dateStr, formattedDate) {
    const countEl = document.getElementById('deadlineCount');
    
    // Get tasks for this specific date
    const tasksForDate = allTasks.filter(task => task.due_date === dateStr);
    
    if (tasksForDate.length === 0) {
        countEl.innerHTML = `<strong>${formattedDate}</strong><br><span style="font-size: 12px; color: #999;">No tasks on this date</span>`;
        const container = document.getElementById('deadlineDetailsContainer');
        container.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center; padding: 20px 0;">No tasks scheduled for this date</p>';
        return;
    }
    
    countEl.innerHTML = `<strong>${formattedDate}</strong><br><span style="font-size: 12px; color: #666;">${tasksForDate.length} ${tasksForDate.length === 1 ? 'task' : 'tasks'}</span>`;
    renderDeadlineTasksList(tasksForDate);
}

function renderDeadlineTasksList(tasks) {
    const container = document.getElementById('deadlineDetailsContainer');
    container.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center; padding: 20px 0;">No tasks to display</p>';
        return;
    }
    
    // Get today's date for highlighting
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    tasks.forEach((task, index) => {
        const taskEl = document.createElement('div');
        const statusColor = {
            'Pending': '#2196F3',
            'In Progress': '#FF9800',
            'Done': '#4CAF50'
        }[task.status] || '#999';
        
        const statusBgColor = {
            'Pending': '#e3f2fd',
            'In Progress': '#fff3e0',
            'Done': '#f1f8e9'
        }[task.status] || '#f9f9f9';
        
        const isToday = task.due_date === todayStr;
        const daysUntilDue = Math.ceil((new Date(task.due_date + 'T00:00:00Z') - today) / (1000 * 60 * 60 * 24));
        
        const date = new Date(task.due_date + 'T00:00:00Z');
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        taskEl.style.cssText = `
            padding: 12px;
            background: ${statusBgColor};
            border-left: 4px solid ${statusColor};
            border-radius: 6px;
            margin-bottom: 12px;
        `;
        
        let dueBadge = '';
        if (isToday) {
            dueBadge = '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; margin-left: 4px; display: inline-block;">TODAY</span>';
        } else if (daysUntilDue === 1) {
            dueBadge = '<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; margin-left: 4px; display: inline-block;">TOMORROW</span>';
        } else if (daysUntilDue > 0 && daysUntilDue <= 3) {
            dueBadge = `<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; margin-left: 4px; display: inline-block;">IN ${daysUntilDue}D</span>`;
        } else if (daysUntilDue < 0) {
            dueBadge = `<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; margin-left: 4px; display: inline-block;">OVERDUE</span>`;
        }
        
        // Task name - bold and prominent
        const taskNameEl = document.createElement('div');
        taskNameEl.style.cssText = `
            font-weight: 700;
            color: #333;
            font-size: 13px;
            margin-bottom: 6px;
            word-break: break-word;
        `;
        taskNameEl.textContent = task.task_name;
        taskEl.appendChild(taskNameEl);
        
        // Date and urgency badges
        const dateAndBadgeEl = document.createElement('div');
        dateAndBadgeEl.style.cssText = `
            display: flex;
            gap: 4px;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 6px;
            font-size: 11px;
        `;
        
        const dateSpan = document.createElement('span');
        dateSpan.style.cssText = `color: ${statusColor}; font-weight: 600;`;
        dateSpan.textContent = formattedDate;
        dateAndBadgeEl.appendChild(dateSpan);
        
        if (dueBadge) {
            dateAndBadgeEl.innerHTML += dueBadge;
        }
        taskEl.appendChild(dateAndBadgeEl);
        
        // Status badge
        const statusEl = document.createElement('div');
        statusEl.style.cssText = `
            display: inline-block;
            background: ${statusColor};
            color: white;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 6px;
        `;
        statusEl.textContent = task.status;
        taskEl.appendChild(statusEl);
        
        // Responsible party
        if (task.party_responsible) {
            const respEl = document.createElement('div');
            respEl.style.cssText = `
                font-size: 11px;
                color: #666;
                margin-top: 6px;
                margin-bottom: 4px;
            `;
            respEl.innerHTML = `👤 <strong>${escapeHtml(task.party_responsible)}</strong>`;
            taskEl.appendChild(respEl);
        }
        
        // Remarks
        if (task.remarks) {
            const remarksEl = document.createElement('div');
            remarksEl.style.cssText = `
                margin-top: 6px;
                font-size: 11px;
                color: #666;
                padding: 6px;
                background: white;
                border-radius: 3px;
                border-left: 2px solid ${statusColor};
            `;
            remarksEl.textContent = `"${task.remarks}"`;
            taskEl.appendChild(remarksEl);
        }
        
        container.appendChild(taskEl);
    });
}

// ====================================================================
// NEW TAB STUB FUNCTIONS (KPI, Emails, Program, Marketing, Logistics, Finance, Postmortem)
// ====================================================================

function addCoordinator() {
    alert('Coordinator search functionality coming soon');
}

function addOtherInfo() {
    openCreateOtherInformationModal(currentEventId);
}

function loadKPIData(eventId) {
    // Load KPI data for the KPI tab
    if (!eventId) return;
    
    // Placeholder for future KPI implementation
    // Will load metrics and update the KPI tab with real data
}

function loadEmailsData(eventId) {
    // Load email campaign data for the Emails tab
    if (!eventId) return;
    
    // Placeholder - will eventually fetch email campaigns from API
    const campaignsTable = document.getElementById('emailCampaignsTable');
    if (campaignsTable && campaignsTable.parentElement) {
        campaignsTable.innerHTML = '<tr><td colspan="7" class="empty-message">No email campaigns created yet</td></tr>';
    }
}

function loadProgramData(eventId) {
    // Load program items for the Program tab
    if (!eventId) return;
    
    // Placeholder - will eventually fetch program items from API
    const programTable = document.getElementById('programItemsTable');
    if (programTable && programTable.parentElement) {
        programTable.innerHTML = '<tr><td colspan="6" class="empty-message">No program items created yet</td></tr>';
    }
}

function loadMarketingData(eventId) {
    // Load marketing data for the Marketing tab
    if (!eventId) return;
    
    // Placeholder - will eventually fetch marketing data from API
}

function loadLogisticsData(eventId) {
    // Load logistics data for the Logistics tab
    if (!eventId) return;
    
    // Placeholder - will eventually fetch logistics data from API
    const logisticsTable = document.getElementById('logisticsTable');
    if (logisticsTable && logisticsTable.parentElement) {
        logisticsTable.innerHTML = '<tr><td colspan="6" class="empty-message">No logistics items created</td></tr>';
    }
}

function loadFinanceData(eventId) {
    // Load finance data for the Finance tab
    if (!eventId) return;
    
    // Placeholder - will eventually fetch budget and expense data from API
    const expensesTable = document.getElementById('financeExpensesTable');
    if (expensesTable && expensesTable.parentElement) {
        expensesTable.innerHTML = '<tr><td colspan="6" class="empty-message">No expense items added</td></tr>';
    }
}

function loadPostmortemData(eventId) {
    // Load postmortem data for the Postmortem tab
    if (!eventId) return;
    
    // Placeholder - will eventually fetch feedback and postmortem data from API
}

// ============= ATTENDEES MANAGEMENT =============

function loadAttendees() {
    if (!currentEventId) {
        console.warn('loadAttendees: No currentEventId set');
        return;
    }
    
    console.log('📋 Loading attendees for event:', currentEventId);
    
    fetch(`${API_BASE}/participants.php?action=list&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
    .then(response => {
        console.log('📋 Attendees API response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('📋 Attendees API data:', data);
        if (data.success && Array.isArray(data.data)) {
            console.log('✓ Loaded', data.data.length, 'total attendees');
            
            // Separate attendees by status
            attendeesData.initial = data.data.filter(a => !a.attended || a.status !== 'ATTENDED');
            attendeesData.actual = data.data.filter(a => a.attended || a.status === 'ATTENDED');
            
            console.log('✓ Initial List:', attendeesData.initial.length, '| Actual Attendees:', attendeesData.actual.length);
            
            renderAttendees();
        } else {
            console.error('❌ Failed to load attendees:', data.message || 'No data returned');
            // Still render empty state
            attendeesData.initial = [];
            attendeesData.actual = [];
            renderAttendees();
        }
    })
    .catch(error => {
        console.error('❌ Error loading attendees:', error);
        // Still render empty state
        attendeesData.initial = [];
        attendeesData.actual = [];
        renderAttendees();
    });
}

function renderAttendees() {
    console.log('🎨 Rendering attendees...');
    
    // Check if attendees tab is visible
    const attendeesTab = document.getElementById('attendees');
    if (attendeesTab) {
        console.log('✓ Attendees tab found. Display:', window.getComputedStyle(attendeesTab).display, 'Has active class:', attendeesTab.classList.contains('active'));
    } else {
        console.error('❌ Attendees tab element not found!');
    }
    
    const initialBody = document.getElementById('initialListBody');
    const actualBody = document.getElementById('actualAttendeesBody');
    
    if (!initialBody || !actualBody) {
        console.error('❌ Attendees table elements not found! initialBody:', initialBody, 'actualBody:', actualBody);
        return;
    }
    
    console.log('✓ Found attendees table elements');
    console.log('✓ initialListBody display:', window.getComputedStyle(initialBody).display);
    console.log('✓ actualAttendeesBody display:', window.getComputedStyle(actualBody).display);
    
    // Update counts
    const initialCountEl = document.getElementById('initialCount');
    const actualCountEl = document.getElementById('actualCount');
    
    if (initialCountEl) initialCountEl.textContent = attendeesData.initial.length;
    if (actualCountEl) actualCountEl.textContent = attendeesData.actual.length;
    
    console.log('✓ Updated counts: Initial=' + attendeesData.initial.length + ', Actual=' + attendeesData.actual.length);
    
    // Helper function to get field value with fallback - ALWAYS returns string
    const getField = (obj, field) => {
        const val = obj[field];
        // Convert to string, handle null/undefined/false/0
        if (val === null || val === undefined) return '';
        return String(val).trim();
    };
    
    // Helper function to render attendee row
    const renderAttendeeRow = (attendee, index, showUnmarkBtn) => {
        const regId = attendee.registration_id || attendee.id;
        const regCode = attendee.registration_code || '';
        
        return `
            <tr style="border-bottom: 1px solid #e8e8e8; background: ${index % 2 === 0 ? 'white' : '#fafafa'}; height: 60px;">
                <td style="padding: 15px; color: #333; font-size: 13px;">${index + 1}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'full_name'))}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'company'))}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'job_title'))}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'email'))}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'employee_code'))}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'phone'))}</td>
                <td style="padding: 15px; text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="showQRCode('${escapeHtml(regCode)}')" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px;" title="View QR Code">📱</button>
                        ${showUnmarkBtn ? `<button onclick="markAttendeeAsInitial('${escapeHtml(regId)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #FF9800;" title="Mark as Initial">↩</button>` : `<button onclick="markAttendeeAsAttended('${escapeHtml(regId)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #4CAF50;" title="Mark as Attended">✓</button>`}
                        <button onclick="deleteAttendee('${escapeHtml(regId)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #f44336;" title="Delete">🗑</button>
                    </div>
                </td>
            </tr>
        `;
    };
    
    // Render initial list
    if (attendeesData.initial.length === 0) {
        console.log('ℹ Initial list is empty');
        initialBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999; font-size: 14px;">No registered participants yet</td></tr>';
    } else {
        console.log('✓ Rendering ' + attendeesData.initial.length + ' initial attendees');
        initialBody.innerHTML = attendeesData.initial.map((attendee, index) => {
            return renderAttendeeRow(attendee, index, false);
        }).join('');
    }
    
    // Render actual attendees
    if (attendeesData.actual.length === 0) {
        console.log('ℹ Actual attendees list is empty');
        actualBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999; font-size: 14px;">No attendees marked yet</td></tr>';
    } else {
        console.log('✓ Rendering ' + attendeesData.actual.length + ' actual attendees');
        actualBody.innerHTML = attendeesData.actual.map((attendee, index) => {
            return renderAttendeeRow(attendee, index, true);
        }).join('');
    }
    
    console.log('✓ Attendees rendering complete');
    
    // Ensure Initial List tab is shown by default
    switchAttendeesTab('initial');
}

function switchAttendeesTab(tab) {
    const initialBtn = document.getElementById('initialListBtn');
    const actualBtn = document.getElementById('actualAttendeesBtn');
    const initialContent = document.getElementById('initialListContent');
    const actualContent = document.getElementById('actualAttendeesContent');
    
    console.log('📋 switchAttendeesTab called with:', tab);
    console.log('initialContent:', initialContent ? 'FOUND' : 'NOT FOUND');
    console.log('actualContent:', actualContent ? 'FOUND' : 'NOT FOUND');
    
    if (tab === 'initial') {
        // Style Initial List button as active
        initialBtn.className = 'px-6 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap';
        // Style Actual Attendees button as inactive
        actualBtn.className = 'px-6 py-2 font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-md transition-colors whitespace-nowrap';
        // Show Initial List content
        initialContent.setAttribute('style', 'display: block !important;');
        actualContent.setAttribute('style', 'display: none !important;');
        console.log('✓ Switched to Initial List tab - initialContent display:', initialContent.style.display, 'actualContent display:', actualContent.style.display);
    } else if (tab === 'actual') {
        // Style Initial List button as inactive
        initialBtn.className = 'px-6 py-2 font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-md transition-colors whitespace-nowrap';
        // Style Actual Attendees button as active
        actualBtn.className = 'px-6 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap';
        // Show Actual Attendees content
        initialContent.setAttribute('style', 'display: none !important;');
        actualContent.setAttribute('style', 'display: block !important;');
        console.log('✓ Switched to Actual Attendees tab - initialContent display:', initialContent.style.display, 'actualContent display:', actualContent.style.display);
    }
}

function markAttendeeAsAttended(registrationId, index) {
    // Move from initial to actual
    const attendee = attendeesData.initial.find(a => 
        (a.registration_id === registrationId || a.id === registrationId)
    );
    
    if (!attendee) {
        alert('Attendee not found');
        return;
    }
    
    // Update API
    fetch(`${API_BASE}/participants.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            registration_id: registrationId,
            status: 'ATTENDED'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Move attendee from initial to actual
            attendeesData.initial = attendeesData.initial.filter(a => 
                a.registration_id !== registrationId && a.id !== registrationId
            );
            attendee.status = 'ATTENDED';
            attendee.attended = true;
            attendeesData.actual.push(attendee);
            
            renderAttendees();
        } else {
            alert(data.message || 'Failed to mark attendee as attended');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error marking attendee as attended');
    });
}

function markAttendeeAsInitial(registrationId, index) {
    // Move from actual back to initial
    const attendee = attendeesData.actual.find(a => 
        (a.registration_id === registrationId || a.id === registrationId)
    );
    
    if (!attendee) {
        alert('Attendee not found');
        return;
    }
    
    // Update API
    fetch(`${API_BASE}/participants.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            registration_id: registrationId,
            status: 'REGISTERED'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Move attendee from actual back to initial
            attendeesData.actual = attendeesData.actual.filter(a => 
                a.registration_id !== registrationId && a.id !== registrationId
            );
            attendee.status = 'REGISTERED';
            attendee.attended = false;
            attendeesData.initial.push(attendee);
            
            renderAttendees();
        } else {
            alert(data.message || 'Failed to mark attendee as initial');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error marking attendee as initial');
    });
}

function deleteAttendee(registrationId, index) {
    if (!confirm('Are you sure you want to delete this attendee?')) {
        return;
    }
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            registration_id: registrationId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove from both lists
            attendeesData.initial = attendeesData.initial.filter(a => 
                a.registration_id !== registrationId && a.id !== registrationId
            );
            attendeesData.actual = attendeesData.actual.filter(a => 
                a.registration_id !== registrationId && a.id !== registrationId
            );
            
            renderAttendees();
        } else {
            alert(data.message || 'Failed to delete attendee');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error deleting attendee');
    });
}

function searchAttendees(searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    
    // Helper function to get field value
    const getField = (obj, field) => {
        return (obj[field] || '').toLowerCase();
    };
    
    // Helper function to render attendee row
    const renderAttendeeRow = (attendee, index, showUnmarkBtn) => {
        const regId = attendee.registration_id || attendee.id;
        const regCode = attendee.registration_code || '';
        
        return `
            <tr style="border-bottom: 1px solid #e8e8e8; background: ${index % 2 === 0 ? 'white' : '#fafafa'}; height: 60px;">
                <td style="padding: 15px; color: #333; font-size: 13px;">${index + 1}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.full_name || '')}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.company || '')}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.job_title || '')}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.email || '')}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.employee_code || '')}</td>
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(attendee.phone || '')}</td>
                <td style="padding: 15px; text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="showQRCode('${escapeHtml(regCode)}')" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px;" title="View QR Code">📱</button>
                        ${showUnmarkBtn ? `<button onclick="markAttendeeAsInitial('${escapeHtml(regId)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #FF9800;" title="Mark as Initial">↩</button>` : `<button onclick="markAttendeeAsAttended('${escapeHtml(regId)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #4CAF50;" title="Mark as Attended">✓</button>`}
                        <button onclick="deleteAttendee('${escapeHtml(regId)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #f44336;" title="Delete">🗑</button>
                    </div>
                </td>
            </tr>
        `;
    };
    
    // Filter both lists
    const filteredInitial = attendeesData.initial.filter(a => 
        getField(a, 'full_name').includes(lowerSearch) ||
        getField(a, 'company').includes(lowerSearch) ||
        getField(a, 'job_title').includes(lowerSearch) ||
        getField(a, 'email').includes(lowerSearch) ||
        getField(a, 'phone').includes(lowerSearch)
    );
    
    const filteredActual = attendeesData.actual.filter(a => 
        getField(a, 'full_name').includes(lowerSearch) ||
        getField(a, 'company').includes(lowerSearch) ||
        getField(a, 'job_title').includes(lowerSearch) ||
        getField(a, 'email').includes(lowerSearch) ||
        getField(a, 'phone').includes(lowerSearch)
    );
    
    // Render filtered results
    const initialBody = document.getElementById('initialListBody');
    const actualBody = document.getElementById('actualAttendeesBody');
    
    if (filteredInitial.length === 0) {
        initialBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999; font-size: 14px;">No matching participants</td></tr>';
    } else {
        initialBody.innerHTML = filteredInitial.map((attendee, index) => {
            return renderAttendeeRow(attendee, index, false);
        }).join('');
    }
    
    if (filteredActual.length === 0) {
        actualBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999; font-size: 14px;">No matching attendees</td></tr>';
    } else {
        actualBody.innerHTML = filteredActual.map((attendee, index) => {
            return renderAttendeeRow(attendee, index, true);
        }).join('');
    }
}

function showQRCode(registrationCode) {
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
        padding: 30px;
        border-radius: 8px;
        text-align: center;
        max-width: 300px;
    `;
    
    // Create container for QR code
    const qrCodeDiv = document.createElement('div');
    qrCodeDiv.id = 'qrCodeContainer_' + Date.now();
    qrCodeDiv.style.cssText = `
        margin: 20px 0;
        display: flex;
        justify-content: center;
    `;
    
    qrContent.innerHTML = `
        <h3 style="color: #333; margin-top: 0; margin-bottom: 20px;">Registration Code QR</h3>
    `;
    qrContent.appendChild(qrCodeDiv);
    
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
    qrContent.appendChild(codeDisplay);
    
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
    qrContent.appendChild(closeBtn);
    
    qrModal.appendChild(qrContent);
    qrModal.onclick = (e) => {
        if (e.target === qrModal) qrModal.remove();
    };
    
    document.body.appendChild(qrModal);
}

function exportAttendees() {
    // Export attendees to CSV
    const rows = [];
    rows.push(['No.', 'Full Name', 'Company', 'Job Title', 'Email Address', 'Employee Code', 'Contact Number', 'Status']);
    
    // Add initial list
    attendeesData.initial.forEach((attendee, index) => {
        rows.push([
            index + 1,
            attendee.full_name || '',
            attendee.company || '',
            attendee.job_title || '',
            attendee.email || '',
            attendee.employee_code || '',
            attendee.phone || '',
            'Registered'
        ]);
    });
    
    // Add actual attendees
    attendeesData.actual.forEach((attendee, index) => {
        rows.push([
            attendeesData.initial.length + index + 1,
            attendee.full_name || '',
            attendee.company || '',
            attendee.job_title || '',
            attendee.email || '',
            attendee.employee_code || '',
            attendee.phone || '',
            'Attended'
        ]);
    });
    
    // Create CSV
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${currentEventId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function addAttendees() {
    alert('Add attendees feature coming soon');
}

// ============================================================
// METADATA / OTHER INFORMATION CRUD FUNCTIONS
// ============================================================

// Open create other information modal
function openCreateOtherInformationModal(eventId) {
    // Create modal if it doesn't exist in event-details.html
    let modal = document.getElementById('createOtherInformationModal');
    if (!modal) {
        createOtherInformationModals();
        modal = document.getElementById('createOtherInformationModal');
    }
    
    document.getElementById('otherInformationForm').reset();
    document.getElementById('otherInfoEventId').value = eventId;
    modal.classList.add('active');
}

// Create modals HTML if they don't exist
function createOtherInformationModals() {
    if (document.getElementById('createOtherInformationModal')) return;
    
    const modalsHTML = `
        <!-- Create Other Information Modal -->
        <div id="createOtherInformationModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Create Other Information</h2>
                    <button type="button" onclick="document.getElementById('createOtherInformationModal').classList.remove('active')" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
                </div>
                
                <form id="otherInformationForm" style="display: flex; flex-direction: column; gap: 16px;">
                    <input type="hidden" id="otherInfoEventId" value="">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-900 mb-2">Field *</label>
                        <input type="text" id="otherInfoFieldName" placeholder="e.g., Emergency Contact" required
                               style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-900 mb-2">Value *</label>
                        <textarea id="otherInfoFieldValue" placeholder="Enter the value..." required rows="4"
                                  style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 12px;">
                        <button type="button" style="padding: 8px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; cursor: pointer;" onclick="document.getElementById('createOtherInformationModal').classList.remove('active')">
                            Cancel
                        </button>
                        <button type="button" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;" onclick="submitOtherInformation()">
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit Other Information Modal -->
        <div id="editOtherInformationModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Edit Other Information</h2>
                    <button type="button" onclick="document.getElementById('editOtherInformationModal').classList.remove('active')" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
                </div>
                
                <form id="editOtherInformationForm" style="display: flex; flex-direction: column; gap: 16px;">
                    <input type="hidden" id="editOtherInfoMetadataId" value="">
                    <input type="hidden" id="editOtherInfoEventId" value="">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-900 mb-2">Field *</label>
                        <input type="text" id="editOtherInfoFieldName" placeholder="e.g., Emergency Contact" required
                               style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-900 mb-2">Value *</label>
                        <textarea id="editOtherInfoFieldValue" placeholder="Enter the value..." required rows="4"
                                  style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 12px;">
                        <button type="button" style="padding: 8px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; cursor: pointer;" onclick="document.getElementById('editOtherInformationModal').classList.remove('active')">
                            Cancel
                        </button>
                        <button type="button" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;" onclick="submitEditOtherInformation()">
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <style>
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                animation: fadeIn 0.2s ease-in-out;
            }
            
            .modal.active {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-content {
                background-color: white;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideUp 0.3s ease-out;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalsHTML);
}

// Submit create other information
function submitOtherInformation() {
    const eventId = document.getElementById('otherInfoEventId').value;
    const fieldName = document.getElementById('otherInfoFieldName').value.trim();
    const fieldValue = document.getElementById('otherInfoFieldValue').value.trim();
    
    if (!eventId || !fieldName || !fieldValue) {
        alert('Please fill in all required fields');
        return;
    }
    
    fetch(`${API_BASE}/metadata.php`, {
        method: 'POST',
        headers: { ...getUserHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'create',
            event_id: eventId,
            field_name: fieldName,
            field_value: fieldValue
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Other Information added successfully!');
                document.getElementById('createOtherInformationModal').classList.remove('active');
                loadOtherInfo(eventId);
            } else {
                alert('Error: ' + (data.message || 'Failed to add'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error adding other information');
        });
}

// Load event metadata
function loadEventMetadata(eventId) {
    fetch(`${API_BASE}/metadata.php?action=list&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayEventMetadata(data.data || []);
            }
        })
        .catch(error => console.error('Error loading metadata:', error));
}

// Display event metadata
function displayEventMetadata(metadata) {
    const container = document.getElementById('otherInformationContainer');
    if (!container) return;
    
    if (!metadata || metadata.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No additional information yet</p>';
        return;
    }
    
    const html = metadata.map(item => `
        <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
            <div style="padding: 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #374151;">${escapeHtml(item.field_name)}</strong>
                <div style="display: flex; gap: 8px;">
                    <button onclick="openEditOtherInformationModal(${item.metadata_id}, '${escapeHtml(item.field_name)}', '${escapeHtml(item.field_value)}')" style="padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">✏️ Edit</button>
                    <button onclick="deleteOtherInformation(${item.metadata_id})" style="padding: 4px 8px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>
                </div>
            </div>
            <div style="padding: 12px;">
                ${escapeHtml(item.field_value)}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Open edit other information modal
function openEditOtherInformationModal(metadataId, fieldName, fieldValue) {
    let modal = document.getElementById('editOtherInformationModal');
    if (!modal) {
        createOtherInformationModals();
        modal = document.getElementById('editOtherInformationModal');
    }
    
    document.getElementById('editOtherInfoMetadataId').value = metadataId;
    document.getElementById('editOtherInfoFieldName').value = fieldName;
    document.getElementById('editOtherInfoFieldValue').value = fieldValue;
    document.getElementById('editOtherInfoEventId').value = currentEventId;
    modal.classList.add('active');
}

// Submit edit other information
function submitEditOtherInformation() {
    const metadataId = document.getElementById('editOtherInfoMetadataId').value;
    const fieldName = document.getElementById('editOtherInfoFieldName').value.trim();
    const fieldValue = document.getElementById('editOtherInfoFieldValue').value.trim();
    
    if (!metadataId || !fieldName || !fieldValue) {
        alert('Please fill in all required fields');
        return;
    }
    
    const eventId = currentEventId || document.getElementById('editOtherInfoEventId').value;
    
    fetch(`${API_BASE}/metadata.php`, {
        method: 'POST',
        headers: { ...getUserHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'update',
            metadata_id: metadataId,
            field_name: fieldName,
            field_value: fieldValue
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Other Information updated successfully!');
                document.getElementById('editOtherInformationModal').classList.remove('active');
                loadOtherInfo(eventId);
            } else {
                alert('Error: ' + (data.message || 'Failed to update'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating other information');
        });
}

// Delete other information
function deleteOtherInformation(metadataId) {
    if (!confirm('Are you sure you want to delete this information?')) return;
    
    const eventId = currentEventId;
    
    fetch(`${API_BASE}/metadata.php`, {
        method: 'POST',
        headers: { ...getUserHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'delete',
            metadata_id: metadataId
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Other Information deleted successfully!');
                loadOtherInfo(eventId);
            } else {
                alert('Error: ' + (data.message || 'Failed to delete'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting other information');
        });
}

// ================================================================================
// COORDINATOR LOOKUP FOR EVENT DETAILS
// ================================================================================

function openLookupCoordinatorEventModal() {
    if (!currentEventId) {
        alert('Please save the event first before assigning coordinators');
        return;
    }
    document.getElementById('lookupCoordinatorEventModal').style.display = 'flex';
    loadPendingCoordinatorsEvent();
}

function closeLookupCoordinatorEventModal() {
    document.getElementById('lookupCoordinatorEventModal').style.display = 'none';
    document.getElementById('coordinatorSearchEvent').value = '';
}

async function loadPendingCoordinatorsEvent() {
    try {
        const response = await fetch(`${API_BASE}/coordinators.php?action=list_pending`, {
            method: 'GET',
            headers: getUserHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayCoordinatorsEventList(data.data || []);
        } else {
            document.getElementById('coordinatorsEventList').innerHTML = '<p style="text-align: center; color: #ef4444;">Error loading coordinators: ' + (data.message || 'Unknown error') + '</p>';
        }
    } catch (error) {
        console.error('Error loading coordinators:', error);
        document.getElementById('coordinatorsEventList').innerHTML = '<p style="text-align: center; color: #ef4444;">Error loading coordinators</p>';
    }
}

function displayCoordinatorsEventList(coordinators) {
    const listContainer = document.getElementById('coordinatorsEventList');
    
    if (!coordinators || coordinators.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No pending setup coordinators available</p>';
        return;
    }
    
    let html = '';
    coordinators.forEach(coordinator => {
        html += `
            <div class="coordinator-card" data-coordinator-id="${coordinator.coordinator_id}" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; display: flex; justify-content: space-between; align-items: center; background: white; hover-effect">
                <div style="flex: 1;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937; font-size: 14px;">${coordinator.coordinator_name}</p>
                    <p style="margin: 0 0 2px 0; font-size: 13px; color: #6b7280;">${coordinator.email}</p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">${coordinator.contact_number || 'No phone'}</p>
                </div>
                <button type="button" onclick="assignCoordinatorToEventFromLookup(${coordinator.coordinator_id}, '${coordinator.coordinator_name}')" style="padding: 8px 16px; background: #1E73BB; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; white-space: nowrap;">Assign</button>
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
}

function filterCoordinatorsEventList() {
    const searchValue = document.getElementById('coordinatorSearchEvent').value.toLowerCase();
    const cards = document.querySelectorAll('.coordinator-card');
    
    cards.forEach(card => {
        const name = card.querySelector('p').textContent.toLowerCase();
        const email = card.querySelectorAll('p')[1].textContent.toLowerCase();
        
        if (name.includes(searchValue) || email.includes(searchValue)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

async function assignCoordinatorToEventFromLookup(coordinatorId, coordinatorName) {
    if (!currentEventId) {
        alert('Event ID is missing');
        return;
    }
    
    try {
        // Step 1: Assign coordinator to event
        const assignResponse = await fetch(`${API_BASE}/events.php`, {
            method: 'PUT',
            headers: getUserHeaders(),
            body: JSON.stringify({
                action: 'assign_coordinator',
                event_id: currentEventId,
                coordinator_id: coordinatorId
            })
        });
        
        const assignData = await assignResponse.json();
        
        if (!assignData.success) {
            alert('Error assigning coordinator: ' + (assignData.message || 'Unknown error'));
            return;
        }
        
        // Step 2: Activate coordinator account
        const activateResponse = await fetch(`${API_BASE}/coordinators.php`, {
            method: 'PUT',
            headers: getUserHeaders(),
            body: JSON.stringify({
                action: 'activate',
                coordinator_id: coordinatorId,
                is_active: 1
            })
        });
        
        const activateData = await activateResponse.json();
        
        if (activateData.success) {
            alert(`✓ Coordinator "${coordinatorName}" assigned to event and account activated!`);
            closeLookupCoordinatorEventModal();
            loadCoordinators(currentEventId); // Refresh the coordinator list
        } else {
            alert('Coordinator assigned to event, but error activating account: ' + (activateData.message || 'Unknown error'));
            loadCoordinators(currentEventId);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error assigning coordinator: ' + error.message);
    }
}

