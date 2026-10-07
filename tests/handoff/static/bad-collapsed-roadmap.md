# Handoff: Deck planner plan of record draft v0.3
Handoff. Evidence, not truth. Compiled by /handoff.
Handoff id: 20261007-093012-deck-planner-plan-of-record-draft-v0-3
Created: 2026-10-07T09:30:12Z
Repository: harbor-desk
Branch: main
Baseline: 8f2c41d7a9e05b36c1d48e7f20a9b3c5d6e7f801
Working tree: clean
Depth: DEEP
Mode: NEW
Previous handoff: none
Build Flow spec: none
Sources: 1 (1 pasted)
Source hashes: pasted text, not hashed
Material information loss: NONE
Ready for Build Flow: YES

## Executive context

Mateus wrote a plan of record draft (v0.3) for a deck planner after two sessions with the loadmasters. The deck planner is a new Harbor Desk module that shows where each booked vehicle goes on the vehicle deck, checks the placement against the vessel's limits, and replaces the paper deck plan. The draft holds a thirteen-phase roadmap and a seventeen-step order of work. Only part of it is approved.

## Repository status quo

- Harbor Desk is the internal operations console for Saltline Ferries (`README.md`). Agents look up sailings and bookings.
- ALREADY EXISTS: vehicle classes and their lane metres in `src/rebooking/rebookingRules.ts` (`motorcycle` 1.0, `car` 4.5, `van` 6.0). They are used to filter sailings for a manual rebooking.
- ALREADY EXISTS: remaining lane metres per sailing, read from `GET /v1/sailings/{sailing_id}/capacity` in `src/sailings/capacityClient.ts`.
- NEW: the repository has no model of a vessel, a deck or a lane, no deck view, and no route under `/sailings/`.
- No Build Flow spec and no earlier handoff exist in the repository.

## Objective

Replace the paper deck plan, which the loadmaster draws about 40 minutes before departure from a printed list of vehicle bookings, with a deck plan in Harbor Desk.

## Confirmed facts

- The first vessel is MV Tern: 2 vehicle decks (main deck and mezzanine), 14 lanes, 310 lane metres in total.
- Harbor Desk knows every vehicle booking and its class and has no picture of the deck.
- The car deck has no signal.

## Approved decisions

- Ingrid Solheim (head of port operations) approved phases 0 to 2 for this quarter.

## Source roadmap

Status: a draft by Mateus. Ingrid Solheim approved phases 0 to 2 for this quarter and has not approved anything from phase 3 on.

Roadmap: thirteen phases, built vessel by vessel, starting with MV Tern.

## Source implementation sequence

Status: Mateus's suggested order of work. The source says nobody has reviewed it.

A 17-step order of work exists.

## Dependencies / owners

- The ADR segregation table. Owner: Runa, safety officer. Not supplied yet.
- The gate scanner events on `gate.events`. The source names no owner.
- Trimline, the stability software. The source names no owner.

## Open questions

- Does a motorcycle take a lane position, or can two share one? The loadmasters disagree.
- Who owns the vessel model when a vessel is refitted? The source says nobody has said.
- Is 40 minutes offline enough on the Holm crossing, which takes 55 minutes?

## Out of scope

- Passenger seating, foot-passenger boarding and freight invoicing.

## Source provenance

- User-supplied source: "Deck planner: plan of record draft, v0.3" by Mateus, pasted. The source calls itself a draft.
- Repository documentation: `README.md`.
- Repository implementation: `src/rebooking/rebookingRules.ts`, `src/sailings/capacityClient.ts`.

## Explicitly not asserted

- That phases 3 to 12 are approved. The source says they are not.
- That the order of work is agreed. The source says nobody has reviewed it.
