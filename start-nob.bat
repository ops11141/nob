@echo off
setlocal
cd /d "%~dp0"

echo.
echo ==========================================
echo        NOB - Local Deep Security Engine
echo ==========================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker Desktop is not installed or Docker is not in PATH.
  pause
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker Desktop is not running.
  echo Start Docker Desktop and run this file again.
  pause
  exit /b 1
)

echo Building and starting NOB...
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo [ERROR] NOB could not start.
  echo Check Docker Desktop for details.
  pause
  exit /b 1
)

timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:4173/"
echo.
echo NOB is running at http://127.0.0.1:4173/
echo.
pause
