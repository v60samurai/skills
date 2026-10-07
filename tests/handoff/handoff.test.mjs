// Layer 1: the deterministic checks, over static files. No model runs.
//
//   node --test tests/handoff/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { parseHeader, checkHeader, checkDestination, specValue, LABELS, BANNER } from './header.mjs'
import { lintHandoff, classifyPath, nextHandoffNumber, RULES } from './lint.mjs'
import { inventory, keeps, sections, within, statements, repeats } from './inventory.mjs'
import { apply, checkReceipt, checkInline, checkPath, bodyOf, TYPES } from './checks.mjs'
import { here, project, git, gitState, files, specsOf } from './harness.mjs'

const read = (...p) => readFileSync(join(here, ...p), 'utf8')
const fixture = (name) => read('static', `${name}.md`)
const json = (...p) => JSON.parse(read(...p))
const good = fixture('good-deep')
const small = fixture('good-small')
const GOOD_PATH = 'handoffs/20261007-093012-deck-planner-plan-of-record-draft-v0-3.md'
const HEAD = '8f2c41d7a9e05b36c1d48e7f20a9b3c5d6e7f801'
const measured = { repository: 'harbor-desk', branch: 'main', head: HEAD, dirty: false, depth: 'DEEP', mode: 'NEW', spec: 'none', path: GOOD_PATH,
  notBefore: Date.parse('2026-10-07T09:28:00Z'), notAfter: Date.parse('2026-10-07T09:40:00Z') }
const rules = (text) => [...new Set(lintHandoff(text).map((f) => f.rule))].sort()
const swap = (text, label, value) => text.replace(new RegExp(`^${label}: .*$`, 'm'), `${label}: ${value}`)

// --- header ---------------------------------------------------------------------------------------------------------

test('header: a conforming file parses into fourteen fields in order', () => {
  const h = parseHeader(good)
  assert.equal(h.title, 'Deck planner plan of record draft v0.3')
  assert.equal(h.banner, true)
  assert.deepEqual(h.order, LABELS)
  assert.equal(h.fields.Baseline[0], HEAD)
  assert.equal(h.rule, null)
  assert.match(h.body, /^## Executive context/)
})

test('header: good files conform, alone and against the values a run measured', () => {
  assert.deepEqual(checkHeader(good), [])
  assert.deepEqual(checkHeader(good, measured), [])
  assert.deepEqual(checkHeader(small), [])
  assert.deepEqual(checkHeader(small, { repository: ['other', 'harbor-desk'], branch: 'notices/subject', dirty: true, overlaps: 'yes', spec: 'several', specs: ['deck-planner', 'disruption-rebooking'] }), [])
})

test('header: a handoff written into a spec takes its H number as the id', () => {
  const dir = ['repos', '29-spec-store.overlay', 'specs', 'disruption-rebooking', 'handoffs']
  const name = 'H002-2026-09-25-offer-expiry-and-priority-order.md'
  assert.deepEqual(checkHeader(read(...dir, name), { path: `specs/disruption-rebooking/handoffs/${name}`, mode: 'DELTA', previous: '^specs/disruption-rebooking/handoffs/H001-' }), [])
  assert.match(checkHeader(read(...dir, name), { path: 'specs/disruption-rebooking/handoffs/H004-2026-10-07-x.md' }).join('\n'), /`Handoff id:` is `H002`, the run measured `H004`/)
  assert.match(checkHeader(read(...dir, name), { path: 'specs/deck-planner/handoffs/H002-2026-10-07-x.md' }).join('\n'), /`Build Flow spec:` is `disruption-rebooking`/)
})

test('header: values that differ from what the run measured are reported', () => {
  const cases = [
    [{ head: 'a'.repeat(40) }, /`Baseline:`/], [{ branch: 'dev' }, /`Branch:`/], [{ repository: 'storefront' }, /`Repository:`/], [{ dirty: true }, /the tree was dirty/],
    [{ depth: 'SMALL' }, /`Depth:`/], [{ mode: 'DELTA' }, /`Mode:`/], [{ spec: 'deck-planner' }, /`Build Flow spec:`/], [{ spec: 'several' }, /several/],
    [{ previous: '^specs/' }, /`Previous handoff:`/], [{ path: 'handoffs/20261007-093012-other.md' }, /`Handoff id:`/],
    [{ notBefore: Date.parse('2026-10-07T10:00:00Z'), notAfter: Date.parse('2026-10-07T10:05:00Z') }, /`Created:`.*outside the run/],
  ]
  for (const [expected, message] of cases) assert.match(checkHeader(good, expected).join('\n'), message, JSON.stringify(expected))
  assert.match(checkHeader(small, { overlaps: 'no' }).join('\n'), /overlaps the subject: no/)
})

test('header: YAML frontmatter is refused', () => {
  const bad = checkHeader(fixture('bad-frontmatter')).join('\n')
  assert.match(bad, /is `---` before the first `##` heading/)
  assert.match(bad, /missing label `Baseline:`/)
  assert.match(bad, /missing the line/)
  assert.match(bad, /is not part of the header/)
})

test('header: a missing label, a short revision, a repeated label and a wrong order are each reported', () => {
  assert.deepEqual(checkHeader(fixture('bad-missing-label')), ['missing label `Material information loss:`'])
  assert.deepEqual(checkHeader(fixture('bad-short-sha')), ['`Baseline:` is the full 40-character revision, got `8f2c41d`'])
  const order = checkHeader(fixture('bad-label-order')).join('\n')
  assert.match(order, /label `Branch:` appears 2 times/)
  assert.match(order, /labels out of order/)
})

test('header: each value has a shape', () => {
  const bad = { 'Handoff id': 'the deck planner', Created: '2026-10-07 09:30', Baseline: HEAD.toUpperCase(), 'Working tree': 'dirty', Depth: 'Deep', Mode: 'new',
    'Build Flow spec': 'two of them', Sources: 'one pasted', 'Source hashes': 'notes.md md5 abc', 'Material information loss': 'LOW', 'Ready for Build Flow': 'NO' }
  for (const [label, value] of Object.entries(bad)) {
    const found = checkHeader(swap(good, label, value))
    assert.equal(found.length, 1, `${label}: ${value} -> ${found.join(' | ')}`)
    assert.ok(found[0].startsWith(`\`${label}:\``), found[0])
  }
  const fine = { Created: '2026-12-31T23:59:59Z', 'Working tree': 'dirty: 3 modified; overlaps the subject: no', Depth: 'STANDARD', Mode: 'DELTA', 'Previous handoff': 'handoffs/20261001-080000-earlier.md',
    'Build Flow spec': 'disruption-rebooking', 'Source hashes': 'docs/a b.md sha256 ' + 'a1'.repeat(32), 'Material information loss': 'HIGH: the recording was not supplied', 'Ready for Build Flow': 'NO: the recording' }
  for (const [label, value] of Object.entries(fine)) assert.deepEqual(checkHeader(swap(good, label, value)), [], `${label}: ${value}`)
})

test('header: no hash of the file itself, no credential, nothing else between the title and the first section', () => {
  assert.match(checkHeader(good.replace('Depth: DEEP', `sha256: ${'0'.repeat(64)}\nDepth: DEEP`)).join('\n'), /hash of the file itself/)
  assert.match(checkHeader(swap(good, 'Sources', `1 (pasted, with ${'gh' + 'p_'}${'A1b2'.repeat(9)})`)).join('\n'), /credential shape/)
  assert.match(checkHeader(good.replace('## Executive context', 'This handoff covers the deck planner.\n\n## Executive context')).join('\n'), /is not part of the header/)
  assert.match(checkHeader(good.replace(BANNER, 'A handoff.')).join('\n'), /missing the line/)
  assert.match(checkHeader(good.replace('# Handoff: ', '# ')).join('\n'), /no `# Handoff: <name>` title line/)
})

test('header: `Build Flow spec:` has five forms and no other', () => {
  const allowed = {
    'disruption-rebooking': { kind: 'matched', ids: ['disruption-rebooking'] },
    'v2.checkout_flow': { kind: 'matched', ids: ['v2.checkout_flow'] },
    none: { kind: 'none', ids: [] },
    'none matched (unrelated: disruption-rebooking)': { kind: 'unrelated', ids: ['disruption-rebooking'] },
    'none matched (unrelated: deck-planner, disruption-rebooking)': { kind: 'unrelated', ids: ['deck-planner', 'disruption-rebooking'] },
    'none matched (unclear: disruption-rebooking)': { kind: 'unclear', ids: ['disruption-rebooking'] },
    'several (deck-planner, disruption-rebooking)': { kind: 'several', ids: ['deck-planner', 'disruption-rebooking'] },
    'several (a, b, c)': { kind: 'several', ids: ['a', 'b', 'c'] },
  }
  for (const [value, read] of Object.entries(allowed)) {
    assert.deepEqual(specValue(value), read, value)
    assert.deepEqual(checkHeader(swap(good, 'Build Flow spec', value)), [], value)
  }
  const refused = ['two of them', 'several', 'several (deck-planner)', 'several (deck-planner,disruption-rebooking)', 'several: deck-planner, disruption-rebooking', 'none matched',
    'none matched (disruption-rebooking)', 'none matched (disruption-rebooking exists, unrelated)', 'none matched (unrelated)', 'none matched (irrelevant: disruption-rebooking)',
    'none (disruption-rebooking is unrelated)', 'disruption-rebooking (the only spec)', 'disruption-rebooking, probably', 'unclear', 'unrelated', 'None', 'specs/disruption-rebooking', '']
  for (const value of refused) {
    assert.equal(specValue(value), null, value)
    const found = checkHeader(swap(good, 'Build Flow spec', value))
    assert.ok(found.length === 1 && /`Build Flow spec:`/.test(found[0]), `${value} -> ${found.join(' | ')}`)
  }
})

test('header: the spec a case expects is checked by what was established, not by wording', () => {
  const one = swap(good, 'Build Flow spec', 'none matched (unrelated: disruption-rebooking)')
  assert.deepEqual(checkHeader(one, { spec: 'unrelated', specs: ['disruption-rebooking'] }), [])
  assert.match(checkHeader(one, { spec: 'unclear' }).join('\n'), /expected `none matched \(unclear: <ids>\)`/)
  assert.match(checkHeader(one, { spec: 'unrelated', specs: ['deck-planner'] }).join('\n'), /does not name `deck-planner`/)
  assert.match(checkHeader(one, { spec: 'disruption-rebooking' }).join('\n'), /`Build Flow spec:` is `none matched/)
  assert.match(checkHeader(good, { spec: 'unrelated', specs: ['disruption-rebooking'] }).join('\n'), /is `none`, expected `none matched \(unrelated: <ids>\)`/)
  assert.match(checkHeader(swap(good, 'Build Flow spec', 'disruption-rebooking'), { spec: 'unrelated', specs: ['disruption-rebooking'] }).join('\n'), /expected `none matched \(unrelated/)
})

// --- lint -----------------------------------------------------------------------------------------------------------

test('lint: good files are clean, quoted and labelled source material included', () => {
  assert.deepEqual(lintHandoff(good), [])
  assert.deepEqual(lintHandoff(small), [])
  assert.deepEqual(lintHandoff(read('repos', '29-spec-store.overlay', 'specs', 'disruption-rebooking', 'handoffs', 'H002-2026-09-25-offer-expiry-and-priority-order.md')), [])
})

test('lint: the bad fixtures are caught by the rule that names their fault', () => {
  assert.deepEqual(rules(fixture('bad-pointer')), ['pointer'])
  assert.deepEqual(rules(fixture('bad-ticket')), ['ticket-id'])
  assert.equal(lintHandoff(fixture('bad-ticket')).length, 2)
  assert.deepEqual(rules(fixture('bad-build-flow-output')),
    ['build-flow-document', 'build-flow-trigger', 'decision-id', 'decision-queue-id', 'hedge', 'milestone-id', 'model-choice', 'planning-heading', 'playbook', 'ready-ticket', 'state', 'worktree'])
})

test('lint: a credential is caught wherever it sits, and never echoed', () => {
  const token = 'gh' + 'p_' + 'Z9y8'.repeat(9)
  for (const line of [`- The token is ${token}.`, `> ${token}`, `\`${token}\``, '- The staging key is gk-test-7f3a9c2e41d8b6a0FAKEKEY99.', '- dashboard password: Tr0ub4dor-not-real', `- Authorization: ${'Bear' + 'er'} abcdefghij0123456789xyz`]) {
    const found = lintHandoff(good.replace('## Objective', `${line}\n\n## Objective`))
    assert.deepEqual(found.map((f) => f.rule), ['credential'], line)
    assert.equal(found[0].text, '[withheld]')
  }
  for (const line of ['- An API key for the capacity service exists and will be supplied separately.', '- The key goes in the server env as `GEOCODE_API_KEY`.', '- The token is <REDACTED>.', '- The staging token has replay scope.']) {
    assert.deepEqual(lintHandoff(good.replace('## Objective', `${line}\n\n## Objective`)), [], line)
  }
})

test('lint: every red flag is flagged in plain text and left alone when quoted or labelled', () => {
  const flags = {
    'See source for details.': 'pointer', 'See the meeting notes for the implementation details.': 'pointer', 'Refer to the original transcript for details.': 'pointer',
    'The window is probably 72 hours.': 'hedge', 'We should hold capacity.': 'hedge', 'Therefore the implementation will use a queue.': 'hedge',
    'M1-T1 builds the vessel model.': 'ticket-id', 'Tracked as M2-T14.': 'ticket-id', 'M3 is the tablet view.': 'milestone-id', 'DQ2 covers the motorcycle question.': 'decision-queue-id',
    'DQ-7 is open.': 'decision-queue-id', 'D1: first fit by lane.': 'decision-id', 'This is a READY ticket.': 'ready-ticket', 'Status: BLOCKED': 'state', 'The vessel model is DONE.': 'state',
    'The execution DAG has three layers.': 'execution', 'It is on the ready frontier.': 'execution', 'Engineering Objective: ship the deck view.': 'execution', 'EXPECTED PROOF: a browser test.': 'execution',
    'This handoff creates PRODUCT.md.': 'build-flow-document', 'Then write the decisions into TECH.md.': 'build-flow-document', 'Run the Build Flow using this handoff.': 'build-flow-trigger',
    '## Next steps': 'planning-heading', '### Tickets': 'planning-heading', '## Test plan': 'planning-heading', 'Use Grok for the deck view.': 'model-choice', 'use Codex here': 'model-choice',
    'Use the Feature playbook.': 'playbook', 'This is a Bug fix playbook job.': 'playbook', 'Hand it to poteto-agent.': 'playbook', 'PStack takes it from here.': 'playbook', 'Do it in a separate worktree.': 'worktree',
  }
  for (const [line, rule] of Object.entries(flags)) {
    assert.ok(rules(line).includes(rule), `${line} -> ${rules(line)}`)
    if (line.startsWith('#')) continue
    assert.deepEqual(lintHandoff(`Mateus said: "${line}"`), [], `double quotes: ${line}`)
    assert.deepEqual(lintHandoff(`> ${line}`), [], `block quote: ${line}`)
    assert.deepEqual(lintHandoff(`\`${line}\``), [], `code span: ${line}`)
    assert.deepEqual(lintHandoff(`\`\`\`text\n${line}\n\`\`\``), [], `code block: ${line}`)
    assert.deepEqual(lintHandoff(`SOURCE RECOMMENDATION: ${line}`), [], `labelled line: ${line}`)
    assert.deepEqual(lintHandoff(`EXISTING PLAN, carried as the source wrote it:\n\n- ${line}\n- ${line}\n`), [], `labelled list: ${line}`)
    assert.deepEqual(lintHandoff(`### EXISTING PLAN\n\n${line}\n\n#### Detail\n\n${line}\n`), [], `labelled section: ${line}`)
    assert.ok(rules(`EXISTING PLAN:\n\n- kept\n\nAfter the list.\n${line}`).includes(rule), `the label ends with its list: ${line}`)
    assert.ok(rules(`### EXISTING PLAN\n\nkept\n\n## Requirements\n\n${line}`).includes(rule), `the label ends with its section: ${line}`)
  }
  assert.deepEqual(rules('The source says we should hold capacity.'), [])
})

test('lint: ordinary handoff text is not flagged', () => {
  const fine = ['BLOCKER: the phase needs the segregation table from Runa.', 'Ready for Build Flow: YES', 'See the Source provenance section for the files read.', 'Ticket TW-618, not scheduled.',
    'Blocked on DATA-4471 and PLAT-2231.', 'MV Tern has 14 lanes.', 'The earlier handoff is H004.', 'The offer is ready when capacity is confirmed.', 'The work is done by a person on staging.',
    '### Phase 3: height and weight limits', '## Source implementation sequence', '## Source roadmap', '## Testing / QA / proof expectations', 'A service worker caches the deck view.',
    '`specs/disruption-rebooking/EXECUTION.md` exists and reads `Handoffs through: H002`.', 'The repository has no PRODUCT.md.', 'APPROVED DECISION: an offer expires after 6 hours.', 'REQUIREMENT: the notice goes out within 10 minutes.',
    'The 3D deck model is future direction.', 'Claude Monet Street is the depot address.', 'PROPOSED: replace the crawler with Crawl4AI.']
  for (const line of fine) assert.deepEqual(lintHandoff(line), [], line)
  assert.ok(RULES.every((r) => r.id && r.why && r.re instanceof RegExp))
})

test('path: only the spec store and the intake directory are allowed', () => {
  assert.deepEqual(classifyPath('specs/disruption-rebooking/handoffs/H004-2026-10-07-expiry-exception.md'),
    { kind: 'spec', spec: 'disruption-rebooking', n: 4, id: 'H004', date: '2026-10-07', slug: 'expiry-exception' })
  assert.deepEqual(classifyPath(GOOD_PATH), { kind: 'intake', id: '20261007-093012-deck-planner-plan-of-record-draft-v0-3', at: Date.parse('2026-10-07T09:30:12Z'), slug: 'deck-planner-plan-of-record-draft-v0-3' })
  assert.equal(classifyPath('./handoffs/20261007-093012-a.md').kind, 'intake')
  assert.equal(classifyPath('specs/x/handoffs/H1204-2026-01-31-a.md').n, 1204)
  assert.equal(classifyPath(`handoffs/20261007-093012-${'a'.repeat(48)}.md`).kind, 'intake')
  const refused = ['handoffs/export-label.md', 'handoffs/2026-10-07-deck-planner.md', 'handoffs/inbox/20261007-093012-a.md', 'docs/handoffs/20261007-093012-a.md', 'thoughts/shared/handoffs/20261007-093012-a.md',
    'handoffs/20261007-093012-Deck-Planner.md', 'handoffs/20261007-093012-deck_planner.md', `handoffs/20261007-093012-${'a'.repeat(49)}.md`, 'handoffs/20261307-093012-a.md', 'handoffs/20261007-250000-a.md',
    'handoffs/20261007-093012-a.txt', 'handoffs/20261007-093012-.md', 'specs/x/handoffs/H04-2026-10-07-a.md', 'specs/x/handoffs/H004-a.md', 'specs/x/handoffs/H004-2026-02-30-a.md', 'specs/x/H004-2026-10-07-a.md',
    'specs/x/handoffs/004-2026-10-07-a.md', 'specs/handoffs/H004-2026-10-07-a.md', 'specs/x/handoffs/inbox/H004-2026-10-07-a.md', 'specs/x/PRODUCT.md', 'HANDOFF.md']
  for (const p of refused) assert.equal(classifyPath(p), null, p)
})

test('path: the next number comes from the files, the reconcile notes and the Handoffs through line', () => {
  assert.equal(nextHandoffNumber({}), 1)
  assert.equal(nextHandoffNumber({ handoffFiles: ['H001-2026-09-18-a.md', 'H002-2026-09-25-b.md', 'README.md'] }), 3)
  assert.equal(nextHandoffNumber({ handoffFiles: ['H001-2026-09-18-a.md', 'H002-2026-09-25-b.md'], workingFiles: ['reconcile-H003.md', 'intake.md'] }), 4)
  assert.equal(nextHandoffNumber({ handoffFiles: ['H001-2026-09-18-a.md'], workingFiles: ['reconcile-H003.md'], execution: '# Execution\nHandoffs through: H007\n' }), 8)
  assert.equal(nextHandoffNumber({ handoffFiles: ['H012-2026-09-18-a.md'], execution: 'Handoffs through: H007' }), 13)
  assert.equal(nextHandoffNumber({ handoffFiles: ['H002-2026-09-18-a.md', 'H12-2026-09-18-b.md'] }), 3, 'a name with fewer than three digits is not a stored handoff')
})

// The numbering rule lives in three places: FILE.md, this helper, and the Build
// Flow's ingest. This holds the helper to ingest on the same directory.
const BF = join(process.env.BUILD_FLOW_SKILL || join(homedir(), 'dotfiles', 'machine', 'build-flow'), 'scripts', 'bf.mjs')
test('path: the next number is the one the Build Flow would assign', { skip: existsSync(BF) ? false : `no Build Flow helper at ${BF} (set BUILD_FLOW_SKILL)` }, () => {
  const stores = [
    { handoffFiles: [], workingFiles: [], execution: '' },
    { handoffFiles: ['H001-2026-09-18-a.md', 'H002-2026-09-25-b.md', 'README.md'], workingFiles: ['reconcile-H003.md', 'intake.md'], execution: '' },
    { handoffFiles: ['H001-2026-09-18-a.md'], workingFiles: ['reconcile-H003.md'], execution: '# Execution\nHandoffs through: H007\n' },
    { handoffFiles: ['H002-2026-09-18-a.md', 'H12-2026-09-18-b.md', 'H0031-2026-09-19-c.md'], workingFiles: [], execution: 'Handoffs through: H004\n' },
  ]
  for (const store of stores) {
    const dir = mkdtempSync(join(tmpdir(), 'handoff-number-'))
    const spec = join(dir, 'specs', 'x')
    mkdirSync(join(spec, 'handoffs'), { recursive: true })
    mkdirSync(join(spec, 'working'))
    store.handoffFiles.forEach((f, i) => writeFileSync(join(spec, 'handoffs', f), `Earlier handoff ${i}.\n`))
    store.workingFiles.forEach((f) => writeFileSync(join(spec, 'working', f), 'note\n'))
    if (store.execution) writeFileSync(join(spec, 'EXECUTION.md'), store.execution)
    const out = JSON.parse(spawnSync('node', [BF, 'ingest', '--spec', 'specs/x', '--title', 'Next'], { cwd: dir, input: 'A new handoff.\n', encoding: 'utf8' }).stdout)
    assert.equal(out.id, `H${String(nextHandoffNumber(store)).padStart(3, '0')}`, JSON.stringify(store))
    rmSync(dir, { recursive: true, force: true })
  }
})

test('path: where a file landed is checked against the storage rule and the clock', () => {
  const run = { start: Date.parse('2026-10-07T09:29:00Z'), end: Date.parse('2026-10-07T09:31:00Z'), now: Date.parse('2026-10-07T09:31:00Z') }
  assert.deepEqual(checkPath(GOOD_PATH, { kind: 'intake' }, run), [])
  assert.deepEqual(checkPath('specs/disruption-rebooking/handoffs/H004-2026-10-07-a.md', { kind: 'spec', spec: 'disruption-rebooking', n: 4 }, run), [])
  assert.match(checkPath(undefined, {}, run)[0], /no new file at an allowed path/)
  assert.match(checkPath('handoffs/export-label.md', {}, run)[0], /not an allowed handoff path/)
  assert.match(checkPath(GOOD_PATH, { kind: 'spec' }, run)[0], /in the intake directory, expected spec/)
  assert.match(checkPath('handoffs/20261007-080000-a.md', {}, run)[0], /timestamp outside the run/)
  assert.match(checkPath('specs/disruption-rebooking/handoffs/H003-2026-10-07-a.md', { n: 4 }, run)[0], /is H003, expected H004/)
  assert.match(checkPath('specs/deck-planner/handoffs/H004-2026-10-07-a.md', { spec: 'disruption-rebooking' }, run)[0], /not under specs\/disruption-rebooking/)
  assert.match(checkPath('specs/disruption-rebooking/handoffs/H004-2026-09-25-a.md', {}, run)[0], /not today/)
})

// Count is not relevance. Each row is (specs that exist, header value, path).
test('destination: only a matched spec takes the file into its store, however many specs exist', () => {
  const SPEC = 'specs/disruption-rebooking/handoffs/H004-2026-10-07-expiry-exception.md'
  const OTHER = 'specs/deck-planner/handoffs/H002-2026-10-07-expiry-exception.md'
  const INTAKE = 'handoffs/20261007-093012-boarding-manifest.md'
  const one = ['disruption-rebooking'], two = ['deck-planner', 'disruption-rebooking']
  const check = (specs, value, path) => checkDestination({ specs, value, path }).join('\n')

  // One matching spec: the spec path is required.
  assert.equal(check(one, 'disruption-rebooking', SPEC), '')
  assert.match(check(one, 'disruption-rebooking', INTAKE), /is in the intake directory, and the header matched `disruption-rebooking`/)
  assert.equal(check(two, 'disruption-rebooking', SPEC), '', 'a second spec does not change a match')
  assert.match(check(two, 'disruption-rebooking', OTHER), /is under specs\/deck-planner\/, and the header matched `disruption-rebooking`/)

  // One unrelated single spec: the intake path is required, and a spec path fails.
  assert.equal(check(one, 'none matched (unrelated: disruption-rebooking)', INTAKE), '')
  assert.match(check(one, 'none matched (unrelated: disruption-rebooking)', SPEC), /is inside a spec, and the header established `none matched \(unrelated: disruption-rebooking\)`/)
  assert.equal(check(one, 'none matched (unclear: disruption-rebooking)', INTAKE), '')
  assert.match(check(one, 'none matched (unclear: disruption-rebooking)', SPEC), /is inside a spec/)
  assert.match(check(one, 'none', INTAKE), /is `none`, and the repository holds `disruption-rebooking`/, 'a spec that exists is named, matched or not')
  assert.match(check(one, 'none', SPEC), /is inside a spec/)

  // Several ambiguous specs: the intake path is required.
  assert.equal(check(two, 'several (deck-planner, disruption-rebooking)', INTAKE), '')
  assert.match(check(two, 'several (deck-planner, disruption-rebooking)', SPEC), /is inside a spec, and the header established `several/)
  assert.equal(check(two, 'none matched (unrelated: deck-planner, disruption-rebooking)', INTAKE), '')
  assert.match(check(two, 'none matched (unrelated: disruption-rebooking)', INTAKE), /leaves out `deck-planner`/)

  // No spec, a spec that does not exist, a value outside the grammar, and an inline handoff with no path.
  assert.equal(check([], 'none', INTAKE), '')
  assert.match(check([], 'disruption-rebooking', SPEC), /names `disruption-rebooking`, and the repository holds no spec/)
  assert.match(check(one, 'several (deck-planner, disruption-rebooking)', INTAKE), /names `deck-planner`/)
  assert.match(check(one, 'the only spec', INTAKE), /none of the allowed forms/)
  assert.equal(check(one, 'none matched (unrelated: disruption-rebooking)', undefined), '')
  assert.match(check(one, 'none', undefined), /is `none`, and the repository holds/)
})

test('destination: apply reads the header of the run and the specs the repository held', () => {
  const SPEC = 'specs/disruption-rebooking/handoffs/H004-2026-10-07-expiry-exception.md'
  const INTAKE = 'handoffs/20261007-093012-boarding-manifest.md'
  const run = (value, handoffPath, specs) => apply({ destination: true }, { doc: swap(good, 'Build Flow spec', value), handoffPath, specs })
  assert.deepEqual(run('none', INTAKE, []), [])
  assert.deepEqual(run('disruption-rebooking', SPEC, ['disruption-rebooking']), [])
  assert.deepEqual(run('none matched (unrelated: disruption-rebooking)', INTAKE, ['disruption-rebooking']), [])
  assert.equal(run('none matched (unrelated: disruption-rebooking)', SPEC, ['disruption-rebooking']).length, 1)
  assert.equal(run('disruption-rebooking', INTAKE, ['disruption-rebooking']).length, 1)
  assert.deepEqual(apply({ destination: true }, { doc: '', specs: [] }), ['no `Build Flow spec:` line to read'])
})

// --- inventory ------------------------------------------------------------------------------------------------------

test('inventory: sections nest, and a heading inside a code block is not a heading', () => {
  const text = '# T\n\n## A\n\none\n\n### A1\n\ntwo\n\n```md\n## not a heading\n```\n\n## B\n\nthree\n'
  assert.deepEqual(sections(text).map((s) => s.title), ['T', 'A', 'A1', 'B'])
  assert.match(within(text, '^a$'), /one[\s\S]*two[\s\S]*not a heading/)
  assert.doesNotMatch(within(text, '^a$'), /three/)
})

test('inventory: literals ignore case, spacing and dash style, and `in` scopes an item to a section', () => {
  const text = '## Open questions\n\n- Brevik–Holm  only, “Too tall”\n\n## Out of scope\n\n- Freight invoicing\n'
  assert.ok(keeps('brevik-holm only', text))
  assert.ok(keeps({ text: '"Too tall"' }, text))
  assert.ok(keeps({ re: 'freight\\s+invoic', in: 'out of scope' }, text))
  assert.ok(!keeps({ text: 'freight invoicing', in: 'open question' }, text))
  assert.ok(!keeps('lane.id', text))
  const result = inventory(['brevik-holm', { name: 'the missing one', text: 'turntable', in: 'out of scope' }], text)
  assert.deepEqual(result, { total: 2, kept: 1, missing: ['the missing one (in out of scope)'], report: 'MATERIAL INFORMATION LOSS: 1 of 2 items missing' })
})

test('inventory: the good DEEP handoff keeps every item, and a collapsed roadmap does not', () => {
  const items = json('inventory', '25-roadmap-preservation.json')
  assert.ok(items.filter((i) => i.in === 'source roadmap').length >= 12)
  assert.ok(items.filter((i) => i.in === 'source implementation sequence').length >= 16)
  assert.deepEqual(inventory(items, good), { total: items.length, kept: items.length, missing: [], report: 'MATERIAL INFORMATION LOSS: NONE' })
  const collapsed = inventory(items, fixture('bad-collapsed-roadmap'))
  assert.match(collapsed.report, /^MATERIAL INFORMATION LOSS: \d+ of \d+ items missing$/)
  for (const name of ['phase 4: ADR class 2 and 3 segregation', 'phase 9: MV Petrel turntable', 'step 7: height rule message', 'step 14: Trimline export columns']) {
    assert.ok(collapsed.missing.some((m) => m.startsWith(name)), name)
  }
  assert.ok(collapsed.missing.length >= 30, String(collapsed.missing.length))
  // The header and the lint both pass a collapsed roadmap. Only the inventory sees it.
  assert.deepEqual(checkHeader(fixture('bad-collapsed-roadmap')), [])
})

test('inventory: every item of every inventory is in the source it was taken from', () => {
  for (const file of readdirSync(join(here, 'inventory'))) {
    const source = read('cases', file.replace(/\.json$/, '.md'))
    const items = json('inventory', file)
    assert.ok(items.length >= 20, file)
    for (const item of items) {
      const { in: _scope, ...anywhere } = typeof item === 'string' ? { text: item } : item
      assert.ok(keeps(anywhere, source), `${file}: ${JSON.stringify(item)}`)
      if (item.in) assert.doesNotThrow(() => new RegExp(item.in))
    }
  }
})

// --- repetition ---------------------------------------------------------------------------------------------------

const BADGES = `# Handoff: Availability badges
Handoff. Evidence, not truth. Compiled by /handoff.
Handoff id: 20261007-093012-availability-badges
Depth: STANDARD

## Approved decisions

- A listing with 21 or more available days in the next 30 gets the top badge, labelled "Wide open". Vera decided this on Monday.

## Data / APIs / contracts

\`\`\`
POST /calendar/v3/availability:batch
\`\`\`

- The snapshot table refreshes at 03:00 UTC and lags real time by up to 24h.
- Maximum 50 listing ids per call.

## Proposed / not yet approved

- Middle band of 10 to 20 available days, labelled "Some dates left", proposed by Lin.

## Testing / QA / proof expectations

- Omar wants to load test the batch endpoint before committing to live computation.

## Open questions

- Is the middle band 10 to 20 days or 7 to 20, and is its label "Some dates left"?
`

test('repetition: a statement made twice is found, reworded or not, and different facts about one subject are not', () => {
  assert.deepEqual(repeats(BADGES), [])
  assert.deepEqual(repeats(small), [])
  const again = repeats(`${BADGES}\n## Requirements\n\n- The snapshot table refreshes at 03:00 UTC and lags real time by up to 24h.\n`)
  assert.equal(again.length, 1)
  assert.equal(again[0].score, 1)
  assert.match(again[0].first.section, /Data \/ APIs \/ contracts$/)
  assert.match(again[0].second.section, /Requirements$/)
  const reworded = repeats(`${BADGES}\n## Constraints\n\n- A listing with 21 or more available days in the next 30 gets the top badge, called "Wide open".\n`)
  assert.equal(reworded.length, 1)
  assert.ok(reworded[0].score >= 0.8 && reworded[0].score < 1, String(reworded[0].score))
  const summary = '\n## Explicitly not asserted\n\n- The snapshot table refreshes at 03:00 UTC and lags real time by up to 24 hours.\n- A middle band of 10 to 20 available days, labelled "Some dates left", was proposed by Lin.\n- Vera decided that a listing with 21 or more available days in the next 30 gets the top badge, labelled "Wide open".\n'
  assert.equal(repeats(BADGES + summary).length, 3, 'a closing summary of earlier sections is three repeats')
})

test('repetition: the header, headings, code, short lines, and the testing, acceptance and provenance sections are left out', () => {
  const texts = statements(BADGES).map((s) => s.text).join('\n')
  assert.doesNotMatch(texts, /Compiled by|Handoff id|POST \/calendar|Maximum 50|load test/)
  assert.match(texts, /Wide open/)
  assert.deepEqual(repeats(`${BADGES}\n## Source acceptance / expectations\n\n- The snapshot table refreshes at 03:00 UTC and lags real time by up to 24h.\n`), [], 'an acceptance item stays whole where it stands')
  assert.deepEqual(repeats(`${BADGES}\n## Source provenance\n\n- The snapshot table refreshes at 03:00 UTC and lags real time by up to 24h.\n`), [])
  assert.deepEqual(repeats(BADGES.replace('- Omar wants', '- Middle band of 10 to 20 available days, labelled "Some dates left", proposed by Lin.\n- Omar wants')), [], 'a testing item may restate')
  assert.deepEqual(repeats(`${BADGES}\n## Constraints\n\n- Maximum 50 listing ids per call.\n`), [], 'under seven words is too little to compare')
  assert.equal(repeats(BADGES, { alike: 0.3 }).length >= 1, true, 'the proposal and the question about it are alike only at a loose setting')
})

test('repetition: apply counts repeats in the body against the allowance', () => {
  const twice = `${BADGES}\n## Requirements\n\n- The snapshot table refreshes at 03:00 UTC and lags real time by up to 24h.\n`
  assert.equal(apply({ maxRepeats: 0 }, { doc: BADGES }), true)
  assert.equal(apply({ maxRepeats: 1 }, { doc: twice }), true)
  const found = apply({ maxRepeats: 0 }, { doc: twice })
  assert.equal(found.length, 1)
  assert.match(found[0], /snapshot table refreshes.*\(Data \/ APIs \/ contracts\).*\(Requirements\)/)
})

// --- receipt --------------------------------------------------------------------------------------------------------

const receipt = (path, { depth = 'DEEP', baseline = '8f2c41d', mode = 'NEW', loss = 'NONE', ready = 'YES', next = true } = {}) =>
  ['HANDOFF', `\`${path}\``, '', `Depth: ${depth}`, `Baseline: ${baseline}`, `Mode: ${mode}`, `Material information loss: ${loss}`, '', `Ready for Build Flow: ${ready}`,
    ...(next ? ['', 'Next:', 'Run the Build Flow using', `\`${path}\``] : [])].join('\n')

test('receipt: the contract form passes, with and without the Next lines', () => {
  assert.deepEqual(checkReceipt(receipt(GOOD_PATH), { path: GOOD_PATH, doc: good }), [])
  assert.deepEqual(checkReceipt(`\`\`\`text\n${receipt(GOOD_PATH)}\n\`\`\`\n`, { path: GOOD_PATH, doc: good }), [])
  assert.deepEqual(checkReceipt(receipt(GOOD_PATH, { baseline: HEAD.slice(0, 12) }), { path: GOOD_PATH, doc: good }), [])
  assert.deepEqual(checkReceipt(`${receipt(GOOD_PATH)}\n\nThe source held a staging token. Rotate it if the notes were shared.`, { path: GOOD_PATH, doc: good, secret: true }), [])
  const p = 'handoffs/20261007-101544-cancellation-email-subject-line.md'
  assert.deepEqual(checkReceipt(receipt(p, { depth: 'SMALL', baseline: '0a1b2c3', loss: 'LOW: an image was not read', ready: 'NO: the approved body text', next: false }), { path: p, doc: small }), [])
})

test('receipt: anything else in chat fails', () => {
  const check = (out, extra = {}) => checkReceipt(out, { path: GOOD_PATH, doc: good, ...extra }).join('\n')
  assert.match(check(good), /no `HANDOFF` line/)
  assert.match(check(`${receipt(GOOD_PATH)}\n\n${good}`), /line\(s\) in the reply beyond the receipt/)
  assert.match(check(`I wrote the handoff.\n\n${receipt(GOOD_PATH)}`), /1 line\(s\) in the reply beyond the receipt/)
  assert.match(check(`${receipt(GOOD_PATH)}\n\nSummary: thirteen phases and seventeen steps.`, { secret: true }), /no one-line secret notice/)
  assert.match(check(receipt(GOOD_PATH), { secret: true }), /no one-line secret notice/)
  assert.match(check(receipt('handoffs/20261007-093012-other.md')), /the line after HANDOFF is not/)
  assert.match(check(receipt(GOOD_PATH, { depth: 'STANDARD' })), /receipt `Depth: STANDARD` differs from the file header `DEEP`/)
  assert.match(check(receipt(GOOD_PATH, { baseline: 'abc1234' })), /is not the start of the file header/)
  assert.match(check(receipt(GOOD_PATH, { baseline: 'main' })), /is not a short revision/)
  assert.match(check(receipt(GOOD_PATH, { mode: 'DELTA' })), /receipt `Mode: DELTA`/)
  assert.match(check(receipt(GOOD_PATH, { loss: 'LOW: a phase' })), /receipt `Material information loss: LOW: a phase`/)
  assert.match(check(receipt(GOOD_PATH, { ready: 'NO: a phase', next: false })), /receipt `Ready for Build Flow: NO: a phase`/)
  assert.match(check(receipt(GOOD_PATH, { next: false })), /with YES the receipt ends/)
  assert.match(check(receipt(GOOD_PATH).replace(/`[^`]+`$/, 'this handoff.')), /with YES the receipt ends/)
  assert.match(check(receipt(GOOD_PATH).replace('Mode: NEW\n', '')), /no `Mode:` line/)
  assert.match(checkReceipt(receipt(GOOD_PATH, { ready: 'NO: a phase' }), { path: GOOD_PATH, doc: swap(good, 'Ready for Build Flow', 'NO: a phase') }).join('\n'), /Next lines appear without/)
})

// --- checks.json and the runner -------------------------------------------------------------------------------------

const checks = json('checks.json')
const caseNames = readdirSync(join(here, 'cases')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort()

test('checks.json: every case has checks, and every check is one known type with regexes that compile', () => {
  assert.deepEqual(Object.keys(checks).filter((k) => !['all', 'outside', 'file'].includes(k)).sort(), caseNames)
  assert.ok(caseNames.length >= 33)
  for (const [name, list] of Object.entries(checks)) {
    for (const c of list) {
      const keys = Object.keys(c).filter((k) => k !== 'why')
      assert.equal(keys.length, 1, `${name}: ${JSON.stringify(c)}`)
      assert.ok(TYPES.includes(keys[0]), `${name}: ${keys[0]}`)
      const v = c[keys[0]]
      const patterns = { has: [v], absent: [v], stdoutHas: [v], stdoutAbsent: [v], inSection: v, notInSection: v, minCount: [v?.[0]], maxCount: [v?.[0]], sectionMinCount: v?.slice?.(0, 2), fileHas: [v?.[1]] }[keys[0]] ?? []
      for (const p of patterns) assert.doesNotThrow(() => new RegExp(p, 'im'), `${name}: ${p}`)
      if (c.inventory) assert.ok(existsSync(join(here, 'inventory', `${c.inventory}.json`)), c.inventory)
      if (c.header) assert.deepEqual(Object.keys(c.header).filter((k) => !['depth', 'mode', 'spec', 'specs', 'previous', 'overlaps'].includes(k)), [], name)
      if (c.header?.specs) assert.ok(['several', 'unrelated', 'unclear'].includes(c.header.spec), name)
      if (c.path) assert.deepEqual(Object.keys(c.path).filter((k) => !['kind', 'spec', 'n'].includes(k)), [], name)
    }
  }
  assert.deepEqual(checks.file.map((c) => Object.keys(c)[0]), ['path', 'git', 'header', 'lint', 'receipt'])
})

test('checks.json: a case inside a repository is a file case or says it is inline', () => {
  const repoCases = caseNames.filter((n) => existsSync(join(here, 'repos', n)))
  assert.deepEqual(repoCases.map((n) => n.slice(0, 2)), ['22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33'])
  for (const name of repoCases) {
    const inline = checks[name].some((c) => c.writes === 'none')
    assert.equal(inline, name === '31-inline-in-repo', name)
    assert.ok(inline ? checks[name].some((c) => c.git === 'unchanged') : checks[name].some((c) => c.path), name)
    assert.ok(checks[name].some((c) => c.header), name)
  }
  for (const name of caseNames.filter((n) => !repoCases.includes(n))) assert.ok(checks[name].some((c) => c.writes), `${name} says what it writes`)
})

test('the fixture repositories build as the cases describe them', () => {
  const plain = project('24-meeting-complex')
  assert.deepEqual(plain.names, ['harbor-desk'])
  assert.equal(gitState(plain.cwd).branch, 'main')
  assert.equal(git(plain.cwd, 'status', '--porcelain').trim(), '')
  assert.ok(!existsSync(join(plain.cwd, 'specs')) && !existsSync(join(plain.cwd, 'handoffs')))
  assert.match(read('repos', 'harbor-desk', 'src', 'rebooking', 'rebookingRules.ts'), /REBOOK_WINDOW_HOURS = 48/)

  const dirty = project('23-repo-dirty')
  assert.match(git(dirty.cwd, 'status', '--porcelain'), /^ M src\/orders\/OrdersPage\.tsx$/m)

  const one = project('29-spec-store')
  assert.equal(git(one.cwd, 'status', '--porcelain').trim(), '')
  const spec = join(one.cwd, 'specs', 'disruption-rebooking')
  assert.deepEqual(readdirSync(join(one.cwd, 'specs')), ['disruption-rebooking'])
  assert.equal(nextHandoffNumber({ handoffFiles: readdirSync(join(spec, 'handoffs')), workingFiles: readdirSync(join(spec, 'working')) }), 4)
  assert.equal(checks['29-spec-store'].find((c) => c.path).path.n, 4)

  const named = project('32-two-specs-one-subject')
  assert.deepEqual(files(named.cwd).filter((f) => f.startsWith('specs/')).sort(), files(project('30-two-specs').cwd).filter((f) => f.startsWith('specs/')).sort())
  assert.equal(read('cases', '32-two-specs-one-subject.md'), read('cases', '29-spec-store.md'), 'the same source as case 29, with a second spec beside it')

  // Case 33 is case 29's repository with a source about another product area: one spec, and it does not match.
  const lone = project('33-unrelated-single-spec')
  assert.deepEqual(specsOf(lone.cwd), ['disruption-rebooking'])
  assert.deepEqual(files(lone.cwd).sort(), files(one.cwd).sort())
  assert.doesNotMatch(read('cases', '33-unrelated-single-spec.md'), /rebook|disruption|cancel|offer|TW-618/i, 'the source shares no subject noun with the spec')
  assert.deepEqual(specsOf(plain.cwd), [])
  assert.deepEqual(specsOf(one.cwd), ['disruption-rebooking'])

  // The three routing outcomes each have a case that asserts the path and the header.
  const routing = (name) => [checks[name].find((c) => c.path).path.kind, checks[name].find((c) => c.header).header.spec]
  assert.deepEqual(routing('29-spec-store'), ['spec', 'disruption-rebooking'], 'one matching spec')
  assert.deepEqual(routing('33-unrelated-single-spec'), ['intake', 'unrelated'], 'one unrelated single spec')
  assert.deepEqual(routing('30-two-specs'), ['intake', 'several'], 'several ambiguous specs')
  assert.deepEqual(routing('32-two-specs-one-subject'), ['spec', 'disruption-rebooking'], 'two specs, one named by the source')

  const two = project('30-two-specs')
  assert.deepEqual(specsOf(two.cwd), ['deck-planner', 'disruption-rebooking'])
  assert.deepEqual(readdirSync(join(two.cwd, 'specs')).sort(), ['deck-planner', 'disruption-rebooking'])
  assert.ok(files(two.cwd).every((f) => !f.startsWith('handoffs/')))
  for (const f of files(one.cwd).filter((x) => x.startsWith('specs/'))) assert.equal(readFileSync(join(two.cwd, f), 'utf8'), readFileSync(join(one.cwd, f), 'utf8'), f)
})

test('apply: a conforming file run passes the default file checks, and each fault fails its check', () => {
  const run = (over = {}) => ({ out: receipt(GOOD_PATH), doc: good, source: read('cases', '25-roadmap-preservation.md'), cwd: here, written: [GOOD_PATH], handoffPath: GOOD_PATH, here, outDir: here,
    start: Date.parse('2026-10-07T09:29:00Z'), end: Date.parse('2026-10-07T09:31:00Z'), now: Date.parse('2026-10-07T09:31:00Z'),
    git: { unchanged: false, rest: true, added: [GOOD_PATH] }, expected: measured, ...over })
  const failing = (r, list) => list.filter((c) => { const result = apply(c, r); return !(result === true || (Array.isArray(result) && !result.length)) }).map((c) => Object.keys(c)[0])
  const own = checks['25-roadmap-preservation']
  assert.deepEqual(failing(run(), [...checks.all, ...checks.file, ...own]), [])
  assert.deepEqual(failing(run({ git: { unchanged: false, rest: false, added: [GOOD_PATH] } }), checks.file), ['git'])
  assert.deepEqual(failing(run({ git: { unchanged: false, rest: true, added: [GOOD_PATH, 'notes.md'] } }), checks.file), ['git'])
  assert.deepEqual(failing(run({ git: { unchanged: false, rest: true, added: ['handoffs/deck-planner.md'] }, handoffPath: undefined, doc: '' }), checks.file), ['path', 'git', 'header', 'receipt'])
  assert.deepEqual(failing(run({ doc: fixture('bad-short-sha') }), checks.file), ['header'])
  assert.deepEqual(failing(run({ doc: fixture('bad-ticket') }), checks.file), ['lint'])
  assert.deepEqual(failing(run({ out: good }), checks.file), ['receipt'])
  assert.deepEqual(failing(run({ doc: fixture('bad-collapsed-roadmap') }), own).sort(), ['inventory', 'sectionMinCount', 'sectionMinCount', 'sectionMinCount'])
  assert.deepEqual(failing(run({ doc: fixture('bad-build-flow-output') }), [...checks.all, ...checks.outside, ...checks.file]), ['absent', 'absent', 'absent', 'lint'])
  assert.deepEqual(failing(run({ written: [GOOD_PATH] }), [{ writes: 'none' }, { git: 'unchanged' }]), ['writes', 'git'])
  assert.deepEqual(failing(run({ written: [], git: { unchanged: true, rest: true, added: [] }, out: good, handoffPath: undefined, expected: { ...measured, path: undefined } }), [{ writes: 'none' }, { git: 'unchanged' }, { header: { mode: 'NEW' } }, { lint: true }]), [])
  assert.deepEqual(failing(run({ out: good }), [{ inline: true }]), [])
  assert.deepEqual(failing(run(), [{ inline: true }]), ['inline'], 'a receipt is not an inline handoff')
  assert.throws(() => apply({ nonsense: 1 }, run()), /unknown check/)
})

test('inline: the reply opens on the title, with no sentence or fence before it and no receipt after', () => {
  assert.deepEqual(checkInline(small), [])
  assert.deepEqual(checkInline(`\n${small}\nThe source held a secret: an API key. Rotate it.\n`), [], 'a secret notice after the handoff is allowed')
  assert.equal(checkInline(`Here is the handoff.\n\n${small}`).length, 1)
  assert.equal(checkInline('```markdown\n' + small + '\n```').length, 1)
  assert.equal(checkInline(`${small}\n\n${receipt(GOOD_PATH)}`).length, 1)
  assert.equal(checkInline(`${small}\nHANDOFF\n`).length, 1)
})

test('apply: a size check measures the handoff without its header', () => {
  assert.ok(bodyOf(good).length < good.length - 400)
  assert.match(bodyOf(good), /^# Handoff: Deck planner plan of record draft v0\.3\n\n## Executive context/)
  const inline = '# Handoff: Export label\n\n## Approved decisions\n\n- The button reads "Download CSV". Approved by Hal.\n'
  assert.equal(bodyOf(inline), inline)
  const r = { doc: good, source: 'x'.repeat(bodyOf(good).length), out: '', written: [] }
  assert.equal(apply({ maxRatio: 1 }, r), true)
  assert.equal(apply({ maxChars: bodyOf(good).length - 1 }, r), false)
})
