// API Base URL - Updated for nested folder structure
const API_BASE = '../api';

// Chart instances
let registrationChart = null;
let attendanceChart = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    loadDashboard();
    setupNavigation();
    setupFormHandlers();
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
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    
    // Load user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show page
            const pages = document.querySelectorAll('.page');
            pages.forEach(p => p.classList.remove('active'));
            
            const targetPage = document.getElementById(page);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // Load page-specific content
                if (page === 'dashboard') loadDashboard();
                else if (page === 'events') loadEvents();
                else if (page === 'participants') loadParticipants();
                else if (page === 'reports') loadReports();
            }
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
    
    const dates = trends.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const counts = trends.map(t => t.count);
    
    registrationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'New Registrations',
                data: counts,
                borderColor: '#5B6FD8',
                backgroundColor: 'rgba(91, 111, 216, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#5B6FD8',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
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
                    '#FFC107'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
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
}

function displayEvents(events) {
    console.log('✓ displayEvents() called with', events.length, 'events');
    
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
    const html = events.map(event => `
        <div class="event-card">
            <div class="event-image" ${event.image_url ? `style="background-image: url('${event.image_url}'); background-size: cover; background-position: center;"` : ''}>
                ${!event.image_url ? '📅' : ''}
            </div>
            <div class="event-content">
                <h3 class="event-name">${event.event_name}</h3>
                <div class="event-date">📅 ${new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div class="event-location">📍 ${event.location || 'TBD'}</div>
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
                    ${event.is_private ? '<span class="badge badge-private">Private</span>' : ''}
                </div>
                <div style="display: flex; gap: 8px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                    <button class="btn btn-small" style="flex: 1; background: white; border: 2px solid #C41E3A; color: #C41E3A; font-weight: 600;" onclick="openEditEventModal(${event.event_id})">✏️ Edit</button>
                    <button class="btn btn-small" style="flex: 1; background: #dc3545; color: white;" onclick="deleteEvent(${event.event_id}, '${event.event_name}')">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    console.log('✓ Events rendered to container');
}

// ============ PARTICIPANTS ============
function loadParticipants() {
    console.log('✓ loadParticipants() called');
    const tbody = document.querySelector('#participantsTable tbody');
    
    if (!tbody) {
        console.error('✗ participantsTable tbody not found');
        return;
    }
    
    // Show loading message
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Loading participants...</td></tr>';
    
    fetch(`${API_BASE}/participants.php?action=list`)
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
            tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: #d32f2f; padding: 20px;">❌ Error loading participants: ${error.message}</td></tr>`;
        });
    
    // Setup search with debounce
    const searchBox = document.getElementById('participantSearch');
    if (searchBox) {
        let searchTimeout;
        searchBox.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length > 2) {
                searchTimeout = setTimeout(() => searchParticipants(query), 300);
            } else if (query.length === 0) {
                clearTimeout(searchTimeout);
                loadParticipants();
            }
        });
    }
}

function displayParticipants(participants) {
    const tbody = document.querySelector('#participantsTable tbody');
    
    if (!tbody) return;
    
    if (participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No participants found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = participants
        .filter(p => p.full_name) // Only show unique participant records
        .map(p => `
            <tr>
                <td>${p.full_name}</td>
                <td>${p.email}</td>
                <td>${p.event_name || '-'}</td>
                <td>${p.registration_code || '-'}</td>
                <td><span class="status-badge badge-${p.status ? p.status.toLowerCase() : 'registered'}">${p.status || 'REGISTERED'}</span></td>
            </tr>
        `).join('');
}

function searchParticipants(query) {
    fetch(`${API_BASE}/participants.php?action=search&q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.querySelector('#participantsTable tbody');
                if (tbody && data.data.length > 0) {
                    tbody.innerHTML = data.data.map(p => `
                        <tr>
                            <td>${p.full_name}</td>
                            <td>${p.email}</td>
                            <td>${p.department_name || '-'}</td>
                            <td colspan="3"></td>
                        </tr>
                    `).join('');
                }
            }
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

function openCreateEventModal() {
    console.log('Opening create event modal');
    const modal = document.getElementById('createEventModal');
    if (modal) {
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
    
    // Validate required fields
    const eventName = document.getElementById('eventName')?.value;
    const capacity = document.getElementById('eventCapacity')?.value;
    const eventDate = document.getElementById('eventDate')?.value;
    
    console.log('Form data:');
    console.log('  Event Name:', eventName);
    console.log('  Capacity:', capacity);
    console.log('  Event Date:', eventDate);
    
    if (!eventName || !capacity || !eventDate) {
        console.error('✗ Required fields missing');
        showNotification('Please fill in all required fields (Name, Capacity, Date)', 'error');
        return false;
    }
    
    const formData = new FormData(formEl);
    
    // Handle checkbox
    const isPrivateCheckbox = document.getElementById('eventPrivate');
    const isPrivate = isPrivateCheckbox && isPrivateCheckbox.checked ? 1 : 0;
    formData.set('is_private', isPrivate);
    console.log('✓ Checkbox set, is_private:', isPrivate);
    
    // Add created_by
    formData.append('created_by', 1);
    console.log('✓ created_by appended: 1');
    
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
            showNotification('Event created successfully!', 'success');
            
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
    if (confirm('Are you sure you want to logout?')) {
        // Clear user data from localStorage
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = 'login.html';
    }
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
                document.getElementById('editEventDescription').value = event.description || '';
                document.getElementById('editEventPrivate').checked = event.is_private == 1;
                
                // Reset file input
                document.getElementById('editEventImage').value = '';
                
                // Display current image
                const currentImageDiv = document.getElementById('editCurrentImage');
                if (event.image_url) {
                    currentImageDiv.innerHTML = `
                        <div style="padding: 10px; background: #f0f0f0; border-radius: 4px;">
                            <p style="margin: 0 0 8px 0; font-weight: bold;">Current Image:</p>
                            <img src="${event.image_url}" alt="${event.event_name}" style="max-width: 100%; max-height: 150px; border-radius: 4px;">
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
    formData.append('description', document.getElementById('editEventDescription').value || '');
    formData.append('is_private', document.getElementById('editEventPrivate').checked ? 1 : 0);
    
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
            showNotification('Event updated successfully!', 'success');
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
    
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
        console.log('Delete cancelled by user');
        return false;
    }
    
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
            showNotification('Event deleted successfully!', 'success');
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
