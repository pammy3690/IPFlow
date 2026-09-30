import { supabase } from './supabaseClient.js'

// ipc_titles.raw_code may or may not include the space patent_classification
// uses between subclass and group (e.g. "C07K 14/47" vs "C07K14/47") — strip
// whitespace so lookups match either way.
const norm = (value) => (value || '').toString().replace(/\s+/g, '').toUpperCase()

// Builds the literal raw_code strings worth querying ipc_titles for, from
// most specific (full group) to least specific (section), for one
// classification-like row ({ raw_code, section, class, subclass, ipc_group }).
function candidateCodes(c) {
  const codes = []
  if (c.subclass && c.ipc_group) {
    codes.push(`${c.subclass} ${c.ipc_group}`, `${c.subclass}${c.ipc_group}`)
  }
  if (c.raw_code) codes.push(c.raw_code, c.raw_code.replace(/\s+/g, ''))
  if (c.subclass) codes.push(c.subclass)
  if (c.class) codes.push(c.class)
  if (c.section) codes.push(c.section)
  return codes.filter(Boolean)
}

// Fetches a normalized-code -> title map covering every classification row
// passed in, at every level (group/subclass/class/section) so callers can
// fall back to a broader title when a specific one isn't available.
export async function fetchIpcTitleMap(classifications) {
  const candidates = new Set()
  classifications.forEach((c) => candidateCodes(c).forEach((code) => candidates.add(code)))

  const map = new Map()
  if (candidates.size === 0) return map

  const { data, error } = await supabase
    .from('ipc_titles')
    .select('raw_code, title')
    .in('raw_code', [...candidates])

  if (error) {
    console.error('Failed to fetch IPC titles:', error)
    return map
  }
  ;(data || []).forEach((row) => {
    if (row.raw_code && row.title) map.set(norm(row.raw_code), row.title)
  })
  return map
}

// Resolves the most specific title available for a classification row,
// falling back group -> subclass -> class -> section.
export function resolveIpcTitle(c, titleMap) {
  if (!c || !titleMap || titleMap.size === 0) return null
  for (const code of candidateCodes(c)) {
    const hit = titleMap.get(norm(code))
    if (hit) return hit
  }
  return null
}
