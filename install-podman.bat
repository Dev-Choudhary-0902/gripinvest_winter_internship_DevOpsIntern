@echo off
echo Installing Podman (Docker Alternative)...

echo.
echo Downloading Podman installer...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/containers/podman/releases/latest/download/podman-4.8.2-setup.exe' -OutFile 'podman-installer.exe'"

echo.
echo Running installer...
podman-installer.exe

echo.
echo Podman installed! You can now use 'podman' instead of 'docker'
echo Example: podman build -t grip-invest-backend .

pause
