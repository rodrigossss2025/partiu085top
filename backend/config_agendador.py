# -*- coding: utf-8 -*-
"""
Agendador automático — executa a varredura 4x por dia.
Mantém o backend Flask livre e executa em thread separada.
"""

import threading
import schedule
import time
from datetime import datetime
from backend.core_milhas.orquestrador_voos import executar_fluxo_voos
from backend.agendador_front.notificacoes import enviar_mensagem_telegram

# ------------------------------------------------------
# Intervalo: 4x por dia = a cada 360 minutos (6h)
# ------------------------------------------------------
INTERVALO_MINUTOS = 360

def _executar():
    """Executa uma varredura automática."""
    enviar_mensagem_telegram(f"🕒 Execução automática iniciada ({datetime.now().strftime('%H:%M')})")
    executar_fluxo_voos(modo="AUTO")

def iniciar_agendador():
    """Inicia o agendador em thread de segundo plano."""
    schedule.every(INTERVALO_MINUTOS).minutes.do(_executar)
    enviar_mensagem_telegram("🗓️ Agendador automático iniciado (4x por dia).")

    def loop():
        while True:
            schedule.run_pending()
            time.sleep(60)

    t = threading.Thread(target=loop, daemon=True)
    t.start()
