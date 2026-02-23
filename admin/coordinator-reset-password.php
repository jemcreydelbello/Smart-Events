<?php
include("../config/db.php");

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
            margin-bottom: 30px;
            font-size: 24px;
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

        .password-requirements {
            background: #f0f4ff;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            font-size: 13px;
            color: #555;
        }

        .password-requirements h4 {
            margin-bottom: 10px;
            color: #667eea;
        }

        .password-requirements ul {
            list-style: none;
            padding: 0;
        }

        .password-requirements li {
            padding: 4px 0;
        }

        .password-requirements li.valid {
            color: #27ae60;
        }

        .password-requirements li.invalid {
            color: #e74c3c;
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

        .success-message {
            color: #27ae60;
            text-align: center;
            margin-top: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Set Your Password</h2>
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
                        text: 'Your password has been set successfully!',
                        allowOutsideClick: false
                    }).then(() => {
                        window.location.href = './index.html';
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
