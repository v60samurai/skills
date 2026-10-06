Thread: #inventory-sync

Ravi (eng): the stock sync job currently runs once a week on Sunday 02:00 UTC.
Mei (ops lead, owns the sync schedule): we've had three oversell incidents this month because of stale stock.
Ravi: maybe we can run this every night? would probably fix most of it
Mei: could be. I'd want to see the warehouse API rate limits first before agreeing to anything.
Ravi: fair. alternatively we could do hourly for the top 100 SKUs only
Mei: one thing I will decide now: the sync must write an audit row for every SKU it changes. That's approved, I own it, do it.
Ravi: ack, audit row per changed SKU.
