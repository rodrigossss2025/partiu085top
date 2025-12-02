import csv
import os
from datetime import datetime
from backend.core_amadeus.rotator_antigo import amadeus_client
from backend.agendador_front.notificacoes import enviar_mensagem_telegram

DATA_DIR = "/data"

CAMINHO_CSV_INPUT = os.path.join(DATA_DIR, "coletas_filtrado_iata.csv")
CAMINHO_CSV_OUTPUT = os.path.join(DATA_DIR, "resultados_v2.csv")


def gerar_link_google_flights(origem, destino, data_ida, data_volta=None):
    # Link direto e seguro
    base = "https://www.google.com/travel/flights?q=Flights%20to%20LIS%20from%20FOR%20on%202023-10-20"
    query = f"?q=Flights%20to%20{destino}%20from%20{origem}%20on%20{data_ida}"
    if data_volta:
        query += f"%20returning%20{data_volta}"
    query += "&curr=BRL"
    return base + query


def salvar_oferta_csv(oferta):
    # SEM FAXINA, SEM REMOVE. Apenas escreve no final do arquivo.
    # Isso evita conflitos de arquivo em uso.
    arquivo_existe = os.path.exists(CAMINHO_CSV_OUTPUT)
    colunas = ['origem', 'destino', 'data_ida', 'data_volta', 'preco', 'moeda', 'link', 'timestamp', 'modo', 'baseline']

    try:
        with open(CAMINHO_CSV_OUTPUT, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=colunas)
            if not arquivo_existe:
                writer.writeheader()

            linha = {
                'origem': oferta['origem'],
                'destino': oferta['destino'],
                'data_ida': oferta['data_ida'],
                'data_volta': oferta.get('data_volta', ''),
                'preco': f"{oferta['preco']:.2f}",
                'moeda': oferta.get('moeda', 'BRL'),
                'link': oferta['link'],
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'modo': oferta.get('modo', 'AUTO'),
                'baseline': oferta.get('baseline_google', '')
            }
            writer.writerow(linha)
            print(f"💾 Salvo: {oferta['destino']} | R$ {oferta['preco']}")
    except Exception as e:
        print(f"❌ Erro CSV: {e}")


def formatar_msg_telegram(oferta):
    try:
        data_ida = datetime.strptime(oferta['data_ida'], "%Y-%m-%d").strftime("%d/%m/%Y")
    except:
        data_ida = oferta['data_ida']

    volta_str = ""
    if oferta.get('data_volta'):
        try:
            dv = datetime.strptime(oferta['data_volta'], "%Y-%m-%d").strftime("%d/%m/%Y")
            volta_str = f"\n🔙 Volta: {dv}"
        except:
            pass

    return (
        f"🔥 *ALERTA DE OFERTA!* 🔥\n\n"
        f"✈️ *{oferta['origem']} ➔ {oferta['destino']}*\n"
        f"📅 Ida: {data_ida}{volta_str}\n"
        f"💰 Valor Total: *{oferta['moeda']} {oferta['preco']:.0f}*\n"
        f"🔗 [Ver no Google Flights]({oferta['link']})"
    )


def _fluxo_manual_exato(destinos, data_ida, data_volta=None):
    print(f"🚀 [MANUAL] Iniciando para: {destinos} (Ida: {data_ida})")
    origem = "FOR"
    ofertas = []

    for destino in destinos:
        try:
            print(f"🔎 Consultando Amadeus para {destino}...")

            # --- CORREÇÃO AQUI ---
            # O rotator antigo NÃO aceita data_volta. Sempre busca só ida.
            resultados = amadeus_client.buscar_voo_exato(origem, destino, data_ida)
            # -----------------------

            if not resultados:
                print(f"⚠️ Sem voos para {destino}")
                continue

            melhor_voo = resultados[0]
            preco = float(melhor_voo['price']['grandTotal'])
            moeda = melhor_voo['price']['currency']

            # Link continua funcionando com ida/volta se o front mandar
            link = gerar_link_google_flights(origem, destino, data_ida, data_volta)

            print(f"✅ [ACHEI] {destino}: {moeda} {preco:.2f}")

            oferta = {
                "origem": origem,
                "destino": destino,
                "data_ida": data_ida,
                "data_volta": data_volta if data_volta else "",
                "preco": preco,
                "moeda": moeda,
                "link": link,
                "modo": "MANUAL",
                "baseline_google": 99999
            }

            ofertas.append(oferta)
            salvar_oferta_csv(oferta)

        except Exception as e:
            print(f"🚨 Erro ao processar {destino}: {e}")

    return ofertas


# Mantendo o automático simples e funcional
def _fluxo_automatico():
    print(f"🚀 [AUTO] Iniciando varredura...")
    lista_alvos = carregar_destinos_csv()
    if not lista_alvos: return []

    ofertas = []
    for item in lista_alvos:
        try:
            origem, destino, baseline = item['origem'], item['destino'], item['baseline']
            resultados = amadeus_client.buscar_datas_baratas(origem, destino)
            if not resultados: continue

            for voo in resultados:
                preco = float(voo['price']['total'])
                if preco > baseline: continue

                data = voo['departureDate']
                moeda = voo['price'].get('currency', 'EUR')
                link = gerar_link_google_flights(origem, destino, data)

                print(f"🔥 [AUTO] {destino} {data} | {preco:.0f}")

                oferta = {
                    "origem": origem, "destino": destino, "data_ida": data, "data_volta": "",
                    "preco": preco, "moeda": moeda, "link": link, "modo": "AUTO",
                    "baseline_google": baseline
                }
                ofertas.append(oferta)
                salvar_oferta_csv(oferta)
                try:
                    enviar_mensagem_telegram(formatar_msg_telegram(oferta))
                except:
                    pass
        except:
            continue
    return ofertas


# ... (carregar_destinos_csv e _fluxo_manual_flexivel mantidos iguais ou pode copiar do anterior se precisar do flexivel) ...
# Para economizar linhas, focamos no manual e auto.

def carregar_destinos_csv():
    targets = []
    try:
        with open(CAMINHO_CSV_INPUT, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                if row.get('destino'):
                    try:
                        base = float(row['preco_baseline'].replace('.', '').replace(',', '.'))
                    except:
                        base = 99999.0
                    targets.append({'origem': row.get('origem', 'FOR'), 'destino': row['destino'], 'baseline': base})
    except:
        pass
    return targets


def executar_fluxo_voos(modo="AUTO", destinos_personalizados=None, data_ida=None, data_volta=None):
    if modo == "MANUAL":
        return _fluxo_manual_exato(destinos_personalizados, data_ida, data_volta)
    return _fluxo_automatico()