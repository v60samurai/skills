<p align="center">
  <img src="assets/banner.svg" alt="v60samurai / skills" width="100%">
</p>

# Skills

First-party agent skills, with one canonical source per capability. The [catalog](catalog.json) records skills maintained in other repositories rather than copying them here.

## Handoff

[`handoff`](skills/handoff/SKILL.md) resolves new work before engineering. It preserves new evidence, inspects current truth, resolves factual uncertainty, asks genuine human questions, invokes applicable domain owners and compiles a compact current BUILD contract. It stops before shipping code.

```text
/handoff
  capture new evidence
  understand the repository
  resolve facts and genuine human decisions
  crystallize PRODUCT / DESIGN / TECH / GLOSSARY / warranted ADRs
  compile BUILD.md, or maintain a decision map when uncertainty remains
  stop

human chooses a READY slice
fresh native Cursor session
/poteto-mode
  consume the requested BUILD slice
  choose engineering HOW
  implement, prove, independently review, fix and reverify
  explain and open one reviewable PR
  stop before merge

human merges
```

Brainstorm-stack owns meaningful divergence, design-stack owns meaningful experience design, Stacksmith owns actual stack/tool choices and Jev Atlas scans semantic-judgment opportunities. Every meaningful intake evaluates their triggers. A matched owner must participate through its real source. Unavailable mandatory capabilities block affected work rather than silently disappear.

Existing canonical truth is referenced. New ephemeral material is preserved with provenance and epistemic status. Prior handoffs remain append-only. A proposal, recommendation or unanswered default cannot become approval.

## Install and use

Clone this repository, then link the complete `skills/handoff` directory into the host's personal skill directory. For example, after cloning into `~/Developer/skills`:

```bash
ln -s ~/Developer/skills/skills/handoff ~/.claude/skills/handoff
```

Use the same canonical source in Cursor's `~/.cursor/skills/handoff` and other hosts that support skills. Existing destinations must be inspected before replacing them. Domain owners and upstream supporting skills remain separately owned installations; see [source discipline](skills/handoff/references/sources.md).

```text
/handoff Add a CSV export for the current report. The export must use the existing filters.
/handoff <meeting notes, new requirements or evidence paths>
/handoff Continue resolution for <initiative or prior handoff path>
```

The skill sets `disable-model-invocation: true`, so the human enters it explicitly. It needs no third lifecycle command. A tiny request uses minimal resolution. Multi-session fog stays in one Wayfinder-style decision map until sufficient truth exists.

The [BUILD contract](skills/handoff/references/build.md) and [worked example](skills/handoff/references/build-example.md) define mission fields, genuine Human Gates and one logical PR per slice. READY requires sufficient truth, resolved blocking gates and landed prerequisites. Native PStack owns method, models, delegation, verification and PR mechanics; the BUILD artifact does not prescribe them.

## Verification

Run `node --test tests/handoff/structure.test.mjs` for bundle integrity and contract checks. The [behavioral cases](tests/handoff/cases.json) require actual model/tool traces and artifact inspection. Structural tests do not prove routing. Native Cursor compatibility and installed slash discovery must be qualified separately before replacing an existing runtime.

## Attribution

Original work under the [MIT license](LICENSE). Upstream methodologies retain their owners and source provenance; this repository does not republish their lifecycle implementations.
