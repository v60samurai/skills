Femi's write-up on cancellation notices, sent to the ops channel on Monday. Hand it off.

I looked at how long passengers take to see the cancellation notice. Over the last 90 days we sent 6,420 cancellation emails. 38% were opened within an hour and 71% within 24 hours. For a sailing cancelled two hours before departure, an hour is too slow: people are already driving to the port.

My proposal, for discussion. I have not shown this to Ingrid and there is no budget for it yet.

Send the cancellation notice by SMS first, through Pingwell. Fall back to email when Pingwell has not returned a delivery receipt within 5 minutes.

What I worked out so far:

- Pingwell's send call is `POST https://api.pingwell.example/v2/messages` with a body like:

```json
{ "to": "+4791234567", "sender": "Saltline", "text": "Your 14:30 Brevik-Holm sailing is cancelled. Options: https://sl.example/r/SL-88213" }
```

- One SMS is 160 characters. The message above fits. Anything longer is billed as two.
- Price on their volume tier is EUR 0.045 per SMS. At last year's volume, about 31,000 cancellation notices, that is roughly EUR 1,400 a year.
- Pingwell returns a delivery receipt on a webhook, `POST /hooks/pingwell/receipt`, with `status` one of `delivered`, `failed`, `expired`.
- We hold a mobile number for 83% of bookings. The other 17% would get email only, as today.
- Sender names need registering per country. Norway takes about 10 working days.

I would keep the email as it is and add the SMS in front of it.

Two things I could not answer: whether we are allowed to text passengers who did not tick the marketing box (I think a service message is fine but Legal should say), and who would own the Pingwell account.
