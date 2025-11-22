import os
import requests
from dotenv import load_dotenv

# Carrega as chaves do arquivo .env
load_dotenv()

TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')


def enviar_mensagem_telegram(mensagem):
    """
    Envia uma mensagem de texto para o seu Telegram.
    """
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("⚠️ Telegram não configurado no .env (Token ou ID faltando).")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": mensagem,
        "parse_mode": "Markdown",  # Permite usar negrito (*texto*)
        "disable_web_page_preview": True  # Deixa a msg mais limpa
    }

    try:
        response = requests.post(url, data=payload)
        if response.status_code != 200:
            print(f"⚠️ Erro Telegram ({response.status_code}): {response.text}")
    except Exception as e:
        print(f"❌ Erro de conexão com Telegram: {e}")