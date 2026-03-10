<?php?>
<section class="w-full bg-slate-50 mt-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Countdown Card -->
        <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-white/70">Next Event Countdown</p>
            <h3 id="eventName" class="text-lg font-semibold mt-1">Loading...</h3>
          </div>
          <div class="flex items-center gap-3 text-center font-mono">
            <div class="bg-blue-800/60 rounded-xl px-4 py-3 min-w-[80px] shadow-inner">
              <div id="days" class="text-2xl font-semibold">01</div>
              <div class="text-xs text-white/70">Days</div>
            </div>
            <div class="bg-blue-800/60 rounded-xl px-4 py-3 min-w-[80px] shadow-inner">
              <div id="hours" class="text-2xl font-semibold">12</div>
              <div class="text-xs text-white/70">Hours</div>
            </div>
            <div class="bg-blue-800/60 rounded-xl px-4 py-3 min-w-[80px] shadow-inner">
              <div id="minutes" class="text-2xl font-semibold">40</div>
              <div class="text-xs text-white/70">Minutes</div>
            </div>
            <div class="bg-blue-800/60 rounded-xl px-4 py-3 min-w-[80px] shadow-inner animate-pulse">
              <div id="seconds" class="text-2xl font-semibold">54</div>
              <div class="text-xs text-white/70">Seconds</div>
            </div>
          </div>
        </div>

    </div>
</section>

<script> 

    let targetDate = new Date('2026-04-05T00:00:00').getTime();
    let countdownExpired = false;
    let recursionCount = 0;
    const MAX_RECURSION = 5;

    // Fetch next event and update countdown
    async function loadNextEvent() {
        try {
            recursionCount++;
            if (recursionCount > MAX_RECURSION) {
                console.error('Max recursion reached for loadNextEvent');
                document.getElementById('eventName').textContent = 'No upcoming events available';
                recursionCount = 0;
                return;
            }

            console.log('Fetching next event... (attempt ' + recursionCount + ')');
            const response = await fetch('../api/get_next_event.php');
            console.log('API Response status:', response.status);
            
            const data = await response.json();
            console.log('API Response data:', data);
            
            if (data.success && data.event) {
                const event = data.event;
                
                // Create proper date object - handle both formats
                let eventDateTime;
                try {
                    // Try ISO format first
                    eventDateTime = new Date(event.event_date + 'T' + event.start_time).getTime();
                } catch (e) {
                    // Fallback parsing
                    const dateTime = event.event_date + ' ' + event.start_time;
                    eventDateTime = new Date(dateTime).getTime();
                }
                
                const now = new Date().getTime();
                
                console.log('Event data:', event);
                console.log('Event start time:', new Date(eventDateTime));
                console.log('Current time:', new Date(now));
                console.log('Time diff (ms):', eventDateTime - now);
                
                // Validate that event hasn't already started (must be in future)
                if (eventDateTime > now) {
                    document.getElementById('eventName').textContent = event.event_name;
                    targetDate = eventDateTime;
                    countdownExpired = false;
                    recursionCount = 0;
                    console.log('✓ Event loaded successfully, target date set');
                } else {
                    // Event has already started, recursively load next one
                    console.warn('⚠ Event has already started, loading next event...');
                    await loadNextEvent();
                }
            } else {
                recursionCount = 0;
                console.warn('No upcoming events found or API error:', data.message);
                document.getElementById('eventName').textContent = 'No upcoming events';
            }
        } catch (error) {
            recursionCount = 0;
            console.error('Error fetching event:', error);
            document.getElementById('eventName').textContent = 'Error loading event';
        }
    }

    // Countdown Timer
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        // If event has already passed start time, load next event immediately
        if (difference <= 0 && !countdownExpired) {
            countdownExpired = true;
            console.log('Current event has started/passed, loading next event...');
            loadNextEvent();
        }

        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
            countdownExpired = false;
        } else {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }

    // Initialize countdown on page load
    document.addEventListener('DOMContentLoaded', async function() {
        await loadNextEvent();
        updateCountdown();
        setInterval(updateCountdown, 1000);
    });
</script>