// Event Modals & Privacy Section Management
// Handles confirmation modals for removing coordinators and other information
// Also handles private/public event layout visibility

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
        if (typeof createEventModals === 'function') {
            createEventModals();
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

// Open delete other information confirmation modal
function openDeleteOtherInformationModal(metadataId, eventId) {
    let modal = document.getElementById('deleteOtherInformationModal');
    
    if (!modal) {
        console.log('🔍 Modal not found, creating modals...');
        if (typeof createEventModals === 'function') {
            createEventModals();
            modal = document.getElementById('deleteOtherInformationModal');
        }
    }
    
    if (!modal) {
        showNotification('Error: Confirmation modal not available', 'error');
        return;
    }
    
    window.pendingDeleteMetadataId = metadataId;
    window.pendingDeleteEventId = eventId || currentEventId;
    modal.classList.add('active');
}

// Confirm delete other information
function confirmDeleteOtherInformation() {
    const metadataId = window.pendingDeleteMetadataId;
    const eventId = window.pendingDeleteEventId;
    
    if (!metadataId) {
        showNotification('Missing metadata ID', 'error');
        document.getElementById('deleteOtherInformationModal').classList.remove('active');
        return;
    }
    
    fetch(`${API_BASE}/metadata.php`, {
        method: 'DELETE',
        headers: {
            ...getUserHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            metadata_id: metadataId,
            event_id: eventId
        })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('deleteOtherInformationModal').classList.remove('active');
            
            if (data.success) {
                showNotification('✓ Information deleted successfully!', 'success');
                if (typeof loadOtherInfo === 'function') {
                    loadOtherInfo(eventId);
                }
            } else {
                showNotification(data.message || 'Failed to delete information', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting information:', error);
            showNotification('Error: ' + error.message, 'error');
            document.getElementById('deleteOtherInformationModal').classList.remove('active');
        });
}

// Create modals HTML if they don't exist
function createEventModals() {
    console.log('🔍 createEventModals called');
    
    // Check if modals already exist (don't create duplicates)
    const deleteModal = document.getElementById('deleteOtherInformationModal');
    const removeModal = document.getElementById('removeCoordinatorModal');
    
    if (deleteModal && removeModal) {
        console.log('✅ Modals already exist, skipping creation');
        return;
    }
    
    console.log('🔍 Creating modals... deleteModal:', !!deleteModal, 'removeModal:', !!removeModal);
    
    const modalsHTML = `
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

// Handle Privacy Access section visibility based on event type
function handlePrivacyAccessSection(event) {
    console.log('🔍 handlePrivacyAccessSection called, is_private:', event.is_private);
    
    const privacyAccessSection = document.getElementById('privacyAccessSection');
    const detailsPrivateEvent = document.getElementById('detailsPrivateEvent');
    const detailsPrivateAccessCode = document.getElementById('detailsPrivateAccessCode');
    
    if (!privacyAccessSection) {
        console.log('⚠️  privacyAccessSection not found in DOM');
        return;
    }
    
    if (event.is_private == 1 || event.is_private === 1) {
        // Event is private - show the section
        privacyAccessSection.style.display = 'block';
        if (detailsPrivateEvent) {
            detailsPrivateEvent.checked = true;
        }
        if (detailsPrivateAccessCode && event.private_access_code) {
            detailsPrivateAccessCode.value = event.private_access_code;
        }
        console.log('✓ Privacy Access section shown - Event is PRIVATE');
    } else {
        // Event is public - hide the section
        privacyAccessSection.style.display = 'none';
        if (detailsPrivateEvent) {
            detailsPrivateEvent.checked = false;
        }
        console.log('✓ Privacy Access section hidden - Event is PUBLIC');
    }
}
