Notes from the waitlist feature kickoff, for the team building it.

Attendees: Sunita (product owner for bookings), Beck (backend), Aiko (support lead).

Background: sold-out time slots currently show "Sold out" and nothing else. Support gets about 140 tickets a week asking to be told when a slot opens (Aiko's count from the last four weeks).

Sunita, who owns this, decided the following:
- A sold-out slot gets a "Join waitlist" button.
- Joining needs only an email address. No account.
- When a seat frees up, the first person on the list gets an email and has 30 minutes to book before the offer moves to the next person.
- One waitlist entry per email per slot.
- A waitlist closes 2 hours before the slot starts.

Requirements Sunita stated:
- The offer email must contain a link that holds the seat for that person for the 30 minutes.
- If the person does not book, the hold is released and the next person is offered.
- Unsubscribe link in every waitlist email.
- Waitlist position is never shown to the customer.

Beck on the existing system:
- Seat holds already exist for checkout: `POST /v1/holds` with `{"slot_id": "...", "seats": 1, "ttl_seconds": 600}`. Max `ttl_seconds` today is 900. A 30 minute hold needs 1800, so the cap has to change or the offer needs a different mechanism. Beck has not looked into which.
- Cancellations emit a `seat.released` event on the bookings topic.
- Email goes through the notifications service, which needs a new template registered by the lifecycle team. Lead time is usually a week.

Dependencies:
- Lifecycle team registers the template (contact: Oren).
- Legal has to confirm that storing an email without an account is fine under the current privacy notice. Sunita is asking them.

Constraint: nothing ships before the legal answer.

Ideas raised, not decided:
- Aiko suggested also offering SMS. Sunita: maybe later, not now.
- Beck suggested offering to the top three people at once, first to book wins, to fill seats faster. Sunita wants to think about fairness first.

Open:
- What happens when two seats free up and the first person wanted two?
- Do group bookings (more than 6 seats) get a waitlist at all?
- Is the 30 minutes measured from send or from open?

Out of scope per Sunita: waitlists for whole days, and any paid priority waitlist.
