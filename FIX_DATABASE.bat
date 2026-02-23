@echo off
REM =================================================
REM SMART EVENTS - DATABASE FIX SCRIPT
REM =================================================

echo.
echo ╔════════════════════════════════════════════════╗
echo ║  SMART EVENTS - DATABASE RECOVERY SCRIPT       ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Set PATH to include MySQL
set PATH=C:\xampp\mysql\bin;%PATH%

echo [1/5] Stopping MySQL service...
net stop MySQL80 /y >nul 2>&1
timeout /t 2 /nobreak

echo [2/5] Cleaning up corrupted database files...
rmdir /s /q "C:\xampp\mysql\data\eventsystem" >nul 2>&1
cd C:\xampp\mysql\data
if exist ib_buffer_pool del ib_buffer_pool >nul 2>&1
if exist ib_logfile0 del ib_logfile0 >nul 2>&1
if exist ib_logfile1 del ib_logfile1 >nul 2>&1

echo [3/5] Starting MySQL service...
net start MySQL80
timeout /t 3 /nobreak

echo [4/5] Recreating database...
mysql -u root -e "DROP DATABASE IF EXISTS eventsystem;" >nul 2>&1
mysql -u root -e "CREATE DATABASE eventsystem CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1

echo [5/5] Loading database schema...
mysql -u root eventsystem < "C:\xampp\htdocs\Smart-Events\COMPLETE_DATABASE_SETUP.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔════════════════════════════════════════════════╗
    echo ║  ✓ DATABASE RECOVERY COMPLETE!                ║
    echo ║  You can now refresh your admin panel.         ║
    echo ╚════════════════════════════════════════════════╝
    echo.
) else (
    echo.
    echo ╔════════════════════════════════════════════════╗
    echo ║  ✗ DATABASE RECOVERY FAILED!                   ║
    echo ║  Please check the error messages above.        ║
    echo ╚════════════════════════════════════════════════╝
    echo.
)

pause
