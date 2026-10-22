# Handoff: Refund export
Handoff. Evidence, not truth. Compiled by /handoff.
Handoff id: 20261022-101500-refund-export
Created: 2026-10-22T10:15:00Z
Repository: harbor-desk
Branch: main
Baseline: 8f2c41d7a9e05b36c1d48e7f20a9b3c5d6e7f801
Working tree: clean
Depth: STANDARD
Mode: NEW
Previous handoff: none
Spec: none
Sources: 2 (1 Granola meeting, 1 pasted)
Source hashes: pasted text, not hashed
Material information loss: NONE
Evidence complete: YES
Contract: approved 2026-10-22: "Looks right. Leave the date filter open, build the rest."
Execution ready: PARTIAL: T01, T02
Assets: 1 stored, 1 not stored

# Part A: Execution contract

How to build from this file. Build only when the header reads `Contract: approved`, or when the user approves this contract in the request that starts the build. Build the READY tickets, each once the tickets in its `Blocked by` line are done. Take each BLOCKED ticket and each product call to the user, and settle each prototype fork by running something. Part D is the evidence behind every line here: read it, and its images, for any detail a ticket cites.

## Objective

Support agents reconcile refunds by hand from the refunds page today (S1, S3). They need a CSV export of refunds so finance can check them against the payment provider's report (S3).

## Scope

- An export button on the refunds page that downloads the visible refunds as CSV (S6, S7, E1).
- The column set Mira approved (S4).
- A date range filter on the export (S8), held by an open decision.

Out of scope: S12.
Constraints: S5.

## Decisions

- S4: the CSV has the columns refund id, booking id, amount, currency, created at.
- S5: the export runs in the browser, with no new backend endpoint.
- S13: the user asked to build everything except the date filter for now.

## Open decisions

- Product call: should the date filter default to the last 30 days or to all time? (S9) Holds: T03.

# Part B: Specification

## Expected behavior

### Refunds page

- An Export button sits beside the existing filters, as in the export dialog screenshot (E1).
- Clicking it downloads `refunds.csv` with the rows the page shows, in the order shown (S6, S7).

## Edge cases and errors

- With no refunds visible, the button is disabled (S7).
- Inferred: amounts keep their minor-unit precision in the CSV, since the page shows two decimals (S2).

## Testing decisions

- The refunds page component tests are the seam (S2, S10). A good test checks the downloaded file's rows and header, not the internals.

# Part C: Tickets

### T01: Export the visible refunds as CSV
Status: READY
Blocked by: none

What to build: an Export button on the refunds page that downloads the visible refunds as `refunds.csv`.

Expected behavior:
- The file has the approved columns, in order, one row per visible refund.

Acceptance criteria:
- [ ] The header row is `refund_id,booking_id,amount,currency,created_at`.
- [ ] The rows match the page, in the order shown.

Proof: the refunds page component test reads the downloaded file.
Rests on: S4, S5, S6, S10, S11, E1

### T02: Disable the export when nothing is visible
Status: READY
Blocked by: T01

What to build: the Export button is disabled when the page shows no refunds.

Acceptance criteria:
- [ ] With an empty result, the button is disabled and no file downloads.

Proof: the refunds page component test with an empty fixture.
Rests on: S7

### T03: Filter the export by date range
Status: BLOCKED: S9
Blocked by: T01

What to build: a date range on the export, so finance can pull one month at a time.

Acceptance criteria:
- [ ] Only refunds created inside the range are exported.

Proof: the refunds page component test with refunds on both sides of the range.
Rests on: S8, S9

# Part D: Evidence

## Repository status quo

- S1. The refunds page lists refunds with filters for status and agent, and has no export.
- S2. The refunds page has component tests that render it against fixture refunds, and amounts render with two decimals.

## Objective

- S3. Finance checks refunds against the payment provider's monthly report and wants a CSV to do it, according to the Granola summary.

## Approved decisions

- S4. Mira (finance lead) approved the columns refund id, booking id, amount, currency and created at.
- S5. Jon (tech lead) decided the export runs in the browser, with no new backend endpoint.

## Requirements

- S6. The export holds the refunds the page is showing, with its current filters applied.
- S7. The export is unavailable when there is nothing to export.
- S8. Finance wants to export one month at a time.

## Open questions

- S9. Whether a date filter defaults to the last 30 days or to all time. Mira asked for 30 days and Jon for all time, and nobody settled it.

## Testing / QA / proof expectations

- S10. Jon asked for the export to be covered in the existing refunds page tests.

## Source acceptance / expectations

- S11. The source's one acceptance example: exporting three visible refunds gives a file with a header and three rows. (E1)

## Out of scope

- S12. Scheduled or emailed exports.

## Images

- E1. `20261022-101500-refund-export-assets/E1-export-dialog.png`, sha256 `00ce60bd979e601ce0a5847bde2510fc55de9d674a47dd9ab5c920e16292d18e`. Granola meeting "Refund export", 2026-10-21, screenshot `9f2c4e10`, captured 11:58 UTC. The export dialog mockup.
  ![E1](20261022-101500-refund-export-assets/E1-export-dialog.png)
- E2. Not stored: the host showed no file path. Pasted in this invocation. The payment provider's report header.

## Source provenance

- Granola meeting "Refund export", 2026-10-21, id `0d6b...`, note creator Mira. Notes, summary and one screenshot read. No transcript on the free plan.
- Pasted text in this invocation: the provider report header.

## Decisions made in this run

- S13. The user, in this invocation: "Looks right. Leave the date filter open, build the rest."
