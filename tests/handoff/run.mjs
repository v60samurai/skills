#!/usr/bin/env node
// Runs each case in cases/ through /handoff with `claude -p` and applies the
// checks in checks.json. Model output varies, so the checks assert properties
// (a value survives, a proposal is not promoted, the file lands where the
// storage rule puts it), not text.
//
//   node tests/handoff/run.mjs            every case
//   node tests/handoff/run.mjs 02 06      cases whose name starts with 02 or 06
//
// The deterministic checks behind these (header.mjs, lint.mjs, inventory.mjs)
// have their own tests, which call no model: node --test tests/handoff/
//
// By default the skill under test is this checkout, linked into a throwaway
// project and run with project settings only, so your own hooks and rules stay
// out of the result. HANDOFF_LIVE=1 skips the link and tests whatever /handoff
// the current Claude profile resolves (set CLAUDE_CONFIG_DIR to pick a
// profile). If that profile's hooks write files into the project, name them
// with HANDOFF_IGNORE, a regex over relative paths. HANDOFF_SKILL points the
// link at another copy of the skill, such as an older revision to compare.
// HANDOFF_OUT keeps the outputs in a directory you name: <case>.out.md is the
// chat reply and <case>.handoff.md is the handoff.
//
// A case with a directory in repos/ runs inside a Git repository (see
// project() in harness.mjs). There the handoff is a file: the content checks
// read the one new file at an allowed path, and the checks under "file" in
// checks.json apply as well (path, Git state, header, lint, receipt). A case
// that carries { "writes": "none" } is inline: the content checks read the
// chat reply. A case that carries { "writes": "<path>" } names its own file. The checks
// under "outside" apply to a case with no repository. A case that writes no
// file is also held to the inline form: the reply opens on the title and no
// receipt follows.
//
// A case that cannot run is skipped, counted apart from the passes, and makes
// the run fail.
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { here, project, link, claude, files, gitState, leaveUnderTestRunner } from './harness.mjs'
import { apply } from './checks.mjs'
import { classifyPath } from './lint.mjs'

leaveUnderTestRunner()

const skill = process.env.HANDOFF_SKILL || join(here, '..', '..', 'skills', 'handoff')
const checks = JSON.parse(readFileSync(join(here, 'checks.json'), 'utf8'))
const outDir = process.env.HANDOFF_OUT || mkdtempSync(join(tmpdir(), 'handoff-out-'))
const only = process.argv.slice(2)

function run(name, source, own) {
  const p = project(name)
  const before = p.inRepo ? gitState(p.cwd) : null
  const had = new Set(files(p.cwd))
  link(p.cwd, 'handoff', skill)
  const start = Date.now()
  const out = claude(p.cwd, `/handoff ${source}`)
  const end = Date.now()
  const written = files(p.cwd).filter((f) => !had.has(f))
  const after = p.inRepo ? gitState(p.cwd) : null
  const added = after ? after.untracked.filter((f) => !before.untracked.includes(f)) : []
  const same = !after || (before.head === after.head && before.branch === after.branch && before.rest === after.rest)
  const named = own.find((c) => typeof c.writes === 'string' && c.writes !== 'none')?.writes
  const inline = own.some((c) => c.writes === 'none')
  const fileMode = p.inRepo && !inline && !named
  const handoffPath = named ?? (fileMode ? written.find((f) => classifyPath(f)) : undefined)
  const doc = handoffPath ? (existsSync(join(p.cwd, handoffPath)) ? readFileSync(join(p.cwd, handoffPath), 'utf8') : '') : fileMode ? '' : out
  writeFileSync(join(outDir, `${name}.out.md`), out)
  writeFileSync(join(outDir, `${name}.handoff.md`), doc)
  return { out, doc, source, cwd: p.cwd, inRepo: p.inRepo, written, handoffPath, fileMode, start, end, outDir, here,
    git: { unchanged: same && added.length === 0, rest: same, added },
    expected: p.inRepo ? { repository: p.names, branch: before.branch, head: before.head, dirty: JSON.parse(before.rest)[0].length + before.untracked.length > 0,
      notBefore: start - 120000, notAfter: end + 120000, ...(fileMode && handoffPath ? { path: handoffPath } : {}) } : {} }
}

const names = readdirSync(join(here, 'cases')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3))
  .filter((n) => !only.length || only.some((o) => n.startsWith(o))).sort()
let failed = 0
const skipped = []
for (const name of names) {
  let source = readFileSync(join(here, 'cases', `${name}.md`), 'utf8')
  // Case 13 is a delta on case 09's output: run 09 first, or point HANDOFF_PREVIOUS at a saved handoff.
  if (source.includes('{{PREVIOUS_HANDOFF}}')) {
    const prev = process.env.HANDOFF_PREVIOUS || join(outDir, '09-large-noisy.out.md')
    if (!existsSync(prev)) { console.log(`SKIP ${name} (no previous handoff at ${prev})`); skipped.push(name); continue }
    source = source.replace('{{PREVIOUS_HANDOFF}}', readFileSync(prev, 'utf8'))
  }
  const own = checks[name] || []
  const r = run(name, source, own)
  // A case's own path, header or receipt check replaces the default of the same type.
  const defaults = r.fileMode ? checks.file.filter((d) => !own.some((c) => Object.keys(d)[0] in c)) : []
  const printed = !r.fileMode && !r.handoffPath ? [{ inline: true, why: 'the reply is the handoff: the title first, no receipt after' }] : []
  const bad = [...checks.all, ...(r.inRepo ? [] : checks.outside), ...defaults, ...printed, ...own].flatMap((c) => {
    const result = apply(c, r)
    return result === true || (Array.isArray(result) && !result.length) ? [] : [{ c, why: Array.isArray(result) ? result : [] }]
  })
  const ratio = (r.doc.length / source.length).toFixed(2)
  console.log(`${bad.length ? 'FAIL' : 'PASS'} ${name} (${source.length} -> ${r.doc.length} chars, ${ratio}${r.handoffPath ? `, ${r.handoffPath}` : ''})`)
  for (const { c, why } of bad) { console.log(`     ${JSON.stringify(c)}`); for (const w of why) console.log(`       ${w}`) }
  failed += bad.length ? 1 : 0
}
const ran = names.length - skipped.length
console.log(`\n${ran - failed}/${ran} passed${skipped.length ? `, ${skipped.length} skipped (${skipped.join(', ')})` : ''}. Outputs: ${outDir}`)
process.exit(failed || skipped.length ? 1 : 0)
