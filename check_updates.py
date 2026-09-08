"""
Periodic update-checker: re-checks patents already in Supabase against
IPONZ and upserts only what changed. Run on a schedule (GitHub Actions)
separately from JM_Practice.py's run_until_saves() discovery crawler.
"""

import time
import requests

from JM_Practice import (
    fetch_patent_xml,
    parse_patent_xml,
    upsert_to_supabase,
    upsert_family,
    upsert_maintenance_events,
    upsert_classifications,
    upsert_associated_patents,
    BASE_URL,
    HEADERS,
    SUPABASE_URL,
    SUPABASE_KEY,
)


# ---------------------------------------------------------
# FETCH EXISTING PATENT IDS + LAST KNOWN STATE
# ---------------------------------------------------------
def get_existing_patents():
    """Pull patent_id, status, expiry_date for everything already stored."""
    url = f"{SUPABASE_URL}/rest/v1/patents?select=patent_id,status,expiry_date"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print("❌ Failed to fetch existing patents:", response.text)
        return []
    return response.json()


# ---------------------------------------------------------
# FETCH WITH EXPONENTIAL BACKOFF ON 429
# ---------------------------------------------------------
def fetch_with_backoff(patent_number, max_retries=5):
    url = f"{BASE_URL}/{patent_number}"

    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=HEADERS)
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed for {patent_number}: {e}")
            return None

        if response.status_code == 429:
            delay = min(2 ** attempt * 2, 60)
            print(f"⏳ 429 on {patent_number}, retrying in {delay}s "
                  f"(attempt {attempt + 1}/{max_retries})")
            time.sleep(delay)
            continue

        if response.status_code == 404:
            print(f"❌ {patent_number} not found")
            return None

        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            print(f"❌ HTTP error for {patent_number}: {e}")
            return None

        return response.text

    print(f"❌ Giving up on {patent_number} after {max_retries} retries (still rate-limited)")
    return None


# ---------------------------------------------------------
# MAIN UPDATE-CHECK PASS
# ---------------------------------------------------------
def check_existing_for_updates(sleep_seconds=1.5):
    """
    Re-fetch every patent already in Supabase and upsert only if
    status or expiry_date changed since our last stored copy.
    """
    existing = get_existing_patents()
    print(f"🔎 Checking {len(existing)} existing patents for updates")

    changed = 0
    checked = 0

    for row in existing:
        patent_number = row["patent_id"]
        old_status = row.get("status")
        old_expiry = row.get("expiry_date")

        xml_data = fetch_with_backoff(patent_number)
        checked += 1

        if not xml_data:
            time.sleep(sleep_seconds)
            continue

        parsed = parse_patent_xml(xml_data)
        if not parsed:
            time.sleep(sleep_seconds)
            continue

        new_status = parsed.get("status")
        new_expiry = parsed.get("expiry_date")

        if new_status != old_status or new_expiry != old_expiry:
            print(
                f"🔄 Change on {patent_number}: "
                f"status {old_status!r} -> {new_status!r}, "
                f"expiry {old_expiry!r} -> {new_expiry!r}"
            )
            upsert_to_supabase(parsed)
            upsert_family(parsed)
            upsert_maintenance_events(parsed)
            upsert_classifications(parsed)
            upsert_associated_patents(parsed)
            changed += 1
        else:
            print(f"✅ No change: {patent_number}")

        time.sleep(sleep_seconds)

    print(f"🎉 Update check complete — checked {checked}, {changed} changed")
    return changed


if __name__ == "__main__":
    check_existing_for_updates()
