# BUILD contract

BUILD.md is temporary current build truth. Use `specs/<id>/BUILD.md` when that is the established feature root, otherwise the nearest existing equivalent. It references durable truth instead of repeating it. Retire/archive according to repository convention after the initiative lands; durable rules stay in their truth homes.

## Structure

Use plain Markdown headings, labelled fields and an index table. Status values for slices are READY, BLOCKED, IN_PROGRESS, MERGE_READY or LANDED. MERGE_READY means verified and independently reviewed with a ready PR; it does not satisfy another slice's landed prerequisite. Gate status is OPEN or RESOLVED. A gate resolution cites the actual authorized answer, not its recommended default.

```markdown
# BUILD: <initiative>
Status: <RESOLVING | READY | PARTIALLY_READY | COMPLETE>

## Mission
Goal: <outcome>
Done check: <falsifiable initiative predicate>
Proof wanted: <evidence form>
Known: <facts and references>
Constraints: <real limits>

## Canonical truth
- <path#section and what it establishes; absent documents only when existing truth suffices>
- <material handoff/evidence path>

## Human Gates
### G01: <name>
Status: OPEN
Question: <irreducible human choice>
Why human-owned: <intent/preference/authority and owner>
Recommended default: <proposal, not approval>
Alternatives: <real choices>
Evidence: <durable references>
Consequences: <what changes with each answer>
Blocked slices: <IDs>
Unblocked work: <IDs or decision-map tickets>

## Slice Index
| ID | Title | Status | Dependencies | Gate dependency |
|---|---|---|---|---|
| S01 | <one logical PR> | READY | none | none |

## S01: <title>
Status: READY
Depends on: none
Gate dependency: none
Goal: <outcome>
Done check: <pass/fail predicate>
Proof wanted: <artifacts proving the predicate>
Known: <canonical/evidence references sufficient without original chat>
Constraints: <real limits>
Observable after landing: <user/caller/maintainer can observe>
Likely surface: <orientation only, if useful>
Unit verification: <behavioral expectation, existing command when known>
Live verification: <real-path expectation, or justified not applicable>
Performance proof: <measurement expectation or not applicable with reason>
PR boundary: <one coherent change>
Out of scope: <explicit exclusions>
Readiness evidence: <truth sufficiency, no open gate, prerequisite landing proof>
```

An empty Human Gates section says `None`; do not fabricate choices. A slice blocked by missing truth says what is unresolved and points to its map ticket/evidence. Human gates hold only human-owned questions. Research tasks do not become fake human gates.

## Readiness and slicing

READY requires sufficient product/design/technical truth, a checkable done predicate, no blocking gate, and all prerequisites landed. Check actual branch/PR merge state and current baseline, not stale table status or a green CI badge. Record the observed proof or explicit unverified limitation. If forge access is missing, prove landing through available Git evidence or keep the dependent slice blocked.

Before marking READY, trace each acceptance predicate to recoverable truth. A request to validate, rank, accept or reject input is insufficient when the required fields, decision rules or observable error behavior are undefined. Resolve factual or reversible technical gaps from evidence; persist unresolved gaps and block only dependent slices. Do not turn an undefined product rule into an implementation choice or ask the human to choose a fact. Native PStack may choose algorithms and code structure within defined behavior.

Reconcile index and section statuses together. A gate blocks only named dependents, and an unlanded prerequisite blocks only its dependents. Open choices do not freeze unrelated work. Do not build a DAG engine or scheduler; document relationships and inspect Git/forge state.

Derive slices only from approved initiative scope. A diagnostic, defect observation or recommendation may require evidence capture or a resolution ticket, but does not authorize a new shipping slice. Do not add an unrelated fix to BUILD or invent dependencies merely because it could improve the same system. Missing scope authority blocks that proposed work while approved independent work remains available.

Each slice is one logically complete, reviewable software PR, preferably a vertical tracer bullet with independent proof. Order enabling and risk-removing work before dependent complexity. Use expand/migrate/contract when external consumers or production data warrant it. Avoid "all database, then all backend, then all frontend" if a useful end-to-end slice can prove more sooner.

BUILD supplies Goal, Done check, Proof wanted, Known and Constraints. It must not prescribe a PStack playbook, exact model, agent count, worker, worktree strategy, `architect`, `arena` or coding procedure. PStack owns how. Likely files orient the reader; they are not an instruction to retain a bad implementation shape.

Every shipping slice needs independent review of fidelity to the contract/truth, code quality and verification sufficiency. Trigger specialists only for relevant security, UI, API, performance, production observability, migration or semantic-eval risks. Record that expectation in Constraints or Proof wanted. Native PStack owns authoring, proof, review, accepted fixes, reverification and PR mechanics. Matt `pr` owns communication content with HumanLayer's representation vocabulary. The human merges.

## Fresh-session use

```text
/poteto-mode

Implement S01 from specs/<id>/BUILD.md.
Stop when independently reviewed, verified and merge-ready. Do not merge.
```

The receiver reads the requested contract and canonical references, checks live gates/prerequisites, derives the five mission fields and chooses native engineering methods. It stops affected work when new intent/scope/authority emerges and persists a gate/evidence for handoff. Normal technical investigation stays with PStack. No original chat or copied slice body is required.

See [worked example](build-example.md). Its paths are illustrative, not files in this skill bundle. A representative real Cursor run must qualify consumption before cutover; a Markdown schema does not prove host compatibility.
