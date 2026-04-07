@echo off
echo =======================================================
echo    Starting Automated Hostel Management System
echo =======================================================

echo.
echo Installing Python Backend Requirements...
pip install -r requirements.txt

echo.
echo Installing Frontend Node Dependencies...
call npm install

echo.
echo Starting Python FastAPI Backend Server on port 8000...
start "Python Backend (FastAPI)" cmd /k "uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload"

echo.
echo Starting React/Vite Frontend Server on port 5173...
start "React Frontend (Vite)" cmd /k "npm run dev"

echo.
echo =======================================================
echo    System successfully launched!
echo    Vite will open at http://localhost:5173
echo    FastAPI Docs available at http://localhost:8000/docs
echo =======================================================
echo Feel free to minimize these windows.
pause
