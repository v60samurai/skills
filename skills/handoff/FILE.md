# The handoff file, its header and the receipt

Step 6 of `SKILL.md` reads this to choose the destination, and step 8 comes back for the write. It covers the target spec, where the handoff goes, the header every handoff carries, the write, the chat receipt and inline mode.

## Where the handoff goes

Take the first rule that fits.

1. **Inline by request.** The invocation carries `--inline` or says so in words ("inline", "just print it", "don't write a file"). Write nothing. See Inline mode.
2. **An explicit path.** The user gave one ("save it to `<path>`"). Use it, as `.md`, inside a repository or outside one. If a file is already there, stop and ask. A directory the user only mentions ("we keep handoffs in `./handoffs`") is not a request to save.
3. **No repository.** There is no Git repository and no explicit path. Write nothing. See Inline mode.
4. **A named spec.** The user names the spec, or the source names it or adds to a handoff in its store: the first two kinds of evidence under Matching a spec. Write into that spec's store.
5. **A spec matched by subject.** Exactly one spec matches, by its product area alone. With `--evidence-only`, or when the invocation says "for spec `<id>`", write into that spec's store. When the invocation already asks for tickets outside the spec ("as tickets", "outside the spec"), take Intake. Otherwise ask the user one question, naming the spec: file the source into spec `<id>` as evidence, which keeps the spec the one source of truth and is the recommended answer, or write tickets outside the spec. Write nothing until they answer. The spec answer writes into that spec's store. The tickets answer takes Intake, and their words become a statement under Decisions made in this run that names the spec.
6. **An unknown spec.** Two or more specs match about equally, or the evidence neither shows a match nor rules one out. Ask the user which spec the source belongs to, naming each candidate id, and write nothing until they answer. A spec they name is a match by the first kind of evidence. If they answer none, take Intake.
7. **Intake.** No spec exists, or every spec is about a different product area. Write to the intake directory with `Spec: none`.

A repository has one store per spec and one intake directory. Use what exists and create no second one.

### Matching a spec

A spec is a directory `specs/<id>/` that holds spec documents or a handoff store: `PRD.md`, `journeys.md`, `DESIGN.md`, `ERD.md` or `handoffs/`, or the older layout's `PRODUCT.md`, `TECH.md`, `EXECUTION.md`, `working/` or `execution/`. Any other directory under `specs/`, such as `specs/openapi/`, is not one.

A spec **matches** when the repository pass shows the source belongs to it. Relevance is established by evidence, and the count of specs is never evidence. Three kinds of evidence count, strongest first:

1. **The user names the spec** in the invocation ("for spec `<id>`") or in answer to the question in rule 6.
2. **The source names the spec**, by its id, or adds to a handoff already stored in it: a `DELTA` whose previous handoff is under `specs/<id>/handoffs/`.
3. **The subject is the spec's own product area.** The source and the spec's documents (its PRD, its ERD, its stored handoffs) are about the same feature, shown by concrete nouns they share: the feature name, its surfaces, entities or endpoints. No other spec fits as well.

These establish nothing: the spec is the only one in the repository, the source and the spec share the repository, or they share generic words such as "booking", "user" or "dashboard".

Then record what was established in the header and take the destination that goes with it:

| Established | `Spec:` | Destination |
| --- | --- | --- |
| Exactly one spec matches, named by the user or the source. | `<id>` | That spec's store |
| Exactly one spec matches, by its product area alone. | Ask first unless the invocation chose, then `<id>` or `none` | That spec's store, or intake |
| No spec exists. | `none` | Intake |
| Every spec is about a different product area from the source. | `none` | Intake |
| Two or more specs match about equally, or the evidence is unclear. | Ask first, then as answered | That spec's store, or intake |

A file in a spec's store cannot be moved out, so a doubtful match is asked about, never guessed.

### The spec store

```text
specs/<id>/handoffs/H<nnn>-<YYYY-MM-DD>-<slug>.md
```

- `<nnn>` is one more than the largest number found in three places, zero-padded to three digits:
  - file names `specs/<id>/handoffs/H<n>-*.md`, where `<n>` has three or more digits;
  - file names `specs/<id>/working/reconcile-H<n>.md`, left by older specs;
  - `H<n>` ids cited in the Changelog of any document in `specs/<id>/`.
  Look in all three with Glob and Grep. A number is never reused, even when the handoff that carried it is gone.
- `<YYYY-MM-DD>` is the date part of `Created`.
- `<slug>` is the title's name: lowercase, every run of non-alphanumeric characters to one hyphen, no leading or trailing hyphen, at most 48 characters.

The store is **append-only**. An existing handoff is never overwritten, edited, renamed or deleted. Confirm with Glob that the target path does not exist before writing. If it does, take the next number.

### The intake directory

```text
handoffs/<YYYYMMDD-HHMMSS>-<slug>.md
```

at the repository root, with the UTC timestamp from `date -u +%Y%m%d-%H%M%S` and the same slug rule.

Before using `handoffs/`, look for an existing convention for incoming handoffs: a directory that already holds them, or one the README or agent instructions name. Use it if one plainly exists, with the same file name. `thoughts/shared/handoffs/` is not one. It holds session-continuity handoffs and belongs to other skills.

An intake file is an untracked evidence file, not project truth. Spec writers read a spec's own `handoffs/`, so an intake file reaches a spec only when someone files it there under the spec's next `H<nnn>`.

A filed handoff keeps its body, so its `Handoff id` stays the intake stem under its new `H<nnn>` name. Its `<Handoff id>-assets/` folder moves beside it with its name unchanged, so the image links still resolve. A later delta that names it by its intake path is traced to the stored file through that id.

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
Spec: <id> | none
Sources: <count and kinds, for example 2 (1 file, 1 pasted)>
Source hashes: <path sha256 <hash>; ...> | pasted text, not hashed
Material information loss: NONE | LOW: <what> | HIGH: <what>
Evidence complete: YES | NO: <the evidence still missing>
Contract: approved <YYYY-MM-DD>: "<the user's approving words>" | candidate | none
Execution ready: YES | PARTIAL: <READY ticket ids> | NO | none
Assets: none | <n> stored | <n> stored, <m> not stored | <m> not stored
```

- **Plain lines only.** Readers take everything before the first line consisting of `---` as the header. Write no YAML frontmatter, and no `---` line anywhere before the first `##` heading.
- **Values come from command output in this run.** `Created` from `date`, `Repository` from the last path segment of `git rev-parse --show-toplevel`, `Branch` from `git branch --show-current`, `Baseline` from `git rev-parse HEAD`, `Working tree` from `git status --short`, each hash from `shasum -a 256 <path>`. Run the command again if the value is not on screen.
- **Working tree.** Counts read like `dirty: 2 modified, 1 untracked`. An untracked earlier intake handoff is named in the summary: `dirty: 1 untracked (handoffs/20261007-101500-refund-window.md, an earlier intake handoff); overlaps the subject: no`.
- **Spec** takes the value from the table under Matching a spec. `<id>` appears only when the file is in that spec's store.
- **Source hashes.** One entry per source file the user named and the run read. A named file that was not found has no hash and no entry here: Missing source material, Images and `Evidence complete` carry it. Pasted text has no file: write `pasted text, not hashed`. With both, list the files and end with `; pasted text, not hashed`.
- **Evidence complete** follows the rule under Before writing in `SKILL.md`. It describes the file and gates nothing.
- **Contract** and **Execution ready** follow Approval in `EXECUTION.md`. Both read `none` when the file is evidence only: a handoff filed into a spec, or one written with `--evidence-only`.
- **Assets** counts the Images entries in `SOURCES.md`, stored and not stored. Stored images are in `<Handoff id>-assets/` beside the file.
- **Handoff id** for a handoff written to an explicit path, or printed inline, is the stem the intake name would have had.
- Older handoffs carry `Build Flow spec:` and `Ready for Build Flow:` in the `Spec` and `Evidence complete` slots, and a reader accepts either label.
- The header carries no hash of the file itself and no secret value.
- The verdict lives here and in the receipt. The body ends on its last section, with no closing verdict or next-step lines.

## Writing the file

1. **Store the images** the source supplied, as Storing images in `SOURCES.md` describes.
2. **Check the draft.** Write it to a scratch path outside the repository, such as `/tmp/handoff-draft/<file name>`, and run the skill's own script on it, pointing `--root` at the directory the handoff will be written to: `node <skill directory>/scripts/check-handoff.mjs /tmp/handoff-draft/<file name> --root <destination directory>`. The script checks the parts and their order, the S, E and T ids, every citation, each ticket's fields, `Blocked by` cycles, the readiness header against the ticket statuses, and each stored image's path and hash. Fix every problem it prints and run it again. *Checkpoint: the script prints `ok`.*
3. **Write the handoff once**, with the Write tool, to the chosen path. Write nothing else in the repository beyond the assets folder, and change nothing else: branch, index, stashes and remotes stay as found. The handoff file and its assets folder are left untracked for the user to commit.

## Receipt

After the write, the whole reply is this receipt. Its first line is `HANDOFF`, with no sentence before it, and nothing follows it except the one-line secret notice when the source held a secret:

```text
HANDOFF
`<path>`

Depth: DEEP
Baseline: <short sha>
Mode: DELTA
Material information loss: NONE
Contract: approved
Execution ready: PARTIAL: T01, T02
Assets: 3 stored

Evidence complete: YES
```

- `<path>` is relative to the repository root.
- The values and the verdict repeat the header. `Contract` gives only its first word: `approved`, `candidate` or `none`. `Baseline` is the first seven characters of the header's revision. With `NO`, the verdict line carries the missing evidence.
- Outside a repository, after a write to an explicit path, `<path>` is the path as written and the `Baseline` line is left out.
- The receipt has these lines only. What the handoff says is in the file.

## Inline mode

Print the same handoff in chat, at the same depth and through the same checks, and write nothing in the repository. The script still checks the draft, from the scratch path, with no `--root`. The reply is the handoff itself as plain Markdown: its first line is the `# Handoff:` title, with no code fence around it and no sentence before it. No receipt follows: the header carries the verdict.

- Inside a repository the header is complete.
- Outside a repository, inline or written to an explicit path, the header omits the four lines that describe one: `Repository`, `Branch`, `Baseline`, `Working tree`. `Spec` is the spec the user names, or `none`. The body has no status quo section and no note that none was found.
