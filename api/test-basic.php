<?php
// Clear any buffering
@ob_end_clean();
ob_start();

header('Content-Type: application/json');

echo json_encode([
    'success' => true, 
    'message' => 'API is working'
]);

ob_end_flush();
?>
