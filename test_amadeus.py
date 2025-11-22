import requests

url = "https://partiu085-api.onrender.com/api/test_amadeus"

response = requests.post(url)

print("Status:", response.status_code)
print("Resposta:", response.text)
