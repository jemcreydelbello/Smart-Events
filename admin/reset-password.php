<?php
include("../config/db.php");

$token = isset($_GET['token']) ? $_GET['token'] : '';

if (empty($token)) {
    http_response_code(400);
    echo "<div style='text-align: center; margin-top: 50px;'><h2>Invalid Request</h2><p>Token is missing.</p></div>";
    exit;
}

$token_escaped = $conn->real_escape_string($token);
$sql = "SELECT admin_id, reset_expire FROM admins WHERE reset_token='$token_escaped'";
$result = $conn->query($sql);

if (!$result || $result->num_rows == 0) {
    http_response_code(400);
    echo "<div style='text-align: center; margin-top: 50px;'><h2>Invalid or Expired Link</h2><p>The password reset link is invalid or has expired. <a href='forget-password.php'>Try Again</a></p></div>";
    exit;
}

$admin_row = $result->fetch_assoc();
$admin_id = $admin_row['admin_id'];
$reset_expire = $admin_row['reset_expire'];

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
    <link rel="stylesheet" href="css/login.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(244, 53, 53, 0.3); }
            50% { box-shadow: 0 0 0 15px rgba(244, 53, 53, 0); }
        }

        @keyframes checkFade {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
        }

        .reset-password-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-image: url('/EventSystem/assets/back.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            position: relative;
            overflow: hidden;
        }

        .reset-password-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%);
            pointer-events: none;
        }

        .reset-password-box {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            padding: 50px 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
                        0 0 60px rgba(244, 53, 53, 0.15);
            width: 100%;
            max-width: 420px;
            animation: slideInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            z-index: 1;
        }

        .reset-password-box h2 {
            text-align: center;
            margin-bottom: 15px;
            color: #F43535;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .reset-password-box p {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
            line-height: 1.6;
        }

        .form-group {
            margin-bottom: 25px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #630909;
            font-weight: 500;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-group input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #820c0c;
            border-radius: 12px;
            font-size: 14px;
            transition: all 0.3s ease;
            background: #ffffff9b;
        }

        .form-group input:hover {
            border-color: #F43535;
            background: #fff;
        }

        .form-group input:focus {
            outline: none;
            border-color: #F43535;
            background: #fff;
            box-shadow: 0 0 0 4px rgba(244, 53, 53, 0.1);
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
            background: linear-gradient(135deg, #F43535 0%, #950B08 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
            overflow: hidden;
            animation: pulse 2s infinite;
        }

        .btn-update::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.2);
            transition: left 0.3s ease;
        }

        .btn-update:hover::before {
            left: 100%;
        }

        .btn-update:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(244, 53, 53, 0.4);
        }

        .btn-update:active {
            transform: translateY(0);
        }

        .btn-update:disabled {
            background: #e4bdbd;
            cursor: not-allowed;
            animation: none;
            box-shadow: none;
        }

        .password-requirements {
            background: #fcf3f3;
            padding: 20px;
            border-radius: 12px;
            margin-top: 25px;
            font-size: 13px;
            color: #ef8383;
            border-left: 4px solid #F43535;
        }

        .password-requirements h4 {
            margin-bottom: 12px;
            color: #630909;
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
            color: #d8341e;
            animation: checkFade 0.3s ease;
        }

        .requirement.met::before {
            content: '✓';
            color: #d8341e;
            font-size: 16px;
        }

        .requirement.unmet {
            color: #aa7d7d;
        }

        @media (max-width: 480px) {
            .reset-password-box {
                margin: 20px;
                padding: 40px 25px;
            }
            .reset-password-box h2 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
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

    <script>
        const TOKEN = "<?php echo htmlspecialchars($token); ?>";

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
            return Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: message,
                background: '#fff',
                color: '#333',
                confirmButtonColor: '#F43535',
                confirmButtonText: 'Try Again',
                didOpen: (modal) => {
                    modal.style.borderRadius = '12px';
                    modal.style.boxShadow = '0 20px 60px rgba(244, 53, 53, 0.2)';
                    const popup = Swal.getPopup();
                    popup.style.animation = 'slideInUp 0.3s ease-out';
                }
            });
        }

        function showSuccessAlert(message) {
            return Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: message,
                background: '#fff',
                color: '#333',
                confirmButtonColor: '#27ae60',
                confirmButtonText: 'OK',
                didOpen: (modal) => {
                    modal.style.borderRadius = '12px';
                    modal.style.boxShadow = '0 20px 60px rgba(39, 174, 96, 0.2)';
                    const popup = Swal.getPopup();
                    popup.style.animation = 'slideInUp 0.3s ease-out';
                }
            });
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
                body: "token=" + encodeURIComponent(TOKEN) + "&password=" + encodeURIComponent(password)
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
                    showSuccessAlert("Your password has been updated successfully!").then(() => {
                        window.location = "login.html";
                    });
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
