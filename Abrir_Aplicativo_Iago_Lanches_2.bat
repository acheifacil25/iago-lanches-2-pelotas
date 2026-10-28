@echo off
title Aplicativo Iago Lanches 2
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="https://acheifacil25.github.io/iago-lanches-2-pelotas/"
    exit
)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="https://acheifacil25.github.io/iago-lanches-2-pelotas/"
    exit
)
start "" "https://acheifacil25.github.io/iago-lanches-2-pelotas/"
