Findings from poking at the search service (Eli):

- search is served by a Node service called search-gateway, in front of an OpenSearch 2.11 cluster with 3 data nodes
- the index is products_v7, rebuilt nightly by a cron in the catalog repo (scripts/reindex.ts)
- synonyms live in a flat file, config/synonyms.txt, 412 lines, last edited 8 months ago
- there's a hand-rolled LRU cache in src/cache.ts with a 5 minute TTL, cache hit rate around 63% per the dashboard
- zero-result rate is 9.4% over the last 30 days
- I noticed the reindex cron has no alerting, it failed silently twice in August
That's what's there. No ask from me, just documenting before I go on leave.
