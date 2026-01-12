# -*- coding: utf-8 -*-
import os
import requests
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


# ================= ENVIO BÁSICO =================

def enviar_mensagem_telegram(mensagem: str):
    """
    Envia mensagem para o Telegram **somente quando chamado manualmente**.
    (não existe envio automático no orquestrador)
    """

    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("⚠️ Telegram não configurado.")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": mensagem,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True,
    }

    print("📨 Enviando mensagem manual para o Telegram...")

    try:
        requests.post(url, data=payload, timeout=10)
        print("✅ Mensagem enviada")
    except Exception as e:
        print(f"❌ Erro Telegram: {e}")


# ================= FORMATAÇÃO =================

def _formatar_data_br(data_iso: str) -> str:
    try:
        return datetime.strptime(data_iso, "%Y-%m-%d").strftime("%d/%m/%Y")
    except:
        return data_iso


def _formatar_preco_br(valor: float) -> str:
    return (
        f"R$ {valor:,.2f}"
        .replace(",", "X")
        .replace(".", ",")
        .replace("X", ".")
    )


def gerar_link_google_flights_curto(origem: str, destino: str) -> str:
    return (
        "https://www.google.com/travel/flights/search"
        f"?q=Flights%20from%20{origem}%20to%20{destino}&curr=BRL"
    )


def formatar_oferta_telegram(oferta: dict) -> str:
    origem = oferta.get("origem")
    destino = oferta.get("destino")

    origem_nome = oferta.get("origem_nome") or origem
    destino_nome = oferta.get("destino_nome") or destino

    ida = _formatar_data_br(oferta.get("data_ida", ""))
    volta_raw = oferta.get("data_volta")
    volta = _formatar_data_br(volta_raw) if volta_raw else None

    preco = _formatar_preco_br(float(oferta.get("preco", 0)))

    baseline = oferta.get("baseline")
    variacao = oferta.get("variacao_percentual")
    status = oferta.get("status")  # bom, excelente, normal, alto

    # emojis por status
    status_map = {
        "excelente": "🔥 Oferta Excelente",
        "bom": "🟢 Oferta Boa",
        "normal": "⚪ Preço na média",
        "alto": "🔺 Acima da média"
    }

    status_txt = status_map.get(status, "ℹ️ Preço analisado")

    link = gerar_link_google_flights_curto(origem, destino)

    texto = (
        "💰✈️ *Alerta Promocional — Partiu 085!*\n\n"
        f"📍 *Origem:* {origem} - {origem_nome}\n"
        f"🎯 *Destino:* {destino} - {destino_nome}\n\n"
        f"📅 *Ida:* {ida}\n"
    )

    if volta:
        texto += f"📅 *Volta:* {volta}\n"

    texto += f"\n💰 *Preço total (ida + volta):* {preco}\n"

    if baseline and variacao:
        texto += (
            f"📉 *Preço médio histórico:* {_formatar_preco_br(float(baseline))}\n"
            f"📊 *Variação:* {variacao}%\n"
        )

    texto += f"{status_txt}\n\n"
    texto += f"🔗 *Confirmar no Google Flights:*\n{link}\n\n"
    texto += "🌵 _Partiu 085 — De Fortaleza para o mundo!_ 🌎"

    return texto



# ================= ENVIO MANUAL =================

def enviar_oferta_telegram(oferta: dict):
    """
    🚫 Envio automático desativado.
    🟢 Esta função agora é usada **somente**
    quando o usuário clicar no botão do ResultsPage.
    """
    mensagem = formatar_oferta_telegram(oferta)
    enviar_mensagem_telegram(mensagem)
