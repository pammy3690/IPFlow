import os
import requests
from dotenv import load_dotenv

# Load .env file
load_dotenv()

API_KEY = os.getenv("API_KEY")

patent_number = "534567"

url = f"https://api.business.govt.nz/sandbox/intellectual-property-office-nz/v5/patent/{patent_number}"

headers = {
    "Ocp-Apim-Subscription-Key": API_KEY,  
    "Accept": "application/json" 
}

response = requests.get(url, headers=headers)
print(response.status_code)
print(response.text)