@echo off
chcp 65001 >nul
title IAGO LANCHES 2 - Publicar no GitHub Automaticamente
color 0A

set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI"
cd /d "C:\Users\Oem\.gemini\antigravity\scratch\delivery-pelotas"

echo ============================================================================
echo   SUBINDO PROJETO IAGO LANCHES 2 PARA O SEU GITHUB (acheifacil25)
echo ============================================================================
echo.

gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo Y| gh auth login --hostname github.com --git-protocol https --web
)

echo.
echo Criando repositorio 'iago-lanches-2-pelotas' e enviando arquivos...
gh auth setup-git
gh repo create iago-lanches-2-pelotas --private --source=. --remote=origin --push
if %errorlevel% neq 0 (
    git remote set-url origin https://github.com/acheifacil25/iago-lanches-2-pelotas.git 2>nul
    git push -u origin main
)

echo.
echo ============================================================================
echo   CONCLUIDO! Abrindo seu repositorio no GitHub...
echo ============================================================================
gh repo view --web
pause
