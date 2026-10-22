# Parts A to C: the execution contract, the specification and the tickets

Step 7 of `SKILL.md` reads this when the destination has `Spec: none` and the invocation does not carry `--evidence-only`. A handoff filed into a spec store is evidence only: its statements reach PStack through the spec documents, which own readiness there.

Parts A to C are what a PStack run (`/pstack:poteto-mode`) builds from. PStack reads the repository itself, picks its playbook, splits the work into PRs and writes its own verification. These parts carry what the repository cannot show: why the work exists, what must behave differently, which decisions are settled, which are still open, and the slices of work with their acceptance criteria.

Two words carry this file:

- **Derived.** Parts A to C are derived from Part D, the evidence. Every line cites what it rests on: S-ids for statements, E-ids for images. They define no S-id or E-id of their own. A line the evidence does not directly support opens with `Inferred:` and names what it rests on.
- **Candidate.** Until the user approves it, the whole of Parts A to C is a **candidate contract**, an interpretation of the evidence. It becomes the **execution contract** when the user approves it in the review step, and the header records their words.

## Steps

1. **Sort the decisions.** Go through Part D and find every statement that could change what gets built or how it behaves. Each is **approved** when it sits under Approved decisions or Decisions made in this run, or **open** when it is an open question, a proposal, a recommendation or a conflict. Each open one is a **product call** (preference, priority, policy, scope, a threshold someone has to set) or a **prototype fork** (a fact a quick run can observe: whether data is reachable, how long a step takes, which layout reads better). *Checkpoint: every open question, proposal, recommendation and conflict in Part D is sorted as open with its kind, or as having no bearing on the work.*
2. **Write Part B, the specification.** *Checkpoint: every line cites S-ids or E-ids, or opens with `Inferred:`.*
3. **Cut Part C, the tickets**, and give each its status under Readiness. *Checkpoint: every statement under Requirements, Testing / QA / proof expectations and Source acceptance / expectations in Part D is cited by a ticket, or under Scope as out of scope.*
4. **Write Part A, the contract.** *Checkpoint: every open decision from step 1 is under Open decisions, with the tickets it holds.*
5. **Review it with the user**, unless the invocation carries `--candidate`. Show in chat the ticket list (id, title, status, `Blocked by`, one line on what it delivers), the open decisions, and every `Inferred:` line. Ask whether the granularity is right, whether each ticket waits only on tickets that truly gate it, and what the answers to the open decisions are. Each answer becomes a Part D statement under `## Decisions made in this run`, quoted and attributed to the user in this invocation, and the tickets it frees are re-statused. Show the revised list until the user approves the contract in words, or leaves it unapproved. *Checkpoint: the user's approving words are on screen, or the contract stays a candidate.*

With `--candidate`, or when the user leaves the contract unapproved, the file is written with `Contract: candidate`. A candidate is still complete: every ticket carries a status, and the build waits for the user's approval.

## Part A: execution contract

Opens with the heading `# Part A: Execution contract` and this paragraph, unchanged:

```text
How to build from this file. Build only when the header reads `Contract: approved`, or when the user approves this contract in the request that starts the build. Build the READY tickets, each once the tickets in its `Blocked by` line are done. Take each BLOCKED ticket and each product call to the user, and settle each prototype fork by running something. Part D is the evidence behind every line here: read it, and its images, for any detail a ticket cites.
```

Then these sections:

- `## Objective`. Why the work exists, who it is for, and what changes for them when it ships, in two to four lines with S-ids.
- `## Scope`. One line per behavior in scope, with S-ids. Then `Out of scope:` and `Constraints:`, each a list of S-ids from Part D.
- `## Decisions`. One line per approved decision the tickets rest on: the S-id, a colon, and a few words naming it, as `- S5: a listing passes at 70% of its fields.` The decision itself stays in Part D.
- `## Open decisions`. One line per open decision: its kind, the question, the S-ids, and the tickets it holds, as `- Product call: what share of fields must pass for a listing to pass? (S14, S15) Holds: T03.` Leave the section out when nothing is open.

## Part B: specification

Opens with `# Part B: Specification`. Keep it proportional: a one-ticket change can skip it, and leave out any section with no content. Facts about what exists today, and the source's data and API contracts, stay in Part D, where Repository status quo and Data / APIs / contracts hold them. Part B holds what is derived from them:

- `## Expected behavior`. One `###` subsection per surface: what behaves differently, the interactions, and the loading, empty and error states, as the evidence gives them.
- `## Edge cases and errors`. Inputs and states the evidence names, and what should happen for each.
- `## Testing decisions`. Where each behavior can be checked from outside: the seams Repository status quo lists, preferring the highest seam that sees the behavior. What a good test checks here, which is behavior seen from outside. Prior art in the repository. A performance metric only when Part D names one.

## Part C: tickets

Opens with `# Part C: Tickets`. Each ticket is a **tracer bullet**: a narrow path through every layer it touches (data, logic, interface, tests) that can be demonstrated or checked on its own when done. A ticket fits one fresh agent session, as a guideline. Prefactoring that makes later tickets easier comes first, as its own ticket. A ticket is understandable without the others: it names its own behavior, and cites the rest.

One `###` subsection per ticket, `T01` onward in dependency order, blockers first:

```markdown
### T02: Show loading and error states
Status: READY
Blocked by: T01

What to build: the dashboard shows a state of its own while its data loads, fails or returns nothing.

Expected behavior:
- Loading shows a skeleton in the content area.
- A failure shows an error with a retry action, and retry requests the data again.

Acceptance criteria:
- [ ] The skeleton is visible while the request is pending.
- [ ] After a failure, no stale data is shown as current.
- [ ] Retry recovers without a page reload.

Proof: the dashboard page, driven through loading, failure, retry and success.
Rests on: S4, S9, S41, E2
```

- **Status** is `READY`, or `BLOCKED:` followed by the S-ids of the open decisions that hold it. A ticket is READY when every decision that could change what it does or how it is built is approved, every acceptance criterion is observable, and `Rests on` cites at least one S-id.
- **Blocked by** names only tickets whose result this one needs, or `none`. It orders the work and says nothing about decisions, which Status carries.
- **Acceptance criteria** come from Part D's requirements, acceptance and testing statements, or from the user's answers in the review. A criterion with no source opens with `Inferred:`.
- **Proof** names where the behavior is observed: a seam from Testing decisions, a screen state, an output, a number. It names no test mechanics, which the build chooses.
- **A wide refactor** is one mechanical change spread across the codebase, such as renaming a shared field, where no single ticket can land green. Sequence it as expand, migrate, contract: add the new form beside the old, move callers over in batches that each stay green, then remove the old form in a ticket blocked by every batch.
- **The ticket describes behavior.** It names no file path, PR boundary or code, because the build reads the repository itself.

## Delta handoffs

A delta restates the full current contract and tickets for the remaining work, numbered from `T01`, so it stands alone. Under Relationship to previous handoff, each earlier ticket gets one statement, cited by its full id: `- S4. H005-T02: done in the repository at <short sha>.`, or `changed, now T01`, `unchanged, now T03`, or `dropped`, with who dropped it. A ticket is dropped only on the evidence of someone with the say. Without that, the earlier ticket is carried forward.

## Approval

`Contract: approved` is written only in the run where the user approved the contract, with their words in the header. `Execution ready` summarizes the statuses: `YES` when every ticket is READY, `PARTIAL: <the READY ids>` when some are, `NO` when none are. Evidence complete and execution ready are separate: a handoff can carry all its evidence and still hold blocked tickets.
