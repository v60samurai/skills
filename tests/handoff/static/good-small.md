# Handoff: Cancellation email subject line
Handoff. Evidence, not truth. Compiled by /handoff.
Handoff id: 20261007-101544-cancellation-email-subject-line
Created: 2026-10-07T10:15:44Z
Repository: harbor-desk
Branch: notices/subject
Baseline: 0a1b2c3d4e5f60718293a4b5c6d7e8f901234567
Working tree: dirty: 1 modified, 2 untracked; overlaps the subject: yes
Depth: SMALL
Mode: NEW
Previous handoff: none
Build Flow spec: several (deck-planner, disruption-rebooking)
Sources: 2 (1 file, 1 pasted)
Source hashes: notes/legal-reply.md sha256 3b7e5c0f9a1d42e68b0c7f5a9e3d1c2b4a6f8e0d1c3b5a7f9e0d2c4b6a8f0e1d; pasted text, not hashed
Material information loss: LOW: the source's second attachment was an image and was not read
Ready for Build Flow: NO: the approved body text, which the source says is still with Legal

## Repository status quo

- The `sailing_cancelled` template in `src/notices/noticeTemplates.ts` has the subject "Your sailing has been cancelled".
- Local uncommitted delta: `src/notices/noticeTemplates.ts` is modified and changes that subject line. It is not part of the baseline.

## Approved decisions

- Oda (Legal) approved the subject line "Your sailing is cancelled: choose a new one" for the `sailing_cancelled` notice, from 1 November.

## Open questions

- The new body text. Oda has not approved it. The source says she is still reading it.

> Oda wrote: we should probably also look at the SMS wording, see the meeting notes for my comments.

SOURCE RECOMMENDATION: the source's own plan lists these, and they are the source's, not a plan:

- M1-T1 change the subject
- M1-T2 change the body, READY once Legal replies

```text
Next:
Run the Build Flow using this handoff.
```
