=========================================================================
✈️  PARTIU085 FULL - SISTEMA DE MONITORAMENTO DE PASSAGENS AÉREAS
=========================================================================

Este projeto é dividido em duas partes que precisam rodar simultaneamente:
1. BACKEND (Python/Flask): Cérebro que busca passagens e manda alertas.
2. FRONTEND (React/Vite): Site visual para você interagir.

---
PASSO 0: CONFIGURAÇÃO INICIAL (SÓ SE MUDAR DE PC)
---
1. Certifique-se de ter Python (3.10+) e Node.js instalados.
2. Verifique o arquivo `.env` na pasta raiz. Ele deve conter:
   - AMADEUS_API_KEY=...
   - AMADEUS_API_SECRET=...
   - TELEGRAM_TOKEN=...
   - TELEGRAM_CHAT_ID=...

---
PASSO 1: INICIANDO O BACKEND (CÉREBRO)
---
O backend roda na porta 5000.

1. Abra o terminal na pasta raiz do projeto (partiu085_full).
2. Ative o ambiente virtual (se houver):
   Windows: .venv\Scripts\activate
3. Se for a primeira vez, instale as dependências:
   pip install flask flask-cors apscheduler requests python-dotenv
4. Inicie o servidor:
   python app.py

✅ SUCESSO SE: Aparecer "Running on http://127.0.0.1:5000" e logs do agendador.

---
PASSO 2: INICIANDO O FRONTEND (VISUAL)
---
O frontend roda na porta 5173.

1. Abra UM NOVO terminal (não feche o do Python).
2. Entre na pasta do frontend:
   cd frontend
3. Se for a primeira vez, instale as dependências:
   npm install
4. Inicie o servidor visual:
   npm run dev

✅ SUCESSO SE: Aparecer "Local: http://localhost:5173".

---
COMO USAR O SISTEMA
---

1. ACESSO:
   Abra seu navegador em http://localhost:5173

2. RADAR LIVRE (Busca Manual):
   - Digite o destino (ex: MIA, LIS).
   - Escolha "Data Exata" para ver preço real-time.
   - Escolha "Janela de Preços" para ver dias baratos no período.
   - Clique em Buscar. O resultado aparece na aba "Resultados".

3. MODO AUTOMÁTICO (Robô):
   - O robô roda sozinho a cada 6 horas (enquanto o "python app.py" estiver ligado).
   - Ele lê os destinos do arquivo: data/coletas_filtrado_iata.csv
   - Se achar preço abaixo do 'baseline', ele:
     a) Salva em data/resultados.csv
     b) Manda mensagem no seu Telegram.

4. VISUALIZAR OFERTAS:
   - Vá na aba "Resultados" do site.
   - Ofertas de HOJE aparecem no topo.
   - Ofertas antigas (mais de 48h) são escondidas automaticamente.

---
SOLUÇÃO DE PROBLEMAS COMUNS
---

ERRO: "Network Error" ou "Falha na comunicação com servidor" no site.
SOLUÇÃO: Você esqueceu de rodar o passo 1 (Python app.py). O site não funciona sem o cérebro.

ERRO: "Address already in use"
SOLUÇÃO: Tem um Python zumbi rodando. No terminal, digite:
taskkill /IM python.exe /F

ERRO: Autocomplete de destinos não funciona.
SOLUÇÃO: Verifique se o arquivo data/coletas_filtrado_iata.csv existe e está separado por ponto-e-vírgula (;).

=========================================================================
Desenvolvido por Rodrigo. Mantenha o código limpo! 🚀
=========================================================================