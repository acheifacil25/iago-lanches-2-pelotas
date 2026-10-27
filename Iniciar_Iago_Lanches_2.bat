@echo off
chcp 65001 >nul
title IAGO LANCHES 2 - Sistema de Entregas Facity e Maquininha de Bip (Pelotas/RS)
color 0E

echo ============================================================================
echo   IAGO LANCHES 2 - PAINEL DE ENTREGAS INTEGRADO AO FACITY (PELOTAS/RS)
echo   Base: Av. Fernando Osorio, 2870 - Tres Vendas
echo ============================================================================
echo.
echo [1/2] Iniciando servidor integrado ao Facity na porta 8000...

cd /d "C:\Users\Oem\.gemini\antigravity\scratch\delivery-pelotas"

:: Abre o navegador em modo Aplicativo apos 2 segundos
start "" cmd /c "timeout /t 2 >nul & start msedge --app=http://localhost:8000 2>nul || start chrome --app=http://localhost:8000 2>nul || start http://localhost:8000"

echo [2/2] Painel no ar em: http://localhost:8000
echo       (Mantenha esta janela minimizada enquanto estiver operando no balcao)
echo.
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
pause
