<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intellismart Event System</title>

    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
 
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    animation: {
                        'fade-in-up': 'fadeInUp 0.6s ease forwards',
                    },
                    keyframes: {
                        fadeInUp: {
                            '0%': { opacity: '0', transform: 'translateY(20px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' }
                        }
                    }
                }
            }
        }
    </script>
    
    <style>
        body {
            font-family: system-ui, sans-serif;
        }
        
        .animate-fade-in-up-1 {
            animation: fadeInUp 0.6s ease forwards 0.1s;
        }
        
        .animate-fade-in-up-2 {
            animation: fadeInUp 0.6s ease forwards 0.3s;
        }
        
        .animate-fade-in-up-3 {
            animation: fadeInUp 0.6s ease forwards 0.5s;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .private-event-container {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height 0.4s ease, opacity 0.4s ease, margin 0.4s ease;
        }

        .private-event-container.active {
            max-height: 300px;
            opacity: 1;
        }
        
        /* Gallery Modal Responsive */
        #galleryViewerModal > div > div:nth-child(2) > div:first-child {
            height: 50vh;
        }
        
        @media (min-width: 1024px) {
            #galleryViewerModal > div > div:nth-child(2) > div:first-child {
                height: auto;
                flex: 1 1 0%;
            }
        }
        
        /* Gallery Modal Scrollable with Hidden Scrollbar */
        #galleryViewerModal .overflow-y-auto {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
            overflow-y: auto;
        }
        
        #galleryViewerModal .overflow-y-auto::-webkit-scrollbar {
            display: none; /* Chrome, Safari, and Opera */
        }
        
        /* Ensure prev/next buttons appear on top */
        #galleryViewerModal > button {
            z-index: 60;
        }
    </style>
</head>
<body class="bg-slate-50 overflow-x-hidden">

    <!-- HEADER -->
    <header class="sticky top-0 z-50 shadow-md backdrop-blur-md bg-white/95">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-14 sm:h-16">
                <!-- Logo -->
                <div class="flex items-center space-x-2">
                    
                    <img src="../assets/ITIname.png" alt="Intellismart" style="height: 170px; object-fit: contain;">
                </div>
            </div>
        </div>
    </header>

    <!-- HERO SECTION WITH VIDEO BACKGROUND -->
    <section class="relative w-full min-h-96 overflow-hidden">
        <!-- Video Background -->
        <video autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover">
            <source src="../assets/background.mp4" type="video/mp4">
            Your browser does not support the video tag.
        </video>

        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/45 z-10"></div>

         <!-- Content -->
        <div class="relative z-20 flex flex-col justify-center items-center min-h-96 w-full px-4 py-20">
            <div class="w-full max-w-4xl text-center space-y-2 sm:space-y-3 md:space-y-4">
        
                  <!-- Title -->
                <div class="animate-fade-in-up-1">
                    <h2 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight">
                        Find & Join Corporate Events
                    </h2>
                </div>

                <!-- Subtitle -->
                <div class="animate-fade-in-up-2 mt-4 !mb-[25px]">
                    <p class="text-blue-100" style="font-size: 1.125rem; line-height: 1.75rem;">
                       Discover the latest conferences and internal workshops at Intellismart Technology Incorporated.
                    </p>
                </div>

                               <!-- Search Bar -->
                <div class="animate-fade-in-up-2 flex justify-center w-full mt-32 py-2 px-4" style="display: none;">
                    <div class="relative w-full" style="max-width: 800px;">
                        <input 
                            type="text" 
                            id="searchInput"
                            placeholder="Search by event name or location..." 
                            class="w-full pl-12 pr-24 py-3 sm:py-3.5 md:py-4 rounded-full border-2 border-gray-200 focus:outline-none focus:border-blue-500 text-gray-800 placeholder-gray-500 transition duration-300"
                        >
                        <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <button 
                            class="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 sm:px-8 py-2 sm:py-2.5 md:py-3 rounded-full transition duration-300 active:scale-95">
                            Search
                        </button>
                    </div>
                </div>
                <div class="mt-8 max-w-4xl mx-auto">
            

                          <!-- Private Event Code -->
                <div class="animate-fade-in-up-3 flex flex-col items-center w-full gap-4 mt-3">
                    <button id="privateEventToggle" class="cursor-pointer text-white text-sm sm:text-base font-medium hover:text-white/90 transition select-none mt-8">
                    Have a private event code?
                    </button>

                    <!-- Private Event Input Container -->
                    <div id="privateEventContainer" class="private-event-container flex justify-center w-full">
                        <div class="bg-white rounded-2xl py-4 px-5 shadow-2xl w-full" style="max-width: 800px;">
                            <div class="flex flex-col sm:flex-row items-center md:justify-between gap-6 sm:gap-8">
                                <!-- Text Section -->
                                <div class="flex-1 text-center sm:text-left">
                                    <h4 class="text-sm font-bold text-gray-800 mb-2">Have a private event code?</h4>
                                    <p class="text-gray-600 text-xs">Enter your exclusive invitation code to unlock hidden events.</p>
                                </div>
                                
                                <!-- Input & Button Section -->
                                <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <input 
                                        type="text" 
                                        id="privateEventCode"
                                        placeholder="Enter Code" 
                                        class="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-900 focus:outline-none focus:border-blue-600 w-full sm:w-auto">
                                    <button id="submitCodeBtn"
                                        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition active:scale-95 text-sm whitespace-nowrap">Join Event →</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div></div>

            </div>
        </div>
    </section>
  
    <!-- NEXT EVENT COUNTDOWN -->
    <?php include '../api/next_event_countdown.php'; ?>

    <!-- ONGOING EVENTS -->
    <section class="max-w-7xl mx-auto px-6 md:px-10 mt-8">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
                <span class="w-1 h-6 rounded-full" style="background-color: #1d4ed8;"></span>
                <h2 class="text-2xl font-semibold">Ongoing Events</h2>
            </div>
            <div class="text-xs text-slate-400">Live now</div>
        </div>
        <div class="relative">
            <div id="ongoingCarousel" class="flex gap-4 overflow-x-auto scroll-smooth pb-2"></div>
        </div>
    </section>

    <!-- UPCOMING EVENTS -->
    <main class="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div class="flex items-center gap-3 mb-6">
            <span class="w-1 h-6 rounded-full" style="background-color: #1d4ed8;"></span>
            <h2 class="text-2xl font-semibold">Upcoming Events</h2>
        </div>
        <div id="upcomingEventsContainer" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-12">
                <p class="text-gray-500">Loading events...</p>
            </div>
        </div>
    </main>

    <!-- PAST EVENTS CATALOGUE -->
    <section class="max-w-7xl mx-auto px-6 md:px-10 pb-10">
        <div class="flex items-center justify-between gap-3 mb-6">
            <div class="flex items-center gap-3">
                <span class="w-1 h-6 rounded-full" style="background-color: #1d4ed8;"></span>
                <h2 class="text-2xl font-semibold">Past Events Catalogue</h2>
            </div>
            <div class="flex items-center gap-2">
                <button id="cataloguePrev" class="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">‹</button>
                <button id="catalogueNext" class="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">›</button>
            </div>
        </div>
        <div class="relative overflow-hidden">
            <div id="catalogueCarousel" class="flex transition-transform duration-500" data-index="0"></div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="w-full bg-blue-600 text-white py-6 sm:py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p class="text-sm sm:text-base">&copy; 2026 Wells Fargo. All rights reserved.</p>
        </div>
    </footer>

    <!-- EVENT GALLERY VIEWER MODAL -->
    <div id="galleryViewerModal" class="hidden fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4">
        <!-- Prev Button Outside Modal -->
        <button onclick="galleryPrevEvent()" class="absolute left-1 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-2 sm:p-3 rounded-full transition shadow-lg">
            <i class="bi bi-chevron-left text-lg sm:text-2xl"></i>
        </button>
        
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-2xl sm:max-w-4xl lg:max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col overflow-y-auto">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-4 flex justify-between items-center flex-shrink-0">
                <h2 class="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 line-clamp-1"><span id="galleryEventName"></span> <span class="text-gray-500">Gallery</span></h2>
                <button onclick="closeGalleryViewer()" class="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl font-light ml-2 flex-shrink-0">×</button>
            </div>
            
            <!-- Two Column Layout - Stack on mobile -->
            <div class="flex flex-col lg:flex-row flex-1 overflow-y-auto min-h-0">
                <!-- Left Column: Large Image Preview -->
                <div class="flex flex-col p-3 sm:p-6 lg:border-r border-gray-200 border-b lg:border-b-0 min-h-0">
                    <!-- Main Image with Side Navigation -->
                    <div class="flex-1 relative mb-2 sm:mb-4 flex items-center justify-center group min-h-0">
                        <div id="galleryMainImage" class="w-full h-full bg-gray-100 rounded-lg bg-cover bg-center" style="background-size: contain; background-repeat: no-repeat;"></div>
                        
                        <!-- Left Arrow Button -->
                        <button onclick="galleryPrev()" class="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 sm:p-3 rounded-full transition opacity-0 group-hover:opacity-100">
                            <i class="bi bi-chevron-left text-base sm:text-xl"></i>
                        </button>
                        
                        <!-- Right Arrow Button -->
                        <button onclick="galleryNext()" class="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 sm:p-3 rounded-full transition opacity-0 group-hover:opacity-100">
                            <i class="bi bi-chevron-right text-base sm:text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- Counter -->
                    <div class="text-center text-gray-600 font-medium text-xs sm:text-sm">
                        <span id="galleryCounter"></span>
                    </div>
                </div>
                
                <!-- Right Column: Thumbnail Grid & Event Details - Full width on mobile -->
                <div class="w-full lg:w-64 flex flex-col p-2 lg:p-6 overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-200 flex-1 lg:flex-none">
                    <!-- Thumbnails Section -->
                    <p class="text-xs sm:text-sm font-semibold text-gray-700 mb-2 lg:mb-4 flex-shrink-0">Event Gallery</p>
                    <div id="galleryThumbnails" class="grid grid-cols-3 gap-1 lg:gap-2 mb-4 lg:mb-6 auto-rows-max">
                        <!-- Thumbnails will be populated here -->
                    </div>
                    
                    <!-- Event Details Section -->
                    <div class="border-t border-gray-200 pt-3 sm:pt-4 lg:pt-6 flex-shrink-0">
                        <p class="text-xs sm:text-sm font-semibold text-gray-700 mb-2 lg:mb-3">Event Details</p>
                        
                        <!-- Date -->
                        <div class="mb-3">
                            <p class="text-xs text-gray-500 flex items-center gap-2">
                                <i class="bi bi-calendar-event text-gray-600"></i>
                                <span id="galleryEventDate" class="text-xs sm:text-sm text-gray-700">-</span>
                            </p>
                        </div>
                        
                        <!-- Location -->
                        <div class="mb-3">
                            <p class="text-xs text-gray-500 flex items-center gap-2">
                                <i class="bi bi-geo-alt text-gray-600"></i>
                                <span id="galleryEventLocation" class="text-xs sm:text-sm text-gray-700">-</span>
                            </p>
                        </div>
                        
                        <!-- Description -->
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Description</p>
                            <p id="galleryEventDescription" class="text-xs sm:text-sm text-gray-700 line-clamp-4">-</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Next Button Outside Modal -->
        <button onclick="galleryNextEvent()" class="absolute right-1 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-2 sm:p-3 rounded-full transition shadow-lg">
            <i class="bi bi-chevron-right text-lg sm:text-2xl"></i>
        </button>
    </div>

    <!-- REGISTRATION MODAL -->
    <?php include 'registration_modal.html'; ?>

    <!-- DUP REGISTRATION MODAL -->
    <?php include 'duplicate_reg_modal.html'; ?>

    <!-- QR CERTIFICATE GENERATOR -->
    <?php include 'generate_QR.php'; ?>

    <script>

        // Format date from YYYY-MM-DD to MMM DD, YYYY
        function formatDate(dateString) {
            // Handle both "YYYY-MM-DD" and "YYYY-MM-DD HH:MM:SS" formats
            const dateOnly = dateString.split(' ')[0];
            const date = new Date(dateOnly + 'T00:00:00');
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options).toUpperCase();
        }
        
        // Format time from HH:MM:SS to h:MMam/pm
        function formatTime(timeString) {
            const [hours, minutes] = timeString.split(':');
            let hour = parseInt(hours);
            const period = hour >= 12 ? 'pm' : 'am';
            hour = hour % 12 || 12;
            return `${hour}:${minutes}${period}`;
        }
        
        // Store current event ID globally
        let currentEventId = null;
        let catalogueAutoPlayInterval = null;
        
        // Load event on page load
        window.addEventListener('DOMContentLoaded', async function() {
            loadOngoingEvents();
            loadUpcomingEvents();
            loadCatalogueEvents();
            setInterval(loadOngoingEvents, 30000);
            setInterval(loadUpcomingEvents, 30000);
            
            // Setup search functionality
            setupSearchFunctionality();
            
            // Setup private event code handlers
            setupPrivateEventCodeHandlers();
        });

        // Search functionality setup - called after DOM is ready
        function setupSearchFunctionality() {
            const searchInput = document.getElementById('searchInput');
            const searchButton = searchInput.parentElement.querySelector('button');
            
            searchButton.addEventListener('click', function() {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    console.log('Searching for:', searchTerm);
                    // Add your search logic here
                    alert('Searching for: ' + searchTerm);
                }
            });
            
            // Search on Enter key
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchButton.click();
                }
            });
        }
        async function loadOngoingEvents() {
            try {
                // Use generic filtered events API with type parameter
                const response = await fetch('../api/get_filtered_upcoming_events.php?type=ongoing');
                const data = await response.json();
                
                const container = document.getElementById('ongoingCarousel');
                
                if (data.success && data.events.length > 0) {
                    // Filter out private events - only show public events (is_private = 0)
                    const publicEvents = data.events.filter(event => event.is_private == 0);
                    
                    if (publicEvents.length === 0) {
                        container.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">No events happening right now</p></div>';
                        return;
                    }
                    
                    container.innerHTML = publicEvents.map(event => {
                        const eventDataJson = JSON.stringify({
                            id: event.id,
                            name: event.event_name,
                            date: event.event_date,
                            startTime: event.start_time,
                            endTime: event.end_time,
                            location: event.location,
                            description: event.description || 'Event details coming soon.',
                            image: event.image_url,
                            capacity: event.capacity || 0,
                            current_registrations: event.current_registrations || 0,
                            is_registration_closed: event.is_registration_closed || 0,
                            registrationStart: event.registration_start || '',
                            registrationEnd: event.registration_end || ''
                        });
                        
                        const escapedEventData = eventDataJson.replace(/"/g, '&quot;');
                        
                        return `
                            <div class="min-w-[280px] bg-white rounded-2xl shadow-sm overflow-hidden text-left event-card-ongoing cursor-pointer" data-event="${escapedEventData}">
                                <div class="h-36 bg-cover bg-center" style="background-image:url('../uploads/events/${event.image_url || ''}');"></div>
                                <div class="p-4">
                                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">${formatDate(event.event_date)} · ${formatTime(event.start_time)} to ${formatTime(event.end_time)}</p>
                                    <h3 class="text-base font-semibold mt-1">${event.event_name}</h3>
                                    <p class="text-xs text-slate-500 mt-1">${event.location}</p>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    // Add click listeners to ongoing event cards
                    document.querySelectorAll('.event-card-ongoing').forEach(card => {
                        card.addEventListener('click', function() {
                            const escapedData = this.getAttribute('data-event');
                            const eventDataJson = escapedData.replace(/&quot;/g, '"');
                            const eventData = JSON.parse(eventDataJson);
                            openEventModal(eventData);
                        });
                    });
                } else {
                    container.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">No events happening right now</p></div>';
                }
            } catch (error) {
                console.error('Error loading ongoing events:', error);
                document.getElementById('ongoingCarousel').innerHTML = '<div class="text-center py-12"><p class="text-red-500">Error loading events</p></div>';
            }
        }

        // Load upcoming events - all filtering logic moved to server-side
        async function loadUpcomingEvents() {
            try {
                // Call generic server-side API with type parameter for filtering and logic
                const response = await fetch('../api/get_filtered_upcoming_events.php?type=upcoming');
                const data = await response.json();
                
                const container = document.getElementById('upcomingEventsContainer');
                
                if (data.success && data.events.length > 0) {
                    container.innerHTML = data.events.map(event => {
                        // Use status information from server
                        const registrationStatusBadge = event.status_badge;
                        const registrationStatusColor = event.status_color;
                        const registrationStatusTextColor = event.status_text_color;
                        
                        const eventDataJson = JSON.stringify({
                            id: event.id,
                            name: event.event_name,
                            date: event.event_date,
                            startTime: event.start_time,
                            endTime: event.end_time,
                            location: event.location,
                            description: event.description || 'Event details coming soon.',
                            image: event.image_url,
                            capacity: event.capacity || 0,
                            current_registrations: event.current_registrations || 0,
                            is_registration_closed: event.is_registration_closed || 0,
                            registrationStart: event.registration_start || '',
                            registrationEnd: event.registration_end || ''
                        });
                        
                        // Escape quotes for safe HTML attribute injection
                        const escapedEventData = eventDataJson.replace(/"/g, '&quot;');
                        
                        return `<div class="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:scale-[1.02] cursor-pointer event-card" data-event="${escapedEventData}"><div class="h-40 bg-cover bg-center" style="background-image:url('../uploads/events/${event.image_url || ''}');"></div><div class="p-5 flex-1 flex flex-col"><h3 class="text-lg font-semibold">${event.event_name}</h3><div class="mt-2 text-sm text-slate-500 space-y-1"><div><i class="bi bi-calendar-event"></i> ${formatDate(event.event_date)} · ${formatTime(event.start_time)} to ${formatTime(event.end_time)}</div><div><i class="bi bi-geo-alt"></i> ${event.location}</div></div><p class="mt-3 text-sm text-slate-600 line-clamp-3">${event.description || 'Event details coming soon.'}</p><div class="mt-4 flex items-center justify-between"><span class="px-2 py-1 text-xs rounded-full text-sm font-semibold" style="background-color: ${registrationStatusColor}; color: ${registrationStatusTextColor};">${registrationStatusBadge}</span><button class="view-details-btn px-4 py-2 rounded-lg text-sm font-semibold" style="border: 1px solid #1d4ed8; color: #1d4ed8;" onmouseover="this.style.backgroundColor='#dbeafe'" onmouseout="this.style.backgroundColor='transparent'">View Details</button></div></div></div>`;
                    }).join('');
                    
                    // Add event listeners to view details buttons
                    document.querySelectorAll('.view-details-btn').forEach(btn => {
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const card = this.closest('.event-card');
                            const escapedData = card.getAttribute('data-event');
                            // Decode the escaped HTML entities back to normal quotes
                            const eventDataJson = escapedData.replace(/&quot;/g, '"');
                            const eventData = JSON.parse(eventDataJson);
                            openEventModal(eventData);
                        });
                    });
                } else {
                    container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">No upcoming events available</p></div>';
                }
            } catch (error) {
                console.error('Error loading upcoming events:', error);
                document.getElementById('upcomingEventsContainer').innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">Error loading events</p></div>';
            }
        }

        // Load catalogue events (past events)
        async function loadCatalogueEvents() {
            try {
                const response = await fetch('../api/get_catalogue_events.php');
                const data = await response.json();
                
                const container = document.getElementById('catalogueCarousel');
                
                if (data.success && data.events.length > 0) {
                    // Store all events for gallery navigation
                    allCatalogueEvents = data.events;
                    
                    // Helper function to generate event HTML
                    const generateEventHTML = (event, index) => {
                        return `
                        <div class="min-w-full">
                            <div class="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onclick="openGalleryViewer(${event.id || event.catalogue_id}, '${event.event_name.replace(/'/g, "\\'")}', ${index})">
                                <div class="h-72 md:h-96 bg-cover bg-center" style="background-image:url('../uploads/events/${event.image_url || ''}');"></div>
                                <div class="p-6">
                                    <h3 class="text-lg font-semibold">${event.event_name}</h3>
                                    <div class="mt-2 text-sm text-slate-500 space-y-1">
                                        <div><i class="bi bi-calendar-event"></i> ${formatDate(event.event_date)}</div>
                                        <div><i class="bi bi-geo-alt"></i> ${event.location}</div>
                                    </div>
                                    <p class="mt-3 text-sm text-slate-600 line-clamp-3">${event.description || 'Event details coming soon.'}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    };
                    
                    // Build carousel with cloned first and last items for infinite loop
                    const lastEvent = data.events[data.events.length - 1];
                    const firstEvent = data.events[0];
                    let carouselHTML = generateEventHTML(lastEvent, data.events.length - 1); // Clone of last at beginning
                    carouselHTML += data.events.map((event, index) => generateEventHTML(event, index)).join('');
                    carouselHTML += generateEventHTML(firstEvent, 0); // Clone of first at end
                    
                    container.innerHTML = carouselHTML;
                    
                    // Initialize carousel navigation
                    const catalogueCarousel = document.getElementById('catalogueCarousel');
                    const cataloguePrev = document.getElementById('cataloguePrev');
                    const catalogueNext = document.getElementById('catalogueNext');
                    let currentIndex = 1; // Start at 1 because index 0 is the cloned last item
                    
                    function updateCarouselPosition() {
                        const translateX = -currentIndex * 100;
                        catalogueCarousel.style.transform = `translateX(${translateX}%)`;
                        catalogueCarousel.setAttribute('data-index', currentIndex);
                    }
                    
                    // Set initial position to show first real event (index 1)
                    updateCarouselPosition();
                    
                    function autoPlayNext() {
                        currentIndex += 1;
                        catalogueCarousel.style.transform = `translateX(${-currentIndex * 100}%)`;
                        
                        // If we reach the cloned first item, loop back
                        if (currentIndex === data.events.length + 1) {
                            catalogueCarousel.addEventListener('transitionend', function loopHandler() {
                                catalogueCarousel.removeEventListener('transitionend', loopHandler);
                                catalogueCarousel.style.transition = 'none';
                                currentIndex = 1;
                                catalogueCarousel.style.transform = `translateX(${-currentIndex * 100}%)`;
                                setTimeout(() => {
                                    catalogueCarousel.style.transition = '';
                                }, 50);
                            }, { once: true });
                        }
                    }
                    
                    function resetAutoPlay() {
                        clearInterval(catalogueAutoPlayInterval);
                        catalogueAutoPlayInterval = setInterval(autoPlayNext, 5000); // Auto advance every 5 seconds
                    }
                    
                    cataloguePrev.addEventListener('click', () => {
                        currentIndex -= 1;
                        catalogueCarousel.style.transform = `translateX(${-currentIndex * 100}%)`;
                        
                        // If we reach the cloned last item, loop back
                        if (currentIndex === 0) {
                            catalogueCarousel.addEventListener('transitionend', function loopHandler() {
                                catalogueCarousel.removeEventListener('transitionend', loopHandler);
                                catalogueCarousel.style.transition = 'none';
                                currentIndex = data.events.length;
                                catalogueCarousel.style.transform = `translateX(${-currentIndex * 100}%)`;
                                setTimeout(() => {
                                    catalogueCarousel.style.transition = '';
                                }, 50);
                            }, { once: true });
                        }
                        
                        resetAutoPlay();
                    });
                    
                    catalogueNext.addEventListener('click', () => {
                        currentIndex += 1;
                        catalogueCarousel.style.transform = `translateX(${-currentIndex * 100}%)`;
                        
                        // If we reach the cloned first item, loop back
                        if (currentIndex === data.events.length + 1) {
                            catalogueCarousel.addEventListener('transitionend', function loopHandler() {
                                catalogueCarousel.removeEventListener('transitionend', loopHandler);
                                catalogueCarousel.style.transition = 'none';
                                currentIndex = 1;
                                catalogueCarousel.style.transform = `translateX(${-currentIndex * 100}%)`;
                                setTimeout(() => {
                                    catalogueCarousel.style.transition = '';
                                }, 50);
                            }, { once: true });
                        }
                        
                        resetAutoPlay();
                    });
                    
                    // Start auto-play
                    catalogueAutoPlayInterval = setInterval(autoPlayNext, 5000);
                } else {
                    container.innerHTML = '<div class="min-w-full text-center py-12"><p class="text-gray-500">No past events in catalogue</p></div>';
                }
            } catch (error) {
                console.error('Error loading catalogue events:', error);
                document.getElementById('catalogueCarousel').innerHTML = '<div class="min-w-full text-center py-12"><p class="text-red-500">Error loading catalogue</p></div>';
            }
        }

// Setup private event code handlers - called after DOM is ready
function setupPrivateEventCodeHandlers() {
    const privateEventToggle = document.getElementById('privateEventToggle');
    const privateEventContainer = document.getElementById('privateEventContainer');
    const submitCodeBtn = document.getElementById('submitCodeBtn');
    const privateEventCode = document.getElementById('privateEventCode');
    let isPrivateEventOpen = false;

    // Toggle private event container
    privateEventToggle.addEventListener('click', function() {
        isPrivateEventOpen = !isPrivateEventOpen;
        
        if (isPrivateEventOpen) {
            privateEventContainer.classList.add('active');
            privateEventCode.focus();
        } else {
            privateEventContainer.classList.remove('active');
        }
    });

    // Submit code
    submitCodeBtn.addEventListener('click', function() {
        validatePrivateEventCode(privateEventCode, submitCodeBtn, privateEventContainer);
    });

    // Submit on Enter key
    privateEventCode.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            validatePrivateEventCode(privateEventCode, submitCodeBtn, privateEventContainer);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isPrivateEventOpen) {
            privateEventContainer.classList.remove('active');
            isPrivateEventOpen = false;
        }
    });
}

// Validate private event code with database
async function validatePrivateEventCode(privateEventCode, submitCodeBtn, privateEventContainer) {
    const code = privateEventCode.value.trim();
    
    if (!code) {
        alert('Please enter a code');
        return;
    }

    try {
        submitCodeBtn.disabled = true;
        submitCodeBtn.textContent = 'Validating...';

        // Use get_filtered_upcoming_events with private type and code parameter
        const response = await fetch(`../api/get_filtered_upcoming_events.php?type=private&code=${encodeURIComponent(code)}`);
        const data = await response.json();

        if (data.success && data.events && data.events.length > 0) {
            const event = data.events[0];
            console.log('Private event found:', event);
            
            // Convert from API response format to openEventModal format
            const eventData = {
                id: event.id,
                name: event.event_name,
                date: event.event_date,
                startTime: event.start_time,
                endTime: event.end_time,
                location: event.location,
                description: event.description || 'Event details coming soon.',
                image: event.image_url,
                capacity: event.capacity || 0,
                current_registrations: event.current_registrations || 0,
                is_registration_closed: event.is_registration_closed || 0,
                registrationStart: event.registration_start || '',
                registrationEnd: event.registration_end || ''
            };
            
            // Clear input and close panel
            privateEventCode.value = '';
            privateEventContainer.classList.remove('active');
            
            // Open the registration modal with the event (same logic as upcoming events)
            console.log('📋 Opening registration modal for private event:', eventData);
            openEventModal(eventData);
        } else {
            alert(data.message || 'Invalid code. Please try again.');
        }
    } catch (error) {
        console.error('Error validating code:', error);
        alert('An error occurred. Please try again.');
    } finally {
        submitCodeBtn.disabled = false;
        submitCodeBtn.textContent = 'Join Event →';
    }
}

function openEventModal(event) {
    console.log('Full event object:', event);
    console.log('registrationEnd value:', event.registrationEnd);
    
    console.log('Opening modal for event:', event);
    document.getElementById('eventModalTitle').textContent = event.name;
    document.getElementById('eventModalMeta').textContent = `${formatDate(event.date)} · ${formatTime(event.startTime)} to ${formatTime(event.endTime)} · ${event.location}`;
    document.getElementById('eventModalDesc').textContent = event.description;
    document.getElementById('eventModalImage').style.backgroundImage = `url('../uploads/events/${event.image}')`;
    document.getElementById('eventModalParticipants').textContent = event.capacity;
    
    // Set registration start and end dates
    if (event.registrationStart && event.registrationStart.trim()) {
        try {
            // Parse directly without timezone conversion (format: YYYY-MM-DD HH:MM:SS)
            const [dateStr, timeStr] = event.registrationStart.split(' ');
            document.getElementById('eventModalRegStart').textContent = `${formatDate(dateStr)} at ${formatTime(timeStr)}`;
        } catch (e) {
            document.getElementById('eventModalRegStart').textContent = '-';
        }
    } else {
        document.getElementById('eventModalRegStart').textContent = '-';
    }
    
    if (event.registrationEnd && event.registrationEnd.trim()) {
        try {
            // Parse directly without timezone conversion (format: YYYY-MM-DD HH:MM:SS)
            const [dateStr, timeStr] = event.registrationEnd.split(' ');
            document.getElementById('eventModalRegEnd').textContent = `${formatDate(dateStr)} at ${formatTime(timeStr)}`;
        } catch (e) {
            document.getElementById('eventModalRegEnd').textContent = '-';
        }
    } else {
        document.getElementById('eventModalRegEnd').textContent = '-';
    }
    
    const form = document.getElementById('registerForm');
    
    console.log('Loading registration form. Event ID:', event.id);
    console.log('Registration Start DateTime:', event.registrationStart);
    console.log('Registration End DateTime:', event.registrationEnd);
    
    // Check if registration is closed (due to not started, capacity, or deadline)
    let registrationClosed = false;
    let closureReason = '';
    let registrationStartDateTime = null;
    let registrationEndDateTime = null;
    let registrationStartFormatted = 'the scheduled time';
    let registrationEndFormatted = 'the deadline';
    const registerPanel = document.getElementById('eventModalRegisterPanel');
    
    // Check if registration hasn't started yet
    if (event.registrationStart && event.registrationStart.trim()) {
        try {
            // Parse the registration_start datetime for comparison
            // Format is 'YYYY-MM-DD HH:MM:SS'
            const regStartStr = event.registrationStart.replace(' ', 'T');
            registrationStartDateTime = new Date(regStartStr);
            
            const now = new Date();
            
            console.log('Registration Start Date:', registrationStartDateTime);
            console.log('Current Date:', now);
            console.log('Registration started?:', now > registrationStartDateTime);
            
            if (now < registrationStartDateTime) {
                registrationClosed = true;
                closureReason = 'not_started';
                // Format the date and time directly from the string
                const [dateStr, timeStr] = event.registrationStart.split(' ');
                registrationStartFormatted = `${formatDate(dateStr)} at ${formatTime(timeStr)}`;
                console.log('Registration has not started yet for this event');
            } else {
                console.log('Registration has started for this event');
            }
        } catch (e) {
            console.warn('Warning: Could not parse registration start date:', event.registrationStart, e);
        }
    }
    
    // Check if event is at full capacity (only if registration has started)
    if (!registrationClosed && event.capacity && event.current_registrations > 0 && event.capacity === event.current_registrations) {
        registrationClosed = true;
        closureReason = 'capacity';
        console.log('Registration closed - event is at full capacity. Capacity:', event.capacity, 'Registered:', event.current_registrations);
    }
    
    // Check if registration deadline has passed (only if registration has started)
    if (!registrationClosed && event.registrationEnd && event.registrationEnd.trim()) {
        try {
            // Parse the registration_end datetime for comparison
            // Format is 'YYYY-MM-DD HH:MM:SS'
            const regEndStr = event.registrationEnd.replace(' ', 'T');
            registrationEndDateTime = new Date(regEndStr);
            
            const now = new Date();
            
            console.log('Registration End Date:', registrationEndDateTime);
            console.log('Current Date:', now);
            console.log('Registration closed?:', now > registrationEndDateTime);
            
            if (now > registrationEndDateTime) {
                registrationClosed = true;
                closureReason = 'deadline';
                // Format the date and time directly from the string
                const [dateStr, timeStr] = event.registrationEnd.split(' ');
                registrationEndFormatted = `${formatDate(dateStr)} at ${formatTime(timeStr)}`;
                console.log('Registration period has ended for this event');
            } else {
                console.log('Registration is still open for this event');
            }
        } catch (e) {
            console.warn('Warning: Could not parse registration end date:', event.registrationEnd, e);
        }
    }
    
    if (registrationClosed) {
        // Show event details only - registration is closed
        registerPanel.classList.add('hidden');
        
        // Change to single column layout
        document.getElementById('eventModalBody').classList.add('md:grid-cols-1');
        document.getElementById('eventModalBody').classList.remove('md:grid-cols-2');
        
        // Show message that registration is closed in the event info area
        const closedMessage = document.createElement('div');
        closedMessage.className = 'mt-6 p-4 rounded-lg';
        
        let closureMessage = '';
        if (closureReason === 'not_started') {
            closedMessage.className = 'mt-6 p-4 bg-amber-50 rounded-lg';
            closureMessage = `
                <div class="flex gap-4 text-left">
                    <div class="flex-shrink-0">
                        <i class="bi bi-clock text-amber-600 text-xl"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-amber-700 text-sm">Registration Opening Soon</p>
                        <p class="text-amber-600 text-xs mt-1">Registration will open on <strong>${registrationStartFormatted}</strong></p>
                    </div>
                </div>
            `;
        } else if (closureReason === 'capacity') {
            closedMessage.className = 'mt-6 p-4 bg-red-50 rounded-lg';
            closureMessage = `
                <div class="flex gap-4 text-left">
                    <div class="flex-shrink-0">
                        <i class="bi bi-exclamation-circle text-red-600 text-xl"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-red-700 text-sm">Registration Closed - Event Full</p>
                        <p class="text-red-600 text-xs mt-1">All <strong>${event.capacity}</strong> available spots have been filled</p>
                    </div>
                </div>
            `;
        } else {
            closedMessage.className = 'mt-6 p-4 bg-red-50 rounded-lg';
            closureMessage = `
                <div class="flex gap-4 text-left">
                    <div class="flex-shrink-0">
                        <i class="bi bi-exclamation-circle text-red-600 text-xl"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-red-700 text-sm">Registration Closed</p>
                        <p class="text-red-600 text-xs mt-1">This event's registration closed on <strong>${registrationEndFormatted}</strong></p>
                    </div>
                </div>
            `;
        }
        
        closedMessage.innerHTML = closureMessage;
        
        // Remove any existing closed message (both red and amber)
        const existingRedMessage = document.getElementById('eventModalInfoPanel').querySelector('.bg-red-50');
        if (existingRedMessage) {
            existingRedMessage.remove();
        }
        const existingAmberMessage = document.getElementById('eventModalInfoPanel').querySelector('.bg-amber-50');
        if (existingAmberMessage) {
            existingAmberMessage.remove();
        }
        
        document.getElementById('eventModalInfoPanel').appendChild(closedMessage);
    } else {
        // Registration is still open - load registration form
        registerPanel.classList.remove('hidden');
        
        // Restore two column layout
        document.getElementById('eventModalBody').classList.remove('md:grid-cols-1');
        document.getElementById('eventModalBody').classList.add('md:grid-cols-2');
        
        // Remove any closed message if it exists (both red and amber)
        const existingRedMsg = document.getElementById('eventModalInfoPanel').querySelector('.bg-red-50');
        if (existingRedMsg) {
            existingRedMsg.remove();
        }
        const existingAmberMsg = document.getElementById('eventModalInfoPanel').querySelector('.bg-amber-50');
        if (existingAmberMsg) {
            existingAmberMsg.remove();
        }
        
        document.getElementById('eventModalRegisterTitle').textContent = 'Register';
        loadRegistrationForm(form, event.id);
    }
    
    // Show modal
    document.getElementById('eventModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function loadRegistrationForm(form, eventId) {
    console.log('loadRegistrationForm called with eventId:', eventId);
    
    // Store event ID globally
    currentEventId = eventId;
    console.log('currentEventId set to:', currentEventId);
    
    form.innerHTML = `
        <div class="relative">
            <input required="" id="firstName" name="firstName" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
            <label for="firstName" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">First Name</label>
        </div>
        <div class="relative">
            <input required="" id="middleName" name="middleName" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
            <label for="middleName" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Middle Name</label>
        </div>
        <div class="relative">
            <input required="" id="lastName" name="lastName" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
            <label for="lastName" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Last Name</label>
        </div>
        <div class="relative">
            <input required="" id="company" name="company" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
            <label for="company" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Company</label>
        </div>
        <div class="relative">
            <input required="" id="jobTitle" name="jobTitle" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
            <label for="jobTitle" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Job Title</label>
        </div>
        <div class="relative">
            <input required="" id="email" name="email" type="email" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
            <label for="email" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Email</label>
        </div>
        <div class="relative">
            <input required="" id="phone" name="phone" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
            <label for="phone" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Contact Number</label>
        </div>
        <button type="submit" class="w-full mt-2 px-4 py-2 rounded-lg text-white font-semibold transition" style="background-color: #1d4ed8;" onmouseover="this.style.backgroundColor='#1e40af'" onmouseout="this.style.backgroundColor='#1d4ed8'">Submit Registration</button>
    `;
    
    // Attach submit handler
    form.onsubmit = submitRegistration;
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Reset event modal to original state if closing the event modal
    if (modalId === 'eventModal') {
        resetEventModal();
    }
}

function closeQrModal() {
    document.getElementById('eventModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    resetEventModal();
}

function resetEventModal() {
    // Restore event image display
    document.getElementById('eventModalImage').style.display = '';
    
    // Restore event info panel display
    document.getElementById('eventModalInfoPanel').style.display = '';
    
    // Restore original grid layout
    document.getElementById('eventModalBody').classList.add('md:grid-cols-2');
    document.getElementById('eventModalBody').classList.remove('md:grid-cols-1');
    document.getElementById('eventModalBody').classList.add('overflow-y-auto');
    
    // Show the Register title
    const registerTitleSection = document.getElementById('registerTitleSection');
    if (registerTitleSection) {
        registerTitleSection.style.display = '';
    }
    
    // Reset the form back to registration form
    const form = document.getElementById('registerForm');
    if (form) {
        form.innerHTML = `
            <div class="relative">
                <input required="" id="firstName" name="firstName" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
                <label for="firstName" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">First Name</label>
            </div>
            <div class="relative">
                <input required="" id="middleName" name="middleName" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
                <label for="middleName" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Middle Name</label>
            </div>
            <div class="relative">
                <input required="" id="lastName" name="lastName" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
                <label for="lastName" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Last Name</label>
            </div>
            <div class="relative">
                <input required="" id="company" name="company" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
                <label for="company" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Company</label>
            </div>
            <div class="relative">
                <input required="" id="jobTitle" name="jobTitle" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
                <label for="jobTitle" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Job Title</label>
            </div>
            <div class="relative">
                <input required="" id="email" name="email" type="email" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
                <label for="email" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Email</label>
            </div>
            <div class="relative">
                <input required="" id="phone" name="phone" type="text" class="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none">
                <label for="phone" class="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-focus:-top-2 peer-focus:text-xs peer-valid:-top-2 peer-valid:text-xs">Contact Number</label>
            </div>
            <button type="submit" class="w-full mt-2 px-4 py-2 rounded-lg text-white font-semibold transition" style="background-color: #1d4ed8;" onmouseover="this.style.backgroundColor='#1e40af'" onmouseout="this.style.backgroundColor='#1d4ed8'">Submit Registration</button>
        `;
        form.onsubmit = submitRegistration;
    }
}

function submitRegistration(e) {
    e.preventDefault();
    const form = document.getElementById('registerForm');
    
    // Get event ID from global variable (more reliable than data attribute)
    const eventId = currentEventId;
    
    console.log('📝 submitRegistration called. currentEventId:', eventId);
    
    // Check if we have event ID
    if (!eventId) {
        console.error('Event ID not found in currentEventId. Value is:', currentEventId);
        alert('Event ID not set. Please reload the page and try again.');
        return;
    }
    
    // Check if email field exists
    const emailField = form.querySelector('[name="email"]');
    if (!emailField) {
        console.error('This is not a registration form.');
        return;
    }
    
    const email = emailField.value;
    
    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    let originalText = null;
    if (submitBtn) {
        originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Checking registration...';
    }
    
    // Check for duplicate registration BEFORE submitting
    console.log('🔍 Checking if email is already registered for this event...');
    checkAndRegister(email, eventId, form, submitBtn, originalText);
}

function checkAndRegister(email, eventId, form, submitBtn, originalText) {
    // First: Check if email already registered for this event
    fetch('../api/check_registration.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, event_id: eventId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.is_registered) {
            // Email already registered for this event - show error modal
            console.log(' Email already registered for this event.');
            showDuplicateModal(email);
            
            // Re-enable button
            if (submitBtn && originalText) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } else {
            // Email not registered - proceed with registration
            console.log('✅ Email not registered yet. Proceeding with registration...');
            performRegistration(form, submitBtn, originalText);
        }
    })
    .catch(err => {
        console.error('Error checking registration:', err);
        alert('Error checking registration. Please try again.');
        // Re-enable button
        if (submitBtn && originalText) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

function showDuplicateModal(email) {
    document.getElementById('duplicateEmail').textContent = email;
    document.getElementById('duplicateModal').classList.remove('hidden');
}

function closeDuplicateModal() {
    document.getElementById('duplicateModal').classList.add('hidden');
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const duplicateModal = document.getElementById('duplicateModal');
    if (e.target === duplicateModal) {
        closeDuplicateModal();
    }
});

function performRegistration(form, submitBtn, originalText) {
    // This function performs the actual registration after duplicate check passes
    
    const eventId = currentEventId;
    
    if (submitBtn) {
        submitBtn.textContent = 'Submitting...';
    }
    
    const email = form.querySelector('[name="email"]').value;
    
    const formData = {
        event_id: parseInt(eventId),
        first_name: form.querySelector('[name="firstName"]').value,
        middle_name: form.querySelector('[name="middleName"]').value,
        last_name: form.querySelector('[name="lastName"]').value,
        company: form.querySelector('[name="company"]').value,
        job_title: form.querySelector('[name="jobTitle"]').value,
        email: email,
        contact_number: form.querySelector('[name="phone"]').value
    };
    
    console.log('Submitting registration:', formData);
    
    console.log('Sending to API: ../api/register_event.php');
    console.log('FormData:', JSON.stringify(formData));
    
    fetch('../api/register_event.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(res => {
        console.log('API Response Status:', res.status);
        console.log('Response headers:', res.headers);
        
        // Read response as text first
        return res.text().then(text => {
            console.log('Raw response text:', text);
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('JSON Parse Error:', e);
                console.error('Response was:', text);
                throw new Error('Invalid JSON response: ' + text.substring(0, 100));
            }
        });
    })
    .then(data => {
        console.log('Parsed Response:', data);
        if (data.success) {
            console.log('Registration successful!');
            // Store email for future duplicate check
            localStorage.setItem('lastRegisteredEmail', email);
            
            // Capture ALL form details BEFORE replacing the form
            const firstName = form.querySelector('[name="firstName"]').value;
            const middleName = form.querySelector('[name="middleName"]').value;
            const lastName = form.querySelector('[name="lastName"]').value;
            const company = form.querySelector('[name="company"]').value;
            const jobTitle = form.querySelector('[name="jobTitle"]').value;
            const phone = form.querySelector('[name="phone"]').value;
            const userEmail = form.querySelector('[name="email"]').value;
            
            // Get participant name and event details
            const participantName = lastName + ', ' + firstName + (middleName ? ' ' + middleName : '');
            const eventName = document.getElementById('eventModalTitle').textContent;
            const eventMetaText = document.getElementById('eventModalMeta').textContent; // Full text: Date · Time · Location
            
            // Extract event location from the meta text (everything after the last ·)
            const metaParts = eventMetaText.split(' · ');
            const eventLocation = metaParts[metaParts.length - 1]; // Last part is the location
            
            // Generate QR code URL (encodes registration code)
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.registration_code)}`;
            
            // Show success message with new design
            form.innerHTML = `
                <div class="p-4 text-center w-full" style="
    padding-top: 0px;
">
                    <h3 class="text-xl font-semibold mt-2 text-green-600">Registration Complete</h3>
                    <p class="text-sm text-slate-500 mt-1">A confirmation email with your registration details and QR code has been sent to your email, <strong>${userEmail}</strong>. Please bring the QR code on the day of the event for verification.</p>
                    <div id="qrCode" class="mt-6 flex justify-center py-6 rounded-lg"; margin-top: 0px;">
                    </div>
                    <h4 id="qrParticipant" class="text-lg font-semibold mt-4" style="
    margin-top: 0px;
">${participantName}</h4>
                    <p id="qrEvent" class="text-slate-600 text-sm">${eventName}</p>
                    <p class="text-sm text-slate-500 mt-4" style="
    margin-bottom: 10px;
    margin-top: 0px;
">You can also download your QR code below and present it during the event.</p>
                    <button id="downloadQrBtn" type="button" class="mt-8 px-6 py-3 rounded-xl text-white font-semibold transition" style="background-color: #559CDA; display: block; margin: 0 auto;" onmouseover="this.style.backgroundColor='#4685bf'" onmouseout="this.style.backgroundColor='#559CDA'">Download QR</button>
                    <div class="mt-4">
                        <button type="button" class="text-sm text-red-600" onclick="closeQrModal()">Close</button>
                    </div>
                </div>
            `;
            
            // Hide the Register title when showing success
            const registerTitleSection = document.getElementById('registerTitleSection');
            if (registerTitleSection) {
                registerTitleSection.style.display = 'none';
            }
            form.onsubmit = null;
            
            // Hide the event image and info panel
            document.getElementById('eventModalImage').style.display = 'none';
            document.getElementById('eventModalInfoPanel').style.display = 'none';
            document.getElementById('eventModalBody').classList.add('md:grid-cols-1');
            document.getElementById('eventModalBody').classList.remove('overflow-y-auto');
            document.getElementById('eventModalRegisterPanel').classList.remove('hidden');
            
            // Add download QR functionality
            setTimeout(() => {
                // Generate QR code locally using qrcode.js library
                const qrContainer = document.getElementById('qrCode');
                if (qrContainer) {
                    // Clear any existing QR
                    qrContainer.innerHTML = '';
                    
                    // Generate QR code with registration code
                    new QRCode(qrContainer, {
                        text: data.registration_code,
                        width: 220,
                        height: 220,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.H
                    });
                }
                
                const downloadBtn = document.getElementById('downloadQrBtn');
                if (downloadBtn) {
                    downloadBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        // Get the canvas from the QR container
                        const canvas = qrContainer.querySelector('canvas');
                        if (canvas) {
                            // Download QR certificate with all details
                            const metaParts = document.getElementById('eventModalMeta').textContent.split(' · ');
                            const dateOnly = metaParts[0]; // "DATE"
                            const timeOnly = metaParts[1].split(' to ')[0]; // Get only start time, remove "to END_TIME"
                            
                            downloadQrCertificate({
                                participantName: participantName,
                                firstName: firstName,
                                lastName: lastName,
                                email: userEmail,
                                company: company,
                                jobTitle: jobTitle,
                                phone: phone,
                                eventName: eventName,
                                eventDateTime: `${dateOnly} · ${timeOnly}`,
                                eventLocation: metaParts[2],
                                registrationCode: data.registration_code,
                                qrCanvas: canvas
                            });
                        } else {
                            alert('QR code not found. Please refresh and try again.');
                        }
                    });
                }
            }, 100);
        } else {
            console.error('Registration failed:', data.message);
            alert('Error: ' + data.message);
            // Re-enable button (safely)
            if (submitBtn && originalText) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    })
    .catch(error => {
        console.error('Fetch/Processing Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        alert('Error: ' + error.message);
        // Re-enable button (safely)
        if (submitBtn && originalText) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Gallery Viewer Functions
let currentGalleryIndex = 0;
let currentGalleryImages = [];
let allCatalogueEvents = [];
let currentCatalogueEventIndex = -1;

async function openGalleryViewer(catalogueId, eventName, eventIndex = -1) {
    try {
        // Stop carousel auto-play when gallery opens
        clearInterval(catalogueAutoPlayInterval);
        
        // Set the index directly if provided, otherwise try to find it
        if (eventIndex >= 0) {
            currentCatalogueEventIndex = eventIndex;
        } else {
            currentCatalogueEventIndex = allCatalogueEvents.findIndex(e => (e.id || e.catalogue_id) === catalogueId);
        }
        
        // Fetch gallery images for this catalogue event
        const response = await fetch(`../api/catalogue.php?action=get_gallery&catalogue_id=${catalogueId}`);
        const data = await response.json();
        
        // Get the cover image from the event
        const currentEvent = allCatalogueEvents[currentCatalogueEventIndex];
        const coverImage = {
            image_url: currentEvent.image_url,
            is_cover: true
        };
        
        // Start with cover image, then add gallery images if they exist
        let galleryImages = [coverImage];
        
        if (data.success && data.data && data.data.length > 0) {
            galleryImages = [coverImage, ...data.data];
        }
        
        // Only show if there's no cover image
        if (!currentEvent.image_url) {
            return;
        }
        
        // Proceed with showing the gallery (with cover image at minimum)
        currentGalleryImages = galleryImages;
        currentGalleryIndex = 0;
        
        // Update modal header
        document.getElementById('galleryEventName').textContent = eventName;
        
        // Display main image
        const mainImage = document.getElementById('galleryMainImage');
        const imageUrl = currentGalleryImages[0].is_cover 
            ? `../uploads/events/${currentGalleryImages[0].image_url}`
            : `../uploads/events_img/${currentGalleryImages[0].image_url}`;
        mainImage.style.backgroundImage = `url('${imageUrl}')`;
        
        // Update counter
        updateGalleryCounter();
        
        // Populate thumbnails
        populateGalleryThumbnails();
        
        // Populate event details
        populateGalleryEventDetails();
        
        // Show modal
        document.getElementById('galleryViewerModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error loading gallery:', error);
        alert('Error loading gallery images');
    }
}

function closeGalleryViewer() {
    document.getElementById('galleryViewerModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    currentGalleryImages = [];
    currentGalleryIndex = 0;
}


function galleryNext() {
    if (currentGalleryImages.length === 0) return;
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
    updateGalleryDisplay();
}

function galleryPrev() {
    if (currentGalleryImages.length === 0) return;
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    updateGalleryDisplay();
}

function updateGalleryDisplay() {
    const mainImage = document.getElementById('galleryMainImage');
    const currentImage = currentGalleryImages[currentGalleryIndex];
    const imageUrl = currentImage.is_cover 
        ? `../uploads/events/${currentImage.image_url}`
        : `../uploads/events_img/${currentImage.image_url}`;
    mainImage.style.backgroundImage = `url('${imageUrl}')`;
    updateGalleryCounter();
    updateThumbnailSelection();
}

function updateGalleryCounter() {
    const counter = document.getElementById('galleryCounter');
    counter.textContent = `${currentGalleryIndex + 1} of ${currentGalleryImages.length}`;
}

function populateGalleryThumbnails() {
    const thumbnailsContainer = document.getElementById('galleryThumbnails');
    thumbnailsContainer.innerHTML = currentGalleryImages.map((image, index) => {
        const imagePath = image.is_cover 
            ? `../uploads/events/${image.image_url}`
            : `../uploads/events_img/${image.image_url}`;
        return `
            <div class="w-full aspect-square bg-gray-200 rounded cursor-pointer overflow-hidden border-2 transition-all ${
                index === currentGalleryIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
            }" 
            style="background-image: url('${imagePath}'); background-size: cover; background-position: center;"
            onclick="selectGalleryImage(${index})"></div>
        `;
    }).join('');
}

function populateGalleryEventDetails() {
    const currentEvent = allCatalogueEvents[currentCatalogueEventIndex];
    if (!currentEvent) return;
    
    // Format and display event date (with time if available)
    const eventDate = formatDate(currentEvent.event_date);
    let dateDisplay = eventDate;
    
    // Only add time if start_time is available
    if (currentEvent.start_time && currentEvent.end_time) {
        const eventTime = `${formatTime(currentEvent.start_time)} to ${formatTime(currentEvent.end_time)}`;
        dateDisplay = `${eventDate} · ${eventTime}`;
    }
    document.getElementById('galleryEventDate').textContent = dateDisplay;
    
    // Display event location
    document.getElementById('galleryEventLocation').textContent = currentEvent.location || '-';
    
    // Display event description
    document.getElementById('galleryEventDescription').textContent = currentEvent.description || 'No description available';
}

function selectGalleryImage(index) {
    currentGalleryIndex = index;
    updateGalleryDisplay();
}

function updateThumbnailSelection() {
    const thumbnails = document.querySelectorAll('#galleryThumbnails > div');
    thumbnails.forEach((thumb, index) => {
        if (index === currentGalleryIndex) {
            thumb.classList.remove('border-transparent', 'hover:border-gray-300');
            thumb.classList.add('border-blue-500');
        } else {
            thumb.classList.add('border-transparent', 'hover:border-gray-300');
            thumb.classList.remove('border-blue-500');
        }
    });
}

async function galleryNextEvent() {
    // Find next event with gallery, looping to start if necessary
    let nextIndex = currentCatalogueEventIndex + 1;
    let searched = false;
    
    while (searched === false) {
        // If we've reached the end, loop back to the start
        if (nextIndex >= allCatalogueEvents.length) {
            nextIndex = 0;
            // If we've looped all the way through without finding anything, break
            if (nextIndex === currentCatalogueEventIndex) {
                alert('No events with galleries available');
                return;
            }
        }
        
        const event = allCatalogueEvents[nextIndex];
        const eventId = event.id || event.catalogue_id;
        const eventName = event.event_name;
        
        // Try to load gallery for this event
        try {
            const response = await fetch(`../api/catalogue.php?action=get_gallery&catalogue_id=${eventId}`);
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                // Found event with gallery - open it with correct index
                openGalleryViewer(eventId, eventName, nextIndex);
                return;
            }
        } catch (error) {
            console.error('Error checking gallery:', error);
        }
        nextIndex++;
        
        // Safety check: if we've searched through all events, stop
        if (nextIndex > allCatalogueEvents.length + currentCatalogueEventIndex) {
            searched = true;
        }
    }
    
    // No events with galleries found
    alert('No events with galleries available');
}

async function galleryPrevEvent() {
    // Find previous event with gallery, looping to end if necessary
    let prevIndex = currentCatalogueEventIndex - 1;
    let searched = false;
    
    while (searched === false) {
        // If we've gone before the start, loop back to the end
        if (prevIndex < 0) {
            prevIndex = allCatalogueEvents.length - 1;
            // If we've looped all the way through without finding anything, break
            if (prevIndex === currentCatalogueEventIndex) {
                alert('No events with galleries available');
                return;
            }
        }
        
        const event = allCatalogueEvents[prevIndex];
        const eventId = event.id || event.catalogue_id;
        const eventName = event.event_name;
        
        // Try to load gallery for this event
        try {
            const response = await fetch(`../api/catalogue.php?action=get_gallery&catalogue_id=${eventId}`);
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                // Found event with gallery - open it with correct index
                openGalleryViewer(eventId, eventName, prevIndex);
                return;
            }
        } catch (error) {
            console.error('Error checking gallery:', error);
        }
        prevIndex--;
        
        // Safety check: if we've searched through all events, stop
        if (prevIndex < currentCatalogueEventIndex - allCatalogueEvents.length) {
            searched = true;
        }
    }
    
    // No events with galleries found
    alert('No events with galleries available');
}

// Close gallery modal when clicking outside
document.addEventListener('click', function(e) {
    const galleryModal = document.getElementById('galleryViewerModal');
    if (e.target === galleryModal) {
        closeGalleryViewer();
    }
});

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('eventModal');
    if (e.target === modal) {
        closeModal('eventModal');
    }
});
    </script>

</body>
</html>