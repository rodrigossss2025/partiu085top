# -*- coding: utf-8 -*-
"""
Processador de textos promocionais.
Combina o parser (extrator de milhas) com a busca em Reais (Amadeus).
E usa IA (Gemini) para leitura e reescrita.
"""

import re
import os
import unicodedata
import json
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

# --- Imports dos nossos módulos ---
from backend.core_amadeus.rotator import amadeus_client
from backend.core_milhas.orquestrador_voos import gerar_link_google_flights, salvar_oferta_csv

# --- CONFIGURAÇÃO DA IA CORRIGIDA ---
load_dotenv()
API_KEY_GEMINI = os.getenv("GEMINI_API_KEY")

try:
    if API_KEY_GEMINI:
        genai.configure(api_key=API_KEY_GEMINI)
    else:
        # Se a chave não for encontrada, a exceção será capturada no _extrair_dados_com_ia
        print("❌ Chave GEMINI_API_KEY não encontrada no .env. O Lab Milhas falhará.")
except Exception as e:
    print(f"⚠️ AVISO: Falha ao configurar a API Gemini. {e}")

# ============================================
# 🌎 MAPA IATA (Do seu código)
# ... (O restante do IATA_MAP é muito longo, mas deve continuar aqui) ...
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

# (O resto do seu código de parser Regex e funções auxiliares continua o mesmo)

# ============================================
# 🧩 FUNÇÃO PARSER (Regex - Rápido)
# ...
# (Mantenha todas as funções do seu parser Regex: extrair_detalhes, converte_mes, normaliza_data)
# ...
# ============================================
MAPEAMENTO_COMPANHIAS = {"smiles": "gol", "tudoazul": "azul", "latam pass": "latam"}


def extrair_detalhes(texto):
    # ... (Mantenha o corpo da função extrair_detalhes aqui)
    texto = texto.lower()
    fidelidade = None
    for programa in MAPEAMENTO_COMPANHIAS:
        if programa in texto:
            fidelidade = programa
            break
    companhia = MAPEAMENTO_COMPANHIAS.get(fidelidade, "desconhecida")
    origem = destino = None
    texto_norm = unicodedata.normalize("NFKC", texto)
    padrao_origem = re.search(r"origem:\s*([\w\s]+)\s*\(([A-Z]{3})\)", texto_norm, re.IGNORECASE)
    padrao_destino = re.search(r"destino:\s*([\w\s]+)\s*\(([A-Z]{3})\)", texto_norm, re.IGNORECASE)
    if not padrao_origem or not padrao_destino:
        padrao_alt = re.search(
            r"([A-Za-zÀ-ú\s]+)\s*(?:➡️|→|->|–|—|>|⇒)\s*([A-Za-zÀ-ú\s]+)",
            texto_norm, re.IGNORECASE
        )
        if padrao_alt:
            origem = padrao_alt.group(1).strip().title()
            destino = padrao_alt.group(2).strip().title()
    else:
        origem = padrao_origem.group(1).strip().title()
        destino = padrao_destino.group(1).strip().title()
    origem_iata = IATA_MAP.get(origem.lower(), "FOR") if origem else "FOR"
    destino_iata = IATA_MAP.get(destino.lower(), destino.upper()) if destino else None
    milhas = None
    texto_sem_pontos = texto.replace('.', '')
    match_milhas = re.search(r"(\d{1,3}(?:[.,]\d{1,3})?)\s*(?:mil)?\s*milhas", texto_sem_pontos)
    if match_milhas:
        milhas_str = match_milhas.group(1).replace(",", ".")
        milhas = float(milhas_str)
        if "mil" in match_milhas.group(0): milhas *= 1000
    if not milhas:
        match_milhas_k = re.search(r"(\d+)[kK]", texto)
        if match_milhas_k: milhas = float(match_milhas_k.group(1)) * 1000
    match_total = re.search(r"(\d{1,3}(?:[.,]\d{1,3}))\s*(?:mil)?\s*milhas.*ida.*volta", texto_sem_pontos)
    if match_total:
        milhas_total_str = match_total.group(1).replace(",", ".")
        milhas_total = float(milhas_total_str) * 1000
        milhas = milhas_total / 2
    datas = []
    padrao_datas_simples = re.search(r"(\d{1,2})\s*(?:a|-|até)\s*(\d{1,2})\s*(de\s+)?([a-zç]+)?", texto)
    if padrao_datas_simples:
        dia_ini, dia_fim = int(padrao_datas_simples.group(1)), int(padrao_datas_simples.group(2))
        mes_nome = padrao_datas_simples.group(4)
        mes_num = converte_mes(mes_nome) if mes_nome else datetime.now().month
        ano_atual = datetime.now().year
        for dia in range(dia_ini, dia_fim + 1): datas.append(f"{ano_atual}-{mes_num:02d}-{dia:02d}")
    padroes_mes = re.findall(r"([a-zç]+):\s*([\d,\s()]+)", texto)
    for mes_nome, dias_str in padroes_mes:
        mes_num = converte_mes(mes_nome)
        if not mes_num: continue
        dias = re.findall(r"\d{1,2}", dias_str)
        ano_atual = datetime.now().year
        for d in dias: datas.append(f"{ano_atual}-{mes_num:02d}-{int(d):02d}")
    ida = re.findall(r"ida:\s*([\d/]+)", texto);
    volta = re.findall(r"volta:\s*([\d/]+)", texto)
    padrao_intervalo = re.search(r"(\d{1,2}/\d{1,2}/\d{2,4})\s*[-–]\s*(\d{1,2}/\d{1,2}/\d{2,4})", texto)
    if padrao_intervalo:
        d1, d2 = normaliza_data(padrao_intervalo.group(1)), normaliza_data(padrao_intervalo.group(2))
        if d1 and d2: datas.extend([d1, d2])
    for d in ida + volta:
        normalizada = normaliza_data(d)
        if normalizada: datas.append(normalizada)
    datas = sorted(list(set(datas)))
    if not datas: datas.append(datetime.now().strftime("%Y-%m-%d"))
    if not (origem_iata and destino_iata and companhia and milhas and datas):
        print(f"⚠️ Parser Regex: Dados insuficientes.")
        return None
    return {"origem": origem_iata, "destino": destino_iata, "companhia": companhia, "milhas": milhas, "datas": datas}


def converte_mes(nome_mes):
    if not nome_mes: return None
    meses = {"janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3, "abril": 4, "maio": 5, "junho": 6, "julho": 7,
             "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12}
    return meses.get(nome_mes.strip().lower())


def normaliza_data(txt):
    if not txt: return None
    partes = re.findall(r"\d+", txt);
    ano_atual = datetime.now().year
    if len(partes) == 2:
        return f"{ano_atual}-{int(partes[1]):02d}-{int(partes[0]):02d}"
    elif len(partes) == 3:
        ano = int(partes[2]);
        ano = 2000 + ano if ano < 100 else ano
        return f"{ano}-{int(partes[1]):02d}-{int(partes[0]):02d}"
    return None


# ============================================
# 🤖 FUNÇÃO EXTRATORA (IA - Flexível)
# ============================================
def _extrair_dados_com_ia(texto: str):
    """Usa o Gemini para ler o texto e extrair dados estruturados (JSON)."""

    if not API_KEY_GEMINI:
        print("❌ Chave GEMINI_API_KEY não está ativa.")
        return None

    # 1. Define o modelo e o prompt
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    Sua única tarefa é analisar o texto de promoção de milhas abaixo e retornar um objeto JSON.
    O JSON DEVE conter EXATAMENTE os seguintes campos:
    1.  "origem_iata": O código IATA da origem. Se não for mencionado, use "FOR".
    2.  "destino_iata": O código IATA do destino. Tente inferir (ex: "Miami" -> "MIA", "Orlando" -> "MCO").
    3.  "milhas": O preço em milhas como um número (ex: 150000).
    4.  "data": A primeira data de voo válida encontrada (formato YYYY-MM-DD). Se nenhuma data for encontrada, use a data de hoje: {datetime.now().strftime("%Y-%m-%d")}.

    TEXTO PARA ANALISAR:
    "{texto}"

    Retorne APENAS o JSON.
    """

    # 2. Chama a IA
    response = None
    try:
        response = model.generate_content(prompt)

        # 3. Limpa e parseia a resposta JSON
        json_text = response.text.strip().replace("```json", "").replace("```", "")
        dados = json.loads(json_text)

        # 4. Garante a conversão de nomes de cidade para IATA (Dupla checagem)
        destino_raw = dados.get("destino_iata", "").lower()
        dados["destino_iata"] = IATA_MAP.get(destino_raw, destino_raw.upper())

        origem_raw = dados.get("origem_iata", "FOR").lower()
        dados["origem_iata"] = IATA_MAP.get(origem_raw, origem_raw.upper())

        print(f"🤖 IA extraiu: {dados}")
        return dados

    except Exception as e:
        print(f"❌ Erro na extração com IA (JSON): {e}")
        if response:
            print(f"Resposta bruta da IA: {response.text}")
        return None


# ============================================
# 🔌 NOSSAS FUNÇÕES DE PROCESSAMENTO
# ============================================

def _converter_para_reais(texto):
    """
    Função 1: Converte Milhas para Dinheiro (Botão Verde)
    AGORA USA O EXTRATOR DE IA.
    """
    print("Modo: Convertendo para Reais (com IA)...")

    # Sai Regex, Entra IA
    info = _extrair_dados_com_ia(texto)

    if not info:
        return {"sucesso": False, "tipo": "erro",
                "conteudo": "A IA não conseguiu ler os dados. Tente um texto mais claro."}

    try:
        data_para_buscar = info["data"]
        origem = info.get("origem_iata", "FOR")
        destino = info.get("destino_iata")
        milhas = info.get("milhas", 0)
    except KeyError:
        return {"sucesso": False, "tipo": "erro",
                "conteudo": "IA retornou dados incompletos (ex: faltou destino ou data)."}

    print(f"Buscando voo em R$: {origem} -> {destino} em {data_para_buscar}")

    voos = amadeus_client.buscar_voo_exato(origem, destino, data_para_buscar)

    if not voos:
        return {"sucesso": False, "tipo": "erro",
                "conteudo": f"Nenhum voo em R$ encontrado no Amadeus para {destino} em {data_para_buscar}."}

    try:
        voo_real = voos[0]
        preco_real = float(voo_real['price']['grandTotal'])
        moeda = voo_real['price']['currency']
        link = gerar_link_google_flights(origem, destino, data_para_buscar)

        oferta_card = {
            "origem": origem,
            "destino": destino,
            "data": data_para_buscar,
            "preco": preco_real,
            "moeda": moeda,
            "link": link,
            "modo": "MILHAS (R$)",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "baseline": milhas
        }

        salvar_oferta_csv(oferta_card)
        return {"sucesso": True, "tipo": "voo", "conteudo": oferta_card}
    except Exception as e:
        print(f"Erro ao montar card: {e}")
        return {"sucesso": False, "tipo": "erro", "conteudo": str(e)}


def _reescrever_texto(texto):
    """
    Função 2: Altera o texto de Milhas (Botão Azul)
    Usa o parser Regex (rápido) e a IA (criativa).
    """
    print("Modo: Reescrevendo texto (com IA)...")

    # 1. Usa o parser RÁPIDO (Regex)
    info = extrair_detalhes(texto)
    if not info:
        return {"sucesso": False, "tipo": "erro",
                "conteudo": "Não consegui extrair dados do texto. A IA precisa de um mínimo de contexto."}

    # 2. Define a "personalidade" do robô
    SYSTEM_PROMPT = (
        "Você é o 'Partiu085', o melhor redator de promoções de passagens aéreas de Fortaleza, Ceará. "
        "Sua voz é jovem, divertida, empolgada e usa gírias cearenses. "
        "Seja direto e use muitos emojis ✈️🔥🚀. "
        "Sempre comece com um chamado de impacto (Ex: 🔥 OFERTA ARRETADA! 🔥) e termine com uma chamada para ação (Ex: 🏃‍♂️ Cuida, que acaba rápido!). "
        "Nunca use hashtags. Seja informal."
    )

    # 3. Monta o prompt para a IA
    prompt_final = (
        f"{SYSTEM_PROMPT}\n\n"
        f"--- TAREFA ---\n"
        f"Reescreva o seguinte texto promocional com a sua voz e personalidade. "
        f"Mantenha os fatos principais (destino, preço em milhas, datas) intactos.\n\n"
        f"--- TEXTO ORIGINAL (Para reescrever) ---\n"
        f"{texto}"
    )

    # 4. Chama a API Gemini
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt_final)

        novo_texto = response.text
        return {"sucesso": True, "tipo": "texto", "conteudo": novo_texto}

    except Exception as e:
        print(f"❌ Erro na API Gemini: {e}")
        return {"sucesso": False, "tipo": "erro",
                "conteudo": f"Erro ao contatar a IA. Verifique sua GEMINI_API_KEY ou a cota de uso."}


def processar_texto_promocional(texto, modo):
    if modo == 'reais':
        return _converter_para_reais(texto)
    elif modo == 'reescrever':
        return _reescrever_texto(texto)
    else:
        return {"sucesso": False, "message": "Modo inválido"}