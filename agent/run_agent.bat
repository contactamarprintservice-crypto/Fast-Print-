@echo off
title Fast Print Service - Windows Agent Launcher
color 0B
echo ========================================================
echo    FAST PRINT SERVICE - WINDOWS PRINT AGENT LAUNCHER
echo    Compatible with Windows 10 & Windows 11 (32-bit / 64-bit)
echo ========================================================
echo.

:: Check PowerShell Availability
powershell -Command "Write-Host 'Checking Windows PowerShell subsystem... OK' -ForegroundColor Green"
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell is required to run Fast Print Agent.
    pause
    exit /b
)

:: Prompt for Shop ID and Pairing Code if not set
set /p SHOP_ID="Enter your Shop ID (default: sh-om-xerox): "
if "%SHOP_ID%"=="" set SHOP_ID=sh-om-xerox

set /p PAIR_CODE="Enter your 6-digit Agent Pairing Code (default: 829415): "
if "%PAIR_CODE%"=="" set PAIR_CODE=829415

set /p SVR_URL="Enter Fast Print Server URL (default: http://localhost:3000): "
if "%SVR_URL%"=="" set SVR_URL=http://localhost:3000

echo.
echo Launching Fast Print Agent for Shop [%SHOP_ID%]...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fast_print_agent.ps1" -ServerUrl "%SVR_URL%" -ShopId "%SHOP_ID%" -PairingCode "%PAIR_CODE%"

pause
