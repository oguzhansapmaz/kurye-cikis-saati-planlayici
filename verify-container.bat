@echo off
setlocal
cd /d "%~dp0"
echo [1/3] Build ediyor...
docker build --pull -t kurye-planlayici:hardened .
if errorlevel 1 goto :failed
echo.
echo [2/3] Image runtime kullanicisi (101:101 bekleniyor)...
docker image inspect kurye-planlayici:hardened --format "{{.Config.User}}"
if errorlevel 1 goto :failed
echo.
echo [3/3] id ciktisi (uid=101 gid=101 bekleniyor)...
docker run --rm --entrypoint id kurye-planlayici:hardened
if errorlevel 1 goto :failed
echo.
echo Simdi read-only testini calistiriyoruz. Tarayicida http://localhost:8080 adresini ac.
echo Test bittiginde Ctrl+C ile durdur.
docker run --rm --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --security-opt no-new-privileges --cap-drop ALL -p 8080:8080 kurye-planlayici:hardened
endlocal
goto :eof
:failed
echo Docker kontrolu basarisiz. Ustteki hata ciktisini kaydet.
endlocal
exit /b 1
