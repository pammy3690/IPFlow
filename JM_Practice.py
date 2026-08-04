from multiprocessing.dummy.connection import families
import time
import os
from tkinter.font import families
from pandas import unique
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GATEWAY_API")
SUPABASE_URL = "https://qvgtcsdycvuduleknrfa.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

BASE_URL = "https://api.business.govt.nz/gateway/intellectual-property-office-nz/v5/patent"

HEADERS = {
    "Accept": "application/xml",
    "Ocp-Apim-Subscription-Key": API_KEY
}

# ---------------------------------------------------------
# FETCH XML
# ---------------------------------------------------------
def fetch_patent_xml(patent_number):
    url = f"{BASE_URL}/{patent_number}"
    try:
        response = requests.get(url, headers=HEADERS)
        if response.status_code == 404:
            print(f"❌ {patent_number} not found")
            return None
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed for {patent_number}: {e}")
        return None

# ---------------------------------------------------------
# PARSE XML + FAMILY + MAINTENANCE + CLASSIFICATION
# ---------------------------------------------------------
def parse_patent_xml(xml_data):
    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError:
        print("❌ XML Parse Error")
        return None

    # strip namespaces
    for elem in root.iter():
        if "}" in elem.tag:
            elem.tag = elem.tag.split("}", 1)[1]

    # find Patent node
    patent = None
    for elem in root.iter():
        if elem.tag == "Patent":
            patent = elem
            break

    if patent is None:
        print("❌ Could not find <Patent> node")
        return None

    def find_text(tag):
        for elem in patent.iter():
            if elem.tag == tag and elem.text:
                return elem.text.strip()
        return None

    def extract_inventor():
        for elem in patent.iter():
            if elem.tag == "FreeFormatNameLine" and elem.text:
                return elem.text.strip()
        return None

    # ---------------------------------------------------------
    # TRY TO EXTRACT ASSOCIATED PATENTS (PARENT/CHILD/SIBLING)
    # ---------------------------------------------------------
    def extract_associated_patents():
        associated = []

        assoc_details = patent.find("AssociatedPatentDetails")
        if assoc_details is None:
            return associated

        for ap in assoc_details.iter("AssociatedPatent"):
            num = ap.findtext("AssociatedPatentNumber")
            typ = ap.findtext("AssociationType")

            if num:
                associated.append({
                    "associated_patent_id": num.strip(),
                    "association_type": typ.strip() if typ else None
                })

        return associated

    # ---------------------------------------------------------
    # FAMILY EXTRACTION (robust + dedupe)
    # ---------------------------------------------------------
    def extract_family():
        families = []

        def safe_text(elem, tag):
            """Return text for a tag even if nested."""
            if elem is None:
                return None

            # direct text
            txt = elem.findtext(tag)
            if txt:
                return txt.strip()

            # nested search
            child = elem.find(f".//{tag}")
            if child is not None and child.text:
                return child.text.strip()

            return None

        for elem in patent.iter():
            if "Priority" in elem.tag:
                country = (
                    safe_text(elem, "PriorityCountryCode")
                    or safe_text(elem, "CountryCode")
                    or safe_text(elem, "PriorityCountry")
                    or safe_text(elem, "Country")
                )

                number = (
                    safe_text(elem, "PriorityNumber")
                    or safe_text(elem, "ApplicationNumber")
                    or safe_text(elem, "PriorityNo")
                    or safe_text(elem, "Number")
                )

                date = (
                    safe_text(elem, "PriorityDate")
                    or safe_text(elem, "PriorityFilingDate")
                    or safe_text(elem, "Date")
                )

                if number:
                    families.append({
                        "priority_country": country,
                        "priority_number": number,
                        "priority_date": date
                    })

        if not families:
            print("DEBUG FAMILY: no priority-like tags found")
            for e in patent.iter():
                if "Priority" in e.tag:
                    print("DEBUG FAMILY TAG:", e.tag)
                    print("DEBUG FAMILY XML:", ET.tostring(e, encoding="unicode"))

        # Dedupe    
        unique = {}
        for fam in families:
            key = (
                fam["priority_country"],
                fam["priority_number"],
                fam["priority_date"]
            )
            unique[key] = fam

        return list(unique.values())

    # ---------------------------------------------------------
    # PARENT PATENT EXTRACTION (dedupe)
    # ---------------------------------------------------------
    def extract_parent_patent():
        parent_numbers = set()

        # Common parent tags used by IPONZ
        parent_tags = [
            "ParentApplicationDetails",
            "ParentPatentDetails",
            "PatentApplicationDetails",
            "CompleteSpecificationDetails",
            "RelatedApplicationDetails",
            "RelatedPatentDetails"
        ]

        def safe_find(elem, tag):
            child = elem.find(f".//{tag}")
            if child is not None and child.text:
                return child.text.strip()
            return None

        for elem in patent.iter():
            for tag in parent_tags:
                if tag in elem.tag:
                    # Try all possible fields
                    possible_fields = [
                        "ParentPatentNumber",
                        "ParentApplicationNumber",
                        "ApplicationNumber",
                        "PatentNumber",
                        "CompleteSpecificationNumber",
                        "RelatedPatentNumber",
                        "RelatedApplicationNumber"
                    ]

                    for field in possible_fields:
                        val = safe_find(elem, field)
                        if val:
                            parent_numbers.add(val)

        return list(parent_numbers)

    # ---------------------------------------------------------
    # MAINTENANCE EVENT EXTRACTION (dedupe)
    # ---------------------------------------------------------
    def extract_maintenance_events():
        events = []

        event_details = patent.find("PatentEventDetails")
        if event_details is None:
            return events

        for elem in event_details.iter("PatentEvent"):
            code = elem.findtext("PatentEventCode")

            if code not in ["PT_MaintainReminderSend", "PT_MTCFEEPAID"]:
                continue

            ev = {
                "event_code": code,
                "due_date": elem.findtext("PatentEventDueDate"),
                "completed_date": elem.findtext("PatentEventCompletedDate"),
                "journal_issue": elem.findtext("PatentEventJournalIssue"),
                "journal_publication_date": elem.findtext("PatentEventJournalPublicationDate")
            }

            events.append(ev)

        # Dedupe
        unique = {}
        for ev in events:
            key = (
                ev["event_code"],
                ev["due_date"],
                ev["completed_date"],
                ev["journal_issue"],
                ev["journal_publication_date"]
            )
            unique[key] = ev

        return list(unique.values())

    # ---------------------------------------------------------
    # CLASSIFICATION EXTRACTION (dedupe)
    # ---------------------------------------------------------
    def extract_classifications():
        classifications = []

        class_details = patent.find("ClassificationDetails")
        if class_details is None:
            return classifications

        for cls in class_details.iter("Classification"):
            kind = cls.findtext("ClassificationKindCode")
            version = cls.findtext("ClassificationVersion")

            raw_code = None
            desc = cls.find("ClassDescriptionDetails")
            if desc is not None:
                raw_code = desc.findtext("ClassDescription")

            if raw_code:
                parts = raw_code.split()
                section = parts[0][0] if len(parts) > 0 else None
                class_code = parts[0][:3] if len(parts[0]) >= 3 else None
                subclass = parts[0]
                ipc_group = parts[1] if len(parts) > 1 else None

                classifications.append({
                    "kind_code": kind,
                    "version": version,
                    "raw_code": raw_code,
                    "section": section,
                    "class": class_code,
                    "subclass": subclass,
                    "ipc_group": ipc_group
                })

        # Dedupe
        unique = {}
        for cls in classifications:
            unique[cls["raw_code"]] = cls

        return list(unique.values())

    parsed = {
        "patent_id": find_text("PatentNumber"),
        "title": find_text("PatentTitle"),
        "status": find_text("PatentCurrentStatusCode"),
        "filing_date": find_text("CompleteFiledDate"),
        "expiry_date": find_text("ExpiryDate"),
        "abstract": find_text("PatentAbstract"),
        "inventor_name": extract_inventor(),
        "publication_date": find_text("PublishedDate"),
        "raw_xml": xml_data,
        "family": extract_family(),
        "associated_patents": extract_associated_patents(),
        "maintenance_events": extract_maintenance_events(),
        "classifications": extract_classifications(),
        "parent_patents": extract_parent_patent(),
    }

    print("DEBUG PARSED:", parsed)
    return parsed

# ---------------------------------------------------------
# FILTERS
# ---------------------------------------------------------
def passes_filters(parsed):
    filing_date = parsed.get("filing_date")
    if not filing_date:
        print("FILTER: no filing_date")
        return False

    try:
        year = datetime.strptime(filing_date, "%Y-%m-%d").year
    except ValueError:
        print("FILTER: bad filing_date format", filing_date)
        return False

    if year < 2010:
        print("FILTER: year < 2010", year)
        return False

    if not parsed.get("inventor_name"):
        print("FILTER: no inventor_name")
        return False

    abstract = parsed.get("abstract")
    if not abstract or len(abstract.strip()) < 20:
        print("FILTER: bad abstract")
        return False

    status = parsed.get("status", "").lower()
    bad_statuses = ["withdrawn", "abandoned"]
    if any(s in status for s in bad_statuses):
        print("FILTER: bad status", status)
        return False

    if not parsed.get("patent_id"):
        print("FILTER: no patent_id")
        return False

    print("FILTER: passed")
    return True

# ---------------------------------------------------------
# UPSERT MAIN PATENT
# ---------------------------------------------------------
def upsert_to_supabase(parsed):
    try:
        patent_id_int = int(parsed["patent_id"])
    except (TypeError, ValueError):
        print("❌ Invalid patent_id:", parsed["patent_id"])
        return

    data = {
        "patent_id": patent_id_int,
        "title": parsed.get("title"),
        "status": parsed.get("status"),
        "filing_date": parsed.get("filing_date"),
        "expiry_date": parsed.get("expiry_date"),
        "abstract": parsed.get("abstract"),
        "inventor_name": parsed.get("inventor_name"),
        "publication_date": parsed.get("publication_date"),
        "raw_xml": parsed.get("raw_xml")
    }

    url = f"{SUPABASE_URL}/rest/v1/patents?on_conflict=patent_id"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    response = requests.post(url, json=data, headers=headers)
    print("Supabase Status:", response.status_code)
    print("Supabase Response:", response.text)

# ---------------------------------------------------------
# UPSERT ASSOCIATED
# ---------------------------------------------------------
def upsert_associated_patents(parsed):
    try:
        patent_id_int = int(parsed["patent_id"])
    except:
        print("❌ Invalid patent_id for association insert")
        return

    assoc_list = parsed.get("associated_patents", [])
    if not assoc_list:
        print("No associated patents found.")
        return

    url = f"{SUPABASE_URL}/rest/v1/patent_associations?on_conflict=patent_id,associated_patent_id"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    for assoc in assoc_list:
        data = {
            "patent_id": patent_id_int,
            "associated_patent_id": int(assoc["associated_patent_id"]),
            "association_type": assoc["association_type"]
        }

        response = requests.post(url, json=data, headers=headers)
        print("Association insert status:", response.status_code)

# ---------------------------------------------------------
# UPSERT FAMILY MEMBERS
# ---------------------------------------------------------
def upsert_family(parsed):
    try:
        patent_id_int = int(parsed["patent_id"])
    except:
        print("❌ Invalid patent_id for family insert")
        return

    family_list = parsed.get("family", [])
    if not family_list:
        print("No family data found.")
        return

    url = f"{SUPABASE_URL}/rest/v1/patent_family_members"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    for fam in family_list:
        data = {
            "patent_id": patent_id_int,
            "priority_country": fam["priority_country"],
            "priority_number": fam["priority_number"],
            "priority_date": fam["priority_date"]
        }
        response = requests.post(url, json=data, headers=headers)
        print("Family insert status:", response.status_code)

# ---------------------------------------------------------
# UPSERT MAINTENANCE EVENTS
# ---------------------------------------------------------
def upsert_maintenance_events(parsed):
    try:
        patent_id_int = int(parsed["patent_id"])
    except:
        print("❌ Invalid patent_id for maintenance insert")
        return

    events = parsed.get("maintenance_events", [])
    if not events:
        print("No maintenance events found.")
        return

    url = f"{SUPABASE_URL}/rest/v1/patent_maintenance_events"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    for ev in events:
        data = {
            "patent_id": patent_id_int,
            "event_code": ev["event_code"],
            "due_date": ev["due_date"],
            "completed_date": ev["completed_date"],
            "journal_issue": ev["journal_issue"],
            "journal_publication_date": ev["journal_publication_date"]
        }
        response = requests.post(url, json=data, headers=headers)
        print("Maintenance insert status:", response.status_code)

# ---------------------------------------------------------
# UPSERT CLASSIFICATIONS
# ---------------------------------------------------------
def upsert_classifications(parsed):
    try:
        patent_id_int = int(parsed["patent_id"])
    except:
        print("❌ Invalid patent_id for classification insert")
        return

    classifications = parsed.get("classifications", [])
    if not classifications:
        print("No classifications found.")
        return

    url = f"{SUPABASE_URL}/rest/v1/patent_classification"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    for cls in classifications:
        data = {
            "patent_id": patent_id_int,
            "kind_code": cls["kind_code"],
            "version": cls["version"],
            "raw_code": cls["raw_code"],
            "section": cls["section"],
            "class": cls["class"],
            "subclass": cls["subclass"],
            "ipc_group": cls["ipc_group"]
        }

        response = requests.post(url, json=data, headers=headers)
        print("Classification insert status:", response.status_code)

# ---------------------------------------------------------
# FIND RELATED NZ PATENTS BY PRIORITY NUMBER
# ---------------------------------------------------------
def find_related_patents(priority_number):
    url = f"{SUPABASE_URL}/rest/v1/patent_family_members?priority_number=eq.{priority_number}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        print("❌ Failed to fetch related patents:", response.text)
        return []

    rows = response.json()
    return [row["patent_id"] for row in rows]

# ---------------------------------------------------------
# INGEST ASSOCIATED PATENTS
# ---------------------------------------------------------
def ingest_related_patents(parsed):
    # ---------------------------
    # 1. Priority-based family
    # ---------------------------
    family_list = parsed.get("family", [])
    for fam in family_list:
        priority_number = fam["priority_number"]

        related_ids = find_related_patents(priority_number)

        for pid in related_ids:
            if str(pid) == str(parsed["patent_id"]):
                continue

            print(f"🔍 Found related NZ patent {pid} for priority {priority_number}")

            xml_data = fetch_patent_xml(pid)
            if not xml_data:
                continue

            child_parsed = parse_patent_xml(xml_data)
            if not child_parsed:
                continue

            if passes_filters(child_parsed):
                print(f"📥 Inserting related patent {pid}")
                upsert_to_supabase(child_parsed)
                upsert_family(child_parsed)
                upsert_maintenance_events(child_parsed)
                upsert_classifications(child_parsed)
                upsert_associated_patents(child_parsed)

    # ---------------------------
    # 2. Associated patents (parent/child divisionals)
    # ---------------------------
    assoc_list = parsed.get("associated_patents", [])
    for assoc in assoc_list:
        pid = assoc["associated_patent_id"]

        print(f"🔍 Found associated patent {pid} ({assoc['association_type']})")

        xml_data = fetch_patent_xml(pid)
        if not xml_data:
            continue

        assoc_parsed = parse_patent_xml(xml_data)
        if not assoc_parsed:
            continue

        if passes_filters(assoc_parsed):
            print(f"📥 Inserting associated patent {pid}")
            upsert_to_supabase(assoc_parsed)
            upsert_family(assoc_parsed)
            upsert_maintenance_events(assoc_parsed)
            upsert_classifications(assoc_parsed)


# ---------------------------------------------------------
# BULK RUNNER
# ---------------------------------------------------------
def run_until_saves(start=786100, target_saves=20):
    print(f"🚀 Starting batch — stopping after {target_saves} successful inserts")

    saves = 0
    patent_number = start

    while saves < target_saves:
        print(f"\nProcessing patent {patent_number}")

        try:
            xml_data = fetch_patent_xml(patent_number)
            if not xml_data:
                patent_number += 1
                continue

            parsed = parse_patent_xml(xml_data)
            if not parsed:
                patent_number += 1
                continue

            if not passes_filters(parsed):
                print(f"⏭️ Skipping {patent_number} — did not pass filters")
                patent_number += 1
                continue

            print(f"✅ Inserting {patent_number}")
            upsert_to_supabase(parsed)
            upsert_family(parsed)
            upsert_maintenance_events(parsed)
            upsert_classifications(parsed)
            ingest_related_patents(parsed)

            saves += 1
            print(f"💾 Saved {saves}/{target_saves}")

            time.sleep(1.2)

        except Exception as e:
            print(f"❌ Error on {patent_number}: {e}")

        patent_number += 1

    print("🎉 Done — reached target saves!")

# ---------------------------------------------------------
# MAIN ENTRY POINT
# ---------------------------------------------------------
if __name__ == "__main__":
    run_until_saves(start=786100, target_saves=20)

# ---------------------------------------------------------
# TEST MODE
# ---------------------------------------------------------
"""
if __name__ == "__main__":
    patent_number = 826405
    print(f"Fetching patent {patent_number}...")

    xml_data = fetch_patent_xml(patent_number)
    print("RAW XML:", xml_data[:500] if xml_data else "None")

    if xml_data:
        parsed = parse_patent_xml(xml_data)
        print("PARSED:", parsed)

        if parsed:
            print("FILTER RESULT:", passes_filters(parsed))

            if passes_filters(parsed):
                print("Attempting Supabase insert...")
                upsert_to_supabase(parsed)
                upsert_family(parsed)
                upsert_maintenance_events(parsed)
                upsert_classifications(parsed)
                ingest_related_patents(parsed)
            else:
                print("Not inserting due to filters.")
"""