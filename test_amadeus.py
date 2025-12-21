from dotenv import load_dotenv
load_dotenv()


import os
import requests

def testar_chave(nome, base_url, client_id, client_secret):
    print("\n==============================")
    print(f"🔑 Testando: {nome}")
    print(f"🌐 URL: {base_url}")

    url = f"{base_url}/v1/security/oauth2/token"

    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    r = requests.post(url, data=data, headers=headers)

    print("STATUS:", r.status_code)
    print("RESPOSTA:", r.text)


# =========================================
# CARREGANDO SUAS VARIÁVEIS (EXATAS DO PRINT)
# =========================================

CHAVES = [
    {
        "nome": "LOGIN_1 (Agendador / Programada)",
        "base_url": "https://api.amadeus.com",
        "client_id": os.getenv("AMADEUS_API_KEY_1"),
        "client_secret": os.getenv("AMADEUS_API_SECRET_1"),
    },
    {
        "nome": "LOGIN_2 (Manual)",
        "base_url": "https://api.amadeus.com",
        "client_id": os.getenv("AMADEUS_API_KEY_2"),
        "client_secret": os.getenv("AMADEUS_API_SECRET_2"),
    },
    {
        "nome": "LOGIN_3 (Extra)",
        "base_url": "https://api.amadeus.com",
        "client_id": os.getenv("AMADEUS_API_KEY_3"),
        "client_secret": os.getenv("AMADEUS_API_SECRET_3"),
    },
]

# =========================================
# EXECUÇÃO
# =========================================

for chave in CHAVES:
    if not chave["client_id"] or not chave["client_secret"]:
        print(f"\n❌ {chave['nome']} → VARIÁVEL NÃO CARREGADA")
        continue

    testar_chave(
        chave["nome"],
        chave["base_url"],
        chave["client_id"],
        chave["client_secret"]
    )
