@echo off
echo ========================================
echo Firebase Storage CORS Configuration
echo ========================================
echo.

echo Checking Google Cloud SDK installation...
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Google Cloud SDK not found
    echo Please install Google Cloud SDK first
    echo Download from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

echo.
echo Setting project to engagenatural-app...
gcloud config set project engagenatural-app

echo.
echo Applying CORS configuration to Firebase Storage...
gsutil cors set cors.json gs://engagenatural-app.appspot.com

echo.
echo Verifying CORS configuration...
gsutil cors get gs://engagenatural-app.appspot.com

echo.
echo CORS configuration complete!
echo Your photo uploads should now work without CORS errors.
echo.
pause
