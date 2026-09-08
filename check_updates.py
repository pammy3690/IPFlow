"""
Batched update-checker: each run only checks the N patents that were
least recently checked, so ~1000 patents spread across several runs
per day instead of one big burst.

Requires a last_checked_at column on your Supabase `patents` table:
  ALTER TABLE patents ADD COLUMN last_checked_at timestamptz;
"""

import time
import requests
from datetime import datetime, timezone

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

BATCH_SIZE = 400  # 1.3k portfolio, hourly runs -> full portfolio cycles roughly every ~3-4 hours


# ---------------------------------------------------------
# LOG A CHANGE TO patent_logs (id, patent_id, action, old_data, new_data, changed_at)
# ---------------------------------------------------------
def log_change(patent_id, old_status, new_status, old_expiry, new_expiry):
    url = f"{SUPABASE_URL}/rest/v1/patent_logs"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "patent_id": patent_id,
        "action": "UPDATE",
        "old_data": {"status": old_status, "expiry_date": old_expiry},
        "new_data": {"status": new_status, "expiry_date": new_expiry},
        "changed_at": datetime.now(timezone.utc).isoformat(),
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code not in (200, 201):
        print("❌ Failed to log change:", response.text)


# ---------------------------------------------------------
# FETCH THE LEAST-RECENTLY-CHECKED BATCH
# ---------------------------------------------------------
def get_batch_to_check(batch_size=BATCH_SIZE):
    """
    Pull the batch_size patents with the oldest last_checked_at
    (nulls first, so newly added patents get checked before anything else).
    """
    url = (
        f"{SUPABASE_URL}/rest/v1/patents"
        f"?select=patent_id,status,expiry_date,last_checked_at"
        f"&order=last_checked_at.asc.nullsfirst"
        f"&limit={batch_size}"
    )
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print("❌ Failed to fetch batch:", response.text)
        return []
    return response.json()


# ---------------------------------------------------------
# MARK A PATENT AS CHECKED (even if nothing changed)
# ---------------------------------------------------------
def mark_checked(patent_id):
    url = f"{SUPABASE_URL}/rest/v1/patents?patent_id=eq.{patent_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    data = {"last_checked_at": datetime.now(timezone.utc).isoformat()}
    requests.patch(url, json=data, headers=headers)


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
# CHECK ONE BATCH
# ---------------------------------------------------------
def check_batch_for_updates(sleep_seconds=1.5, batch_size=BATCH_SIZE):
    batch = get_batch_to_check(batch_size)
    print(f"🔎 Checking a batch of {len(batch)} patents")

    changed = 0
    checked = 0

    for row in batch:
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
            log_change(patent_number, old_status, new_status, old_expiry, new_expiry)
            changed += 1
        else:
            print(f"✅ No change: {patent_number}")

        mark_checked(patent_number)
        time.sleep(sleep_seconds)

    print(f"🎉 Batch complete — checked {checked}, {changed} changed")
    return changed


if __name__ == "__main__":
    check_batch_for_updates()
