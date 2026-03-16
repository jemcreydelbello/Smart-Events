// Edit Event Modal - Standalone JS
// Completely isolated from event-details.js to avoid conflicts

console.log('📝 edit-event-modal.js loaded');

// Global variable
var editCurrentEventId = null;

// Define API_BASE if not already defined
if (typeof API_BASE === 'undefined') {
    window.API_BASE = '../api';
}

// Get user headers function
function getEditModalUserHeaders() {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    return {
        'Authorization': `Bearer ${token}`,
        'X-User-ID': userId,
        'Content-Type': 'application/json'
    };
}

// Open edit event modal
window.openEditEventModal = function(eventId) {
    console.log('🔧 Opening edit modal for event ID:', eventId);
    editCurrentEventId = eventId;
    loadEventDataIntoEditForm(eventId);
    
    setTimeout(() => {
        const modal = document.getElementById('editEventModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('✓ Edit modal opened');
        }
    }, 200);
};

// Close edit event modal
window.closeEditEventModal = function() {
    console.log('🔙 Closing edit modal');
    const modal = document.getElementById('editEventModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
    const form = document.getElementById('editEventForm');
    if (form) {
        form.reset();
    }
};

// Load event data into edit form
function loadEventDataIntoEditForm(eventId) {
    console.log('📋 Loading event data for ID:', eventId);
    
    fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`, {
        method: 'GET',
        headers: getEditModalUserHeaders()
    })
    .then(response => response.json())
    .then(data => {
        console.log('📥 Event data received:', data);
        
        if (data.success && data.data) {
            const event = data.data;
            
            // Set hidden event ID
            const eventIdInput = document.getElementById('editEventId');
            if (eventIdInput) {
                eventIdInput.value = event.event_id;
            }
            
            // Populate form fields
            const fields = {
                'editEventName': 'event_name',
                'editEventCapacity': 'capacity',
                'editEventLocation': 'location',
                'editEventDescription': 'description',
                'editEventRegistrationLink': 'registration_link',
                'editEventWebsiteLink': 'website_link'
            };
            
            // Handle datetime fields
            const startEventInput = document.getElementById('editStartEvent');
            if (startEventInput && event.start_event) {
                startEventInput.value = formatDateTimeForInput(event.start_event);
            }
            
            const endEventInput = document.getElementById('editEndEvent');
            if (endEventInput && event.end_event) {
                endEventInput.value = formatDateTimeForInput(event.end_event);
            }
            
            const registrationStartInput = document.getElementById('editRegistrationStart');
            if (registrationStartInput && event.registration_start) {
                registrationStartInput.value = formatDateTimeForInput(event.registration_start);
            }
            
            const registrationEndInput = document.getElementById('editRegistrationEnd');
            if (registrationEndInput && event.registration_end) {
                registrationEndInput.value = formatDateTimeForInput(event.registration_end);
            }
            
            // Populate other fields
            for (const [inputId, fieldName] of Object.entries(fields)) {
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = event[fieldName] || '';
                }
            }
            
            // Handle private event checkbox
            const privateCheckbox = document.getElementById('editEventPrivate');
            if (privateCheckbox && event.is_private) {
                privateCheckbox.checked = event.is_private === 1 || event.is_private === '1';
                handleEditPrivateEventToggle();
                if (privateCheckbox.checked && event.access_code) {
                    const codeInput = document.getElementById('editEventPrivateCode');
                    if (codeInput) {
                        codeInput.value = event.access_code;
                    }
                }
            }
            
            // Load current image
            loadEditEventImage(event);
            
            // Attach event listeners
            attachEditEventListeners();
            
            console.log('✓ Event form loaded successfully');
        } else {
            alert('Failed to load event data: ' + (data.message || 'Unknown error'));
            closeEditEventModal();
        }
    })
    .catch(error => {
        console.error('❌ Error loading event:', error);
        alert('Error loading event: ' + error.message);
        closeEditEventModal();
    });
}

// Format datetime for input
function formatDateTimeForInput(dateTimeStr) {
    if (!dateTimeStr) return '';
    
    // Handle different datetime formats
    let date = new Date(dateTimeStr);
    
    // Format as YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Load event image
function loadEditEventImage(event) {
    const currentImageDiv = document.getElementById('editCurrentImage');
    if (!currentImageDiv) return;
    
    if (event.image_url || event.image) {
        const imageUrl = getEditImageUrl(event.image_url || event.image);
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Event Cover Image';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        currentImageDiv.innerHTML = '';
        currentImageDiv.appendChild(img);
    } else {
        currentImageDiv.innerHTML = '<span style="color: #999;">📷 No image</span>';
    }
}

// Get image URL
function getEditImageUrl(imagePath) {
    if (!imagePath) return '';
    
    // Already full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // Already has directory path
    if (imagePath.includes('/')) {
        return imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    }
    
    // Just filename - add events directory
    return `../uploads/events/${imagePath}`;
}

// Preview edit event image
window.previewEditEventImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('editEventImagePreview');
        if (preview) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Preview';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            preview.innerHTML = '';
            preview.appendChild(img);
        }
    };
    reader.readAsDataURL(file);
};

// Handle private event checkbox toggle
window.handleEditPrivateEventToggle = function() {
    const checkbox = document.getElementById('editEventPrivate');
    const codeDisplay = document.getElementById('editPrivateCodeDisplay');
    const codeInput = document.getElementById('editEventPrivateCode');
    
    if (checkbox && codeDisplay && codeInput) {
        if (checkbox.checked) {
            // Generate access code if not already set
            if (!codeInput.value) {
                codeInput.value = generateEditAccessCode();
            }
            codeDisplay.style.display = 'block';
        } else {
            codeDisplay.style.display = 'none';
            codeInput.value = '';
        }
    }
};

// Generate access code
function generateEditAccessCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Update schedule preview
function updateEditSchedulePreview() {
    const startInput = document.getElementById('editStartEvent');
    const endInput = document.getElementById('editEndEvent');
    const container = document.getElementById('editSchedulePreviewContainer');
    const text = document.getElementById('editSchedulePreviewText');
    
    if (!startInput || !endInput || !container) return;
    
    if (startInput.value && endInput.value) {
        const start = new Date(startInput.value);
        const end = new Date(endInput.value);
        
        const startStr = start.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const endStr = end.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (text) {
            text.textContent = `${startStr} → ${endStr}`;
        }
        container.style.display = 'flex';
    } else {
        container.style.display = 'none';
    }
}

// Update registration preview
function updateEditRegistrationPreview() {
    const startInput = document.getElementById('editRegistrationStart');
    const endInput = document.getElementById('editRegistrationEnd');
    const container = document.getElementById('editRegistrationPreviewContainer');
    const text = document.getElementById('editRegistrationPreviewText');
    
    if (!startInput || !endInput || !container) return;
    
    if (startInput.value && endInput.value) {
        const start = new Date(startInput.value);
        const end = new Date(endInput.value);
        
        const startStr = start.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const endStr = end.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (text) {
            text.textContent = `${startStr} → ${endStr}`;
        }
        container.style.display = 'flex';
    } else {
        container.style.display = 'none';
    }
}

// Attach event listeners
function attachEditEventListeners() {
    const startInput = document.getElementById('editStartEvent');
    const endInput = document.getElementById('editEndEvent');
    const regStartInput = document.getElementById('editRegistrationStart');
    const regEndInput = document.getElementById('editRegistrationEnd');
    
    if (startInput) {
        startInput.addEventListener('change', updateEditSchedulePreview);
    }
    if (endInput) {
        endInput.addEventListener('change', updateEditSchedulePreview);
    }
    if (regStartInput) {
        regStartInput.addEventListener('change', updateEditRegistrationPreview);
    }
    if (regEndInput) {
        regEndInput.addEventListener('change', updateEditRegistrationPreview);
    }
    
    // Trigger previews on load
    updateEditSchedulePreview();
    updateEditRegistrationPreview();
}

// Submit edit event form
window.submitEditEventForm = function() {
    const eventId = document.getElementById('editEventId').value || editCurrentEventId;
    
    if (!eventId) {
        alert('Event ID is missing');
        return;
    }
    
    const submitBtn = document.querySelector('#editEventForm button[onclick="submitEditEventForm()"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Update Event';
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
    }
    
    // Check if image is being uploaded
    const imageInput = document.getElementById('editEventImage');
    const hasNewImage = imageInput && imageInput.files && imageInput.files[0];
    
    let fetchOptions = {
        method: 'PUT',
        headers: getEditModalUserHeaders()
    };
    
    if (hasNewImage) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('event_id', eventId);
        formData.append('event_name', document.getElementById('editEventName').value);
        formData.append('capacity', document.getElementById('editEventCapacity').value);
        formData.append('location', document.getElementById('editEventLocation').value);
        formData.append('description', document.getElementById('editEventDescription').value);
        formData.append('start_event', document.getElementById('editStartEvent').value);
        formData.append('end_event', document.getElementById('editEndEvent').value);
        formData.append('registration_start', document.getElementById('editRegistrationStart').value);
        formData.append('registration_end', document.getElementById('editRegistrationEnd').value);
        formData.append('registration_link', document.getElementById('editEventRegistrationLink').value);
        formData.append('website_link', document.getElementById('editEventWebsiteLink').value);
        formData.append('is_private', document.getElementById('editEventPrivate').checked ? 1 : 0);
        formData.append('access_code', document.getElementById('editEventPrivateCode').value);
        formData.append('image', imageInput.files[0]);
        
        // Don't set Content-Type for FormData
        delete fetchOptions.headers['Content-Type'];
        fetchOptions.body = formData;
    } else {
        // JSON request
        const jsonData = {
            event_id: eventId,
            event_name: document.getElementById('editEventName').value,
            capacity: document.getElementById('editEventCapacity').value,
            location: document.getElementById('editEventLocation').value,
            description: document.getElementById('editEventDescription').value,
            start_event: document.getElementById('editStartEvent').value,
            end_event: document.getElementById('editEndEvent').value,
            registration_start: document.getElementById('editRegistrationStart').value,
            registration_end: document.getElementById('editRegistrationEnd').value,
            registration_link: document.getElementById('editEventRegistrationLink').value,
            website_link: document.getElementById('editEventWebsiteLink').value,
            is_private: document.getElementById('editEventPrivate').checked ? 1 : 0,
            access_code: document.getElementById('editEventPrivateCode').value
        };
        
        fetchOptions.body = JSON.stringify(jsonData);
    }
    
    fetch(`${API_BASE}/events.php`, fetchOptions)
    .then(response => response.json())
    .then(data => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
        if (data.success) {
            alert('✓ Event updated successfully');
            closeEditEventModal();
            
            // Refresh event details if function exists
            if (typeof loadEventDetails === 'function') {
                loadEventDetails(eventId);
            }
            
            // Refresh events list if function exists
            if (typeof loadAllEvents === 'function') {
                loadAllEvents();
            }
        } else {
            alert('❌ Failed to update event: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        alert('Error updating event: ' + error.message);
    });
};

console.log('✓ edit-event-modal.js initialized');
