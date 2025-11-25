# -*- coding: utf-8 -*-
"""
Processador de textos promocionais (versão sem IA).
Usa apenas o parser Regex para extrair dados básicos.
A função /processar-texto permanece ativa, mas os modos
que dependiam de IA agora retornam mensagens amigáveis.
"""

import re
import unicodedata
import json
from datetime import datetime

# --- Imports do projeto ---
from backend.core_amadeus.rotator import amadeus_client
from backend.core_milhas.orquestrador_voos import gerar_link_google_flights, salvar_oferta_csv

# ============================================
# 🌎 MAPA IATA
# ============================================
IATA_MAP = {
    "fortaleza": "FOR", "são paulo": "GRU", "sao paulo": "GRU", "guarulhos": "GRU",
    "congonhas": "CGH", "campinas": "VCP", "rio de janeiro": "GIG", "galeão": "GIG",
    "santos dumont": "SDU", "salvador": "SSA", "recife": "REC", "maceió": "MCZ",
    "natal": "NAT", "buenos aires": "EZE", "miami": "MIA", "orlando": "MCO",
    "nova york": "JFK", "new york": "JFK", "lisboa": "LIS", "porto": "OPO",
    "madrid": "MAD", "barcelona": "BCN", "paris": "CDG", "londres": "LHR",
    "roma": "FCO", "milão": "MXP", "milao": "MXP", "amsterdã": "AMS",
    "dubai": "DXB",
}

MAPEAMENTO_COMPANHIAS = {
    "smiles": "gol",
    "tudoazul": "azul",
    "latam pass": "latam"
}

# ============================================
# 🔎 PARSER REGEX (RÁPIDO)
# ============================================
def extrair_detalhes(texto):
    texto_original = texto
    texto = texto.lower()
    texto_norm = unicodedata.normalize("NFKC", texto)

    # Fidelidade
    fidelidade = None
    for programa in MAPEAMENTO_COMPANHIAS:
        if programa in texto:
            fidelidade = programa
            break

    companhia = MAPEAMENTO_COMPANHIAS.get(fidelidade, "desconhecida")

    # Origem e destino
    padrao_origem = re.search(r"origem:\s*([\w\s]+)\s*\(([A-Z]{3})\)", texto_norm)
    padrao_destino = re.search(r"destino:\s*([\w\s]+)\s*\(([A-Z]{3})\)", texto_norm)

    if padrao_origem and padrao_destino:
        origem = padrao_origem.group(1).strip().title()
        destino = padrao_destino.group(1).strip().title()
    else:
        padrao_alt = re.search(
            r"([A-Za-zÀ-ú\s]+)\s*(?:➡️|→|->|–|—|>|⇒)\s*([A-Za-zÀ-ú\s]+)",
            texto_norm
        )
        if padrao_alt:
            origem = padrao_alt.group(1).strip().title()
            destino = padrao_alt.group(2).strip().title()
        else:
            origem = "Fortaleza"
            destino = None

    origem_iata = IATA_MAP.get(origem.lower(), "FOR")
    destino_iata = IATA_MAP.get(destino.lower(), destino.upper()) if destino else None

    # Milhas
    milhas = None
    texto_sem_pontos = texto.replace(".", "")
    match_milhas = re.search(r"(\d{1,3}(?:[.,]\d{1,3})?)\s*(?:mil)?\s*milhas", texto_sem_pontos)
    if match_milhas:
        milhas_str = match_milhas.group(1).replace(",", ".")
        milhas = float(milhas_str)
        if "mil" in match_milhas.group(0):
            milhas *= 1000

    if not milhas:
        match_k = re.search(r"(\d+)[kK]", texto)
        if match_k:
            milhas = float(match_k.group(1)) * 1000

    # Datas
    datas = []

    padrao_datas = re.search(r"(\d{1,2})\s*(?:a|-|até)\s*(\d{1,2})\s*(de\s+)?([a-zç]+)?", texto)
    if padrao_datas:
        dia_ini = int(padrao_datas.group(1))
        dia_fim = int(padrao_datas.group(2))
        mes_nome = padrao_datas.group(4)
        mes_num = converte_mes(mes_nome) if mes_nome else datetime.now().month
        ano = datetime.now().year
        for d in range(dia_ini, dia_fim + 1):
            datas.append(f"{ano}-{mes_num:02d}-{d:02d}")

    if not datas:
        datas.append(datetime.now().strftime("%Y-%m-%d"))

    if not destino_iata or not milhas:
        print("⚠️ Parser Regex: dados insuficientes.")
        return None

    return {
        "origem": origem_iata,
        "destino": destino_iata,
        "companhia": companhia,
        "milhas": milhas,
        "datas": datas,
    }


def converte_mes(nome_mes):
    meses = {
        "janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3, "abril": 4,
        "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9,
        "outubro": 10, "novembro": 11, "dezembro": 12
    }
    if not nome_mes:
        return None
    return meses.get(nome_mes.strip().lower())


# ============================================
# 🚫 FUNÇÕES QUE DEPENDIAM DE IA (AGORA DESATIVADAS)
# ============================================
def _converter_para_reais(texto: str):
    return {
        "sucesso": False,
        "tipo": "erro",
        "conteudo": "❌ O recurso de conversão por IA foi desativado no backend."
    }


def _reescrever_texto(texto: str):
    return {
        "sucesso": False,
        "tipo": "erro",
        "conteudo": "❌ O recurso de reescrita com IA foi desativado."
    }


# ============================================
# 🔌 FUNÇÃO PRINCIPAL
# ============================================
def processar_texto_promocional(texto: str, modo: str):
    if modo == "reais":
        return _converter_para_reais(texto)

    if modo == "reescrever":
        return _reescrever_texto(texto)

    return {"sucesso": False, "message": "Modo inválido."}
