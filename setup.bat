@echo off
REM Hexa IQ Test - Windows Installation Script

echo ======================================
echo Hexa IQ Test - Complete Setup
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js is not installed. Please install it from https://nodejs.org/
    exit /b 1
)

echo [OK] Node.js installed
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] npm is not installed
    exit /b 1
)

echo [OK] npm installed
echo.

REM Backend Setup
echo Installing Backend Dependencies...
cd backend
call npm install
echo [OK] Backend dependencies installed
cd ..
echo.

REM Frontend Setup
echo Installing Frontend Dependencies...
cd frontend
call npm install
echo [OK] Frontend dependencies installed
cd ..
echo.

REM Copy Hexa Logo
echo Copying Hexa Logo...
if exist "Hexa Logo.png" (
    copy "Hexa Logo.png" "frontend\public\hexa-logo.png"
    echo [OK] Hexa Logo copied
) else (
    echo [!] Hexa Logo not found
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo To start the application:
echo 1. CMD 1: cd backend ^&^& npm start
echo 2. CMD 2: cd frontend ^&^& npm start
echo.
echo Then open: http://localhost:3000
echo Admin Email: praphulla@hexamatics.com
echo Admin Password: Asim@1212
echo.
pause
