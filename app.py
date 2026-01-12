# -*- coding: utf-8 -*-
"""Aplicação Flask principal — Partiu085 FULL
Versão FINAL corrigida (execução manual protegida + fallback automático)
"""

from __future__ import annotations

import uuid
import csv
import os
import threading
import sys
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# ------------------------------------------------------
# 1. CONFIGURAÇÃO E AMBIENTE
# ------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path=DOTENV_PATH)


def log_info(msg):
    print(f"[{datetime.now()}] {msg}", flush=True)


log_info("🚀 SERVIDOR INICIADO (Lendo resultados_v2.csv)")

if not os.getenv('TELEGRAM_TOKEN'):
    log_info("⚠️ AVISO: TELEGRAM_TOKEN não encontrado.")

# ------------------------------------------------------
# 2. IMPORTAÇÕES
# ------------------------------------------------------
try:
    from backend.core_milhas.orquestrador_voos import executar_fluxo_voos, carregar_destinos_csv
    from backend.agendador_front.notificacoes import enviar_mensagem_telegram, enviar_oferta_telegram
    from backend.core_amadeus.rotator import AmadeusRotator
    from backend.agendador_front import scheduler
    from backend.agendador_front.scheduler import executar_agora
    from backend.core_milhas.processador_texto import processar_texto_promocional
except ImportError as e:
    log_info(f"🚨 Erro crítico de importação: {e}")
    sys.exit(1)

# ------------------------------------------------------
# 3. SETUP FLASK E DIRETÓRIOS
# ------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

RESULTADOS_CSV = os.path.join(DATA_DIR, "resultados_v2.csv")
ALERTAS_CSV_PATH = os.path.join(DATA_DIR, "alertas_fixos.csv")
DESTINOS_CSV_PATH = os.path.join(DATA_DIR, "coletas_filtrado_iata.csv")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

from backend.api.log_buffer import add_log
from backend.api.logs_execucao import bp_logs

app.register_blueprint(bp_logs)


# ------------------------------------------------------
# 4. AGENDADOR (opcional — pode permanecer inativo)
# ------------------------------------------------------
def start_scheduler():
    try:
        log_info("⚙️ Iniciando agendador...")
        scheduler.iniciar_agendador()
        log_info("✅ Agendador ativo.")
    except Exception as e:
        log_info(f"🚨 Erro agendador: {e}")


if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
    threading.Thread(target=start_scheduler, daemon=True).start()

# Flag de execução manual protegida
EXECUCAO_EM_ANDAMENTO = False

# ------------------------------------------------------
# 5. FUNÇÕES UTILITÁRIAS
# ------------------------------------------------------
def _ler_resultados() -> List[Dict[str, Any]]:
    if os.path.exists(RESULTADOS_CSV):
        try:
            with open(RESULTADOS_CSV, "r", encoding="utf-8") as f:
                return list(csv.DictReader(f))
        except Exception as e:
            log_info(f"⚠️ Erro ao ler CSV de resultados: {e}")
    return []


def _ler_alertas() -> List[Dict[str, Any]]:
    if not os.path.exists(ALERTAS_CSV_PATH):
        return []
    try:
        with open(ALERTAS_CSV_PATH, mode='r', encoding='utf-8') as f:
            return list(csv.DictReader(f))
    except Exception:
        return []


def _salvar_alertas(alertas: List[Dict[str, Any]]):
    colunas = ['id', 'origem', 'destino', 'data_ida', 'data_volta', 'preco_alvo']
    try:
        with open(ALERTAS_CSV_PATH, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=colunas)
            writer.writeheader()
            writer.writerows(alertas)
    except Exception as e:
        log_info(f"Erro salvar alertas: {e}")


def _resumo_status_radar() -> Dict[str, Any]:
    caminho_json = os.path.join(DATA_DIR, "resultados.json")

    if not os.path.exists(caminho_json):
        return {"total_registros": 0, "ultima_atualizacao": None}

    try:
        with open(caminho_json, "r", encoding="utf-8") as f:
            dados = json.load(f)

        lista = (
            dados.get("results")
            or dados.get("resultados")
            or dados.get("lista")
            or dados.get("ofertas")
            or []
        )

        ultima = lista[-1].get("timestamp") if lista else None

        return {"total_registros": len(lista), "ultima_atualizacao": ultima}

    except Exception as e:
        log_info(f"Erro lendo status do radar: {e}")
        return {"total_registros": 0, "ultima_atualizacao": None}


# ------------------------------------------------------
# 6. ROTAS DA API
# ------------------------------------------------------

@app.route("/api/destinos", methods=["GET"])
def api_destinos():
    caminho = DESTINOS_CSV_PATH

    if not os.path.exists(caminho):
        return jsonify({"success": False, "destinos": []})

    destinos = []
    with open(caminho, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            destinos.append(
                {
                    "iata": row.get("iata", "").upper(),
                    "cidade": row.get("cidade", ""),
                    "pais": row.get("pais", ""),
                }
            )

    return jsonify({"success": True, "destinos": destinos})


@app.route("/destinos", methods=["GET"])
def destinos_sem_prefixo():
    return api_destinos()


@app.route("/")
def raiz():
    return jsonify({"status": "online", "app": "Partiu085 V2"})


# ------------------------------------------------------
# EXECUÇÃO MANUAL — com fallback automático
# ------------------------------------------------------
@app.route("/api/executar", methods=["POST"])
def api_executar():
    global EXECUCAO_EM_ANDAMENTO

    if EXECUCAO_EM_ANDAMENTO:
        return jsonify({
            "success": False,
            "message": "⚠️ Já existe uma busca em andamento"
        }), 409

    data = request.get_json(force=True, silent=True) or {}
    modo = data.get("modo", "MANUAL")
    destinos = data.get("destinos") or []
    data_ida = data.get("data_ida")
    data_volta = data.get("data_volta")

    # 🟢 FALLBACK — nenhum destino enviado → usa CSV e vira AUTO
    if not destinos:
        log_info("🔁 Nenhum destino recebido — usando lista padrão do CSV")
        try:
            destinos_csv = carregar_destinos_csv()
            destinos = [d["destino"] for d in destinos_csv]
            modo = "AUTO"
            log_info(f"✔ Destinos fallback carregados: {len(destinos)}")
        except Exception as e:
            log_info(f"❌ Erro ao carregar destinos fallback: {e}")
            destinos = []

    log_info(f"🔔 Execução iniciada | modo={modo} | destinos={len(destinos)}")

    EXECUCAO_EM_ANDAMENTO = True

    def _background_job():
        global EXECUCAO_EM_ANDAMENTO
        try:
            executar_fluxo_voos(
                modo=modo,
                destinos_personalizados=destinos,
                data_ida=data_ida,
                data_volta=data_volta,
            )
            log_info("✅ Busca finalizada e salva no CSV")
        except Exception as exc:
            log_info(f"🚨 Erro fatal: {exc}")
        finally:
            EXECUCAO_EM_ANDAMENTO = False
            log_info("🔚 Execução liberada")

    threading.Thread(target=_background_job, daemon=True).start()
    return jsonify({"success": True, "message": "🚀 Busca iniciada."})


@app.route("/api/status_execucao", methods=["GET"])
def api_status_execucao():
    return jsonify({"em_andamento": EXECUCAO_EM_ANDAMENTO})


@app.route("/api/resultados", methods=["GET"])
def api_resultados():
    caminho_json = os.path.join(DATA_DIR, "resultados.json")
    if os.path.exists(caminho_json):
        try:
            with open(caminho_json, "r", encoding="utf-8") as f:
                dados = json.load(f)

            lista = (
                dados.get("results")
                or dados.get("resultados")
                or dados.get("lista")
                or dados.get("ofertas")
                or []
            )

            return jsonify({"success": True, "results": lista})
        except Exception as e:
            log_info(f"⚠️ Erro lendo resultados.json: {e}")

    try:
        linhas = _ler_resultados()
        return jsonify({"success": True, "results": linhas})
    except Exception as e:
        log_info(f"🚨 Erro /api/resultados (CSV): {e}")
        return jsonify({"success": False, "results": [], "error": str(e)}), 500


@app.route("/api/status_radar", methods=["GET"])
def api_status_radar():
    info = _resumo_status_radar()
    return jsonify(
        {
            "total_registros": info.get("total_registros", 0),
            "ultima_execucao": info.get("ultima_atualizacao"),
        }
    )

# --- Alertas ---
@app.route("/api/alertas", methods=["GET", "POST"])
def api_alertas():
    if request.method == "POST":
        data = request.get_json()
        alertas = _ler_alertas()
        novo = {
            "id": str(uuid.uuid4())[:8],
            "origem": "FOR",
            "destino": data["destino"],
            "data_ida": data["data_ida"],
            "data_volta": data.get("data_volta", ""),
            "preco_alvo": data["preco_alvo"],
        }
        alertas.append(novo)
        _salvar_alertas(alertas)
        return jsonify({"success": True})

    return jsonify({"success": True, "alertas": _ler_alertas()})


@app.route("/api/alertas/<id>", methods=["DELETE"])
def api_del_alerta(id):
    _salvar_alertas([a for a in _ler_alertas() if a["id"] != id])
    return jsonify({"success": True})


@app.route("/api/test_telegram", methods=["POST"])
def api_test_telegram():
    try:
        enviar_mensagem_telegram("Test OK")
        return jsonify({"success": True})
    except Exception:
        return jsonify({"success": False}), 500


@app.route("/api/telegram/oferta", methods=["POST"])
def api_enviar_oferta_telegram():
    try:
        oferta = request.json
        enviar_oferta_telegram(oferta)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/test_amadeus", methods=["POST"])
def api_test_amadeus():
    try:
        token = AmadeusRotator("AUTO").get_token()
        return jsonify({"success": True, "token": token[:10] if token else None})
    except Exception:
        return jsonify({"success": False}), 500


@app.route("/api/processar-texto", methods=["POST"])
def api_processar():
    d = request.get_json()
    return jsonify(processar_texto_promocional(d.get("texto"), d.get("modo")))


@app.route("/api/agendador/agora", methods=["POST"])
def api_agendador_agora():
    resultado = executar_agora()
    return jsonify(resultado)


EXEC_LOGS = []

def add_log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    EXEC_LOGS.append(line)

    # limita histórico para evitar memória infinita
    if len(EXEC_LOGS) > 500:
        EXEC_LOGS.pop(0)



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
