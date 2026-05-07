from dotenv import load_dotenv
import requests
import os
import xml.etree.ElementTree as ET


#Load .env FileExistsError
load_dotenv()

# -----------------------------
# CONFIGURATION
# -----------------------------
SUPABASE_URL = "https://qvgtcsdycvuduleknrfa.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_KEY = os.getenv("Ocp-Apim-Subscription-Key")

# Official IPONZ API endpoint format:
# https://api.business.govt.nz/services/iponz/patents/{patent_number}


# -----------------------------
# FETCH XML FROM IPONZ
# -----------------------------
def fetch_patent_xml(patent_number):
    url = f"https://api.business.govt.nz/sandbox/intellectual-property-office-nz/v5/patent/{patent_number}"
    headers = {
        "Accept": "application/xml",
        "Ocp-Apim-Subscription-Key": API_KEY
        }

    response = requests.get(url, headers=headers)

    if response.status_code == 404:
        print(f"Patent {patent_number} not found")
        return None

    response.raise_for_status()
    return response.text


# -----------------------------
# PARSE XML → PYTHON DICTIONARY
# -----------------------------
def parse_patent_xml(xml_data, client_name=None):
    ns = {
        "info": "http://www.iponz.govt.nz/XMLSchema/patents/information",
        "pat": "http://www.iponz.govt.nz/XMLSchema/patents"
    }

    root = ET.fromstring(xml_data)

    # Handle API errors
    error = root.find(".//info:TransactionErrorText", ns)
    if error is not None:
        print("API Error:", error.text)
        return None

    # Ensure <Patent> exists
    patent = root.find(".//pat:Patent", ns)
    if patent is None:
        print("No <Patent> element found — invalid patent number")
        return None

    # Safe getter
    def safe(elem):
        return elem.text if elem is not None else None

    return {
        "patent_id": int(safe(patent.find("pat:PatentNumber", ns))),
        "patent_title": safe(patent.find("pat:PatentTitle", ns)),
        "patent_status": safe(patent.find("pat:PatentCurrentStatusCode", ns)),
        "expiry_date": safe(patent.find("pat:ExpiryDate", ns)),
        "client_name": client_name
    }



# -----------------------------
# UPSERT INTO SUPABASE
# -----------------------------
def upsert_to_supabase(data):
    url = f"{SUPABASE_URL}/rest/v1/patents"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    response = requests.post(url, json=data, headers=headers)
    print("Supabase:", response.status_code, response.text)


# -----------------------------
# PROCESS A SINGLE PATENT
# -----------------------------
def process_patent(patent_number):
    xml_data = fetch_patent_xml(patent_number)
    if xml_data is None:
        return
    print(xml_data)

    parsed = parse_patent_xml(xml_data)
    print("Parsed:", parsed)
    upsert_to_supabase(parsed)


# -----------------------------
# RUN 1 PATENT FOR PRACTICE
# -----------------------------
test_ids = [534567]

for pid in test_ids:
    print(f"\nProcessing patent {pid}")
    process_patent(pid)
