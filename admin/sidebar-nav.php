<!-- Admin Sidebar Navigation - Unified Across All Pages -->
<div class="sidebar">
  <!-- Logo Section -->
  <div class="p-6 border-b border-gray-200">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">SE</div>
      <div>
        <p class="text-xs uppercase tracking-widest font-semibold text-blue-600">Smart Events</p>
        <p class="text-sm font-semibold text-gray-900">Admin</p>
      </div>
    </div>
  </div>

  <!-- Navigation Menu -->
  <nav class="sidebar-menu p-4 space-y-2">
    <a href="#" data-page="calendar" class="nav-item" onclick="navigateTo(event, 'calendar')">
      <span class="font-medium text-sm">Calendar</span>
    </a>
    <a href="#" data-page="events" class="nav-item" onclick="navigateTo(event, 'events')">
      <span class="font-medium text-sm">Events</span>
    </a>
    <a href="#" data-page="participants" class="nav-item" onclick="navigateTo(event, 'participants')">
      <span class="font-medium text-sm">Participants</span>
    </a>
    <a href="#" data-page="reports" class="nav-item" onclick="navigateTo(event, 'reports')">
      <span class="font-medium text-sm">Reports</span>
    </a>
    <a href="#" data-page="catalogue" class="nav-item" onclick="navigateTo(event, 'catalogue')">
      <span class="font-medium text-sm">Catalogue</span>
    </a>
    <a href="#" data-page="qr-scanner" class="nav-item" onclick="navigateTo(event, 'qr-scanner')">
      <span class="font-medium text-sm">QR Scanner</span>
    </a>

    <div class="border-t border-gray-200 my-2"></div>

    <a href="#" data-page="users" class="nav-item" onclick="navigateTo(event, 'users')">
      <span class="font-medium text-sm">Users</span>
    </a>
    <a href="#" data-page="logs" class="nav-item" onclick="navigateTo(event, 'logs')">
      <span class="font-medium text-sm">Activity Logs</span>
    </a>
  </nav>

  <!-- Divider -->
  <div class="border-t border-gray-200 my-4"></div>

  <!-- Admin/Coordinator Profile Section - More Prominent -->
  <div class="px-4 py-4 bg-gray-50 rounded-lg mx-2 mb-4">
    <div class="flex items-center gap-3 mb-3">
      <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-base flex-shrink-0 overflow-hidden border-2 border-blue-500">
        <img id="userImageDisplay" src="" alt="User" style="width: 100%; height: 100%; object-fit: cover; display: none;">
        <div id="userInitialBg" class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span id="userInitial">A</span>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-900 truncate" id="userNameDisplay">Admin User</p>
        <p class="text-xs text-gray-600 truncate" id="userEmail">admin@smartevents.com</p>
      </div>
    </div>
  </div>

  <!-- Logout Button -->
  <div class="px-4 py-3">
    <button onclick="logout(event)" class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
      <span>Sign Out</span>
    </button>
  </div>
</div>

<script>
  // Logout function - checks for modal first, then clears localStorage and redirects
  function logout(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Check if logout function exists in admin.js (for index.html)
    if (typeof confirmLogout !== 'undefined') {
      // If logout modal exists, show it; otherwise call confirmLogout directly
      const logoutModal = document.getElementById('logoutConfirmModal');
      if (logoutModal) {
        logoutModal.style.display = 'block';
      } else {
        confirmLogout();
      }
    } else {
      // Fallback: directly clear localStorage and redirect (for event-details.html or standalone pages)
      clearLocalStorageAndRedirect();
    }
  }
  
  function clearLocalStorageAndRedirect() {
    // Clear all user data
    localStorage.removeItem('admin');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminLastPage');
    // Redirect to login
    window.location.href = '../login.html';
  }
  function navigateTo(event, page) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Get current page path
    const currentPath = window.location.pathname;
    
    // If on main dashboard, use DashboardManager
    if (currentPath.includes('index.html') || currentPath === '/Smart-Events/admin/' || currentPath === '/Smart-Events/admin/index.html') {
      if (typeof DashboardManager !== 'undefined') {
        DashboardManager.switchPage(page);
      } else {
        window.location.href = `index.html?page=${page}`;
      }
    } else {
      // If on other pages (like event-details), navigate to main dashboard
      window.location.href = `index.html?page=${page}`;
    }
  }

  // Load user profile info from localStorage (Admin or Coordinator)
  function loadUserProfileInfo() {
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Log what we found in localStorage
      console.log('=== Profile Loading Debug ===');
      console.log('localStorage["admin"]:', localStorage.getItem('admin'));
      console.log('localStorage["user"]:', localStorage.getItem('user'));
      console.log('Admin object parsed:', admin);
      console.log('User object parsed:', user);
      
      // Determine which user is logged in
      let userInfo = null;
      let userImage = null;
      
      // Check if admin is logged in (check multiple possible ID fields)
      if (admin && typeof admin === 'object' && Object.keys(admin).length > 0) {
        if (admin.id || admin.admin_id) {
          userInfo = admin;
          userImage = admin.admin_image;
          console.log('✓ Logged in as Admin - ID:', admin.id || admin.admin_id);
          console.log('  Full Name:', admin.full_name);
          console.log('  Email:', admin.email);
        }
      }
      
      // Fallback: check if coordinator/user is logged in
      if (!userInfo && user && typeof user === 'object' && Object.keys(user).length > 0) {
        if (user.id || user.user_id || user.coordinator_id) {
          userInfo = user;
          userImage = user.coordinator_image;
          console.log('✓ Logged in as Coordinator - ID:', user.id || user.coordinator_id);
          console.log('  Full Name:', user.full_name);
          console.log('  Email:', user.email);
        }
      }
      
      // If no user info found, use defaults
      if (!userInfo || !userInfo.full_name) {
        console.warn('⚠ No valid user found in localStorage - using defaults');
        userInfo = {
          full_name: 'Admin User',
          email: 'admin@smartevents.com'
        };
      }
      
      // Extract user info
      const userName = userInfo.full_name || userInfo.name || 'User';
      const userEmail = userInfo.email || 'user@smartevents.com';
      const initials = (userName.split(' ')[0] || 'A').charAt(0).toUpperCase();
      
      console.log('✓ Final Profile Data:');
      console.log('  Name:', userName);
      console.log('  Email:', userEmail);
      console.log('  Initials:', initials);
      console.log('  Has Image:', !!userImage);
      
      // Update DOM elements with error checking
      const nameEl = document.getElementById('userNameDisplay');
      const emailEl = document.getElementById('userEmail');
      const initialEl = document.getElementById('userInitial');
      const imgEl = document.getElementById('userImageDisplay');
      const initialBgEl = document.getElementById('userInitialBg');
      
      console.log('✓ DOM Elements Found:');
      console.log('  nameEl:', !!nameEl);
      console.log('  emailEl:', !!emailEl);
      console.log('  initialEl:', !!initialEl);
      console.log('  imgEl:', !!imgEl);
      console.log('  initialBgEl:', !!initialBgEl);
      
      if (nameEl) {
        nameEl.textContent = userName;
        nameEl.title = userName;
        console.log('✓ Updated name to:', userName);
      }
      if (emailEl) {
        emailEl.textContent = userEmail;
        emailEl.title = userEmail;
        console.log('✓ Updated email to:', userEmail);
      }
      if (initialEl) {
        initialEl.textContent = initials;
        console.log('✓ Updated initials to:', initials);
      }
      
      // Display image if available
      if (userImage && userImage.startsWith('data:')) {
        if (imgEl && initialBgEl) {
          imgEl.src = userImage;
          imgEl.style.display = 'block';
          initialBgEl.style.display = 'none';
          console.log('✓ Profile image displayed');
        }
      } else if (userImage) {
        console.log('⚠ Image exists but is not a data URI:', userImage.substring(0, 50));
      }
      
      console.log('=== Profile Loading Complete ===');
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      console.error('Stack:', error.stack);
    }
  }

  // Load user profile info when sidebar loads, with retry logic
  (function initializeProfile() {
    console.log('Initializing profile...');
    loadUserProfileInfo();
    
    // Also retry after a short delay in case localStorage isn't ready yet
    setTimeout(() => {
      console.log('Profile initialization retry...');
      loadUserProfileInfo();
    }, 500);
  })();
</script>
