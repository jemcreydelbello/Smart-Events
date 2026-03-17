<?php
include("../config/db.php");

// Force HTML content type (override any JSON headers from db.php)
header('Content-Type: text/html; charset=utf-8');

$token = isset($_GET['token']) ? $_GET['token'] : '';

if (empty($token)) {
    http_response_code(400);
    echo "<div style='text-align: center; margin-top: 50px;'><h2>Invalid Request</h2><p>Token is missing.</p></div>";
    exit;
}

$token_escaped = $conn->real_escape_string($token);
$sql = "SELECT coordinator_id, reset_expire FROM coordinators WHERE reset_token='$token_escaped'";
$result = $conn->query($sql);

if (!$result || $result->num_rows == 0) {
    http_response_code(400);
    echo "<div style='text-align: center; margin-top: 50px;'><h2>Invalid or Expired Link</h2><p>The password reset link is invalid or has expired. <a href='index.html'>Go Home</a></p></div>";
    exit;
}

$coordinator_row = $result->fetch_assoc();
$coordinator_id = $coordinator_row['coordinator_id'];
$reset_expire = $coordinator_row['reset_expire'];

if ($reset_expire < date('Y-m-d H:i:s')) {
    http_response_code(400);
    echo "<div style='text-align: center; margin-top: 50px;'><h2>Invalid or Expired Link</h2><p>The password reset link is invalid or has expired. <a href='index.html'>Go Home</a></p></div>";
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set Password - Coordinator</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

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

        .reset-wrapper {
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

        .reset-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 60px;
            overflow-y: auto;
        }

        .reset-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .reset-header h1 {
            color: #1F4CC4;
            font-size: 42px;
            font-weight: 700;
            margin-bottom: 12px;
        }

        .reset-header p {
            color: #6b7280;
            font-size: 18px;
        }

        #resetForm {
            width: 100%;
            max-width: 500px;
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
            font-family: 'Inter', sans-serif;
            transition: all 0.3s;
        }

        .form-group input:focus {
            outline: none;
            border-color: #1F4CC4;
            box-shadow: 0 0 0 3px rgba(31, 76, 196, 0.1);
        }

        .password-requirements {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            color: #065f46;
        }

        .password-requirements h4 {
            margin-bottom: 12px;
            color: #10b981;
            font-weight: 600;
        }

        .password-requirements ul {
            list-style: none;
            padding: 0;
        }

        .password-requirements li {
            padding: 6px 0;
            display: flex;
            align-items: center;
        }

        .password-requirements li.valid {
            color: #10b981;
        }

        .password-requirements li.valid::before {
            content: '✓ ';
            font-weight: 700;
            margin-right: 6px;
        }

        .password-requirements li.invalid {
            color: #dc2626;
        }

        .password-requirements li.invalid::before {
            content: '✗ ';
            font-weight: 700;
            margin-right: 6px;
        }

        button {
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
            margin-top: 12px;
        }

        button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(31, 76, 196, 0.3);
        }

        button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }

        .success-message {
            color: #10b981;
            text-align: center;
            margin-top: 20px;
            display: none;
            font-weight: 600;
        }

        .alert {
            display: none;
            padding: 12px 14px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 13px;
            font-weight: 500;
        }

        .alert.show {
            display: block;
        }

        .alert-error {
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }

        @media (max-width: 768px) {
            .reset-wrapper {
                flex-direction: column;
                height: auto;
                max-width: 100%;
            }

            .video-section {
                display: none;
            }

            .reset-container {
                padding: 30px 20px;
                min-height: 100vh;
            }

            .reset-header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="reset-wrapper">
        <!-- Video Section (Left) -->
        <div class="video-section">
            <video autoplay muted loop playsinline>
                <source src="../assets/background.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="video-overlay"></div>
        </div>

        <!-- Reset Section (Right) -->
        <div class="reset-container">
            <div class="reset-header">
                <h1>Set Password</h1>
                <p>Create a secure password for your account</p>
            </div>
        <form id="resetForm" onsubmit="handlePasswordReset(event)">
            <div class="form-group">
                <label for="password">Password:</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required
                    onkeyup="validatePassword()"
                    placeholder="Enter at least 8 characters"
                >
            </div>

            <div class="password-requirements">
                <h4>Password Requirements:</h4>
                <ul id="requirements">
                    <li id="req-length" class="invalid">At least 8 characters</li>
                </ul>
            </div>

            <div class="form-group">
                <label for="confirmPassword">Confirm Password:</label>
                <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    required
                    placeholder="Confirm your password"
                >
            </div>

            <button type="submit" id="submitBtn">Set Password</button>
            <div class="success-message" id="successMessage">
                Password set successfully! Redirecting...
            </div>
        </form>
        </div>
    </div>

    <script>
        const token = '<?php echo htmlspecialchars($token); ?>';

        function validatePassword() {
            const password = document.getElementById('password').value;
            const reqLength = document.getElementById('req-length');
            
            if (password.length >= 8) {
                reqLength.classList.remove('invalid');
                reqLength.classList.add('valid');
            } else {
                reqLength.classList.remove('valid');
                reqLength.classList.add('invalid');
            }
        }

        function handlePasswordReset(event) {
            event.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const submitBtn = document.getElementById('submitBtn');
            
            // Validate passwords match
            if (password !== confirmPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Passwords do not match!'
                });
                return;
            }
            
            // Validate password length
            if (password.length < 8) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Password must be at least 8 characters long!'
                });
                return;
            }
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Setting Password...';
            
            // Send password update request
            fetch('../api/coordinator-update-password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    password: password,
                    token: token
                })
            })
            .then(response => response.text())
            .then(data => {
                if (data.includes('success')) {
                    document.getElementById('successMessage').style.display = 'block';
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Your password has been set successfully! Redirecting to login...',
                        allowOutsideClick: false
                    }).then(() => {
                        window.location.href = './login.html';
                    });
                } else {
                    const errorMsg = data.replace('Error: ', '').trim();
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: errorMsg
                    });
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Set Password';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Failed to set password. Please try again.'
                });
                submitBtn.disabled = false;
                submitBtn.textContent = 'Set Password';
            });
        }

        // Validate on page load
        window.addEventListener('load', validatePassword);
    </script>
</body>
</html>
