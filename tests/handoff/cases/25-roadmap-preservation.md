Deck planner: plan of record draft, v0.3, written by Mateus after two sessions with the loadmasters. Package it as a handoff.

Status of this document: draft. Ingrid Solheim (head of port operations) has approved phases 0 to 2 for this quarter. She has not approved anything from phase 3 on. The step list at the end is my suggestion for the order of work and nobody has reviewed it.

## What this is

Today the loadmaster on each vessel draws the vehicle deck plan on paper about 40 minutes before departure, from a printed list of vehicle bookings. Harbor Desk knows every vehicle booking and its class but has no picture of the deck. The deck planner is a new Harbor Desk module that shows where each booked vehicle goes on the deck, checks the placement against the vessel's limits, and replaces the paper plan.

The first vessel is MV Tern: 2 vehicle decks (main deck and mezzanine), 14 lanes, 310 lane metres in total.

## Roadmap

### Phase 0: baseline
Collect the paper deck plans of 30 past MV Tern sailings as the comparison set. Nothing is built. Without this we cannot tell whether the planner's output is as good as a loadmaster's.

### Phase 1: vessel model
Model MV Tern's decks and lanes. Each lane has a length, a maximum vehicle height and a maximum axle load. MV Skua and MV Petrel are modelled later, in phase 9.

### Phase 2: read-only deck view
A page per sailing that draws the lanes and the booked vehicles in them. No editing. The loadmasters review it against the phase 0 plans.

### Phase 3: height and weight limits
Enforce the limits: the mezzanine takes vehicles up to 2.1 m high, and ramp B carries at most 10 t per axle. A placement that breaks a limit is refused with the reason.

### Phase 4: dangerous goods segregation
Vehicles carrying ADR class 2 and class 3 goods may not stand in adjacent lanes. Needs the segregation table from the safety officer, Runa. Blocked until she supplies it.

### Phase 5: placement suggestion
The planner suggests a lane for each vehicle, first fit by lane. It is a suggestion. The loadmaster confirms or moves each one.

### Phase 6: loadmaster tablet view
The deck view on the loadmaster's tablet, usable offline for up to 40 minutes, because the car deck has no signal.

### Phase 7: check-in integration
Gate scanners publish `vehicle.checked_in`. The planner marks a vehicle as arrived, so the loadmaster sees who is actually on the quay.

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

## Suggested order of work

1. Photograph the 30 paper deck plans for MV Tern and transcribe them into `deck_plans_baseline.csv`.
2. Define the `Vessel`, `Deck` and `Lane` types. A lane has `length_m`, `max_height_m` and `max_axle_load_t`.
3. Seed MV Tern: 2 decks, 14 lanes, 310 lane metres.
4. Write `DeckPlanRepository` with a fixture implementation that reads `fixtures/tern.json`.
5. Build the read-only deck view at the route `/sailings/:sailingId/deck`.
6. Colour each vehicle by class and add a legend.
7. Add the height rule: refuse a placement when the vehicle is taller than the lane allows, with the message "Too tall for this lane".
8. Add the axle-load rule for ramp B, 10 t per axle.
9. Add the `adr_segregation` table and the adjacency rule. Cannot start before Runa sends the table.
10. Write the first-fit suggestion. Draw a suggested vehicle with a dashed outline until the loadmaster confirms it.
11. Build the tablet layout at 1024 px wide, with an offline cache and a banner "Offline since HH:MM".
12. Subscribe to `vehicle.checked_in` on the topic `gate.events` and mark vehicles as arrived.
13. Handle the tablet coming back online: last write wins per lane, and the planner lists every lane where two edits collided.
14. Write the Trimline export, `trimline_export.csv`, with the columns `lane_id,vehicle_class,weight_kg,position_m`.
15. Record the captain's go or no-go with name and time.
16. Add the no-show reflow job at 20 minutes before departure.
17. Build the utilisation report and the weekly email to Ingrid.

## Things I do not know yet

- Does a motorcycle take a lane position or can two share one? The loadmasters disagree.
- Who owns the vessel model when a vessel is refitted? Nobody has said.
- Is 40 minutes offline enough on the Holm crossing, which takes 55 minutes?

## Not in this plan

Passenger seating, foot-passenger boarding and freight invoicing are not part of the deck planner.
