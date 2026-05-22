@echo off
title Sistema de Contratos - 71º BI Mtz
echo ===================================================
echo Iniciando o Servidor do Sistema de Contratos...
echo Por favor, mantenha esta janela aberta.
echo ===================================================

:: Verifica e instala dependências caso necessário
call npm install

:: Inicia o servidor
start http://localhost:5000
npm run dev

pause
