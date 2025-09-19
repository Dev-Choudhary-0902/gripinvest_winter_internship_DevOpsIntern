@echo off
echo Building Docker Images for Grip Invest Project...

echo.
echo Building Backend Image...
cd Codebase\Backend
docker build -f Dockerfile.simple -t grip-invest-backend .
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b 1
)

echo.
echo Building Frontend Image...
cd ..\Frontend
docker build -t grip-invest-frontend .
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Docker Images Built Successfully!
echo Backend: grip-invest-backend
echo Frontend: grip-invest-frontend

echo.
echo Listing all images:
docker images

pause
