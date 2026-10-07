Notes from the disruption rebooking review, Saltline Ferries, Thursday. Typed up by Chiara from the call, lightly cleaned. Package this for whoever builds it.

Attendees: Ingrid Solheim (head of port operations, she owns disruption policy and signs off anything passenger-facing), Mateus (backend), Chiara (support lead), Bao (design), Femi (data). Halvard from the Tidewatch team was invited and did not join.

**Why we met**

Ingrid opened with the storm on 14 September. Three sailings were cancelled that day. That was 1,140 bookings. Agents moved them by hand in Harbor Desk, one booking at a time, and it took nine hours to get through the list. 212 bookings got no new sailing before their original departure time had passed. Chiara said again later that it was nine hours and that her team cannot do that a second time, and Ingrid agreed, nobody disputes the nine hours.

Mateus said the "Move booking" button was only ever meant for a handful of bookings. Femi said the single cancellation email goes out fine but tells people an agent will contact them, which on the 14th was not true for hours.

**What Ingrid decided on the call**

Ingrid was clear these are decided, not for discussion:

1. When a sailing is cancelled, every affected booking automatically gets an offer for the next sailing on the same route that has capacity for it. No agent involved for the first offer.
2. An offer expires 6 hours after it is sent. An expired or unanswered offer puts the booking in an agent queue.
3. A vehicle booking is only offered a sailing with enough lane metres for its vehicle class.
4. When capacity is short, offers go in this order: bookings with the medical travel flag first, then island residents, then by booking time, earliest first. Bao asked whether foot passengers go before vehicles and Ingrid said no, the order is those three and nothing else.
5. A passenger who declines gets a full refund, no fee.

Chiara asked if agents can override the priority order for a hardship case. Ingrid: "I'm not sure. Come back to me on that." So that one is not decided.

**What the thing has to do**

From the discussion, agreed as what the first version must do:

- The cancellation notice with the offer goes out within 10 minutes of the cancellation.
- The notice links to an offer page with two actions, Accept and Decline. No login, the link carries the booking.
- Accepting issues a new booking reference and marks the old booking `rebooked`.
- Declining marks the old booking `refund_pending` and starts the refund.
- Harbor Desk gets an agent queue of bookings whose offer expired or that had no eligible sailing, sorted by original departure time, earliest first.
- Every automatic action writes an audit record: what was offered, to which booking, when, and what happened to it.
- Agents can still move a booking by hand at any point. A manual move cancels a pending offer.

**Technical notes from Mateus**

Cancellations come from Tidewatch, the port control system. Tidewatch calls `POST /v1/sailings/{sailing_id}/cancel` and then publishes `sailing.cancelled` on the topic `ops.sailings`. The event today carries `sailing_id`, `route` and `cancelled_at`. It does not carry a reason.

Capacity is read from `GET /v1/sailings/{sailing_id}/capacity`, which returns:

```json
{ "foot_remaining": 212, "lane_metres_remaining": 148.5 }
```

Mateus measured that endpoint at a p95 of 800 ms, and Tidewatch rate-limits us to 20 requests per second. For a 400-booking sailing that matters. A request for a sailing that has already left returns `409` with `{"error": "sailing_already_departed"}`.

Lane metres per vehicle class, from the port's loading table: motorcycle 1.0, car 4.5, van 6.0, truck_under_7_5t 9.0. Mateus noted that trucks are not in our code at all today.

The staging token for the capacity API is tw-stg-4c81e07d93ab5f26FAKE7731, Femi has it, do not paste it anywhere else.

**Ideas that were floated, none approved**

- Mateus wants a `capacity_holds` table: when an offer is sent, hold the seats and lane metres for it, with a 15 minute hold that is renewed while the offer is open. He said, quote, "we should probably hold capacity or we will oversell the next sailing." Ingrid said she understands the worry and wants to see numbers first. Not approved.
- Femi proposed sending the offer by SMS as well as email. She thinks email alone is too slow. There is no budget line for SMS and Ingrid did not approve it.
- Bao proposed a countdown on the offer page showing the time left before expiry. Nobody objected, nobody approved.
- Chiara proposed that the agent queue shows a "called" tick so two agents do not ring the same passenger. Not discussed further.

**Mateus's draft rollout**

Mateus shared a draft. Ingrid has not approved it and said she wants to read it properly.

- Phase 1, shadow mode. On the Brevik-Holm route only. The system works out offers and sends nothing. Compare its choices with what agents actually did.
- Phase 2, email offers on Brevik-Holm. Foot passengers only. Agents watch every offer for the first week.
- Phase 3, all five routes, plus the agent queue in Harbor Desk.
- Phase 4, vehicle bookings, including trucks under 7.5 t. Depends on the lane metre table being in code.
- Phase 5, SMS. Only if Ingrid approves the budget.

**How we will know it works**

Chiara and Femi were specific here and Ingrid wants all of it kept:

- Replay the 14 September data (3 sailings, 1,140 bookings) through shadow mode. The system must never offer more places than a sailing has. Zero over-offers.
- Chiara's team hand-checks 25 bookings from the replay: for each, would an agent have picked the same sailing? Record every difference and the reason.
- In the replay, the notice time must be within 10 minutes of the cancellation for at least 95% of bookings.
- No booking ends up on two sailings. Femi will run a query for duplicate allocations after every replay.
- Accept on an expired offer shows "This offer has expired. An agent will contact you." and changes nothing.
- A decline issues the refund within 1 business day.
- Before Phase 2 starts, Ingrid reviews the shadow results herself.

**What we depend on**

- Tidewatch has to add `reason_code` to the `sailing.cancelled` event so the notice can say weather or technical. Owner Halvard. Ticket TW-618, not scheduled.
- Legal has to approve the new notice wording. Owner Oda. She has the draft.
- Femi needs a second staging token with replay scope. She has asked Tidewatch.
- The refund goes through the payments team's existing refund job. Mateus to confirm it accepts a batch.

**Still open**

- What happens to a booking when no sailing with capacity departs within 48 hours? Offer a later one, or straight to refund?
- Does a group booking (more than 9 passengers) stay together, or can it be split across sailings?
- Does a pending offer count against lane metres and seats? Tied to Mateus's holds idea.
- Can agents override the priority order? (Ingrid's "come back to me".)
- Who answers passengers who reply to the notice email? Today that inbox is unmonitored.

**Not part of this**

Ingrid ruled these out for this work: hotel or meal compensation, rebooking onto partner operators, and any change to the public booking site.

**Later, maybe**

Femi talked about offering a rebooking before a cancellation, from the weather forecast, when a cancellation looks likely. Bao talked about a passenger app where people rebook themselves. Ingrid said both are interesting and neither is this year.
