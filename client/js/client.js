// ============ CLIENT-SIDE JAVASCRIPT ============

const API_BASE = '../api';
let allEvents = [];
let currentEventDetail = null;

// Carousel state
let pastCarouselPosition = 0;
let pastEventsData = [];
let carouselAutoPlayInterval = null;
let carouselScrollOffset = 0;

// Helper function to fix image URLs for nested folder structure
function getImageUrl(imagePath) {
    if (!imagePath) return null;
    // If path is relative to webroot (uploads/...), prepend ../ for client nested folder
    if (imagePath.startsWith('uploads/')) {
        return '../' + imagePath;
    }
    // If it's already a full URL or correct path, return as-is
    return imagePath;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Client page loaded');
    loadEvents();
    loadOngoingEvents();
    loadPastEvents();
    setupEventCountdown();
    setupEventListeners();
});

function setupEventListeners() {
    // Search on Enter key
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchEvents();
            closeSuggestions();
        }
    });

    // Show suggestions on input
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();
        if (query.length > 0) {
            showSearchSuggestions(query);
        } else {
            closeSuggestions();
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-wrapper') && !e.target.closest('.search-btn')) {
            closeSuggestions();
        }
    });

    // Close modal when clicking outside
    window.onclick = function(event) {
        const eventModal = document.getElementById('eventModal');
        const regModal = document.getElementById('registrationModal');
        const confirmModal = document.getElementById('confirmationModal');
        const privateCodeModal = document.getElementById('privateCodeModal');
        
        if (event.target === eventModal) {
            closeEventModal();
        }
        if (event.target === regModal) {
            closeRegistrationModal();
        }
        if (event.target === confirmModal) {
            closeConfirmationModal();
        }
        if (event.target === privateCodeModal) {
            cancelPrivateCodeModal();
        }
    }
}

// ============ TOGGLE PRIVATE CODE INPUT ============
function togglePrivateCodeInput(event) {
    event.preventDefault();
    const container = document.getElementById('privateCodeContainer');
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    
    // Focus on input when shown
    if (isHidden) {
        document.getElementById('privateCode').focus();
    }
}

// ============ SETUP EVENT COUNTDOWN ============
function setupEventCountdown() {
    // Wait a moment for events to load
    if (allEvents.length === 0) {
        setTimeout(setupEventCountdown, 200);
        return;
    }
    
    // Update countdown every second to check for next event
    setInterval(() => updateCountdownDisplay(), 1000);
    
    // Initial update
    updateCountdownDisplay();
}

// ============ GET NEXT UPCOMING PUBLIC EVENT ============
function getNextUpcomingPublicEvent() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get all upcoming public events (from today onwards)
    const upcomingPublicEvents = allEvents.filter(event => {
        const eventDate = event.event_date.split(' ')[0];
        return eventDate >= today && event.is_private != 1;
    }).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    
    // Find the first event that is in the future (hasn't passed yet)
    for (let event of upcomingPublicEvents) {
        const eventDate = new Date(event.event_date);
        if (eventDate > now) {
            return event;
        }
    }
    
    return null; // No upcoming events
}

// ============ UPDATE COUNTDOWN DISPLAY ============
function updateCountdownDisplay() {
    const nextEvent = getNextUpcomingPublicEvent();
    
    if (!nextEvent) {
        // No upcoming events
        document.getElementById('countdownEventName').textContent = 'No upcoming events';
        document.getElementById('countdownDays').textContent = '00';
        document.getElementById('countdownHours').textContent = '00';
        document.getElementById('countdownMinutes').textContent = '00';
        document.getElementById('countdownSeconds').textContent = '00';
        return;
    }
    
    // Calculate time remaining
    const eventDate = new Date(nextEvent.event_date);
    const now = new Date();
    const difference = eventDate - now;
    
    if (difference <= 0) {
        // This shouldn't happen since getNextUpcomingPublicEvent filters for future events
        // But just in case, reset and get next event
        updateCountdownDisplay();
        return;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    document.getElementById('countdownEventName').textContent = nextEvent.event_name;
    document.getElementById('countdownDays').textContent = String(days).padStart(2, '0');
    document.getElementById('countdownHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('countdownMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('countdownSeconds').textContent = String(seconds).padStart(2, '0');
}

// ============ UPDATE COUNTDOWN (Legacy - kept for compatibility) ============
function updateCountdown(event) {
    updateCountdownDisplay();
}

// ============ LOAD EVENTS ============
function loadEvents() {
    console.log('Loading ALL events from API (including past events)...');
    
    fetch(`${API_BASE}/events.php?action=list_all`)
        .then(response => {
            console.log('Events API response:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Events data received:', data.data?.length, 'events');
            console.log('Full events data:', data.data);
            
            if (data.success && data.data) {
                // Store all events (including private)
                allEvents = data.data.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
                console.log('Total events loaded:', allEvents.length);
                
                // Display only PUBLIC UPCOMING events in main Upcoming Events section
                const today = new Date().toISOString().split('T')[0];
                const publicUpcomingEvents = allEvents.filter(e => {
                    const eventDate = e.event_date.split(' ')[0];
                    const isPublic = e.is_private != 1;
                    const isUpcoming = eventDate >= today;
                    console.log(`Upcoming filter: ${e.event_name}, date: ${eventDate}, is_private: ${e.is_private}, type: ${typeof e.is_private}, public: ${isPublic}, upcoming: ${isUpcoming}`);
                    return isPublic && isUpcoming;
                });
                console.log('Public upcoming events to display:', publicUpcomingEvents.length, 'out of', allEvents.length, 'total');
                displayEvents(publicUpcomingEvents);
                
                // Also trigger loading of Ongoing and Past events
                loadOngoingEvents();
                loadPastEvents();
            } else {
                showNotification('Error loading events', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading events:', error);
            showNotification('Failed to load events', 'error');
            document.getElementById('eventsGrid').innerHTML = '<div class="loading">Error loading events</div>';
        });
}

// ============ DISPLAY EVENTS ============
function displayEvents(events) {
    console.log('Displaying', events.length, 'events');
    
    const grid = document.getElementById('eventsGrid');
    const noEventsMsg = document.getElementById('noEvents');
    const countEl = document.getElementById('eventsCount');
    
    if (!events || events.length === 0) {
        grid.innerHTML = '';
        noEventsMsg.style.display = 'block';
        countEl.textContent = 'No events found';
        return;
    }
    
    noEventsMsg.style.display = 'none';
    countEl.textContent = `Showing ${events.length} upcoming event${events.length !== 1 ? 's' : ''}`;
    
    grid.innerHTML = events.map(event => {
        const imageUrl = getImageUrl(event.image_url);
        return `
        <div class="event-card" onclick="openEventModal(${event.event_id})">
            <div class="event-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${event.event_name}">` : '📅'}
                ${event.is_private == 1 ? '<span class="event-badge" style="position: absolute; top: 10px; right: 10px; background: #C41E3A; color: white; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">Private</span>' : '<span class="event-badge" style="position: absolute; top: 10px; right: 10px; background: white; color: #333; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">Public</span>'}
            </div>
            
            <div class="event-info">
                <div class="event-title">${event.event_name}</div>
                <div class="event-meta">
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align: middle; display: inline; margin-right: 5px;"><path fill="currentColor" d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"/><path fill="currentColor" d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2M19 8l.001 12H5V8z"/></svg>${formatDate(event.event_date)}</span>
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align: middle; display: inline; margin-right: 5px;"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0"/><path d="M12 7v5l3 3"/></g></svg>${event.start_time ? event.start_time.substring(0, 5) : 'TBD'}</span>
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" style="vertical-align: middle; display: inline; margin-right: 5px;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 48c-79.5 0-144 61.39-144 137c0 87 96 224.87 131.25 272.49a15.77 15.77 0 0 0 25.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137"/><circle cx="256" cy="192" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>${event.location || 'TBD'}</span>
                </div>
            </div>
            
            <div class="event-footer">
                <div class="capacity-info">
                    Capacity: <strong>${event.capacity}</strong> | 
                    Available: <strong>${event.available_spots >= 0 ? event.available_spots : 'Full'}</strong>
                </div>
                <button class="register-btn" onclick="event.stopPropagation(); openEventModal(${event.event_id})">
                    Register
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-left: 4px;"><path fill-rule="evenodd" d="M18.5 12.214a1 1 0 0 0-1-1H5a1 1 0 1 0 0 2h12.5a1 1 0 0 0 1-1" clip-rule="evenodd"/><path fill-rule="evenodd" d="M20 12.214a1 1 0 0 0-.293-.707l-4.5-4.5a1 1 0 1 0-1.414 1.414l3.793 3.793l-3.793 3.793a1 1 0 0 0 1.414 1.415l4.5-4.5a1 1 0 0 0 .293-.708" clip-rule="evenodd"/></svg>
                </button>
            </div>
        </div>
    `;
    }).join('');
}

// ============ LOAD ONGOING EVENTS (Today) ============
function loadOngoingEvents() {
    console.log('Loading ongoing events (today)...');
    
    // We'll use the allEvents array that's already loaded
    // But first, wait a moment for loadEvents to populate allEvents
    if (allEvents.length === 0) {
        // Wait for events to load
        setTimeout(loadOngoingEvents, 100);
        return;
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Filter events for today that are public
    const ongoingEvents = allEvents.filter(event => {
        const eventDate = event.event_date.split(' ')[0]; // Get date part
        const isPublic = event.is_private != 1;
        const isToday = eventDate === today;
        console.log(`Checking: ${event.event_name}, date: ${eventDate}, today: ${today}, match: ${isToday}, public: ${isPublic}`);
        return isToday && isPublic;
    });
    
    console.log('Found', ongoingEvents.length, 'ongoing events today');
    displayOngoingEvents(ongoingEvents);
}

// ============ DISPLAY ONGOING EVENTS ============
function displayOngoingEvents(events) {
    console.log('Displaying', events.length, 'ongoing events');
    
    const grid = document.getElementById('ongoingEventsGrid');
    const noOngoingMsg = document.getElementById('noOngoingEvents');
    const countEl = document.getElementById('ongoingCount');
    
    if (!grid) {
        console.warn('ongoingEventsGrid element not found');
        return;
    }
    
    if (!events || events.length === 0) {
        grid.innerHTML = '';
        if (noOngoingMsg) {
            noOngoingMsg.style.display = 'block';
        }
        if (countEl) {
            countEl.textContent = 'No events happening today';
        }
        return;
    }
    
    if (noOngoingMsg) {
        noOngoingMsg.style.display = 'none';
    }
    if (countEl) {
        countEl.textContent = `${events.length} event${events.length !== 1 ? 's' : ''} happening today`;
    }
    
    grid.innerHTML = events.map(event => {
        const imageUrl = getImageUrl(event.image_url);
        return `
        <div class="event-card" onclick="openEventModal(${event.event_id})">
            <div class="event-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${event.event_name}">` : '📅'}
                <span class="event-badge" style="position: absolute; top: 10px; right: 10px; background: white; color: #333; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">Public</span>
            </div>
            
            <div class="event-info">
                <div class="event-title">${event.event_name}</div>
                <div class="event-meta">
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align: middle; display: inline; margin-right: 5px;"><path fill="currentColor" d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"/><path fill="currentColor" d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2M19 8l.001 12H5V8z"/></svg>Today</span>
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align: middle; display: inline; margin-right: 5px;"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0"/><path d="M12 7v5l3 3"/></g></svg>${event.start_time ? event.start_time.substring(0, 5) : 'TBD'}</span>
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" style="vertical-align: middle; display: inline; margin-right: 5px;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 48c-79.5 0-144 61.39-144 137c0 87 96 224.87 131.25 272.49a15.77 15.77 0 0 0 25.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137"/><circle cx="256" cy="192" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>${event.location || 'TBD'}</span>
                </div>
            </div>
            
            <div class="event-footer">
                <div class="capacity-info">
                    Capacity: <strong>${event.capacity}</strong> | 
                    Available: <strong>${event.available_spots >= 0 ? event.available_spots : 'Full'}</strong>
                </div>
            </div>
            
            <div class="event-footer">
                <div class="capacity-info">
                    Capacity: <strong>${event.capacity}</strong> | 
                    Available: <strong>${event.available_spots >= 0 ? event.available_spots : 'Full'}</strong>
                </div>
                <button class="register-btn" onclick="event.stopPropagation(); openEventModal(${event.event_id})">
                    Register
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display: inline; margin-left: 4px;"><path fill-rule="evenodd" d="M18.5 12.214a1 1 0 0 0-1-1H5a1 1 0 1 0 0 2h12.5a1 1 0 0 0 1-1" clip-rule="evenodd"/><path fill-rule="evenodd" d="M20 12.214a1 1 0 0 0-.293-.707l-4.5-4.5a1 1 0 1 0-1.414 1.414l3.793 3.793l-3.793 3.793a1 1 0 0 0 1.414 1.415l4.5-4.5a1 1 0 0 0 .293-.708" clip-rule="evenodd"/></svg>
                </button>
            </div>
        </div>
    `;
    }).join('');
}

// ============ LOAD PAST EVENTS (Completed) ============
function loadPastEvents() {
    console.log('Loading past events from Catalogue...');
    
    // Load from CATALOGUE API (only events added by admin)
    fetch(`${API_BASE}/catalogue.php?action=list`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                // Filter for past events that are PUBLIC (is_private = 0) AND PUBLISHED (is_published = 1)
                const today = new Date().toISOString().split('T')[0];
                const pastEvents = data.data
                    .filter(event => {
                        const eventDate = event.event_date.split(' ')[0];
                        const isPublic = event.is_private == 0 || event.is_private === "0";
                        const isPublished = event.is_published == 1 || event.is_published === "1" || event.is_published === true;
                        const isPast = eventDate < today;
                        console.log(`Catalogue past event: ${event.event_name}, date: ${eventDate}, isPast: ${isPast}, isPublic: ${isPublic}, isPublished: ${isPublished}`);
                        return isPast && isPublic && isPublished;
                    })
                    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date)); // Most recent first
                
                console.log('Found', pastEvents.length, 'past public events from catalogue');
                displayPastEvents(pastEvents);
            } else {
                console.error('Failed to load catalogue:', data.message);
                displayPastEvents([]);
            }
        })
        .catch(error => {
            console.error('Error loading past events from catalogue:', error);
            displayPastEvents([]);
        });
}

// ============ DISPLAY PAST EVENTS ============
function displayPastEvents(events) {
    console.log('Displaying', events.length, 'past events');
    
    const carousel = document.getElementById('pastEventsCarousel');
    const noPastMsg = document.getElementById('noPastEvents');
    const countEl = document.getElementById('pastCount');
    
    if (!carousel) {
        console.warn('pastEventsCarousel element not found');
        return;
    }
    
    // Store events for carousel navigation
    pastEventsData = events;
    carouselScrollOffset = 0;
    
    if (!events || events.length === 0) {
        carousel.innerHTML = '';
        if (noPastMsg) {
            noPastMsg.style.display = 'block';
        }
        if (countEl) {
            countEl.textContent = 'No past events';
        }
        return;
    }
    
    if (noPastMsg) {
        noPastMsg.style.display = 'none';
    }
    if (countEl) {
        countEl.textContent = `${events.length} past event${events.length !== 1 ? 's' : ''}`;
    }
    
    carousel.innerHTML = events.map(event => {
        const imageUrl = getImageUrl(event.image_url);
        return `
        <div class="event-card" onclick="openEventModal(${event.event_id})">
            <div class="event-image">
                ${imageUrl ? `<img src="${imageUrl}" alt="${event.event_name}">` : '📅'}
                <span class="event-badge" style="position: absolute; top: 10px; right: 10px; background: white; color: #333; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">Public</span>
            </div>
            
            <div class="event-info">
                <div class="event-title">${event.event_name}</div>
                <div class="event-meta">
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align: middle; display: inline; margin-right: 5px;"><path fill="currentColor" d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"/><path fill="currentColor" d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2M19 8l.001 12H5V8z"/></svg>${formatDate(event.event_date)}</span>
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="vertical-align: middle; display: inline; margin-right: 5px;"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0-18 0"/><path d="M12 7v5l3 3"/></g></svg>${event.start_time ? event.start_time.substring(0, 5) : 'TBD'}</span>
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" style="vertical-align: middle; display: inline; margin-right: 5px;"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 48c-79.5 0-144 61.39-144 137c0 87 96 224.87 131.25 272.49a15.77 15.77 0 0 0 25.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137"/><circle cx="256" cy="192" r="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>${event.location || 'TBD'}</span>
                </div>
            </div>
            
            <div class="event-footer">
                <div class="capacity-info">
                    Capacity: <strong>${event.capacity}</strong> | 
                    Available: <strong>${event.available_spots >= 0 ? event.available_spots : 'Full'}</strong>
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    updateCarouselPosition();
    startCarouselAutoPlay();
}

// ============ CAROUSEL NAVIGATION ============
function pastCarouselPrev() {
    if (pastEventsData.length === 0) return;
    
    const carousel = document.getElementById('pastEventsCarousel');
    if (!carousel) return;
    
    const firstCard = carousel.querySelector('.event-card');
    if (!firstCard) return;
    
    const cardWidth = firstCard.offsetWidth + 30;
    carouselScrollOffset = Math.max(0, carouselScrollOffset - cardWidth);
    updateCarouselPosition();
    
    // Restart auto-play on user interaction
    startCarouselAutoPlay();
}

function pastCarouselNext() {
    if (pastEventsData.length === 0) return;
    
    const carousel = document.getElementById('pastEventsCarousel');
    if (!carousel) return;
    
    const firstCard = carousel.querySelector('.event-card');
    if (!firstCard) return;
    
    const cardWidth = firstCard.offsetWidth + 30;
    const totalScrollWidth = pastEventsData.length * cardWidth;
    
    carouselScrollOffset += cardWidth;
    
    // Cycle back to start when reaching the end
    if (carouselScrollOffset >= totalScrollWidth) {
        carouselScrollOffset = 0;
    }
    
    updateCarouselPosition();
    
    // Restart auto-play on user interaction
    startCarouselAutoPlay();
}

function updateCarouselPosition() {
    const carousel = document.getElementById('pastEventsCarousel');
    if (!carousel) return;
    
    const firstCard = carousel.querySelector('.event-card');
    if (!firstCard) return;
    
    // Calculate actual card width including gap
    const cardWidth = firstCard.offsetWidth + 30; // card width + gap
    const totalScrollWidth = pastEventsData.length * cardWidth;
    
    // Apply smooth continuous scrolling
    carousel.style.transform = `translateX(-${carouselScrollOffset}px)`;
}

function startCarouselAutoPlay() {
    // Clear existing interval
    if (carouselAutoPlayInterval) {
        clearInterval(carouselAutoPlayInterval);
    }
    
    // Start auto-play with smooth continuous scrolling (slow speed)
    carouselAutoPlayInterval = setInterval(() => {
        if (pastEventsData.length === 0) return;
        
        const carousel = document.getElementById('pastEventsCarousel');
        if (!carousel) return;
        
        const firstCard = carousel.querySelector('.event-card');
        if (!firstCard) return;
        
        // Calculate card width including gap
        const cardWidth = firstCard.offsetWidth + 30;
        const totalScrollWidth = pastEventsData.length * cardWidth;
        
        // Move slowly - increment by 1 pixel every 30ms
        carouselScrollOffset += 1;
        
        // Reset to beginning when reaching the end
        if (carouselScrollOffset >= totalScrollWidth) {
            carouselScrollOffset = 0;
        }
        
        updateCarouselPosition();
    }, 30);
}

// ============ SEARCH EVENTS ============
function searchEvents() {
    try {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            console.error('Search input element not found');
            return;
        }
        
        // If events not loaded yet, wait a moment
        if (allEvents.length === 0) {
            console.log('Events not yet loaded, waiting...');
            showNotification('Loading events, please try again...', 'warning');
            setTimeout(searchEvents, 500);
            return;
        }
        
        const query = searchInput.value.toLowerCase().trim();
        console.log('Searching for:', query);
        console.log('Total events in allEvents:', allEvents.length);
        
        let filtered = [];
        
        if (!query) {
            // Display only public events when clearing search
            filtered = allEvents.filter(e => e.is_private != 1);
            console.log('Cleared search, showing public events:', filtered.length);
        } else {
            // Search in public events only - search by event name ONLY (matching suggestions)
            filtered = allEvents.filter(event => {
                // Only show public events in search results
                if (event.is_private == 1) return false;
                
                const eventName = (event.event_name || '').toLowerCase();
                
                const matchesSearch = eventName.includes(query);
                
                return matchesSearch;
            });
            console.log('Search results:', filtered.length, 'public events matching query');
        }
        
        // Display results
        displayEvents(filtered);
        
        // Scroll to events section
        const eventSection = document.getElementById('upcoming');
        if (eventSection) {
            setTimeout(() => {
                eventSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    } catch (error) {
        console.error('Error in searchEvents:', error);
        showNotification('Error searching events', 'error');
    }
}

// ============ SEARCH SUGGESTIONS ============
function showSearchSuggestions(query) {
    try {
        if (allEvents.length === 0) return;
        
        // Filter public events from all categories (Upcoming, Ongoing, Past) that match the query
        const publicEvents = allEvents.filter(event => event.is_private != 1);
        console.log('Total public events:', publicEvents.length);
        
        const suggestions = publicEvents
            .filter(event => {
                const eventName = (event.event_name || '').toLowerCase();
                const query_lower = query.toLowerCase();
                return eventName.includes(query_lower);
            });
        
        console.log('Search query:', query);
        console.log('Matching events:', suggestions.length);
        suggestions.forEach(e => console.log('- ' + e.event_name + ' (' + e.location + ')'));
        
        const displayLimit = 3;
        const slicedSuggestions = suggestions.slice(0, displayLimit);
        const hasMore = suggestions.length > displayLimit;
        
        const suggestionsDiv = document.getElementById('searchSuggestions');
        
        // Generate suggestion items with icons and better formatting
        let html = '';
        
        if (slicedSuggestions.length === 0) {
            // Show "No Event Result" message
            html = `
                <div style="padding: 20px 16px; text-align: center; color: #999; font-size: 14px;">
                    No Event Result
                </div>
            `;
        } else {
            html = slicedSuggestions.map(event => {
                const today = new Date().toISOString().split('T')[0];
                const eventDate = event.event_date.split(' ')[0];
                let category = '';
                let categoryClass = '';
                
                if (eventDate > today) {
                    category = 'Upcoming';
                    categoryClass = 'upcoming';
                } else if (eventDate === today) {
                    category = 'Ongoing';
                    categoryClass = 'ongoing';
                } else {
                    category = 'Past';
                    categoryClass = 'past';
                }
                
                return `
                    <div class="suggestion-item" onclick="selectSuggestion('${event.event_name.replace(/'/g, "\\'")}', '${event.location.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                        <div class="suggestion-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12h5v5h-5zm7-9h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 2v2H5V5zM5 19V9h14v10z"/></svg>
                        </div>
                        <div class="suggestion-content">
                            <div class="suggestion-name">${event.event_name}</div>
                            <div class="suggestion-meta">
                                <span class="suggestion-category ${categoryClass}">${category}</span>
                                ${event.location ? `<span class="suggestion-location">• ${event.location}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add "See More" if there are more results
            if (hasMore) {
                html += `
                    <div class="suggestion-more" onclick="closeSuggestions(); searchEvents();">
                        See More (${suggestions.length} results) →
                    </div>
                `;
            }
        }
        
        suggestionsDiv.innerHTML = html;
        suggestionsDiv.classList.add('show');
    } catch (error) {
        console.error('Error showing suggestions:', error);
    }
}

function selectSuggestion(eventName, location) {
    document.getElementById('searchInput').value = eventName;
    closeSuggestions();
    searchEvents();
}

function closeSuggestions() {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    suggestionsDiv.classList.remove('show');
    suggestionsDiv.innerHTML = '';
}

// ============ EVENT MODAL ============
function openEventModal(eventId) {
    console.log('Opening event modal for event ID:', eventId);
    
    const event = allEvents.find(e => e.event_id == eventId);
    if (!event) {
        // Fetch event details from API
        fetch(`${API_BASE}/events.php?action=detail&event_id=${eventId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayEventModal(data.data);
                } else {
                    showNotification('Error loading event details', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error loading event', 'error');
            });
        return;
    }
    
    displayEventModal(event);
}

function displayEventModal(event) {
    console.log('Displaying event modal for:', event.event_name);
    
    currentEventDetail = event;
    
    // Populate modal
    const imageUrl = getImageUrl(event.image_url);
    document.getElementById('modalImage').src = imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23C41E3A" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="60" fill="white" text-anchor="middle" dominant-baseline="middle"%3E📅%3C/text%3E%3C/svg%3E';
    document.getElementById('modalTitle').textContent = event.event_name;
    document.getElementById('modalDate').textContent = formatDate(event.event_date);
    document.getElementById('modalTime').textContent = event.start_time && event.end_time ? 
        `${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}` : 'TBD';
    document.getElementById('modalLocation').textContent = event.location || 'TBD';
    document.getElementById('modalCapacity').textContent = `${event.capacity} participants`;
    document.getElementById('modalAvailable').textContent = event.available_spots >= 0 ? 
        `${event.available_spots} spots` : 'Event Full';
    document.getElementById('modalDescription').textContent = event.description || 'No description available';
    document.getElementById('modalRegistrations').textContent = event.total_registrations || 0;
    document.getElementById('modalAttended').textContent = event.attended_count || 0;
    document.getElementById('registrationEventId').value = event.event_id;
    
    // Load Other Information metadata
    loadClientEventMetadata(event.event_id);
    
    const privateBadge = document.getElementById('modalPrivateBadge');
    if (event.is_private == 1) {
        privateBadge.style.display = 'block';
    } else {
        privateBadge.style.display = 'none';
    }
    
    // Check if event is past event and hide register button
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastEvent = eventDate < today;
    
    const registerBtn = document.querySelector('.modal-footer .btn-primary');
    if (registerBtn) {
        registerBtn.style.display = isPastEvent ? 'none' : 'block';
    }
    
    // Hide close button for non-past events, show only for past events
    const closeBtn = document.querySelector('.modal-header .close');
    if (closeBtn) {
        closeBtn.style.display = isPastEvent ? 'block' : 'none';
    }
    
    // Hide footer close button for past events
    const footerCloseBtn = document.querySelector('.modal-footer .btn-secondary');
    if (footerCloseBtn) {
        footerCloseBtn.style.display = isPastEvent ? 'none' : 'block';
    }
    
    // Show modal
    document.getElementById('eventModal').style.display = 'block';
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    currentEventDetail = null;
}

// ============ REGISTRATION ============
function registerForEvent() {
    console.log('Registering for event:', currentEventDetail?.event_id);
    
    if (!currentEventDetail) {
        showNotification('Event not found', 'error');
        return;
    }
    
    // Check capacity
    if (currentEventDetail.available_spots <= 0) {
        showNotification('This event is at full capacity', 'error');
        return;
    }
    
    // Check if event is private and require code
    if (currentEventDetail.is_private == 1) {
        showPrivateCodeModal(currentEventDetail);
        return; // Stop here - registration will continue after private code verification
    }
    
    // If public event, proceed directly to registration
    continueWithRegistration(currentEventDetail);
}

// ============ PRIVATE CODE MODAL FUNCTIONS ============
let pendingEventForPrivateCode = null;

function showPrivateCodeModal(eventDetail) {
    pendingEventForPrivateCode = eventDetail;
    
    // Build description based on department
    const descriptionElement = document.getElementById('privateEventDescription');
    if (eventDetail.department) {
        descriptionElement.textContent = `This is a private event for the ${eventDetail.department} department.`;
    } else {
        descriptionElement.textContent = 'This is a private event.';
    }
    
    // Clear previous input and error
    document.getElementById('privateCodeInput').value = '';
    document.getElementById('privateCodeError').style.display = 'none';
    
    // Show modal
    const modal = document.getElementById('privateCodeModal');
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    // Focus on input
    setTimeout(() => {
        document.getElementById('privateCodeInput').focus();
    }, 100);
}

function submitPrivateCode() {
    if (!pendingEventForPrivateCode) return;
    
    const userCode = document.getElementById('privateCodeInput').value.trim();
    const errorElement = document.getElementById('privateCodeError');
    
    if (!userCode) {
        errorElement.style.display = 'block';
        errorElement.textContent = 'Please enter a code to register';
        return;
    }
    
    // Verify the code matches the event's private code
    if (userCode !== (pendingEventForPrivateCode.private_code || '')) {
        errorElement.style.display = 'block';
        errorElement.textContent = 'Incorrect code. Please try again.';
        document.getElementById('privateCodeInput').value = '';
        return;
    }
    
    // Code is correct - close modal and continue with registration
    closePrivateCodeModal();
    continueWithRegistration(pendingEventForPrivateCode);
}

function cancelPrivateCodeModal() {
    closePrivateCodeModal();
    pendingEventForPrivateCode = null;
}

function closePrivateCodeModal() {
    const modal = document.getElementById('privateCodeModal');
    modal.style.display = 'none';
}

function continueWithRegistration(currentEventDetail) {
    document.getElementById('registrationEventId').value = currentEventDetail.event_id;
    
    // Display event name in modal
    document.getElementById('modalEventName').textContent = currentEventDetail.event_name || 'Event';
    
    // Handle private events - store private code
    const registrationPrivateCode = document.getElementById('registrationPrivateCode');
    
    if (currentEventDetail.is_private == 1 && currentEventDetail.private_code) {
        // Store private code in hidden field
        registrationPrivateCode.value = currentEventDetail.private_code;
        console.log('✓ Private event code locked:', currentEventDetail.private_code);
    } else {
        // Clear hidden field for public events
        registrationPrivateCode.value = '';
    }
    
    closeEventModal();
    document.getElementById('registrationModal').style.display = 'block';
    
    // Clear form inputs
    document.getElementById('participantName').value = '';
    document.getElementById('participantCompany').value = '';
    document.getElementById('participantJobTitle').value = '';
    document.getElementById('participantEmail').value = '';
    document.getElementById('participantEmployeeCode').value = '';
    document.getElementById('participantPhone').value = '';
}

function submitRegistration(e) {
    e.preventDefault();
    console.log('Submitting registration...');
    
    // Check if already submitting
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) {
        console.log('Form already submitting, ignoring duplicate submission');
        return false;
    }
    
    const eventId = document.getElementById('registrationEventId').value;
    const participantName = document.getElementById('participantName').value;
    const participantEmail = document.getElementById('participantEmail').value;
    const participantCompany = document.getElementById('participantCompany').value;
    const participantJobTitle = document.getElementById('participantJobTitle').value;
    const participantEmployeeCode = document.getElementById('participantEmployeeCode').value;
    const participantPhone = document.getElementById('participantPhone').value;
    
    // Validate required fields
    if (!eventId || !participantName || !participantEmail || !participantCompany || !participantJobTitle || !participantEmployeeCode || !participantPhone) {
        showNotification('Please fill in all required fields', 'error');
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(participantEmail)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    // Validate phone format
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(participantPhone)) {
        showNotification('Please enter a valid phone number', 'error');
        return false;
    }
    
    const formData = {
        event_id: parseInt(eventId),
        participant_name: participantName,
        participant_email: participantEmail,
        company: participantCompany,
        job_title: participantJobTitle,
        employee_code: participantEmployeeCode,
        participant_phone: participantPhone,
        status: 'REGISTERED'
    };
    
    console.log('Registration data:', formData);
    
    // Disable submit button to prevent duplicate submissions
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    fetch(`${API_BASE}/participants.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        console.log('Registration response status:', response.status);
        console.log('Response content-type:', response.headers.get('content-type'));
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return response.text().then(text => {
                console.error('Non-JSON response received:', text);
                throw new Error('API returned invalid response format. Server may be down or misconfigured.');
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Registration response:', data);
        
        if (data.success) {
            let message = data.already_registered 
                ? '✓ You are already registered for this event!'
                : '🎉 Successfully registered for the event!';
            
            showNotification(message, 'success');
            
            // Close registration modal and show confirmation with QR code
            closeRegistrationModal();
            
            // Generate QR code with registration code
            const registrationCode = data.registration_code || 'NO_CODE';
            generateAndShowQRCode(participantName, participantEmail, registrationCode);
            
            // Reload events to update registration count
            setTimeout(() => {
                loadEvents();
            }, 2000);
        } else {
            showNotification(data.message || 'Error registering for event', 'error');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        console.error('Error stack:', error.stack);
        showNotification('Error registering for event: ' + error.message, 'error');
    })
    .finally(() => {
        // After 2 seconds, re-enable button for potential retry
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }, 2000);
    });
    
    return false;
}

function closeRegistrationModal() {
    // Hide modal
    document.getElementById('registrationModal').style.display = 'none';
    
    // Reset form
    const form = document.getElementById('registrationForm');
    if (form) {
        form.reset();
        // Re-enable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    }
}

// Generate QR code and show confirmation modal
function generateAndShowQRCode(name, email, registrationCode) {
    console.log('Generating QR code for:', registrationCode);
    
    // Get event name
    const eventId = document.getElementById('registrationEventId').value;
    const event = allEvents.find(e => e.event_id == eventId);
    const eventName = event ? event.event_name : 'Event';
    
    // Generate QR code data - contains registration code
    const qrData = `Registration Code: ${registrationCode}`;
    
    // Use QRServer API to generate QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    
    // Update confirmation modal with data
    document.getElementById('confirmEventName').textContent = eventName;
    document.getElementById('confirmRegistrationCode').textContent = registrationCode;
    document.getElementById('confirmName').textContent = name;
    document.getElementById('confirmEmail').textContent = email;
    document.getElementById('confirmationQRCode').src = qrUrl;
    
    // Show confirmation modal
    document.getElementById('confirmationModal').style.display = 'block';
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

// ============ PRIVATE EVENT CODE ============
function joinPrivateEvent() {
    const code = document.getElementById('privateCode').value.trim().toUpperCase();
    console.log('Attempting to join private event with code:', code);
    
    if (!code) {
        showNotification('Please enter a code', 'error');
        return;
    }
    
    // Find private events with matching code
    const matchingEvents = allEvents.filter(e => {
        const isPrivate = e.is_private == 1;
        const codeMatches = e.private_code === code;
        console.log(`Checking event: ${e.event_name}, is_private: ${e.is_private}, private_code: ${e.private_code}, matches: ${isPrivate && codeMatches}`);
        return isPrivate && codeMatches;
    });
    console.log('Events matching code:', matchingEvents.length);
    
    if (matchingEvents.length === 0) {
        showNotification('❌ No events found with that code. Please check and try again.', 'error');
        return;
    }
    
    // Clear the input
    document.getElementById('privateCode').value = '';
    
    // Display matching events
    displayEvents(matchingEvents);
    showNotification(`✅ Found ${matchingEvents.length} event${matchingEvents.length !== 1 ? 's' : ''} with that code!`, 'success');
    
    // Scroll to events
    document.getElementById('eventsGrid').scrollIntoView({ behavior: 'smooth' });
}

// Reset to show only public events
function resetToPublicEvents() {
    console.log('Resetting to public events');
    const publicEvents = allEvents.filter(e => e.is_private != 1);
    displayEvents(publicEvents);
    document.getElementById('searchInput').value = '';
    document.getElementById('privateCode').value = '';
    showNotification('Showing public events', 'info');
}

// ============ UTILITIES ============
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showNotification(message, type = 'success') {
    console.log('Notification:', type, message);
    
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ============ OTHER INFORMATION (METADATA) ============
function loadClientEventMetadata(eventId) {
    fetch(`${API_BASE}/metadata.php?action=list&event_id=${eventId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                displayClientEventMetadata(data.data);
            }
        })
        .catch(error => console.error('Error loading metadata:', error));
}

function displayClientEventMetadata(metadata) {
    const container = document.getElementById('otherInformation') || createOtherInformationSection();
    
    if (!metadata || metadata.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    const metadataContent = container.querySelector('.metadata-content') || document.createElement('div');
    metadataContent.className = 'metadata-content';
    
    const html = metadata.map(item => `
        <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">${escapeHtml(item.field_name)}</div>
            <div style="color: #6b7280; word-wrap: break-word; white-space: pre-wrap;">${escapeHtml(item.field_value)}</div>
        </div>
    `).join('');
    
    metadataContent.innerHTML = html;
    if (!container.querySelector('.metadata-content')) {
        container.appendChild(metadataContent);
    }
}

function createOtherInformationSection() {
    const modal = document.getElementById('eventModal');
    if (!modal) return null;
    
    const section = document.createElement('div');
    section.id = 'otherInformation';
    section.style.cssText = 'margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb;';
    section.innerHTML = `
        <h3 style="font-size: 18px; font-weight: 600; color: #111; margin-bottom: 16px;">Other Information</h3>
        <div class="metadata-content"></div>
    `;
    
    // Insert before confirmation details
    const modalBody = modal.querySelector('.event-details') || modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.appendChild(section);
    }
    
    return section;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
