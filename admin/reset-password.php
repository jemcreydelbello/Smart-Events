<?php
include("../config/db.php");

// Force HTML content type (override any JSON headers from db.php)
header('Content-Type: text/html; charset=utf-8');

$token = isset($_GET['token']) ? $_GET['token'] : '';
$type = isset($_GET['type']) ? $_GET['type'] : 'admin';

if (empty($token)) {
    http_response_code(400);
    echo "<div style='text-align: center; margin-top: 50px;'><h2>Invalid Request</h2><p>Token is missing.</p></div>";
    exit;
}

$token_escaped = $conn->real_escape_string($token);

// Check in the appropriate table based on type
if ($type === 'coordinator') {
    $sql = "SELECT coordinator_id, reset_expire FROM coordinators WHERE reset_token='$token_escaped'";
} else {
    $sql = "SELECT admin_id, reset_expire FROM admins WHERE reset_token='$token_escaped'";
}

$result = $conn->query($sql);

if (!$result || $result->num_rows == 0) {
    http_response_code(400);
    echo "<div style='text-align: center; margin-top: 50px;'><h2>Invalid or Expired Link</h2><p>The password reset link is invalid or has expired. <a href='forget-password.php'>Try Again</a></p></div>";
    exit;
}

$row = $result->fetch_assoc();
$account_id = $type === 'coordinator' ? $row['coordinator_id'] : $row['admin_id'];
$reset_expire = $row['reset_expire'];

if ($reset_expire < date('Y-m-d H:i:s')) {
    http_response_code(400);
    echo "<div style='text-align: center; margin-top: 50px;'><h2>Invalid or Expired Link</h2><p>The password reset link is invalid or has expired. <a href='forget-password.php'>Try Again</a></p></div>";
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Event System</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f3f4f6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 0;
        }

        .password-wrapper {
            display: flex;
            width: 100%;
            height: 100vh;
            background: white;
            border-radius: 0;
            box-shadow: none;
            overflow: hidden;
        }

        .video-section {
            flex: 1;
            background: #000;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .video-section video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .video-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
        }

        .reset-password-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 60px;
            overflow-y: auto;
        }

        .reset-password-box {
            width: 100%;
            max-width: 500px;
        }

        .reset-password-box h2 {
            text-align: center;
            margin-bottom: 12px;
            color: #1F4CC4;
            font-size: 42px;
            font-weight: 700;
        }

        .reset-password-box p {
            text-align: center;
            color: #6b7280;
            margin-bottom: 40px;
            font-size: 18px;
            line-height: 1.6;
        }

        .form-group {
            margin-bottom: 28px;
        }

        .form-group label {
            display: block;
            margin-bottom: 12px;
            color: #374151;
            font-weight: 600;
            font-size: 16px;
        }

        .form-group input {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: white;
            font-family: 'Inter', sans-serif;
        }

        .form-group input:hover {
            border-color: #1F4CC4;
        }

        .form-group input:focus {
            outline: none;
            border-color: #1F4CC4;
            box-shadow: 0 0 0 3px rgba(31, 76, 196, 0.1);
        }

        .password-strength {
            margin-top: 8px;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .password-strength.weak { color: #dc3545; }
        .password-strength.medium { color: #ff9800; }
        .password-strength.strong { color: #4caf50; }

        .btn-update {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #1F4CC4 0%, #1538A0 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: none;
            letter-spacing: normal;
        }

        .btn-update:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(31, 76, 196, 0.3);
        }

        .btn-update:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }

        .password-requirements {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
            font-size: 13px;
            color: #1e40af;
            border-left: 4px solid #1F4CC4;
        }

        .password-requirements h4 {
            margin-bottom: 12px;
            color: #1F4CC4;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        .requirement {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
            transition: all 0.3s ease;
        }

        .requirement::before {
            content: '○';
            position: absolute;
            left: 0;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .requirement.met {
            color: #10b981;
        }

        .requirement.met::before {
            content: '✓';
            color: #10b981;
            font-size: 16px;
        }

        .requirement.unmet {
            color: #9ca3af;
        }

        #successNotification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
            font-size: 15px;
            font-weight: 600;
            z-index: 10000;
            display: none;
            align-items: center;
            gap: 12px;
            max-width: 500px;
            animation: slideDown 0.3s ease-out;
        }

        #successNotification.show {
            display: flex;
        }

        #successNotification::before {
            content: '✓';
            font-size: 20px;
            font-weight: bold;
            flex-shrink: 0;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }

        @media (max-width: 768px) {
            #successNotification {
                left: 15px;
                right: 15px;
                transform: none;
                max-width: none;
            }
        }

        @media (max-width: 768px) {
            .password-wrapper {
                flex-direction: column;
                height: auto;
            }

            .video-section {
                display: none;
            }

            .reset-password-container {
                padding: 30px 20px;
                min-height: 100vh;
            }

            .reset-password-box h2 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <!-- Success Notification -->
    <div id="successNotification"></div>

    <div class="password-wrapper">
        <!-- Video Section (Left) -->
        <div class="video-section">
            <video autoplay muted loop playsinline>
                <source src="../assets/background.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="video-overlay"></div>
        </div>

        <!-- Password Reset Section (Right) -->
        <div class="reset-password-container">
            <div class="reset-password-box">
                <h2>Reset Your Password</h2>
                <p>Enter a new password for your account.</p>
                
                <div class="form-group">
                    <label for="password">New Password</label>
                    <input type="password" id="password" placeholder="Enter new password" onkeyup="checkPasswordStrength()" required>
                    <div class="password-strength" id="strengthIndicator"></div>
                </div>

                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" placeholder="Confirm password" required>
                </div>
                <button class="btn-update" onclick="updatePass()" id="updateBtn">Update Password</button>

                <div class="password-requirements">
                    <h4>Password Requirements:</h4>
                    <div class="requirement unmet" id="req-length">✓ At least 8 characters</div>
                    <div class="requirement unmet" id="req-upper">✓ At least one uppercase letter</div>
                    <div class="requirement unmet" id="req-lower">✓ At least one lowercase letter</div>
                    <div class="requirement unmet" id="req-number">✓ At least one number required</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const TOKEN = "<?php echo htmlspecialchars($token); ?>";
        const ACCOUNT_TYPE = "<?php echo htmlspecialchars($type); ?>";

        function checkPasswordStrength() {
            const password = document.getElementById("password").value;
            let strength = 0;

            const hasLength = password.length >= 8;
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumber = /[0-9]/.test(password);

            updateRequirement("req-length", hasLength);
            updateRequirement("req-upper", hasUpperCase);
            updateRequirement("req-lower", hasLowerCase);
            updateRequirement("req-number", hasNumber);

            if (hasLength) strength++;
            if (hasUpperCase) strength++;
            if (hasLowerCase) strength++;
            if (hasNumber) strength++;

            const indicator = document.getElementById("strengthIndicator");
            if (password.length === 0) {
                indicator.textContent = "";
            } else if (strength <= 2) {
                indicator.textContent = "Weak";
                indicator.className = "password-strength weak";
            } else if (strength === 3) {
                indicator.textContent = "Medium";
                indicator.className = "password-strength medium";
            } else {
                indicator.textContent = "Strong";
                indicator.className = "password-strength strong";
            }
        }

        function updateRequirement(id, met) {
            const el = document.getElementById(id);
            if (met) {
                el.classList.remove("unmet");
                el.classList.add("met");
            } else {
                el.classList.remove("met");
                el.classList.add("unmet");
            }
        }

        function showErrorAlert(message) {
            alert(message);
        }

        function showSuccessAlert(message) {
            const notification = document.getElementById('successNotification');
            if (notification) {
                // Remove the ::before pseudo-element content from being added to text
                notification.textContent = message;
                notification.classList.add('show');
                
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        window.location = "login.html";
                    }, 500);
                }, 2000);
            } else {
                alert(message);
            }
        }

        function updatePass() {
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const btn = document.getElementById("updateBtn");

            if (!password || !confirmPassword) {
                showErrorAlert("Fill all fields");
                return;
            }
            if (password.length < 8) {
                showErrorAlert("Password must be at least 8 characters");
                return;
            }
            if (!/[A-Z]/.test(password)) {
                showErrorAlert("Password must contain at least one uppercase letter");
                return;
            }
            if (!/[a-z]/.test(password)) {
                showErrorAlert("Password must contain at least one lowercase letter");
                return;
            }
            if (!/[0-9]/.test(password)) {
                showErrorAlert("Password must contain at least one number");
                return;
            }
            if (password !== confirmPassword) {
                showErrorAlert("Passwords don't match");
                return;
            }

            btn.disabled = true;
            btn.textContent = "Updating...";

            fetch("../api/update-password.php", {
                method: "POST",
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: "token=" + encodeURIComponent(TOKEN) + "&password=" + encodeURIComponent(password) + "&type=" + encodeURIComponent(ACCOUNT_TYPE)
            })
            .then(r => {
                console.log("Response status:", r.status);
                return r.text().then(text => {
                    console.log("Response text:", text);
                    return { status: r.status, text: text };
                });
            })
            .then(result => {
                btn.disabled = false;
                btn.textContent = "Update Password";
                const data = result.text;
                
                console.log("Checking response:", data);
                
                if (data.includes("success")) {
                    showSuccessAlert("Your password has been updated successfully!");
                    setTimeout(() => {
                        window.location = "login.html";
                    }, 1500);
                } else if (data.includes("Error")) {
                    showErrorAlert(data.replace("Error: ", ""));
                } else {
                    showErrorAlert("Unexpected response. Please try again.");
                }
            })
            .catch(e => {
                btn.disabled = false;
                btn.textContent = "Update Password";
                console.error("Fetch error:", e);
                showErrorAlert("Network error: " + e.message);
            });
        }

        document.getElementById("confirmPassword").addEventListener("keypress", e => {
            if (e.key === "Enter") updatePass();
        });

        checkPasswordStrength();
    </script>
</body>
</html>
