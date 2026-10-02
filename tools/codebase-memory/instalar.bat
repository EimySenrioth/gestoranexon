@echo off
chcp 65001 > nul
title Instalador Codebase Memory MCP
:MENU
cls
echo ================================================================
echo       INSTALADOR DE CODEBASE-MEMORY-MCP (Base Vectorial)
echo ================================================================
echo.
echo Selecciona la opción que deseas ejecutar:
echo.
echo   [1] Instalación Estándar (Recomendado para Agentes de IA / CLI)
echo   [2] Instalación con Interfaz Gráfica (UI)
echo   [3] Salir
echo.
set /p OPCION="Elige una opción (1, 2 o 3) y presiona Enter: "

if "%OPCION%"=="1" goto OP_ESTANDAR
if "%OPCION%"=="2" goto OP_UI
if "%OPCION%"=="3" goto OP_SALIR

echo.
echo [!] Opción no válida. Inténtalo de nuevo.
timeout /t 2 > nul
goto MENU

:OP_ESTANDAR
cls
echo ================================================================
echo Iniciando Instalación Estándar...
echo ================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
goto FINAL

:OP_UI
cls
echo ================================================================
echo Iniciando Instalación con Interfaz Gráfica (--ui)...
echo ================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" --ui
goto FINAL

:FINAL
echo.
echo ================================================================
echo Proceso finalizado.
echo ================================================================
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
exit

:OP_SALIR
exit
