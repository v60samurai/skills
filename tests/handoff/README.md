# Handoff qualification

Run the structural suite from the repository root:

```sh
node --test tests/handoff/structure.test.mjs
```

This checks bundle integrity and illustrative contracts. It does not launch a model or qualify routing. No BUILD lifecycle engine or runtime validator is installed.

`cases.json` contains prompts, setup requirements and independent judging criteria for model/runtime runs. An evaluation runner must provision the named project context and actual owner sources. Give the model only the prompt, candidate and project, withholding judging criteria. Use fresh context for each case. Capture actual tools and owner read events, not the model's claims about what it loaded.

Record each run's model/environment/version, host, candidate revision/hash, owner revisions, fixture baseline, tool/transcript log path, output paths and individual verdicts. Reading a stub can test path resolution but cannot prove the real owner's domain work. A native Cursor blocked/unavailable result remains blocked, not inferred success.

All cases require preservation of unrelated user work and no merge. For cases ending at handoff, application-code edits are forbidden. The explicit native-runtime case continues separately in fresh Cursor to prove engineering consumption, independent review and PR communication/mechanics. The evaluator must keep those two phases separate.

Inspect evidence inventories for loss and duplication. Dense material can produce long evidence; there is no maximum length test. The retention criterion is each unique material item. Existing recoverable truth and prior handoffs should remain references rather than copied bodies.

The dense preservation case uses [preservation-source.md](fixtures/preservation-source.md) and the withheld [13-item inventory](fixtures/preservation-inventory.json). The delta case uses immutable [prior-evidence.md](fixtures/prior-evidence.md) with [delta-source.md](fixtures/delta-source.md). Copy source fixtures into the disposable case repository; never give the judging inventory to the author. The executable larger regression in the dotfiles qualification harness additionally generates 1,800 prior lines and measures semantic retention and duplication.
