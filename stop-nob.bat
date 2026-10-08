@echo off
setlocal
cd /d "%~dp0"
echo Stopping NOB...
docker compose down
echo.
echo NOB stopped.
pause
