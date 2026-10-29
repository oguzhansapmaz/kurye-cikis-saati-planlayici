@echo off
setlocal
cd /d "%~dp0"
title Kurye Cikis Saati Planlayici - Yerel Sunucu

set "PYTHON_EXE="
rem Prefer the existing Anaconda environment used for the coursework.
if exist "C:\Anaconda3\envs\rayli-agi\python.exe" set "PYTHON_EXE=C:\Anaconda3\envs\rayli-agi\python.exe"
if not defined PYTHON_EXE if exist "C:\Anaconda3\python.exe" set "PYTHON_EXE=C:\Anaconda3\python.exe"
if not defined PYTHON_EXE if exist "%USERPROFILE%\anaconda3\python.exe" set "PYTHON_EXE=%USERPROFILE%\anaconda3\python.exe"

set "PORT=8081"
netstat -ano 2>nul | findstr ":8081" | findstr "LISTENING" >nul
if not errorlevel 1 set "PORT=8082"

 echo ==================================================
echo Kurye Cikis Saati Planlayici - Yerel web sunucusu
echo Proje klasoru: %~dp0
echo ==================================================
echo.

if defined PYTHON_EXE goto use_python_exe
where py >nul 2>&1
if not errorlevel 1 goto use_py_launcher

echo [UYARI] Anaconda Python yolu bulunamadi ve Python launcher yok.
echo Statik sayfayi dogrudan aciyorum. Bazi tarayici ozellikleri sinirli olabilir.
start "" "%~dp0index.html"
echo.
echo Istersen Anaconda Prompt icinde proje klasorune gidip su komutu da calistirabilirsin:
echo C:\Anaconda3\envs\rayli-agi\python.exe -m http.server %PORT% --bind 127.0.0.1
echo.
pause
exit /b 0

:use_python_exe
echo Python: %PYTHON_EXE%
goto run_server

:use_py_launcher
echo Python launcher: py -3
echo.
:run_server
echo Tarayicida acilacak adres: http://127.0.0.1:%PORT%
echo Sunucuyu durdurmak icin bu pencerede Ctrl+C kullan.
echo.
start "" "http://127.0.0.1:%PORT%"
if defined PYTHON_EXE (
  "%PYTHON_EXE%" -m http.server %PORT% --bind 127.0.0.1
) else (
  py -3 -m http.server %PORT% --bind 127.0.0.1
)
set "SERVER_EXIT_CODE=%errorlevel%"
echo.
if not "%SERVER_EXIT_CODE%"=="0" echo [HATA] Sunucu durdu. Hata kodu: %SERVER_EXIT_CODE%
echo Sunucuyu kapatmak icin bir tusa bas.
pause >nul
exit /b %SERVER_EXIT_CODE%
