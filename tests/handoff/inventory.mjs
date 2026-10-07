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

// The repetition half of the size guard: a statement that the handoff makes
// twice. A statement is one sentence of prose, outside the header, headings,
// code blocks and tables. Two statements are the same when they share at
// least `alike` of their distinct words (Jaccard), so a reworded copy counts
// and two different facts about one subject do not. Statements under `floor`
// words are left out: "Tess is chasing." says too little to compare.
//
// Sections whose title matches `exempt` are skipped. By the skill's own rule a
// testing or acceptance item stays whole where it stands even when another
// section states it, and Source provenance lists what each source contributed.
const EXEMPT = 'testing|proof expectations|acceptance|provenance'
const words = (s) => plain(s).toLowerCase().replace(/[`*_~]/g, '').replace(/[^a-z0-9%+./:{}-]+/g, ' ').trim().split(' ').filter((w) => /[a-z0-9]/.test(w)).map((w) => w.replace(/^[.:/-]+|[.:/-]+$/g, ''))

export function statements(text, { exempt = EXEMPT, floor = 7 } = {}) {
  const skip = new RegExp(exempt, 'i')
  const out = []
  let fence = false, trail = []
  for (const raw of String(text).replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*(```|~~~)/.test(raw)) { fence = !fence; continue }
    if (fence) continue
    const h = /^(#{1,6})\s+(.*)/.exec(raw)
    if (h) { trail = [...trail.filter((t) => t.level < h[1].length), { level: h[1].length, title: h[2] }]; continue }
    if (!trail.some((t) => t.level >= 2) || trail.some((t) => skip.test(t.title)) || /^\s*\|/.test(raw)) continue
    const line = raw.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '').replace(/^\s*>\s?/, '')
    for (const sentence of line.split(/(?<=[.?!])\s+(?=[A-Z0-9`"*])/)) {
      const w = words(sentence)
      if (w.length >= floor) out.push({ section: trail.map((t) => t.title).join(' > '), text: sentence.trim(), set: new Set(w) })
    }
  }
  return out
}

export function repeats(text, { alike = 0.8, ...rest } = {}) {
  const all = statements(text, rest)
  const found = []
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i].set, b = all[j].set
    let shared = 0
    for (const w of a) if (b.has(w)) shared++
    const score = shared / (a.size + b.size - shared)
    if (score >= alike) found.push({ score: Number(score.toFixed(2)), first: all[i], second: all[j] })
  }
  return found
}
