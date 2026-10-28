@echo off
title Gerador de Pacote Google Play Store - Iago Lanches 2
chcp 65001 >nul
cls
echo =========================================================================
echo    IAGO LANCHES 2 - PACOTES PARA GOOGLE PLAY STORE (AAB / APK)
echo =========================================================================
echo.
echo Este projeto utiliza a tecnologia oficial TWA (Trusted Web Activity) recomendada
echo pelo Google para aplicativos web de alta performance na Google Play Store.
echo.
echo Arquivos de configuração já gerados:
echo  1. Painel da Loja: playstore\twa-painel.json (br.com.iagolanches2.painel)
echo  2. App do Motoboy: playstore\twa-motoboy.json (br.com.iagolanches2.motoboy)
echo  3. Digital Asset Links: .well-known\assetlinks.json
echo.
echo =========================================================================
echo  OPÇÃO 1 (Recomendada - Sem instalar nada, direto pelo navegador):
echo =========================================================================
echo  1. Acesse: https://www.pwabuilder.com
echo  2. Cole o link do app:
echo     - Para o Painel da Loja: https://acheifacil25.github.io/iago-lanches-2-pelotas/
echo     - Para o App do Motoboy: https://acheifacil25.github.io/iago-lanches-2-pelotas/?app=motoboy
echo  3. Clique em "Package for stores" e depois em "Google Play".
echo  4. Baixe o arquivo .aab gerado e suba no Google Play Console!
echo.
echo =========================================================================
echo  OPÇÃO 2 (Via Linha de Comando com Bubblewrap oficial do Google):
echo =========================================================================
echo  Execute:
echo    npm install -g @bubblewrap/cli
echo    bubblewrap init --manifest=https://acheifacil25.github.io/iago-lanches-2-pelotas/manifest.json
echo    bubblewrap build
echo.
echo Pressione qualquer tecla para abrir o PWABuilder no seu navegador...
pause >nul
start "" "https://www.pwabuilder.com?url=https://acheifacil25.github.io/iago-lanches-2-pelotas/"
