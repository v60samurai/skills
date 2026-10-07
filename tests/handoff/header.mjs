// The header of a /handoff file: the title, one fixed line, then fourteen
// `Label: value` lines, each once and in this order, before the first `##`.
// No YAML frontmatter and no `---` line, because the Build Flow reads the text
// before the first `---` as the header.
import { SECRET, classifyPath } from './lint.mjs'

export const BANNER = 'Handoff. Evidence, not truth. Compiled by /handoff.'
export const LABELS = ['Handoff id', 'Created', 'Repository', 'Branch', 'Baseline', 'Working tree', 'Depth', 'Mode', 'Previous handoff',
  'Build Flow spec', 'Sources', 'Source hashes', 'Material information loss', 'Ready for Build Flow']

const TITLE = /^# Handoff: (\S.*)$/
const labelOf = (line) => LABELS.find((l) => line.startsWith(`${l}:`))

// Everything before the first `##` heading, read into fields. A text with no
// `# Handoff:` line has a null title.
export function parseHeader(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n')
  const end = lines.findIndex((l) => /^##\s/.test(l))
  const head = end === -1 ? lines : lines.slice(0, end)
  const at = head.findIndex((l) => TITLE.test(l))
  const fields = {}, order = [], extra = []
  let banner = false
  head.forEach((line, i) => {
    if (i === at || line.trim() === '') return
    const label = i > at && at !== -1 ? labelOf(line) : null
    if (label) { (fields[label] ??= []).push(line.slice(label.length + 1).trim()); order.push(label) }
    else if (i > at && at !== -1 && line.trim() === BANNER) banner = true
    else extra.push({ line: i + 1, text: line })
  })
  const rule = head.findIndex((l) => l.trim() === '---')
  return { title: at === -1 ? null : TITLE.exec(head[at])[1].trim(), banner, fields, order, extra, rule: rule === -1 ? null : rule + 1,
    head: head.join('\n'), body: end === -1 ? '' : lines.slice(end).join('\n') }
}

const get = (h, label) => h.fields[label]?.[0]
const HASH_PART = /^(pasted text, not hashed|\S.* sha256 [0-9a-f]{64})$/

const SHAPES = {
  'Handoff id': (v) => /^\S+$/.test(v) || 'is H<nnn> or the file stem, with no spaces',
  Created: (v) => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v) && !Number.isNaN(Date.parse(v))) || 'is UTC ISO 8601, YYYY-MM-DDTHH:MM:SSZ',
  Repository: (v) => v.length > 0 || 'names the repository',
  Branch: (v) => /^\S+$/.test(v) || 'names the branch',
  Baseline: (v) => /^[0-9a-f]{40}$/.test(v) || 'is the full 40-character revision',
  'Working tree': (v) => /^(clean(; overlaps the subject: no)?|dirty: .*\d.*; overlaps the subject: (yes|no))$/.test(v) || 'is `clean` or `dirty: <counts>; overlaps the subject: yes | no`',
  Depth: (v) => /^(SMALL|STANDARD|DEEP)$/.test(v) || 'is SMALL, STANDARD or DEEP',
  Mode: (v) => /^(NEW|DELTA)$/.test(v) || 'is NEW or DELTA',
  'Previous handoff': (v) => v.length > 0 || 'is a path or `none`',
  'Build Flow spec': (v) => /^(none|several \([^()]+,[^()]+\)|[A-Za-z0-9][A-Za-z0-9._-]*)$/.test(v) || 'is a spec id, `none` or `several (<ids>)`',
  Sources: (v) => /^\d+\b/.test(v) || 'starts with the count',
  'Source hashes': (v) => v.split(/;\s*/).every((p) => HASH_PART.test(p.trim())) || 'is `<path> sha256 <64 hex>` entries or `pasted text, not hashed`',
  'Material information loss': (v) => /^(NONE|(LOW|HIGH): \S.*)$/.test(v) || 'is NONE, `LOW: <what>` or `HIGH: <what>`',
  'Ready for Build Flow': (v) => /^(YES|NO: \S.*)$/.test(v) || 'is YES or `NO: <the evidence still missing>`',
}

// Problems with the header, as sentences. An empty list means it conforms.
// `expected` carries what the run measured: repository (a name or a list of
// acceptable names), branch, head, dirty, overlaps, depth, mode, previous (a
// regex), spec (an id, `none` or `several`), specs (ids a `several` value must
// name), path (where the storage rule put the file), notBefore and notAfter (ms).
export function checkHeader(text, expected = {}) {
  const h = parseHeader(text)
  const bad = []
  if (h.title === null) bad.push('no `# Handoff: <name>` title line')
  if (h.rule !== null) bad.push(`line ${h.rule} is \`---\` before the first \`##\` heading`)
  if (!h.banner) bad.push(`missing the line \`${BANNER}\``)
  for (const x of h.extra) if (x.text.trim() !== '---') bad.push(`line ${x.line} is not part of the header: ${x.text.trim().slice(0, 60)}`)
  for (const label of LABELS) {
    const n = h.fields[label]?.length ?? 0
    if (n === 0) bad.push(`missing label \`${label}:\``)
    else if (n > 1) bad.push(`label \`${label}:\` appears ${n} times`)
    else { const ok = SHAPES[label](get(h, label)); if (ok !== true) bad.push(`\`${label}:\` ${ok}, got \`${get(h, label)}\``) }
  }
  const seen = h.order.filter((l, i) => h.order.indexOf(l) === i)
  if (seen.join('|') !== LABELS.filter((l) => seen.includes(l)).join('|')) bad.push(`labels out of order: ${seen.join(', ')}`)
  if (/^sha256:/m.test(h.head)) bad.push('the header carries a hash of the file itself')
  if (SECRET.test(h.head)) bad.push('the header carries a credential shape')

  const want = (label, value, say = (v) => v) => { if (value !== undefined && get(h, label) !== undefined && get(h, label) !== value) bad.push(`\`${label}:\` is \`${get(h, label)}\`, the run measured \`${say(value)}\``) }
  if (expected.repository !== undefined && get(h, 'Repository') !== undefined && ![expected.repository].flat().includes(get(h, 'Repository'))) {
    bad.push(`\`Repository:\` is \`${get(h, 'Repository')}\`, the repository is \`${[expected.repository].flat().join('` or `')}\``)
  }
  want('Branch', expected.branch)
  want('Baseline', expected.head)
  want('Depth', expected.depth)
  want('Mode', expected.mode)
  const tree = get(h, 'Working tree')
  if (expected.dirty !== undefined && tree !== undefined && tree.startsWith('dirty') !== expected.dirty) bad.push(`\`Working tree:\` is \`${tree}\`, the tree was ${expected.dirty ? 'dirty' : 'clean'}`)
  if (expected.overlaps !== undefined && tree !== undefined && !tree.endsWith(`overlaps the subject: ${expected.overlaps}`)) bad.push(`\`Working tree:\` is \`${tree}\`, expected overlaps the subject: ${expected.overlaps}`)
  const prev = get(h, 'Previous handoff')
  if (expected.previous !== undefined && prev !== undefined && !new RegExp(expected.previous).test(prev)) bad.push(`\`Previous handoff:\` is \`${prev}\`, expected /${expected.previous}/`)
  const spec = get(h, 'Build Flow spec')
  if (expected.spec === 'several' && spec !== undefined) {
    if (!spec.startsWith('several (')) bad.push(`\`Build Flow spec:\` is \`${spec}\`, expected \`several (<ids>)\``)
    for (const id of expected.specs ?? []) if (!spec.includes(id)) bad.push(`\`Build Flow spec:\` does not name \`${id}\``)
  } else want('Build Flow spec', expected.spec)
  const created = Date.parse(get(h, 'Created') ?? '')
  if (!Number.isNaN(created) && ((expected.notBefore !== undefined && created < expected.notBefore) || (expected.notAfter !== undefined && created > expected.notAfter))) {
    bad.push(`\`Created:\` is \`${get(h, 'Created')}\`, outside the run (${new Date(expected.notBefore ?? 0).toISOString()} to ${new Date(expected.notAfter ?? 0).toISOString()})`)
  }
  if (expected.path !== undefined && get(h, 'Handoff id') !== undefined) {
    const where = classifyPath(expected.path)
    if (where) want('Handoff id', where.id)
    if (where?.kind === 'spec') want('Build Flow spec', where.spec)
  }
  return bad
}
