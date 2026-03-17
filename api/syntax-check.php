<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Try to parse the events.php file for syntax errors
$file = '../api/events.php';
$code = file_get_contents($file);

// Try to execute php_check_syntax if available
if (function_exists('php_check_syntax')) {
    if (!php_check_syntax($file)) {
        echo "Syntax error found in $file";
    } else {
        echo "No syntax errors in $file";
    }
} else {
    // Alternative: try to include and catch errors
    echo "Checking syntax...";
    ob_start();
    $included = @include $file;
    $output = ob_get_clean();
    
    if ($included === false) {
        echo "Failed to include: " . error_get_last()['message'];
    } else {
        echo "File included successfully";
    }
}
?>
