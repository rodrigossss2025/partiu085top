# -*- coding: utf-8 -*-
"""Aplicação Flask principal — Partiu085 FULL
Versão FINAL corrigida
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
    from backend.core_milhas.orquestrador_voos import executar_fluxo_voos
    from backend.agendador_front.notificacoes import enviar_mensagem_telegram, enviar_oferta_telegram
    from backend.core_amadeus.rotator import AmadeusRotator
    #import backend.config_agendador as config_agendador
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

# ------------------------------------------------------
# 4. AGENDADOR (BACKGROUND)
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

# ------------------------------------------------------
# 5. FUNÇÕES UTILITÁRIAS
# ------------------------------------------------------
def _ler_resultados() -> List[Dict[str, Any]]:
    """Lê o CSV principal de resultados (resultados_v2.csv)."""
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
        return {
            "total_registros": 0,
            "ultima_atualizacao": None
        }

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

        return {
            "total_registros": len(lista),
            "ultima_atualizacao": ultima
        }
    except Exception as e:
        print("Erro lendo status do radar:", e)
        return {
            "total_registros": 0,
            "ultima_atualizacao": None
        }


# ------------------------------------------------------
# 6. ROTAS DA API
# ------------------------------------------------------


@app.route("/api/destinos", methods=["GET"])
def api_destinos():
    """Nova rota oficial de destinos (usada pelo front novo)."""
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
    """
    Rota de compatibilidade.

    O frontend em produção está chamando
    https://partiu085-api.onrender.com/destinos

    Para não quebrar nada, espelhamos /api/destinos aqui.
    """
    return api_destinos()


@app.route("/")
def raiz():
    return jsonify({"status": "online", "app": "Partiu085 V2"})


@app.route("/api/executar", methods=["POST"])
def api_executar():
    data = request.get_json(force=True, silent=True) or {}
    modo = data.get("modo", "MANUAL")
    destinos = data.get("destinos") or []
    data_ida = data.get("data_ida")
    data_volta = data.get("data_volta")
    print("📩 DEBUG FRONTEND → BACKEND")
    print("destinos recebidos:", destinos)
    print("data_ida recebida:", data_ida)
    print("data_volta recebida:", data_volta)

    log_info(f"🔔 Busca Iniciada: {destinos}")

    def _background_job():
        try:
            log_info("✈️ Executando orquestrador...")
            executar_fluxo_voos(
                modo=modo,
                destinos_personalizados=destinos,
                data_ida=data_ida,
                data_volta=data_volta,
            )
            log_info("✅ Busca finalizada no CSV v2!")

        except Exception as exc:
            log_info(f"🚨 Erro fatal: {exc}")

    threading.Thread(target=_background_job, daemon=True).start()
    return jsonify({"success": True, "message": "Busca iniciada."})


@app.route("/api/resultados", methods=["GET"])
def api_resultados():
    """
    Retorna os resultados para o frontend.

    - Primeiro tenta usar data/resultados.json (formato novo, se existir).
    - Se não encontrar ou der erro, faz fallback para resultados_v2.csv,
      que é o arquivo usado hoje pelo orquestrador.
    """
    # 1) Tenta JSON "novo"
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

    # 2) Fallback: CSV v2
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



if __name__ == "__main__":
    app.run(debug=True, port=5000)
    app.run(host="0.0.0.0", port=port)


