from apscheduler.schedulers.background import BackgroundScheduler
from backend.core_milhas.orquestrador_voos import executar_fluxo_voos
import atexit
from datetime import datetime, timedelta

# 🔕 Telegram agora é manual pelo ResultsPage
# from backend.agendador_front.notificacoes import enviar_mensagem_telegram

# --- Imports para o antigo Robô Sniper ---
import csv
import os

_scheduler = None

DIRETORIO_BASE = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
ALERTAS_CSV_PATH = os.path.join(DIRETORIO_BASE, 'data', "alertas_fixos.csv")


def _ler_alertas_job():
    if not os.path.exists(ALERTAS_CSV_PATH):
        return []
    try:
        with open(ALERTAS_CSV_PATH, mode='r', encoding='utf-8') as f:
            return list(csv.DictReader(f))
    except Exception:
        return []


# ========================= JOBS =========================

def job_robo_automatico():
    """
    🚫 DESATIVADO — operação agora é manual.
    (mantido apenas por compatibilidade futura)
    """
    print("⚠️ Robô Automático ignorado — modo manual ativo.")


def job_robo_sniper():
    """
    🚫 DESATIVADO — envio automático para Telegram removido.
    As ofertas agora aparecem no site e o envio é manual pelo usuário.
    """
    print("⚠️ Sniper ignorado — modo manual ativo.")


def job_robo_agora():
    """⚡ Execução manual solicitada pelo painel."""
    print("⚡ [AGORA] Execução manual iniciada...")

    try:
        resultado = executar_fluxo_voos(modo="AUTO")
        print("⚡ [AGORA] Execução manual finalizada.")
        return {
            "success": True,
            "message": "Execução manual concluída.",
            "resultado": resultado
        }
    except Exception as e:
        print(f"❌ Erro na execução manual: {e}")
        return {"success": False, "message": str(e)}


def executar_agora():
    print("⚡ Solicitado: Rodar Agendador Agora.")
    return job_robo_agora()


# ========================= AGENDADOR =========================

def iniciar_agendador():
    """
    Agendador agora sobe sem jobs automáticos.
    (mantemos a estrutura ativa apenas por compatibilidade)
    """
    global _scheduler

    if _scheduler and _scheduler.running:
        return {"success": False, "message": "Agendador já está rodando."}

    _scheduler = BackgroundScheduler()

    # 🚫 Nenhum job automático é adicionado
    print("⏰ Agendador iniciado (modo manual — sem jobs automáticos).")

    _scheduler.start()
    atexit.register(lambda: _scheduler.shutdown())

    return {"success": True, "message": "Agendador iniciado (modo manual)."}


def pausar_agendador():
    global _scheduler
    if not _scheduler:
        return {"success": False, "message": "Agendador não iniciado."}

    _scheduler.pause()
    print("⏸️ Agendador pausado.")
    return {"success": True, "status": "pausado"}


def status_agendador():
    global _scheduler
    return {
        "ativo": bool(_scheduler),
        "status": "manual",
        "proxima_execucao": "Somente quando acionado",
    }
