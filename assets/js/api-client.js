/**
 * Smart Events - API Client
 * Centralized API communication module
 */

class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.timeout = 30000;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Core request method
   */
  async request(endpoint, method = 'GET', data = null, options = {}) {
    const url = this.baseURL + endpoint;
    const config = {
      method,
      headers: { ...this.headers, ...options.headers },
      signal: AbortSignal.timeout(this.timeout)
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw {
          status: response.status,
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw {
        message: error.message || 'Network request failed',
        status: error.status || 0,
        original: error
      };
    }
  }

  /**
   * ==================== AUTH ENDPOINTS ====================
   */

  /**
   * Admin login
   */
  async adminLogin(email, password) {
    return this.request('/admin_login.php', 'POST', {
      email,
      password
    });
  }

  /**
   * Logout
   */
  async logout() {
    return this.request('/logout.php', 'POST');
  }

  /**
   * Verify session
   */
  async verifySession() {
    return this.request('/verify_session.php', 'GET');
  }

  /**
   * ==================== EVENTS ENDPOINTS ====================
   */

  /**
   * Get all events
   */
  async getEvents(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/events.php?${params.toString()}`, 'GET');
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId) {
    return this.request(`/events.php?id=${eventId}`, 'GET');
  }

  /**
   * Create event
   */
  async createEvent(eventData) {
    return this.request('/events.php', 'POST', eventData);
  }

  /**
   * Update event
   */
  async updateEvent(eventId, eventData) {
    return this.request(`/events.php?id=${eventId}`, 'PUT', eventData);
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId) {
    return this.request(`/events.php?id=${eventId}`, 'DELETE');
  }

  /**
   * ==================== PARTICIPANTS/REGISTRATIONS ====================
   */

  /**
   * Get participants for event
   */
  async getParticipants(eventId, filters = {}) {
    const params = new URLSearchParams({ eventId, ...filters });
    return this.request(`/participants.php?${params.toString()}`, 'GET');
  }

  /**
   * Register participant
   */
  async registerParticipant(registrationData) {
    return this.request('/participants.php', 'POST', registrationData);
  }

  /**
   * Update participant registration
   */
  async updateParticipant(participantId, data) {
    return this.request(`/participants.php?id=${participantId}`, 'PUT', data);
  }

  /**
   * Delete participant
   */
  async deleteParticipant(participantId) {
    return this.request(`/participants.php?id=${participantId}`, 'DELETE');
  }

  /**
   * ==================== COORDINATORS ====================
   */

  /**
   * Get all coordinators
   */
  async getCoordinators(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/coordinators.php?${params.toString()}`, 'GET');
  }

  /**
   * Get coordinator by ID
   */
  async getCoordinator(coordinatorId) {
    return this.request(`/coordinators.php?id=${coordinatorId}`, 'GET');
  }

  /**
   * Create coordinator
   */
  async createCoordinator(coordinatorData) {
    return this.request('/coordinators.php', 'POST', coordinatorData);
  }

  /**
   * Update coordinator
   */
  async updateCoordinator(coordinatorId, data) {
    return this.request(`/coordinators.php?id=${coordinatorId}`, 'PUT', data);
  }

  /**
   * Delete coordinator
   */
  async deleteCoordinator(coordinatorId) {
    return this.request(`/coordinators.php?id=${coordinatorId}`, 'DELETE');
  }

  /**
   * ==================== ADMINS ====================
   */

  /**
   * Get all admins
   */
  async getAdmins() {
    return this.request('/admins.php', 'GET');
  }

  /**
   * Get admin details
   */
  async getAdmin(adminId) {
    return this.request(`/admins.php?id=${adminId}`, 'GET');
  }

  /**
   * Create admin
   */
  async createAdmin(adminData) {
    return this.request('/admins.php', 'POST', adminData);
  }

  /**
   * Update admin
   */
  async updateAdmin(adminId, data) {
    return this.request(`/admins.php?id=${adminId}`, 'PUT', data);
  }

  /**
   * Delete admin
   */
  async deleteAdmin(adminId) {
    return this.request(`/admins.php?id=${adminId}`, 'DELETE');
  }

  /**
   * ==================== ATTENDANCE/CHECK-IN ====================
   */

  /**
   * Check in participant
   */
  async checkInParticipant(participantId) {
    return this.request('/attendance.php', 'POST', { participantId });
  }

  /**
   * Get attendance records
   */
  async getAttendanceRecords(eventId) {
    return this.request(`/attendance.php?eventId=${eventId}`, 'GET');
  }

  /**
   * ==================== TASKS ====================
   */

  /**
   * Get tasks
   */
  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/tasks.php?${params.toString()}`, 'GET');
  }

  /**
   * Create task
   */
  async createTask(taskData) {
    return this.request('/tasks.php', 'POST', taskData);
  }

  /**
   * Update task
   */
  async updateTask(taskId, data) {
    return this.request(`/tasks.php?id=${taskId}`, 'PUT', data);
  }

  /**
   * Delete task
   */
  async deleteTask(taskId) {
    return this.request(`/tasks.php?id=${taskId}`, 'DELETE');
  }

  /**
   * ==================== REPORTS ====================
   */

  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    return this.request('/reports.php?action=dashboard', 'GET');
  }

  /**
   * Get event report
   */
  async getEventReport(eventId) {
    return this.request(`/reports.php?action=event&eventId=${eventId}`, 'GET');
  }

  /**
   * Get attendance report
   */
  async getAttendanceReport(filters = {}) {
    const params = new URLSearchParams({ action: 'attendance', ...filters });
    return this.request(`/reports.php?${params.toString()}`, 'GET');
  }

  /**
   * Export report
   */
  async exportReport(reportType, format = 'csv') {
    return this.request(`/export.php?type=${reportType}&format=${format}`, 'GET');
  }

  /**
   * ==================== FILE UPLOAD ====================
   */

  /**
   * Upload file
   */
  async uploadFile(file, uploadType = 'event-image') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);

    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            reject(response);
          }
        } catch (e) {
          reject({ message: 'Invalid response' });
        }
      });

      xhr.addEventListener('error', () => {
        reject({ message: 'Upload failed' });
      });

      xhr.open('POST', this.baseURL + '/upload.php');
      xhr.send(formData);
    });
  }

  /**
   * ==================== CACHE ====================
   */

  /**
   * Clear cache
   */
  clearCache() {
    if (typeof caches !== 'undefined') {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }
}

/**
 * Global API client instance
 */
const api = new APIClient('/api');
