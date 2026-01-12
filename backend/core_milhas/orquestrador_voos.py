# -*- coding: utf-8 -*-
import csv
import os
import time
from datetime import datetime, date, timedelta

from backend.core_amadeus.rotator import amadeus_client as amadeus_client_rotator
from backend.api.log_buffer import add_log   # <- seguro, sem circular import


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.abspath(os.path.join(ROOT_DIR, "..", "data"))

CAMINHO_CSV_INPUT = os.path.join(DATA_DIR, "coletas_completo.csv")
CAMINHO_CSV_OUTPUT = os.path.join(DATA_DIR, "resultados_v2.csv")


# ================= UTIL =================

def salvar_oferta_csv(oferta: dict):
    os.makedirs(os.path.dirname(CAMINHO_CSV_OUTPUT), exist_ok=True)
    newfile = not os.path.exists(CAMINHO_CSV_OUTPUT)

    colunas = [
        "origem","destino","data_ida","data_volta",
        "preco","moeda","link","timestamp",
        "modo","baseline"
    ]

    with open(CAMINHO_CSV_OUTPUT, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=colunas)
        if newfile:
            w.writeheader()

        oferta["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        w.writerow(oferta)

    add_log(
        f"💾 CSV -> {oferta['origem']}→{oferta['destino']} "
        f"{oferta['data_ida']} | R$ {oferta['preco']:.2f}"
    )


# ================= MANUAL =================

def _fluxo_manual_exato(destinos, data_ida, data_volta=None):
    origem = "FOR"
    ofertas = []

    add_log("🟠 EXECUÇÃO MANUAL")
    add_log(f"➡ Destinos: {destinos}")
    add_log(f"➡ Ida: {data_ida} | Volta: {data_volta}")

    for destino in (destinos or []):
        try:
            voos = amadeus_client_rotator.buscar_voo_exato(
                origem, destino, data_ida, data_volta
            )

            if not voos:
                add_log(f"⚠️ SEM RESULTADO {origem}->{destino}")
                continue

            price = voos[0].get("price", {})
            preco = float(price.get("grandTotal") or price.get("total") or 0)

            add_log(
                f"🎯 {origem}->{destino} | {data_ida}→{data_volta} "
                f"| 💰 R$ {preco:.2f}"
            )

            oferta = {
                "origem": origem,
                "destino": destino,
                "data_ida": data_ida,
                "data_volta": data_volta,
                "preco": preco,
                "moeda": price.get("currency", "BRL"),
                "link": "https://www.google.com/travel/flights",
                "modo": "MANUAL",
                "baseline": 99999
            }

            salvar_oferta_csv(oferta)
            ofertas.append(oferta)

        except Exception as e:
            add_log(f"❌ Erro MANUAL {destino}: {e}")

    add_log(f"🟠 Manual finalizado — {len(ofertas)} ofertas salvas")
    return ofertas


# ================= AUTO (com lógica inteligente) =================

def _fluxo_automatico():
    add_log("🔵 EXECUÇÃO AUTOMÁTICA")

    destinos = carregar_destinos_csv()
    if not destinos:
        add_log("⚠️ Nenhum destino encontrado no CSV.")
        return []

    add_log(f"✔ {len(destinos)} destinos carregados")

    ofertas = []
    datas_ida = gerar_datas_ida_reverso()

    for item in destinos:
        origem = item["origem"]
        destino = item["destino"]
        baseline = float(item["baseline"])

        add_log(f"\n🏁 {origem}->{destino} | baseline R$ {baseline:.2f}")

        entrou_zona = False
        buscas_pos_baseline = 0
        strikes_muito_caro = 0   # 👈 tolerância

        for data_ida in datas_ida:
            for data_volta in gerar_datas_volta(data_ida):

                add_log(f"🌐 {data_ida} → {data_volta}")

                try:
                    voos = amadeus_client_rotator.buscar_voo_exato(
                        origem, destino, data_ida, data_volta
                    )

                    if not voos:
                        add_log("⚠️ Nenhum voo retornado")
                        continue

                    price = voos[0].get("price", {})
                    preco = float(price.get("grandTotal") or price.get("total") or 0)

                    add_log(f"   💵 R$ {preco:.2f} (baseline R$ {baseline:.2f})")

                    # 🟥 muito caro (passagem fora da realidade)
                    if preco > baseline * 1.35:
                        strikes_muito_caro += 1
                        add_log(f"   🔺 Muito acima ({strikes_muito_caro}/2)")

                        # só pula se repetiu padrão caro
                        if strikes_muito_caro >= 3:
                            add_log("   🛑 Padrão caro confirmado — pulando destino")
                            break
                        continue

                    # 🟡 zona de atenção
                    if preco <= baseline * 1.15:
                        entrou_zona = True
                        buscas_pos_baseline += 1

                    # ⛔ acima do baseline comum
                    if preco > baseline:
                        add_log("   ⛔ Acima do baseline — ignorando")
                        continue

                    # ✅ oferta encontrada
                    add_log("   ✅ PREÇO BOM — salvando")

                    oferta = {
                        "origem": origem,
                        "destino": destino,
                        "data_ida": data_ida,
                        "data_volta": data_volta,
                        "preco": preco,
                        "moeda": price.get("currency", "BRL"),
                        "link": "TEMP",
                        "modo": "AUTO",
                        "baseline": baseline
                    }

                    salvar_oferta_csv(oferta)
                    ofertas.append(oferta)

                    # encerra após confirmar comportamento
                    if entrou_zona and buscas_pos_baseline >= 3:
                        add_log("   🟢 Zona validada — encerrando destino")
                        break

                except Exception as e:
                    add_log(f"❌ Erro AUTO {destino}: {e}")

                time.sleep(0.3)

            # sai do destino quando um dos critérios dispara
            if strikes_muito_caro >= 3 or (entrou_zona and buscas_pos_baseline >= 3):
                break

    add_log(f"\n🔵 Auto finalizado — {len(ofertas)} ofertas salvas")
    return ofertas



# ================= AUX =================

def carregar_destinos_csv():
    destinos = []

    if not os.path.exists(CAMINHO_CSV_INPUT):
        add_log(f"❌ CSV não encontrado: {CAMINHO_CSV_INPUT}")
        return []

    with open(CAMINHO_CSV_INPUT, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")

        for row in reader:
            try:
                baseline = float(
                    row["preco_baseline"]
                    .replace(".", "")
                    .replace(",", ".")
                )
            except Exception:
                baseline = 99999

            destinos.append({
                "origem": row.get("origem", "FOR"),
                "destino": row["destino"],
                "baseline": baseline
            })

    return destinos


def gerar_datas_ida_reverso():
    hoje = date.today()
    inicio = hoje + timedelta(days=30)
    fim = hoje + timedelta(days=180)

    datas = []
    d = fim
    while d >= inicio:
        datas.append(d.strftime("%Y-%m-%d"))
        d -= timedelta(days=14)

    return datas


def gerar_datas_volta(data_ida):
    base = datetime.strptime(data_ida, "%Y-%m-%d").date()
    return [
        (base + timedelta(days=7)).strftime("%Y-%m-%d"),
        (base + timedelta(days=10)).strftime("%Y-%m-%d"),
        (base + timedelta(days=14)).strftime("%Y-%m-%d"),
    ]


# ================= ENTRY =================

def executar_fluxo_voos(
    modo="AUTO",
    destinos_personalizados=None,
    data_ida=None,
    data_volta=None
):
    if modo == "MANUAL":
        return _fluxo_manual_exato(destinos_personalizados, data_ida, data_volta)

    return _fluxo_automatico()
