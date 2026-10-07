# Handoff inside a repository

Inside a Git repository the handoff is **status-quo-first**: before drafting, learn what the project is today, so the handoff can say what the source adds to it.

The pass is **read-only, except the one handoff file written at the end**. Leave the branch, index, stashes and remotes exactly as found, and leave every existing file as it is. Inspect with `git rev-parse`, `git status`, `git log`, `git diff`, `git show`, `git ls-files` and file reads. Tests, builds and scripts are read, and running them is the receiver's.

The pass is **bounded reconnaissance**. The source decides what is relevant, and relevance bounds the reading. A handoff about two dashboard tabs reads the shell, the routes, the neighbouring tab, the data layer and their tests, and leaves authentication and deployment closed.

1. **Baseline.** Run `git rev-parse --show-toplevel`, `git branch --show-current`, `git rev-parse HEAD`, `git status --short`, and `git log --oneline -15`. Record the repository name, the branch, the full 40-character revision, and whether the tree is clean. A clean default branch is the expected baseline. On any other branch, continue, record the branch, and say so if it changes what "today" means.
2. **Uncommitted work.** The **committed baseline** is the status quo. Local modifications are a separate **local uncommitted delta** and are never written as project truth. Where they overlap the handoff's subject, describe them in their own subsection. Where they do not, the header's dirty summary is enough. An untracked earlier intake handoff under `handoffs/` is named in the dirty summary. It is earlier evidence, read as a possible previous handoff, and it is not project truth.
3. **Project material.** Read what describes the project and bears on the source: README, AGENTS or CLAUDE instructions, manifests, and documents under whatever paths this repository uses (docs, specs, PRDs, design and technical notes). Read existing Build Flow artifacts where they exist: the directories under `specs/`, their truth documents, decisions, milestone records and stored handoffs. List `specs/*/` here, because the storage rule needs the spec ids.
4. **Relevant implementation.** Read code only for the surfaces the source touches: routing and navigation, the feature modules, data contracts, fixtures, the tests around them, and recent commits on the topic only when the source's subject needs them.

The pass is done when you can say, for the surfaces the source touches: what the project is, what is implemented, what the documentation describes, what is in progress, which constraints the repository sets, which specs and earlier handoffs exist, and which source statements are new, already true, or in conflict with it.

**Repository state is evidence, with its own status.** Code that does X shows that X is implemented today. Whether X is approved, a prototype, legacy, incomplete or wrong is the receiver's call. A document found in the repository is recorded by its apparent role ("an existing design note describes the current prototype"), and whether it is canonical is the receiver's call too.

## Relationship to the repository

Classify each material source statement against the status quo. The relationship says how a statement sits beside what exists. It is not an authority decision, and it is separate from the statement's epistemic type.

- **ALREADY EXISTS.** The repository already does it. Record the implementation under Repository status quo and the source statement as a confirmation of expected behavior. It is not new work.
- **NEW.** Absent from the repository. A requirement, decision or fact by the source's own type.
- **CLARIFICATION.** Sharpens something the repository or its documents already hold.
- **CONFLICT.** The repository does or documents X and the source says Y. State both and leave them unresolved, under Conflicts / mismatches, in an entry that opens with the label `CONFLICT`.
- **PROPOSED.** The source proposes changing something that exists. The status quo and the proposal are both recorded, and the proposal stays out of Requirements.
- **UNKNOWN.** The bounded pass could not establish it, or no source states it. Say what was not checked.

Put the label on a line where it tells the reader something the section does not: `ALREADY EXISTS` beside a source statement in Requirements, `CONFLICT` beside a threshold. Under Conflicts / mismatches the label separates a source statement that contradicts the repository from a mismatch between two sources or two documents.

A question the source leaves open stays open even when the repository seems to answer it: keep it under Open questions with the repository's evidence beside it. The source may be describing a different codebase or a future state.

Read the repository's own decisions and exclusions as closely as its code: a documented non-goal, glossary term or locked rule that the source contradicts is a conflict to record.

Where a reader could confuse what someone said with what the code happens to do, label the line: `Current implementation`, `Current documented intent`, or `New source direction`.

## The Repository status quo section

`## Repository status quo` comes directly after Executive context. Use the subsections that have content:

- **Baseline**: one line with repository, branch, short revision, and working tree clean or dirty. The header carries the full revision.
- **What exists today**: implemented capabilities on the surfaces the source touches.
- **Relevant project material**: existing documents and their apparent role.
- **Existing architecture / contracts**: the boundaries and contracts the source's subject meets.
- **Existing tests / validation**: what is covered, where it bears on the handoff.
- **Known gaps**: gaps you observed, such as a stubbed route or a missing fixture. A gap is an observation.
- **Local uncommitted delta**: overlapping local changes, described apart from the committed baseline.
- **Delta introduced by this handoff**: a short orientation listing what the source confirms, adds, clarifies, conflicts with and proposes to change, before the detailed sections.

State a repository fact here once: later sections, Source provenance and Explicitly not asserted refer back to it. Write concise facts in prose with file pointers and names: "`src/data/insightsRepository.ts` defines the fixture-backed repository interface" carries more than its 200 lines would. Code blocks hold the source's exact wording. Code read from the repository is described, and the receiver opens the file. Record what explains the status quo for this handoff and will still be true next week: paths and names, not line numbers, generated files, file trees, or versions of unrelated dependencies.
