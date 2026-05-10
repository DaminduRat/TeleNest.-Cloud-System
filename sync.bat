@echo off
title TeleNest Sync - Pushing to GitHub
setlocal enabledelayedexpansion

echo ==========================================
echo    TeleNest Cloud GitHub Sync 🚀
echo ==========================================
echo.

:: Check for changes
git status --short
echo.

set /p msg="Enter commit message (or press Enter for 'Auto-sync'): "
if "!msg!"=="" (
    set msg=Auto-sync: %date% %time%
)

echo.
echo Pushing changes...
git add .
git commit -m "!msg!"
git push

if %errorlevel% neq 0 (
    echo.
    echo ❌ PUSH FAILED! Check your internet or GitHub permissions.
) else (
    echo.
    echo ✅ Sync Complete! Your code is now live on GitHub.
)

echo.
pause
