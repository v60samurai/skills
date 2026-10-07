// Static red flags in a handoff, and the two paths a handoff file may take.
// No model runs here. A finding means the handoff carries something that
// belongs to the Build Flow or to PStack, points at the source in place of
// content, or holds a credential.
//
// Text the handoff quotes is left alone: fenced code, inline code, block
// quotes, double-quoted spans, and lines labelled as source material
// (SOURCE RECOMMENDATION, EXISTING PLAN, "the source says"). A labelled
// heading covers its section, and a labelled line ending in a colon covers the
// list under it. Credentials are checked in the raw text, quoted or not.

// Assembled from parts so this file does not itself look like it holds a credential.
export const SECRET = new RegExp(['sk-' + 'ant-', 'sk-[A-Za-z0-9]{20,}', 'xai-[A-Za-z0-9]{20,}', 'gh[pousr]_[A-Za-z0-9]{20,}', 'github_' + 'pat_',
  'AKIA[0-9A-Z]{16}', 'xox[baprs]-', '-----BEGIN [A-Z ]*PRIVATE KEY-----', 'eyJ[A-Za-z0-9_-]{20,}\\.eyJ', 'Bearer [A-Za-z0-9._-]{20,}'].join('|'))
// A named credential followed by a value: "the key is gk-test-7f3a...", "password: Tr0ub4dor-x".
const NAMED_SECRET = /\b(api[ _-]?key|secret|token|password|passwd|key)\b\s*(?:is|was|[:=])\s*["'`]?([A-Za-z0-9_\-/+.]{12,})/i
const looksRandom = (v) => /\d/.test(v) && /[A-Za-z]/.test(v) && !/REDACTED/i.test(v)

const LABEL = /SOURCE RECOMMENDATION|EXISTING PLAN|SOURCE SAYS|the source (says|said|states|stated)/i
const PLAYBOOKS = 'Feature|Bug fix|Refactoring|Investigation|Perf|Hillclimb|bounded-change'

export const RULES = [
  { id: 'pointer', why: 'a pointer stands in for content',
    re: /\b(see|refer to|consult|described in|detailed in|available in)\s+(the\s+)?(original\s+|source\s+|full\s+)?(source|original|transcript|write-?up|meeting notes?|notes|thread|recording|document)\b(?!\s+(provenance|roadmap|implementation sequence|acceptance))[^.\n]{0,40}\b(for|details)\b/i },
  { id: 'hedge', why: 'unattributed hedge or directive', re: /\bprobably\b|\bwe should\b|\btherefore the implementation will\b/i },
  { id: 'ticket-id', why: 'ticket id', re: /(?<![A-Za-z0-9])M\d+-T\d*/ },
  { id: 'milestone-id', why: 'milestone id', re: /(?<![A-Za-z0-9-])M\d{1,2}(?!-T|[A-Za-z0-9])/ },
  { id: 'decision-queue-id', why: 'decision-queue id', re: /(?<![A-Za-z0-9])DQ-?\d+/ },
  { id: 'decision-id', why: 'decision id', re: /(?<![A-Za-z0-9-])D\d{1,3}(?![A-Za-z0-9-])/ },
  { id: 'ready-ticket', why: 'readiness belongs to the Build Flow', re: /\bREADY tickets?\b/i },
  { id: 'state', why: 'READY, BLOCKED and DONE are Build Flow states', re: /(?<![A-Za-z_])(READY|BLOCKED|DONE)(?![A-Za-z_])/ },
  { id: 'execution', why: 'Build Flow output', re: /\bexecution DAG\b|\bready frontier\b|\bEngineering Objective\b|\bEXPECTED PROOF\b/i },
  { id: 'build-flow-document', why: 'creating a Build Flow document',
    re: /\b(creat\w*|writ\w*|draft\w*|generat\w*|produc\w*|add(?:s|ed|ing)?|updat\w*)\b[^.\n]{0,40}\b(PRODUCT|DESIGN|TECH|EXECUTION)\.md\b/i },
  { id: 'build-flow-trigger', why: 'this line fires the Build Flow gate', re: /^\s*((ok|okay|now|please|then)[,.]?\s+)*run the build flow([^a-z0-9]|$)/i },
  { id: 'planning-heading', why: 'planning section', re: /^#{1,6}\s+.*\b(tickets?|milestones?|implementation plan|execution plan|test plan|next steps|action items)\b/i },
  { id: 'model-choice', why: 'model choice', re: /\buse (the )?(Grok|Codex|Claude|Opus|Sonnet|Haiku|Gemini|GPT[-\w.]*)\b/i },
  { id: 'playbook', why: 'PStack playbook choice', re: new RegExp(`\\b(${PLAYBOOKS}) playbook\\b|\\bPStack\\b|\\bpoteto-(agent|mode)\\b|\\bOrca placement\\b`, 'i') },
  { id: 'worktree', why: 'worktree strategy', re: /\bworktrees?\b/i },
]

const isList = (l) => /^\s*([-*+]|\d+[.)])\s/.test(l) || /^\s{2,}\S/.test(l)

// Lines with quoted and labelled text blanked out, numbered from 1.
export function visible(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let fence = null, coverLevel = 0, coverList = false
  lines.forEach((raw, i) => {
    const push = (t) => out.push({ n: i + 1, text: t, raw })
    const f = /^\s*(```|~~~)/.exec(raw)
    if (fence) { if (f && f[1] === fence) fence = null; return push('') }
    if (f) { fence = f[1]; return push('') }
    const h = /^(#{1,6})\s/.exec(raw)
    if (h) {
      coverList = false
      if (coverLevel && h[1].length <= coverLevel) coverLevel = 0
      if (LABEL.test(raw)) { coverLevel = coverLevel || h[1].length; return push('') }
    }
    if (coverLevel) return push('')
    if (coverList) { if (raw.trim() === '' || isList(raw)) return push(''); coverList = false }
    if (/^\s*>/.test(raw)) return push('')
    if (LABEL.test(raw)) { coverList = /:\s*\**\s*$/.test(raw); return push('') }
    push(raw.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length)).replace(/"[^"\n]*"|“[^”\n]*”/g, (m) => ' '.repeat(m.length)))
  })
  return out
}

export function lintHandoff(text) {
  const findings = []
  for (const line of visible(text)) {
    for (const rule of RULES) if (rule.re.test(line.text)) findings.push({ rule: rule.id, why: rule.why, line: line.n, text: line.raw.trim() })
    const named = NAMED_SECRET.exec(line.raw)
    if (SECRET.test(line.raw) || (named && looksRandom(named[2]))) findings.push({ rule: 'credential', why: 'credential shape', line: line.n, text: '[withheld]' })
  }
  return findings
}

const validDate = (y, m, d) => { const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() === +y && t.getUTCMonth() === m - 1 && t.getUTCDate() === +d }
const SLUG = '[a-z0-9][a-z0-9-]{0,47}'
const SPEC = new RegExp(`^specs/([^/]+)/handoffs/H(\\d{3,})-(\\d{4})-(\\d{2})-(\\d{2})-(${SLUG})\\.md$`)
const INTAKE = new RegExp(`^handoffs/(\\d{4})(\\d{2})(\\d{2})-(\\d{2})(\\d{2})(\\d{2})-(${SLUG})\\.md$`)

// The two places a handoff file may land. Anything else returns null.
export function classifyPath(relPath) {
  const p = String(relPath).replace(/^\.\//, '')
  let m = SPEC.exec(p)
  if (m) return validDate(m[3], m[4], m[5]) ? { kind: 'spec', spec: m[1], n: Number(m[2]), id: `H${m[2]}`, date: `${m[3]}-${m[4]}-${m[5]}`, slug: m[6] } : null
  m = INTAKE.exec(p)
  if (m && validDate(m[1], m[2], m[3]) && m[4] < 24 && m[5] < 60 && m[6] < 60) {
    return { kind: 'intake', id: p.slice('handoffs/'.length, -3), at: Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6]), slug: m[7] }
  }
  return null
}

// The number the next handoff in a spec takes: one more than the largest found
// in the handoff file names, the reconcile notes and the Handoffs through line.
// A handoff file name counts with three or more digits, as in the Build Flow's
// own reader. handoff.test.mjs holds this to bf.mjs when the Build Flow is there.
export function nextHandoffNumber({ handoffFiles = [], workingFiles = [], execution = '' }) {
  const files = handoffFiles.map((f) => Number((/^H(\d{3,})-.*\.md$/.exec(f) ?? [])[1] ?? 0))
  const notes = workingFiles.map((f) => Number((/^reconcile-H(\d+)\.md$/.exec(f) ?? [])[1] ?? 0))
  const through = Number((/^Handoffs through:[ \t]*.*?H(\d+)/m.exec(execution ?? '') ?? [])[1] ?? 0)
  return Math.max(0, through, ...files, ...notes) + 1
}
