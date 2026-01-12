# -*- coding: utf-8 -*-
import os
import csv
import requests
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# ================= CARREGAR IATA → CIDADE =================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CSV_IATA = os.path.join(BASE_DIR, "data", "coletas_filtrado_iata.csv")

IATA_MAP = {}

try:
    with open(CSV_IATA, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            iata = row.get("IATA", "").strip().upper()
            nome = row.get("NOME", "").strip()
            if iata and nome:
                IATA_MAP[iata] = nome
    print(f"📍 IATA carregados: {len(IATA_MAP)}")
except Exception as e:
    print("❌ Erro ao carregar CSV de IATA:", e)


def nome_aeroporto(iata: str) -> str:
    return IATA_MAP.get(iata.upper(), iata)


# ================= ENVIO BÁSICO =================

def enviar_mensagem_telegram(mensagem: str):
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

    try:
        requests.post(url, data=payload, timeout=10)
        print("✅ Telegram enviado")
    except Exception as e:
        print(f"❌ Erro Telegram: {e}")


# ================= FORMATADORES =================

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


# ================= TEXTO TELEGRAM =================

def formatar_oferta_telegram(oferta: dict) -> str:
    origem_iata = oferta.get("origem", "")
    destino_iata = oferta.get("destino", "")

    origem_nome = nome_aeroporto(origem_iata)
    destino_nome = nome_aeroporto(destino_iata)

    ida = _formatar_data_br(oferta.get("data_ida", ""))
    volta_raw = oferta.get("data_volta")
    volta = _formatar_data_br(volta_raw) if volta_raw else None

    preco = _formatar_preco_br(float(oferta.get("preco", 0)))

    link = gerar_link_google_flights_curto(origem_iata, destino_iata)

    texto = (
        "💰 ✈️ *Alerta de Oportunidade | Partiu 085*\n\n"
        f"📍 *Origem:* {origem_iata} - {origem_nome}\n"
        f"🎯 *Destino:* {destino_iata} - {destino_nome}\n\n"
        f"📅 *Ida:* {ida}\n"
    )

    if volta:
        texto += f"📅 *Volta:* {volta}\n"

    texto += (
        f"\n💰 *Preço total:* {preco}\n\n"
        f"🔗 {link}\n\n"
        "🌵 *Partiu 085!* — De Fortaleza para o mundo 🌎"
    )

    return texto


# ================= ENVIO MANUAL =================

def enviar_oferta_telegram(oferta: dict):
    mensagem = formatar_oferta_telegram(oferta)
    enviar_mensagem_telegram(mensagem)
