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
Spec: none
Sources: 1 (1 pasted)
Source hashes: pasted text, not hashed
Evidence complete: YES
Contract: none
Execution ready: none
Assets: none

## Executive context

Mateus wrote a plan of record draft (v0.3) for a deck planner after two sessions with the loadmasters. The deck planner is a new Harbor Desk module that shows where each booked vehicle goes on the vehicle deck, checks the placement against the vessel's limits, and replaces the paper deck plan. The draft holds a thirteen-phase roadmap and a seventeen-step order of work. Only part of it is approved.

## Repository status quo

- S1. Harbor Desk is the internal operations console for Saltline Ferries (`README.md`). Agents look up sailings and bookings.
- S2. ALREADY EXISTS: vehicle classes and their lane metres in `src/rebooking/rebookingRules.ts` (`motorcycle` 1.0, `car` 4.5, `van` 6.0). They are used to filter sailings for a manual rebooking.
- S3. ALREADY EXISTS: remaining lane metres per sailing, read from `GET /v1/sailings/{sailing_id}/capacity` in `src/sailings/capacityClient.ts`.
- S4. NEW: the repository has no model of a vessel, a deck or a lane, no deck view, and no route under `/sailings/`.
- S5. No spec and no earlier handoff exist in the repository.

## Objective

Replace the paper deck plan, which the loadmaster draws about 40 minutes before departure from a printed list of vehicle bookings, with a deck plan in Harbor Desk.

## Confirmed facts

- S6. The first vessel is MV Tern: 2 vehicle decks (main deck and mezzanine), 14 lanes, 310 lane metres in total.
- S7. Harbor Desk knows every vehicle booking and its class and has no picture of the deck.
- S8. The car deck has no signal.

## Approved decisions

- S9. Ingrid Solheim (head of port operations) approved phases 0 to 2 for this quarter.

## Source roadmap

Status: a draft by Mateus. Ingrid Solheim approved phases 0 to 2 for this quarter and has not approved anything from phase 3 on.

### Phase 0: baseline

Collect the paper deck plans of 30 past MV Tern sailings as the comparison set. Nothing is built. Without it nobody can tell whether the planner's output is as good as a loadmaster's.

### Phase 1: vessel model

Model MV Tern's decks and lanes. Each lane has a length, a maximum vehicle height and a maximum axle load. MV Skua and MV Petrel are modelled in phase 9.

### Phase 2: read-only deck view

A page per sailing that draws the lanes and the booked vehicles in them. No editing. The loadmasters review it against the phase 0 plans.

### Phase 3: height and weight limits

Enforce the limits. The mezzanine takes vehicles up to 2.1 m high. Ramp B carries at most 10 t per axle. A placement that breaks a limit is refused with the reason.

### Phase 4: dangerous goods segregation

Vehicles carrying ADR class 2 and class 3 goods may not stand in adjacent lanes. BLOCKER: the phase needs the segregation table from the safety officer, Runa, and cannot start until she supplies it.

### Phase 5: placement suggestion

The planner suggests a lane for each vehicle, first fit by lane. The loadmaster confirms or moves each one.

### Phase 6: loadmaster tablet view

The deck view on the loadmaster's tablet, usable offline for up to 40 minutes.

### Phase 7: check-in integration

Gate scanners publish `vehicle.checked_in`. The planner marks a vehicle as arrived, so the loadmaster sees who is on the quay.

### Phase 8: stability check handoff

Export the plan to Trimline, the stability software, as a CSV. The captain records go or no-go. The planner never decides stability itself.

### Phase 9: MV Skua and MV Petrel

Roll out to the other two vessels. MV Petrel has a turntable on the main deck that the lane model does not cover yet.

### Phase 10: no-show reflow

20 minutes before departure, release the lanes of vehicles that have not checked in and re-run the suggestion for standby vehicles.

### Phase 11: reporting

Utilisation per sailing: lane metres used and unused. Ingrid wants this weekly.

### Phase 12: retire paper deck plans

Stop printing the vehicle list once 60 consecutive sailings have run without anyone falling back to paper.

## Source implementation sequence

Status: Mateus's suggested order of work. The source says nobody has reviewed it.

1. S10. Photograph the 30 paper deck plans for MV Tern and transcribe them into `deck_plans_baseline.csv`.
2. S11. Define the `Vessel`, `Deck` and `Lane` types. A lane has `length_m`, `max_height_m` and `max_axle_load_t`.
3. S12. Seed MV Tern: 2 decks, 14 lanes, 310 lane metres.
4. S13. Write `DeckPlanRepository` with a fixture implementation that reads `fixtures/tern.json`.
5. S14. Build the read-only deck view at the route `/sailings/:sailingId/deck`.
6. S15. Colour each vehicle by class and add a legend.
7. S16. Add the height rule: refuse a placement when the vehicle is taller than the lane allows, with the message "Too tall for this lane".
8. S17. Add the axle-load rule for ramp B, 10 t per axle.
9. S18. Add the `adr_segregation` table and the adjacency rule. It cannot start before Runa sends the table.
10. S19. Write the first-fit suggestion. Draw a suggested vehicle with a dashed outline until the loadmaster confirms it.
11. S20. Build the tablet layout at 1024 px wide, with an offline cache and a banner "Offline since HH:MM".
12. S21. Subscribe to `vehicle.checked_in` on the topic `gate.events` and mark vehicles as arrived.
13. S22. Handle the tablet coming back online: last write wins per lane, and the planner lists every lane where two edits collided.
14. S23. Write the Trimline export, `trimline_export.csv`, with the columns `lane_id,vehicle_class,weight_kg,position_m`.
15. S24. Record the captain's go or no-go with name and time.
16. S25. Add the no-show reflow job at 20 minutes before departure.
17. S26. Build the utilisation report and the weekly email to Ingrid.

## Dependencies / owners

- S27. The ADR segregation table. Owner: Runa, safety officer. Not supplied yet.
- S28. The gate scanner events on `gate.events`. The source names no owner.
- S29. Trimline, the stability software. The source names no owner.

## Open questions

- S30. Does a motorcycle take a lane position, or can two share one? The loadmasters disagree.
- S31. Who owns the vessel model when a vessel is refitted? The source says nobody has said.
- S32. Is 40 minutes offline enough on the Holm crossing, which takes 55 minutes?

## Out of scope

- S33. Passenger seating, foot-passenger boarding and freight invoicing.

## Source provenance

- User-supplied source: "Deck planner: plan of record draft, v0.3" by Mateus, pasted. The source calls itself a draft.
- Repository documentation: `README.md`.
- Repository implementation: `src/rebooking/rebookingRules.ts`, `src/sailings/capacityClient.ts`.

## Explicitly not asserted

- S34. That phases 3 to 12 are approved. The source says they are not.
- S35. That the order of work is agreed. The source says nobody has reviewed it.
