@echo off
:start
curl -X POST ^
  "http://localhost:3000/api/v1/task" ^
  -H "accept: application/json" ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\": \"2a97fb35-40a0-4bc3-aae6-3aad7cbb1221\"}"
timeout /t 1 >nul
goto start
