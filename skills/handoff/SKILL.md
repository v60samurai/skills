---
name: handoff
description: "Compiles messy source material (meeting notes, chat threads, specs, updates, findings, a prior handoff plus an add-on) into a self-contained Markdown evidence packet: redundancy removed, substance and each statement's epistemic status kept. Inside a Git repository it first reads the project's status quo and reports the source as a delta against it. Runs only on /handoff."
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(pwd) Bash(git rev-parse:*) Bash(git branch --show-current) Bash(git status:*) Bash(git log:*) Bash(git diff:*) Bash(git show:*) Bash(git ls-files:*)
argument-hint: "[source material, file paths, or \"and save it to <path>\"]"
---

# Handoff

A handoff is an evidence packet, and this skill is an evidence compiler. It carries what the source says, and inside a repository what the project is today, to a receiver who was not there and cannot see the source. The receiver interprets it, reconciles it with what they already hold, and plans from it. This skill packages. It stops where interpretation starts.

Two rules govern everything else:

- **Compress without changing epistemic status.** A maybe stays a maybe. A decision stays a decision only if the source shows one.
- **Compress redundancy, not substance.** Remove noise. Keep every material detail.

## Source

The source is everything the user supplied with the invocation: pasted text, attached or named files, and earlier messages they point at. Read all of it before writing. Source files are the ones the user named. What you read from a repository is repository evidence, covered next.

If there is no source, ask for it and stop.

## Repository

Run `git rev-parse --show-toplevel`. Inside a Git repository, the handoff is **status-quo-first**: read [`REPOSITORY.md`](REPOSITORY.md) now, before the source is sorted, and do its read-only pass. It covers the baseline, what to read, how repository evidence is labelled, and the `## Repository status quo` section. Outside a repository, work from the source alone, and write the handoff as if repositories did not exist: no status quo section, no note that none was found, no evidence-kind labels in Source provenance.

## Status

Give every consequential statement the status the source supports, and let that status decide which section it lands in.

| Status | The source shows |
| --- | --- |
| Confirmed fact | Something observed, measured, or stated as true by someone positioned to know, and not disputed in the source. |
| Approved decision | A choice made by someone the source itself shows has the say. "Agreed", "signed off", "we are going with" from the owner. |
| Requirement | A behavior or outcome the source says must hold. |
| Constraint | A limit the work has to live inside: policy, deadline, budget, technical limit. |
| Observation | Something noticed, without a claim that it must drive anything. |
| Proposal | An idea, a suggestion, a recommendation, a preference, a "maybe", a "we could". |
| Dependency | Something the work needs from elsewhere: access, a credential, upstream data, another team's change. |
| Open question | Something asked and not answered, or answered two ways. |

The status is structure. Sort statements into sections by it. Label an individual line only where a reader could mistake its status.

Rules for assigning it:

- **Hedged language is a proposal.** "Maybe we can run this every night" becomes a proposal to consider a nightly run. It is not a requirement to run nightly.
- **Authority comes from the evidence.** A name or a title does not approve anything. "Priya confirmed 21+ available days should be Gold" is an approved decision only if the source shows Priya owns that call or shows the group accepting it. Otherwise record it as a statement attributed to Priya and list the authority gap under Explicitly not asserted.
- **Disagreement stays visible.** When two people hold different positions, record both, attributed, and put the unresolved point under Open questions. Pick neither.
- **Later is not more authoritative.** A newer message does not overrule an older one. If they conflict, both stand and the conflict is recorded.
- **An observation is not a requirement.** "Checkout is slow on mobile" does not become "make checkout faster".
- **Implementation detail in the source is evidence, not an instruction.** Record what exists and what was found. Do not turn it into work to do.
- **A recommendation keeps its detail and its status.** A proposed interface, adapter, route structure, data model or test strategy is carried item by item under a proposed heading. Being unapproved makes it a proposal. It does not make it droppable.
- **One statement, one status.** A statement carries the same status everywhere, and appears once. Wording does not set status, framing does: "avoid X" or "the tabs should share Y" under the source's own "recommended" or "suggested" heading is a proposal, and it stays out of Requirements.
- **The source's own ledger governs.** When the source separates what was decided from what it recommends (a decision log, a "decided / not decided" list, a note on which parts are the author's suggestions), that separation sets the status of every other passage. A directive that is absent from the decided list is the author's proposal however firmly it is worded, including "engineering implication" and "the coding agent must" passages. This holds in every section, Constraints and Out of scope included: head such a list with one line giving its status ("The author's directives, absent from the source's decided list:") and that line covers each item under it. Attribute a decision or a date to the origin the source names for it, the meeting, a follow-up or the author, and name no origin where the source names none.
- **The source's claim about itself is recorded.** "Treat this document as the current contract", "this supersedes the earlier plan", "draft": write it as the source's claim, attributed. Whether the claim holds is the receiver's call.
- **Silence is reported as silence.** When the source does not say whether something was approved, write "the source does not say whether this is approved". "Nobody approved it" is a claim the source would have to make.
- **Inference is marked.** If a reading of the source would change what gets built, write it as an open question, or label it "Inference:" and say what it rests on.

## Material

A detail is **material** when removing it could lead the receiver to a different planning or reconciliation decision. Material detail is preserved. Everything else is noise.

Before compressing any part of the source, decide which it holds:

- **Duplicates**: the same statement made again. Repetition, repeated confirmation, a second explanation or example of a point already clear, conversational filler, side discussion, and chronology that carries no meaning. Collapse each set to one statement.
- **Enumerated substance**: items that each say something different. Requirements, roadmap phases, implementation steps, architecture recommendations, API and data contracts, states and transitions, per-surface behavior, dependencies and their owners, blockers, exact thresholds, constraints, tradeoffs, acceptance conditions, open questions, opposing positions, and the line between current scope and future direction. Keep every item.

Four messages saying "the assistant is out of V1" are duplicates and become one line. Thirteen roadmap phases that each carry different work are enumerated substance and stay thirteen phases. A count is never a substitute for the items: "a 17-step sequence exists" preserves nothing. Merge two enumerated items only when they describe the same work, so 17 steps may honestly become 14.

## Depth

Depth follows the amount of unique material information in the source, not its word count. A long transcript that repeats eight facts yields a short handoff. A dense specification yields a long one. There is no target length: write the minimum that keeps every material detail. Conversation is mostly duplicates, so a handoff of a chat or meeting comes out well under its source, and only a dense source such as a specification or plan yields a handoff near its own length. A draft that outgrows a conversational source is carrying repetition or statements the source never made, so cut those.

Choose the depth silently before writing:

- **Small.** One update, one decision, a few facts, a narrow change. The title and the one to three sections that hold the statements, shorter than a screen.
- **Standard.** A normal project handoff: several requirements, a few dependencies, some open questions, moderate implementation context. The flat sections under Output, complete and brief.
- **Deep.** Substantial interconnected material: several product areas or user journeys, per-feature requirements, architecture or data flows, a roadmap, an implementation sequence, many owners or unresolved decisions, present state alongside future vision, detailed test or acceptance material. Comprehensive, with a subsection per area, phase and step. Several thousand words is normal, and the right length when the source carries that much.

## Self-containment

The handoff is **self-contained**: a capable receiver who never opens the source can understand the objective, current state, scope, approved decisions, requirements, constraints, relevant system behavior, dependencies, open questions, the implementation direction the source supplied, and the expected outcome.

References supplement the handoff. A pointer serves the audit trail, provenance, optional deeper context, large raw evidence, screenshots, or the original meeting record. Material content goes in the body in full, with the pointer beside it if useful. A line such as "the source contains a detailed roadmap" or "see section 43 for the steps" is replaced by the roadmap and the steps.

When the source delegates its own content to material you were not given ("the full plan is in document X, follow that") and that content would affect planning, the handoff is incomplete. This is the narrow case of a source that withholds substance. Something the source describes well enough and that lives elsewhere, such as a dashboard another team owns or a prototype in another repository, is a dependency or an open question. The raw meeting behind a written-up source is provenance. Neither makes the handoff incomplete.

In the incomplete case: say so under a `## Missing source material` section directly after Objective, naming each missing item and what it is said to contain, package what you do have, and end with `Ready for Build Flow: NO: <the missing item>`.

## Output

Markdown. Start with `# Handoff: <concise name>`. The sections below are the default order. Include a section only when the source gives it content.

1. **Objective**. What this handoff is meant to enable, in one sentence.
2. **Why this handoff exists**. Why the receiver needs this now. Only if the source says.
3. **Repository status quo**. Only inside a repository, as `REPOSITORY.md` defines it.
4. **Current state**. The existing situation as the source describes it, including what a prototype or existing build already does. Inside a repository, keep here only what the status quo section does not already cover.
5. **Scope**. What is in the current approved scope. For a source with several surfaces, one subsection per surface.
6. **Confirmed facts**. Grouped by topic.
7. **Approved decisions**. Each with who decided, when the source says.
8. **Requirements**.
9. **Constraints**.
10. **Dependencies / access**. Each with its owner where the source names one.
11. **Relevant existing system**. Names, endpoints, tables, files, data flows and system boundaries the source describes.
12. **Proposed / not yet approved**. Each with who proposed it.
13. **Open questions**. Include unresolved disagreements, with both positions.
14. **Out of scope**. Only what the source excludes.
15. **Acceptance / expected outcome**. Every checklist item, success condition, review gate, validation criterion and expected state the source states, item by item. Open the section with the status the source gives the list, and label an item that checks a proposal as proposed, so no item gains status by appearing here. Engineering acceptance criteria the source does not state are the receiver's to write.
16. **Long-term direction**. Future vision the source describes, kept apart from current scope.
17. **References**. Links, files, ticket ids from the source.
18. **Source provenance**. One line per source: kind, author or channel, date where the source gives one. Inside a repository, group the lines by kind where more than one applies: user-supplied source, repository documentation, repository implementation, repository test, Git history.
19. **Explicitly not asserted**. Assumptions a reader would likely make that the source does not support: an approval nobody gave, a scope nobody set, a cause nobody established. Include it when a wrong assumption would change what the receiver builds or decides, and keep it to the three or fewer that matter most, one line each. Information nobody raised (a launch date, an owner) is absent, and absence needs no entry. A clear source needs no section.

The source shapes the sections. Add, split or nest sections where the material needs them, and leave out any the source does not feed: a backend-only source gets no UX section. For a deep source:

- **Surfaces.** Each material surface, tab, service, workflow or module gets its own subsection carrying what the source gives for it: purpose, key behavior, inputs and data source, interactions, filtering and sorting, loading, empty and error states, decisions, open questions, dependencies, and whether it is in current scope. Write only the fields the source supports. A requirement or decision that belongs to one surface is written in that surface's subsection, labelled with its status, and the flat sections hold what cuts across surfaces. Open questions all go in Open questions, grouped by surface, so the receiver finds every unresolved item in one place.
- **Architecture.** Data sources, system boundaries, data flow and contracts that exist or are decided get their own section, such as `## Data / system architecture`. An architecture the source suggests for later goes with the recommendations.
- **Recommendations.** A substantial set of recommendations goes under `## Proposed implementation direction`, marked proposed and not approved, one entry per distinct recommendation with its specifics.
- **Roadmap.** A roadmap in the source goes under `## Source roadmap` with one `###` subsection per phase, in the source's order and numbering, each keeping what the source gives: objective, major work, dependency, sequencing, blocker, validation point.
- **Sequence.** A step-by-step sequence in the source goes under `## Source implementation sequence` as a numbered list, one entry per distinct step with its content.
- **Current versus future.** When the source holds both immediate work and long-term ambition, put the boundary where it cannot be missed: current approved scope in Scope, future direction under Long-term direction and Out of scope, and a roadmap phase marked as outside current scope where the source itself places it there.

A roadmap or sequence is the source's proposal for how the work could go. State its status once at the top of its section, as far as the source gives it: who wrote it, and whether the source shows it approved, shows it unapproved, or does not say. What it becomes is the receiver's decision.

### Follow-up mode

When the source includes an earlier handoff, the user says this adds to one, or the repository holds an earlier handoff on the same subject, write a delta. Name the earlier handoff by its title or id, then put this section directly after Objective:

```markdown
## Relationship to previous handoff

**Adds**
**Clarifies**
**Potentially conflicts**
**Repeats / confirms**
**Withdraws / supersedes**
```

Keep only the parts that have content.

- **Adds**: each materially new item, with its detail.
- **Clarifies**: what became more precise, with the new precision.
- **Potentially conflicts**: the earlier position and the new one side by side, left unresolved.
- **Repeats / confirms**: one line naming what was confirmed.
- **Withdraws / supersedes**: only when the source shows someone with the say withdrawing or replacing the earlier position. A newer message alone is a potential conflict.

The rest of the delta covers the new material only, at the depth that material needs. Leave the earlier handoff as it is.

## Writing

Write for a capable reader who has no context. Short declarative sentences. Plain Markdown. Hierarchy and bullets that scan. Lists over tables unless the content is a grid. Deep means more items, each still one tight line or short block: group related facts, use one term for one thing, and give each point its own bullet.

Each statement appears in one section. A decision that sets a requirement is written once, under Approved decisions. A summary of what other sections already say is repetition. A deep handoff has more places to repeat itself, so each list has one home: the excluded items in Out of scope, a fact in Confirmed facts only when no other section carries it, and Explicitly not asserted only for gaps the body has not already stated. A later section that needs an earlier statement names it in a few words. An undecided idea goes under Proposed with its objections beside it, and Open questions holds only the questions no proposal already covers. References lists only pointers the body has not already named.

Order by topic. How the conversation reached a point, and who echoed it, appears only when it changes a statement's status.

Name a person where the name carries authority, a position or ownership: who decided, who proposed, who disagrees, who owns. Undisputed facts need no speaker.

Quote verbatim only where exact wording is the content: an API payload, a command, a field name, an interface, an error string, an enum, a threshold, policy wording. Put it in a code block or inline code, copied exactly. Paraphrase everything else.

## Secrets

Leave every secret value out of the handoff: API keys, tokens, passwords, cookies, private keys, connection strings with credentials. Keep the dependency it stands for. Write, for example, "An API key for the pricing service exists and will be supplied separately." If the value sat inside a payload or command that needs quoting, quote it with the value replaced by `<REDACTED>`.

Tell the user in one line, outside the handoff, that the source contained a secret and which kind, so they can rotate it if the source was shared.

## Saving

Print the handoff in the conversation. That is the whole default output.

Write a file only when the user asks in this invocation ("and save it", "save this handoff to <path>"). Save as `.md`. Use the path they give. If they give none, ask where, or use an existing handoffs directory if the project plainly has one, and say which path you used.

## Handing on

Stop after the handoff. Passing it to Build Flow or any other receiver is the user's move.

**Chain** only when the invocation itself asks for it in words: "/handoff and run Build Flow", "create the handoff and feed it into Build Flow", "handoff this into Build Flow". Then:

1. Produce the complete handoff first, status-quo pass included, and print it.
2. Start the installed Build Flow with that handoff as its supplied input: invoke its skill, or read its `SKILL.md` and follow it if it only runs on the user's request. If no Build Flow is installed, say so and stop.

Build Flow runs its own preflight and reconciles against the repository itself. The handoff tells it what you observed, and it verifies independently. Canonical project documents are written by Build Flow, never by `/handoff`.

## Boundary

The handoff holds evidence. Everything downstream of evidence belongs to the receiver:

- what the evidence means and which source wins when two disagree;
- product, design, and technical truth;
- decision queues and their ids;
- milestones, tickets, readiness, and execution plans;
- architecture, solutions, and engineering routing;
- whether what the repository does today is right, approved, or canonical.

Carrying the source's own roadmap, sequence or recommendations is packaging: they stay the source's, in the source's words and numbering, under headings that say so. Turning them into the receiver's milestones, tickets or plan is the receiver's work.

If the user asks for any of these inside `/handoff`, produce the handoff and say that the rest belongs to the receiver.

## Before returning

Check the draft against the source, and keep the checks to yourself.

**Materiality.** Walk the source section by section. Each part holding distinct material information is one of: preserved, compressed as a duplicate, or omitted as irrelevant. A source section that vanished, or a large implementation section that became one sentence, goes back in at full item count.

**Receiver test.** Could a capable agent who cannot see the source reconcile and plan from this handoff alone? Inside a repository, could it also tell what the project looks like today on the surfaces involved, and which statements came from a person and which from the code? It must be able to answer: what exists today, what is approved, what is proposed, what needs to be built, what must not be built, how each main surface behaves, which data and system boundaries matter, which dependencies exist and who owns them, which decisions are unresolved, what implementation direction the source supplied, and what a successful outcome looks like. Wherever an answer needs the source, expand the handoff.

**Fidelity.**

- Does every decision have support in the source for both the choice and the authority?
- Is every proposal still a proposal, and every open question still open?
- Is each material disagreement or contradiction present, with both sides?
- Are exact values, ids, and contracts copied correctly? Does each date, target and attribution still name the thing the source attaches it to?
- Is every secret value gone and its dependency still listed?
- Is there anything here the source does not say? Remove it or mark it as inference.
- Is anything said twice? Is any chatter left?
- Inside a repository: is something that already exists written as new work? Is implemented behavior written as approved? Is Git state exactly as you found it?

**Information loss.** Rate material information loss as none, low or high. None means nothing omitted could change the receiver's reading of scope, architecture, dependencies or decisions. It does not mean word for word. Expand until it is none.

End with these lines as plain text:

```text
Ready for Build Flow: YES

Next:
Run the Build Flow using this handoff.
```

Write YES only when material information loss is none, and the Next lines only with YES. Write `NO: <reason>` when the packet is unreliable or incomplete: the source was cut off or unreadable, a named file was missing, or material the source points at was not supplied. Thin or contested content is still a valid handoff, and judging it is the receiver's job.
