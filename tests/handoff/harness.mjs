// What run.mjs and fresh-session.mjs share: building a fixture project,
// linking a skill into it, running Claude in it, and reading Git state.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, symlinkSync, readdirSync, existsSync, cpSync, appendFileSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const here = dirname(fileURLToPath(import.meta.url))
export const live = Boolean(process.env.HANDOFF_LIVE)
const ignore = process.env.HANDOFF_IGNORE && new RegExp(process.env.HANDOFF_IGNORE)

// Files under a directory. Dot-directories are skipped: they hold the linked
// skill and whatever caches the profile's own hooks write.
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.name.startsWith('.') ? [] : e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])
export const files = (cwd) => walk(cwd).map((f) => relative(cwd, f)).filter((f) => !ignore || !ignore.test(f))

export const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' })

export function gitState(cwd) {
  const status = git(cwd, 'status', '--porcelain', '-uall').split('\n').filter(Boolean)
  const untracked = status.filter((l) => l.startsWith('?? ')).map((l) => l.slice(3)).filter((f) => !ignore || !ignore.test(f))
  return { head: git(cwd, 'rev-parse', 'HEAD').trim(), branch: git(cwd, 'branch', '--show-current').trim(), untracked,
    rest: JSON.stringify([status.filter((l) => !l.startsWith('?? ')), git(cwd, 'diff'), git(cwd, 'diff', '--cached'), git(cwd, 'stash', 'list')]) }
}

// A throwaway project for a case. With a directory in repos/ it is a Git
// repository on main: repos/<case> and repos/<case>.overlay/ are committed as
// the baseline, and repos/<case>.dirty/ is copied on top and left uncommitted.
// The project directory takes the fixture's own name, so the repository has a
// name a header can be checked against.
export function project(name) {
  const repo = join(here, 'repos', name)
  if (!existsSync(repo)) return { cwd: mkdtempSync(join(tmpdir(), 'handoff-case-')), inRepo: false }
  const cwd = join(mkdtempSync(join(tmpdir(), 'handoff-case-')), basename(realpathSync(repo)))
  cpSync(repo, cwd, { recursive: true, dereference: true })
  if (existsSync(`${repo}.overlay`)) cpSync(`${repo}.overlay`, cwd, { recursive: true, dereference: true })
  git(cwd, 'init', '-q', '-b', 'main')
  appendFileSync(join(cwd, '.git', 'info', 'exclude'), '.claude/\n')
  git(cwd, 'add', '-A')
  git(cwd, '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-q', '-m', 'baseline')
  if (existsSync(`${repo}.dirty`)) cpSync(`${repo}.dirty`, cwd, { recursive: true, dereference: true })
  return { cwd, inRepo: true, names: [basename(cwd)] }
}

// Skipped under HANDOFF_LIVE, which tests whatever the current profile resolves.
// `copy` puts the skill's files inside the project. A skill that declares no
// allowed-tools cannot read its own references through a link that leaves the
// project, so the Build Flow is copied.
export function link(cwd, name, source, { copy = false } = {}) {
  if (live) return
  mkdirSync(join(cwd, '.claude', 'skills'), { recursive: true })
  const to = join(cwd, '.claude', 'skills', name)
  if (existsSync(to)) return
  if (copy) cpSync(source, to, { recursive: true, dereference: true }); else symlinkSync(source, to)
}

// `allow` names tools the session may use without asking, beyond file edits.
export function claude(cwd, prompt, { allow = [] } = {}) {
  const args = ['-p', prompt, '--permission-mode', 'acceptEdits']
  if (allow.length) args.push('--allowedTools', ...allow)
  if (!live) args.push('--setting-sources', 'project')
  try {
    return execFileSync('claude', args, { cwd, encoding: 'utf8', timeout: Number(process.env.HANDOFF_TIMEOUT || 900000), maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    return `${e.stdout || ''}\n[claude exited ${e.status}] ${e.stderr || e.message}`
  }
}

// The node test runner executes every .mjs file in a directory it is given.
// These scripts call a model, so they leave when it is the one running them.
export function leaveUnderTestRunner() { if (process.env.NODE_TEST_CONTEXT) process.exit(0) }
