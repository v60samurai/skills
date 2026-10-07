#!/usr/bin/env node
// Fixture F, the fresh session. Session A runs /handoff on the complex meeting
// source inside its fixture repository and writes the handoff file. The source
// then exists nowhere: it was only ever in session A's prompt. Session B runs
// in the same directory with one line, "Run the Build Flow using <path>". The
// test passes when the Build Flow gets to work from the file and the
// repository alone.
//
//   node tests/handoff/fresh-session.mjs
//
// It calls a model twice. BUILD_FLOW_SKILL names the Build Flow skill to link
// (default ~/dotfiles/machine/build-flow). FRESH_MIN_FACTS sets how many of
// the source's distinctive facts session B must show it has (default 5).
// HANDOFF_LIVE, HANDOFF_SKILL, HANDOFF_IGNORE and HANDOFF_OUT work as in run.mjs.
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { here, project, link, claude, files, gitState, leaveUnderTestRunner } from './harness.mjs'
import { checkHeader } from './header.mjs'
import { lintHandoff, classifyPath } from './lint.mjs'

leaveUnderTestRunner()

const CASE = '24-meeting-complex'
const skill = process.env.HANDOFF_SKILL || join(here, '..', '..', 'skills', 'handoff')
const buildFlow = process.env.BUILD_FLOW_SKILL || join(homedir(), 'dotfiles', 'machine', 'build-flow')
const outDir = process.env.HANDOFF_OUT || mkdtempSync(join(tmpdir(), 'handoff-out-'))
const minFacts = Number(process.env.FRESH_MIN_FACTS || 5)
const normalize = (text) => text.replace(/\r\n?/g, '\n').split('\n').map((line) => line.trimEnd()).join('\n').trim()

// Facts session B can only have from the handoff: none of them is in the
// fixture repository, and the source is gone.
const FACTS = [
  { kind: 'status quo', name: '1,140 bookings moved by hand in nine hours', re: /1,?140|(nine|9) hours/i },
  { kind: 'decision', name: 'an offer expires after 6 hours', re: /(6|six)[- ]hours?/i },
  { kind: 'decision', name: 'priority: medical flag, island residents, booking time', re: /island residents?|medical/i },
  { kind: 'decision', name: 'full refund on decline', re: /full refund/i },
  { kind: 'proposal', name: 'the capacity_holds table', re: /capacity[_ ]holds?|15[- ]minute hold/i },
  { kind: 'proposal', name: 'a countdown on the offer page', re: /countdown/i },
  { kind: 'conflict', name: 'the loading table has a truck class the code lacks', re: /truck_under_7_5t|7\.5 ?t\b/ },
  { kind: 'dependency', name: 'TW-618, reason_code from Tidewatch', re: /TW-618|reason_code/ },
  { kind: 'dependency', name: 'Legal approves the notice wording', re: /\bOda\b|Legal/ },
  { kind: 'open question', name: 'group bookings of more than 9 passengers', re: /group booking|9 passengers/i },
  { kind: 'open question', name: 'whether agents can override the priority order', re: /overrid/i },
  { kind: 'contract', name: 'the cancel event and topic', re: /sailing\.cancelled|ops\.sailings/ },
]
const ASKS = /\b(please|could you|can you|would you|i need|i'll need|need you to|share|paste|provide|send|supply|attach)\b[^.\n]{0,80}\b(original|raw)?\s*(meeting notes|notes from the (call|meeting|review)|transcript|source (document|material|notes)|original (notes|source|document|material)|meeting record|recording)\b/i

const reasons = []
const fail = (why) => reasons.push(why)
const done = () => {
  console.log(reasons.length ? `FAIL fresh session\n${reasons.map((r) => `     ${r}`).join('\n')}` : 'PASS fresh session')
  console.log(`Outputs: ${outDir}`)
  process.exit(reasons.length ? 1 : 0)
}

// Session A: /handoff writes the file.
const source = readFileSync(join(here, 'cases', `${CASE}.md`), 'utf8')
const p = project(CASE)
const baseline = gitState(p.cwd)
const had = new Set(files(p.cwd))
link(p.cwd, 'handoff', skill)
const outA = claude(p.cwd, `/handoff ${source}`)
writeFileSync(join(outDir, 'fresh-session.a.out.md'), outA)
const path = files(p.cwd).filter((f) => !had.has(f)).find((f) => classifyPath(f))
if (!path) { fail('session A wrote no handoff file at an allowed path'); done() }
const handoff = readFileSync(join(p.cwd, path), 'utf8')
writeFileSync(join(outDir, 'fresh-session.handoff.md'), handoff)
console.log(`session A wrote ${path} (${handoff.length} chars)`)
for (const why of checkHeader(handoff, { repository: p.names, branch: baseline.branch, head: baseline.head, dirty: false, path })) fail(`handoff header: ${why}`)
for (const f of lintHandoff(handoff)) fail(`handoff lint: ${f.rule}, line ${f.line}: ${f.text.slice(0, 80)}`)
const title = /^# Handoff: .*$/m.exec(handoff)?.[0]

// Session B: a new session, the same directory, the path and nothing else.
if (!existsSync(join(buildFlow, 'SKILL.md'))) { fail(`no Build Flow skill at ${buildFlow} (set BUILD_FLOW_SKILL)`); done() }
link(p.cwd, 'build-flow', buildFlow, { copy: true })
// The Build Flow runs its helper and reads Git. Session B may do that much without asking.
const outB = claude(p.cwd, `/build-flow Run the Build Flow using ${path}`, { allow: ['Read', 'Glob', 'Grep', 'Bash(node:*)', 'Bash(git:*)', 'Bash(ls:*)', 'Bash(mkdir:*)', 'Bash(date:*)'] })
writeFileSync(join(outDir, 'fresh-session.b.out.md'), outB)

if (/\[claude exited/.test(outB)) fail('session B did not finish')
const ask = ASKS.exec(outB)
if (ask) fail(`session B asks for the original material: "${ask[0].slice(0, 120)}"`)

const all = files(p.cwd)
const specs = existsSync(join(p.cwd, 'specs')) ? readdirSync(join(p.cwd, 'specs')).filter((d) => statSync(join(p.cwd, 'specs', d)).isDirectory()) : []
if (!specs.length) fail('session B created no spec directory under specs/')
const stored = all.filter((f) => /^specs\/[^/]+\/handoffs\/H\d{3,}-.*\.md$/.test(f))
const text = (f) => readFileSync(join(p.cwd, f), 'utf8')
// A stored copy carries the handoff whole: the Build Flow adds its own header above it and never retypes it.
const copies = stored.filter((f) => title && text(f).includes(title))
const whole = copies.filter((f) => normalize(text(f)).includes(normalize(handoff)))
if (!copies.length) fail('the handoff is not stored under specs/<id>/handoffs/')
if (copies.length > 1) fail(`the handoff is stored ${copies.length} times: ${copies.join(', ')}`)
if (copies.length && !whole.length) fail(`${copies[0]} holds the handoff with different content`)
const promoted = copies.length > 0 && !copies.includes(path)
if (promoted && existsSync(join(p.cwd, path))) fail(`${path} is still in the intake directory after it was stored as ${copies[0]}`)
const elsewhere = all.filter((f) => f !== path && !stored.includes(f) && title && text(f).includes(title))
if (elsewhere.length) fail(`a second copy of the handoff exists outside the store: ${elsewhere.join(', ')}`)

// What session B wrote and said, without the stored handoff itself.
const work = all.filter((f) => f.startsWith('specs/') && !stored.includes(f)).map(text).join('\n') + '\n' + outB
const known = FACTS.filter((f) => f.re.test(work))
console.log(`session B shows ${known.length} of ${FACTS.length} facts: ${known.map((f) => f.kind).join(', ') || 'none'}`)
if (known.length < minFacts) fail(`session B shows ${known.length} facts from the handoff, fewer than ${minFacts}. Missing: ${FACTS.filter((f) => !known.includes(f)).map((f) => f.name).join('; ')}`)
if (/tw-stg-4c81e07d93ab5f26FAKE7731/.test(work + handoff)) fail('the staging token from the source survived')
done()
