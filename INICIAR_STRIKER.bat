@echo off
chcp 65001 > nul
title STRIKER - Servidor Local
cls
echo ===================================================
echo     ⚽ STRIKER - WEBAPP MOBILE-FIRST NÉON ⚽
echo ===================================================
echo.
echo [1] No teu COMPUTADOR podes abrir:
echo     http://localhost:3001
echo.
echo [2] No teu TELEMÓVEL (iPhone ou Android no mesmo Wi-Fi):
echo     http://192.168.1.74:3001
echo.
echo ===================================================
echo A abrir no teu browser e a iniciar servidor...
echo Para parar o servidor prime CTRL + C
echo ===================================================
echo.

start http://localhost:3001
node server/server.js
pause
