Pasting everything from the "availability badges" workstream so far. Three sources: Monday kickoff notes, the Slack thread, and Omar's API notes.

=== Monday kickoff (notes by Tess) ===

Attendees: Tess (PM), Omar (backend), Lin (design), Gus (data), Vera (head of marketplace, owns badge policy)

Tess: thanks everyone for making time, I know calendars are rough this week. Quick agenda, badges, then data, then AOB.
Tess: context for anyone new. Listings on the marketplace show no signal about how available a rental is. Renters open a listing, pick dates, and find out it's booked. We think a badge on the listing card would help.
Lin: yes, and I've got mocks. Three badge states. I'll share after.
Vera: before mocks, let's fix the rule. I've thought about this over the weekend. A listing with 21 or more available days in the next 30 gets the top badge. I'm deciding that now so we stop going around in circles. 21+ available days out of the next 30 = "Wide open".
Tess: noted, 21+ of next 30 = Wide open. Vera's call.
Gus: for the notes, available days means days with no confirmed booking and not blocked by the owner.
Vera: correct. Confirmed bookings and owner blocks both count as unavailable.
Omar: and pending bookings?
Vera: hm. Not sure. Leave that open, I need to ask the trust team how long pending holds last.
Tess: ok open question, pending bookings.
Lin: for the middle badge I was thinking 10 to 20 days = "Some dates left".
Vera: that's reasonable but I'm not signing off on the middle band today. Could be 10, could be 7. Bring me the distribution first.
Gus: I can pull the distribution. Roughly, from memory, about 35% of active listings have 21+ days open. Don't quote me, that's from a dashboard I looked at last month.
Tess: so again, 21+ is decided, the middle band is not.
Lin: and under the middle band, no badge at all? or a "Almost booked" badge?
Vera: no badge for now is my instinct. But same thing, not deciding today.
Omar: the calendar service already exposes availability per listing. I'll write up the API.
Tess: great. Anything else on badges? No? Ok.
Tess: data. Gus, the nightly snapshot?
Gus: the availability snapshot table is listing_availability_daily, refreshed at 03:00 UTC. It lags real time by up to 24h.
Omar: which is a problem if we compute badges from it, a listing could be booked solid this morning and still show Wide open.
Gus: true. Maybe we compute the badge live from the calendar service instead of the snapshot?
Omar: maybe. Live calls on the search results page are 40 listings per page, that's 40 calls or one batch call. I'd want to load test before promising that.
Tess: so that's a proposal, compute live vs from snapshot, not decided.
Vera: I don't have a view, that's an engineering call, but the badge must never be more than a day stale. That one I do care about. Hard requirement from me.
Tess: got it, max staleness 24h, requirement from Vera.
AOB: Lin is out Thursday and Friday. Tess will send notes. Thanks all!

=== Slack thread, #availability-badges, Tue to Wed ===

Tess: notes from Monday are in the doc. Summary: 21+ available days of next 30 = Wide open (Vera decided). Middle band TBD. Pending bookings TBD.
Lin: mocks are in the design file, page "Badges v2". Three states mocked: Wide open, Some dates left, no badge.
Gus: pulled the real distribution. 31% of active listings have 21+ available days in the next 30. Not 35, I misremembered. 44% have between 7 and 20. 25% have fewer than 7. Query is saved as "badge_distribution_v1" in the analytics workspace, run Tuesday.
Omar: so 31% of listings get the top badge. is that too many? feels like a badge a third of listings have isn't a signal.
Lin: I think it's fine, it's meant to be reassuring not exclusive.
Omar: I'd raise it to 25+. A badge on a third of everything is noise.
Lin: strongly disagree, Vera already decided 21.
Omar: she decided before seeing the number.
Tess: let's not relitigate in thread. Vera's decision stands unless Vera changes it. Omar's concern is noted. I'll raise it with her.
Vera: (Wed) saw this. I'm not changing 21 right now. Might revisit after launch.
Omar: ok.
Gus: reminder that the snapshot table lags by up to 24h. Refresh is 03:00 UTC.
Tess: yes we have that.
Omar: also, I still need read access to the calendar service staging environment to load test the batch endpoint. Requested from platform on Tuesday, ticket PLAT-2231, no reply yet. Blocked on that for the live vs snapshot question.
Tess: thanks. Chasing.
Omar: for whoever picks this up, staging token I've been using for the single-listing endpoint is cal-stg-9b1e44d07ac2FAKETOKEN3381, it's read-only and expires end of month. Doesn't work for batch.
Tess: please don't paste tokens in channel!
Omar: sorry.
Lin: one more thought, maybe the badge should also show on the listing detail page, not just the card?
Tess: nice idea, parking it. Not in scope for the first version, Vera said cards only on Monday (I forgot to write that down, but she did say it).
Vera: confirmed, cards only for v1.

=== Omar's API notes ===

Calendar service, single listing:

GET /calendar/v3/listings/{listing_id}/availability?from=YYYY-MM-DD&days=30

Response 200:
{
  "listing_id": "lst_48213",
  "from": "2026-11-01",
  "days": 30,
  "available_days": 23,
  "blocked_days": 2,
  "booked_days": 5,
  "pending_days": 0
}

Notes:
- days max is 90. days > 90 returns 400 with error "days_out_of_range".
- pending_days are reported separately and are NOT included in available_days or booked_days.
- there is a batch endpoint, POST /calendar/v3/availability:batch, max 50 listing ids per call. I have not been able to test it (no staging access for batch, see PLAT-2231).
- single endpoint p95 is 120 ms in staging. Unknown for batch.
- auth is a bearer token in the Authorization header.
