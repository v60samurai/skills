Notes from the loyalty migration check-in, for the team taking it over. The runbook they mention is pasted underneath.

- Greta (owns loyalty) confirmed we are moving points balances from the old ledger to the new wallet service this quarter.
- Balances must match to the point. Any mismatch blocks cutover.
- Cutover window is a Sunday night, date not picked.
- The full implementation plan is in "Loyalty Migration Runbook v3". Follow that.
- Open: do expired points migrate?

---

LOYALTY MIGRATION RUNBOOK v3 (author: Stefan, reviewed by Greta)

Cutover steps

1. T-60 min: announce in #loyalty-ops and set the maintenance banner in the app.
2. T-0: set feature flag `loyalty_writes_enabled` to `false`. Earning and redeeming stop. Balance reads keep working from the old ledger.
3. Wait for the ledger write queue to drain to 0. Expected under 5 minutes.
4. Run the export job `ledger_export --snapshot`. It writes one row per member to `wallet_staging.balances`.
5. Run the import: `wallet-admin import --from wallet_staging.balances --batch 5000`.
6. Run both reconciliation queries below. Both must return zero rows.
7. Set `loyalty_read_source` to `wallet`.
8. Set `loyalty_writes_enabled` back to `true`. Writes now go to the wallet.
9. Remove the maintenance banner and announce completion.

Reconciliation queries

```sql
-- members whose balances differ
SELECT l.member_id FROM ledger_snapshot l
JOIN wallet.balances w USING (member_id)
WHERE l.points <> w.points;

-- members missing on either side
SELECT member_id FROM ledger_snapshot
EXCEPT SELECT member_id FROM wallet.balances;
```

Rollback

- Rollback is possible only until step 8. Once writes go to the wallet, the old ledger is stale.
- After step 8 there is a 15 minute window in which the wallet's write log can still be replayed into the ledger with `wallet-admin replay --to ledger`. After 15 minutes the replay tool refuses, because ledger compaction runs.
- To roll back before step 8: set `loyalty_read_source` to `ledger`, set `loyalty_writes_enabled` to `true`, truncate `wallet.balances`.

Limits

- The import must finish within the 2 hour window. The dry run on staging took 38 minutes for 4.1 million members.
- Do not run during the last three days of a month: the partner statement job reads the ledger.
