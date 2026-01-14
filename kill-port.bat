@echo off
set PORT=4000
echo Finding process on port %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
    echo Killing process PID: %%a
    taskkill /F /PID %%a
)
echo Port %PORT% is clear.
