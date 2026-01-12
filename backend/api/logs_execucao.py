# backend/api/logs_execucao.py
from flask import Blueprint, jsonify
from backend.api.log_buffer import EXEC_LOGS

bp_logs = Blueprint("logs_execucao", __name__)

@bp_logs.route("/api/logs_execucao", methods=["GET"])
def obter_logs_execucao():
    """
    Retorna os últimos logs da execução
    (mesmos logs gerados pelo add_log)
    """
    return jsonify({
        "success": True,
        "logs": EXEC_LOGS
    })
