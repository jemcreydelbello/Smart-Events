<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - Event System</title>
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

        .password-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 60px;
            overflow-y: auto;
        }

        #forgotForm {
            width: 100%;
            max-width: 500px;
        }

        .forgot-form-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .forgot-form-header h2 {
            color: #1F4CC4;
            font-size: 42px;
            font-weight: 700;
            margin-bottom: 12px;
        }

        .forgot-form-header p {
            color: #6b7280;
            font-size: 18px;
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

        .form-group input[type="email"] {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 16px;
            font-family: 'Inter', sans-serif;
            transition: all 0.3s;
        }

        .form-group input[type="email"]:focus {
            outline: none;
            border-color: #1F4CC4;
            box-shadow: 0 0 0 3px rgba(31, 76, 196, 0.1);
        }

        .submit-btn {
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
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(31, 76, 196, 0.3);
        }

        .submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }

        #alertBox {
            padding: 12px 14px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 13px;
            font-weight: 500;
            display: none;
        }

        #alertBox.show {
            display: block;
        }

        #alertBox.alert-error {
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }

        #alertBox.alert-success {
            background: #dcfce7;
            color: #16a34a;
            border: 1px solid #bbf7d0;
        }

        .back-to-login {
            text-align: center;
            margin-top: 24px;
        }

        .back-to-login a {
            color: #1F4CC4;
            text-decoration: none;
            font-size: 15px;
            font-weight: 600;
            transition: all 0.3s;
        }

        .back-to-login a:hover {
            color: #1538A0;
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .password-wrapper {
                flex-direction: column;
                height: auto;
            }

            .video-section {
                display: none;
            }

            .password-container {
                padding: 30px 20px;
                min-height: 100vh;
            }

            .forgot-form-header h2 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
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
        <div class="password-container">
            <div id="alertBox" class="alert"></div>
            
            <form id="forgotForm" onsubmit="handleForgot(event)">
                <div class="forgot-form-header">
                    <h2>Forgot Password</h2>
                    <p>Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email address" required>
                </div>

                <button type="submit" class="submit-btn">Send Reset Link</button>

                <p class="back-to-login"><a href="login.html">← Back to Login</a></p>
            </form>
        </div>
    </div>

    <script>
        const API_BASE = '../api';

        function showAlert(message, type = 'error') {
            const alertBox = document.getElementById('alertBox');
            if (alertBox) {
                alertBox.textContent = message;
                alertBox.className = `alert alert-${type}`;
                
                // Trigger reflow to restart animation
                void alertBox.offsetWidth;
                
                alertBox.classList.add('show');

                if (type === 'success') {
                    setTimeout(() => {
                        alertBox.classList.remove('show');
                    }, 3500);
                } else {
                    setTimeout(() => {
                        alertBox.classList.remove('show');
                    }, 5000);
                }
            }
        }

        function handleForgot(event) {
            event.preventDefault();

            const email = document.getElementById('email').value.trim();
            const submitBtn = document.querySelector('.submit-btn');

            if (!email) {
                showAlert('Please enter your email address', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';

            fetch(`${API_BASE}/send-reset.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'email=' + encodeURIComponent(email)
            })
            .then(res => res.text())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Reset Link';

                if (data.includes('success') || data.includes('sent')) {
                    showAlert(data, 'success');
                    document.getElementById('email').value = '';
                } else {
                    showAlert(data, 'error');
                }
            })
            .catch(error => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Reset Link';
                showAlert('Failed to send reset link: ' + error, 'error');
            });
        }

        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        // Allow Enter key to submit
        document.getElementById('email').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('forgotForm').dispatchEvent(new Event('submit'));
            }
        });
    </script>
</body>
</html>
