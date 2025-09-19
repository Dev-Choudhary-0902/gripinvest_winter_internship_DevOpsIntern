@echo off
echo Packaging Grip Invest Project for Deployment...

echo.
echo Creating deployment package...

REM Create deployment directory
if exist "deployment" rmdir /s /q "deployment"
mkdir "deployment"

REM Package Backend
echo Packaging Backend...
mkdir "deployment\backend"
xcopy "Codebase\Backend\*" "deployment\backend\" /E /I /Y
copy "Codebase\Backend\package.json" "deployment\backend\"
copy "Codebase\Backend\tsconfig.json" "deployment\backend\"
copy "Codebase\Backend\.env" "deployment\backend\"

REM Package Frontend
echo Packaging Frontend...
mkdir "deployment\frontend"
xcopy "Codebase\Frontend\*" "deployment\frontend\" /E /I /Y

REM Create startup scripts
echo Creating startup scripts...

REM Backend startup script
echo @echo off > "deployment\start-backend.bat"
echo cd backend >> "deployment\start-backend.bat"
echo npm install >> "deployment\start-backend.bat"
echo npm run build >> "deployment\start-backend.bat"
echo npm start >> "deployment\start-backend.bat"

REM Frontend startup script
echo @echo off > "deployment\start-frontend.bat"
echo cd frontend >> "deployment\start-frontend.bat"
echo npm install >> "deployment\start-frontend.bat"
echo npm run build >> "deployment\start-frontend.bat"
echo npm start >> "deployment\start-frontend.bat"

REM Create README
echo Creating deployment README...
echo # Grip Invest Project Deployment > "deployment\README.md"
echo. >> "deployment\README.md"
echo ## Quick Start >> "deployment\README.md"
echo. >> "deployment\README.md"
echo 1. Start Backend: Run `start-backend.bat` >> "deployment\README.md"
echo 2. Start Frontend: Run `start-frontend.bat` >> "deployment\README.md"
echo 3. Open http://localhost:3000 in your browser >> "deployment\README.md"
echo. >> "deployment\README.md"
echo ## Prerequisites >> "deployment\README.md"
echo - Node.js 18+ installed >> "deployment\README.md"
echo - MySQL database running >> "deployment\README.md"
echo - Backend runs on port 4000 >> "deployment\README.md"
echo - Frontend runs on port 3000 >> "deployment\README.md"

echo.
echo Deployment package created in 'deployment' folder!
echo You can now distribute this package to any Windows machine with Node.js.

pause
