# Handoff: Rebooking offers, expiry and priority order
Handoff. Evidence, not truth. Compiled by /handoff.
Handoff id: H002
Created: 2026-09-25T13:41:07Z
Repository: harbor-desk
Branch: main
Baseline: 5d0c1e9a7b3f42c68e1d0a94b7c2f35e6a8d1b40
Working tree: clean
Depth: STANDARD
Mode: DELTA
Previous handoff: specs/disruption-rebooking/handoffs/H001-2026-09-18-storm-review-and-rebooking-problem.md
Build Flow spec: disruption-rebooking
Sources: 1 (1 pasted)
Source hashes: pasted text, not hashed
Material information loss: NONE
Ready for Build Flow: YES

## Executive context

Ingrid Solheim, who owns disruption policy, held the review that H001 said she would call. She decided how automatic rebooking offers work. This handoff carries those decisions and what is still open.

## Repository status quo

- Rebooking is manual. `src/bookings/BookingPage.tsx` has a "Move booking" button that lists sailings from `eligibleSailings`.
- `src/rebooking/rebookingRules.ts` sets `REBOOK_WINDOW_HOURS = 48` and lane metres for motorcycle, car and van.
- Notices go by email only (`src/notices/sendNotice.ts`). The `sailing_cancelled` template says an agent will contact the passenger.
- Nothing in the repository sends an offer, and there is no agent queue.

## Relationship to previous handoff

**Adds**

- The five decisions under Approved decisions.

**Repeats / confirms**

- The 14 September figures in H001: three sailings, 1,140 bookings, nine hours.

## Approved decisions

Decided by Ingrid Solheim at the review.

- When a sailing is cancelled, every affected booking automatically gets an offer for the next sailing on the same route with capacity for it.
- An offer expires 6 hours after it is sent. An expired or unanswered offer puts the booking in an agent queue.
- A vehicle booking is only offered a sailing with enough lane metres for its vehicle class.
- When capacity is short, offers go to bookings with the medical travel flag first, then island residents, then by booking time, earliest first.
- A passenger who declines gets a full refund, with no fee.

## Proposed / not yet approved

- Mateus proposes a `capacity_holds` table that holds seats and lane metres while an offer is open, with a 15 minute hold renewed while the offer is open. Ingrid wants to see numbers before deciding.

## Dependencies / owners

- Tidewatch adds `reason_code` to the `sailing.cancelled` event. Owner Halvard. Ticket TW-618, not scheduled.

## Open questions

- Can agents override the priority order for a hardship case? Ingrid: "I'm not sure. Come back to me on that."
- What happens to a booking when no sailing with capacity departs within 48 hours?

## Source provenance

- User-supplied source: Chiara's notes of the review call, pasted.
- Repository implementation: `src/rebooking/rebookingRules.ts`, `src/bookings/BookingPage.tsx`, `src/notices/sendNotice.ts`.
