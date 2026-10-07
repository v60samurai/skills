---
name: handoff
description: "Compiles messy source material (meeting notes, threads, specs, updates, findings, an earlier handoff plus an add-on) and the repository's status quo into one self-contained Markdown evidence file for the Build Flow, and returns a short receipt. Material detail and each statement's epistemic status are kept. `--inline` prints it and writes nothing. \"/handoff and run Build Flow\" chains. Runs only on /handoff."
disable-model-invocation: true
allowed-tools: Read Grep Glob Write Bash(pwd) Bash(date:*) Bash(shasum:*) Bash(git rev-parse:*) Bash(git branch --show-current) Bash(git status:*) Bash(git log:*) Bash(git diff:*) Bash(git show:*) Bash(git ls-files:*)
argument-hint: "[--inline] [source material or file paths] [\"save it to <path>\"] [\"and run Build Flow\"]"
---

# Handoff

`/handoff` is an **evidence compiler**. It turns raw human context, the repository's status quo, existing documents and relevant implementation evidence into one persistent, self-contained Markdown evidence file. A receiver who was never in the conversation and cannot open the source reconciles and plans from that file and the repository alone.

```text
MESSY CONTEXT -> /handoff -> SELF-CONTAINED EVIDENCE FILE -> Build Flow -> CANONICAL TRUTH / READY -> PStack
```

- `/handoff` owns what was said, what exists, what was observed and what was proposed.
- The Build Flow owns what is authoritative and executable.
- PStack owns how ready work gets engineered.

A handoff is not a summary, not canonical truth and not a plan. Two rules govern everything else:

- **Compress without changing epistemic status.** A maybe stays a maybe. A decision stays a decision only if the source shows one.
- **Compress repetition, preserve substance.** Remove noise. Keep every material detail.

The whole skill serves one sentence: make the handoff rich enough that the Build Flow needs no original context, and never so opinionated that the Build Flow has nothing left to reconcile.

## When not to use it

- **Session continuity.** Saving your own progress before a clear or a context reset is a session handoff or a ledger. Those live under `thoughts/` and belong to other skills.
- **A bug report.** A failure to reproduce and fix goes to diagnosis.
- **An instruction with no evidence.** "Add a CSV export" carries nothing to compile. Say so and ask for the material behind it.

If there is no source at all, ask for it and stop.

## Process

Work through the steps in order. Each ends on a checkpoint, and the next step starts only when the checkpoint holds.

1. **Read the source.** The source is everything the user supplied with the invocation: pasted text, attached or named files, and earlier messages they point at. *Checkpoint: every supplied item has been read to its end.*
2. **Run the repository pass.** Run `git rev-parse --show-toplevel`. Inside a Git repository, read [`REPOSITORY.md`](REPOSITORY.md) now and do its pass before sorting the source. Outside a repository, work from the source alone and write as if repositories did not exist: no status quo section, no note that none was found or that code went unchecked, no source authority classes. *Checkpoint: the done condition in `REPOSITORY.md` holds, or there is no repository.*
3. **Classify.** List the source's material items (see Material). Give each its epistemic type (see Classification) and, inside a repository, its relationship to the repository. Choose the depth and the mode, `NEW` or `DELTA`. *Checkpoint: every material item has a type and a destination section, and for a DEEP source the inventory exists as a list you can count.*
4. **Draft** the handoff from the inventory, using Sections and Writing. *Checkpoint: every inventory item is in the draft.*
5. **Run the two checks**, the loss comparison and the repetition pass under Before writing. *Checkpoint: Check A and Check B both pass, no red flag is left, no statement appears twice, and the loss rating is settled.*
6. **Write the file.** Read [`FILE.md`](FILE.md) and follow it for the path, the header and the write. With `--inline`, or outside a repository with no path given, print the handoff in chat instead, as `FILE.md` describes. *Checkpoint: exactly one new file exists at a path that did not exist before, or nothing was written.*
7. **Return the receipt** from `FILE.md` and stop. The reply opens on the line `HANDOFF`. In chain mode, start the Build Flow afterwards as `FILE.md` describes. *Checkpoint: the first line of chat is `HANDOFF`, and chat holds the receipt and nothing else.*

## Classification

Two classifications run side by side and stay separate. Neither is an authority decision: both describe evidence, and the Build Flow decides what the evidence means.

### Epistemic type

Give every consequential statement the type the source supports.

| Type | The source shows | Lands in |
| --- | --- | --- |
| CONFIRMED FACT | Something observed, measured, or stated as true by someone positioned to know, and not disputed. | Confirmed facts |
| APPROVED DECISION | A choice made by someone the source itself shows has the say: "agreed", "signed off", "we are going with" from the owner. | Approved decisions |
| REQUIREMENT | A behavior or outcome the source says must hold. | Requirements, or its surface |
| CONSTRAINT | A limit the work lives inside: policy, deadline, budget, data, technical limit. | Constraints |
| OBSERVATION | Something noticed, with no claim that it must drive anything. | Confirmed facts or its surface, worded as noticed |
| IMPLEMENTATION EVIDENCE | What exists or was found in code, data, an API response or a running system. | Repository status quo, Architecture / implementation evidence, Data / APIs / contracts |
| TEST/QA EXPECTATION | A check, case, sample or proof the source expects, and any statement of how the checking is done: who runs it, where, in what order, what gets recorded. "Every step is done by a person on staging and written down" is this type, not a REQUIREMENT. | Testing / QA / proof expectations |
| PROPOSAL | An idea, a suggestion, a preference, a "maybe", a "we could". | Proposed / not yet approved |
| RECOMMENDATION | A proposal its author argues for, often with a design attached. | Proposed / not yet approved, or labelled inside Architecture / implementation evidence |
| DEPENDENCY | Something the work needs from elsewhere: access, a credential, upstream data, another team's change. | Dependencies / owners |
| BLOCKER | A dependency or fact the source says stops the work now. | Dependencies / owners, labelled |
| OPEN QUESTION | Something asked and not answered, or answered two ways. | Open questions |
| FUTURE IDEA | Direction the source places after the current scope. | Future / non-V1 direction |

**The type is structure.** Sort statements into sections by it, and label an individual line only where a reader could mistake its type: a recommendation inside an evidence section, a blocker among dependencies, an acceptance item that checks a proposal.

Rules for assigning it:

- **Hedged language is a proposal.** "Maybe we can run this every night" is a proposal to consider a nightly run. It is not a requirement to run nightly.
- **Authority comes from the evidence.** A name or a title approves nothing. "Priya confirmed 21+ available days should be Gold" is an approved decision only if the source shows Priya owns that call or shows the group accepting it. Otherwise it is a statement attributed to Priya, with the authority gap under Explicitly not asserted. "Harshit said earlier" is the same case.
- **Disagreement stays visible.** When two people hold different positions, record both, attributed, and put the unresolved point under Open questions. Pick neither.
- **Later is not more authoritative.** A newer message does not overrule an older one. Both stand, and the conflict is recorded under Conflicts / mismatches.
- **An observation is not a requirement.** "Checkout is slow on mobile" does not become "make checkout faster".
- **Implementation is evidence of the status quo.** Code that does X shows X is implemented. It does not show X is the requirement.
- **A proposal owns its consequences.** A limit, cost, lead time, contract or dependency that applies only if a proposal is adopted is part of that proposal. Write it with the proposal, under Proposed / not yet approved or a proposed heading, and keep it out of Requirements and Constraints.
- **A recommendation keeps its detail and its type.** A proposed interface, adapter, route structure, data model or test strategy is carried item by item under a proposed heading. Being unapproved makes it a proposal. It does not make it droppable.
- **One statement, one type.** A statement carries the same type everywhere, and appears once. Framing sets the type, not wording: "avoid X" under the source's own "suggested" heading is a proposal and stays out of Requirements.
- **The source's own ledger demotes.** When the source separates what was decided from what it recommends (a decision log, a "decided / not decided" list), a directive absent from the decided list is the author's proposal however firmly it is worded, in every section. An item on the decided list still needs the authority evidence above: where the source shows who decided and that they hold the say, it is an approved decision, and otherwise it is written as "the source lists this as decided", with the authority gap under Explicitly not asserted. Head such a list with one line giving its status and that line covers each item under it. Attribute a decision or a date to the origin the source names, and name no origin where the source names none.
- **The source's claim about itself is recorded.** "Treat this document as the current contract", "this supersedes the earlier plan", "draft": write it as the source's claim, attributed. Whether it holds is the receiver's call.
- **Silence is reported as silence.** Write "the source does not say whether this is approved". "Nobody approved it" is a claim the source would have to make.
- **Inference is marked.** A reading that would change what gets built is written as an open question, or labelled "Inference:" with what it rests on.
- **An open question stays open.** Completeness means every material uncertainty is represented, not removed. "Should duplicate rows be rejected or deduplicated?" stays a question unless a source approved an answer.

### Relationship to the repository

Inside a repository, each material statement also has one of six relationships to the status quo: ALREADY EXISTS, NEW, CLARIFICATION, CONFLICT, PROPOSED, UNKNOWN. `REPOSITORY.md` defines them and says where each is written. Use the label on a line where it adds information the section does not already give.

### Source authority

Every source belongs to a class, recorded in Source provenance: USER / HUMAN SOURCE, APPROVED STAKEHOLDER SOURCE, REPO DOCUMENTATION, CURRENT IMPLEMENTATION, TEST, API RESPONSE, DATA, GIT HISTORY, EXTERNAL REFERENCE. APPROVED STAKEHOLDER SOURCE applies only when the source shows that person holds the say. The class tells the receiver where a claim came from and what authority it had. When sources conflict, both are preserved and left unresolved. If the user states in this invocation which side holds, record that beside the conflict as the user's statement, attributed to them and to this invocation, with both sides still listed. Whether it settles the conflict is the Build Flow's call.

## Material

A detail is **material** when losing it could change product scope, design, technical architecture, implementation approach, acceptance, testing, dependencies, sequencing, authority, risk, or an unresolved decision. Material detail is preserved. Everything else is noise.

Before compressing any part of the source, decide which it holds:

- **Duplicates**: the same statement made again. Repetition, repeated confirmation, a second example of a point already clear, filler, side discussion, and chronology that carries no meaning. Collapse each set to one statement.
- **Enumerated substance**: items that each say something different. Requirements, roadmap phases, implementation steps, architecture recommendations, API and data contracts, states and transitions, per-surface behavior, dependencies and owners, blockers, exact thresholds, constraints, tradeoffs, acceptance conditions, test expectations, open questions, opposing positions, and the line between current scope and future direction. Keep every item.

Four messages saying "the assistant is out of V1" are duplicates and become one line. Thirteen roadmap phases that each carry different work stay thirteen phases. A count never stands in for the items: "a 17-step sequence exists" preserves nothing. Merge two enumerated items only when they describe the same work.

Four kinds of material have their own rule:

- **Implementation detail.** Detail the source or the repository supplies is kept and labelled as evidence: "availability is checked through endpoint X", "the backend stores 22:02 for opening and closing", "the CSV flow is upload, validate, enqueue, process", "the source recommends replacing the current crawler with Crawl4AI". File edits, ticket decomposition, a dependency graph, test mechanics and worker or worktree choices appear only when the source itself supplied them, labelled `SOURCE RECOMMENDATION` or `EXISTING PLAN`.
- **Testing and QA.** Every expectation the source supplies goes under `## Testing / QA / proof expectations` in the source's terms, each item whole where it stands, with its exact strings, values and thresholds even when another section states them: manual QA, test cases, sample data, contract checks, live endpoint checks, browser checks, performance and security checks, acceptance examples, known regressions. "Run first against 15 to 20 products" and "classify each mismatch into five failure buckets" are kept as stated. The section is evidence. Converting it into unit, integration or browser tests is the Build Flow's work, and the mechanics are PStack's.
- **Acceptance.** Explicit acceptance conditions are kept exact in meaning under `## Source acceptance / expectations`, item by item, opened by the status the source gives the list. An item that checks a proposal is labelled proposed. Which ones become canonical acceptance is the Build Flow's decision.
- **Roadmap and sequence.** A source with 13 phases and 17 steps yields 13 phase subsections and 17 numbered steps, in the source's order and numbering, under the source's own names. "Roadmap: build tab by tab" is a collapse. State the roadmap's status once at the top of its section: who wrote it, and whether the source shows it approved, shows it unapproved, or does not say.

## Depth

Depth follows the amount of unique consequential information in the source, not its word count. A long transcript that repeats eight facts yields a short handoff. A dense specification yields a long one. There is no target length: write the minimum that keeps every material detail. Conversation is mostly duplicates, so the sections drawn from a chat or meeting come out well under it, and only a dense source such as a specification or plan yields sections near its own length. The header, Repository status quo and Source provenance come on top and are not measured against the source. When the source-drawn sections outgrow a conversational source, check them for repetition and for statements the source never made.

- **SMALL.** One update, one decision, a few facts, a narrow delta. The header and the one to three sections that hold the source's statements, shorter than a screen. Outside a repository the header's `Sources` line is its provenance. Inside one, Executive context, Repository status quo and Source provenance come on top, each a few lines.
- **STANDARD.** A meaningful feature or update: several related requirements, a few decisions and dependencies, some open questions, moderate repository impact. The flat sections the source feeds, complete and brief.
- **DEEP.** Substantial interconnected material: several systems, surfaces or data sources, many requirements, a roadmap, an implementation sequence, significant QA detail, several stakeholders, conflicting evidence, architecture decisions, future phases. A subsection per area, phase and step. Several thousand words is normal, and right when the source carries that much.

The depth is recorded in the header and the receipt.

## Self-containment

The handoff passes this test: the session that wrote it closes, a fresh session opens in the same repository with only the file path, and the Build Flow never has to ask for the original chat, notes, thread or document.

References supplement the handoff. A pointer serves the audit trail, provenance, screenshots, or the original record. Material content goes in the body in full, with the pointer beside it if useful. Large raw evidence such as a log, an export or a dataset gets a pointer only after its material values are in the body: the counts, thresholds, failing rows and exact strings a receiver would plan from. "The source contains a detailed roadmap" or "see the meeting notes for implementation details" is replaced by the roadmap and the details.

When the source delegates its own content to material you were not given ("the full plan is in document X, follow that") and that content would affect planning, the handoff is incomplete. Name each missing item and what it is said to contain under `## Missing source material` directly after Objective, package what you do have, and set `Ready for Build Flow: NO: <the missing item>`. Something the source describes well enough and that lives elsewhere, such as a dashboard another team owns, is a dependency or an open question and does not make the handoff incomplete.

## Sections

The title is `# Handoff: <concise name>`, followed by the header from `FILE.md`. The sections below are the vocabulary, in default order, with these exact headings. Sections are dynamic: include one only when the source gives it content, and add, split or nest where the material needs it.

1. `## Executive context`. Why this handoff exists, what changed, what the receiver needs to understand first, in a few lines that the later sections do not repeat. For a DEEP source, and for any handoff inside a repository.
2. `## Repository status quo`. Inside a repository only, as `REPOSITORY.md` defines it.
3. `## Objective`. The problem or outcome the source is after, in the source's framing. `## Missing source material` and `## Relationship to previous handoff` follow it when they apply.
4. `## Confirmed facts`. Grouped by topic. A fact appears here only when no other section carries it.
5. `## Approved decisions`. Decisions only, each with who decided, and when if the source says. A point the source leaves undecided is written under Open questions and nowhere in this section.
6. `## Requirements`. Functional and non-functional.
7. `## Constraints`. Technical, product, data, operational, legal, timing.
8. `## Product / UX surfaces`. One subsection per material surface, tab, service or workflow, carrying what the source gives for it: purpose, behavior, inputs and data source, interactions, loading, empty and error states, and whether it is in current scope. A requirement or decision that belongs to one surface is written in that surface's subsection, labelled with its type, and the flat sections hold what cuts across surfaces.
9. `## Data / APIs / contracts`. Endpoints, schemas, sources of truth, field mappings, error behavior, auth and access, refresh and latency, ids, integration limits. Exact where the source is exact.
10. `## Architecture / implementation evidence`. What exists now, known architecture, known technical limits, and implementation recommendations the source supplies. A substantial set of recommendations goes under one subsection headed `### Proposed implementation direction`, opened by a line giving its author and that it is not approved, with one entry per recommendation and its specifics. A lone recommendation is labelled on its line.
11. `## Proposed / not yet approved`. Each with who proposed it and any objection beside it.
12. `## Testing / QA / proof expectations`.
13. `## Source acceptance / expectations`.
14. `## Dependencies / owners`. People, access, APIs, datasets, external teams, approvals. Blockers are labelled.
15. `## Source roadmap`. One `###` subsection per phase.
16. `## Source implementation sequence`. A numbered list, one entry per step.
17. `## Conflicts / mismatches`. Source against source, source against repository, documents against code. Both sides, attributed, unresolved.
18. `## Open questions`. Every unresolved item in one place, grouped by surface for a deep source.
19. `## Out of scope`. Only what the source excludes.
20. `## Future / non-V1 direction`. Kept apart from current scope.
21. `## Source provenance`. One line per source: authority class, name, type, date, path or link, hash where one exists, and what the source contributed. Inside a repository, or with more than one source.
22. `## Explicitly not asserted`. Assumptions a reader would likely make that the source does not support: an approval nobody gave, a scope nobody set, a cause nobody established. Include it when a wrong assumption would change what the receiver builds or decides, with at most the three that matter most, one line each, and only gaps the body has not already stated. Information nobody raised (a launch date, an owner) is absent, and absence needs no entry. A clear source needs no section.

## Delta handoffs

The mode is `DELTA` when the source includes an earlier handoff, the user says this adds to one, or the repository holds an earlier handoff on the same subject. Find the most relevant one among `specs/*/handoffs/` and the intake directory, read it, and record its path in the header. Put this section directly after Objective and keep only the parts that have content:

```markdown
## Relationship to previous handoff

**Unchanged**
**Changed**
**Clarified**
**Conflicts**
**Newly proposed**
**Now approved**
**Still unresolved**
```

- **Unchanged**: one line naming what still stands or was confirmed.
- **Changed**: each materially new or altered item, with its detail.
- **Clarified**: what became more precise, with the new precision.
- **Conflicts**: the earlier position and the new one side by side, left unresolved.
- **Newly proposed**: each new proposal, with who proposed it.
- **Now approved**: only when the source shows someone with the say approving, withdrawing or replacing the earlier position. Chronology is not authority, so a newer message alone is a conflict.
- **Still unresolved**: the earlier open questions and conflicts the new source leaves open.

The new file is still self-contained: restate from the earlier handoff what the receiver needs to read this one alone, and no more. The earlier file is never edited, renamed or deleted. A delta is a new file beside it.

## Writing

Write for a capable reader who has no context. Short declarative sentences, plain Markdown, bullets that scan, lists over tables unless the content is a grid. Deep means more items, each still one tight line or short block.

Each statement appears in one section. A decision that sets a requirement is written once, under Approved decisions. A summary of what other sections already say is repetition. Each list has one home: the excluded items in Out of scope, a challenge to a decision under Proposed / not yet approved or Conflicts / mismatches and not beside the decision, an undecided idea under Proposed with its objections beside it, and a question the source asks under Open questions with the positions people hold on it beside it. A later section that needs an earlier statement names it in a few words. Order by topic: how the conversation reached a point appears only when it changes a statement's type.

Name a person where the name carries authority, a position or ownership. Undisputed facts need no speaker. Quote verbatim only where exact wording is the content: a payload, a command, a field name, an error string, an enum, a threshold, policy wording. Copy it exactly into a code block or inline code. Paraphrase everything else.

## Secrets

Leave every secret value out of the handoff: API keys, tokens, passwords, cookies, private keys, connection strings with credentials. Keep what it stands for as `SECRET PROVIDED`, with its purpose and its owner or location when that is safe to state. Inside a quoted payload or command, replace the value with `<REDACTED>`.

Tell the user in one line of chat, beside the receipt, that the source contained a secret and which kind, so they can rotate it.

## Boundary

These belong to the receiver, and appear in a handoff only when quoted from the source or labelled `SOURCE RECOMMENDATION` or `EXISTING PLAN`:

- creating `PRODUCT.md`, `DESIGN.md`, `TECH.md` or `EXECUTION.md`;
- the ids `D<n>`, `DQ<n>`, `M<n>` and `M<n>-T<k>`, and `READY`, `BLOCKED` or `DONE` as states;
- an execution DAG, a ready frontier, an Engineering Objective;
- a PStack playbook, a model, a worker or a worktree choice;
- a test plan or file edits the source did not supply;
- which source wins, and whether what the repository does today is right.

Carrying the source's own roadmap, sequence or recommendations is packaging: they stay the source's, in its words and numbering, under headings that say so. If the user asks for any of the above inside `/handoff`, produce the handoff alone. The rest is the Build Flow's, and the receipt already names it as the next step.

## Before writing

Run both checks on the draft. The handoff passes only when both pass.

**Check A: receiving-agent sufficiency.** "If the receiving Build Flow session had only this handoff and the repository, what material thing would it still have to recover from the original source?" Walk the receiver's questions: the status quo, what already exists, what changed, the objective, requirements, approved decisions, constraints, surfaces, technical and data detail, testing and QA expectations, dependencies, owners, blockers, proposals, conflicts, open questions, future and out-of-scope boundaries, provenance. Wherever an answer needs the source, expand the handoff.

**Check B: authority overreach.** "Did I decide anything the Build Flow should reconcile?" Look for a proposal turned into a decision, a conflict silently resolved, a source roadmap renamed into milestones, an implementation suggestion turned into a requirement, a test the source never stated, readiness implied, an engineering route selected. Downgrade each back to evidence.

**Material information loss.** For a DEEP source, compare the draft against the step 3 inventory item by item. Allowed loss is duplicate wording, repetition and filler. A missing requirement, decision, constraint, roadmap phase, testing expectation, dependency, open question, technical contract, implementation recommendation or future boundary goes back in. For SMALL and STANDARD, walk the source section by section the same way. Rate the result `NONE`, `LOW: <what>` or `HIGH: <what>` and expand until it is `NONE`. `LOW` and `HIGH` remain only for loss you cannot repair, such as a source that was cut off or withheld.

**Repetition.** Read the draft for any statement that appears in two sections: a threshold restated under Data / APIs / contracts after its decision, an owner listed again under Dependencies / owners, a gap restated under Explicitly not asserted. Keep it in the section its type names and delete the other. A testing or acceptance item is the exception and stays whole.

**Readiness.** `Ready for Build Flow: YES` means the evidence file is self-contained enough for the Build Flow to start. It says nothing about engineering readiness. Write `YES` only when material information loss is `NONE`. Write `NO: <the evidence still missing>` when the source was cut off or unreadable, a named file was missing, or material the source points at was not supplied. Thin or contested content is still a valid handoff.

### Red flags

Any of these in the draft fails it, unless the words are quoted from the source or labelled as source material:

- "see source for details", or any pointer standing where content should be;
- "probably", "we should", "therefore the implementation will";
- "M1-T", "READY ticket", "use Grok", "use Feature playbook";
- a roadmap collapsed, testing detail omitted, repository status omitted, relevant dirty state omitted;
- a conflict resolved or a proposal promoted without evidence of authority;
- a header value that did not come from a command run in this invocation.

### Common rationalizations

| Rationalization | Rebuttal |
| --- | --- |
| "The original document is linked, so I can summarize aggressively." | The Build Flow must not need the original for material context. |
| "The later source probably supersedes the older one." | Chronology alone is not authority. Record the conflict. |
| "The code already behaves this way, so it must be the requirement." | Implementation is evidence, not product authority. |
| "This implementation approach is obviously best." | Preserve it as a recommendation unless the source shows it approved. |
| "Build Flow will figure out the testing details later." | Preserve every testing and QA expectation the source supplies. |
| "To make this useful, I should create tickets." | Tickets and readiness belong to the Build Flow. |
| "The receipt should tell the user what is in the file." | The receipt is the fixed lines in `FILE.md`. The content is in the file. |
| "Nobody watches the file being written, so a shorter one will do." | Depth follows the source's material. The reader of the file has nothing else. |
| "The source is self-explanatory, so the repository pass can be skipped." | Without the pass, existing behavior gets written as new work and conflicts go unseen. |
| "Two specs exist and this one fits better." | A better fit is a choice, and choosing a spec is the Build Flow's call. Unless the user names the spec or the source itself is about that one spec, write to intake and record `several (<ids>)`. |
| "I remember the branch and revision from earlier." | Header values come from command output in this run. |
| "The earlier handoff is slightly wrong, so I will fix it in place." | The store is append-only. Write a delta beside it. |

## Exit criteria

The run is finished when all of these hold:

- Every supplied source was read in full, and inside a repository the pass reached its done condition.
- Check A and Check B pass, and no red flag remains.
- Material information loss is `NONE`, or the header states what was lost and readiness is `NO`.
- Every secret value is absent and what it stood for is still listed.
- By default inside a repository: exactly one new file exists, at a path that did not exist before, no other file changed, and branch, index, stashes and remotes are as found. With `--inline`, or outside a repository with no path given: nothing was written.
- Chat holds the receipt, or the inline handoff, plus at most the one-line secret notice.
