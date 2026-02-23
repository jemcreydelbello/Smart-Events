<?php
$password_hash = '$2y$10$fAsyxhUXLEwLth6ig2MGhOO2gq0nQb/1Lt8xz0/AQV.CPdtSukl4i';
$password = 'Reset123';

if (password_verify($password, $password_hash)) {
    echo 'Password is CORRECT' . PHP_EOL;
} else {
    echo 'Password is INCORRECT' . PHP_EOL;
}

// Also let's check what the password should hash to
$test_hash = password_hash('Reset123', PASSWORD_BCRYPT);
echo 'New hash for Reset123: ' . $test_hash . PHP_EOL;
echo 'Stored hash: ' . $password_hash . PHP_EOL;
?>
