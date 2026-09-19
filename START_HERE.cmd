@echo off
setlocal
cd /d "%~dp0"
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\INSTALL_AND_VALIDATE.ps1"
echo.
echo Press any key to close...
pause >nul
