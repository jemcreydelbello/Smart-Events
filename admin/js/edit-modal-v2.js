// ============================================
// EDIT MODAL FUNCTIONALITY - V2
// Handles event details, cover and gallery modals
// All functions assigned to window for global access
// ============================================

// API_BASE is defined in event-details.js, but add fallback
var API_BASE = window.API_BASE || '../api';

// Initialize global variables on window object if they don't exist
// These may already exist in admin.js
if (!window.editGalleryFilesStore) {
    window.editGalleryFilesStore = [];
}
if (!window.editGalleryExistingImages) {
    window.editGalleryExistingImages = [];
}

// ============================================
// CSS STYLES FOR EDIT MODALS
// ============================================
const editModalStyles = `
    /* Modal Styling */
    .modal {
      display: none !important;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      overflow-y: auto;
      align-items: center;
      justify-content: center;
    }
    
    .modal.active {
      display: flex !important;
      animation: fadeIn 0.3s ease-in;
    }
    
    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-height: 90vh;
      overflow-y: auto;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
`;

// Insert styles on page load
function injectEditModalStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = editModalStyles;
    document.head.appendChild(styleElement);
    console.log('✓ Edit modal styles injected');
}

// Initialize styles when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectEditModalStyles);
} else {
    injectEditModalStyles();
}

// ============================================
// EDIT EVENT DETAILS MODAL FUNCTIONS
// ============================================

window.openEditEventDetailsModal = function(eventId) {
    console.log('📝 Opening edit event details modal for event:', eventId);
    
    if (!eventId) {
        console.warn('❌ Event ID not found');
        if (typeof showNotification === 'function') {
            showNotification('Event ID not found', 'error');
        }
        return;
    }
    
    // Try to fetch event data from API
    fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.data) {
                const event = data.data;
                document.getElementById('editDetailsEventId').value = eventId;
                
                // Populate form with event data
                document.getElementById('editDetailsEventTitle').value = event.event_name || '';
                document.getElementById('editDetailsEventLocation').value = event.location || '';
                document.getElementById('editDetailsEventCapacity').value = event.capacity || '';
                document.getElementById('editDetailsEventDescription').value = event.description || '';
                document.getElementById('editDetailsRegistrationLink').value = event.registration_link || '';
                document.getElementById('editDetailsWebsite').value = event.website || '';
                
                // Handle datetime fields - API returns event_date + start_time separately
                let startEvent = '';
                let endEvent = '';
                if (event.event_date && event.start_time) {
                    startEvent = `${event.event_date}T${event.start_time.substring(0, 5)}`;
                }
                if (event.end_date && event.end_time) {
                    endEvent = `${event.end_date}T${event.end_time.substring(0, 5)}`;
                }
                
                const regStart = event.registration_start ? convertToDatetimeLocal(event.registration_start) : '';
                const regEnd = event.registration_end ? convertToDatetimeLocal(event.registration_end) : '';
                
                document.getElementById('editDetailsStartEvent').value = startEvent;
                document.getElementById('editDetailsEndEvent').value = endEvent;
                document.getElementById('editDetailsRegistrationStart').value = regStart;
                document.getElementById('editDetailsRegistrationEnd').value = regEnd;
                
                // Handle private event
                const isPrivate = event.is_private == 1;
                document.getElementById('editDetailsIsPrivate').checked = isPrivate;
                document.getElementById('editDetailsPrivateCode').value = event.access_code || '';
                
                if (isPrivate) {
                    document.getElementById('editDetailsPrivateCodeDisplay').style.display = 'block';
                } else {
                    document.getElementById('editDetailsPrivateCodeDisplay').style.display = 'none';
                }
                
                // Display current cover image (API returns image_url as filename only)
                if (event.image_url) {
                    // Construct the full image URL path
                    let imgSrc = event.image_url;
                    // If it's just a filename, prepend the uploads path
                    if (!imgSrc.includes('/')) {
                        imgSrc = '../uploads/events/' + imgSrc;
                    }
                    const imgHTML = `<img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" alt="Event cover image" onerror="console.error('Failed to load image:', this.src)">`;
                    document.getElementById('editDetailsCurrentImage').innerHTML = imgHTML;
                    console.log('🖼️ Loading cover image from:', imgSrc);
                } else {
                    console.log('ℹ️ No cover image for this event');
                }
                
                // Show the modal
                const modal = document.getElementById('editEventDetailsModal');
                if (modal) {
                    modal.classList.add('active');
                    console.log('✓ Edit event details modal opened');
                }
            } else {
                console.warn('❌ Failed to fetch event data');
                if (typeof showNotification === 'function') {
                    showNotification('Failed to load event data', 'error');
                }
            }
        })
        .catch(error => {
            console.error('❌ Error fetching event:', error);
            if (typeof showNotification === 'function') {
                showNotification('Error loading event data', 'error');
            }
        });
};

// Helper function to convert MySQL datetime to datetime-local format
function convertToDatetimeLocal(mysqlDatetime) {
    if (!mysqlDatetime) return '';
    // Replace space with 'T' for datetime-local format
    return mysqlDatetime.replace(' ', 'T').substring(0, 16);
}

window.closeEditEventDetailsModal = function() {
    console.log('🔙 Closing edit event details modal');
    const modal = document.getElementById('editEventDetailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
    const form = document.getElementById('editEventDetailsForm');
    if (form) {
        form.reset();
    }
    // Clear image preview
    const previewDiv = document.getElementById('editDetailsEventImagePreview');
    if (previewDiv) {
        previewDiv.innerHTML = '<svg style="width: 48px; height: 48px; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>Click to upload or drag & drop</span>';
    }
};

window.previewEditDetailsEventImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('🖼️ Previewing edit event image:', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imgHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
        document.getElementById('editDetailsEventImagePreview').innerHTML = imgHTML;
    };
    reader.readAsDataURL(file);
};

window.handleEditDetailsPrivateToggle = function() {
    const isChecked = document.getElementById('editDetailsIsPrivate').checked;
    const codeDisplay = document.getElementById('editDetailsPrivateCodeDisplay');
    
    if (isChecked) {
        // Generate random access code if not already set
        const codeField = document.getElementById('editDetailsPrivateCode');
        if (!codeField.value) {
            codeField.value = generateAccessCode();
        }
        codeDisplay.style.display = 'block';
    } else {
        codeDisplay.style.display = 'none';
    }
};

function generateAccessCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

window.submitEditEventDetails = function() {
    console.log('💾 Submitting edit event details');
    
    const eventId = document.getElementById('editDetailsEventId').value;
    const eventTitle = document.getElementById('editDetailsEventTitle').value.trim();
    const location = document.getElementById('editDetailsEventLocation').value.trim();
    const startEvent = document.getElementById('editDetailsStartEvent').value;
    const endEvent = document.getElementById('editDetailsEndEvent').value;
    const regStart = document.getElementById('editDetailsRegistrationStart').value;
    const regEnd = document.getElementById('editDetailsRegistrationEnd').value;
    const capacity = document.getElementById('editDetailsEventCapacity').value.trim();
    const description = document.getElementById('editDetailsEventDescription').value.trim();
    const registrationLink = document.getElementById('editDetailsRegistrationLink').value.trim();
    const website = document.getElementById('editDetailsWebsite').value.trim();
    const isPrivate = document.getElementById('editDetailsIsPrivate').checked ? 1 : 0;
    const privateCode = document.getElementById('editDetailsPrivateCode').value.trim();
    const imageFile = document.getElementById('editDetailsEventImage').files[0];
    
    // CRITICAL DEBUG
    console.log('🔍 FORM VALIDATION DEBUG:');
    console.log('  eventId:', eventId, '(type:', typeof eventId, ', length:', eventId.length, ')');
    console.log('  eventTitle:', eventTitle);
    console.log('  location:', location);
    console.log('  startEvent:', startEvent);
    console.log('  endEvent:', endEvent);
    console.log('  regStart:', regStart);
    console.log('  regEnd:', regEnd);
    console.log('  capacity:', capacity);
    
    // Validate required fields
    if (!eventTitle || !location || !startEvent || !endEvent || !regStart || !regEnd || !capacity) {
        console.warn('❌ Missing required fields');
        console.warn('  eventTitle:', !!eventTitle);
        console.warn('  location:', !!location);
        console.warn('  startEvent:', !!startEvent);
        console.warn('  endEvent:', !!endEvent);
        console.warn('  regStart:', !!regStart);
        console.warn('  regEnd:', !!regEnd);
        console.warn('  capacity:', !!capacity);
        if (typeof showNotification === 'function') {
            showNotification('Please fill in all required fields', 'error');
        }
        return;
    }
    
    // Validate capacity
    if (isNaN(capacity) || capacity <= 0) {
        console.warn('❌ Invalid capacity');
        if (typeof showNotification === 'function') {
            showNotification('Capacity must be a valid positive number', 'error');
        }
        return;
    }
    
    if (!eventId) {
        console.warn('❌ Event ID not found');
        if (typeof showNotification === 'function') {
            showNotification('Event ID not found', 'error');
        }
        return;
    }
    
    // Convert datetime-local to MySQL format (YYYY-MM-DD HH:MM:SS)
    const convertToMySQLDatetime = (datetimeLocalStr) => {
        if (!datetimeLocalStr) return '';
        return datetimeLocalStr.replace('T', ' ') + ':00';
    };
    
    // Prepare the data
    const formData = new FormData();
    formData.append('action', 'update_event');
    formData.append('event_id', eventId);
    formData.append('event_name', eventTitle);
    formData.append('location', location);
    formData.append('start_event', convertToMySQLDatetime(startEvent));
    formData.append('end_event', convertToMySQLDatetime(endEvent));
    formData.append('registration_start', convertToMySQLDatetime(regStart));
    formData.append('registration_end', convertToMySQLDatetime(regEnd));
    formData.append('capacity', capacity);
    formData.append('description', description);
    formData.append('registration_link', registrationLink);
    formData.append('website_link', website);
    formData.append('is_private', isPrivate);
    
    if (isPrivate) {
        formData.append('private_code', privateCode);
    }
    
    if (imageFile) {
        formData.append('cover_image', imageFile);
        console.log('📸 Attaching cover image:', imageFile.name, 'Size:', imageFile.size);
    }
    
    // Debug log FormData entries
    console.log('📋 FormData entries being sent:');
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
            console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
            console.log(`  ${key}: ${value}`);
        }
    }
    
    console.log('🌐 Sending POST to:', `${API_BASE}/events.php`);
    
    // Also send to debug logger
    fetch(`${API_BASE}/debug-logger.php`, {
        method: 'POST',
        body: formData
    }).catch(err => console.error('Debug log error:', err));
    
    // Send the update request
    fetch(`${API_BASE}/events.php`, {
        method: 'POST',
        body: formData,
        headers: (function() {
            const allHeaders = (typeof getUserHeaders === 'function') ? getUserHeaders() : {};
            // Remove Content-Type header when sending FormData - let browser handle it
            const headers = {};
            for (const key in allHeaders) {
                if (key !== 'Content-Type') {
                    headers[key] = allHeaders[key];
                }
            }
            return headers;
        })()
    })
        .then(response => {
            console.log('API Response status:', response.status, response.statusText);
            return response.json();
        })
        .then(data => {
            console.log('✅ API Response received:', data);
            if (data.success) {
                console.log('✅ Event details updated successfully');
                if (typeof showNotification === 'function') {
                    showNotification('Event details updated successfully!', 'success');
                }
                window.closeEditEventDetailsModal();
                // Refresh the page or reload event data
                if (typeof loadEventDetails === 'function') {
                    loadEventDetails();
                } else if (typeof location !== 'undefined') {
                    location.reload();
                }
            } else {
                console.error('❌ Error updating event:', data.message || 'Unknown error');
                if (typeof showNotification === 'function') {
                    showNotification('Error: ' + (data.message || 'Failed to update event'), 'error');
                }
            }
        })
        .catch(error => {
            console.error('❌ Network error:', error);
            if (typeof showNotification === 'function') {
                showNotification('Network error: ' + error.message, 'error');
            }
        });
};

// ============================================
// EDIT EVENT COVER MODAL FUNCTIONS
// ============================================

function setupEditCoverDragDrop() {
    const previewArea = document.getElementById('editCoverImagePreview');
    if (!previewArea) return;
    
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
            window.previewEditCoverImage({ target: { files: files } });
        }
    });
}

window.openEditEventCoverModal = function(catalogueId, eventName) {
    console.log('Opening edit cover modal for:', { catalogueId, eventName });
    
    document.getElementById('editCoverCatalogueId').value = catalogueId;
    document.getElementById('editCoverEventName').value = eventName;
    document.getElementById('editCoverImageInput').value = '';
    
    const previewArea = document.getElementById('editCoverImagePreview');
    previewArea.innerHTML = `
        <svg style="width: 48px; height: 48px; color: #94a3b8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span>Click to upload or drag & drop</span>
    `;
    previewArea.style.backgroundColor = 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)';
    previewArea.style.borderColor = '#cbd5e1';
    
    setupEditCoverDragDrop();
    document.getElementById('editEventCoverModal').classList.add('active');
};

window.closeEditEventCoverModal = function() {
    document.getElementById('editEventCoverModal').classList.remove('active');
};

window.previewEditCoverImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        if (typeof showNotification === 'function') {
            showNotification('Please select a valid image file', 'error');
        }
        return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        if (typeof showNotification === 'function') {
            showNotification('Image size must be less than 5MB', 'error');
        }
        document.getElementById('editCoverImageInput').value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewArea = document.getElementById('editCoverImagePreview');
        previewArea.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
        previewArea.style.backgroundColor = '#fff';
    };
    reader.readAsDataURL(file);
};

window.submitEditEventCover = function() {
    const catalogueId = document.getElementById('editCoverCatalogueId').value;
    const fileInput = document.getElementById('editCoverImageInput');
    
    if (!catalogueId) {
        if (typeof showNotification === 'function') {
            showNotification('Missing event information', 'error');
        }
        return;
    }
    
    if (!fileInput.files[0]) {
        if (typeof showNotification === 'function') {
            showNotification('Please select an image to upload', 'error');
        }
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('catalogue_id', catalogueId);
    formData.append('action', 'update_cover');
    formData.append('cover_image', file);
    
    const headers = (typeof getUserHeaders === 'function') ? getUserHeaders() : {};
    const fetchOptions = {
        method: 'POST',
        body: formData
    };
    
    const customHeaders = {};
    if (headers['X-User-Role']) customHeaders['X-User-Role'] = headers['X-User-Role'];
    if (headers['X-User-Id']) customHeaders['X-User-Id'] = headers['X-User-Id'];
    if (headers['X-Coordinator-Id']) customHeaders['X-Coordinator-Id'] = headers['X-Coordinator-Id'];
    if (Object.keys(customHeaders).length > 0) fetchOptions.headers = customHeaders;
    
    fetch(`${API_BASE}/catalogue.php`, fetchOptions)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (typeof showNotification === 'function') {
                    showNotification('Event cover updated successfully!', 'success');
                }
                window.closeEditEventCoverModal();
                if (typeof loadCatalogue === 'function') loadCatalogue();
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('Error: ' + (data.message || 'Failed to update cover'), 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error uploading cover:', error);
            if (typeof showNotification === 'function') {
                showNotification('Error uploading cover image: ' + error.message, 'error');
            }
        });
};

// ============================================
// EDIT EVENT GALLERY MODAL FUNCTIONS
// ============================================

window.openEditGalleryModal = function(catalogueId, eventName) {
    console.log('Opening edit gallery modal for:', { catalogueId, eventName });
    
    document.getElementById('editGalleryCatalogueId').value = catalogueId;
    document.getElementById('editGalleryEventName').value = eventName;
    document.getElementById('editGalleryImageInput').value = '';
    window.editGalleryFilesStore = [];
    window.editGalleryExistingImages = [];
    
    const container = document.getElementById('editGalleryImagesContainer');
    const plusBox = document.getElementById('editGalleryPlusBox');
    
    const imageElements = container.querySelectorAll('div[style*="aspect-ratio"], div[style*="position: relative"]');
    imageElements.forEach(el => el.remove());
    
    plusBox.style.display = 'flex';
    document.getElementById('editEventGalleryModal').classList.add('active');
    
    fetch(`${API_BASE}/catalogue.php?action=get_gallery&catalogue_id=${catalogueId}`, {
        headers: (typeof getUserHeaders === 'function') ? getUserHeaders() : {}
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data && Array.isArray(data.data)) {
                window.editGalleryExistingImages = data.data;
                window.displayExistingGalleryImages(data.data);
                if (data.data.length >= 5) {
                    plusBox.style.display = 'none';
                }
            }
        })
        .catch(error => console.error('Error fetching gallery images:', error));
};

window.displayExistingGalleryImages = function(images) {
    if (!images || images.length === 0) return;
    
    const container = document.getElementById('editGalleryImagesContainer');
    const plusBox = document.getElementById('editGalleryPlusBox');
    
    images.forEach(image => {
        const imageDiv = document.createElement('div');
        imageDiv.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; background: #f0f0f0; aspect-ratio: 1; width: 100px; height: 100px;';
        const imgUrl = (typeof getImageUrl === 'function') ? getImageUrl(image.image_url) : image.image_url;
        imageDiv.innerHTML = `
            <img src="${imgUrl}" alt="Gallery image" style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" onclick="window.removeExistingGalleryImage(${image.image_id})" 
                    style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">×</button>
        `;
        container.insertBefore(imageDiv, plusBox);
    });
};

window.closeEditGalleryModal = function() {
    document.getElementById('editEventGalleryModal').classList.remove('active');
};

window.previewEditGalleryImages = function(event) {
    const files = event.target.files;
    const container = document.getElementById('editGalleryImagesContainer');
    const plusBox = document.getElementById('editGalleryPlusBox');
    
    if (!files || files.length === 0) return;
    
    const existingImages = container.children.length - 1;
    const remainingSlots = 5 - existingImages;
    
    if (remainingSlots <= 0) {
        if (typeof showNotification === 'function') {
            showNotification('Maximum 5 images allowed for the gallery.', 'error');
        }
        event.target.value = '';
        return;
    }
    
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    
    filesToAdd.forEach((file) => {
        window.editGalleryFilesStore.push(file);
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDiv = document.createElement('div');
            imageDiv.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; background: #f0f0f0; aspect-ratio: 1; width: 100px; height: 100px;';
            imageDiv.innerHTML = `
                <img src="${e.target.result}" alt="Gallery image" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" onclick="window.removeEditGalleryImage(this, '${file.name}')" 
                        style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">×</button>
            `;
            container.insertBefore(imageDiv, plusBox);
        };
        reader.readAsDataURL(file);
    });
    
    const newImageCount = existingImages + filesToAdd.length;
    if (newImageCount >= 5) plusBox.style.display = 'none';
    
    event.target.value = '';
};

window.removeEditGalleryImage = function(btn, fileName) {
    btn.parentElement.remove();
    window.editGalleryFilesStore = window.editGalleryFilesStore.filter(f => f.name !== fileName);
    
    const container = document.getElementById('editGalleryImagesContainer');
    const plusBox = document.getElementById('editGalleryPlusBox');
    const imageCount = container.children.length - 1;
    if (imageCount < 5) plusBox.style.display = 'flex';
};

window.removeExistingGalleryImage = function(imageId) {
    window.pendingGalleryImageId = imageId;
    document.getElementById('removeExistingGalleryImageModal').classList.add('active');
};

window.closeRemoveGalleryImageModal = function() {
    document.getElementById('removeExistingGalleryImageModal').classList.remove('active');
    window.pendingGalleryImageId = null;
};

window.confirmRemoveGalleryImage = function() {
    const imageId = window.pendingGalleryImageId;
    window.closeRemoveGalleryImageModal();
    
    const catalogueId = document.getElementById('editGalleryCatalogueId').value;
    
    fetch(`${API_BASE}/catalogue.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...((typeof getUserHeaders === 'function') ? getUserHeaders() : {})
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
                if (typeof showNotification === 'function') {
                    showNotification('Image deleted successfully', 'success');
                }
                const container = document.getElementById('editGalleryImagesContainer');
                const imageDiv = Array.from(container.querySelectorAll('div')).find(div => 
                    div.innerHTML.includes(`onclick="window.removeExistingGalleryImage(${imageId})`)
                );
                if (imageDiv) imageDiv.remove();
                
                const plusBox = document.getElementById('editGalleryPlusBox');
                const imageCount = container.children.length - 1;
                if (imageCount < 5) plusBox.style.display = 'flex';
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('Error deleting image: ' + (data.message || data.error), 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error deleting image:', error);
            if (typeof showNotification === 'function') {
                showNotification('Error deleting image', 'error');
            }
        });
};

window.submitEditGalleryImages = function() {
    const catalogueId = document.getElementById('editGalleryCatalogueId').value;
    
    if (!catalogueId) {
        if (typeof showNotification === 'function') {
            showNotification('Missing event information', 'error');
        }
        return;
    }
    
    if (window.editGalleryFilesStore.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('No new images to upload', 'info');
        }
        window.closeEditGalleryModal();
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'add_gallery');
    formData.append('catalogue_id', catalogueId);
    
    window.editGalleryFilesStore.forEach((file, index) => {
        formData.append(`gallery_images[${index}]`, file);
    });
    
    const headers = (typeof getUserHeaders === 'function') ? getUserHeaders() : {};
    const fetchOptions = {
        method: 'POST',
        body: formData
    };
    
    const customHeaders = {};
    if (headers['X-User-Role']) customHeaders['X-User-Role'] = headers['X-User-Role'];
    if (headers['X-User-Id']) customHeaders['X-User-Id'] = headers['X-User-Id'];
    if (headers['X-Coordinator-Id']) customHeaders['X-Coordinator-Id'] = headers['X-Coordinator-Id'];
    if (Object.keys(customHeaders).length > 0) fetchOptions.headers = customHeaders;
    
    fetch(`${API_BASE}/catalogue.php`, fetchOptions)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (typeof showNotification === 'function') {
                    showNotification(window.editGalleryFilesStore.length + ' image(s) added to gallery!', 'success');
                }
                window.closeEditGalleryModal();
                if (typeof loadCatalogue === 'function') loadCatalogue();
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('Error: ' + (data.message || data.error || 'Failed to add images'), 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error uploading gallery images:', error);
            if (typeof showNotification === 'function') {
                showNotification('Error uploading gallery images: ' + error.message, 'error');
            }
        });
};

console.log('✅ edit-modal-v2.js loaded successfully');
