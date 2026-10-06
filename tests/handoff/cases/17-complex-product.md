Spec notes for the Courier Console, from the ops tooling workshop. Halima owns the product and everything under "Decided" is hers. The roadmap is Farid's draft and has not been approved.

WHAT EXISTS

Dispatchers today work from a shared spreadsheet and a chat channel. There is no console. The dispatch service already exposes the data.

DECIDED (Halima)

- The first release has three screens: Live Map, Queue, Courier Profile.
- Read-only in the first release, with one exception: reassigning a delivery from the Queue.
- Dispatchers only. Couriers and merchants never log in.
- Desktop only, minimum width 1280px.

SCREEN: LIVE MAP

Purpose: see where every active courier is right now.
- One marker per courier with an active shift. Marker color by status: green `idle`, blue `en_route_pickup`, orange `en_route_dropoff`, grey `offline`.
- Positions update every 10 seconds over the websocket.
- A courier whose last ping is older than 60 seconds shows a stale ring around the marker.
- Clicking a marker opens a card: name, current delivery id, ETA, last ping age.
- Filter by zone. Default is the dispatcher's own zone.
- If the websocket drops, show a banner "Live updates paused" and fall back to polling every 30 seconds.

SCREEN: QUEUE

Purpose: deliveries that need a human.
- Lists deliveries in state `unassigned` or `at_risk`. A delivery is `at_risk` when its projected dropoff is more than 8 minutes past the promised time.
- Columns: delivery id, merchant, promised time, projected time, minutes late, assigned courier.
- Default sort: minutes late, descending. `unassigned` rows pin to the top.
- Reassign action: pick a courier from the five nearest idle couriers. Requires a reason from a fixed list: `courier_unreachable`, `vehicle_issue`, `closer_courier`, `other`.
- Empty state: "Nothing needs attention".
- A reassign that fails because the courier accepted another job returns `409 courier_unavailable` and the row shows "Courier no longer available, pick another".

SCREEN: COURIER PROFILE

Purpose: one courier's shift at a glance.
- Header: name, vehicle type, shift start, deliveries completed this shift.
- Timeline of today's deliveries with pickup and dropoff times.
- On-time rate for the last 7 days.
- No pay data and no ratings from customers. Halima was explicit: dispatchers should not see either.

ARCHITECTURE

- The console is a web client. It talks only to the Dispatch Gateway. It never calls the dispatch service or the location service directly.
- Live positions: `wss://gateway.example.com/v1/positions?zone=<zone_id>`. Message shape:

```json
{"courier_id": "c_812", "lat": 52.37, "lng": 4.89, "status": "idle", "ts": "2025-03-04T10:15:02Z"}
```

- Queue: `GET /v1/queue?zone=<zone_id>`.
- Reassign: `POST /v1/deliveries/{delivery_id}/reassign` with `{"courier_id": "...", "reason": "..."}`.
- The `at_risk` calculation happens in the dispatch service. The client displays it and does not compute it.
- Every reassign is written to the audit log by the gateway, with the dispatcher's id.
- Auth is the staff SSO. Role `dispatcher` is required. Zone membership comes from the SSO claim `zones`.

DEPENDENCIES

- The gateway team (Petra) has to add the reassign endpoint. The other two exist.
- Location service has to raise the websocket connection limit from 200 to 1000 before rollout to all zones (owner: Ilya).
- Map tiles licence covers 50,000 loads a month. Nobody has estimated dispatcher usage.

FARID'S DRAFT ROADMAP (not approved)

Phase 1: Queue, read-only. It is the screen dispatchers need most and has no websocket dependency.
Phase 2: Reassign from the Queue. Blocked on Petra's endpoint.
Phase 3: Live Map with polling only. Proves the map and markers without the websocket.
Phase 4: Live Map on the websocket, with the stale ring and the paused banner. Blocked on Ilya's limit for full rollout, fine for one zone.
Phase 5: Courier Profile.
Phase 6: Pilot in the Amsterdam zone for two weeks, then a go/no-go with Halima.

OPEN

- Should a dispatcher see zones they are not a member of, read-only? Halima undecided.
- Is 8 minutes the right `at_risk` threshold for every zone? Farid thinks dense zones need 5.
- Who is paged when the gateway is down?

LATER, NOT NOW (Halima)

Auto-assignment suggestions, a courier-facing chat, and a mobile layout. None of it is in the first release.
