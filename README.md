<p align="center">
  <img src="assets/banner.svg" alt="v60samurai / skills. small tools. explicit jobs." width="100%">
</p>

# Skills

Claude Code skills I wrote and use. Each one does a single job that I was otherwise re-explaining in every session, and none of them plans, routes, or decides what the work means.

## Published

| Skill | What it does | Invocation | Status |
| --- | --- | --- | --- |
| [`handoff`](skills/handoff/SKILL.md) | Packages meeting notes, threads and updates into a short Markdown evidence packet. A proposal stays a proposal, a disagreement stays visible, and secrets stay out. | `/handoff` | portable, explicit only |

[`catalog.json`](catalog.json) lists every skill I have written, including the ones that live elsewhere: in their own repositories, or inside a larger system they depend on. Each entry says where the skill lives and why its source is not copied here.

## Principles

- **Smallest sufficient machinery.** A skill is a Markdown file until it needs to be more.
- **One job, one owner.** `/handoff` packages evidence. Whoever receives it decides what the evidence means.
- **Evidence before invention.** A skill reports what the source says and marks what it does not say.
- **One router at most.** These skills never choose a playbook, a milestone, or the next skill.
- **The human moves work between stages.** No skill here calls the next one.

## Install

A skill is a directory with a `SKILL.md`. Claude Code loads personal skills from `~/.claude/skills/<name>/`.

```bash
git clone https://github.com/v60samurai/skills.git
ln -s "$PWD/skills/skills/handoff" ~/.claude/skills/handoff
```

Copy the directory instead of linking it if you would rather not track this repository. Then type `/handoff` in Claude Code, followed by the material:

```text
/handoff <paste notes, a thread, or file paths>
/handoff and save it to docs/handoffs/pricing.md <material>
```

`handoff` sets `disable-model-invocation: true`, so it runs only when you type it.

## Structure

```text
skills/<name>/SKILL.md   one directory per published skill
catalog.json             every first-party skill and where it lives
tests/handoff/           source fixtures, property checks, and a runner
assets/                  banner
```

`node tests/handoff/run.mjs` runs each fixture through `/handoff` with `claude -p` and checks properties of the result: an exact value survived, a proposal was not promoted to a decision, no secret leaked, nothing was written unless asked.

## Attribution

The source in this repository is original work under the [MIT license](LICENSE). Skills adapted from someone else's work are credited in `catalog.json` and their source is not republished here. The banner was designed by Codex.
