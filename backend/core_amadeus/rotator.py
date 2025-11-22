import requests
import time
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


def log_force(msg):
    print(f"[{datetime.now()}] {msg}", file=sys.stderr, flush=True)


class AmadeusRotator:
    def __init__(self, modo="AUTO"):
        self.credentials = []
        self.tokens = {}
        self.current_cred_index = 0

        # Carrega chaves
        i = 1
        while True:
            key = os.getenv(f'AMADEUS_API_KEY_{i}')
            secret = os.getenv(f'AMADEUS_API_SECRET_{i}')
            if key and secret:
                self.credentials.append({"key": key, "secret": secret, "name": f"Chave {i}"})
                i += 1
            else:
                break

        if not self.credentials:
            log_force("❌ Nenhuma credencial Amadeus encontrada!")
        else:
            log_force(f"✅ Amadeus Rotator iniciado com {len(self.credentials)} chaves.")

    def _get_active_credential(self):
        if not self.credentials: return None
        return self.credentials[self.current_cred_index]

    def _rotate_credential(self):
        if not self.credentials: return
        antiga = self._get_active_credential()
        self.tokens[antiga['key']] = None
        self.current_cred_index = (self.current_cred_index + 1) % len(self.credentials)
        nova = self._get_active_credential()
        log_force(f"⚠️ Rotacionando: {antiga['name']} → {nova['name']}")

    def get_token(self, key=None, secret=None):
        cred = self._get_active_credential()
        if not cred: return None
        if key is None: key = cred['key']
        if secret is None: secret = cred['secret']

        cached = self.tokens.get(key)
        if cached and time.time() < cached['expiry']: return cached['token']

        try:
            url = "https://api.amadeus.com/v1/security/oauth2/token"
            resp = requests.post(url, data={
                "grant_type": "client_credentials",
                "client_id": key,
                "client_secret": secret
            }, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            self.tokens[key] = {"token": data["access_token"], "expiry": time.time() + data["expires_in"] - 30}
            return data["access_token"]
        except Exception as e:
            log_force(f"❌ Erro Token ({cred['name']}): {e}")
            return None

    def _make_request(self, endpoint_url, params):
        for _ in range(len(self.credentials)):
            cred = self._get_active_credential()
            token = self.get_token(cred['key'], cred['secret'])
            if not token:
                self._rotate_credential()
                continue

            try:
                log_force(f"🔎 Tentando API com {cred['name']}...")
                response = requests.get(endpoint_url, headers={"Authorization": f"Bearer {token}"}, params=params,
                                        timeout=25)

                if response.status_code == 200:
                    return response.json()
                elif response.status_code in [401, 403, 429, 500, 503]:
                    log_force(f"⚠️ Erro API ({response.status_code}), tentando próxima...")
                    self._rotate_credential()
                else:
                    log_force(f"❌ Erro fatal API ({response.status_code}): {response.text}")
                    return None
            except Exception as e:
                log_force(f"❌ Timeout/Erro Conexão: {e}")
                self._rotate_credential()

        log_force("❌ Todas as chaves falharam.")
        return None

    def buscar_datas_baratas(self, origem, destino):
        return self._make_request("https://api.amadeus.com/v1/shopping/flight-dates",
                                  {"origin": origem, "destination": destino, "viewBy": "DATE"}).get("data",
                                                                                                    []) if self.credentials else []

    def buscar_voo_exato(self, origem, destino, data, data_volta=None):
        params = {
            "originLocationCode": origem, "destinationLocationCode": destino,
            "departureDate": data, "adults": 1, "currencyCode": "BRL", "max": 5
        }
        if data_volta: params['returnDate'] = data_volta

        resp = self._make_request("https://api.amadeus.com/v2/shopping/flight-offers", params)
        return resp.get("data", []) if resp else []


amadeus_client = AmadeusRotator()