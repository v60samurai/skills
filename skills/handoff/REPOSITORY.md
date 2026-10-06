# Handoff inside a repository

Inside a Git repository the handoff is **status-quo-first**: before drafting, learn what the project is today, so the handoff can say what the source adds to it.

The pass is **read-only**. Leave the branch, index, working tree, stashes and remotes exactly as found. Inspect with `git rev-parse`, `git status`, `git log`, `git diff`, `git show`, and file reads. Tests, builds and scripts are read, and running them is the receiver's.

1. **Baseline.** Run `git rev-parse --show-toplevel`, `git branch --show-current`, `git rev-parse --short HEAD`, `git status --short`, and `git log --oneline -15`. Record the repository name, branch, revision, and whether the tree is clean. A clean default branch is the expected baseline. On any other branch, continue, record the branch, and say so if it changes what "today" means.
2. **Uncommitted work.** The committed baseline is the status quo. Local modifications are a separate **local uncommitted delta**: where they overlap the handoff's subject, describe them in their own subsection, and where they do not, one line noting the tree is dirty is enough.
3. **Project material.** Read what describes the project and bears on the source: README, AGENTS or CLAUDE instructions, manifests, and documents under whatever paths this repository uses (docs, specs, PRDs, design and technical notes, earlier handoffs, Build Flow state such as PRODUCT, DESIGN, TECH, EXECUTION, decisions and milestones).
4. **Relevant implementation.** Read code only for the surfaces the source touches: routing and navigation, the feature modules, data contracts, fixtures, the tests around them, and recent commits on the topic. Relevance bounds the reading: a handoff about two dashboard tabs reads the shell, the routes, the neighbouring tab, the data layer and their tests, and leaves authentication and deployment closed.

The pass is done when you can say, for the surfaces the source touches: what the project is, what is implemented, what the documentation describes, what is in progress, which constraints the repository sets, and which source statements are new, already true, or in conflict with it.

**Repository state is evidence, with its own status.** Code that does X shows that X is implemented today. Whether X is approved, a prototype, legacy, incomplete or wrong is the receiver's call. A document found in the repository is recorded by its apparent role ("an existing design handoff describes the current prototype"), and whether it is canonical is the receiver's call too.

**Classify each material source statement against the repository:**

- **Already exists.** The repository already does it. Record the implementation under Repository status quo and the source statement as a confirmation of expected behavior. It is not a new requirement.
- **New.** Absent from the repository. A requirement, decision or fact by the source's own status.
- **Clarification.** Sharpens something the repository or its documents already hold.
- **Status-quo mismatch.** The repository does or documents X and the source says Y. State both and leave them unresolved.
- **Proposed change.** The source proposes changing something that exists.
- **Unknown.** The bounded pass could not establish it. Say what was not checked.

A question the source leaves open stays open even when the repository seems to answer it: keep it under Open questions with the repository's evidence beside it. The source may be describing a different codebase or a future state. Mismatches and unknowns are written once, under Delta introduced by this handoff. Open questions ends with a single line naming them, so the receiver finds everything unsettled from that section without a second copy.

Read the repository's own decisions and exclusions as closely as its code: a documented non-goal, glossary term or locked rule that the source contradicts is a mismatch to record.

Where a reader could confuse what someone said with what the code happens to do, label the line: `Current implementation`, `Current documented intent`, or `New source direction`.

## The Repository status quo section

`## Repository status quo` comes directly after Objective and Why this handoff exists. Use the subsections that have content:

- **Baseline**: repository, branch, revision, working tree clean or dirty.
- **What exists today**: implemented capabilities on the surfaces the source touches.
- **Relevant project material**: existing documents and their apparent role.
- **Existing architecture / contracts**: the boundaries and contracts the source's subject meets.
- **Existing tests / validation**: what is covered, where it bears on the handoff.
- **Known gaps**: gaps you observed, such as a stubbed route or a missing fixture. A gap is an observation.
- **Local uncommitted delta**: overlapping local changes, described apart from the committed baseline.
- **Delta introduced by this handoff**: a short orientation listing what the source confirms, adds, clarifies, mismatches and proposes to change, before the detailed sections.

State a repository fact here once: later sections, Source provenance and Explicitly not asserted refer back to it. Write concise facts with file pointers: "`src/data/insightsRepository.ts` defines the fixture-backed repository interface" carries more than its 200 lines would. Record what explains the status quo for this handoff and will still be true next week: paths and names, not line numbers, generated files, file trees, or versions of unrelated dependencies.
