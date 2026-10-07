<p align="center">
  <img src="assets/banner.svg" alt="v60samurai / skills. small tools. explicit jobs." width="100%">
</p>

# Skills

Claude Code skills I wrote and use. Each one does a single job that I was otherwise re-explaining in every session, and none of them plans, routes, or decides what the work means.

## Published

| Skill | What it does | Invocation | Status |
| --- | --- | --- | --- |
| [`handoff`](skills/handoff/SKILL.md) | Compiles meeting notes, threads, specs and updates into one self-contained Markdown evidence file. Noise goes, material detail stays. A proposal stays a proposal, a disagreement stays visible, and secrets stay out. Inside a Git repository it reads the project's status quo first, writes the file, and returns a short receipt. | `/handoff` | portable, explicit only |

[`catalog.json`](catalog.json) lists every skill I have written, including the ones that live elsewhere: in their own repositories, or inside a larger system they depend on. Each entry says where the skill lives and why its source is not copied here.

## Principles

- **Smallest sufficient machinery.** A skill is a Markdown file until it needs to be more.
- **One job, one owner.** `/handoff` packages evidence. Whoever receives it decides what the evidence means.
- **Evidence before invention.** A skill reports what the source says and marks what it does not say.
- **One router at most.** These skills never choose a playbook, a milestone, or the next skill.
- **The human moves work between stages.** A skill calls the next one only when the invocation asks for that in words.

## Install

A skill is a directory with a `SKILL.md`. Claude Code loads personal skills from `~/.claude/skills/<name>/`.

```bash
git clone https://github.com/v60samurai/skills.git
ln -s "$PWD/skills/skills/handoff" ~/.claude/skills/handoff
```

Copy the directory instead of linking it if you would rather not track this repository. Then type `/handoff` in Claude Code, followed by the material:

```text
/handoff <paste notes, a thread, or file paths>
/handoff --inline <material>
/handoff save it to docs/handoffs/pricing.md <material>
/handoff and run Build Flow <material>
```

Inside a Git repository the first form writes one Markdown file and prints a receipt. `--inline` prints the handoff in chat and writes nothing. An explicit path wins over the storage rule. The last form writes the file, then starts the Build Flow with its path.

`handoff` sets `disable-model-invocation: true`, so it runs only when you type it.

## How `/handoff` works

`/handoff` is not a summary. It is a persistent evidence boundary between messy human and project context and the Build Flow.

```text
MESSY CONTEXT
-> /handoff
-> SELF-CONTAINED EVIDENCE FILE
-> Build Flow
-> CANONICAL TRUTH / READY
-> PStack
```

`/handoff` records what was said, what exists, what was observed and what was proposed. The Build Flow decides what is authoritative and executable. PStack decides how ready work gets engineered. The handoff is rich enough that the Build Flow needs no original context, and never so opinionated that the Build Flow has nothing left to reconcile.

It removes noise without removing material context: repetition and chatter collapse, and every distinct requirement, roadmap phase, implementation step, contract, testing expectation, dependency and open question stays.

- **A file by default.** Inside a Git repository the handoff is written to disk. When exactly one Build Flow spec matches the source, it goes to `specs/<id>/handoffs/H<nnn>-<YYYY-MM-DD>-<slug>.md`, numbered after the handoffs already there and never overwriting one. A spec matches by evidence: the user names it, the source names it or adds to a handoff stored in it, or the source is about the same feature as the spec's documents. Being the only spec in the repository is not evidence. When no spec matches, or the match is ambiguous, the handoff goes to the intake directory, `handoffs/<YYYYMMDD-HHMMSS>-<slug>.md`, and the Build Flow routes it. The header records which of these was established. Outside a repository, with no path given, there is nowhere to write, so the handoff is printed.
- **A header from commands.** The file opens with plain `Label: value` lines: handoff id, created time, repository, branch, full baseline revision, working tree, depth, mode, previous handoff, spec, sources and their hashes, material information loss, and `Ready for Build Flow`. Each value comes from command output in that run.
- **A receipt in chat.** Path, depth, baseline, mode, material information loss, the verdict, and the next command. `Ready for Build Flow: YES` means the file is self-contained enough for the Build Flow to start. It says nothing about engineering readiness.
- **Adaptive depth.** The skill picks the depth from how much unique consequential material the source holds, not from its length. SMALL: one update or decision. STANDARD: a meaningful feature or update. DEEP: several systems, architecture, a roadmap or an implementation sequence, which can run to several thousand words.
- **Self-containment.** A fresh session with only the repository and the file path must not need the original chat, notes or document. References supplement the handoff and never stand in for content. If the source points at material that was not supplied, the handoff says so and its verdict is `Ready for Build Flow: NO`.
- **Status quo first.** Inside a Git repository the skill does a bounded pass before writing, read-only except for the handoff file: branch, revision, working tree, project documents, existing specs, and the code on the surfaces the source touches. The handoff reports the source as a delta against the committed baseline: what already exists, what is new, what conflicts. Uncommitted local changes are kept apart. What the code does is evidence, not approval.
- **Two checks before writing.** Check A asks what the receiver would still have to recover from the original source. Check B asks whether the handoff decided anything the Build Flow should reconcile. Both must pass.
- **No Build Flow or PStack output.** No truth documents, decision or ticket ids, readiness states, execution plan, playbook or model choice, and no test plan the source did not supply. A source's own roadmap or plan is carried under its own names, labelled as the source's.

For a new project handoff, start from a clean default branch:

```bash
cd <project>
git status
claude
```

```text
/handoff <material>
```

Review the file, then run the Build Flow with its path, as the receipt says. `/handoff` stops after the receipt unless the invocation asks for the chain ("/handoff and run Build Flow"), and the Build Flow still does its own preflight and reconciliation against the repository either way.

## Structure

```text
skills/<name>/SKILL.md   one directory per published skill
catalog.json             every first-party skill and where it lives
tests/handoff/           source fixtures, repository fixtures, property checks, and a runner
assets/                  banner
```

`node tests/handoff/run.mjs` runs each fixture through `/handoff` with `claude -p` and checks properties of the result: an exact value survived, a proposal was not promoted to a decision, every roadmap phase kept its own entry, a repetitive transcript came out shorter than a dense spec, no statement was made twice, a handoff landed in a spec's store only when that spec matched the source, no secret leaked, nothing was written in inline mode or outside a repository with no path given, and inside a repository the one handoff file was the only change to Git state.

## Attribution

The source in this repository is original work under the [MIT license](LICENSE). Skills adapted from someone else's work are credited in `catalog.json` and their source is not republished here. The banner was designed by Codex.
