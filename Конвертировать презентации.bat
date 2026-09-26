@echo off
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python не найден. Установите его с https://www.python.org/downloads/
  echo При установке отметьте галочку "Add Python to PATH".
  pause
  exit /b 1
)
python convert.py %*
echo.
pause
