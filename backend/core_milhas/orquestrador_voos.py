import csv
import os
import time
from datetime import datetime, date, timedelta

from backend.core_amadeus.rotator import amadeus_client as amadeus_client_rotator
from backend.agendador_front.notificacoes import enviar_oferta_telegram


# ================= PATHS =================

BASE_DIR = "/data" if os.path.isdir("/data") else os.path.join(os.getcwd(), "data")

CAMINHO_CSV_INPUT = os.path.join(BASE_DIR, "coletas_completo.csv")
CAMINHO_CSV_OUTPUT = os.path.join(BASE_DIR, "resultados_v2.csv")


# ================= UTIL =================

def salvar_oferta_csv(oferta: dict):
    colunas = [
        "origem",
        "destino",
        "data_ida",
        "data_volta",
        "preco",
        "moeda",
        "link",
        "timestamp",
        "modo",
        "baseline",
    ]

    os.makedirs(os.path.dirname(CAMINHO_CSV_OUTPUT), exist_ok=True)
    arquivo_existe = os.path.exists(CAMINHO_CSV_OUTPUT)

    with open(CAMINHO_CSV_OUTPUT, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=colunas)
        if not arquivo_existe:
            writer.writeheader()

        writer.writerow({
            "origem": oferta["origem"],
            "destino": oferta["destino"],
            "data_ida": oferta["data_ida"],
            "data_volta": oferta.get("data_volta", ""),
            "preco": f"{oferta['preco']:.2f}",
            "moeda": oferta.get("moeda", "BRL"),
            "link": oferta["link"],
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "modo": oferta.get("modo", "AUTO"),
            "baseline": oferta.get("baseline_google", ""),
        })


# ================= MANUAL =================

def _fluxo_manual_exato(destinos, data_ida, data_volta=None):
    origem = "FOR"
    ofertas = []

    for destino in destinos:
        try:
            voos = amadeus_client_rotator.buscar_voo_exato(
                origem, destino, data_ida, data_volta
            )
            if not voos:
                continue

            price = voos[0].get("price", {})
            preco = float(price.get("grandTotal", 0))

            oferta = {
                "origem": origem,
                "destino": destino,
                "data_ida": data_ida,
                "data_volta": data_volta,
                "preco": preco,
                "moeda": price.get("currency", "BRL"),
                "link": "TEMP",  # será gerado no notificações
                "modo": "MANUAL",
                "baseline_google": 99999,
            }

            salvar_oferta_csv(oferta)
            enviar_oferta_telegram(oferta)
            ofertas.append(oferta)

        except Exception as e:
            print(f"❌ Erro MANUAL {destino}: {e}")

    return ofertas


# ================= AUTO =================

def _fluxo_automatico():
    destinos = carregar_destinos_csv()
    ofertas = []

    datas_ida = gerar_datas_ida_reverso()

    for item in destinos:
        origem = item["origem"]
        destino = item["destino"]
        baseline = item["baseline"]

        buscas_pos_baseline = 0
        entrou_zona = False

        for data_ida in datas_ida:
            for data_volta in gerar_datas_volta(data_ida):
                try:
                    voos = amadeus_client_rotator.buscar_voo_exato(
                        origem, destino, data_ida, data_volta
                    )
                    if not voos:
                        continue

                    price = voos[0].get("price", {})
                    preco = float(
                        price.get("grandTotal")
                        or price.get("total")
                        or price.get("base")
                        or 0
                    )

                    if preco > baseline * 1.35:
                        continue

                    if preco <= baseline * 1.15:
                        entrou_zona = True
                        buscas_pos_baseline += 1

                    if preco <= baseline:
                        oferta = {
                            "origem": origem,
                            "destino": destino,
                            "data_ida": data_ida,
                            "data_volta": data_volta,
                            "preco": preco,
                            "moeda": price.get("currency", "BRL"),
                            "link": "TEMP",
                            "modo": "AUTO",
                            "baseline_google": baseline,
                        }

                        salvar_oferta_csv(oferta)
                        enviar_oferta_telegram(oferta)
                        ofertas.append(oferta)

                    if entrou_zona and buscas_pos_baseline >= 3:
                        break

                except Exception as e:
                    print(f"❌ Erro AUTO {destino}: {e}")

                time.sleep(0.3)

            if entrou_zona and buscas_pos_baseline >= 3:
                break

    return ofertas


# ================= AUX =================

def carregar_destinos_csv():
    destinos = []
    with open(CAMINHO_CSV_INPUT, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            try:
                baseline = float(row["preco_baseline"].replace(".", "").replace(",", "."))
            except:
                baseline = 99999

            destinos.append({
                "origem": row.get("origem", "FOR"),
                "destino": row["destino"],
                "baseline": baseline,
            })

    return destinos


def gerar_datas_ida_reverso():
    hoje = date.today()
    inicio = hoje + timedelta(days=30)
    fim = hoje + timedelta(days=180)

    datas = []
    atual = fim
    while atual >= inicio:
        datas.append(atual.strftime("%Y-%m-%d"))
        atual -= timedelta(days=14)

    return datas


def gerar_datas_volta(data_ida):
    base = datetime.strptime(data_ida, "%Y-%m-%d").date()
    return [
        (base + timedelta(days=7)).strftime("%Y-%m-%d"),
        (base + timedelta(days=10)).strftime("%Y-%m-%d"),
        (base + timedelta(days=14)).strftime("%Y-%m-%d"),
    ]


def executar_fluxo_voos(modo="AUTO", destinos_personalizados=None, data_ida=None, data_volta=None):
    if modo == "MANUAL":
        return _fluxo_manual_exato(destinos_personalizados, data_ida, data_volta)
    return _fluxo_automatico()
