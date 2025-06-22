@echo off
echo ========================================
echo EngageNatural Website Setup Script
echo ========================================
echo.

echo Installing dependencies...
pnpm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Setup complete! 
echo.
echo To start development server, run:
echo   pnpm run dev
echo.
echo To configure Firebase Storage CORS, run:
echo   gsutil cors set cors.json gs://engagenatural-app.appspot.com
echo.
pause
