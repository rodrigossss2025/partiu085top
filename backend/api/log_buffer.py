from datetime import datetime

EXEC_LOGS = []

def add_log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"

    print(line)        # continua aparecendo no console
    EXEC_LOGS.append(line)

    # impede crescimento infinito
    if len(EXEC_LOGS) > 500:
        EXEC_LOGS.pop(0)
