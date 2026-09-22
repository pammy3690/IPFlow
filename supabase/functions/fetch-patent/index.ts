// On-demand patent lookup: called from the search bar when a user searches
// by exact patent number and it isn't in Supabase yet. Checks `patents`
// first; on a miss, pulls the record from the IPONZ gateway API, saves it
// (and its classifications/family/maintenance events/associations) into
// Supabase, and returns it so the frontend can display it immediately.
//
// Deliberately does NOT apply JM_Practice.py's passes_filters() gate (year >=
// 2010, has inventor, abstract length, non-withdrawn status) — that gate
// exists to keep noise out of the *bulk* crawl, not to hide a patent someone
// explicitly asked for by number. Also deliberately does not recurse into
// related/associated patents (JM_Practice.py's ingest_related_patents) — that
// stays a batch-only concern to keep this request fast and predictable.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { parsePatentXml, type ParsedPatent } from "../_shared/parsePatentXml.ts";

const IPONZ_BASE_URL = "https://api.business.govt.nz/gateway/intellectual-property-office-nz/v5/patent";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { patent_id?: string | number };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const rawId = String(body.patent_id ?? "").trim();
  if (!/^\d+$/.test(rawId)) {
    return json({ error: "patent_id must be a positive integer" }, 400);
  }
  const patentIdInt = Number(rawId);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fast path: already in Supabase.
  const { data: existing, error: existingError } = await supabase
    .from("patents")
    .select("*")
    .eq("patent_id", patentIdInt)
    .maybeSingle();

  if (existingError) {
    console.error("Supabase lookup failed:", existingError);
    return json({ error: "Failed to query Supabase" }, 500);
  }
  if (existing) {
    return json({ patent: existing, source: "cache" });
  }

  // Miss: pull from IPONZ.
  const gatewayKey = Deno.env.get("GATEWAY_API");
  if (!gatewayKey) {
    console.error("GATEWAY_API secret is not set");
    return json({ error: "Server is not configured to reach IPONZ" }, 500);
  }

  let xmlResponse: Response;
  try {
    xmlResponse = await fetch(`${IPONZ_BASE_URL}/${patentIdInt}`, {
      headers: { Accept: "application/xml", "Ocp-Apim-Subscription-Key": gatewayKey },
    });
  } catch (err) {
    console.error("IPONZ request failed:", err);
    return json({ error: "Failed to reach IPONZ" }, 502);
  }

  if (xmlResponse.status === 404) {
    return json({ error: `Patent ${patentIdInt} was not found in IPONZ.` }, 404);
  }
  if (!xmlResponse.ok) {
    console.error("IPONZ returned", xmlResponse.status, await xmlResponse.text());
    return json({ error: "IPONZ lookup failed" }, 502);
  }

  const xmlText = await xmlResponse.text();
  const parsed = parsePatentXml(xmlText);
  if (!parsed || !parsed.patent_id) {
    return json({ error: "Could not parse IPONZ response for this patent" }, 502);
  }

  const patentRow = {
    patent_id: patentIdInt,
    title: parsed.title,
    status: parsed.status,
    filing_date: parsed.filing_date,
    expiry_date: parsed.expiry_date,
    abstract: parsed.abstract,
    inventor_name: parsed.inventor_name,
    publication_date: parsed.publication_date,
    raw_xml: parsed.raw_xml,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("patents")
    .upsert(patentRow, { onConflict: "patent_id" })
    .select("*")
    .single();

  if (insertError) {
    console.error("Failed to insert patent:", insertError);
    return json({ error: "Failed to save patent to Supabase" }, 500);
  }

  await Promise.all([
    upsertClassifications(supabase, patentIdInt, parsed.classifications),
    upsertFamily(supabase, patentIdInt, parsed.family),
    upsertMaintenanceEvents(supabase, patentIdInt, parsed.maintenance_events),
    upsertAssociatedPatents(supabase, patentIdInt, parsed.associated_patents),
  ]);

  return json({ patent: inserted, source: "live" });
});

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function upsertClassifications(supabase: SupabaseClient, patentId: number, classifications: ParsedPatent["classifications"]) {
  if (!classifications.length) return;
  const rows = classifications.map((c) => ({
    patent_id: patentId,
    kind_code: c.kind_code,
    version: c.version,
    raw_code: c.raw_code,
    section: c.section,
    class: c.class,
    subclass: c.subclass,
    ipc_group: c.ipc_group,
  }));
  const { error } = await supabase.from("patent_classification").insert(rows);
  if (error) console.error("Failed to insert classifications:", error);
}

async function upsertFamily(supabase: SupabaseClient, patentId: number, family: ParsedPatent["family"]) {
  if (!family.length) return;
  const rows = family.map((f) => ({
    patent_id: patentId,
    priority_country: f.priority_country,
    priority_number: f.priority_number,
    priority_date: f.priority_date,
  }));
  const { error } = await supabase.from("patent_family_members").insert(rows);
  if (error) console.error("Failed to insert family members:", error);
}

async function upsertMaintenanceEvents(supabase: SupabaseClient, patentId: number, events: ParsedPatent["maintenance_events"]) {
  if (!events.length) return;
  const rows = events.map((e) => ({
    patent_id: patentId,
    event_code: e.event_code,
    due_date: e.due_date,
    completed_date: e.completed_date,
    journal_issue: e.journal_issue,
    journal_publication_date: e.journal_publication_date,
  }));
  const { error } = await supabase.from("patent_maintenance_events").insert(rows);
  if (error) console.error("Failed to insert maintenance events:", error);
}

async function upsertAssociatedPatents(supabase: SupabaseClient, patentId: number, associated: ParsedPatent["associated_patents"]) {
  if (!associated.length) return;
  const rows = associated
    .filter((a) => /^\d+$/.test(a.associated_patent_id))
    .map((a) => ({
      patent_id: patentId,
      associated_patent_id: Number(a.associated_patent_id),
      association_type: a.association_type,
    }));
  if (!rows.length) return;
  const { error } = await supabase
    .from("patent_associations")
    .upsert(rows, { onConflict: "patent_id,associated_patent_id" });
  if (error) console.error("Failed to insert associated patents:", error);
}
