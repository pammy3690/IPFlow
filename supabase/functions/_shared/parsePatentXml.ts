import { XMLParser } from "npm:fast-xml-parser@4";

// Port of JM_Practice.py's parse_patent_xml — same field extraction, same
// quirks (e.g. inventor_name is the *first* FreeFormatNameLine found in
// document order, which is actually an applicant name in IPONZ's XML, not
// necessarily the inventor's — kept as-is so records look identical whether
// they came from the batch sync script or this on-demand fetch).

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  textNodeName: "#text",
  isArray: (name) =>
    ["Classification", "PatentEvent", "AssociatedPatent"].includes(name),
});

// Depth-first walk yielding every {tag, node} pair (tag = local element name),
// mirroring the reach of ElementTree's `elem.iter()` used throughout the
// Python parser.
function* walk(node: unknown, tag = ""): Generator<{ tag: string; node: unknown }> {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (const item of node) yield* walk(item, tag);
    return;
  }
  if (tag) yield { tag, node };
  if (typeof node === "object") {
    for (const key of Object.keys(node as Record<string, unknown>)) {
      if (key.startsWith("@_") || key === "#text") continue;
      yield* walk((node as Record<string, unknown>)[key], key);
    }
  }
}

function textOf(node: unknown): string | null {
  if (node === null || node === undefined) return null;
  if (typeof node === "string" || typeof node === "number") return String(node).trim();
  if (typeof node === "object" && node !== null && "#text" in (node as Record<string, unknown>)) {
    return String((node as Record<string, unknown>)["#text"]).trim();
  }
  return null;
}

function findText(scope: unknown, tag: string): string | null {
  for (const { tag: t, node } of walk(scope, "")) {
    if (t === tag) {
      const txt = textOf(node);
      if (txt) return txt;
    }
  }
  return null;
}

function findFirstNode(scope: unknown, tag: string): unknown {
  for (const { tag: t, node } of walk(scope, "")) {
    if (t === tag) return node;
  }
  return null;
}

export interface ParsedClassification {
  kind_code: string | null;
  version: string | null;
  raw_code: string;
  section: string | null;
  class: string | null;
  subclass: string | null;
  ipc_group: string | null;
}

export interface ParsedFamilyMember {
  priority_country: string | null;
  priority_number: string;
  priority_date: string | null;
}

export interface ParsedAssociatedPatent {
  associated_patent_id: string;
  association_type: string | null;
}

export interface ParsedMaintenanceEvent {
  event_code: string;
  due_date: string | null;
  completed_date: string | null;
  journal_issue: string | null;
  journal_publication_date: string | null;
}

export interface ParsedPatent {
  patent_id: string | null;
  title: string | null;
  status: string | null;
  filing_date: string | null;
  expiry_date: string | null;
  abstract: string | null;
  inventor_name: string | null;
  publication_date: string | null;
  raw_xml: string;
  family: ParsedFamilyMember[];
  associated_patents: ParsedAssociatedPatent[];
  maintenance_events: ParsedMaintenanceEvent[];
  classifications: ParsedClassification[];
}

function extractInventor(patent: unknown): string | null {
  for (const { tag, node } of walk(patent, "")) {
    if (tag === "FreeFormatNameLine") {
      const txt = textOf(node);
      if (txt) return txt;
    }
  }
  return null;
}

function extractAssociatedPatents(patent: unknown): ParsedAssociatedPatent[] {
  const out: ParsedAssociatedPatent[] = [];
  const details = findFirstNode(patent, "AssociatedPatentDetails");
  if (!details) return out;
  for (const { tag, node } of walk(details, "")) {
    if (tag !== "AssociatedPatent") continue;
    const num = findText(node, "AssociatedPatentNumber");
    const typ = findText(node, "AssociationType");
    if (num) out.push({ associated_patent_id: num, association_type: typ });
  }
  return out;
}

function extractFamily(patent: unknown): ParsedFamilyMember[] {
  const families: ParsedFamilyMember[] = [];
  for (const { tag, node } of walk(patent, "")) {
    if (!tag.includes("Priority")) continue;
    const country =
      findText(node, "PriorityCountryCode") ||
      findText(node, "CountryCode") ||
      findText(node, "PriorityCountry") ||
      findText(node, "Country");
    const number =
      findText(node, "PriorityNumber") ||
      findText(node, "ApplicationNumber") ||
      findText(node, "PriorityNo") ||
      findText(node, "Number");
    const date =
      findText(node, "PriorityDate") ||
      findText(node, "PriorityFilingDate") ||
      findText(node, "Date");
    if (number) families.push({ priority_country: country, priority_number: number, priority_date: date });
  }
  // dedupe by (country, number, date), last wins — matches Python dict overwrite
  const uniq = new Map<string, ParsedFamilyMember>();
  for (const fam of families) uniq.set(`${fam.priority_country}|${fam.priority_number}|${fam.priority_date}`, fam);
  return [...uniq.values()];
}

function extractMaintenanceEvents(patent: unknown): ParsedMaintenanceEvent[] {
  const out: ParsedMaintenanceEvent[] = [];
  const details = findFirstNode(patent, "PatentEventDetails");
  if (!details) return out;
  const allowed = new Set(["PT_MaintainReminderSend", "PT_MTCFEEPAID"]);
  for (const { tag, node } of walk(details, "")) {
    if (tag !== "PatentEvent") continue;
    const code = findText(node, "PatentEventCode");
    if (!code || !allowed.has(code)) continue;
    out.push({
      event_code: code,
      due_date: findText(node, "PatentEventDueDate"),
      completed_date: findText(node, "PatentEventCompletedDate"),
      journal_issue: findText(node, "PatentEventJournalIssue"),
      journal_publication_date: findText(node, "PatentEventJournalPublicationDate"),
    });
  }
  // dedupe, matches Python's tuple-key dict overwrite
  const uniq = new Map<string, ParsedMaintenanceEvent>();
  for (const ev of out) {
    uniq.set(`${ev.event_code}|${ev.due_date}|${ev.completed_date}|${ev.journal_issue}|${ev.journal_publication_date}`, ev);
  }
  return [...uniq.values()];
}

function extractClassifications(patent: unknown): ParsedClassification[] {
  const out: ParsedClassification[] = [];
  const details = findFirstNode(patent, "ClassificationDetails");
  if (!details) return out;
  for (const { tag, node } of walk(details, "")) {
    if (tag !== "Classification") continue;
    const kind = findText(node, "ClassificationKindCode");
    const version = findText(node, "ClassificationVersion");
    const descDetails = findFirstNode(node, "ClassDescriptionDetails");
    const rawCode = descDetails ? findText(descDetails, "ClassDescription") : null;
    if (!rawCode) continue;
    const parts = rawCode.split(/\s+/);
    const section = parts[0]?.[0] ?? null;
    const classCode = parts[0] && parts[0].length >= 3 ? parts[0].slice(0, 3) : null;
    const subclass = parts[0] ?? null;
    const ipcGroup = parts.length > 1 ? parts[1] : null;
    out.push({ kind_code: kind, version, raw_code: rawCode, section, class: classCode, subclass, ipc_group: ipcGroup });
  }
  // dedupe by raw_code, last wins — matches Python dict overwrite
  const uniq = new Map<string, ParsedClassification>();
  for (const c of out) uniq.set(c.raw_code, c);
  return [...uniq.values()];
}

export function parsePatentXml(xmlText: string): ParsedPatent | null {
  let doc: unknown;
  try {
    doc = parser.parse(xmlText);
  } catch {
    return null;
  }

  const patent = findFirstNode(doc, "Patent");
  if (!patent) return null;

  return {
    patent_id: findText(patent, "PatentNumber"),
    title: findText(patent, "PatentTitle"),
    status: findText(patent, "PatentCurrentStatusCode"),
    filing_date: findText(patent, "CompleteFiledDate"),
    expiry_date: findText(patent, "ExpiryDate"),
    abstract: findText(patent, "PatentAbstract"),
    inventor_name: extractInventor(patent),
    publication_date: findText(patent, "PublishedDate"),
    raw_xml: xmlText,
    family: extractFamily(patent),
    associated_patents: extractAssociatedPatents(patent),
    maintenance_events: extractMaintenanceEvents(patent),
    classifications: extractClassifications(patent),
  };
}
