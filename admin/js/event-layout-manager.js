// ================================================================================
// EVENT LAYOUT MANAGER
// Handles different layouts for private vs public events
// Separate file to avoid modifying existing event-details.js or admin.js
// ================================================================================

console.log('📐 event-layout-manager.js loaded');

/**
 * Toggle event layout based on privacy status
 * Shows private event layout (Private Code + Event Image) for private events
 * Shows public event layout (Registration & Web Links + Event Image) for public events
 */
function toggleEventLayout(eventData) {
    console.log('🔄 Toggling event layout based on privacy status:', eventData?.is_private);
    
    try {
        const privateEventLayout = document.getElementById('privateEventLayout');
        const publicEventLayout = document.getElementById('publicEventLayout');
        const privateEventRegistrationSection = document.getElementById('privateEventRegistrationSection');
        
        if (!privateEventLayout || !publicEventLayout) {
            console.warn('⚠ Layout containers not found. Skipping layout toggle.');
            return;
        }
        
        if (eventData?.is_private == 1 || eventData?.is_private === '1') {
            // Show private event layout
            privateEventLayout.style.display = 'grid';
            publicEventLayout.style.display = 'none';
            if (privateEventRegistrationSection) {
                privateEventRegistrationSection.style.display = 'block';
            }
            console.log('✅ Private event layout displayed');
        } else {
            // Show public event layout
            privateEventLayout.style.display = 'none';
            publicEventLayout.style.display = 'grid';
            if (privateEventRegistrationSection) {
                privateEventRegistrationSection.style.display = 'none';
            }
            console.log('✅ Public event layout displayed');
        }
    } catch (error) {
        console.error('❌ Error toggling layout:', error);
    }
}

/**
 * Initialize private event code section
 * Populates the private access code in the layout
 */
function initializePrivateEventCode(eventData) {
    console.log('🔐 Initializing private event code section');
    
    try {
        const detailsPrivateAccessCode = document.getElementById('detailsPrivateAccessCode');
        const editDetailsPrivateCode = document.getElementById('editDetailsPrivateCode');
        
        if (eventData?.is_private == 1 || eventData?.is_private === '1') {
            // Display access code in details view
            if (detailsPrivateAccessCode && eventData.private_access_code) {
                detailsPrivateAccessCode.value = eventData.private_access_code;
                console.log('✅ Private access code populated in details view');
            }
            
            // Display access code in edit view
            if (editDetailsPrivateCode && eventData.private_access_code) {
                editDetailsPrivateCode.value = eventData.private_access_code;
                console.log('✅ Private access code populated in edit view');
            }
        }
    } catch (error) {
        console.error('❌ Error initializing private event code:', error);
    }
}

/**
 * Setup private event layout images
 * Handles image display for both private and public layouts
 */
function setupLayoutImages(eventData) {
    console.log('🖼️  Setting up layout images');
    
    try {
        const eventImageDisplay = document.getElementById('eventImageDisplay');
        const eventImagePlaceholder = document.getElementById('eventImagePlaceholder');
        const eventImageDisplayPrivate = document.getElementById('eventImageDisplayPrivate');
        const eventImagePlaceholderPrivate = document.getElementById('eventImagePlaceholderPrivate');
        
        let imageUrl = null;
        
        // Get image from event data (check multiple possible field names)
        if (eventData?.image_url) {
            imageUrl = eventData.image_url;
        } else if (eventData?.event_image) {
            imageUrl = eventData.event_image;
        }
        
        if (imageUrl && imageUrl.trim()) {
            if (!imageUrl.includes('/')) {
                imageUrl = `../uploads/events/${imageUrl}`;
            }
            
            // Set image for public layout
            if (eventImageDisplay) {
                eventImageDisplay.src = imageUrl;
                eventImageDisplay.style.display = 'block';
                eventImageDisplay.style.objectFit = 'cover';
                eventImageDisplay.onerror = function() {
                    console.warn('⚠ Failed to load event image');
                    this.style.display = 'none';
                    if (eventImagePlaceholder) eventImagePlaceholder.style.display = 'flex';
                };
            }
            if (eventImagePlaceholder) {
                eventImagePlaceholder.style.display = 'none';
            }
            
            // Set image for private layout
            if (eventImageDisplayPrivate) {
                eventImageDisplayPrivate.src = imageUrl;
                eventImageDisplayPrivate.style.display = 'block';
                eventImageDisplayPrivate.style.objectFit = 'cover';
                eventImageDisplayPrivate.onerror = function() {
                    console.warn('⚠ Failed to load event image (private)');
                    this.style.display = 'none';
                    if (eventImagePlaceholderPrivate) eventImagePlaceholderPrivate.style.display = 'flex';
                };
            }
            if (eventImagePlaceholderPrivate) {
                eventImagePlaceholderPrivate.style.display = 'none';
            }
            
            console.log('✅ Event image set for both layouts');
        } else {
            // No image - show placeholders
            if (eventImageDisplay) eventImageDisplay.style.display = 'none';
            if (eventImagePlaceholder) eventImagePlaceholder.style.display = 'flex';
            if (eventImageDisplayPrivate) eventImageDisplayPrivate.style.display = 'none';
            if (eventImagePlaceholderPrivate) eventImagePlaceholderPrivate.style.display = 'flex';
            console.log('✅ No image available - showing placeholders');
        }
    } catch (error) {
        console.error('❌ Error setting up layout images:', error);
    }
}

/**
 * Populate public event section (Registration & Web Links)
 */
function populatePublicEventSection(eventData) {
    console.log('🌐 Populating public event section (Registration & Web Links)');
    
    try {
        const registrationLink = document.getElementById('detailsRegistrationLink');
        const website = document.getElementById('detailsWebsite');
        
        if (registrationLink) {
            registrationLink.value = eventData?.registration_link || '';
        }
        
        if (website) {
            website.value = eventData?.website || '';
        }
        
        console.log('✅ Public event section populated');
    } catch (error) {
        console.error('❌ Error populating public event section:', error);
    }
}

/**
 * Populate private event section (Registration & Web Links)
 */
function populatePrivateEventSection(eventData) {
    console.log('🔐 Populating private event section (Registration & Web Links)');
    
    try {
        const registrationLink = document.getElementById('detailsRegistrationLinkPrivate');
        const website = document.getElementById('detailsWebsitePrivate');
        
        if (registrationLink) {
            registrationLink.value = eventData?.registration_link || '';
        }
        
        if (website) {
            website.value = eventData?.website || '';
        }
        
        console.log('✅ Private event section populated');
    } catch (error) {
        console.error('❌ Error populating private event section:', error);
    }
}

/**
 * Master function to apply layout based on event data
 * Call this after loading event details
 */
function applyEventLayout(eventData) {
    console.log('⚙️  Applying complete event layout');
    
    if (!eventData) {
        console.warn('⚠ No event data provided for layout');
        return;
    }
    
    // Execute all layout operations
    toggleEventLayout(eventData);
    initializePrivateEventCode(eventData);
    setupLayoutImages(eventData);
    populatePublicEventSection(eventData);
    populatePrivateEventSection(eventData);
    
    console.log('✅ Event layout applied successfully');
}

/**
 * Hook into existing event loading to apply layouts
 * This patches the existing displayEventDetailsData function if it exists
 */
function initializeLayoutManager() {
    console.log('📌 Initializing layout manager hooks');
    
    // Try to patch displayEventDetailsData first (admin.js)
    if (window.displayEventDetailsData && !window.displayEventDetailsData.__layoutPatched) {
        const originalDisplayEventDetailsData = window.displayEventDetailsData;
        
        window.displayEventDetailsData = function(eventData) {
            console.log('🔗 displayEventDetailsData called - applying layout');
            
            // Call original function
            originalDisplayEventDetailsData.call(this, eventData);
            
            // Then apply layout
            setTimeout(() => {
                applyEventLayout(eventData);
            }, 100);
        };
        
        window.displayEventDetailsData.__layoutPatched = true;
        console.log('✅ Layout manager hooked into displayEventDetailsData');
    }
    
    // Fallback: Also try to patch displayEventDetails (event-details.js)
    if (window.displayEventDetails && !window.displayEventDetails.__layoutPatched && (!window.displayEventDetailsData || !window.displayEventDetailsData.__layoutPatched)) {
        const originalDisplayEventDetails = window.displayEventDetails;
        
        window.displayEventDetails = function(eventData) {
            console.log('🔗 displayEventDetails called - applying layout');
            
            // Call original function
            originalDisplayEventDetails.call(this, eventData);
            
            // Then apply layout
            setTimeout(() => {
                applyEventLayout(eventData);
            }, 100);
        };
        
        window.displayEventDetails.__layoutPatched = true;
        console.log('✅ Layout manager hooked into displayEventDetails (fallback)');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLayoutManager);
} else {
    initializeLayoutManager();
}

console.log('✅ event-layout-manager.js ready');
