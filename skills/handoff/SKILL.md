---
name: handoff
description: "Resolve new work before engineering: preserve new evidence, inspect existing truth, resolve factual forks, ask only human-owned choices, involve applicable domain owners, and compile a fresh-session BUILD.md. Stops before shipping code. Runs only on /handoff."
disable-model-invocation: true
argument-hint: "[new context, source paths, initiative or previous handoff]"
---

# Handoff

An open-source pre-build control plane by [Harshit Badiger](https://github.com/v60samurai), under the repository's [MIT license](../../LICENSE). Report methodology feedback through [repository issues](https://github.com/v60samurai/skills/issues).

`/handoff` captures, understands, resolves, crystallizes, compiles, then stops. The output is sufficient durable truth and a current BUILD contract, or a persistent uncertainty map when it is too early to build. Native Cursor PStack owns future engineering through `/poteto-mode`. The human chooses a slice and merges its PR.

## When to use

Use for messy context, a new feature, changed requirements, or pre-build uncertainty. A small concrete request is valid input and should need little resolution. Do not demand meeting notes for a clear request.

Do not use for session-continuity notes or as an implementation router. During engineering, normal reversible technical uncertainty stays with PStack. Return here only for newly discovered intent, scope, preference or authority that changes the build contract.

## Process

1. **Capture.** Read supplied material to its end in nontruncated chunks. Inspect project instructions, established document roots and relevant prior evidence. Preserve new material that cannot be recovered elsewhere, with provenance and epistemic status. Read [Evidence and truth](references/artifacts.md).
2. **Understand.** Inspect applicable PRODUCT, DESIGN, TECH, GLOSSARY, ADRs, BUILD, code and tests before asking. Use history when it can resolve the question. Record branch, HEAD and dirty state; preserve unrelated work. Identify what is new, settled, conflicting and genuinely unknown.
3. **Route.** Classify each material unknown as factual/technical, human intent/preference, or irreversible/external authority; record reversibility separately. Evaluate all four mandatory domain owners. Read [Routing](references/routing.md) now. Load only matched skills and references, through [Source and invocation discipline](references/sources.md).
4. **Resolve.** Investigate and run the smallest safe experiment for facts. Make supported reversible technical decisions. Ask only irreducible human questions, with evidence and a recommendation. Use [Fog and decision interfaces](references/decisions.md) when dependent uncertainty spans sessions or connected human choices need a concrete page. Do not answer for the human.
5. **Crystallize.** Persist accepted product/experience truth and evidenced technical decisions in their existing canonical homes. Update only changed truth. Cite the new evidence. Conflicting proposals remain proposals until resolved by the owner; chronology, silence and a reviewer verdict grant no approval.
6. **Compile.** When sufficient truth exists, read [BUILD contract](references/build.md) and compile PR-sized slices. Reconcile prerequisites with actual Git/forge evidence before marking READY. An open gate blocks only dependent slices. If BUILD would encode guesses, continue the decision map instead. Never overwrite another initiative's active BUILD.
7. **Verify and stop.** Re-read this skill and the references used. Apply [Qualification and receipt](references/qualification.md). Report paths, READY/BLOCKED work, human gates and verification limits. Stop before application implementation, push, PR creation, deploy or merge. Do not start `/poteto-mode` for the human.

Research and throwaway prototypes are allowed. Keep prototype code isolated from shipping application paths. Do not implement a scheduler, dependency engine, worker lifecycle or engineering framework.

## Common rationalizations

| Excuse | Required response |
|---|---|
| "Unknown means ask the human." | First check whether inspection or an experiment can answer it. |
| "I can brainstorm or design myself." | When a mandatory owner's trigger matches, load and use that owner. |
| "The upstream skill is user-only, so I skipped it." | Use the documented read-by-path composition or report a real capability blocker. |
| "Everything is blocked by this choice." | Name the affected slices. Keep independent work ready. |
| "A pointer preserves a disappearing thread." | Persist its material content before the source disappears. |
| "A giant handoff is safer." | Keep new material; cite recoverable truth and prior evidence. |
| "The BUILD format proves the workflow works." | Structural checks and model/runtime evidence are different claims. |

## Red flags

Questions answered by repository evidence; a skipped matched owner; generic ideation replacing brainstorm-stack; blind Jev adoption; rewritten old evidence; product rules hidden in BUILD; a parallel Decision Queue; prescribed models/playbooks; READY with unlanded prerequisites; an original-chat dependency; shipping code changed during handoff.
