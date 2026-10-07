# Evidence and truth

## Capture the delta

Material information can change scope, behavior, design, architecture, acceptance, proof, dependency, authority, risk or sequencing. Preserve every new material item, including enumerated rules, exact thresholds, API contracts, disagreements and unapproved recommendations. Remove only duplication and irrelevant chatter. There is no arbitrary word or item cap.

Durable, accessible source code, tests, truth documents and prior handoffs get precise references. Ephemeral meeting notes, pasted requirements, API responses and chat decisions need their material substance persisted. A pointer alone is insufficient when the next session cannot access the source. For large datasets/logs, retain the durable raw artifact plus material values and interpretation, not a second copy of the whole log.

Use the project's existing evidence store. With no convention, use `handoffs/` in the repository or the explicitly selected workspace. Match a feature by its subject or an explicit user reference, never by it being the only feature directory. Ambiguous evidence stays in intake until ownership is resolved. Outside a repository, capture evidence in the selected durable workspace and report missing repository context; do not invent a build-ready baseline.

Create a new uniquely named evidence file. Never edit, overwrite, rename or delete previous handoffs. A correction is a new delta that cites and corrects the earlier item. Keep the original conflict visible. `--inline` or an explicit no-write request returns a preview only; it cannot claim durable completion or fresh-session readiness.

## Evidence record

Use only sections with content. Keep the record separate from canonical truth.

```markdown
# Handoff evidence: <subject>
Created: <actual UTC timestamp>
Repository and baseline: <path/name, branch, full HEAD, dirty overlap or unavailable>
Sources: <origin, author/authority, date, durable reference/hash where available>
Previous evidence: <paths or none>

## New material
- <fact, approved decision, requirement, constraint, observation, implementation evidence, proposal, dependency or open question; source beside it>

## Conflicts and missing material
- <both positions and their sources; missing source and affected decision>

## Resolution evidence
- <question, method, observed result, supported decision and durable output>

## Routing record
| Owner/capability | Applicability and reason | Source path/revision | Observed use/output or blocker |
|---|---|---|---|

## Disposition
- <new material item -> canonical section, map ticket, human gate, or retained evidence>
```

A source claim is not authority. An approval needs evidence that its author owns the decision. A proposal remains a proposal, implementation shows current behavior, inference stays labelled, and a later message does not silently supersede earlier intent. Quote disagreement with attribution. Do not expose secrets; preserve their role, safe storage reference and resulting dependency. Redaction does not erase the requirement.

Before delivery, compare an inventory of new material against the evidence and its dispositions. Every item must survive or have an explicit loss/missing-source report that blocks the affected work. Then check for duplication against existing truth and cited prior evidence. Keep an exact source item when its detail matters; do not substitute a count for an enumerated roadmap.

## One home per kind of truth

| Artifact | Owns | Update when |
|---|---|---|
| PRODUCT.md | Problem, user, outcomes, behavior, scope, rules, success, non-goals | Product truth changes |
| DESIGN.md | Experience, interactions, states, hierarchy, responsive/accessibility rules, design-system decisions | Design truth changes |
| TECH.md | Architecture, interfaces, data contracts, integrations, infrastructure, technical constraints | Technical truth changes |
| GLOSSARY.md | Domain terms, entities, states, meanings, avoided synonyms | Domain language changes |
| Existing ADR convention | Hard-to-reverse or surprising choices with a real trade-off | A qualifying decision needs its rationale retained |
| Handoff evidence | New observations, source statements, approvals, changes and uncertainty | New material arrives; append a delta |
| Wayfinder map | Decision dependencies, unresolved fog and resolution pointers | Dependent uncertainty spans sessions |
| BUILD.md | Current mission, human gates, PR-sized build contracts | Truth suffices to compile or current build state changes |

Use existing equivalent names/roots. Do not create duplicate spec or ADR roots. Tiny changes may reference sufficient existing truth without creating or regenerating PRODUCT/DESIGN/TECH. Warp writers support document quality but own no lifecycle. Domain owners supply decisions/evidence within these homes; html-plan never replaces DESIGN and BUILD never becomes a second PRD.

Re-read overlapping local changes before editing. Record unresolved truth conflicts instead of overwriting user work. Accepted human choices carry their source; supported reversible technical decisions carry their evidence and reasoning, without private chain-of-thought.
