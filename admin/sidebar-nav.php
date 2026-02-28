<!-- Sidebar with Red Theme -->
<aside class="w-[260px] bg-white border-r border-slate-200 pr-5 pl-0 py-6 flex flex-col admin-sidebar">
  <div class="flex items-center gap-2 mb-10 pl-5">
    <img src="../intellismart.jpg" alt="IntelliSmart" style="height: 35px; width: auto;">
    <img src="../smart1.png" alt="Smart Events" style="margin-left: -10px; height: 35px; width: 180px;">
  </div>
  
  <div id="adminNav" class="flex flex-col gap-1"> 
    <a href="#" data-page="calendar" class="nav-item w-full text-left px-4 py-3 rounded-xl border-0 bg-transparent hover:bg-blue-50 transition-colors text-slate-700 text-sm font-medium" onclick="navigateTo(event, 'calendar')">Calendar</a>
    <a href="#" data-page="events" class="nav-item w-full text-left px-4 py-3 rounded-xl border-0 bg-transparent hover:bg-blue-50 transition-colors text-slate-700 text-sm font-medium" onclick="navigateTo(event, 'events')">Events</a>
    <a href="#" data-page="participants" class="nav-item w-full text-left px-4 py-3 rounded-xl border-0 bg-transparent hover:bg-blue-50 transition-colors text-slate-700 text-sm font-medium" onclick="navigateTo(event, 'participants')">Participants</a>
    <a href="#" data-page="reports" class="nav-item w-full text-left px-4 py-3 rounded-xl border-0 bg-transparent hover:bg-blue-50 transition-colors text-slate-700 text-sm font-medium" onclick="navigateTo(event, 'reports')">Reports</a>
    <a href="#" data-page="catalogue" class="nav-item w-full text-left px-4 py-3 rounded-xl border-0 bg-transparent hover:bg-blue-50 transition-colors text-slate-700 text-sm font-medium" onclick="navigateTo(event, 'catalogue')">Catalogue</a>
    <a href="#" data-page="qr-scanner" class="nav-item w-full text-left px-4 py-3 rounded-xl border-0 bg-transparent hover:bg-blue-50 transition-colors text-slate-700 text-sm font-medium" onclick="navigateTo(event, 'qr-scanner')">QR Scanner</a>
    <a href="#" data-page="users" class="nav-item w-full text-left px-4 py-3 rounded-xl border-0 bg-transparent hover:bg-blue-50 transition-colors text-slate-700 text-sm font-medium" onclick="navigateTo(event, 'users')">Users</a>
    <a href="#" data-page="logs" class="nav-item w-full text-left px-4 py-3 rounded-xl border-0 bg-transparent hover:bg-blue-50 transition-colors text-slate-700 text-sm font-medium" onclick="navigateTo(event, 'logs')">Activity Logs</a>
</div>
  
  <div id="adminIdentityArea" class="mt-auto pt-5 px-5 border-t border-slate-200">
    <div id="adminSessionCard" class="text-xs text-slate-600 space-y-2 text-center">
      <p id="userNameDisplay" class="session-name font-semibold text-slate-900">Admin User</p>
      <p id="userEmail" class="session-meta text-slate-600">admin@smartevents.com</p>
      <p id="userAccountType" class="session-meta text-blue-600 font-semibold">Admin</p>
    </div>

    <button onclick="logout(event)" class="mt-3 w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">Sign out</button>
  </div>
</aside>

<script>
  // IMMEDIATELY update profile from localStorage - no delays, no retries
  console.log('[SIDEBAR-QUICK] Reading localStorage for profile...');
  try {
    var adminStr = localStorage.getItem('admin');
    var userStr = localStorage.getItem('user');
    console.log('[SIDEBAR-QUICK] admin data length:', adminStr ? adminStr.length : 0);
    console.log('[SIDEBAR-QUICK] user data length:', userStr ? userStr.length : 0);
    
    var profile = null;
    if (adminStr) {
      profile = JSON.parse(adminStr);
      console.log('[SIDEBAR-QUICK] Parsed admin profile:', profile);
    } else if (userStr) {
      profile = JSON.parse(userStr);
      console.log('[SIDEBAR-QUICK] Parsed user profile:', profile);
    }
    
    if (profile && profile.full_name) {
      document.getElementById('userNameDisplay').textContent = profile.full_name;
      document.getElementById('userEmail').textContent = profile.email || 'user@smartevents.com';
      console.log('[SIDEBAR-QUICK] SUCCESS: Updated profile to', profile.full_name);
    } else {
      console.log('[SIDEBAR-QUICK] No profile name found in data');
    }
  } catch (e) {
    console.error('[SIDEBAR-QUICK] Error:', e);
  }

  // Logout function
  function logout(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (typeof confirmLogout !== 'undefined') {
      const logoutModal = document.getElementById('logoutConfirmModal');
      if (logoutModal) {
        logoutModal.style.display = 'block';
      } else {
        confirmLogout();
      }
    } else {
      clearLocalStorageAndRedirect();
    }
  }
  
  function clearLocalStorageAndRedirect() {
    localStorage.removeItem('admin');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminLastPage');
    window.location.href = '../login.html';
  }

  function navigateTo(event, page) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Save page to localStorage
    localStorage.setItem('adminLastPage', page);
    
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('index.html') || currentPath === '/Smart-Events/admin/' || currentPath === '/Smart-Events/admin/index.html') {
      // If navigateToPage exists (admin.js loaded), use it. Otherwise use DashboardManager.
      if (typeof navigateToPage === 'function') {
        navigateToPage(page);
      } else if (typeof DashboardManager !== 'undefined') {
        DashboardManager.switchPage(page);
      } else {
        window.location.href = `index.html?page=${page}`;
      }
    } else {
      // If on different page, redirect to index.html with page param
      window.location.href = `index.html?page=${page}`;
    }
  }
</script>
