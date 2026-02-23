<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - Coordinator</title>
    <link rel="stylesheet" href="css/login.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Poppins', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-image: url('../assets/back.png');
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

        .container {
            width: 100%;
            max-width: 500px;
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .container h2 {
            color: #667eea;
            text-align: center;
            margin-bottom: 10px;
            font-size: 24px;
        }

        .container p {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }

        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
        }

        button {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }

        button:hover {
            background: #5568d3;
        }

        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .back-link {
            text-align: center;
            margin-top: 20px;
        }

        .back-link a {
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
        }

        .back-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Reset Your Password</h2>
        <p>Enter your email address to receive a password reset link</p>
        
        <form id="forgotPasswordForm" onsubmit="handleForgotPassword(event)">
            <div class="form-group">
                <label for="email">Email Address:</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required
                    placeholder="Enter your email"
                    autocomplete="email"
                >
            </div>

            <button type="submit" id="submitBtn">Send Reset Link</button>
        </form>

        <div class="back-link">
            <a href="./index.html">← Back to Home</a>
        </div>
    </div>

    <script>
        function handleForgotPassword(event) {
            event.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const submitBtn = document.getElementById('submitBtn');
            
            if (!email) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Please enter your email address'
                });
                return;
            }
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            
            // Send request to send reset email
            fetch('../api/coordinator-send-reset.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    email: email
                })
            })
            .then(response => response.text())
            .then(data => {
                Swal.fire({
                    icon: 'success',
                    title: 'Email Sent',
                    text: data,
                    allowOutsideClick: false
                }).then(() => {
                    document.getElementById('forgotPasswordForm').reset();
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Reset Link';
                });
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Failed to send reset link. Please try again.'
                });
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Reset Link';
            });
        }
    </script>
</body>
</html>
