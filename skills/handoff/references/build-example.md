# BUILD: Import validation
Status: PARTIALLY_READY

## Mission
Goal: Let operators validate an import before applying it.
Done check: A file with valid and invalid rows shows exact row errors, and the approved duplicate rule controls application.
Proof wanted: Real-route captures and automated behavioral evidence, independent review, one PR per slice.
Known: The existing importer parses rows; PRODUCT.md#validation defines row-error behavior.
Constraints: Keep existing saved imports compatible. Every shipping PR receives independent review. Do not merge.

## Canonical truth
- PRODUCT.md#validation defines errors and operator behavior.
- DESIGN.md#import-preview defines the existing preview and its loading, empty and error states.
- TECH.md#import-contract defines parser boundaries and persisted import records.
- GLOSSARY.md#import-row defines row identity.
- handoffs/duplicate-policy.md preserves the owner's unresolved duplicate choice.

## Human Gates
### G01: Duplicate policy
Status: OPEN
Question: Should duplicate rows be rejected or merged into one row?
Why human-owned: The product owner decides whether combining rows preserves user intent; parser measurements cannot settle that intent.
Recommended default: Reject duplicates with row-specific feedback.
Alternatives: Merge duplicates using an explicitly approved identity rule.
Evidence: handoffs/duplicate-policy.md records both stakeholder preferences and confirms neither is approved.
Consequences: Rejection preserves every row for correction. Merging changes imported row counts and needs the identity rule in PRODUCT.
Blocked slices: S02
Unblocked work: S01

## Slice Index
| ID | Title | Status | Dependencies | Gate dependency |
|---|---|---|---|---|
| S01 | Show row validation results | READY | none | none |
| S02 | Apply the approved duplicate policy | BLOCKED | S01 | G01 |

## S01: Show row validation results
Status: READY
Depends on: none
Gate dependency: none
Goal: Operators can inspect row errors before applying an import.
Done check: Valid rows show no error; each invalid row shows its exact location and reason; validation does not persist the import.
Proof wanted: Automated valid/invalid-row and no-write evidence, a real import-preview capture, and independent review of contract fidelity, code quality and proof.
Known: PRODUCT.md#validation, DESIGN.md#import-preview and TECH.md#import-contract settle this behavior independently of duplicate handling.
Constraints: Preserve existing saved imports and preview accessibility. Do not merge. Independent review is required.
Observable after landing: An operator can upload a file and inspect each validation error without applying it.
Likely surface: Existing import route, parser boundary and preview.
Unit verification: Exercise valid, invalid, empty and malformed inputs and prove validation makes no persisted writes.
Live verification: Upload representative files on the real preview route, observe row feedback, keyboard navigation and loading/error states; retain captures.
Performance proof: Not applicable; this slice changes validation feedback without a new performance target. Preserve existing project limits.
PR boundary: Parser result contract plus usable preview feedback in one PR.
Out of scope: Duplicate policy, applying an import, a new parser library.
Readiness evidence: Canonical sections settle behavior; no prerequisite PR or open gate affects this slice. Recheck current baseline before execution.

## S02: Apply the approved duplicate policy
Status: BLOCKED
Depends on: S01
Gate dependency: G01
Goal: Apply validated rows using the product owner's approved duplicate rule.
Done check: Applied row identities and counts match the approved rule; invalid imports produce no persisted writes.
Proof wanted: Automated row-identity/count evidence and a real apply-path observation, with independent review.
Known: TECH.md#import-contract and S01's validation results; duplicate semantics remain unresolved in G01.
Constraints: Keep existing saved imports compatible. Independent review is required. Do not merge.
Observable after landing: Operators can apply a valid import and see the resulting count under the approved rule.
Unit verification: Prove approved duplicate handling and atomic rejection of invalid rows after G01 resolves.
Live verification: Apply an approved representative import and observe persisted identities/counts on the real route.
Performance proof: Not applicable; no performance target changes. Preserve existing project limits.
PR boundary: Application behavior for the approved duplicate rule in one PR.
Out of scope: Alternative duplicate policies and parser replacement.
Readiness evidence: G01 remains OPEN and S01 has no landing evidence. Both prerequisites must clear before READY.
