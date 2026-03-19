<?php
/**
 * Email Configuration Management Page
 * Displays current email configuration and allows admins to change SMTP settings
 */

// This page uses client-side authentication via localStorage
// No PHP session required - authentication is handled via JavaScript and API headers
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Configuration - Smart Events</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 50;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal-content {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }

        .input-field {
            width: 100%;
            padding: 9px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 13px;
            font-family: inherit;
            transition: all 0.2s;
        }

        .input-field:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            outline: none;
        }

        .status-message {
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            display: none;
            margin-bottom: 16px;
        }

        .status-message.success {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            color: #065f46;
        }

        .status-message.error {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            color: #7f1d1d;
        }

        .status-message.pending {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            color: #92400e;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Authentication Check -->
    <script>
        // Check if user is logged in as admin
        const admin = JSON.parse(localStorage.getItem('admin') || '{}');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userInfo = (admin && admin.id) ? admin : user;
        const userRole = userInfo.role || userInfo.role_name || 'GUEST';
        
        // If not logged in or not admin, redirect to login
        if (!userInfo.id || (userRole !== 'admin' && userRole !== 'ADMIN')) {
            window.location.href = 'login.html';
        }
    </script>
    <div class="min-h-screen p-8">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">Email Configuration</h1>
                <p class="text-gray-600">Manage your SMTP settings for sending system emails</p>
            </div>

            <!-- Current Email Display Card -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mb-6">
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                        <svg class="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-900 mb-2">Current Email Configuration</h3>
                        <div class="bg-white rounded border border-blue-200 p-4 mb-4">
                            <div class="mb-3">
                                <p class="text-xs text-gray-600 uppercase font-semibold">From Email</p>
                                <p id="currentFromEmail" class="text-base font-mono text-blue-600">Loading...</p>
                            </div>
                            <div class="mb-3">
                                <p class="text-xs text-gray-600 uppercase font-semibold">SMTP Host</p>
                                <p id="currentSmtpHost" class="text-sm font-mono text-gray-700">Loading...</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-600 uppercase font-semibold">Service</p>
                                <p id="currentMailerType" class="text-sm font-mono text-gray-700">Loading...</p>
                            </div>
                        </div>
                        <button onclick="openChangeEmailModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            Change Email Configuration
                        </button>
                    </div>
                </div>
            </div>

            <!-- SMTP Details Card -->
            <div class="bg-white rounded-lg p-6 border border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">SMTP Details</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-gray-600 uppercase font-semibold mb-1">SMTP Port</p>
                        <p id="detailSmtpPort" class="text-base text-gray-900">Loading...</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-600 uppercase font-semibold mb-1">Encryption</p>
                        <p id="detailEncryption" class="text-base text-gray-900">Loading...</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-600 uppercase font-semibold mb-1">From Name</p>
                        <p id="detailFromName" class="text-base text-gray-900">Loading...</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-600 uppercase font-semibold mb-1">Status</p>
                        <p id="detailStatus" class="text-base text-gray-900">Loading...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Change Email Modal -->
    <div id="changeEmailModal" class="modal-overlay">
        <div class="modal-content">
            <!-- Header -->
            <div style="background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%); padding: 28px 24px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="color: white; font-size: 24px; font-weight: 700; margin: 0;">Change Email Configuration</h2>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 400;">Update your SMTP settings</p>
                </div>
                <button type="button" onclick="closeChangeEmailModal()" style="background: rgba(255,255,255,0.2); border: none; font-size: 24px; cursor: pointer; color: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3);'" onmouseout="this.style.background='rgba(255,255,255,0.2)';">×</button>
            </div>

            <!-- Form Content -->
            <div style="padding: 32px;">
                <!-- Status Message -->
                <div id="emailConfigStatus" class="status-message"></div>

                <!-- SMTP Service Selection -->
                <div class="mb-6">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">SMTP Service</label>
                    <select id="smtpServiceSelect" onchange="updateSmtpHostBasedOnService()" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; font-family: inherit; background: white; cursor: pointer; transition: all 0.2s;" onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)';" onblur="this.style.borderColor='#ddd'; this.style.boxShadow='none';">
                        <option value="">Select a service...</option>
                        <option value="gmail">Gmail</option>
                        <option value="outlook">Outlook/Office365</option>
                    </select>
                </div>

                <!-- SMTP Host (Auto-filled) -->
                <div class="mb-6">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">SMTP Host</label>
                    <input type="text" id="smtpHostInput" class="input-field" placeholder="smtp.gmail.com" readonly>
                </div>

                <!-- SMTP Username -->
                <div class="mb-6">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">SMTP Username (Email)</label>
                    <input type="email" id="smtpUsernameInput" class="input-field" placeholder="your-email@gmail.com">
                </div>

                <!-- App Password -->
                <div class="mb-6">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">App Password</label>
                    <input type="password" id="appPasswordInput" class="input-field" placeholder="Enter your app password">
                    <p style="font-size: 12px; color: #666; margin-top: 4px;">For Gmail: Use an App Password from your Google Account settings. For Outlook: Use your Office365 password or App Password.</p>
                </div>

                <!-- From Email -->
                <div class="mb-6">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">From Email Address</label>
                    <input type="email" id="fromEmailInput" class="input-field" placeholder="noreply@smartevents.com">
                </div>

                <!-- From Name -->
                <div class="mb-6">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">From Name</label>
                    <input type="text" id="fromNameInput" class="input-field" placeholder="Smart Events Team">
                </div>

                <!-- Buttons -->
                <div style="display: flex; gap: 8px; padding-top: 16px;">
                    <button onclick="saveEmailConfiguration()" style="flex: 1; padding: 10px 24px; background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">Save Configuration</button>
                    <button onclick="closeChangeEmailModal()" style="flex: 1; padding: 10px 24px; border: 1px solid #ddd; color: #374151; background: white; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#f9fafb';" onmouseout="this.style.backgroundColor='white';">Cancel</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // API base URL
        const API_BASE = '../api';

        // Get user headers for authentication
        function getUserHeaders() {
            const admin = JSON.parse(localStorage.getItem('admin') || '{}');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userInfo = (admin && admin.id) ? admin : user;
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (userInfo.role) {
                headers['X-User-Role'] = userInfo.role;
            } else if (userInfo.role_name) {
                headers['X-User-Role'] = userInfo.role_name;
            }
            
            if (userInfo.id) {
                headers['X-User-Id'] = userInfo.id;
            } else if (userInfo.user_id) {
                headers['X-User-Id'] = userInfo.user_id;
            }
            
            return headers;
        }

        // Show status message
        function showStatus(type, message) {
            const statusDiv = document.getElementById('emailConfigStatus');
            statusDiv.textContent = message;
            statusDiv.className = `status-message ${type}`;
            statusDiv.style.display = 'block';
            
            if (type === 'success') {
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 4000);
            }
        }

        // Load current email configuration
        async function loadCurrentConfiguration() {
            try {
                const response = await fetch(`${API_BASE}/email-configuration.php`, {
                    method: 'GET',
                    headers: getUserHeaders()
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success && result.data) {
                    const config = result.data;
                    
                    // Update display fields
                    document.getElementById('currentFromEmail').textContent = config.from_email || 'Not configured';
                    document.getElementById('currentSmtpHost').textContent = config.smtp_host || 'Not configured';
                    document.getElementById('currentMailerType').textContent = config.mailer_type || 'Not configured';
                    
                    // Update detail fields
                    document.getElementById('detailSmtpPort').textContent = config.smtp_port || 587;
                    document.getElementById('detailEncryption').textContent = config.encryption || 'TLS';
                    document.getElementById('detailFromName').textContent = config.from_name || 'Smart Events';
                    document.getElementById('detailStatus').textContent = config.is_active ? 'Active' : 'Inactive';
                    
                    // Pre-fill modal form
                    document.getElementById('smtpHostInput').value = config.smtp_host || '';
                    document.getElementById('smtpUsernameInput').value = config.smtp_username || '';
                    document.getElementById('fromEmailInput').value = config.from_email || '';
                    document.getElementById('fromNameInput').value = config.from_name || '';
                    
                    // Set service dropdown based on smtp_host
                    if (config.smtp_host === 'smtp.gmail.com') {
                        document.getElementById('smtpServiceSelect').value = 'gmail';
                    } else if (config.smtp_host === 'smtp.office365.com') {
                        document.getElementById('smtpServiceSelect').value = 'outlook';
                    }
                } else {
                    console.warn('No configuration data received:', result);
                }
            } catch (error) {
                console.error('Error loading configuration:', error);
                showStatus('error', 'Error loading configuration: ' + error.message);
            }
        }

        // Update SMTP host based on selected service
        function updateSmtpHostBasedOnService() {
            const service = document.getElementById('smtpServiceSelect').value;
            const hostInput = document.getElementById('smtpHostInput');
            
            if (service === 'gmail') {
                hostInput.value = 'smtp.gmail.com';
            } else if (service === 'outlook') {
                hostInput.value = 'smtp.office365.com';
            } else {
                hostInput.value = '';
            }
        }

        // Open change email modal
        function openChangeEmailModal() {
            document.getElementById('changeEmailModal').classList.add('active');
        }

        // Close change email modal
        function closeChangeEmailModal() {
            document.getElementById('changeEmailModal').classList.remove('active');
            document.getElementById('emailConfigStatus').style.display = 'none';
        }

        // Save email configuration
        async function saveEmailConfiguration() {
            try {
                const service = document.getElementById('smtpServiceSelect').value;
                const appPassword = document.getElementById('appPasswordInput').value.trim();
                const fromEmail = document.getElementById('fromEmailInput').value.trim();
                const fromName = document.getElementById('fromNameInput').value.trim();
                const smtpUsername = document.getElementById('smtpUsernameInput').value.trim();
                const smtpHost = document.getElementById('smtpHostInput').value.trim();

                // Validation
                if (!service) {
                    showStatus('error', 'Please select an SMTP service');
                    return;
                }
                if (!smtpUsername) {
                    showStatus('error', 'Please enter SMTP username');
                    return;
                }
                if (!appPassword) {
                    showStatus('error', 'Please enter app password');
                    return;
                }
                if (!fromEmail) {
                    showStatus('error', 'Please enter from email address');
                    return;
                }
                if (!fromName) {
                    showStatus('error', 'Please enter from name');
                    return;
                }

                showStatus('pending', 'Saving configuration...');

                const configData = {
                    mailer_type: service,
                    smtp_host: smtpHost,
                    smtp_port: 587,
                    smtp_username: smtpUsername,
                    smtp_password: appPassword,
                    from_email: fromEmail,
                    from_name: fromName,
                    encryption: 'tls',
                    is_active: 1
                };

                const response = await fetch(`${API_BASE}/email-configuration.php`, {
                    method: 'POST',
                    headers: getUserHeaders(),
                    body: JSON.stringify(configData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }

                const result = await response.json();

                if (result.success) {
                    showStatus('success', 'Email configuration saved successfully!');
                    setTimeout(() => {
                        closeChangeEmailModal();
                        loadCurrentConfiguration();
                    }, 2000);
                } else {
                    showStatus('error', result.message || 'Failed to save configuration');
                }
            } catch (error) {
                console.error('Error saving configuration:', error);
                showStatus('error', 'Error: ' + error.message);
            }
        }

        // Load configuration on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadCurrentConfiguration();
        });

        // Close modal when clicking outside
        document.getElementById('changeEmailModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeChangeEmailModal();
            }
        });
    </script>
</body>
</html>
