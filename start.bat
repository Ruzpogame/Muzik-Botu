@echo off
title Qylent Muzik Bot
color 0B

echo.
echo   ==============================================================================
echo      QYLENT MUZIK BOT
echo      Discord Muzik + Radyo
echo      Bot: Qylent tarafindan gelistirilmistir. Ucretsiz bottur.
echo      Discord: https://discord.gg/DaDGdpQnNc
echo      Baglantiyi acmak icin: CTRL + Sol Tik
echo   ==============================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [HATA] Node.js bulunamadi. Lutfen Node.js yukleyin.
    echo   https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo   [*] Node.js :
node -v
echo.

if not exist ".env" (
    echo   [UYARI] .env dosyasi bulunamadi!
    echo   TOKEN ve diger ayarlari .env icinde tanimlayin.
    echo.
) else (
    echo   [*] .env dosyasi OK
)

echo   [*] Dizin : %cd%
echo.
echo   ------------------------------------------------
echo   Bot baslatiliyor...
echo   ------------------------------------------------
echo.

node index.js

echo.
echo   ------------------------------------------------
echo   Bot kapandi. Cikis kodu: %errorlevel%
echo   ------------------------------------------------
echo.
pause
