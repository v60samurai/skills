// The mechanical half of the material information loss check. A fixture lists
// the items its source carries that must survive (every roadmap phase, every
// step, every testing expectation, every open question, every contract value).
// The inventory reports which are missing from a handoff.
//
// An item is a literal string, matched without regard to case, spacing or
// dash and quote style, or an object:
//   { "name": "phase 4", "re": "ADR classes? 2 and 3", "in": "source roadmap" }
//   { "text": "lane_metres_remaining" }
// `in` is a regex over heading titles: the item must appear inside a matching
// section. `re` is a regex, `text` a literal.

// Split on Markdown headings. A section runs to the next heading of the same
// or a higher level, so a `##` section includes its `###` subsections.
export function sections(text) {
  const lines = String(text).split('\n')
  let fence = false
  const heads = lines.flatMap((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) fence = !fence
    const m = fence ? null : /^(#{1,6})\s+(.*)/.exec(l)
    return m ? [{ i, level: m[1].length, title: m[2] }] : []
  })
  return heads.map((h, n) => {
    const end = heads.slice(n + 1).find((x) => x.level <= h.level)
    return { title: h.title, level: h.level, body: lines.slice(h.i + 1, end ? end.i : lines.length).join('\n') }
  })
}

export const within = (text, heading) => sections(text).filter((s) => new RegExp(heading, 'im').test(s.title)).map((s) => s.body).join('\n')

const plain = (s) => String(s).replace(/[\u2010-\u2015\u2212]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u00a0\u202f]/g, ' ').replace(/[ \t]+/g, ' ')
const literal = (s) => new RegExp(plain(s).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'), 'i')

export function itemName(item) { return typeof item === 'string' ? item : item.name ?? item.text ?? item.re }

export function keeps(item, text) {
  const it = typeof item === 'string' ? { text: item } : item
  const scope = plain(it.in ? within(text, it.in) : text)
  return (it.re ? new RegExp(it.re, 'im') : literal(it.text)).test(scope)
}

export function inventory(items, text) {
  const missing = items.filter((item) => !keeps(item, text)).map((item) => (typeof item === 'object' && item.in ? `${itemName(item)} (in ${item.in})` : itemName(item)))
  return { total: items.length, kept: items.length - missing.length, missing,
    report: missing.length ? `MATERIAL INFORMATION LOSS: ${missing.length} of ${items.length} items missing` : 'MATERIAL INFORMATION LOSS: NONE' }
}
