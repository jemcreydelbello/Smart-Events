<style>
  .nav-item:hover,
  .nav-item.active {
    background: linear-gradient(
      90deg,
      #559CDA 0%,
      #7BADFF 27%,
      #FFB58D 76%,
      #ED8028 100%
    ) !important;
    color: white !important;
  }

  .sign-out-btn {
    background-color: #1E73BB !important;
    color: white !important;
    border: none !important;
  }

  .sign-out-btn:hover {
    background-color: #1560a3 !important;
    opacity: 1;
  }

  .nav-item svg {
    display: inline-block;
    width: 20px;
    height: 20px;
    margin-right: 10px;
    vertical-align: middle;
  }

  .settings-nav-btn {
    background-color: #f8fafc;
    border-color: #cbd5e1;
  }

  .settings-nav-btn:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
  }

  .settings-nav-btn.active {
    background: linear-gradient(
      90deg,
      #559CDA 0%,
      #7BADFF 27%,
      #FFB58D 76%,
      #ED8028 100%
    ) !important;
    color: white !important;
    border-color: transparent !important;
  }

  .settings-nav-btn.active svg {
    fill: white;
    color: white;
  }
</style>

<!-- Sidebar with Red Theme -->
<aside class="w-[260px] bg-white border-r border-slate-200 pr-5 pl-0 py-6 flex flex-col admin-sidebar">
  <div class="flex items-center gap-2 mb-6 pl-5">
    <img src="../intellismart.jpg" alt="IntelliSmart" style="height: 35px; width: auto;">
    <img src="../assets/smart1.png" alt="Smart Events" style="margin-left: -10px; height: 35px; width: 180px;">
  </div>
  
  <div style="margin-top: 40px; margin-left: 5px;" id="adminNav" class="flex flex-col gap-8"> 
    <a href="#" data-page="calendar" style="margin-bottom: 5px;" class="nav-item w-full text-left px-6 py-2 rounded-lg border-0 bg-transparent transition-colors text-sm font-medium flex items-center" onclick="navigateTo(event, 'calendar')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12h5v5h-5zm7-9h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m0 2v2H5V5zM5 19V9h14v10z"/></svg> Calendar</a>
    <a href="#" data-page="events" style="margin-bottom: 5px;" class="nav-item w-full text-left px-6 py-2 rounded-lg border-0 bg-transparent transition-colors text-sm font-medium flex items-center" onclick="navigateTo(event, 'events')"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="currentColor" d="M28 6a2 2 0 0 0-2-2h-4V2h-2v2h-8V2h-2v2H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h4v-2H6V6h4v2h2V6h8v2h2V6h4v6h2Z"/><path fill="currentColor" d="m21 15l2.549 4.938l5.451.791l-4 3.844L26 30l-5-2.562L16 30l1-5.427l-4-3.844l5.6-.791z"/></svg> Events</a>
   <!-- <a href="#" data-page="participants" style="margin-bottom: 5px;" class="nav-item w-full text-left px-6 py-2 rounded-lg border-0 bg-transparent transition-colors text-slate-700 text-sm font-medium flex items-center" onclick="navigateTo(event, 'participants')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1920 1792" style="width: 20px; height: 20px;"><path fill="currentColor" d="M593 896q-162 5-265 128H194q-82 0-138-40.5T0 865q0-353 124-353q6 0 43.5 21t97.5 42.5T384 597q67 0 133-23q-5 37-5 66q0 139 81 256m1071 637q0 120-73 189.5t-194 69.5H523q-121 0-194-69.5T256 1533q0-53 3.5-103.5t14-109T300 1212t43-97.5t62-81t85.5-53.5T602 960q10 0 43 21.5t73 48t107 48t135 21.5t135-21.5t107-48t73-48t43-21.5q61 0 111.5 20t85.5 53.5t62 81t43 97.5t26.5 108.5t14 109t3.5 103.5M640 256q0 106-75 181t-181 75t-181-75t-75-181t75-181T384 0t181 75t75 181m704 384q0 159-112.5 271.5T960 1024T688.5 911.5T576 640t112.5-271.5T960 256t271.5 112.5T1344 640m576 225q0 78-56 118.5t-138 40.5h-134q-103-123-265-128q81-117 81-256q0-29-5-66q66 23 133 23q59 0 119-21.5t97.5-42.5t43.5-21q124 0 124 353m-128-609q0 106-75 181t-181 75t-181-75t-75-181t75-181t181-75t181 75t75 181"/></svg> Participants</a> -->
    <!-- <a href="#" data-page="reports" style="margin-bottom: 5px;" class="nav-item w-full text-left px-6 py-2 rounded-lg border-0 bg-transparent transition-colors text-sm font-medium flex items-center" onclick="navigateTo(event, 'reports')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M9 21h6m-6 0v-5m0 5H3.6a.6.6 0 0 1-.6-.6v-3.8a.6.6 0 0 1 .6-.6H9m6 5V9m0 12h5.4a.6.6 0 0 0 .6-.6V3.6a.6.6 0 0 0-.6-.6h-4.8a.6.6 0 0 0-.6.6V9m0 0H9.6a.6.6 0 0 0-.6.6V16"/></svg> Reports</a> -->
    <a href="#" data-page="catalogue" style="margin-bottom: 5px;" class="nav-item w-full text-left px-6 py-2 rounded-lg border-0 bg-transparent transition-colors text-sm font-medium flex items-center" onclick="navigateTo(event, 'catalogue')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M14.5 17.5v-10h-7c-2.357 0-3.535 0-4.268.732S2.5 10.142 2.5 12.5v4c0 2.357 0 3.535.732 4.268s1.911.732 4.268.732h3c1.886 0 2.828 0 3.414-.586s.586-1.528.586-3.414"/><path d="M14.5 16.5h2c2.357 0 3.535 0 4.268-.732s.732-1.911.732-4.268v-4c0-2.357 0-3.536-.732-4.268C20.035 2.5 18.857 2.5 16.5 2.5h-7v5m-4 5H9m-3.5 4h6m-2-14l5 5"/></g></svg> Catalogue</a>
    <a href="#" data-page="qr-scanner" style="margin-bottom: 5px;" class="nav-item w-full text-left px-6 py-2 rounded-lg border-0 bg-transparent transition-colors text-sm font-medium flex items-center" onclick="navigateTo(event, 'qr-scanner')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 10H6V6h4zm8 0h-4V6h4zm-8 8H6v-4h4zM2 9V2h7M2 15v7h7m6-20h7v7m-7 13h7v-7"/><path d="M19.25 18H14v-5m3.996 1.254v-.504h.504v.504z"/></g></svg> QR Scanner</a>
    <a href="#" data-page="users" style="margin-bottom: 5px;" class="nav-item w-full text-left px-6 py-2 rounded-lg border-0 bg-transparent transition-colors text-sm font-medium flex items-center" onclick="navigateTo(event, 'users')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M8.5 4.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m2.4 7.506c.11.542-.348.994-.9.994H2c-.553 0-1.01-.452-.902-.994a5.002 5.002 0 0 1 9.803 0M14.002 12h-1.59a3 3 0 0 0-.04-.29a6.5 6.5 0 0 0-1.167-2.603a3 3 0 0 1 3.633 1.911c.18.522-.283.982-.836.982M12 8a2 2 0 1 0 0-4a2 2 0 0 0 0 4"/></svg> Users</a>
</div>
</div>
  
  <div id="adminIdentityArea" class="mt-auto pt-4 px-4 border-t border-slate-200 space-y-3">
    <!-- User Profile Card -->
    <div id="adminSessionCard" class="bg-white rounded-lg p-4 space-y-3 text-center border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white mx-auto text-lg font-bold shadow-md" style="border: 3px solid white; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2); background-size: cover; background-position: center; overflow: hidden;" id="userProfileAvatar">
        <span id="userInitials">AD</span>
      </div>
      <div style="padding-top: 2px;">
        <p id="userNameDisplay" class="font-semibold text-slate-900 text-sm">Admin User</p>
        <p id="userEmail" class="text-slate-500 text-xs truncate mt-1">admin@smartevents.com</p>
      </div>
      <div style="padding-top: 4px; border-top: 1px solid #e2e8f0;">
        <p id="userAccountType" class="text-blue-600 font-semibold text-xs uppercase tracking-wider">Admin</p>
      </div>
    </div>

    <!-- Settings Button -->
    <button onclick="navigateTo(event, 'settings')" data-page="settings" class="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group settings-nav-btn" id="settingsNavBtn">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="m10.135 21l-.362-2.892q-.479-.145-1.035-.454q-.557-.31-.947-.664l-2.668 1.135l-1.865-3.25l2.306-1.739q-.045-.27-.073-.558q-.03-.288-.03-.559q0-.252.03-.53q.028-.278.073-.626L3.258 9.126l1.865-3.212L7.771 7.03q.448-.373.97-.673q.52-.3 1.013-.464L10.134 3h3.732l.361 2.912q.575.202 1.016.463t.909.654l2.725-1.115l1.865 3.211l-2.382 1.796q.082.31.092.569t.01.51q0 .233-.02.491q-.019.259-.088.626l2.344 1.758l-1.865 3.25l-2.681-1.154q-.467.393-.94.673t-.985.445L13.866 21zM11 20h1.956l.369-2.708q.756-.2 1.36-.549q.606-.349 1.232-.956l2.495 1.063l.994-1.7l-2.189-1.644q.125-.427.166-.786q.04-.358.04-.72q0-.38-.04-.72t-.166-.747l2.227-1.683l-.994-1.7l-2.552 1.07q-.454-.499-1.193-.935q-.74-.435-1.4-.577L13 4h-1.994l-.312 2.689q-.756.161-1.39.52q-.633.358-1.26.985L5.55 7.15l-.994 1.7l2.169 1.62q-.125.336-.175.73t-.05.82q0 .38.05.755t.156.73l-2.15 1.645l.994 1.7l2.475-1.05q.589.594 1.222.953q.634.359 1.428.559zm.973-5.5q1.046 0 1.773-.727T14.473 12t-.727-1.773t-1.773-.727q-1.052 0-1.776.727T9.473 12t.724 1.773t1.776.727M12 12"/></svg>
      Settings
    </button>

    <!-- Sign Out Button -->
    <button onclick="logout(event)" class="w-full px-4 py-2 rounded-lg sign-out-btn text-white text-sm font-medium transition-all hover:opacity-90">Sign out</button>
  </div>
</aside>

<script>
  // Logout function - called when user clicks Sign out button
  function logout(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('[LOGOUT] Clearing data and redirecting...');
    localStorage.removeItem('admin');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminLastPage');
    
    // Small delay to ensure localStorage changes are processed
    setTimeout(function() {
      window.location.href = 'login.html';
    }, 100);
  }

  // Navigation function
  function navigateTo(event, page) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('index.html') || currentPath === '/Smart-Events/admin/' || currentPath === '/Smart-Events/admin/index.html') {
      if (typeof DashboardManager !== 'undefined') {
        DashboardManager.switchPage(page);
      } else {
        window.location.href = `index.html?page=${page}`;
      }
    } else {
      window.location.href = `index.html?page=${page}`;
    }
  }
</script>
