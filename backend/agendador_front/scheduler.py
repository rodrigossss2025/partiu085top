from apscheduler.schedulers.background import BackgroundScheduler
from backend.core_milhas.orquestrador_voos import executar_fluxo_voos
import atexit
from datetime import datetime, timedelta

# --- Imports para o novo Robô Sniper ---
import csv
import os
from backend.core_amadeus.rotator import amadeus_client
from backend.agendador_front.notificacoes import enviar_mensagem_telegram

_scheduler = None

# Define o caminho do arquivo de alertas
DIRETORIO_BASE = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
ALERTAS_CSV_PATH = os.path.join(DIRETORIO_BASE, 'data', "alertas_fixos.csv")


def _ler_alertas_job():
    """Função de leitura de alertas para o Job."""
    if not os.path.exists(ALERTAS_CSV_PATH):
        return []
    try:
        with open(ALERTAS_CSV_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
    except Exception:
        return []


def job_robo_automatico():
    """JOB 1: (O "Mão-de-Vaca") Busca promoções do CSV principal."""
    print("--- ⏰ Iniciando Job 1: Robô Automático (Promoções Cache) ---")
    executar_fluxo_voos(modo="AUTO")
    print("--- 🏁 Job 1 Finalizado ---")


def job_robo_sniper():
    """JOB 2: (O "Sniper") Busca os Alertas Fixos salvos."""
    print("--- ⏰ Iniciando Job 2: Robô Sniper (Alertas Fixos) ---")
    alertas = _ler_alertas_job()
    if not alertas:
        print("🎯 Sniper: Nenhum alerta fixo para checar.")
        return

    for alerta in alertas:
        try:
            origem = alerta['origem']
            destino = alerta['destino']
            data_ida = alerta['data_ida']
            preco_alvo = float(alerta['preco_alvo'])

            print(f"🎯 Sniper: Checando {origem}→{destino} em {data_ida} (Alvo: R$ {preco_alvo})")

            # Faz a busca real-time
            voos = amadeus_client.buscar_voo_exato(origem, destino, data_ida)

            if not voos:
                continue  # Nenhum voo encontrado para essa data

            # Pega o mais barato do dia
            preco_real = float(voos[0]['price']['grandTotal'])

            # A CONDIÇÃO DE VITÓRIA
            if preco_real <= preco_alvo:
                print(f"💥 BINGO! Preço encontrado R$ {preco_real}")

                msg = (
                    f"🎯 *ALERTA DE PREÇO ATINGIDO!* 🎯\n\n"
                    f"✈️ *{origem} ➔ {destino}*\n"
                    f"📅 Data Ida: {data_ida}\n"
                    f"💰 *Preço Encontrado: R$ {preco_real:.2f}*\n"
                    f"📉 (Seu Alvo era: R$ {preco_alvo:.0f})\n\n"
                    f"🏃‍♂️ Cuida!! O preço pode subir!"
                )
                enviar_mensagem_telegram(msg)

        except Exception as e:
            print(f"Erro ao processar sniper (alerta {alerta.get('id')}): {e}")

    print("--- 🏁 Job 2 Finalizado ---")


def job_robo_agora():
    """JOB 3: Execução manual do robô (rodar agora)."""
    print("⚡ [AGORA] Execução manual iniciada...")

    try:
        # Usa o mesmo modo do Robô Automático (modo leve)
        resultado = executar_fluxo_voos(modo="AUTO")

        print("⚡ [AGORA] Execução manual finalizada.")
        return {
            "success": True,
            "message": "Execução manual concluída.",
            "resultado": resultado
        }
    except Exception as e:
        print(f"❌ Erro na execução manual: {e}")
        return {
            "success": False,
            "message": f"Erro ao executar manualmente: {e}"
        }


def executar_agora():
    """Função pública para chamar o robô manualmente."""
    print("⚡ Solicitado: Rodar Agendador Agora.")
    return job_robo_agora()


def iniciar_agendador():
    """Inicia os dois agendadores (chamado pela sua SettingsPage)."""
    global _scheduler

    if _scheduler and _scheduler.running:
        return {"success": False, "message": "Agendador já está rodando."}

    _scheduler = BackgroundScheduler()

    # JOB 1 (Mão-de-vaca): Roda a cada 6 horas
    _scheduler.add_job(
        func=job_robo_automatico,
        trigger="interval",
        hours=6,
        id="job_busca_auto",
        next_run_time=datetime.now()  # Roda agora na primeira vez
    )

    # JOB 2 (Sniper): Roda a cada 6 horas (com delay de 5 min)
    _scheduler.add_job(
        func=job_robo_sniper,
        trigger="interval",
        hours=6,
        id="job_busca_sniper",
        next_run_time=datetime.now() + timedelta(minutes=5)  # Roda 5 min depois
    )

    _scheduler.start()
    atexit.register(lambda: _scheduler.shutdown())

    print("⏰ Agendador Duplo (Auto + Sniper) iniciado.")
    return {"success": True, "message": "Agendadores iniciados."}


def pausar_agendador():
    """Pausa ou retoma o agendador (chamado pela sua SettingsPage)."""
    global _scheduler
    if not _scheduler: return {"success": False, "message": "Agendador não iniciado."}

    # Verifica o estado (1 = Rodando, 2 = Pausado)
    if _scheduler.state == 1:
        _scheduler.pause()
        print("⏸️ Agendador PAUSADO.")
        return {"success": True, "status": "pausado", "message": "Agendador pausado."}
    else:
        _scheduler.resume()
        print("▶️ Agendador RETOMADO.")
        return {"success": True, "status": "ativo", "message": "Agendador retomado."}


def status_agendador():
    """Retorna status para o painel de Config (compatível com a sua página)."""
    global _scheduler
    status_str = "parado"
    proxima_auto = "N/A"
    proxima_sniper = "N/A"

    if _scheduler:
        if _scheduler.state == 1:
            status_str = "ativo"
        elif _scheduler.state == 2:
            status_str = "pausado"

        job_auto = _scheduler.get_job("job_busca_auto")
        if job_auto and job_auto.next_run_time:
            proxima_auto = job_auto.next_run_time.strftime("%d/%m/%Y %H:%M:%S")

        job_sniper = _scheduler.get_job("job_busca_sniper")
        if job_sniper and job_sniper.next_run_time:
            proxima_sniper = job_sniper.next_run_time.strftime("%d/%m/%Y %H:%M:%S")

    return {
        "ativo": status_str == "ativo",  # A sua página espera um booleano 'ativo'
        "status": status_str,
        "proxima_execucao": proxima_auto,  # A sua página usa esta chave
        "proxima_execucao_auto": proxima_auto,  # Nova chave
        "proxima_execucao_sniper": proxima_sniper,  # Nova chave
        "intervalo": "6 horas",
        "horarios": ["00:00", "06:00", "12:00", "18:00"]  # Mock para a sua UI
    }