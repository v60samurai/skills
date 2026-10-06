Forwarding Nadia's proposal for the search indexing rework so the platform team has it. Nothing here is approved. Tomas (who owns search and would have to approve) has read it and said only "interesting, let's discuss next cycle".

The one thing that IS decided, by Tomas, last month: the nightly full reindex stays until a replacement has run in parallel for 30 days.

Current state, measured by Nadia:
- Full reindex runs nightly at 01:00 UTC and takes 3h 40m.
- A product edit takes up to 24 hours to appear in search.
- 6% of support contacts from merchants last quarter were "my change isn't showing".

NADIA'S PROPOSAL

1. Change stream. Read product changes from the database's logical replication slot instead of scanning tables. One slot named `search_cdc`.

2. Outbox table. For changes that need joined data (price plus stock plus category), write an outbox row in the same transaction:

```sql
CREATE TABLE search_outbox (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('upsert', 'delete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

3. Indexer worker. A single consumer that batches up to 500 changes or 2 seconds, whichever comes first, builds the documents and bulk-writes them to the index.

4. Idempotency. Each document write carries the outbox `id` as its version, using external versioning, so a replayed batch cannot overwrite a newer document.

5. Dead letters. A document that fails three times goes to `search_dead_letter` with the error, and an alert fires when the table has more than 100 rows.

6. Blue/green index. Writes go to an alias `products_write`, reads from `products_read`. A schema change builds a new index behind the write alias and flips the read alias when counts match within 0.1%.

7. Backfill. A one-off job that walks the products table in id order, 10,000 rows per batch, throttled to keep index CPU under 60%.

8. Parallel run. Run the new pipeline into a shadow index for 30 days and compare document counts and a sample of 1,000 documents daily against the nightly index.

9. Target. Nadia's target is an edit visible in search within 60 seconds at p95. She called this "a goal, not a promise".

Risks Nadia listed herself:
- The replication slot can fill the disk if the consumer stops. She suggests an alert at 5 GB of retained WAL.
- The single consumer is a throughput ceiling. She estimates it holds to about 2,000 changes per second.

Not addressed in the proposal: who runs it on call, and what it costs.
