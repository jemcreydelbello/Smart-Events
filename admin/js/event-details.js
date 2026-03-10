// Event Details Page JavaScript

console.log('📄 event-details.js loaded - STARTING');
console.log('🔍 window object available:', typeof window !== 'undefined');

// API_BASE is defined in admin.js, but we need it here too
const API_BASE = window.API_BASE || '../api';

// Declare currentEventId as module-level variable
let currentEventId = null;

// attendeesData is also already declared in admin.js
// Do not redeclare it here - use window.attendeesData instead

// ========================================
// IMMEDIATE FUNCTION DEFINITIONS
// (Available as soon as this file loads)
// ========================================

window.enableEventDetailsEdit = function() {
    console.log('📝 enableEventDetailsEdit called');
    // Find all readonly input fields and textareas in event details form
    const detailsForm = document.querySelector('.event-details-form');
    if (!detailsForm) {
        console.warn('❌ Event details form not found');
        return;
    }
    
    const inputs = detailsForm.querySelectorAll('input[readonly], textarea[readonly]');
    console.log('Found', inputs.length, 'readonly inputs');
    
    const editBtn = document.getElementById('editEventDetailsBtn');
    const saveBtn = document.getElementById('saveEventDetailsBtn');
    const cancelBtn = document.getElementById('cancelEventDetailsBtn');
    
    // Enable all inputs
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.classList.remove('cursor-not-allowed');
        input.classList.add('cursor-text');
        input.style.backgroundColor = 'white';
        input.style.cursor = 'text';
    });
    
    // Make event image clickable
    const imageContainer = document.getElementById('detailsEventImage');
    if (imageContainer) {
        imageContainer.style.cursor = 'pointer';
        imageContainer.style.borderColor = '#3b82f6';
        imageContainer.onclick = function() {
            document.getElementById('editEventImage').click();
        };
        imageContainer.onmouseover = function() {
            this.style.borderColor = '#1e40af';
            this.style.backgroundColor = '#eff6ff';
        };
        imageContainer.onmouseout = function() {
            this.style.borderColor = '#3b82f6';
            this.style.backgroundColor = '#f9fafb';
        };
    }
    
    // Toggle buttons
    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'block';
    if (cancelBtn) cancelBtn.style.display = 'block';
    
    console.log('✓ Event details edit mode enabled');
};

window.cancelEventDetailsEdit = function() {
    console.log('🔙 cancelEventDetailsEdit called');
    // Find all input fields and textareas in event details form
    const detailsForm = document.querySelector('.event-details-form');
    if (!detailsForm) return;
    
    const inputs = detailsForm.querySelectorAll('input, textarea');
    const editBtn = document.getElementById('editEventDetailsBtn');
    const saveBtn = document.getElementById('saveEventDetailsBtn');
    const cancelBtn = document.getElementById('cancelEventDetailsBtn');
    
    // Reload event details to revert changes
    if (window.currentEventId) {
        loadEventDetails(window.currentEventId);
    }
    
    // Make all inputs readonly again
    inputs.forEach(input => {
        input.setAttribute('readonly', 'readonly');
        input.classList.remove('cursor-text');
        input.classList.add('cursor-not-allowed');
        input.style.backgroundColor = 'white';
        input.style.cursor = 'not-allowed';
    });
    
    // Make event image non-clickable
    const imageContainer = document.getElementById('detailsEventImage');
    if (imageContainer) {
        imageContainer.style.cursor = 'default';
        imageContainer.style.borderColor = '#e5e7eb';
        imageContainer.style.backgroundColor = '#f9fafb';
        imageContainer.onclick = null;
        imageContainer.onmouseover = null;
        imageContainer.onmouseout = null;
    }
    
    // Toggle buttons
    if (editBtn) editBtn.style.display = 'block';
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    // Reset file input
    const fileInput = document.getElementById('editEventImage');
    if (fileInput) fileInput.value = '';
    
    console.log('✓ Event details edit mode cancelled');
};

window.handleEditEventImage = function(event) {
    console.log('🖼️ handleEditEventImage called');
    const file = event.target.files[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }

    // Get current event ID
    let eventId = window.currentEventId;
    if (!eventId) {
        const params = new URLSearchParams(window.location.search);
        eventId = params.get('id') || params.get('eventId') || params.get('event_id');
    }

    if (!eventId) {
        showNotification('Event ID not found', 'error');
        return;
    }

    // Preview the image
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageContainer = document.getElementById('detailsEventImage');
        if (imageContainer) {
            imageContainer.innerHTML = `<img src="${e.target.result}" alt="Event" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">`;
            console.log('✓ Image preview displayed');
        }
    };
    reader.readAsDataURL(file);
    
    // Store file for later upload with event details
    window.pendingEventImage = {
        file: file,
        eventId: eventId
    };
    
    console.log('✓ Event image selected for upload');
};

window.saveEventDetails = function() {
    console.log('💾 saveEventDetails called');
    // Get all form data
    const eventId = window.currentEventId;
    if (!eventId) {
        showNotification('Event ID not found', 'error');
        return;
    }
    
    const eventTitle = document.getElementById('detailsEventTitle')?.value || '';
    const location = document.getElementById('detailsEventLocation')?.value || '';
    const eventDate = document.getElementById('detailsEventDate')?.value || '';
    const capacity = document.getElementById('detailsEventCapacity')?.value || '';
    const registrationLink = document.getElementById('detailsRegistrationLink')?.value || '';
    const websiteLink = document.getElementById('detailsWebsite')?.value || '';
    const description = document.getElementById('detailsEventDescription')?.value || '';
    
    console.log('Form values:', { eventTitle, location, eventDate, capacity });
    
    // Validate required fields
    if (!eventTitle.trim() || !location.trim() || !eventDate || !capacity) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Create FormData for potential image upload
    const formData = new FormData();
    formData.append('action', 'update_event');
    formData.append('event_id', eventId);
    formData.append('event_name', eventTitle);
    formData.append('location', location);
    formData.append('event_date', eventDate);
    formData.append('capacity', capacity);
    formData.append('registration_link', registrationLink);
    formData.append('website_link', websiteLink);
    formData.append('description', description);
    
    // Add image if one was selected
    if (window.pendingEventImage && window.pendingEventImage.file) {
        formData.append('image', window.pendingEventImage.file);
        console.log('📸 Image attached to save request');
    }
    
    fetch('../api/events.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Event details updated successfully', 'success');
            console.log('✅ Event details saved');
            
            // Clear pending image
            window.pendingEventImage = null;
            const fileInput = document.getElementById('editEventImage');
            if (fileInput) fileInput.value = '';
            
            // Exit edit mode
            window.cancelEventDetailsEdit();
            
            // Reload event details to show updated data
            if (window.currentEventId) {
                setTimeout(() => loadEventDetails(window.currentEventId), 500);
            }
        } else {
            showNotification('Error saving event details: ' + (data.message || 'Unknown error'), 'error');
            console.error('❌ Error saving:', data);
        }
    })
    .catch(err => {
        showNotification('Error saving event details: ' + err.message, 'error');
        console.error('❌ Error:', err);
    });
};

console.log('✅ Event Details Edit Functions Assigned to window:');
console.log('  - window.enableEventDetailsEdit:', typeof window.enableEventDetailsEdit);
console.log('  - window.cancelEventDetailsEdit:', typeof window.cancelEventDetailsEdit);
console.log('  - window.handleEditEventImage:', typeof window.handleEditEventImage);
console.log('  - window.saveEventDetails:', typeof window.saveEventDetails);

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

// Helper function to check if user is admin
function isUserAdmin() {
    try {
        const admin = JSON.parse(localStorage.getItem('admin') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userInfo = (admin && admin.id) ? admin : user;
        
        const role = userInfo.role || userInfo.role_name || '';
        const isAdmin = role.toLowerCase() === 'admin';
        
        console.log('[ADMIN-CHECK] Role:', role, '| Is Admin:', isAdmin);
        return isAdmin;
    } catch (e) {
        console.error('[ADMIN-CHECK] Error:', e);
        return false;
    }
}

// Function to update tab visibility based on user role
function updateTabVisibility() {
    console.log('[TAB-VISIBILITY] Updating tab visibility...');
    const isAdmin = isUserAdmin();
    const adminOnlyTabs = ['finance', 'postmortem'];
    
    adminOnlyTabs.forEach(tabName => {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            if (isAdmin) {
                tabButton.style.display = 'inline-block';
                tabButton.classList.remove('hidden');
                console.log(`[TAB-VISIBILITY] Showing ${tabName} tab`);
            } else {
                tabButton.style.display = 'none';
                tabButton.classList.add('hidden');
                console.log(`[TAB-VISIBILITY] Hiding ${tabName} tab`);
            }
        } else {
            console.warn(`[TAB-VISIBILITY] Tab button not found: ${tabName}`);
        }
    });
    
    console.log('[TAB-VISIBILITY] Update complete. Admin user:', isAdmin);
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
    
    // If path is just a filename (no slashes), it's in /uploads/events/
    if (!imagePath.includes('/')) {
        result = '../uploads/events/' + imagePath;
        console.log('🖼️ getImageUrl: Filename detected, converting from:', imagePath, 'to:', result);
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
    
    // Update tab visibility immediately based on user role
    updateTabVisibility();
    
    const params = new URLSearchParams(window.location.search);
    currentEventId = params.get('id');
    window.currentEventId = currentEventId;  // Also set on window object for cross-module access
    
    if (!currentEventId) {
        const wrapper = document.querySelector('.tab-content-wrapper');
        if (wrapper) {
            wrapper.innerHTML = '<p style="text-align: center; color: #999;">No event ID provided.</p>';
        }
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
    
    // Initialize modals for confirmations
    createOtherInformationModals();
    
    loadEventDetails();
    
    // Re-check tab visibility after page fully loads (with delay to ensure DOM is ready)
    setTimeout(() => {
        console.log('[PAGE-LOAD] Re-checking tab visibility after page load');
        updateTabVisibility();
    }, 500);
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
                loadGiveaways(); // Load giveaways after event details are displayed
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
                imageContainer.innerHTML = `<img src="${imageUrl}" alt="${event.event_name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">`;
            } else {
                imageContainer.innerHTML = '<span class="text-gray-400" style="font-size: 48px; display: flex; flex-direction: column; align-items: center; gap: 8px;"><span style="font-size: 24px; line-height: 1;">📷 No image</span></span>';
            }
            console.log('✓ Set event image');
        }
    } catch (e) {
        console.error('Error setting image:', e);
    }
    
    // Handle Privacy Access section visibility
    try {
        const privacyAccessSection = document.getElementById('privacyAccessSection');
        const detailsPrivateEvent = document.getElementById('detailsPrivateEvent');
        const detailsPrivateAccessCode = document.getElementById('detailsPrivateAccessCode');
        
        if (event.is_private == 1 || event.is_private === 1) {
            // Event is private - show the section
            if (privacyAccessSection) {
                privacyAccessSection.style.display = 'block';
            }
            if (detailsPrivateEvent) {
                detailsPrivateEvent.checked = true;
            }
            if (detailsPrivateAccessCode && event.private_access_code) {
                detailsPrivateAccessCode.value = event.private_access_code;
            }
            console.log('✓ Privacy Access section shown - Event is PRIVATE');
        } else {
            // Event is public - hide the section
            if (privacyAccessSection) {
                privacyAccessSection.style.display = 'none';
            }
            if (detailsPrivateEvent) {
                detailsPrivateEvent.checked = false;
            }
            console.log('✓ Privacy Access section hidden - Event is PUBLIC');
        }
    } catch (e) {
        console.error('Error handling privacy access section:', e);
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

// ========== EVENT TAB SWITCHING ==========
// Note: switchTab is assigned to window object at end of file for consistency

function switchTab(tabName) {
    try {
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
        console.log('🔍 Looking for tab element with ID:', tabName, '| Found:', !!tabElement);
        
        if (tabElement) {
            tabElement.classList.add('active');
            tabElement.style.display = 'block';
            console.log('✓ Activated tab element:', tabName, 'Display:', window.getComputedStyle(tabElement).display);
        } else {
            console.error('❌ Tab element not found:', tabName);
            console.error('   Available tab elements:', Array.from(document.querySelectorAll('.event-tab-content')).map(el => el.id));
        }
        
        // Find and activate the corresponding button
        document.querySelectorAll('.event-tab-btn').forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(`switchTab('${tabName}')`)) {
                btn.classList.add('active');
            }
        });
        
        // Load data when specific tabs are clicked
        if (tabName === 'tasks') {
            console.log('✓ Loading tasks tab...');
            loadEventTasks();
        }
        
        if (tabName === 'attendees') {
            console.log('✓ Loading attendees tab...');
            loadAttendees();
        }
        
        if (tabName === 'kpi') {
            console.log('✓ Loading KPI tab... currentEventId:', currentEventId);
            if (currentEventId) {
                console.log('  → Calling loadSavedKPIData()');
                loadSavedKPIData();
                console.log('  → Calling initializeKPIInputListeners()');
                initializeKPIInputListeners();
                console.log('  → Calling loadKPIData()');
                loadKPIData(currentEventId);
                console.log('  → KPI tab fully loaded');
            } else {
                console.error('  ❌ No currentEventId available');
            }
        }
        
        if (tabName === 'emails') {
            console.log('✓ Loading emails tab... currentEventId:', currentEventId);
            if (currentEventId) {
                console.log('  → Calling loadEmailBlasts()');
                loadEmailBlasts(currentEventId);
                console.log('  → Emails tab fully loaded');
            } else {
                console.error('  ❌ No currentEventId available');
            }
        }

        if (tabName === 'marketing') {
            console.log('✓ Loading marketing tab... currentEventId:', currentEventId);
            if (currentEventId) {
                console.log('  → Calling loadGiveaways()');
                loadGiveaways();
                console.log('  → Marketing tab fully loaded');
            } else {
                console.error('  ❌ No currentEventId available');
            }
        }

        if (tabName === 'logistics') {
            console.log('✓ Loading logistics tab... currentEventId:', currentEventId);
            if (currentEventId) {
                console.log('  → Calling loadLogistics()');
                loadLogistics();
                console.log('  → Logistics tab fully loaded');
            } else {
                console.error('  ❌ No currentEventId available');
            }
        }

        if (tabName === 'finance') {
            console.log('✓ Loading finance tab... currentEventId:', currentEventId);
            if (currentEventId) {
                console.log('  → Calling loadExpenses()');
                loadExpenses();
                console.log('  → Finance tab fully loaded');
            } else {
                console.error('  ❌ No currentEventId available');
            }
        }

        if (tabName === 'postmortem') {
            console.log('✓ Loading postmortem tab... currentEventId:', currentEventId);
            if (currentEventId) {
                console.log('  → Calling loadPostmortemData()');
                loadPostmortemData(currentEventId);
                console.log('  → Postmortem tab fully loaded');
            } else {
                console.error('  ❌ No currentEventId available');
            }
        }
    } catch (error) {
        console.error('❌ ERROR in switchTab():', error);
        console.error('   Stack:', error.stack);
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
                                <button class="action-btn" onclick="removeCoordinatorFromEvent(${event.coordinator_id}, ${eventId})" title="Remove Coordinator" style="padding: 6px; background: white; border: 1px solid #ef4444; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#ef4444" d="M6 22q-.825 0-1.412-.587T4 20V10q0-.825.588-1.412T6 8h1V6q0-2.075 1.463-3.537T12 1t3.538 1.463T17 6v2h1q.825 0 1.413.588T20 10v10q0 .825-.587 1.413T18 22zm0-2h12V10H6zm7.413-3.588Q14 15.826 14 15t-.587-1.412T12 13t-1.412.588T10 15t.588 1.413T12 17t1.413-.587M9 8h6V6q0-1.25-.875-2.125T12 3t-2.125.875T9 6zM6 20V10z"/></svg>
                                </button>
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
                        <td class="px-4 py-2.5 text-sm text-gray-900">${escapeHtml(item.field_name)}</td>
                        <td class="px-4 py-2.5 text-sm text-gray-700">${escapeHtml(item.field_value)}</td>
                        <td class="px-4 py-2.5 flex gap-2 justify-end">
                            <button class="action-btn" title="Edit Other Information" onclick="openEditOtherInformationModal(${item.metadata_id}, '${escapeHtml(item.field_name)}', '${escapeHtml(item.field_value)}')" style="padding: 6px; background: white; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g fill="none" stroke="#5a5f68" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M19.09 14.441v4.44a2.37 2.37 0 0 1-2.369 2.369H5.12a2.37 2.37 0 0 1-2.369-2.383V7.279a2.356 2.356 0 0 1 2.37-2.37H9.56"/><path d="M6.835 15.803v-2.165c.002-.357.144-.7.395-.953l9.532-9.532a1.36 1.36 0 0 1 1.934 0l2.151 2.151a1.36 1.36 0 0 1 0 1.934l-9.532 9.532a1.36 1.36 0 0 1-.953.395H8.197a1.36 1.36 0 0 1-1.362-1.362M19.09 8.995l-4.085-4.086"/></g></svg>
                            </button>
                            <button class="action-btn" title="Delete Other Information" onclick="deleteOtherInformation(${item.metadata_id})" style="padding: 6px; background: white; border: 1px solid #ef4444; border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#ef4444" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-6.287 10.713Q11 16.425 11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17t.713-.288m4 0Q15 16.426 15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17t.713-.288M7 6v13z"/></svg>
                            </button>
                        </td>
                    </tr>
                `).join('');
                table.innerHTML = html;
                
                // Add hover effects to action buttons
                table.querySelectorAll('.action-btn').forEach((btn, index) => {
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

// Remove coordinator - Show confirmation modal
function removeCoordinatorFromEvent(coordinatorId, eventId) {
    console.log('🔍 removeCoordinatorFromEvent called:', { coordinatorId, eventId, currentEventId });
    
    // Use provided eventId, or fallback to currentEventId
    const finalEventId = eventId || currentEventId;
    
    if (!finalEventId) {
        showNotification('No event ID available', 'error');
        return;
    }
    
    let modal = document.getElementById('removeCoordinatorModal');
    console.log('🔍 Modal found:', !!modal);
    
    if (!modal) {
        console.log('🔍 Modal not found, creating modals...');
        if (typeof createOtherInformationModals === 'function') {
            createOtherInformationModals();
            modal = document.getElementById('removeCoordinatorModal');
        }
    }
    
    if (!modal) {
        console.error('❌ Modal not found after creation');
        showNotification('Error: Confirmation modal not available', 'error');
        return;
    }
    
    console.log('✅ Showing modal for removal');
    window.pendingRemoveCoordinatorId = coordinatorId;
    window.pendingRemoveEventId = finalEventId;
    modal.classList.add('active');
}

// Confirm remove coordinator
function confirmRemoveCoordinator() {
    const coordinatorId = window.pendingRemoveCoordinatorId;
    const eventId = window.pendingRemoveEventId || currentEventId;
    
    if (!coordinatorId || !eventId) {
        showNotification('Missing coordinator or event ID', 'error');
        document.getElementById('removeCoordinatorModal').classList.remove('active');
        return;
    }
    
    console.log(`🗑️ Removing coordinator ${coordinatorId} from event ${eventId}`);
    
    fetch(`${API_BASE}/events.php`, {
        method: 'PUT',
        headers: {
            ...getUserHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            event_id: eventId,
            coordinator_id: coordinatorId,
            action: 'remove_coordinator'
        })
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            document.getElementById('removeCoordinatorModal').classList.remove('active');
            
            if (data.success) {
                showNotification('✓ Coordinator removed successfully!', 'success');
                // Refresh the coordinator list
                if (typeof loadEventCoordinators === 'function') {
                    loadEventCoordinators();
                } else if (typeof loadCoordinators === 'function') {
                    loadCoordinators(eventId);
                }
            } else {
                showNotification(data.message || 'Failed to remove coordinator', 'error');
            }
        })
        .catch(error => {
            console.error('✗ Error removing coordinator:', error);
            showNotification('Error removing coordinator: ' + error.message, 'error');
            document.getElementById('removeCoordinatorModal').classList.remove('active');
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
// Helper function to export attendees
// Helper function to add attendees
function addAttendee() {
    if (!currentEventId) {
        alert('Event not selected');
        return;
    }
    
    // Use the shared addEventAttendee function from admin.js
    if (typeof addEventAttendee === 'function') {
        addEventAttendee(currentEventId);
    } else {
        // Fallback if admin.js functions not available
        document.getElementById('addAttendeeForm').reset();
        document.getElementById('addAttendeeEventId').value = currentEventId;
        document.getElementById('addAttendeeEventField').style.display = 'none';
        document.getElementById('addAttendeeErrorMessage').style.display = 'none';
        document.getElementById('addAttendeeSuccessMessage').style.display = 'none';
        document.getElementById('addAttendeeModal').classList.add('active');
    }
}

function closeAddAttendeeModal() {
    document.getElementById('addAttendeeModal').classList.remove('active');
    document.getElementById('addAttendeeForm').reset();
    document.getElementById('addAttendeeErrorMessage').style.display = 'none';
    document.getElementById('addAttendeeSuccessMessage').style.display = 'none';
    document.getElementById('addAttendeeEventField').style.display = 'none';
}

function handleAddAttendeeSubmit(event) {
    event.preventDefault();
    
    const eventId = document.getElementById('addAttendeeEventId').value;
    const name = document.getElementById('addAttendeeName').value.trim();
    const email = document.getElementById('addAttendeeEmail').value.trim();
    const company = document.getElementById('addAttendeeCompany').value.trim();
    const jobTitle = document.getElementById('addAttendeeJobTitle').value.trim();
    const employeeCode = document.getElementById('addAttendeeEmployeeCode').value.trim();
    const phone = document.getElementById('addAttendeePhone').value.trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAddAttendeeError('Invalid email address');
        return;
    }
    
    // Validate phone format (basic check)
    if (phone.length < 7) {
        showAddAttendeeError('Phone number must be at least 7 digits');
        return;
    }
    
    const submitBtn = document.getElementById('addAttendeeSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    
    // Send to API
    fetch(`${API_BASE}/participants.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getUserHeaders() },
        body: JSON.stringify({
            event_id: parseInt(eventId),
            participant_name: name,
            participant_email: email,
            company: company,
            job_title: jobTitle,
            employee_code: employeeCode,
            participant_phone: phone,
            status: 'REGISTERED'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✓ Attendee added successfully:', data);
            showAddAttendeeSuccess('Attendee added successfully! Registration code: ' + data.registration_code);
            
            // Clear form and reload attendees after a short delay
            setTimeout(() => {
                closeAddAttendeeModal();
                loadAttendees(currentEventId);
            }, 1500);
        } else {
            showAddAttendeeError(data.message || 'Failed to add attendee');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAddAttendeeError('Error adding attendee: ' + error.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function showAddAttendeeError(message) {
    const errorDiv = document.getElementById('addAttendeeErrorMessage');
    errorDiv.textContent = '✕ ' + message;
    errorDiv.style.display = 'block';
    document.getElementById('addAttendeeSuccessMessage').style.display = 'none';
}

function showAddAttendeeSuccess(message) {
    const successDiv = document.getElementById('addAttendeeSuccessMessage');
    successDiv.textContent = '✓ ' + message;
    successDiv.style.display = 'block';
    document.getElementById('addAttendeeErrorMessage').style.display = 'none';
}

function openCoordinatorModal() {
    alert('Coordinator management coming soon');
}

function openOtherInfoModal() {
    alert('Other info management coming soon');
}

// Load Dashboard Data
function loadDashboard(eventId) {
    if (!eventId) {
        console.warn('❌ loadDashboard: No eventId provided');
        return;
    }
    
    console.log('📊 Loading DASHBOARD for EVENT ID:', eventId);
    
    // Fetch attendees first for accurate registration stats
    fetch(`${API_BASE}/participants.php?action=list&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('📊 Dashboard API returned', data.data.length, 'attendees');
                updateDashboardAttendees(data.data);
            } else {
                console.error('❌ Dashboard API error:', data.message);
            }
        })
        .catch(error => console.error('❌ Error loading attendees for dashboard:', error));
    
    // Fetch event details for other KPI cards
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
    // Note: Registrations KPI is now updated by updateDashboardAttendees() with real attendee data
    // This function handles other KPIs from the event data
    
    // Update Budget KPI (placeholder for now)
    document.getElementById('dashBudget').textContent = '$0.00';
    document.getElementById('dashBudgetDetail').textContent = '0 EXPENSE LINE ITEMS';
    
    // Update Logistics Readiness (placeholder)
    document.getElementById('dashLogistics').textContent = '0%';
    document.getElementById('dashLogisticsDetail').textContent = '0 LOGISTICS ITEMS TRACKED';
}

function updateDashboardAttendees(attendees) {
    if (!attendees) {
        console.warn('⚠️  updateDashboardAttendees: No attendees data');
        return;
    }
    
    // Count actual registered and attended from real attendee data
    const total = attendees.length;
    const attended = attendees.filter(a => a.status === 'ATTENDED').length;
    
    // Update the Registrations KPI with actual attendee counts
    const regEl = document.getElementById('dashRegistrations');
    const detailEl = document.getElementById('dashRegistrationsDetail');
    
    if (regEl) {
        regEl.textContent = total;
    } else {
        console.warn('⚠️  dashRegistrations element not found');
    }
    
    if (detailEl) {
        detailEl.textContent = `CHECKED IN: ${attended} (${total > 0 ? Math.round((attended/total)*100) : 0}%)`;
    } else {
        console.warn('⚠️  dashRegistrationsDetail element not found');
    }
    
    console.log(`✅ Dashboard for event ${currentEventId}: ${total} total registrations, ${attended} attended`);
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
    
    // Create bar HTML for all statuses with consistent layout
    const createBar = (label, color, width, count) => {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px;">
                <span style="min-width: 80px;">${label}</span>
                <div style="width: 300px; height: 16px; background: #e8e8e8; border-radius: 2px; overflow: hidden;">
                    ${count > 0 ? `<div style="height: 100%; background: ${color}; width: ${width}%;"></div>` : ''}
                </div>
                <span style="font-weight: 600; min-width: 30px; text-align: right;">${count}</span>
            </div>
        `;
    };
    
    document.getElementById('taskStatusList').innerHTML = `
        ${createBar('Done', '#4caf50', doneWidth, taskCounts.done)}
        ${createBar('In Progress', '#ff9800', inProgressWidth, taskCounts.inProgress)}
        ${createBar('Pending', '#9e9e9e', pendingWidth, taskCounts.pending)}
    `;
    
    document.getElementById('taskStatusTotal').textContent = `${total} total tasks`;
    
    // Top Cost Drivers (sample data for now - can be connected to a budget table later)
    document.getElementById('costDriversList').innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
            <span>Hall Rental</span>
            <span style="font-weight: 600;">₱4,200.00</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
            <span>Lunch Pack</span>
            <span style="font-weight: 600;">₱3,960.00</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Badge Printing</span>
            <span style="font-weight: 600;">₱420.00</span>
        </div>
    `;
    
    document.getElementById('costDriversTotal').textContent = '3 shown';
}

function updateDashboardEmails() {
    // Fetch email blast counts from API
    if (!window.currentEventId) {
        // Fallback to empty if no event ID
        document.getElementById('emailActivityList').innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span>Sent</span>
                    <div style="height: 8px; background: #2196f3; border-radius: 4px; flex: 1;"></div>
                </div>
                <span style="font-weight: 600; min-width: 30px; text-align: right;">0</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span>Scheduled</span>
                    <div style="height: 8px; background: #9c27b0; border-radius: 4px; flex: 1;"></div>
                </div>
                <span style="font-weight: 600; min-width: 30px; text-align: right;">0</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span>Draft</span>
                    <div style="height: 8px; background: #bdbdbd; border-radius: 4px; flex: 1;"></div>
                </div>
                <span style="font-weight: 600; min-width: 30px; text-align: right;">0</span>
            </div>
        `;
        document.getElementById('emailActivityTotal').textContent = '0 total sends';
        return;
    }
    
    const eventId = window.currentEventId;
    
    fetch(`../api/emails.php?action=counts&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch email counts');
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.data) {
            const emails = {
                sent: data.data.Sent || 0,
                scheduled: data.data.Scheduled || 0,
                draft: data.data.Draft || 0
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
        } else {
            console.error('Invalid email counts response:', data);
        }
    })
    .catch(error => {
        console.error('Error fetching email counts:', error);
        // Show default empty state on error
        document.getElementById('emailActivityList').innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span>Sent</span>
                    <div style="height: 8px; background: #2196f3; border-radius: 4px; flex: 1;"></div>
                </div>
                <span style="font-weight: 600; min-width: 30px; text-align: right;">0</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span>Scheduled</span>
                    <div style="height: 8px; background: #9c27b0; border-radius: 4px; flex: 1;"></div>
                </div>
                <span style="font-weight: 600; min-width: 30px; text-align: right;">0</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <span>Draft</span>
                    <div style="height: 8px; background: #bdbdbd; border-radius: 4px; flex: 1;"></div>
                </div>
                <span style="font-weight: 600; min-width: 30px; text-align: right;">0</span>
            </div>
        `;
        document.getElementById('emailActivityTotal').textContent = '0 total sends';
    });
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
    const tbody = document.getElementById('eventTasksTableBody');
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
    const tbody = document.getElementById('eventTasksTableBody');
    
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
                <td style="padding: 14px 15px; text-align: right; display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                    <button type="button" onclick="editTask(${task.task_id})" style="background: transparent; border: none; padding: 4px; cursor: pointer; line-height: 1; color: #3b82f6; transition: opacity 0.2s; display: inline-flex; align-items: center; justify-content: center;" title="Edit task">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g class="edit-outline"><g fill="currentColor" fill-rule="evenodd" class="Vector" clip-rule="evenodd"><path d="M2 6.857A4.857 4.857 0 0 1 6.857 2H12a1 1 0 1 1 0 2H6.857A2.857 2.857 0 0 0 4 6.857v10.286A2.857 2.857 0 0 0 6.857 20h10.286A2.857 2.857 0 0 0 20 17.143V12a1 1 0 1 1 2 0v5.143A4.857 4.857 0 0 1 17.143 22H6.857A4.857 4.857 0 0 1 2 17.143z"/><path d="m15.137 13.219l-2.205 1.33l-1.033-1.713l2.205-1.33l.003-.002a1.2 1.2 0 0 0 .232-.182l5.01-5.036a3 3 0 0 0 .145-.157c.331-.386.821-1.15.228-1.746c-.501-.504-1.219-.028-1.684.381a6 6 0 0 0-.36.345l-.034.034l-4.94 4.965a1.2 1.2 0 0 0-.27.41l-.824 2.073a.2.2 0 0 0 .29.245l1.032 1.713c-1.805 1.088-3.96-.74-3.18-2.698l.825-2.072a3.2 3.2 0 0 1 .71-1.081l4.939-4.966l.029-.029c.147-.15.641-.656 1.24-1.02c.327-.197.849-.458 1.494-.508c.74-.059 1.53.174 2.15.797a2.9 2.9 0 0 1 .845 1.75a3.15 3.15 0 0 1-.23 1.517c-.29.717-.774 1.244-.987 1.457l-5.01 5.036q-.28.281-.62.487m4.453-7.126s-.004.003-.013.006z"/></g></g></svg>
                    </button>
                    <button type="button" onclick="deleteTask(${task.task_id})" style="background: transparent; border: none; padding: 4px; cursor: pointer; line-height: 1; color: #ef5350; transition: opacity 0.2s; display: inline-flex; align-items: center; justify-content: center;" title="Delete task">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M5 3h2a1 1 0 0 0-2 0M4 3a2 2 0 1 1 4 0h2.5a.5.5 0 0 1 0 1h-.441l-.443 5.17A2 2 0 0 1 7.623 11H4.377a2 2 0 0 1-1.993-1.83L1.941 4H1.5a.5.5 0 0 1 0-1zm3.5 3a.5.5 0 0 0-1 0v2a.5.5 0 0 0 1 0zM5 5.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M3.38 9.085a1 1 0 0 0 .997.915h3.246a1 1 0 0 0 .996-.915L9.055 4h-6.11z"/></svg>
                    </button>
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
// calendarCurrentDate is already declared in admin.js
// Do not redeclare it here - use the global variable
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
    if (!eventId) return;
    
    const headers = getUserHeaders();
    
    // Fetch fresh participant data
    fetch(`${API_BASE}/participants.php?action=list&event_id=${eventId}`, { headers })
    .then(response => response.json())
    .then(participantsData => {
        if (!participantsData.success || !Array.isArray(participantsData.data)) {
            console.error('Failed to load participants for KPI', participantsData);
            document.getElementById('kpiMessage').textContent = 'Failed to load attendee data';
            return;
        }
        
        const participants = participantsData.data;
        console.log('KPI: Fetched', participants.length, 'total participants');
        
        // Update attendeesData with fresh data - use EXACT same logic as Attendees section
        // Filter by status field only (no 'attended' field in API response)
        attendeesData.initial = participants.filter(a => a.status !== 'ATTENDED');
        attendeesData.actual = participants.filter(a => a.status === 'ATTENDED');
        
        console.log('KPI: Initial count:', attendeesData.initial.length, '| Actual count:', attendeesData.actual.length);
        
        // Now fetch event data for capacity
        return fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`, { headers })
            .then(r => r.json())
            .then(eventData => {
                if (!eventData.success) {
                    console.error('Failed to load event for KPI', eventData);
                    // Use defaults
                    return { event: { capacity: 0 } };
                }
                return { event: eventData.data };
            });
    })
    .then(eventResponse => {
        const event = eventResponse.event;
        
        // Get input values or use event capacity as default
        let targetAttendees = parseInt(document.getElementById('kpiTargetAttendees').value);
        if (!targetAttendees || isNaN(targetAttendees)) {
            targetAttendees = event.capacity || 0;
            document.getElementById('kpiTargetAttendees').value = targetAttendees;
        }
        
        let projectedWalkIn = parseInt(document.getElementById('kpiProjectedWalkIn').value) || 0;
        
        // Calculate attendee counts using attendeesData that was just updated
        const initialAttendees = attendeesData.initial.length;
        const walkInAttendees = projectedWalkIn;
        const totalAttendees = initialAttendees + walkInAttendees;
        const actualAttendees = attendeesData.actual.length;
        const remaining = Math.max(0, targetAttendees - totalAttendees);
        const progressPercent = targetAttendees > 0 ? Math.round((actualAttendees / targetAttendees) * 100) : 0;
        
        console.log('KPI Calculations:', { targetAttendees, projectedWalkIn, initialAttendees, actualAttendees, remaining, progressPercent });
        
        // Update UI
        document.getElementById('kpiInitialAttendees').textContent = initialAttendees;
        document.getElementById('kpiWalkInAttendees').textContent = walkInAttendees;
        document.getElementById('kpiTargetDisplay').textContent = targetAttendees;
        document.getElementById('kpiRemaining').textContent = remaining;
        document.getElementById('kpiActualAttendeesCount').textContent = actualAttendees;
        document.getElementById('kpiProgressBar').style.width = Math.min(progressPercent, 100) + '%';
        document.getElementById('kpiProgressPercent').textContent = progressPercent + '%';
        document.getElementById('kpiActualAttendeesText').textContent = `Actual Attendees: ${actualAttendees}`;
        
        // Update message
        const messageEl = document.getElementById('kpiMessage');
        const messageContainer = messageEl.parentElement;
        
        messageContainer.classList.remove('bg-green-50', 'border-green-200', 'bg-blue-50', 'border-blue-200');
        messageContainer.classList.add('bg-blue-50', 'border-blue-200');
        
        if (remaining > 0) {
            messageEl.textContent = `${remaining} more attendees needed to meet the target. Total registered attendees: ${totalAttendees}.`;
        } else if (actualAttendees >= targetAttendees) {
            messageEl.textContent = `Target met! ${actualAttendees} attendees checked in out of ${targetAttendees} target.`;
            messageContainer.classList.remove('bg-blue-50', 'border-blue-200');
            messageContainer.classList.add('bg-green-50', 'border-green-200');
        } else {
            messageEl.textContent = `${actualAttendees} attendees checked in. ${remaining} more needed.`;
        }
    })
    .catch(error => {
        console.error('Error loading KPI data:', error);
        document.getElementById('kpiMessage').textContent = 'Error loading KPI data: ' + error.message;
    });
}

// Make loadKPIData globally accessible immediately after definition
window.loadKPIData = loadKPIData;
console.log('[DEBUG] Assigned window.loadKPIData immediately after function definition');

// Update KPI data when input values change
function initializeKPIInputListeners() {
    const targetInput = document.getElementById('kpiTargetAttendees');
    const walkInInput = document.getElementById('kpiProjectedWalkIn');
    
    // Use both 'change' and 'input' events for real-time updates
    const updateKPI = () => {
        if (currentEventId) {
            loadKPIData(currentEventId);
        }
    };
    
    if (targetInput) {
        targetInput.addEventListener('change', updateKPI);
        targetInput.addEventListener('input', updateKPI);
    }
    
    if (walkInInput) {
        walkInInput.addEventListener('change', updateKPI);
        walkInInput.addEventListener('input', updateKPI);
    }
}

// Make initializeKPIInputListeners globally accessible immediately after definition
window.initializeKPIInputListeners = initializeKPIInputListeners;
console.log('[DEBUG] Assigned window.initializeKPIInputListeners immediately after function definition');

// Save KPI Details and refresh
function saveKPIDetails() {
    console.log('saveKPIDetails() called');
    
    if (!currentEventId) {
        alert('No event selected');
        return;
    }
    
    const targetAttendees = document.getElementById('kpiTargetAttendees').value;
    const projectedWalkIn = document.getElementById('kpiProjectedWalkIn').value;
    
    console.log('Form values:', { targetAttendees, projectedWalkIn, currentEventId });
    
    // Validate inputs
    if (!targetAttendees || parseInt(targetAttendees) <= 0) {
        alert('Please enter a valid target number of attendees');
        return;
    }
    
    if (!projectedWalkIn || parseInt(projectedWalkIn) < 0) {
        alert('Please enter a valid projected walk-in attendees count');
        return;
    }
    
    console.log('Validation passed, preparing to save...');
    
    const headers = getUserHeaders();
    
    // Simple fetch without Headers API to avoid compatibility issues
    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Role': headers['X-User-Role'] || '',
            'X-User-Id': headers['X-User-Id'] || '',
            'X-Coordinator-Id': headers['X-Coordinator-Id'] || ''
        },
        body: JSON.stringify({
            action: 'save',
            event_id: currentEventId,
            target_attendees: parseInt(targetAttendees),
            projected_walk_in: parseInt(projectedWalkIn)
        })
    };
    
    console.log('Sending fetch request:', fetchOptions);
    
    // Save to database via API
    fetch(`${API_BASE}/kpi.php?action=save`, fetchOptions)
    .then(response => {
        console.log('API Response received:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('API Result:', result);
        
        if (result.success) {
            console.log('✓ KPI saved to database:', result.data);
            
            // Also save to localStorage for offline access
            const kpiData = {
                eventId: currentEventId,
                targetAttendees: parseInt(targetAttendees),
                projectedWalkIn: parseInt(projectedWalkIn),
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(`kpi_${currentEventId}`, JSON.stringify(kpiData));
            
            // Show success message
            const messageEl = document.getElementById('kpiMessage');
            const messageContainer = messageEl.parentElement;
            messageContainer.classList.remove('bg-blue-50', 'border-blue-200', 'bg-green-50', 'border-green-200');
            messageContainer.classList.add('bg-green-50', 'border-green-200');
            messageEl.textContent = '✓ KPI Details saved successfully!';
            
            // Refresh the KPI data
            setTimeout(() => {
                loadKPIData(currentEventId);
            }, 500);
        } else {
            console.error('Error saving KPI:', result.message);
            alert('Error saving KPI: ' + (result.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error saving KPI:', error);
        alert('Error saving KPI: ' + error.message);
    });
}

// Make saveKPIDetails globally accessible immediately after definition
window.saveKPIDetails = saveKPIDetails;
console.log('[DEBUG] Assigned window.saveKPIDetails immediately after function definition');

// Load saved KPI data on page load
function loadSavedKPIData() {
    console.log('loadSavedKPIData() called for event:', currentEventId);
    
    if (!currentEventId) {
        console.log('No currentEventId, skipping loadSavedKPIData');
        return;
    }
    
    const headers = getUserHeaders();
    
    // Simple fetch without Headers API
    const fetchOptions = {
        headers: {
            'X-User-Role': headers['X-User-Role'] || '',
            'X-User-Id': headers['X-User-Id'] || '',
            'X-Coordinator-Id': headers['X-Coordinator-Id'] || ''
        }
    };
    
    // First try to load from database
    fetch(`${API_BASE}/kpi.php?action=get&event_id=${currentEventId}`, fetchOptions)
    .then(response => {
        console.log('DB fetch response:', response.status);
        return response.json();
    })
    .then(result => {
        console.log('DB fetch result:', result);
        
        if (result.success && result.data) {
            // Load from database
            console.log('✓ Found KPI data in database:', result.data);
            document.getElementById('kpiTargetAttendees').value = result.data.target_attendees;
            document.getElementById('kpiProjectedWalkIn').value = result.data.projected_walk_in;
        } else {
            // No database record - check localStorage as fallback
            console.log('No database record, checking localStorage');
            const savedData = localStorage.getItem(`kpi_${currentEventId}`);
            if (savedData) {
                try {
                    const kpiData = JSON.parse(savedData);
                    console.log('✓ Found KPI data in localStorage:', kpiData);
                    document.getElementById('kpiTargetAttendees').value = kpiData.targetAttendees;
                    document.getElementById('kpiProjectedWalkIn').value = kpiData.projectedWalkIn;
                } catch (e) {
                    console.error('Error parsing localStorage KPI data:', e);
                    setDefaultKPIValues();
                }
            } else {
                // No saved data anywhere - use event capacity as default
                console.log('No saved data, using defaults');
                setDefaultKPIValues();
            }
        }
    })
    .catch(error => {
        console.error('Error loading KPI from database:', error);
        // Fallback to localStorage
        const savedData = localStorage.getItem(`kpi_${currentEventId}`);
        if (savedData) {
            try {
                const kpiData = JSON.parse(savedData);
                console.log('✓ Fallback to localStorage:', kpiData);
                document.getElementById('kpiTargetAttendees').value = kpiData.targetAttendees;
                document.getElementById('kpiProjectedWalkIn').value = kpiData.projectedWalkIn;
            } catch (e) {
                console.error('Error parsing localStorage KPI data:', e);
                setDefaultKPIValues();
            }
        } else {
            setDefaultKPIValues();
        }
    });
}

// Make loadSavedKPIData globally accessible immediately after definition
window.loadSavedKPIData = loadSavedKPIData;
console.log('[DEBUG] Assigned window.loadSavedKPIData immediately after function definition');

// Helper function to set default KPI values
function setDefaultKPIValues() {
    if (currentEventData && currentEventData.capacity) {
        document.getElementById('kpiTargetAttendees').value = currentEventData.capacity;
        document.getElementById('kpiProjectedWalkIn').value = 0;
    } else {
        document.getElementById('kpiTargetAttendees').value = 0;
        document.getElementById('kpiProjectedWalkIn').value = 0;
    }
}

// Make setDefaultKPIValues globally accessible immediately after definition
window.setDefaultKPIValues = setDefaultKPIValues;
console.log('[DEBUG] Assigned window.setDefaultKPIValues immediately after function definition');

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

function loadLogistics() {
    console.log('[Logistics] Loading for event:', currentEventId);
    
    if (!currentEventId) {
        const tableBody = document.getElementById('logisticsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Please select an event to view logistics</td></tr>';
        }
        return;
    }
    
    const headers = getUserHeaders();
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/logistics.php?action=list&event_id=${currentEventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            console.log('[Logistics] Loaded:', data);
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
    
    const shipEl = document.getElementById('logisticsShipCount');
    const receiveEl = document.getElementById('logisticsReceiveCount');
    const retrieveEl = document.getElementById('logisticsRetrieveCount');
    
    if (shipEl) shipEl.textContent = toShip;
    if (receiveEl) receiveEl.textContent = toReceive;
    if (retrieveEl) retrieveEl.textContent = toRetrieve;
}

function renderLogisticsTable(items) {
    const tbody = document.getElementById('logisticsTableBody');
    
    if (!tbody) return;
    
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

function openAddLogisticsModal() {
    if (!currentEventId) {
        showNotification('Please select an event first', 'error');
        return;
    }
    
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

function editLogistics(logisticsId) {
    if (!currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders();
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/logistics.php?action=get&logistics_id=${logisticsId}&event_id=${currentEventId}`, { headers })
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
    
    if (!currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders();
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/logistics.php?action=delete`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            event_id: currentEventId,
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
    if (!currentEventId) return;
    
    const headers = getUserHeaders();
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
            event_id: currentEventId,
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

function loadLogisticsData(eventId) {
    // Load logistics data for the Logistics tab
    if (!eventId) return;
    
    // Placeholder - will eventually fetch logistics data from API
    const logisticsTable = document.getElementById('logisticsTableBody');
    if (logisticsTable && logisticsTable.parentElement) {
        logisticsTable.innerHTML = '<tr><td colspan="8" class="empty-message">No logistics items created</td></tr>';
    }
}

function loadExpenses() {
    console.log('[Finance] Loading for event:', currentEventId);
    
    if (!currentEventId) {
        const tableBody = document.getElementById('expensesTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Please select an event to view expenses</td></tr>';
        }
        return;
    }
    
    const headers = getUserHeaders();
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/finance.php?action=list&event_id=${currentEventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            console.log('[Finance] Loaded:', data);
            if (data.success) {
                renderExpensesTable(data.data);
                updateGrandTotal(data.grand_total || 0);
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
            <td class="px-4 py-3 text-center text-sm flex gap-2 justify-center">
                <button onclick="editExpense(${item.expense_id})" 
                        style="background: transparent; border: none; color: #3b82f6; cursor: pointer; display: flex; align-items: center; justify-content: center;" 
                        title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="currentColor" fill-rule="evenodd"><path d="M2 6.857A4.857 4.857 0 0 1 6.857 2H12a1 1 0 1 1 0 2H6.857A2.857 2.857 0 0 0 4 6.857v10.286A2.857 2.857 0 0 0 6.857 20h10.286A2.857 2.857 0 0 0 20 17.143V12a1 1 0 1 1 2 0v5.143A4.857 4.857 0 0 1 17.143 22H6.857A4.857 4.857 0 0 1 2 17.143z"/><path d="m15.137 13.219l-2.205 1.33l-1.033-1.713l2.205-1.33l.003-.002a1.2 1.2 0 0 0 .232-.182l5.01-5.036a3 3 0 0 0 .145-.157c.331-.386.821-1.15.228-1.746c-.501-.504-1.219-.028-1.684.381a6 6 0 0 0-.36.345l-.034.034l-4.94 4.965a1.2 1.2 0 0 0-.27.41l-.824 2.073a.2.2 0 0 0 .29.245l1.032 1.713c-1.805 1.088-3.96-.74-3.18-2.698l.825-2.072a3.2 3.2 0 0 1 .71-1.081l4.939-4.966l.029-.029c.147-.15.641-.656 1.24-1.02c.327-.197.849-.458 1.494-.508c.74-.059 1.53.174 2.15.797a2.9 2.9 0 0 1 .845 1.75a3.15 3.15 0 0 1-.23 1.517c-.29.717-.774 1.244-.987 1.457l-5.01 5.036q-.28.281-.62.487m4.453-7.126s-.004.003-.013.006z"/></g></svg>
                </button>
                <button onclick="deleteExpense(${item.expense_id})" 
                        style="background: transparent; border: none; color: #ef5350; cursor: pointer; display: flex; align-items: center; justify-content: center;" 
                        title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M5 3h2a1 1 0 0 0-2 0M4 3a2 2 0 1 1 4 0h2.5a.5.5 0 0 1 0 1h-.441l-.443 5.17A2 2 0 0 1 7.623 11H4.377a2 2 0 0 1-1.993-1.83L1.941 4H1.5a.5.5 0 0 1 0-1zm3.5 3a.5.5 0 0 0-1 0v2a.5.5 0 0 0 1 0zM5 5.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M3.38 9.085a1 1 0 0 0 .997.915h3.246a1 1 0 0 0 .996-.915L9.055 4h-6.11z"/></svg>
                </button>
            </td>
        </tr>
    `}).join('');
}

function openAddExpenseModal() {
    if (!currentEventId) {
        showNotification('Please select an event first', 'error');
        return;
    }
    
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

function editExpense(expenseId) {
    if (!currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders();
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/finance.php?action=get&expense_id=${expenseId}&event_id=${currentEventId}`, { headers })
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
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    if (!currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders();
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/finance.php?action=delete`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            event_id: currentEventId,
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
    if (!currentEventId) {
        showNotification('No event selected', 'error');
        return;
    }
    
    const headers = getUserHeaders();
    headers['Content-Type'] = 'application/json';
    
    fetch(`${API_BASE}/finance.php?action=list&event_id=${currentEventId}`, { headers })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const items = data.data;
                let csv = 'Description,Quantity,Unit Price,Total\n';
                
                let grandTotal = 0;
                items.forEach(item => {
                    const total = parseFloat(item.total).toFixed(2);
                    const unitPrice = parseFloat(item.unit_price).toFixed(2);
                    csv += `"${item.description}",${item.quantity},${unitPrice},${total}\n`;
                    grandTotal += parseFloat(total);
                });
                
                csv += `\n"Grand Total",,,"${grandTotal.toFixed(2)}"\n`;
                
                // Create blob and download
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `event-${currentEventId}-expenses.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                showNotification('Expenses exported successfully', 'success');
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
            
            if (!currentEventId) {
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
            
            const headers = getUserHeaders();
            headers['Content-Type'] = 'application/json';
            
            const data = {
                event_id: currentEventId,
                description: description,
                quantity: quantity,
                unit_price: unit_price
            };
            
            if (isEditing) {
                data.expense_id = this.dataset.editId;
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
        });
    }
});

function loadFinanceData(eventId) {
    // Load finance data for the Finance tab
    if (!eventId) return;
    
    // Placeholder - will eventually fetch budget and expense data from API
    const expensesTable = document.getElementById('expensesTableBody');
    if (expensesTable && expensesTable.parentElement) {
        expensesTable.innerHTML = '<tr><td colspan="5" class="empty-message">No expense items added</td></tr>';
    }
}

function loadPostmortemData(eventId) {
    // Load postmortem data for the Postmortem tab
    if (!eventId) return;
    
    console.log('📊 Loading postmortem data for event:', eventId);
    
    // First calculate metrics from existing data
    fetch(`${API_BASE}/postmortem.php?action=calculate&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        console.log('📊 Postmortem calculation:', data);
    })
    .catch(err => console.error('Error calculating postmortem:', err));
    
    // Fetch postmortem data from API
    fetch(`${API_BASE}/postmortem.php?action=get&event_id=${eventId}`, {
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            const pm = data.data;
            
            console.log('✓ Postmortem data loaded:', pm);
            
            // Update statistics cards
            document.getElementById('postmortemRegistrations').textContent = pm.registered_count || 0;
            document.getElementById('postmortemAttendanceRate').textContent = (pm.attendance_rate || 0).toFixed(1) + '%';
            document.getElementById('postmortemTaskCompletion').textContent = (pm.task_completion_rate || 0).toFixed(0) + '%';
            document.getElementById('postmortemLogisticsCompletion').textContent = (pm.logistics_completion_rate || 0).toFixed(0) + '%';
            
            // Update Event Dynamics
            const maxInitial = Math.max(pm.initial_attendees || 0, pm.actual_attendees || 0, 1);
            document.getElementById('eventDynamicsInitial').textContent = pm.initial_attendees || 0;
            document.getElementById('eventDynamicsInitialBar').style.width = ((pm.initial_attendees || 0) / maxInitial * 100) + '%';
            
            document.getElementById('eventDynamicsActual').textContent = pm.actual_attendees || 0;
            document.getElementById('eventDynamicsActualBar').style.width = ((pm.actual_attendees || 0) / maxInitial * 100) + '%';
            
            document.getElementById('eventDynamicsRegistered').textContent = pm.registered_count || 0;
            document.getElementById('eventDynamicsRegisteredBar').style.width = ((pm.registered_count || 0) / Math.max(maxInitial, pm.registered_count || 1) * 100) + '%';
            
            document.getElementById('eventDynamicsAttended').textContent = pm.attended_count || 0;
            document.getElementById('eventDynamicsAttendedBar').style.width = ((pm.attended_count || 0) / Math.max(pm.registered_count || 1, pm.attended_count || 1) * 100) + '%';
            
            // Update Communication Mix
            const maxComm = Math.max(pm.communications_sent || 0, pm.communications_scheduled || 0, pm.communications_draft || 0, 1);
            document.getElementById('commMixSent').textContent = pm.communications_sent || 0;
            document.getElementById('commMixSentBar').style.width = ((pm.communications_sent || 0) / maxComm * 100) + '%';
            
            document.getElementById('commMixScheduled').textContent = pm.communications_scheduled || 0;
            document.getElementById('commMixScheduledBar').style.width = ((pm.communications_scheduled || 0) / maxComm * 100) + '%';
            
            document.getElementById('commMixDraft').textContent = pm.communications_draft || 0;
            document.getElementById('commMixDraftBar').style.width = ((pm.communications_draft || 0) / maxComm * 100) + '%';
            

            
            // Update button states
            if (pm.automated_report_generated) {
                document.getElementById('automatedReportBtn').textContent = '✓ Automated Report Generated';
                document.getElementById('automatedReportBtn').disabled = true;
            } else {
                document.getElementById('automatedReportBtn').textContent = 'Automated Report';
                document.getElementById('automatedReportBtn').disabled = false;
            }
            
            if (pm.log_report_created) {
                document.getElementById('logReportBtn').textContent = '✓ Log Report Created';
                document.getElementById('logReportBtn').disabled = false;
            } else {
                document.getElementById('logReportBtn').textContent = 'Log Report';
                document.getElementById('logReportBtn').disabled = false;
            }
        }
    })
    .catch(err => console.error('Error loading postmortem data:', err));
}

// ============= ATTENDEES MANAGEMENT =============

function loadAttendees() {
    if (!currentEventId) {
        console.warn('❌ loadAttendees: No currentEventId set');
        return;
    }
    
    console.log('📋 Loading attendees for EVENT ID:', currentEventId);
    
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
            
            // Separate attendees by status - use status field as the authoritative source
            attendeesData.initial = data.data.filter(a => a.status !== 'ATTENDED');
            attendeesData.actual = data.data.filter(a => a.status === 'ATTENDED');
            
            // Sync to window object
            window.attendeesData = attendeesData;
            
            console.log('✓ Initial List:', attendeesData.initial.length, '| Actual Attendees:', attendeesData.actual.length);
            
            renderAttendees();
            
            // Refresh KPI data when attendees change
            if (currentEventId) {
                loadKPIData(currentEventId);
            }
        } else {
            console.error('❌ Failed to load attendees:', data.message || 'No data returned');
            // Still render empty state
            attendeesData.initial = [];
            attendeesData.actual = [];
            renderAttendees();
            
            // Refresh KPI with empty data
            if (currentEventId) {
                loadKPIData(currentEventId);
            }
        }
    })
    .catch(error => {
        console.error('❌ Error loading attendees:', error);
        // Still render empty state
        attendeesData.initial = [];
        attendeesData.actual = [];
        renderAttendees();
        
        // Refresh KPI with empty data
        if (currentEventId) {
            loadKPIData(currentEventId);
        }
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
                <td style="padding: 15px; color: #333; font-size: 13px;">${escapeHtml(getField(attendee, 'phone'))}</td>
                <td style="padding: 15px; text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="showQRCode('${escapeHtml(regCode)}')" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px;" title="View QR Code">📱</button>
                        ${showUnmarkBtn ? `<button onclick="markAttendeeAsInitial('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #FF9800;" title="Mark as Initial">↩</button>` : `<button onclick="markAttendeeAsAttended('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #4CAF50;" title="Mark as Attended">✓</button>`}
                        <button onclick="deleteAttendee('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #f44336;" title="Delete">🗑</button>
                    </div>
                </td>
            </tr>
        `;
    };
    
    // Render initial list
    if (attendeesData.initial.length === 0) {
        console.log('ℹ Initial list is empty');
        initialBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999; font-size: 14px;">No registered participants yet</td></tr>';
    } else {
        console.log('✓ Rendering ' + attendeesData.initial.length + ' initial attendees');
        initialBody.innerHTML = attendeesData.initial.map((attendee, index) => {
            return renderAttendeeRow(attendee, index, false);
        }).join('');
    }
    
    // Render actual attendees
    if (attendeesData.actual.length === 0) {
        console.log('ℹ Actual attendees list is empty');
        actualBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999; font-size: 14px;">No attendees marked yet</td></tr>';
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
    const initialBtn = document.getElementById('initialListTab');
    const actualBtn = document.getElementById('actualListTab');
    const initialContent = document.getElementById('initialListContent');
    const actualContent = document.getElementById('actualAttendeesContent');
    
    console.log('📋 switchAttendeesTab called with:', tab);
    console.log('Buttons found - initialBtn:', !!initialBtn, 'actualBtn:', !!actualBtn);
    console.log('Content divs found - initialContent:', !!initialContent, 'actualContent:', !!actualContent);
    
    if (!initialBtn || !actualBtn || !initialContent || !actualContent) {
        console.error('❌ Missing elements for tab switching!');
        console.error('  - initialBtn:', initialBtn ? 'found' : 'NOT FOUND');
        console.error('  - actualBtn:', actualBtn ? 'found' : 'NOT FOUND');
        console.error('  - initialContent:', initialContent ? 'found' : 'NOT FOUND');
        console.error('  - actualContent:', actualContent ? 'found' : 'NOT FOUND');
        return;
    }
    
    if (tab === 'initial') {
        console.log('✓ Switching TO Initial List tab');
        // Style Initial List button as active with gradient
        initialBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
        initialBtn.style.color = 'white';
        initialBtn.style.opacity = '1';
        // Style Actual Attendees button as inactive
        actualBtn.style.background = 'white';
        actualBtn.style.color = '#4b5563';
        actualBtn.style.opacity = '1';
        // Show Initial List content
        initialContent.style.display = 'block';
        actualContent.style.display = 'none';
        console.log('✓ Initial List tab is now visible');
    } else if (tab === 'actual') {
        console.log('✓ Switching TO Actual Attendees tab');
        // Style Initial List button as inactive
        initialBtn.style.background = 'white';
        initialBtn.style.color = '#4b5563';
        initialBtn.style.opacity = '1';
        // Style Actual Attendees button as active with gradient
        actualBtn.style.background = 'linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%)';
        actualBtn.style.color = 'white';
        actualBtn.style.opacity = '1';
        // Show Actual Attendees content
        initialContent.style.display = 'none';
        actualContent.style.display = 'block';
        console.log('✓ Actual Attendees tab is now visible');
    } else {
        console.warn('⚠️ Unknown tab:', tab);
    }
}

// Alias for switchAttendeesTab for backward compatibility
function switchAttendeesList(tab) {
    console.log('🔄 switchAttendeesList called with:', tab);
    switchAttendeesTab(tab);
}

// Search attendees
function searchAttendees(query) {
    const initialBody = document.getElementById('initialListBody');
    const actualBody = document.getElementById('actualAttendeesBody');
    
    if (!initialBody || !actualBody) {
        console.error('❌ Attendees table bodies not found');
        return;
    }
    
    const q = query.toLowerCase();
    console.log('🔍 Searching attendees for:', q);
    
    // Filter initial attendees - search by full_name, first_name, middle_name, last_name, company, job_title, email
    const filteredInitial = attendeesData.initial.filter(a =>
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.first_name || '').toLowerCase().includes(q) ||
        (a.middle_name || '').toLowerCase().includes(q) ||
        (a.last_name || '').toLowerCase().includes(q) ||
        (a.company || '').toLowerCase().includes(q) ||
        (a.job_title || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
    );
    
    // Filter actual attendees - search by full_name, first_name, middle_name, last_name, company, job_title, email
    const filteredActual = attendeesData.actual.filter(a =>
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.first_name || '').toLowerCase().includes(q) ||
        (a.middle_name || '').toLowerCase().includes(q) ||
        (a.last_name || '').toLowerCase().includes(q) ||
        (a.company || '').toLowerCase().includes(q) ||
        (a.job_title || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
    );
    
    // Helper function to get field value
    const getField = (obj, field) => {
        const val = obj[field];
        if (val === null || val === undefined) return '';
        return String(val).trim();
    };
    
    // Helper function to render attendee row
    const renderAttendeeRow = (attendee, index, showUnmarkBtn) => {
        const regCode = attendee.registration_code || '';
        
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
                        ${showUnmarkBtn ? `<button onclick="markAttendeeAsInitial('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #FF9800;" title="Mark as Initial">↩</button>` : `<button onclick="markAttendeeAsAttended('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #4CAF50;" title="Mark as Attended">✓</button>`}
                        <button onclick="deleteAttendee('${escapeHtml(regCode)}', ${index})" style="background: transparent; border: 1px solid #ddd; width: 36px; height: 36px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #f44336;" title="Delete">🗑</button>
                    </div>
                </td>
            </tr>
        `;
    };
    
    // Render filtered results
    if (filteredInitial.length === 0) {
        initialBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999; font-size: 14px;">No attendees found</td></tr>';
    } else {
        initialBody.innerHTML = filteredInitial.map((attendee, index) => {
            return renderAttendeeRow(attendee, index, false);
        }).join('');
    }
    
    if (filteredActual.length === 0) {
        actualBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999; font-size: 14px;">No attendees found</td></tr>';
    } else {
        actualBody.innerHTML = filteredActual.map((attendee, index) => {
            return renderAttendeeRow(attendee, index, true);
        }).join('');
    }
    
    console.log('✓ Search complete: Initial=' + filteredInitial.length + ', Actual=' + filteredActual.length);
}

// Register searchAttendees as a global function for admin.js
window.searchAttendeesImpl = searchAttendees;

// Export attendees
function exportAttendees() {
    const allAttendees = [...attendeesData.initial, ...attendeesData.actual];
    
    if (allAttendees.length === 0) {
        alert('No attendees to export');
        return;
    }
    
    // Create CSV content
    let csv = 'NO.,FULL NAME,COMPANY,JOB TITLE,EMAIL,PHONE,STATUS\n';
    
    allAttendees.forEach((attendee, idx) => {
        const fullName = (attendee.full_name || '-').replace(/"/g, '""');
        const company = (attendee.company || '-').replace(/"/g, '""');
        const jobTitle = (attendee.job_title || '-').replace(/"/g, '""');
        const email = (attendee.email || '-').replace(/"/g, '""');
        const phone = (attendee.phone || '-').replace(/"/g, '""');
        const status = attendeesData.actual.includes(attendee) ? 'ATTENDED' : 'INITIAL';
        
        csv += `${idx + 1},"${fullName}","${company}","${jobTitle}","${email}","${phone}","${status}"\n`;
    });
    
    // Create a blob and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendees-export-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function markAttendeeAsAttended(registrationCode, index) {
    // Move from initial to actual
    const attendee = attendeesData.initial.find(a => 
        (a.registration_code === registrationCode)
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
            registration_code: registrationCode,
            status: 'ATTENDED'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Move attendee from initial to actual
            attendeesData.initial = attendeesData.initial.filter(a => 
                a.registration_code !== registrationCode
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

function markAttendeeAsInitial(registrationCode, index) {
    // Move from actual back to initial
    const attendee = attendeesData.actual.find(a => 
        (a.registration_code === registrationCode)
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
            registration_code: registrationCode,
            status: 'REGISTERED'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Move attendee from actual back to initial
            attendeesData.actual = attendeesData.actual.filter(a => 
                a.registration_code !== registrationCode
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
    console.log('🔍 createOtherInformationModals called');
    
    // Check if any modal already exists (don't create duplicates)
    const deleteModal = document.getElementById('deleteOtherInformationModal');
    const removeModal = document.getElementById('removeCoordinatorModal');
    
    if (deleteModal && removeModal) {
        console.log('✅ Modals already exist, skipping creation');
        return;
    }
    
    console.log('🔍 Creating modals... deleteModal:', !!deleteModal, 'removeModal:', !!removeModal);
    
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
                        <button type="button" style="padding: 8px 16px; background: #1E73BB; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;" onclick="submitOtherInformation()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="#f4f3f1" fill-rule="evenodd" clip-rule="evenodd"><path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12m10-8a8 8 0 1 0 0 16a8 8 0 0 0 0-16"/><path d="M13 7a1 1 0 1 0-2 0v4H7a1 1 0 1 0 0 2h4v4a1 1 0 1 0 2 0v-4h4a1 1 0 1 0 0-2h-4z"/></g></svg>
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

        <!-- Delete Other Information Confirmation Modal -->
        <div id="deleteOtherInformationModal" class="modal" style="z-index: 1000;" onclick="if(event.target.id === 'deleteOtherInformationModal') { document.getElementById('deleteOtherInformationModal').classList.remove('active'); }">
            <div class="modal-content" style="max-width: 500px; width: 90%; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); background: white; padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #dc2626;">Delete Other Information</h2>
                    <button type="button" onclick="document.getElementById('deleteOtherInformationModal').classList.remove('active')" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999; line-height: 1; flex-shrink: 0;">×</button>
                </div>
                
                <p style="color: #6b7280; margin: 16px 0; font-size: 14px; line-height: 1.6;">Are you sure you want to delete this information? This action cannot be undone.</p>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                    <button type="button" style="padding: 10px 24px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;" onclick="document.getElementById('deleteOtherInformationModal').classList.remove('active')">
                        Cancel
                    </button>
                    <button type="button" style="padding: 10px 24px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;" onclick="confirmDeleteOtherInformation()">
                        Delete
                    </button>
                </div>
            </div>
        </div>

        <!-- Remove Coordinator Confirmation Modal -->
        <div id="removeCoordinatorModal" class="modal" style="z-index: 1000;" onclick="if(event.target.id === 'removeCoordinatorModal') { document.getElementById('removeCoordinatorModal').classList.remove('active'); }">
            <div class="modal-content" style="max-width: 500px; width: 90%; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); background: white; padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #dc2626;">Remove Coordinator</h2>
                    <button type="button" onclick="document.getElementById('removeCoordinatorModal').classList.remove('active')" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999; line-height: 1; flex-shrink: 0;">×</button>
                </div>
                
                <p style="color: #6b7280; margin: 16px 0; font-size: 14px; line-height: 1.6;">Are you sure you want to remove this coordinator from the event? This action cannot be undone.</p>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                    <button type="button" style="padding: 10px 24px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;" onclick="document.getElementById('removeCoordinatorModal').classList.remove('active')">
                        Cancel
                    </button>
                    <button type="button" style="padding: 10px 24px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;" onclick="confirmRemoveCoordinator()">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `;
    
    console.log('🔍 Inserting modals into DOM...');
    document.body.insertAdjacentHTML('beforeend', modalsHTML);
    
    // Verify modals were inserted
    const deleteModalAfter = document.getElementById('deleteOtherInformationModal');
    const removeModalAfter = document.getElementById('removeCoordinatorModal');
    console.log('✅ Modals inserted successfully. deleteModal:', !!deleteModalAfter, 'removeModal:', !!removeModalAfter);
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

// Delete other information - Show confirmation modal
function deleteOtherInformation(metadataId) {
    console.log('🔍 deleteOtherInformation called:', { metadataId });
    
    let modal = document.getElementById('deleteOtherInformationModal');
    console.log('🔍 Modal found:', !!modal);
    
    if (!modal) {
        console.log('🔍 Modal not found, creating modals...');
        createOtherInformationModals();
        modal = document.getElementById('deleteOtherInformationModal');
        console.log('🔍 Modal after creation:', !!modal);
    }
    
    if (!modal) {
        console.error('❌ Modal still not found after creation!');
        showNotification('Error: Modal not available', 'error');
        return;
    }
    
    // Store the metadata ID for confirmation
    window.pendingDeleteMetadataId = metadataId;
    console.log('✅ Adding active class to modal');
    modal.classList.add('active');
}

// Confirm delete other information
function confirmDeleteOtherInformation() {
    const metadataId = window.pendingDeleteMetadataId;
    const eventId = currentEventId;
    
    console.log('🔍 confirmDeleteOtherInformation called:', { metadataId, eventId });
    
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
            document.getElementById('deleteOtherInformationModal').classList.remove('active');
            if (data.success) {
                console.log('✅ Deletion successful, refreshing data');
                showNotification('Other Information deleted successfully!', 'success');
                if (typeof loadOtherInfo === 'function') {
                    loadOtherInfo(eventId);
                } else if (typeof loadEventOtherInfo === 'function') {
                    loadEventOtherInfo();
                }
            } else {
                showNotification('Error: ' + (data.message || 'Failed to delete'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error deleting other information', 'error');
            document.getElementById('deleteOtherInformationModal').classList.remove('active');
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
        const response = await fetch(`${API_BASE}/coordinators.php?action=list`, {
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
        listContainer.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No coordinators available</p>';
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

// Confirm file fully loaded
console.log('✅ event-details.js fully loaded - switchTab function available:', typeof switchTab);

// ========== COMPREHENSIVE WINDOW ASSIGNMENT SECTION ==========
// Ensure all KPI functions are available on the window object for onclick handlers
(function() {
    console.log('🔄 [WINDOW SETUP] Starting window assignment for event-details.js functions...');
    
    // Check if functions exist before assigning
    if (typeof saveKPIDetails === 'function') {
        window.saveKPIDetails = saveKPIDetails;
        console.log('✅ [WINDOW SETUP] window.saveKPIDetails assigned successfully');
    } else {
        console.error('❌ [WINDOW SETUP] saveKPIDetails function not found!');
    }
    
    if (typeof loadKPIData === 'function') {
        window.loadKPIData = loadKPIData;
        console.log('✅ [WINDOW SETUP] window.loadKPIData assigned successfully');
    } else {
        console.error('❌ [WINDOW SETUP] loadKPIData function not found!');
    }
    
    if (typeof loadSavedKPIData === 'function') {
        window.loadSavedKPIData = loadSavedKPIData;
        console.log('✅ [WINDOW SETUP] window.loadSavedKPIData assigned successfully');
    } else {
        console.error('❌ [WINDOW SETUP] loadSavedKPIData function not found!');
    }
    
    if (typeof initializeKPIInputListeners === 'function') {
        window.initializeKPIInputListeners = initializeKPIInputListeners;
        console.log('✅ [WINDOW SETUP] window.initializeKPIInputListeners assigned successfully');
    } else {
        console.error('❌ [WINDOW SETUP] initializeKPIInputListeners function not found!');
    }
    
    if (typeof setDefaultKPIValues === 'function') {
        window.setDefaultKPIValues = setDefaultKPIValues;
        console.log('✅ [WINDOW SETUP] window.setDefaultKPIValues assigned successfully');
    } else {
        console.error('❌ [WINDOW SETUP] setDefaultKPIValues function not found!');
    }
    
    if (typeof switchTab === 'function') {
        window.switchTab = switchTab;
        console.log('✅ [WINDOW SETUP] window.switchTab assigned successfully');
    } else {
        console.error('❌ [WINDOW SETUP] switchTab function not found!');
    }
    
    console.log('🟢 [WINDOW SETUP] Completed. KPI functions available:', {
        saveKPIDetails: typeof window.saveKPIDetails,
        loadKPIData: typeof window.loadKPIData,
        loadSavedKPIData: typeof window.loadSavedKPIData,
        initializeKPIInputListeners: typeof window.initializeKPIInputListeners,
        setDefaultKPIValues: typeof window.setDefaultKPIValues,
        switchTab: typeof window.switchTab
    });
})();

// ==================== EMAIL BLASTS FUNCTIONS ====================

console.log('[EMAIL] Starting email functions initialization...');

function loadEmailBlasts(eventId) {
    console.log('[EMAIL] Loading email blasts for event:', eventId);
    const tableBody = document.getElementById('emailBlastsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">Loading...</td></tr>';
    
    fetch(`${API_BASE}/emails.php?action=list&event_id=${eventId}`, {
        method: 'GET',
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        console.log('[EMAIL] Response:', data);
        
        if (data.success && data.data) {
            const emails = data.data;
            
            if (emails.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No email blasts yet. Click "Add Email Blast" to create one.</td></tr>';
                return;
            }
            
            tableBody.innerHTML = emails.map(email => {
                const scheduledDate = email.scheduled_date ? new Date(email.scheduled_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }) : '-';
                
                const statusColor = {
                    'Draft': 'bg-gray-100 text-gray-800',
                    'Scheduled': 'bg-blue-100 text-blue-800',
                    'Sent': 'bg-green-100 text-green-800',
                    'Cancelled': 'bg-red-100 text-red-800'
                }[email.status] || 'bg-gray-100 text-gray-800';
                
                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm text-gray-900">${scheduledDate}</td>
                        <td class="px-4 py-3 text-sm font-medium text-gray-900">${email.email_blast_name}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">${email.audience}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">${email.details ? email.details.substring(0, 30) + (email.details.length > 30 ? '...' : '') : '-'}</td>
                        <td class="px-4 py-3">
                            <span class="inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
                                ${email.status}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <button onclick="editEmailBlast(${email.email_id})" class="inline-block text-blue-600 hover:text-blue-800 mr-3" title="Edit">
                                ✎
                            </button>
                            <button onclick="deleteEmailBlast(${email.email_id})" class="inline-block text-red-600 hover:text-red-800" title="Delete">
                                🗑
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-red-500">Error loading emails: ${data.message}</td></tr>`;
        }
    })
    .catch(error => {
        console.error('[EMAIL] Error:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-red-500">Error loading emails</td></tr>`;
    });
}

window.loadEmailBlasts = loadEmailBlasts;
console.log('[EMAIL] ✓ loadEmailBlasts function defined and assigned to window');
console.log('  Type:', typeof window.loadEmailBlasts);
console.log('  Callable:', typeof window.loadEmailBlasts === 'function');

function openAddEmailBlastModal() {
    console.log('[EMAIL] Opening add email blast modal');
    document.getElementById('addEmailBlastModal').classList.remove('hidden');
    document.getElementById('modalTitle').textContent = 'Add Email Blast';
    document.getElementById('modalSaveBtn').textContent = 'Create';
    
    // Clear form
    document.getElementById('emailScheduledDate').value = '';
    document.getElementById('emailBlastName').value = '';
    document.getElementById('emailAudience').value = '';
    document.getElementById('emailDetails').value = '';
    document.getElementById('emailStatus').value = 'Draft';
    
    // Store that we're creating (not editing)
    window.currentEditingEmailId = null;
}

window.openAddEmailBlastModal = openAddEmailBlastModal;
console.log('[EMAIL] ✓ openAddEmailBlastModal function defined and assigned to window');
console.log('  Type:', typeof window.openAddEmailBlastModal);

function closeAddEmailBlastModal() {
    console.log('[EMAIL] Closing email blast modal');
    document.getElementById('addEmailBlastModal').classList.add('hidden');
    window.currentEditingEmailId = null;
}

window.closeAddEmailBlastModal = closeAddEmailBlastModal;
console.log('[EMAIL] ✓ closeAddEmailBlastModal function defined and assigned to window');
console.log('  Type:', typeof window.closeAddEmailBlastModal);

function saveEmailBlast() {
    console.log('[EMAIL] Saving email blast');
    const eventId = currentEventId;
    
    if (!eventId) {
        alert('Error: Event ID not found');
        return;
    }
    
    const scheduledDate = document.getElementById('emailScheduledDate').value;
    const blastName = document.getElementById('emailBlastName').value.trim();
    const audience = document.getElementById('emailAudience').value.trim();
    const details = document.getElementById('emailDetails').value.trim();
    const status = document.getElementById('emailStatus').value;
    
    if (!blastName || !audience) {
        alert('Please fill in required fields (Email Blast and Audience)');
        return;
    }
    
    const isEditing = window.currentEditingEmailId !== null;
    const url = `${API_BASE}/emails.php?action=${isEditing ? 'update' : 'create'}`;
    
    const payload = {
        event_id: eventId,
        email_blast_name: blastName,
        audience: audience,
        details: details,
        status: status,
        scheduled_date: scheduledDate || null
    };
    
    if (isEditing) {
        payload.email_id = window.currentEditingEmailId;
    }
    
    fetch(url, {
        method: 'POST',
        headers: getUserHeaders(),
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        console.log('[EMAIL] Save response:', data);
        
        if (data.success) {
            alert(isEditing ? '✓ Email blast updated successfully!' : '✓ Email blast created successfully!');
            closeAddEmailBlastModal();
            loadEmailBlasts(eventId);
        } else {
            alert('Error: ' + (data.message || 'Failed to save email blast'));
        }
    })
    .catch(error => {
        console.error('[EMAIL] Error:', error);
        alert('Error: Failed to save email blast');
    });
}

window.saveEmailBlast = saveEmailBlast;
console.log('[EMAIL] ✓ saveEmailBlast function defined and assigned to window');
console.log('  Type:', typeof window.saveEmailBlast);

function editEmailBlast(emailId) {
    console.log('[EMAIL] Editing email blast:', emailId);
    const eventId = currentEventId;
    
    // Find the email in the table
    fetch(`${API_BASE}/emails.php?action=list&event_id=${eventId}`, {
        method: 'GET',
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            const email = data.data.find(e => e.email_id === emailId);
            
            if (email) {
                // Populate form with email data
                document.getElementById('emailScheduledDate').value = email.scheduled_date ? new Date(email.scheduled_date).toISOString().slice(0, 16) : '';
                document.getElementById('emailBlastName').value = email.email_blast_name;
                document.getElementById('emailAudience').value = email.audience;
                document.getElementById('emailDetails').value = email.details || '';
                document.getElementById('emailStatus').value = email.status;
                
                // Mark as editing
                window.currentEditingEmailId = emailId;
                
                // Show modal with updated title and button
                document.getElementById('addEmailBlastModal').classList.remove('hidden');
                document.getElementById('modalTitle').textContent = 'Edit Email Blast';
                document.getElementById('modalSaveBtn').textContent = 'Update';
            }
        }
    })
    .catch(error => console.error('[EMAIL] Error loading email:', error));
}

window.editEmailBlast = editEmailBlast;
console.log('[EMAIL] ✓ editEmailBlast function defined and assigned to window');
console.log('  Type:', typeof window.editEmailBlast);

function deleteEmailBlast(emailId) {
    console.log('[EMAIL] Deleting email blast:', emailId);
    
    if (!confirm('Are you sure you want to delete this email blast?')) {
        return;
    }
    const eventId = currentEventId;
    
    fetch(`${API_BASE}/emails.php?action=delete&email_id=${emailId}`, {
        method: 'POST',
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        console.log('[EMAIL] Delete response:', data);
        
        if (data.success) {
            alert('✓ Email blast deleted successfully!');
            loadEmailBlasts(eventId);
        } else {
            alert('Error: ' + (data.message || 'Failed to delete email blast'));
        }
    })
    .catch(error => {
        console.error('[EMAIL] Error:', error);
        alert('Error: Failed to delete email blast');
    });
}

window.deleteEmailBlast = deleteEmailBlast;
console.log('[DEBUG] Assigned window.deleteEmailBlast immediately after function definition');

// Expose functions to window
window.loadEmailBlasts = loadEmailBlasts;
window.openAddEmailBlastModal = openAddEmailBlastModal;
window.closeAddEmailBlastModal = closeAddEmailBlastModal;
window.saveEmailBlast = saveEmailBlast;
window.editEmailBlast = editEmailBlast;
window.deleteEmailBlast = deleteEmailBlast;
console.log('[DEBUG] Assigned window.loadEmailBlasts immediately after function definition');
console.log('[DEBUG] Assigned window.openAddEmailBlastModal immediately after function definition');
console.log('[DEBUG] Assigned window.closeAddEmailBlastModal immediately after function definition');
console.log('[DEBUG] Assigned window.saveEmailBlast immediately after function definition');
console.log('[DEBUG] Assigned window.editEmailBlast immediately after function definition');
console.log('[DEBUG] Assigned window.deleteEmailBlast immediately after function definition');

// ============= POSTMORTEM FUNCTIONS =============

function savePostmortemData() {
    if (!currentEventId) {
        alert('Event ID is required');
        return;
    }
    
    const formData = new FormData();
    formData.append('event_id', currentEventId);
    
    // Get current values from display
    formData.append('initial_attendees', document.getElementById('eventDynamicsInitial').textContent.replace(/[^0-9]/g, ''));
    formData.append('actual_attendees', document.getElementById('eventDynamicsActual').textContent.replace(/[^0-9]/g, ''));
    formData.append('registered_count', document.getElementById('eventDynamicsRegistered').textContent.replace(/[^0-9]/g, ''));
    formData.append('attended_count', document.getElementById('eventDynamicsAttended').textContent.replace(/[^0-9]/g, ''));
    formData.append('attendance_rate', parseFloat(document.getElementById('postmortemAttendanceRate').textContent) || 0);
    formData.append('task_completion_rate', parseFloat(document.getElementById('postmortemTaskCompletion').textContent) || 0);
    formData.append('logistics_completion_rate', parseFloat(document.getElementById('postmortemLogisticsCompletion').textContent) || 0);
    formData.append('communications_sent', document.getElementById('commMixSent').textContent.replace(/[^0-9]/g, ''));
    formData.append('communications_scheduled', document.getElementById('commMixScheduled').textContent.replace(/[^0-9]/g, ''));
    formData.append('communications_draft', document.getElementById('commMixDraft').textContent.replace(/[^0-9]/g, ''));
    
    fetch(`${API_BASE}/postmortem.php?action=save`, {
        method: 'POST',
        headers: getUserHeaders(),
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Postmortem data saved successfully!', 'success');
            loadPostmortemData(currentEventId);
        } else {
            showNotification(data.message || 'Failed to save postmortem data', 'error');
        }
    })
    .catch(err => {
        console.error('Error saving postmortem:', err);
        showNotification('Error saving postmortem data', 'error');
    });
}
window.savePostmortemData = savePostmortemData; // Immediate assignment

function generateAutomatedReport() {
    // Use window.currentEventId if local currentEventId is not set
    const eventId = currentEventId || window.currentEventId;
    
    if (!eventId) {
        console.warn('⚠️ Event ID is required to generate a report');
        return;
    }
    
    const formData = new FormData();
    formData.append('event_id', eventId);
    formData.append('report_type', 'automated');
    
    fetch(`${API_BASE}/postmortem.php?action=generate_report`, {
        method: 'POST',
        headers: getUserHeaders(),
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Automated report generated successfully!', 'success');
            document.getElementById('automatedReportBtn').textContent = '✓ Automated Report Generated';
            document.getElementById('automatedReportBtn').disabled = true;
        } else {
            showNotification(data.message || 'Failed to generate report', 'error');
        }
    })
    .catch(err => {
        console.error('Error generating report:', err);
        showNotification('Error generating automated report', 'error');
    });
}
window.generateAutomatedReport = generateAutomatedReport; // Immediate assignment
console.log('✅ [FUNCTION] window.generateAutomatedReport assigned:', typeof window.generateAutomatedReport);

function showLogReportForm() {
    console.log('[TOGGLE] showLogReportForm called - showing list view');
    const metricsView = document.getElementById('postmortemMetricsView');
    const listView = document.getElementById('postmortemLogReportView');
    const formView = document.getElementById('postmortemCreateReportView');
    
    if (metricsView) {
        metricsView.style.display = 'none';
    }
    if (formView) {
        formView.style.display = 'none';
    }
    if (listView) {
        listView.style.display = 'block';
    }
}

window.showLogReportForm = showLogReportForm; // Immediate assignment
console.log('✅ [FUNCTION] window.showLogReportForm assigned:', typeof window.showLogReportForm);

function showCreateReportForm() {
    console.log('[TOGGLE] showCreateReportForm called - showing form view');
    const metricsView = document.getElementById('postmortemMetricsView');
    const listView = document.getElementById('postmortemLogReportView');
    const formView = document.getElementById('postmortemCreateReportView');
    
    if (metricsView) {
        metricsView.style.display = 'none';
    }
    if (listView) {
        listView.style.display = 'none';
    }
    if (formView) {
        formView.style.display = 'block';
    }
}

window.showCreateReportForm = showCreateReportForm; // Immediate assignment
console.log('✅ [FUNCTION] window.showCreateReportForm assigned:', typeof window.showCreateReportForm);

function hideCreateReportForm() {
    console.log('[TOGGLE] hideCreateReportForm called');
    const metricsView = document.getElementById('postmortemMetricsView');
    const formView = document.getElementById('postmortemCreateReportView');
    
    if (formView) {
        formView.style.display = 'none';
    }
    if (metricsView) {
        metricsView.style.display = 'block';
    }
}

window.hideCreateReportForm = hideCreateReportForm; // Immediate assignment
console.log('✅ [FUNCTION] window.hideCreateReportForm assigned:', typeof window.hideCreateReportForm);

function loadLogReportData() {
    if (!currentEventId) return;
    
    // Fetch existing log report data
    fetch(`${API_BASE}/postmortem.php?action=get&event_id=${currentEventId}`, {
        headers: getUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            const pm = data.data;
            
            // Populate form fields with existing data
            document.getElementById('logTitleIntroduction').value = pm.log_title_introduction || '';
            document.getElementById('logIssueSummary').value = pm.log_issue_summary || '';
            document.getElementById('logRootCauseAnalysis').value = pm.log_root_cause_analysis || '';
            document.getElementById('logImpactMitigation').value = pm.log_impact_mitigation || '';
            document.getElementById('logResolutionRecovery').value = pm.log_resolution_recovery || '';
            document.getElementById('logCorrectiveMeasures').value = pm.log_corrective_measures || '';
            document.getElementById('logFeedbackSurvey').value = pm.log_feedback_survey || '';
            document.getElementById('logLessonLearned').value = pm.log_lesson_learned || '';
            document.getElementById('logReviewMeasurements').value = pm.log_review_measurements || '';
        }
    })
    .catch(err => console.error('Error loading log report data:', err));
}
window.loadLogReportData = loadLogReportData; // Immediate assignment
console.log('✅ [FUNCTION] window.loadLogReportData assigned:', typeof window.loadLogReportData);

function saveLogReport() {
    console.log('✅ [REAL] saveLogReport called - REAL FUNCTION EXECUTING');
    
    if (!currentEventId) {
        console.warn('❌ Event ID is missing:', currentEventId);
        alert('Event ID is required');
        return;
    }
    
    console.log('📋 Collecting form data...');
    
    // Check if form fields exist
    const fields = ['logTitleIntroduction', 'logIssueSummary', 'logRootCauseAnalysis', 'logImpactMitigation', 'logResolutionRecovery', 'logCorrectiveMeasures', 'logFeedbackSurvey', 'logLessonLearned', 'logReviewMeasurements'];
    
    for (let fieldId of fields) {
        const field = document.getElementById(fieldId);
        if (!field) {
            console.warn(`⚠️ Form field not found: ${fieldId}`);
        }
    }
    
    const formData = new FormData();
    formData.append('event_id', currentEventId);
    formData.append('log_title_introduction', document.getElementById('logTitleIntroduction')?.value || '');
    formData.append('log_issue_summary', document.getElementById('logIssueSummary')?.value || '');
    formData.append('log_root_cause_analysis', document.getElementById('logRootCauseAnalysis')?.value || '');
    formData.append('log_impact_mitigation', document.getElementById('logImpactMitigation')?.value || '');
    formData.append('log_resolution_recovery', document.getElementById('logResolutionRecovery')?.value || '');
    formData.append('log_corrective_measures', document.getElementById('logCorrectiveMeasures')?.value || '');
    formData.append('log_feedback_survey', document.getElementById('logFeedbackSurvey')?.value || '');
    formData.append('log_lesson_learned', document.getElementById('logLessonLearned')?.value || '');
    formData.append('log_review_measurements', document.getElementById('logReviewMeasurements')?.value || '');
    
    console.log('📤 Sending form data to API:', {
        event_id: currentEventId,
        log_fields: 9,
        api_base: API_BASE
    });
    
    const apiUrl = `${API_BASE}/postmortem.php?action=save_log_report`;
    console.log('🌐 API URL:', apiUrl);
    
    fetch(apiUrl, {
        method: 'POST',
        headers: getUserHeaders(),
        body: formData
    })
    .then(response => {
        console.log('📡 Response status:', response.status, response.statusText);
        return response.json();
    })
    .then(data => {
        console.log('✅ API Response:', data);
        if (data.success) {
            console.log('✅ Success! Showing notification...');
            showNotification('Log report saved successfully!', 'success');
            const btn = document.getElementById('logReportBtn');
            if (btn) {
                btn.textContent = '✓ Log Report Created';
                btn.disabled = false;
            }
            // Return to metrics view after save
            setTimeout(() => {
                console.log('Hiding form and returning to metrics view...');
                if (typeof hideCreateReportForm === 'function') {
                    hideCreateReportForm();
                } else {
                    const formView = document.getElementById('postmortemCreateReportView');
                    if (formView) formView.style.display = 'none';
                }
            }, 1000);
        } else {
            console.warn('❌ API returned success: false');
            showNotification(data.message || 'Failed to save log report', 'error');
        }
    })
    .catch(err => {
        console.error('❌ Error saving log report:', err);
        console.error('Error details:', err.stack);
        showNotification('Error saving log report: ' + err.message, 'error');
    });
}
window.saveLogReport = saveLogReport; // Immediate assignment
console.log('✅ [FUNCTION] window.saveLogReport assigned:', typeof window.saveLogReport);

function exportPostmortemPDF() {
    if (!currentEventId) {
        alert('Event ID is required');
        return;
    }
    
    // Gather postmortem data
    const postmortemData = {
        event_id: currentEventId,
        event_name: document.title,
        registrations: document.getElementById('postmortemRegistrations').textContent,
        attendance_rate: document.getElementById('postmortemAttendanceRate').textContent,
        task_completion: document.getElementById('postmortemTaskCompletion').textContent,
        logistics_completion: document.getElementById('postmortemLogisticsCompletion').textContent,
        initial_attendees: document.getElementById('eventDynamicsInitial').textContent,
        actual_attendees: document.getElementById('eventDynamicsActual').textContent,
        registered: document.getElementById('eventDynamicsRegistered').textContent,
        attended: document.getElementById('eventDynamicsAttended').textContent,
        communications_sent: document.getElementById('commMixSent').textContent,
        communications_scheduled: document.getElementById('commMixScheduled').textContent,
        communications_draft: document.getElementById('commMixDraft').textContent
    };
    
    // Create a simple HTML table for PDF export
    let htmlContent = `
    <html>
    <head>
        <title>Postmortem Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1F4CC4; }
            h2 { color: #333; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f0f0f0; }
            .metric { display: inline-block; width: 48%; margin: 1%; padding: 10px; border: 1px solid #ddd; }
        </style>
    </head>
    <body>
        <h1>Event Postmortem Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        
        <h2>Key Metrics</h2>
        <div class="metric"><strong>Registrations:</strong> ${postmortemData.registrations}</div>
        <div class="metric"><strong>Attendance Rate:</strong> ${postmortemData.attendance_rate}</div>
        <div class="metric"><strong>Task Completion:</strong> ${postmortemData.task_completion}</div>
        <div class="metric"><strong>Logistics Completion:</strong> ${postmortemData.logistics_completion}</div>
        
        <h2>Event Dynamics</h2>
        <table>
            <tr><td>Initial Attendees</td><td>${postmortemData.initial_attendees}</td></tr>
            <tr><td>Actual Attendees</td><td>${postmortemData.actual_attendees}</td></tr>
            <tr><td>Registered</td><td>${postmortemData.registered}</td></tr>
            <tr><td>Attended</td><td>${postmortemData.attended}</td></tr>
        </table>
        
        <h2>Communication Mix</h2>
        <table>
            <tr><td>Sent</td><td>${postmortemData.communications_sent}</td></tr>
            <tr><td>Scheduled</td><td>${postmortemData.communications_scheduled}</td></tr>
            <tr><td>Draft</td><td>${postmortemData.communications_draft}</td></tr>
        </table>
    </body>
    </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
}
window.exportPostmortemPDF = exportPostmortemPDF; // Immediate assignment

// Alias function for HTML onclick handler
function exportPostmortemReport(eventId) {
    console.log('📄 exportPostmortemReport called for event:', eventId);
    
    if (!eventId) {
        eventId = window.currentEventId || currentEventId;
    }
    
    if (!eventId) {
        showNotification('Event ID is required to export report', 'error');
        return;
    }
    
    // Call the PDF export function
    exportPostmortemPDF();
}
window.exportPostmortemReport = exportPostmortemReport; // Make globally accessible

// Flag to indicate event-details.js has fully loaded
window.eventDetailsJSLoaded = true;

console.log('[EVENT-DETAILS] ✓ event-details.js fully loaded');
console.log('[EVENT-DETAILS] Postmortem functions available:');
console.log('  - generateAutomatedReport:', typeof window.generateAutomatedReport);
console.log('  - showLogReportForm:', typeof window.showLogReportForm);
console.log('  - hideLogReportForm:', typeof window.hideLogReportForm);
console.log('  - loadLogReportData:', typeof window.loadLogReportData);
console.log('  - saveLogReport:', typeof window.saveLogReport);
console.log('  - exportPostmortemPDF:', typeof window.exportPostmortemPDF);
console.log('  - savePostmortemData:', typeof window.savePostmortemData);
console.log('  - closeAddEmailBlastModal:', typeof window.closeAddEmailBlastModal);
console.log('  - saveEmailBlast:', typeof window.saveEmailBlast);
console.log('  - editEmailBlast:', typeof window.editEmailBlast);
console.log('  - deleteEmailBlast:', typeof window.deleteEmailBlast);

// ====== CRITICAL: Ensure Postmortem Functions Are Globally Accessible ======
console.log('\n🔒 [SAFETY-WRAP] Ensuring postmortem functions are accessible...');

// Create wrappers to ensure functions are callable even if assignment fails
if (!window.generateAutomatedReport) {
    console.warn('⚠️ generateAutomatedReport not found, creating wrapper');
    window.generateAutomatedReport = function() {
        const originalFunc = window._generateAutomatedReport; 
        if (typeof originalFunc === 'function') {
            return originalFunc.apply(this, arguments);
        } else {
            console.error('generateAutomatedReport original function not found');
        }
    };
}

if (!window.showLogReportForm) {
    console.warn('⚠️ showLogReportForm not found, creating wrapper');
    window.showLogReportForm = function() {
        document.getElementById('postmortemMetricsView').classList.add('hidden');
        document.getElementById('postmortemLogReportView').classList.remove('hidden');
        if (typeof window.loadLogReportData === 'function') {
            window.loadLogReportData();
        }
    };
}

if (!window.hideLogReportForm) {
    console.warn('⚠️ hideLogReportForm not found, creating wrapper');
    window.hideLogReportForm = function() {
        document.getElementById('postmortemLogReportView').classList.add('hidden');
        document.getElementById('postmortemMetricsView').classList.remove('hidden');
    };
}

if (!window.loadLogReportData) {
    console.warn('⚠️ loadLogReportData not found, creating wrapper');
    window.loadLogReportData = function() {
        if (!window.currentEventId) return;
        fetch(`../api/postmortem.php?action=get&event_id=${window.currentEventId}`, {
            headers: {'X-User-Role': JSON.parse(localStorage.getItem('admin') || '{}').role || JSON.parse(localStorage.getItem('user') || '{}').role_name}
        })
        .then(r => r.json())
        .then(data => {
            if (data.success && data.data) {
                const pm = data.data;
                document.getElementById('logTitleIntroduction').value = pm.log_title_introduction || '';
                document.getElementById('logIssueSummary').value = pm.log_issue_summary || '';
                document.getElementById('logRootCauseAnalysis').value = pm.log_root_cause_analysis || '';
                document.getElementById('logImpactMitigation').value = pm.log_impact_mitigation || '';
                document.getElementById('logResolutionRecovery').value = pm.log_resolution_recovery || '';
                document.getElementById('logCorrectiveMeasures').value = pm.log_corrective_measures || '';
                document.getElementById('logFeedbackSurvey').value = pm.log_feedback_survey || '';
                document.getElementById('logLessonLearned').value = pm.log_lesson_learned || '';
                document.getElementById('logReviewMeasurements').value = pm.log_review_measurements || '';
            }
        });
    };
}

if (!window.saveLogReport) {
    console.warn('⚠️ saveLogReport not found, creating wrapper');
    window.saveLogReport = function() {
        if (!window.currentEventId) {
            alert('Event ID is required');
            return;
        }
        const formData = new FormData();
        formData.append('event_id', window.currentEventId);
        formData.append('log_title_introduction', document.getElementById('logTitleIntroduction').value);
        formData.append('log_issue_summary', document.getElementById('logIssueSummary').value);
        formData.append('log_root_cause_analysis', document.getElementById('logRootCauseAnalysis').value);
        formData.append('log_impact_mitigation', document.getElementById('logImpactMitigation').value);
        formData.append('log_resolution_recovery', document.getElementById('logResolutionRecovery').value);
        formData.append('log_corrective_measures', document.getElementById('logCorrectiveMeasures').value);
        formData.append('log_feedback_survey', document.getElementById('logFeedbackSurvey').value);
        formData.append('log_lesson_learned', document.getElementById('logLessonLearned').value);
        formData.append('log_review_measurements', document.getElementById('logReviewMeasurements').value);
        
        fetch(`../api/postmortem.php?action=save_log_report`, {
            method: 'POST',
            headers: {'X-User-Role': JSON.parse(localStorage.getItem('admin') || '{}').role || JSON.parse(localStorage.getItem('user') || '{}').role_name},
            body: formData
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                alert('Log report saved successfully!');
                document.getElementById('logReportBtn').textContent = '✓ Log Report Created';
                setTimeout(() => window.hideLogReportForm(), 1000);
            }
        });
    };
}

console.log('✅ [SAFETY-WRAP] All postmortem function wrappers are ready');
console.log('Final check:');
console.log('  - window.generateAutomatedReport:', typeof window.generateAutomatedReport);
console.log('  - window.showLogReportForm:', typeof window.showLogReportForm);
console.log('  - window.hideLogReportForm:', typeof window.hideLogReportForm);
console.log('  - window.loadLogReportData:', typeof window.loadLogReportData);
console.log('  - window.saveLogReport:', typeof window.saveLogReport);
// All event edit functions are defined at the TOP of this file (lines 20-192)