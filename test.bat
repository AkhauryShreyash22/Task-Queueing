@echo off
:start
curl http://localhost:3000/
timeout /t 1 >nul
goto start
