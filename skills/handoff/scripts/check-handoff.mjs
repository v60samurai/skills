#!/usr/bin/env node
// Structural checks on a /handoff file, run by step 8 before the file is
// written. It checks what a reader can verify without a model: the parts and
// their order, the S, E and T ids, every citation in Parts A to C, each
// ticket's fields and order, the readiness and assets headers against the
// body, and each stored image's path and hash.
//
//   node check-handoff.mjs <handoff.md> [--root <directory the handoff is written to>]
//
// --root defaults to the file's own directory. Prints `ok: ...` and exits 0,
// or prints one problem per line and exits 1.
import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, resolve, isAbsolute, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const BUILD_RULE = 'How to build from this file. Build only when the header reads `Contract: approved`, or when the user approves this contract in the request that starts the build. Build the READY tickets, each once the tickets in its `Blocked by` line are done. Take each BLOCKED ticket and each product call to the user, and settle each prototype fork by running something. Part D is the evidence behind every line here: read it, and its images, for any detail a ticket cites.'
export const PART_NAMES = { A: 'Execution contract', B: 'Specification', C: 'Tickets', D: 'Evidence' }
// Evidence sections whose statements the execution parts must cite.
const COVERED = /^## (Requirements|Testing \/ QA \/ proof expectations|Source acceptance \/ expectations)\s*$/
const ITEM = /^(?:[-*+]|\d+[.)])\s+(.*)$/
const FENCE = /^\s*(```|~~~)/

// The file's lines, each marked when it sits inside a fenced code block.
function scan(text) {
  let fence = null
  return String(text).replace(/\r\n?/g, '\n').split('\n').map((raw, i) => {
    const f = FENCE.exec(raw)
    if (fence) { if (f && f[1] === fence) fence = null; return { n: i + 1, raw, code: true } }
    if (f) { fence = f[1]; return { n: i + 1, raw, code: true } }
    return { n: i + 1, raw, code: false }
  })
}

// The header's `Label: value` lines, before the first heading after the title.
export function headerFields(text) {
  const fields = {}
  for (const { raw } of scan(text).slice(1)) {
    if (/^#/.test(raw)) break
    const m = /^([A-Z][A-Za-z ]+): (.*)$/.exec(raw)
    if (m) fields[m[1]] = m[2].trim()
  }
  return fields
}

// Where each part starts and ends, as line indexes. A file with no part
// headings is evidence only, from its first `##` heading to the end.
export function parts(text) {
  const lines = scan(text)
  const found = lines.map((l, i) => ({ i, m: !l.code && /^# Part ([A-D]): (.*)$/.exec(l.raw) })).filter((x) => x.m)
  const problems = []
  const ranges = {}
  if (!found.length) {
    const start = lines.findIndex((l) => !l.code && /^##\s/.test(l.raw))
    ranges.D = [start === -1 ? lines.length : start, lines.length]
    return { lines, ranges, hasParts: false, problems }
  }
  found.forEach(({ i, m }, k) => {
    const [, key, name] = m
    if (ranges[key]) problems.push(`line ${i + 1}: Part ${key} appears twice`)
    if (name.trim() !== PART_NAMES[key]) problems.push(`line ${i + 1}: Part ${key} is headed \`${name.trim()}\`, expected \`${PART_NAMES[key]}\``)
    ranges[key] = [i, k + 1 < found.length ? found[k + 1].i : lines.length]
  })
  const order = found.map((x) => x.m[1]).join('')
  if (order !== [...order].sort().join('')) problems.push(`the parts are in the order ${[...order].join(', ')}, expected A, B, C, D`)
  for (const key of ['A', 'C', 'D']) if (!ranges[key]) problems.push(`no \`# Part ${key}: ${PART_NAMES[key]}\` heading`)
  const firstSection = lines.findIndex((l) => !l.code && /^##\s/.test(l.raw))
  if (firstSection !== -1 && firstSection < found[0].i) problems.push(`line ${firstSection + 1}: a section comes before \`# Part A\``)
  return { lines, ranges, hasParts: true, problems }
}

const within = (p, key) => (p.ranges[key] ? p.lines.slice(...p.ranges[key]) : [])
const prose = (raw) => raw.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length))
const ids = (s, letter) => [...String(s).matchAll(new RegExp(`(?<![\\w-])${letter}(\\d+)(?![\\w-])`, 'g'))].map((m) => Number(m[1]))
const tid = (n) => `T${String(n).padStart(2, '0')}`

// Statement ids in the evidence. Every top-level list item opens with
// `S<n>.`, numbered from S1 in order with no gap or repeat. Source provenance
// and Images list sources, not statements, and are left out, as are code
// blocks, quotes and tables. Problems as sentences; an empty list conforms.
export function checkStatementIds(text) {
  return statements(text).bad
}

function statements(text) {
  const p = parts(text)
  const bad = [], found = []
  let body = false, skip = false, section = ''
  for (const { n, raw, code } of within(p, 'D')) {
    if (code) continue
    const h = /^(#{1,6})\s+(.*)/.exec(raw)
    if (h) { if (h[1].length === 2) { body = true; section = raw; skip = /provenance|^images\s*$/i.test(h[2]) } continue }
    const item = ITEM.exec(raw)
    if (!body || skip || !item) continue
    const id = /^S(\d+)\.\s/.exec(item[1])
    if (id) found.push({ n: Number(id[1]), line: n, section })
    else bad.push(`line ${n} is a statement with no \`S<n>.\` id: ${raw.trim().slice(0, 60)}`)
  }
  if (!found.length) bad.unshift('no statement carries an `S<n>.` id')
  found.forEach(({ n, line }, k) => { if (n !== k + 1) bad.push(`line ${line} is S${n}, expected S${k + 1}`) })
  return { bad, found }
}

// Image entries in the evidence's `## Images` section.
export function images(text) {
  const p = parts(text)
  const out = []
  let inImages = false
  for (const { n, raw, code } of within(p, 'D')) {
    if (code) continue
    if (/^##\s/.test(raw)) { inImages = /^##\s+Images\s*$/.test(raw); continue }
    const m = inImages && /^[-*+]\s+E(\d+)\.\s+(.*)$/.exec(raw)
    if (m) {
      const path = /`([^`\s]+\.(?:png|jpe?g|gif|webp|svg))`/i.exec(m[2])?.[1] ?? null
      const sha = /sha256 `([0-9a-f]{64})`/.exec(m[2])?.[1] ?? null
      out.push({ n: Number(m[1]), line: n, stored: !/\bnot stored\b/i.test(m[2]), path, sha })
    }
  }
  return out
}

// Tickets in Part C, each with its fields read.
export function tickets(text) {
  const p = parts(text)
  const lines = within(p, 'C')
  const out = []
  let cur = null
  for (const { n, raw, code } of lines) {
    const h = !code && /^(#{1,3})\s+(.*)$/.exec(raw)
    if (h) {
      const t = h[1].length === 3 && /^T(\d+): (\S.*)$/.exec(h[2])
      cur = t ? { n: Number(t[1]), label: `T${t[1]}`, title: t[2], line: n, body: [] } : null
      if (cur) out.push(cur)
      continue
    }
    if (cur && !code) cur.body.push({ n, raw })
  }
  for (const t of out) {
    const field = (name) => t.body.find((l) => l.raw.startsWith(`${name}:`))
    const status = field('Status'), blocked = field('Blocked by'), rests = field('Rests on')
    t.status = status ? status.raw.slice('Status:'.length).trim() : null
    t.blockedBy = blocked ? blocked.raw.slice('Blocked by:'.length).trim() : null
    t.rests = rests ? rests.raw.slice('Rests on:'.length).trim() : null
    t.what = Boolean(field('What to build'))
    t.proof = Boolean(field('Proof'))
    t.criteria = t.body.filter((l) => /^\s*[-*+]\s+\[[ xX]\]\s+\S/.test(l.raw)).length
    t.ready = t.status === 'READY'
  }
  return out
}

export function checkExecution(text) {
  const p = parts(text)
  const bad = [...p.problems]
  const h = headerFields(text)
  for (const label of ['Contract', 'Execution ready', 'Assets']) if (h[label] === undefined) bad.push(`the header has no \`${label}:\` line`)
  const contract = h.Contract ?? ''
  if (h.Contract !== undefined && !/^(approved \d{4}-\d{2}-\d{2}: ".+"|candidate|none)$/.test(contract)) {
    bad.push(`\`Contract:\` is \`${contract}\`, expected \`approved <YYYY-MM-DD>: "<words>"\`, \`candidate\` or \`none\``)
  }
  if (!p.hasParts) {
    if (h.Contract !== undefined && contract !== 'none') bad.push(`\`Contract:\` is \`${contract}\`, and the file has no execution parts`)
    if (h['Execution ready'] !== undefined && h['Execution ready'] !== 'none') bad.push(`\`Execution ready:\` is \`${h['Execution ready']}\`, and the file has no execution parts`)
    return bad
  }
  if (contract === 'none') bad.push('`Contract:` is `none`, and the file has execution parts')

  const partA = within(p, 'A')
  if (p.ranges.A && !partA.map((l) => l.raw.trim()).includes(BUILD_RULE)) bad.push('Part A does not open with the fixed "How to build from this file." paragraph, word for word')

  // Ids each part defines. Parts A to C define none of their own S or E ids.
  const { found } = statements(text)
  const defined = { S: new Set(found.map((s) => s.n)), E: new Set(images(text).map((e) => e.n)) }
  const list = tickets(text)
  const T = new Set(list.map((t) => t.n))
  for (const key of ['A', 'B', 'C']) {
    for (const { n, raw, code } of within(p, key)) {
      if (code) continue
      const def = ITEM.exec(raw)
      if (def && /^[SE]\d+\.\s/.test(def[1])) bad.push(`line ${n}: Part ${key} defines \`${def[1].split(' ')[0]}\`; Parts A to C cite ids and define none`)
      const text = prose(raw)
      for (const [letter, set] of [['S', defined.S], ['E', defined.E], ['T', T]]) {
        for (const id of ids(text, letter)) if (!set.has(id)) bad.push(`line ${n} cites ${letter === 'T' ? tid(id) : letter + id}, which ${letter === 'T' ? 'is not a ticket' : 'the evidence does not define'}`)
      }
    }
  }
  for (const { n, raw, code } of within(p, 'D')) {
    if (code) continue
    for (const id of [...prose(raw).matchAll(/\(E(\d+)\)/g)].map((m) => Number(m[1]))) if (!defined.E.has(id)) bad.push(`line ${n} cites E${id}, which no Images entry defines`)
  }

  // Tickets: ids in order, fields present, blockers earlier in the list.
  if (!list.length) bad.push('Part C holds no `### T01: <title>` ticket')
  list.forEach((t, k) => {
    const at = `line ${t.line} (${t.label})`
    if (t.n !== k + 1) bad.push(`${at} is ${t.label}, expected ${tid(k + 1)}`)
    if (t.status === null) bad.push(`${at} has no \`Status:\` line`)
    else if (t.status !== 'READY') {
      const m = /^BLOCKED: (.+)$/.exec(t.status)
      if (!m || !ids(m[1], 'S').length) bad.push(`${at} has \`Status: ${t.status}\`, expected \`READY\` or \`BLOCKED: <S-ids of the open decisions>\``)
    }
    if (t.blockedBy === null) bad.push(`${at} has no \`Blocked by:\` line`)
    else if (t.blockedBy !== 'none') {
      const deps = ids(t.blockedBy, 'T')
      if (!deps.length || prose(t.blockedBy).replace(/(?<![\w-])T\d+(?![\w-])/g, '').replace(/[,\s]|and/g, '')) bad.push(`${at} has \`Blocked by: ${t.blockedBy}\`, expected \`none\` or ticket ids`)
      for (const d of deps) {
        if (d === t.n) bad.push(`${at} is blocked by itself`)
        else if (T.has(d) && d > t.n) bad.push(`${at} is blocked by ${tid(d)}, which comes after it: list blockers first, and no ticket may wait on a later one`)
      }
    }
    if (!t.what) bad.push(`${at} has no \`What to build:\` line`)
    if (!t.criteria) bad.push(`${at} has no acceptance criterion (\`- [ ] ...\`)`)
    if (!t.proof) bad.push(`${at} has no \`Proof:\` line`)
    if (t.rests === null || !(ids(t.rests, 'S').length + ids(t.rests, 'E').length)) bad.push(`${at} has no \`Rests on:\` line citing S-ids or E-ids`)
    else if (t.ready && !ids(t.rests, 'S').length) bad.push(`${at} is READY and rests on no statement`)
  })

  // Open decisions hold the tickets they name, and those tickets say so.
  let inOpen = false
  for (const { n, raw, code } of partA) {
    if (code) continue
    if (/^##\s/.test(raw)) { inOpen = /^##\s+Open decisions\s*$/.test(raw); continue }
    const holds = inOpen && /Holds: (.+)$/.exec(raw)
    if (!holds) continue
    const cited = new Set(ids(raw.slice(0, holds.index), 'S'))
    for (const d of ids(holds[1], 'T')) {
      const t = list.find((x) => x.n === d)
      if (!t) continue
      if (t.ready) bad.push(`line ${n} holds ${tid(d)}, and ${tid(d)} is READY`)
      else if (!ids(t.status ?? '', 'S').some((s) => cited.has(s))) bad.push(`line ${n} holds ${tid(d)}, and its \`Status: ${t.status}\` cites none of this decision's S-ids`)
    }
  }

  // Every requirement, acceptance and testing statement is cited by Parts A to C.
  const cited = new Set(['A', 'B', 'C'].flatMap((key) => within(p, key).filter((l) => !l.code).flatMap((l) => ids(prose(l.raw), 'S'))))
  for (const s of found) if (COVERED.test(s.section) && !cited.has(s.n)) bad.push(`S${s.n} (${s.section.slice(3).trim()}) is cited nowhere in Parts A to C: cover it with a ticket or list it as out of scope`)

  // The readiness header matches the ticket statuses.
  const ready = list.filter((t) => t.ready).map((t) => tid(t.n))
  const want = !list.length ? null : ready.length === list.length ? 'YES' : ready.length ? `PARTIAL: ${ready.join(', ')}` : 'NO'
  if (want && h['Execution ready'] !== undefined && h['Execution ready'] !== want) bad.push(`\`Execution ready:\` is \`${h['Execution ready']}\`, and the tickets say \`${want}\``)
  return bad
}

// Stored images resolve inside `<Handoff id>-assets/` under root and match
// their hashes, and the Assets header counts the entries.
export function checkAssets(text, root) {
  const bad = []
  const h = headerFields(text)
  const list = images(text)
  list.forEach((e, k) => { if (e.n !== k + 1) bad.push(`line ${e.line} is E${e.n}, expected E${k + 1}`) })
  const stored = list.filter((e) => e.stored), missing = list.length - stored.length
  const want = !list.length ? 'none' : [stored.length ? `${stored.length} stored` : '', missing ? `${missing} not stored` : ''].filter(Boolean).join(', ')
  if (h.Assets !== undefined && h.Assets !== want) bad.push(`\`Assets:\` is \`${h.Assets}\`, and the Images entries say \`${want}\``)
  const folder = `${h['Handoff id'] ?? ''}-assets`
  for (const e of stored) {
    const at = `line ${e.line} (E${e.n})`
    if (!e.path) { bad.push(`${at} is stored and names no image path in backticks`); continue }
    const rel = normalize(e.path)
    if (isAbsolute(e.path) || rel.startsWith('..') || rel.split(sep)[0] !== folder) { bad.push(`${at} path \`${e.path}\` is not inside \`${folder}/\``); continue }
    if (!e.sha) bad.push(`${at} has no \`sha256 \`<64 hex>\`\``)
    if (root === null) { bad.push(`${at} is stored, and an inline handoff stores nothing`); continue }
    const file = resolve(root, rel)
    if (!existsSync(file)) { bad.push(`${at} file \`${e.path}\` does not exist under ${root}`); continue }
    const sha = createHash('sha256').update(readFileSync(file)).digest('hex')
    if (e.sha && sha !== e.sha) bad.push(`${at} hash is ${e.sha.slice(0, 12)}..., the file's is ${sha.slice(0, 12)}...`)
  }
  for (const { n, raw, code } of scan(text)) {
    if (code) continue
    for (const m of raw.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) if (!stored.some((e) => e.path && normalize(e.path) === normalize(m[1]))) bad.push(`line ${n} embeds \`${m[1]}\`, which no stored Images entry names`)
  }
  return bad
}

export function checkHandoff(text, { root } = {}) {
  return [...checkStatementIds(text), ...checkExecution(text), ...checkAssets(text, root === undefined ? null : root)]
}

// The skill is usually installed as a symlink, so compare real paths.
if (process.argv[1] && realpathSync(resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--root')
  if (!file) { console.error('usage: check-handoff.mjs <handoff.md> [--root <directory>]'); process.exit(2) }
  const r = args.indexOf('--root')
  const root = r === -1 ? dirname(resolve(file)) : resolve(args[r + 1])
  const text = readFileSync(file, 'utf8')
  const bad = checkHandoff(text, { root })
  if (bad.length) { for (const b of bad) console.log(b); process.exit(1) }
  const t = tickets(text)
  console.log(`ok: ${statements(text).found.length} statements, ${images(text).length} images, ${t.length} tickets (${t.filter((x) => x.ready).length} READY)`)
}
