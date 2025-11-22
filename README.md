# Partiu085 FULL (backend simplificado)

Este pacote contém uma versão **mínima e funcional** do backend em Flask
para o projeto Partiu085, preparada para ser integrada a um frontend moderno
(React / layout do promptpartiu).

## Como usar no PyCharm

1. Crie um ambiente virtual na raiz do projeto:

   ```bash
   python -m venv .venv
   ```

2. Ative o ambiente virtual:

   - Windows:

     ```bash
     .venv\Scripts\activate
     ```

3. Instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```

4. Crie um arquivo `.env` na raiz (pode copiar de `.env.example`).

5. Execute a aplicação:

   ```bash
   python app.py
   ```

6. Acesse no navegador:

   - Backend básico: http://localhost:5000/
   - API de resultados: http://localhost:5000/api/resultados

## Observações

- O módulo `backend/core_milhas/orquestrador_voos.py` gera registros de exemplo
  em `data/resultados.csv` sempre que a rota `/api/executar` é chamada.
- A integração com Telegram é opcional: se as variáveis não estiverem
  definidas no `.env`, as mensagens serão apenas impressas no console.
- O módulo `backend/core_amadeus/rotator.py` retorna um token fictício apenas
  para validar a integração de painel (sem chamadas reais à API Amadeus).

Você pode acoplar o frontend React (layout do promptpartiu) consumindo os
endpoints disponíveis em `/api/*`.
