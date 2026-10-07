# The handoff file, its header and the receipt

Step 6 of `SKILL.md` reads this. It covers where the handoff goes, the header every handoff carries, the write, the chat receipt, inline mode and chain mode.

## Where the handoff goes

Take the first rule that fits.

1. **Inline by request.** The invocation carries `--inline` or says so in words ("inline", "just print it", "don't write a file"). Write nothing. See Inline mode.
2. **An explicit path.** The user gave one ("save it to `<path>`"). Use it, as `.md`, inside a repository or outside one. If a file is already there, stop and ask. A directory the user only mentions ("we keep handoffs in `./handoffs`") is not a request to save.
3. **No repository.** There is no Git repository and no explicit path. Write nothing. See Inline mode.
4. **One matching Build Flow spec.** Exactly one spec **matches** the source, by the evidence under Matching a spec. Write into that spec's store.
5. **Intake.** Every other case: no spec exists, no spec matches, or the match is ambiguous. Write to the intake directory. The Build Flow reconciles an intake file and routes it to a spec afterwards.

A repository has one store per spec and one intake directory. Use what exists and create no second one.

### Matching a spec

A spec is a directory `specs/<id>/` that holds Build Flow material: `PRODUCT.md`, `DESIGN.md`, `TECH.md`, `EXECUTION.md`, `handoffs/`, `working/` or `execution/`. Any other directory under `specs/`, such as `specs/openapi/`, is not one.

A spec **matches** when the repository pass shows the source belongs to it. Relevance is established by evidence, and the count of specs is never evidence. Three kinds of evidence count, strongest first:

1. **The user names the spec** in the invocation.
2. **The source names the spec**, by its id, or adds to a handoff already stored in it: a `DELTA` whose previous handoff is under `specs/<id>/handoffs/`.
3. **The subject is the spec's own product area.** The source and the spec's truth documents (`PRODUCT.md`, `TECH.md`, its stored handoffs) are about the same feature, shown by concrete nouns they share: the feature name, its surfaces, entities or endpoints. No other spec fits as well.

These establish nothing: the spec is the only one in the repository, the source and the spec share the repository, or they share generic words such as "booking", "user" or "dashboard".

Then record what was established in the header and take the destination that goes with it:

| Established | `Build Flow spec:` | Destination |
| --- | --- | --- |
| Exactly one spec matches. | `<id>` | That spec's store |
| No spec exists. | `none` | Intake |
| One or more specs exist, and the source is about a different product area from each. | `none matched (unrelated: <ids>)` | Intake |
| One or more specs exist, and the evidence neither shows a match nor rules one out. | `none matched (unclear: <ids>)` | Intake |
| Two or more specs match about equally, or the source spans them. | `several (<ids>)` | Intake |

`<ids>` are spec ids separated by a comma and a space: every spec that exists after `none matched`, and the specs that match after `several`. A file in a spec's store cannot be moved out, so a doubtful match goes to intake.

### The spec store

```text
specs/<id>/handoffs/H<nnn>-<YYYY-MM-DD>-<slug>.md
```

- `<nnn>` is one more than the largest number found in three places, zero-padded to three digits:
  - file names `specs/<id>/handoffs/H<n>-*.md`, where `<n>` has three or more digits, which is the only form the Build Flow reads;
  - file names `specs/<id>/working/reconcile-H<n>.md`;
  - the `Handoffs through: H<n>` line of `specs/<id>/EXECUTION.md`.

  Look in all three with Glob and Read. A number is never reused, even when the handoff that carried it is gone.
- `<YYYY-MM-DD>` is the date part of `Created`.
- `<slug>` is the title's name: lowercase, every run of non-alphanumeric characters to one hyphen, no leading or trailing hyphen, at most 48 characters.

The store is **append-only**. An existing handoff is never overwritten, edited, renamed or deleted. Confirm with Glob that the target path does not exist before writing. If it does, take the next number.

### The intake directory

```text
handoffs/<YYYYMMDD-HHMMSS>-<slug>.md
```

at the repository root, with the UTC timestamp from `date -u +%Y%m%d-%H%M%S` and the same slug rule.

Before using `handoffs/`, look for an existing convention for incoming handoffs: a directory that already holds them, or one the README or agent instructions name. Use it if one plainly exists, with the same file name. `thoughts/shared/handoffs/` is not one. It holds session-continuity handoffs and belongs to other skills.

The Build Flow promotes an intake file into a spec. From `handoffs/` it removes the file as it stores it. From a convention directory it stores a copy and the file stays, because that directory is the repository's own. Until it is promoted the file is an untracked evidence file, not project truth.

A promoted handoff keeps its body, so its `Handoff id` stays the intake stem under its new `H<nnn>` name. A later delta that names it by its intake path is traced to the stored file through that id.

## Header

Plain `Label: value` lines directly under the title, these labels, in this order, each once. Then one blank line and the first `##` heading.

```text
# Handoff: <concise name>
Handoff. Evidence, not truth. Compiled by /handoff.
Handoff id: <H<nnn> when written into a spec, else the file stem>
Created: <UTC ISO 8601, from `date -u +%Y-%m-%dT%H:%M:%SZ`>
Repository: <name>
Branch: <branch>
Baseline: <full 40-character revision from `git rev-parse HEAD`>
Working tree: clean | dirty: <counts>; overlaps the subject: yes | no
Depth: SMALL | STANDARD | DEEP
Mode: NEW | DELTA
Previous handoff: <path> | none
Build Flow spec: <id> | none | none matched (unrelated: <ids>) | none matched (unclear: <ids>) | several (<ids>)
Sources: <count and kinds, for example 2 (1 file, 1 pasted)>
Source hashes: <path sha256 <hash>; ...> | pasted text, not hashed
Material information loss: NONE | LOW: <what> | HIGH: <what>
Ready for Build Flow: YES | NO: <the evidence still missing>
```

- **Plain lines only.** The Build Flow reads everything before the first line consisting of `---` as the header. Write no YAML frontmatter, and no `---` line anywhere before the first `##` heading.
- **Values come from command output in this run.** `Created` from `date`, `Repository` from the last path segment of `git rev-parse --show-toplevel`, `Branch` from `git branch --show-current`, `Baseline` from `git rev-parse HEAD`, `Working tree` from `git status --short`, each hash from `shasum -a 256 <path>`. Run the command again if the value is not on screen.
- **Working tree.** Counts read like `dirty: 2 modified, 1 untracked`. An untracked earlier intake handoff is named in the summary: `dirty: 1 untracked (handoffs/20261007-101500-refund-window.md, an earlier intake handoff); overlaps the subject: no`.
- **Build Flow spec** takes the value from the table under Matching a spec. `<id>` appears alone only when the file is in that spec's store.
- **Source hashes.** One entry per source file the user named. Pasted text has no file: write `pasted text, not hashed`. With both, list the files and end with `; pasted text, not hashed`.
- **Handoff id** for a handoff written to an explicit path, or printed inline, is the stem the intake name would have had.
- The header carries no hash of the file itself and no secret value.
- The verdict lives here and in the receipt. The body ends on its last section, with no closing readiness or next-step lines.

## Writing the file

Write the complete handoff once, with the Write tool, to the chosen path. Write no other file and change nothing else: branch, index, stashes and remotes stay as found. The handoff file is left untracked for the user or the Build Flow to commit.

## Receipt

After the write, the whole reply is this receipt. Its first line is `HANDOFF`, with no sentence before it, and nothing follows it except the one-line secret notice when the source held a secret:

```text
HANDOFF
`<path>`

Depth: DEEP
Baseline: <short sha>
Mode: DELTA
Material information loss: NONE

Ready for Build Flow: YES

Next:
Run the Build Flow using
`<path>`
```

- `<path>` is relative to the repository root.
- The four values and the verdict repeat the header. `Baseline` is the first seven characters of the header's revision.
- The `Next` lines appear only with `YES`. With `NO`, the verdict line carries the missing evidence and the receipt ends there.
- Outside a repository, after a write to an explicit path, `<path>` is the path as written and the `Baseline` line is left out.
- The receipt has these lines only. What the handoff says is in the file.

## Inline mode

Print the same handoff in chat, at the same depth and through the same checks, and write nothing. The reply is the handoff itself as plain Markdown: its first line is the `# Handoff:` title, with no code fence around it and no sentence before it. No receipt follows: the header carries the verdict.

- Inside a repository the header is complete.
- Outside a repository, inline or written to an explicit path, the header omits the five lines that describe one: `Repository`, `Branch`, `Baseline`, `Working tree`, `Build Flow spec`. The body has no status quo section and no note that none was found.

## Chain mode

Chain only when the invocation asks for it in words: "/handoff and run Build Flow", "handoff this into Build Flow".

1. Complete the handoff as usual: repository pass, both checks, the file, the receipt.
2. Then start the installed Build Flow as a separate stage, with the file path as its input: "Run the Build Flow using `<path>`". Invoke its skill, or read its `SKILL.md` and follow it if it runs only on the user's request. If no Build Flow is installed, say so and stop after the receipt. If the verdict is `NO`, stop after the receipt.

The Build Flow runs its own preflight, reads the persisted file, and reconciles it against the repository as it would any handoff. Having just written the file earns no shortcut: nothing from this session is carried over except the path.
