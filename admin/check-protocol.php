<?php
// FORCE HTTPS/HTTP PROTOCOL - Redirect file:// to http://localhost/
// If someone opens login.html directly (file://), this will redirect them to HTTP

// Get the requested file path
$request_uri = $_SERVER['REQUEST_URI'] ?? '';
$server_name = $_SERVER['SERVER_NAME'] ?? 'localhost';
$server_port = $_SERVER['SERVER_PORT'] ?? 80;

// Determine protocol
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';

// If coming from file://, redirect to http://localhost
if (empty($server_name) || $server_name === 'localhost' || strpos($server_name, '127.0.0.1') === 0) {
    // Correct protocol, continue normally
} else if (strpos($_SERVER['REQUEST_URI'] ?? '', 'file://') === 0) {
    // Force redirect
    header('Location: http://localhost/Smart-Events/admin/login.html', true, 301);
    exit;
}

// If not using HTTP, force HTTP (for file:// users)
if ($protocol !== 'http') {
    header('Location: http://localhost' . $request_uri, true, 301);
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Redirecting...</title>
</head>
<body>
    <script>
        // Double-check we're using HTTP
        if (window.location.protocol === 'file:' || window.location.origin === 'null') {
            window.location.href = 'http://localhost/Smart-Events/admin/login.html';
        }
    </script>
    <p>Loading... If this message persists, please open: <a href="http://localhost/Smart-Events/admin/login.html">http://localhost/Smart-Events/admin/login.html</a></p>
</body>
</html>
