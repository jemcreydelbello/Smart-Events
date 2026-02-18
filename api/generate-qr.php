<?php
// QR Code Generator endpoint
// Uses QRServer API (no installation needed)

$data = $_GET['data'] ?? 'EventSystem';

// Use QRServer API for QR code generation
$qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($data);

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'qr_url' => $qrUrl
]);
?>
