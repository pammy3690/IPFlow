import time

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
    #XML Schema Patent structure
    ns = {
        "p": "http://www.iponz.govt.nz/XMLSchema/patents"
    }
    # Ensure <Patent> root exists
    patent = root.find(".//p:Patent", ns)
    if patent is None:
        print("No <Patent> element found — invalid patent number")
        return None

    # Safe getter
    def safe(elem):
        if elem is not None and elem.text:
            return elem.text.strip()
        return None
    
    #If patent is none:
    if patent is None:
        print("No <Patent Element> Found")
        return None

    
    
    #Temporarily inspect XML structure  
    print(root.tag)

    for child in list(root.iter())[:20]:
        print(child.tag, child.text)
        
        
    #Extracting richer fields / #todo: change return to patent_data        
    def extract(patent, tag):
        for elem in patent.iter():
            if elem.tag.endswith(tag) and elem.text:
                return elem.text.strip()
        return None
    
    def extract_inventor(patent):
        inside_inventor = False

        for elem in patent.iter():

            if elem.tag.endswith("Inventor"):
                inside_inventor = True

            if inside_inventor and elem.tag.endswith("FreeFormatNameLine"):
                if elem.text:
                    return elem.text.strip()

        return None    

    patent_data = {
    "title": extract(patent, "PatentTitle"),   # REQUIRED
    "status": extract(patent, "PatentCurrentStatusCode"),
    "filing_date": extract(patent, "CompleteFiledDate"),
    "expiry_date": extract(patent, "ExpiryDate"),
    "abstract": extract(patent, "PatentAbstract"),
    "inventor_name": extract_inventor(patent),
    "publication_date": extract(patent, "PublishedDate"),    
    "raw_xml": xml_data
    }   
    return patent_data

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

    try:
        response = requests.post(url, json=data, headers=headers)

        print("Status:", response.status_code)

        if response.status_code >= 400:
            print("Supabase error:", response.text)

        response.raise_for_status()

    except requests.exceptions.RequestException as e:
        print("Request failed:", e)
# -----------------------------
# PROCESS A SINGLE PATENT
# -----------------------------
def process_patent(patent_number):
    xml_data = fetch_patent_xml(patent_number)
    if xml_data is None:
        return
    print(xml_data)
    
    parsed = parse_patent_xml(xml_data)
    if not parsed:
        return

    parsed["raw_xml"] = xml_data
    upsert_to_supabase(parsed)

# -----------------------------
# RUN 1 PATENT FOR PRACTICE
# -----------------------------
test_ids = range(510011, 510014)
for pid in test_ids:
    try:
        process_patent(pid)
        print(f"\nProcessing patent {pid}")
        time.sleep(2);
    except Exception as e:
        print("Error in processing")
    

    
