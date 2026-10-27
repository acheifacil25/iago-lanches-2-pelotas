@echo off
chcp 65001 >nul
title IAGO LANCHES 2 - Link Publico HTTPS na Internet
color 0B

echo ============================================================================
echo   GERADOR DE LINK PUBLICO HTTPS (ACESSO PELO CELULAR / FORA DA LOJA)
echo ============================================================================
echo.
echo Conectando tunel seguro HTTPS para a porta 8000...
echo Copie o link https://....lhr.life que aparecera abaixo:
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:8000 nokey@localhost.run
pause
