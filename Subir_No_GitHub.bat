@echo off
chcp 65001 >nul
title IAGO LANCHES 2 - Publicar no GitHub Automaticamente
color 0A

set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI"
cd /d "C:\Users\Oem\.gemini\antigravity\scratch\delivery-pelotas"

echo ============================================================================
echo   SUBINDO PROJETO IAGO LANCHES 2 PARA O SEU GITHUB
echo ============================================================================
echo.

gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo [PASSO 1] Fazendo login na sua conta do GitHub pelo navegador...
    echo           Copie o codigo de 8 letras que vai aparecer abaixo,
    echo           aperte ENTER para abrir o navegador e cole o codigo la!
    echo.
    gh auth login --hostname github.com --git-protocol https --web
)

echo.
echo [PASSO 2] Criando repositorio 'iago-lanches-2-pelotas' e enviando arquivos...
gh repo create iago-lanches-2-pelotas --private --source=. --remote=origin --push
if %errorlevel% neq 0 (
    git push -u origin main
)

echo.
echo ============================================================================
echo   CONCLUIDO! Abrindo seu repositorio no GitHub...
echo ============================================================================
gh repo view --web
pause
