#!/usr/bin/env node
// Runs each case in cases/ through /handoff with `claude -p` and applies the
// checks in checks.json. Model output varies, so the checks assert properties
// (a value survives, a proposal is not promoted, nothing is written), not text.
//
//   node tests/handoff/run.mjs            every case
//   node tests/handoff/run.mjs 02 06      cases whose name starts with 02 or 06
//
// By default the skill under test is this checkout, linked into a throwaway
// project and run with project settings only, so your own hooks and rules stay
// out of the result. HANDOFF_LIVE=1 skips the link and tests whatever /handoff
// the current Claude profile resolves (set CLAUDE_CONFIG_DIR to pick a
// profile). If that profile's hooks write files into the project, name them
// with HANDOFF_IGNORE, a regex over relative paths. HANDOFF_SKILL points the
// link at another copy of the skill, such as an older revision to compare.
//
// A case with a directory in repos/ runs inside a Git repository: the
// directory is committed as the baseline, and repos/<case>.dirty/, if present,
// is copied on top and left uncommitted.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, symlinkSync, readFileSync, readdirSync, writeFileSync, existsSync, cpSync, appendFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const skill = process.env.HANDOFF_SKILL || join(here, '..', '..', 'skills', 'handoff')
const checks = JSON.parse(readFileSync(join(here, 'checks.json'), 'utf8'))
const outDir = process.env.HANDOFF_OUT || mkdtempSync(join(tmpdir(), 'handoff-out-'))
const only = process.argv.slice(2)
const re = (s) => new RegExp(s, 'im')
const ignore = process.env.HANDOFF_IGNORE && new RegExp(process.env.HANDOFF_IGNORE)

// Files the run left behind. Dot-directories are skipped: they hold the linked
// skill and whatever caches the profile's own hooks write.
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.name.startsWith('.') ? [] : e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])

// Split on Markdown headings so a check can ask where a statement landed.
// A section runs to the next heading of the same or a higher level.
function sections(text) {
  const lines = text.split('\n')
  const heads = lines.flatMap((l, i) => { const m = /^(#{1,6})\s+(.*)/.exec(l); return m ? [{ i, level: m[1].length, title: m[2] }] : [] })
  return heads.map((h, n) => {
    const end = heads.slice(n + 1).find((x) => x.level <= h.level)
    return { title: h.title, body: lines.slice(h.i + 1, end ? end.i : lines.length).join('\n') }
  })
}

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' })
const gitState = (cwd) => `${git(cwd, 'rev-parse', 'HEAD')}${git(cwd, 'branch', '--show-current')}${git(cwd, 'status', '--porcelain')}${git(cwd, 'stash', 'list')}`

function run(name, source) {
  const cwd = mkdtempSync(join(tmpdir(), 'handoff-case-'))
  const repo = join(here, 'repos', name)
  let before
  if (existsSync(repo)) {
    cpSync(repo, cwd, { recursive: true, dereference: true })
    git(cwd, 'init', '-q', '-b', 'main')
    appendFileSync(join(cwd, '.git', 'info', 'exclude'), '.claude/\n')
    git(cwd, 'add', '-A')
    git(cwd, '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-q', '-m', 'baseline')
    if (existsSync(`${repo}.dirty`)) cpSync(`${repo}.dirty`, cwd, { recursive: true })
    before = gitState(cwd)
  }
  if (!process.env.HANDOFF_LIVE) {
    mkdirSync(join(cwd, '.claude', 'skills'), { recursive: true })
    symlinkSync(skill, join(cwd, '.claude', 'skills', 'handoff'))
  }
  let out = ''
  try {
    const args = ['-p', `/handoff ${source}`, '--permission-mode', 'acceptEdits']
    if (!process.env.HANDOFF_LIVE) args.push('--setting-sources', 'project')
    out = execFileSync('claude', args,
      { cwd, encoding: 'utf8', timeout: 600000, maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    out = `${e.stdout || ''}\n[claude exited ${e.status}] ${e.stderr || e.message}`
  }
  writeFileSync(join(outDir, `${name}.out.md`), out)
  return { out, cwd, gitUnchanged: before === undefined || before === gitState(cwd), written: walk(cwd).map((f) => relative(cwd, f)).filter((f) => !ignore || !ignore.test(f)) }
}

function apply(c, r, source) {
  const secs = sections(r.out)
  const within = (h) => secs.filter((s) => re(h).test(s.title)).map((s) => s.body).join('\n')
  if (c.has) return re(c.has).test(r.out)
  if (c.absent) return !re(c.absent).test(r.out)
  if (c.inSection) return re(c.inSection[1]).test(within(c.inSection[0]))
  if (c.notInSection) return !re(c.notInSection[1]).test(within(c.notInSection[0]))
  if (c.minCount) return (r.out.match(new RegExp(c.minCount[0], 'gim')) || []).length >= c.minCount[1]
  if (c.shorterThan) return existsSync(join(outDir, `${c.shorterThan}.out.md`)) && r.out.length < readFileSync(join(outDir, `${c.shorterThan}.out.md`), 'utf8').length
  if (c.git === 'unchanged') return r.gitUnchanged
  if (c.maxCount) return (r.out.match(new RegExp(c.maxCount[0], 'gi')) || []).length <= c.maxCount[1]
  if (c.maxRatio) return r.out.length / source.length <= c.maxRatio
  if (c.maxChars) return r.out.length <= c.maxChars
  if (c.writes === 'none') return r.written.length === 0
  if (c.writes) return r.written.length === 1 && r.written[0] === c.writes
  if (c.fileHas) return existsSync(join(r.cwd, c.fileHas[0])) && re(c.fileHas[1]).test(readFileSync(join(r.cwd, c.fileHas[0]), 'utf8'))
  throw new Error(`unknown check ${JSON.stringify(c)}`)
}

const names = readdirSync(join(here, 'cases')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3))
  .filter((n) => !only.length || only.some((o) => n.startsWith(o))).sort()
let failed = 0
for (const name of names) {
  let source = readFileSync(join(here, 'cases', `${name}.md`), 'utf8')
  // Case 13 is a delta on case 09's output: run 09 first, or point HANDOFF_PREVIOUS at a saved handoff.
  if (source.includes('{{PREVIOUS_HANDOFF}}')) {
    const prev = process.env.HANDOFF_PREVIOUS || join(outDir, '09-large-noisy.out.md')
    if (!existsSync(prev)) { console.log(`SKIP ${name} (no previous handoff at ${prev})`); continue }
    source = source.replace('{{PREVIOUS_HANDOFF}}', readFileSync(prev, 'utf8'))
  }
  const r = run(name, source)
  const bad = [...checks.all, ...(checks[name] || [])].filter((c) => !apply(c, r, source))
  const ratio = (r.out.length / source.length).toFixed(2)
  console.log(`${bad.length ? 'FAIL' : 'PASS'} ${name} (${source.length} -> ${r.out.length} chars, ${ratio})`)
  for (const c of bad) console.log(`     ${JSON.stringify(c)}`)
  failed += bad.length ? 1 : 0
}
console.log(`\n${names.length - failed}/${names.length} passed. Outputs: ${outDir}`)
process.exit(failed ? 1 : 0)
