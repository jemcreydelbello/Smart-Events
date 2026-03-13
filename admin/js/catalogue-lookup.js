// Catalogue Lookup Module
// Handles pending catalogue events and publication workflow

const CatalogueLookup = {
    pendingEvents: [],
    currentEvent: null,
    selectedImage: null,

    // Initialize catalogue lookup
    init: function() {
        console.log('🎯 Initializing Catalogue Lookup module');
        
        // Auto-sync completed events to catalogue on page load
        this.syncCompletedEvents();
        
        // Load pending events periodically
        setInterval(() => this.loadPendingEvents(), 30000); // Every 30 seconds
    },

    // Auto-sync completed events to catalogue (unpublished)
    syncCompletedEvents: function() {
        console.log('📅 Syncing completed events to catalogue...');
        
        fetch('../api/catalogue.php?action=sync_completed', {
            method: 'GET',
            headers: this.getHeaders()
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✓ Sync complete:', data.synced_count, 'events synced');
                if (data.synced_count > 0) {
                    showNotification(data.synced_count + ' completed event(s) ready for catalogue!', 'info');
                    // Refresh pending events list
                    this.loadPendingEvents();
                }
            } else {
                console.error('✗ Sync failed:', data.message);
            }
        })
        .catch(error => console.error('Error syncing:', error));
    },

    // Load all pending catalogue events
    loadPendingEvents: function() {
        console.log('📋 Loading pending catalogue events...');
        
        fetch('../api/catalogue.php?action=lookup', {
            method: 'GET',
            headers: this.getHeaders()
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.pendingEvents = data.data || [];
                console.log('✓ Loaded', this.pendingEvents.length, 'pending events');
                this.updateBadge();
            } else {
                console.error('✗ Failed to load pending events:', data.message);
                this.pendingEvents = [];
            }
        })
        .catch(error => {
            console.error('Error loading pending events:', error);
            this.pendingEvents = [];
        });
    },

    // Update lookup button badge with count
    updateBadge: function() {
        const badge = document.getElementById('catalogueLookupBadge');
        if (badge && this.pendingEvents.length > 0) {
            badge.textContent = this.pendingEvents.length;
            badge.style.display = 'inline-flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    },

    // Open catalogue lookup modal
    openLookupModal: function() {
        console.log('📂 Opening Catalogue Lookup modal');
        
        const modal = document.getElementById('catalogueLookupModal');
        if (!modal) {
            console.error('Catalogue Lookup modal not found');
            return;
        }
        
        modal.style.display = 'flex';
        
        // Load pending events
        this.loadPendingEvents();
        
        // Display pending events list
        setTimeout(() => this.displayPendingList(), 100);
    },

    // Close catalogue lookup modal
    closeLookupModal: function() {
        console.log('❌ Closing Catalogue Lookup modal');
        const modal = document.getElementById('catalogueLookupModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentEvent = null;
        this.selectedImage = null;
    },

    // Display list of pending events
    displayPendingList: function() {
        const container = document.getElementById('pendingEventsList');
        if (!container) return;

        if (this.pendingEvents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-500 text-lg">No events pending publication</p>
                    <p class="text-gray-400 text-sm mt-2">All finished events will appear here and need image upload before publishing to catalogue.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.pendingEvents.map((event, idx) => `
            <div class="catalogue-event-card bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col" 
                 onclick="CatalogueLookup.selectEvent(${idx})" style="min-height: 180px;">
                <div class="h-16 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span class="text-2xl">📅</span>
                </div>
                <div class="p-2 flex flex-col flex-1">
                    <h3 class="font-semibold text-gray-900 text-xs line-clamp-2" title="${escapeHtml(event.event_name)}">${escapeHtml(event.event_name)}</h3>
                    <p class="text-xs text-gray-500 mt-0.5">📅 ${event.event_date || 'N/A'}</p>
                    <p class="text-xs text-gray-500 line-clamp-1" title="${escapeHtml(event.location || 'No location')}" style="display: flex; align-items: center; gap: 4px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="#6b7280" d="M16 10c0-2.21-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4m-6 0c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2"/><path fill="#6b7280" d="M11.42 21.81c.17.12.38.19.58.19s.41-.06.58-.19c.3-.22 7.45-5.37 7.42-11.82c0-4.41-3.59-8-8-8s-8 3.59-8 8c-.03 6.44 7.12 11.6 7.42 11.82M12 4c3.31 0 6 2.69 6 6c.02 4.44-4.39 8.43-6 9.74c-1.61-1.31-6.02-5.29-6-9.74c0-3.31 2.69-6 6-6"/></svg> ${escapeHtml(event.location || 'N/A')}</p>
                    <button onclick="event.stopPropagation(); CatalogueLookup.selectEvent(${idx})" 
                            class="mt-auto px-1.5 py-0.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition w-full\"
                            style="font-size: 11px;">
                        Review
                    </button>
                </div>
                <span class="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold absolute top-1 right-1" style="font-size: 10px;">✓ PENDING</span>
            </div>
        `).join('');
    },

    // Select an event to review and publish
    selectEvent: function(index) {
        console.log('🔍 Selecting event at index:', index);
        
        if (index < 0 || index >= this.pendingEvents.length) {
            console.error('Invalid event index');
            return;
        }

        this.currentEvent = this.pendingEvents[index];
        this.selectedImage = null;
        
        // Show event details and image upload form
        this.displayEventDetails();
        
        // Scroll to details
        const detailsSection = document.getElementById('eventDetailsSection');
        if (detailsSection) {
            detailsSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Display event details for review and publishing
    displayEventDetails: function() {
        if (!this.currentEvent) return;

        const event = this.currentEvent;
        const detailsSection = document.getElementById('eventDetailsSection');
        
        if (!detailsSection) return;

        detailsSection.innerHTML = `
            <div class="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${escapeHtml(event.event_name)}</h3>
                    <div class="flex items-center gap-4 text-sm text-gray-600">
                        <span>📅 ${event.event_date}</span>
                        <span style="display: flex; align-items: center; gap: 4px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="#4b5563" d="M16 10c0-2.21-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4m-6 0c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2"/><path fill="#4b5563" d="M11.42 21.81c.17.12.38.19.58.19s.41-.06.58-.19c.3-.22 7.45-5.37 7.42-11.82c0-4.41-3.59-8-8-8s-8 3.59-8 8c-.03 6.44 7.12 11.6 7.42 11.82M12 4c3.31 0 6 2.69 6 6c.02 4.44-4.39 8.43-6 9.74c-1.61-1.31-6.02-5.29-6-9.74c0-3.31 2.69-6 6-6"/></svg>${escapeHtml(event.location || 'No location')}</span>
                    </div>
                </div>

                <!-- Event Description -->
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Description</h4>
                    <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(event.description || 'No description provided')}</p>
                </div>

                <!-- Image Upload Section -->
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <h4 class="font-semibold text-gray-900 mb-4">Catalogue Event Image</h4>
                    <p class="text-sm text-gray-600 mb-4">Upload an image for this event to display in the catalogue. This image will be shown publicly when the event is published.</p>

                    <div id="imagePreviewArea" class="mb-4">
                        ${event.image_url ? `
                            <div class="bg-gray-100 rounded-lg p-4 text-center">
                                <img src="${this.getImageUrl(event.image_url)}" alt="Event image" class="max-h-64 mx-auto rounded" onerror="this.style.display='none'">
                                <p class="text-sm text-gray-600 mt-2">Current event image</p>
                            </div>
                        ` : `
                            <div class="bg-gray-100 rounded-lg p-8 text-center">
                                <p class="text-gray-500 text-lg">📷 No image available</p>
                                <p class="text-gray-400 text-sm mt-2">Upload an image to use as the catalogue thumbnail</p>
                            </div>
                        `}
                    </div>

                    <!-- Image Upload Input -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Choose New Image</label>
                        <input type="file" id="catalogueImageInput" accept="image/*" 
                               onchange="CatalogueLookup.handleImageSelect(event)"
                               class="block w-full text-sm text-gray-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-lg file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-blue-50 file:text-blue-700
                                      hover:file:bg-blue-100">
                    </div>

                    <!-- Privacy Setting -->
                    <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="isPrivateToggle" ${event.is_private ? 'checked' : ''}
                                   onchange="CatalogueLookup.currentEvent.is_private = this.checked">
                            <span class="text-sm font-medium text-gray-900">Keep event private</span>
                        </label>
                        <p class="text-xs text-gray-600 mt-1">If checked, this event will only be visible to logged-in users</p>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-3">
                        <button onclick="CatalogueLookup.publishEvent()" 
                                class="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                            ✓ Publish to Catalogue
                        </button>
                        <button onclick="CatalogueLookup.selectEvent(-1)" 
                                class="px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition">
                            Back to List
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Handle image file selection
    handleImageSelect: function(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log('📸 Image selected:', file.name);

        // Preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewArea = document.getElementById('imagePreviewArea');
            if (previewArea) {
                previewArea.innerHTML = `
                    <div class="bg-gray-100 rounded-lg p-4 text-center">
                        <img src="${e.target.result}" alt="Preview" class="max-h-64 mx-auto rounded" onerror="this.style.display='none'">
                        <p class="text-sm text-gray-600 mt-2">New image selected: ${file.name}</p>
                    </div>
                `;
            }
        };
        reader.readAsDataURL(file);

        this.selectedImage = file;
    },

    // Publish event to catalogue
    publishEvent: function() {
        if (!this.currentEvent) {
            console.error('No event selected');
            return;
        }

        console.log('📤 Publishing event to catalogue:', this.currentEvent.event_name);

        // Check if image is required
        if (!this.currentEvent.image_url && !this.selectedImage) {
            showNotification('Please upload an image before publishing', 'error');
            return;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('action', 'add_with_image');
        formData.append('event_id', this.currentEvent.event_id);
        
        if (this.selectedImage) {
            formData.append('image', this.selectedImage);
        }

        // Show loading state
        const modal = document.getElementById('catalogueLookupModal');
        const originalContent = modal.querySelector('.modal-content').innerHTML;
        const publishBtn = document.querySelector('button[onclick="CatalogueLookup.publishEvent()"]');
        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.textContent = '⏳ Publishing...';
        }

        // Send to API
        fetch('../api/catalogue.php', {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': undefined // Let fetch set it for FormData
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✓ Event published successfully');
                showNotification('Event published to catalogue! 🎉', 'success');
                
                // Remove from pending list
                this.pendingEvents = this.pendingEvents.filter(e => e.catalogue_id !== this.currentEvent.catalogue_id);
                this.currentEvent = null;
                this.selectedImage = null;
                
                // Update display
                this.displayPendingList();
                this.updateBadge();
                
                // Reset details section
                const detailsSection = document.getElementById('eventDetailsSection');
                if (detailsSection) {
                    detailsSection.innerHTML = '';
                }
            } else {
                console.error('✗ Publish failed:', data.message);
                showNotification('Failed to publish: ' + data.message, 'error');
                if (publishBtn) {
                    publishBtn.disabled = false;
                    publishBtn.textContent = '✓ Publish to Catalogue';
                }
            }
        })
        .catch(error => {
            console.error('Error publishing:', error);
            showNotification('Error publishing event', 'error');
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = '✓ Publish to Catalogue';
            }
        });
    },

    // Helper: Get proper image URL
    getImageUrl: function(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        // If path is just a filename (no slashes), it's in /uploads/events/
        if (!path.includes('/')) {
            return '../uploads/events/' + path;
        }
        return '../' + path;
    },

    // Helper: Get headers for API requests
    getHeaders: function() {
        try {
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
            
            return headers;
        } catch (error) {
            return { 'Content-Type': 'application/json' };
        }
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CatalogueLookup.init());
} else {
    CatalogueLookup.init();
}
