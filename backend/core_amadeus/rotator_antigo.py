import requests
import time
import os
from dotenv import load_dotenv

# --- DEBUG (Pode manter para garantir) ---
print("=" * 50)
print("CARREGANDO ROTATOR - VERSÃO HARDCODED")
print("URL FORÇADA: https://api.amadeus.com")
print("=" * 50)
# -----------------------------------------

load_dotenv()

AMADEUS_API_KEY = os.getenv('AMADEUS_API_KEY')
AMADEUS_API_SECRET = os.getenv('AMADEUS_API_SECRET')


class AmadeusRotator:
    def __init__(self, modo="AUTO"):
        self.token = None
        self.token_expiry = 0
        self.modo = modo

    def get_token(self):
        if self.token and time.time() < self.token_expiry:
            return self.token

        # URL CHUMBADA DIRETAMENTE AQUI (Sem variáveis para não dar erro)
        url = 'https://api.amadeus.com/v1/security/oauth2/token'

        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            'grant_type': 'client_credentials',
            'client_id': AMADEUS_API_KEY,
            'client_secret': AMADEUS_API_SECRET
        }
        try:
            # Print de debug EXTRA antes de chamar
            print(f"🔐 Tentando autenticar em: {url}")

            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()
            data = response.json()
            self.token = data['access_token']
            self.token_expiry = time.time() + data['expires_in'] - 10
            return self.token
        except Exception as e:
            print(f"❌ Erro Auth Amadeus: {e}")
            return None

    def buscar_datas_baratas(self, origem, destino):
        token = self.get_token()
        if not token: return []

        # URL CHUMBADA AQUI TAMBÉM
        url = 'https://api.amadeus.com/v1/shopping/flight-dates'

        headers = {'Authorization': f'Bearer {token}'}
        params = {
            'origin': origem,
            'destination': destino,
            'oneWay': 'true',
            'nonStop': 'false',
            'viewBy': 'DATE'
        }
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                return response.json().get('data', [])
            return []
        except Exception as e:
            return []

    def buscar_voo_exato(self, origem, destino, data_ida, data_volta=None):
        token = self.get_token()
        if not token:
            return []

        url = 'https://api.amadeus.com/v2/shopping/flight-offers'

        headers = {'Authorization': f'Bearer {token}'}

        params = {
            'originLocationCode': origem,
            'destinationLocationCode': destino,
            'departureDate': data_ida,
            'adults': 1,
            'nonStop': 'false',
            'currencyCode': 'BRL',
            'max': 5
        }

        # 👉 Se o usuário selecionou VOLTA, adiciona no request
        if data_volta:
            params['returnDate'] = data_volta

        try:
            print(f"✈️ Buscando voo exato em: {url}")
            print(f"➡️ Params enviados: {params}")

            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                print(f"⚠️ Erro API ({response.status_code}): {response.text}")
                return []
        except Exception as e:
            print(f"❌ Erro Conexão Amadeus (Manual): {e}")
            return []


amadeus_client = AmadeusRotator()