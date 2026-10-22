// The check types of checks.json, as one pure function over a finished run,
// plus the receipt check. run.mjs supplies the run; the layer 1 tests supply
// static text.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkHeader, checkDestination, parseHeader } from './header.mjs'
import { lintHandoff, classifyPath, checkStatementIds } from './lint.mjs'
import { checkHandoff, parts } from '../../skills/handoff/scripts/check-handoff.mjs'
import { inventory, within, repeats } from './inventory.mjs'

const re = (s) => new RegExp(s, 'im')
const DAY = 86400000

// The handoff without its header block, so a size check measures the content
// and not the fixed header.
export function bodyOf(doc) {
  const h = parseHeader(doc)
  return h.fields['Handoff id'] && h.body ? `# Handoff: ${h.title ?? ''}\n\n${h.body}` : doc
}

// The chat reply after a file was written: the receipt and nothing else, except
// one line about a secret when the source held one.
export function checkReceipt(stdout, { path, doc, secret = false }) {
  const bad = []
  const h = parseHeader(doc ?? '')
  const lines = String(stdout).split('\n').map((l) => l.trim()).filter((l) => l && !/^```/.test(l))
  const tick = `\`${path}\``
  const used = new Set()
  const at = lines.indexOf('HANDOFF')
  if (at === -1) return ['no `HANDOFF` line in the reply']
  used.add(at)
  if (lines[at + 1] === tick) used.add(at + 1); else bad.push(`the line after HANDOFF is not ${tick}`)
  let last = at + 1
  // `labels` are the slot's current label, then any older one a reader accepts.
  const field = (labels, check) => {
    const [slot] = labels = [labels].flat()
    const i = lines.findIndex((l, k) => k > last && labels.some((x) => l.startsWith(`${x}:`)))
    if (i === -1) return bad.push(`no \`${slot}:\` line after the previous receipt line`)
    used.add(i); last = i
    const label = labels.find((x) => lines[i].startsWith(`${x}:`))
    const v = lines[i].slice(label.length + 1).trim()
    const said = h.fields[slot]?.[0]
    const why = check(v, said)
    if (why) bad.push(`receipt \`${label}: ${v}\` ${why}`)
    return v
  }
  const same = (v, said) => (said !== undefined && v !== said ? `differs from the file header \`${said}\`` : '')
  const level = (v, said) => (said !== undefined && v.split(':')[0] !== said.split(':')[0] ? `differs from the file header \`${said}\`` : '')
  field('Depth', same)
  field('Baseline', (v, said) => (!/^[0-9a-f]{7,40}$/.test(v) ? 'is not a short revision' : said !== undefined && !said.startsWith(v) ? `is not the start of the file header \`${said}\`` : ''))
  field('Mode', same)
  field('Material information loss', level)
  if (h.fields.Contract) {
    field('Contract', (v, said) => (said !== undefined && v !== said.split(/[\s:]/)[0] ? `differs from the file header \`${said}\`` : ''))
    field('Execution ready', same)
    field('Assets', same)
  }
  field(['Evidence complete', 'Ready for Build Flow'], level)
  const extra = lines.filter((_, i) => !used.has(i))
  if (extra.length > (secret ? 1 : 0)) bad.push(`${extra.length} line(s) in the reply beyond the receipt${secret ? ' and the secret notice' : ''}: ${extra.slice(0, 3).map((l) => JSON.stringify(l.slice(0, 70))).join(', ')}`)
  if (secret && !extra.some((l) => /secret|credential|key|token|password/i.test(l))) bad.push('no one-line secret notice')
  return bad
}

// The chat reply when nothing is written: the handoff itself. Its first line is
// the title, with no sentence or code fence before it, and no receipt follows.
export function checkInline(stdout) {
  const bad = []
  const lines = String(stdout).split('\n').map((l) => l.trim())
  const first = lines.find((l) => l) ?? ''
  if (!first.startsWith('# Handoff: ')) bad.push(`the reply opens with ${JSON.stringify(first.slice(0, 60))}, not the \`# Handoff:\` title`)
  if (lines.includes('HANDOFF')) bad.push('a receipt follows the inline handoff')
  return bad
}

// Where a handoff file landed, against the storage rule and the clock of the run.
export function checkPath(relPath, want = {}, { start, end, now = Date.now() } = {}) {
  if (!relPath) return ['no new file at an allowed path (specs/<id>/handoffs/H<nnn>-<YYYY-MM-DD>-<slug>.md or handoffs/<YYYYMMDD-HHMMSS>-<slug>.md)']
  const where = classifyPath(relPath)
  if (!where) return [`${relPath} is not an allowed handoff path`]
  const bad = []
  if (want.kind && where.kind !== want.kind) bad.push(`${relPath} is ${where.kind === 'spec' ? 'inside a spec' : 'in the intake directory'}, expected ${want.kind}`)
  if (want.spec && where.spec !== want.spec) bad.push(`${relPath} is not under specs/${want.spec}/handoffs/`)
  if (want.n && where.n !== want.n) bad.push(`${relPath} is H${String(where.n).padStart(3, '0')}, expected H${String(want.n).padStart(3, '0')}`)
  if (where.kind === 'spec' && Math.abs(Date.parse(where.date) - now) > 2 * DAY) bad.push(`${relPath} carries the date ${where.date}, not today`)
  if (where.kind === 'intake' && start !== undefined && (where.at < start - 120000 || where.at > end + 120000)) bad.push(`${relPath} carries a timestamp outside the run (UTC, from the date command)`)
  return bad
}

export const TYPES = ['has', 'absent', 'inSection', 'notInSection', 'minCount', 'maxCount', 'sectionMinCount', 'shorterThan', 'maxRatio', 'maxChars',
  'maxRepeats', 'writes', 'fileHas', 'git', 'stdoutHas', 'stdoutAbsent', 'path', 'header', 'destination', 'lint', 'receipt', 'inventory', 'inline',
  'asks', 'statements', 'evidenceAbsent', 'execution', 'contract', 'flags']

// The evidence part of a handoff: Part D, or the whole file when it has no parts.
export function evidenceOf(doc) {
  const p = parts(doc)
  return p.hasParts && p.ranges.D ? p.lines.slice(...p.ranges.D).map((l) => l.raw).join('\n') : doc
}

// Applies one check. Returns true, false, or a list of problems (empty passes).
//
// r is the finished run: out (stdout), doc (the handoff: the written file when
// the case writes one, else stdout), source, cwd, written (new files), git
// ({ unchanged, added }), handoffPath, expected (header values the run
// measured), specs (ids of the specs the repository held before the run),
// start, end, outDir, here.
export function apply(c, r) {
  const doc = r.doc ?? ''
  const size = bodyOf(doc).length
  if (c.has) return re(c.has).test(doc)
  if (c.absent) return !re(c.absent).test(doc)
  if (c.evidenceAbsent) return !re(c.evidenceAbsent).test(evidenceOf(doc))
  if (c.flags !== undefined) return true
  if (c.contract) { const v = parseHeader(doc.slice(Math.max(0, doc.search(/^# Handoff:/m)))).fields.Contract?.[0] ?? ''; return v.split(':')[0].split(' ')[0] === c.contract ? true : [`\`Contract:\` is \`${v}\`, expected ${c.contract}`] }
  if (c.execution) return checkHandoff(doc.slice(Math.max(0, doc.search(/^# Handoff:/m))), { root: r.handoffPath ? join(r.cwd, r.handoffPath, '..') : null })
  if (c.inSection) return re(c.inSection[1]).test(within(doc, c.inSection[0]))
  if (c.notInSection) return !re(c.notInSection[1]).test(within(doc, c.notInSection[0]))
  if (c.minCount) return (doc.match(new RegExp(c.minCount[0], 'gim')) || []).length >= c.minCount[1]
  if (c.maxCount) return (doc.match(new RegExp(c.maxCount[0], 'gi')) || []).length <= c.maxCount[1]
  if (c.sectionMinCount) return (within(doc, c.sectionMinCount[0]).match(new RegExp(c.sectionMinCount[1], 'gim')) || []).length >= c.sectionMinCount[2]
  if (c.shorterThan) { const other = join(r.outDir, `${c.shorterThan}.handoff.md`); return existsSync(other) && size < bodyOf(readFileSync(other, 'utf8')).length }
  if (c.maxRatio) return size / r.source.length <= c.maxRatio
  if (c.maxChars) return size <= c.maxChars
  if (c.maxRepeats !== undefined) {
    const found = repeats(bodyOf(doc))
    return found.length <= c.maxRepeats ? true : found.map((f) => `${f.score} "${f.first.text.slice(0, 70)}" (${f.first.section.split(' > ').pop()}) and "${f.second.text.slice(0, 70)}" (${f.second.section.split(' > ').pop()})`)
  }
  if (c.stdoutHas) return re(c.stdoutHas).test(r.out)
  if (c.stdoutAbsent) return !re(c.stdoutAbsent).test(r.out)
  if (c.writes === 'none') return r.written.length === 0 ? true : [`wrote ${r.written.join(', ')}`]
  if (c.writes) return r.written.length === 1 && r.written[0] === c.writes ? true : [`wrote ${r.written.join(', ') || 'nothing'}`]
  if (c.fileHas) return existsSync(join(r.cwd, c.fileHas[0])) && re(c.fileHas[1]).test(readFileSync(join(r.cwd, c.fileHas[0]), 'utf8'))
  if (c.git === 'unchanged') return r.git.unchanged
  if (c.git === 'one-new-file') {
    if (!r.git.rest) return ['HEAD, the branch, the index, tracked files or the stash changed']
    const handoffs = r.git.added.filter((f) => classifyPath(f))
    const assets = handoffs.length === 1 ? `${handoffs[0].replace(/[^/]+$/, '')}${classifyPath(handoffs[0]).id}-assets/` : null
    const others = r.git.added.filter((f) => !classifyPath(f) && !(assets && f.startsWith(assets)))
    return handoffs.length === 1 && !others.length ? true : [`new untracked files: ${r.git.added.join(', ') || 'none'}`]
  }
  if (c.path) return checkPath(r.handoffPath, c.path, r)
  if (c.header) return r.doc ? checkHeader(doc.slice(Math.max(0, doc.search(/^# Handoff:/m))), { ...r.expected, ...c.header }) : ['no handoff to read']
  if (c.destination) {
    const h = parseHeader(doc.slice(Math.max(0, doc.search(/^# Handoff:/m))))
    const value = h.fields.Spec?.[0]
    return value === undefined ? ['no `Spec:` line to read'] : checkDestination({ specs: r.specs ?? [], value, path: r.handoffPath, label: h.written.Spec })
  }
  if (c.asks) {
    // The spec is unknown, so the run asks which one before it writes: no file, no handoff, no receipt, every candidate named.
    const bad = r.written.length ? [`wrote ${r.written.join(', ')}`] : []
    if (/^# Handoff:/m.test(r.out) || /^\s*HANDOFF\s*$/m.test(r.out)) bad.push('the reply holds a handoff or a receipt, not a question')
    for (const id of c.asks) if (!r.out.includes(id)) bad.push(`the question does not name \`${id}\``)
    return bad
  }
  if (c.statements) return checkStatementIds(doc.slice(Math.max(0, doc.search(/^# Handoff:/m))))
  if (c.lint) return lintHandoff(doc).map((f) => `${f.rule}, line ${f.line}: ${f.text.slice(0, 80)}`)
  if (c.receipt) return checkReceipt(r.out, { path: r.handoffPath, doc, ...c.receipt })
  if (c.inline) return checkInline(r.out)
  if (c.inventory) {
    const result = inventory(JSON.parse(readFileSync(join(r.here, 'inventory', `${c.inventory}.json`), 'utf8')), doc)
    return result.missing.length ? [result.report, ...result.missing] : true
  }
  throw new Error(`unknown check ${JSON.stringify(c)}`)
}
