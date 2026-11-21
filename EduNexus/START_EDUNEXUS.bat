@echo off
setlocal
cd /d "%~dp0"
title EduNexus
echo ============================================
echo   EduNexus - setup and launcher
echo ============================================
echo.

rem ---- 1. find Python 3.11 / 3.12 / 3.13 ----
set PYV=
for %%V in (3.12 3.11 3.13) do (
  if not defined PYV (
    py -%%V -c "import sys" >nul 2>&1 && set PYV=%%V
  )
)
if defined PYV goto havepython
where winget >nul 2>&1
if errorlevel 1 goto nowinget
echo Python 3.12 not found. Installing it now (one time)...
winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
echo.
echo ------------------------------------------------------------
echo  Python was just installed.
echo  Please CLOSE this window and double-click START_EDUNEXUS.bat again.
echo ------------------------------------------------------------
pause
exit /b 0
:nowinget
echo.
echo Python 3.12 is needed. Install it from https://www.python.org/downloads/release/python-3120/
echo (tick "Add python.exe to PATH"), then double-click this file again.
pause
exit /b 1
:havepython

rem ---- 2. private Python environment (recreated if it uses a wrong Python version) ----
if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" -c "import sys;sys.exit(0 if sys.version_info[:2] in ((3,11),(3,12),(3,13)) else 1)" >nul 2>&1
  if errorlevel 1 rmdir /s /q .venv
)
if not exist ".venv\Scripts\python.exe" (
  echo Creating environment with Python %PYV% ...
  py -%PYV% -m venv .venv
  if errorlevel 1 goto fail
)

rem ---- 3. install packages (only the first time) ----
if exist ".venv\installed.flag" goto pkgsdone
echo Installing packages (first time only, 1-3 minutes)...
".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
if errorlevel 1 goto fail
echo ok> ".venv\installed.flag"
:pkgsdone

rem ---- 4. settings file with a private random secret key ----
if exist ".env" goto envdone
copy ".env.example" ".env" >nul
for /f %%K in ('".venv\Scripts\python.exe" -c "import secrets;print(secrets.token_urlsafe(48))"') do set KEY=%%K
powershell -NoProfile -Command "(Get-Content .env) -replace 'SECRET_KEY=.*','SECRET_KEY=%KEY%' | Set-Content .env"
echo.
echo TIP: For the best AI answers, open the file .env in Notepad and paste a FREE key after GEMINI_API_KEY=
echo      Get it in 2 minutes: https://aistudio.google.com/apikey
echo.
:envdone

rem ---- 5. start the app ----
echo Starting EduNexus... your browser will open at http://localhost:8000
echo Keep this window open while using the app. Close it to stop EduNexus.
echo.
".venv\Scripts\python.exe" app.py
echo.
pause
exit /b 0

:fail
echo.
echo Something went wrong (see the messages above). Send a screenshot of this window for help.
pause
exit /b 1
