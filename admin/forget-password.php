<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - Event System</title>
    <link rel="stylesheet" href="css/login.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Poppins', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-image: url('/EventSystem/assets/back.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .top-header {
            display: none;
        }

        .main-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            position: relative;
        }

        .form-container {
            width: 100%;
            max-width: 500px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        /* ===== ROTATING RING ===== */
        .ring {
            position: absolute;
            width: 360px;
            height: 360px;
            z-index: 100;
            left: 50%;
            top: 15%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        }

        .bar {
            position: absolute;
            width: 8px;
            height: 26px;
            background: linear-gradient(180deg, #F43535, #630909);
            border-radius: 10px;
            top: 50%;
            left: 50%;
            transform-origin: center -200px;
            transition: 0.18s linear;
            opacity: 1;
        }

        .bar.active {
            background: linear-gradient(180deg, #ff4444, #ff6b6b);
            box-shadow:
                0 0 15px #ff4444,
                0 0 30px rgba(255, 68, 68, 0.9),
                0 0 50px rgba(255, 107, 107, 0.7),
                0 0 70px rgba(255, 68, 68, 0.5);
        }

        .bar.trail1 {
            background: linear-gradient(180deg, rgba(255, 107, 107, 1), rgba(255, 150, 150, 0.95));
            box-shadow: 0 0 12px rgba(255, 107, 107, 0.9);
        }

        .bar.trail2 {
            background: rgba(255, 120, 120, 0.85);
            box-shadow: 0 0 8px rgba(255, 107, 107, 0.7);
        }

        .bar.trail3 {
            background: rgba(255, 130, 130, 0.65);
            box-shadow: 0 0 5px rgba(255, 107, 107, 0.5);
        }

        .bar.trail4 {
            background: rgba(255, 140, 140, 0.4);
            box-shadow: 0 0 3px rgba(255, 107, 107, 0.3);
        }

        .bar.trail5 {
            background: rgba(255, 150, 150, 0.2);
        }

        /* ===== FORGOT PASSWORD FORM ===== */
        .forgot-form {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 5;
            background: rgba(255, 255, 255, 0.8);
            padding: 40px 30px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            width: 100%;
            height: 510px;
            max-width: 600px;
            margin: 0 auto;
            pointer-events: auto;
        }

        .forgot-form h2 {
            color: #F43535;
            text-align: center;
            letter-spacing: 2px;
            margin-top: 80px;
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: 700;
            font-family: 'Poppins', sans-serif;
        }

        .forgot-form p {
            text-align: center;
            width: 80%;
            color: #830e0e;
            font-size: 14px;
            margin-bottom: 25px;
            line-height: 1.5;
        }

        .inputBox {
            position: relative;
            margin-top: -4px;
            margin-bottom: 10px;
            margin-left: 38%;
            width: 70%;
            z-index: 50;
            pointer-events: auto;
        }

        .inputBox input {
            width: 100%;
            height: 40px;
            border-radius: 6px;
            border: 2px solid #820404;
            background: transparent;
            color: #333;
            padding: 12px 14px;
            font-size: 13px;
            outline: none;
            transition: 0.3s;
            position: relative;
            z-index: 50;
            cursor: text;
            box-sizing: border-box;
            pointer-events: auto;
        }

        .inputBox label {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #535050;
            font-size: 12px;
            pointer-events: none;
            transition: 0.3s ease;
            padding: 0 5px;
            background: transparent;
            z-index: 0;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.3px;
        }

        .inputBox input:focus + label,
        .inputBox input:valid + label {
            top: -8px;
            font-size: 11px;
            color: #F43535;
            background: transparent;
            padding: 0 2px;
        }

        .inputBox input:focus {
            border-color: #F43535;
            box-shadow: 0 0 10px rgba(244, 53, 53, 0.3);
        }

        .inputBox input[type="submit"] {
            cursor: pointer;
            background: linear-gradient(90deg, #630909 0%, #950B08 27%, #F43535 56%, #ECB9B2 90%);
            color: #ffffffd9;
            font-weight: 600;
            font-size: 13px;
            height: 40px;
            line-height: 40px;
            margin-top: 10px;
            border-radius: 6px;
            border: none;
            padding: 0;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            position: relative;
            z-index: 50;
            pointer-events: auto;
        }

        .inputBox input[type="submit"]:hover {
            background: linear-gradient(90deg, #fa3d3d 0%, #F43535 27%, #950B08 56%, #630909 90%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
        }

        .inputBox input[type="submit"]:active {
            transform: translateY(0);
        }

        .back-to-login {
            text-align: center;
            margin-top: 20px;
            font-size: 13px;
            position: relative;
            z-index: 50;
        }

        .back-to-login a {
            color: #F43535;
            text-decoration: none;
            font-weight: 600;
            position: relative;
            display: inline-block;
            overflow: hidden;
            transition: color 0s ease;
            pointer-events: auto;
        }

        .back-to-login a::before {
            content: '';
            position: absolute;
            top: 0;
            right: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(99, 9, 9, 0.15), transparent);
            transition: right 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
            pointer-events: none;
        }

        .back-to-login a:hover {
            color: #630909;
        }

        .back-to-login a:hover::before {
            right: 100%;
        }

        #alertBox {
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 350px;
            z-index: 1000;
            padding: 18px 24px;
            border-radius: 12px;
            font-family: 'Poppins', sans-serif;
            font-weight: 500;
            font-size: 14px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            pointer-events: none;
        }

        #alertBox.show {
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto;
        }

        #alertBox.alert-success {
            background: linear-gradient(135deg, rgba(39, 174, 96, 0.15), rgba(52, 211, 153, 0.1));
            color: #10b981;
            border-color: rgba(16, 185, 129, 0.5);
        }

        #alertBox.alert-success::before {
            content: '✓';
            font-size: 20px;
            font-weight: bold;
            color: #10b981;
            flex-shrink: 0;
        }

        #alertBox.alert-error {
            background: linear-gradient(135deg, rgba(244, 53, 53, 0.15), rgba(252, 91, 64, 0.1));
            color: #ef4444;
            border-color: rgba(239, 68, 68, 0.5);
        }

        #alertBox.alert-error::before {
            content: '⚠';
            font-size: 18px;
            color: #ef4444;
            flex-shrink: 0;
        }

        #alertBox.alert-info {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.1));
            color: #3b82f6;
            border-color: rgba(59, 130, 246, 0.5);
        }

        #alertBox.alert-info::before {
            content: 'ℹ';
            font-size: 18px;
            color: #3b82f6;
            flex-shrink: 0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
            .form-container {
                padding: 40px 30px;
            }

            .ring {
                width: 320px;
                height: 320px;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 20px;
            }

            .form-container {
                padding: 30px 20px;
            }

            .forgot-form {
                padding: 30px 20px;
            }

            .forgot-form h2 {
                font-size: 24px;
            }

            .ring {
                width: 280px;
                height: 280px;
            }
        }

        @media (max-width: 480px) {
            body {
                padding: 15px;
            }

            .forgot-form {
                padding: 25px 15px;
            }

            .forgot-form h2 {
                font-size: 20px;
                margin-bottom: 15px;
            }

            .forgot-form p {
                font-size: 12px;
                margin-bottom: 20px;
            }

            .ring {
                display: none;
            }

            .inputBox {
                margin-bottom: 15px;
            }

            .inputBox input {
                height: 38px;
            }

            #alertBox {
                left: 15px;
                right: 15px;
                max-width: none;
                top: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="top-header"></div>

    <div class="main-container">
        <div class="form-container">
            <!-- ROTATING RING -->
            <div class="ring" id="ring"></div>

            <!-- FORGOT PASSWORD FORM -->
            <div id="alertBox" class="alert"></div>
            <form class="forgot-form" id="forgotForm" onsubmit="handleForgot(event)">
                <h2>Forgot Password</h2>
                <p>Enter your email address and we'll send you a link to reset your password.</p>

                <div class="inputBox">
                    <input type="email" id="email" name="email" required>
                    <label>Email Address</label>
                </div>

                <div class="inputBox">
                    <input type="submit" value="Send Reset Link">
                </div>

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
            const submitBtn = document.querySelector('.inputBox input[type="submit"]');

            if (!email) {
                showAlert('Please enter your email address', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showAlert('Please enter a valid email address', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.value = 'Processing...';

            fetch(`${API_BASE}/send-reset.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'email=' + encodeURIComponent(email)
            })
            .then(res => res.text())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.value = 'Send Reset Link';

                if (data.includes('success') || data.includes('sent')) {
                    showAlert(data, 'success');
                    document.getElementById('email').value = '';
                } else {
                    showAlert(data, 'error');
                }
            })
            .catch(error => {
                submitBtn.disabled = false;
                submitBtn.value = 'Send Reset Link';
                showAlert('Failed to send reset link: ' + error, 'error');
            });
        }

        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        // Initialize rotating ring
        window.addEventListener('load', function() {
            const ring = document.getElementById('ring');
            if (ring) {
                const totalBars = 48;
                let current = 0;
                const trailLength = 6;

                for(let i = 0; i < totalBars; i++){
                    const bar = document.createElement('div');
                    bar.className = 'bar';
                    bar.style.transform = `rotate(${i*(360/totalBars)}deg)`;
                    ring.appendChild(bar);
                }

                const bars = document.querySelectorAll('.bar');

                setInterval(()=>{
                    bars.forEach(b=>{
                        b.classList.remove('active','trail1','trail2','trail3','trail4','trail5');
                    });

                    bars[current].classList.add('active');

                    for(let i=1; i<trailLength; i++){
                        let index = (current - i + totalBars) % totalBars;
                        bars[index].classList.add('trail'+i);
                    }

                    current = (current+1) % totalBars;
                }, 60);
            }
        });

        // Allow Enter key to submit
        document.getElementById('email').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('forgotForm').dispatchEvent(new Event('submit'));
            }
        });
    </script>
</body>
</html>
