# Supplier complaint severity intake

The stakeholder owns the scope and confirms the following new product rules. Existing repository truth and the previous handoff remain recoverable and should be cited rather than copied.

Approved by the product owner for this feature:
- A report is a supplier complaint, not a customer refund request. The glossary must distinguish those terms.
- Critical complaints involving an immediate safety hazard must be visible to a human reviewer within 15 minutes.
- The severity result must expose its supporting complaint text and uncertainty. The system must allow a reviewer to change it.
- The first release accepts English complaints only. Multilingual support is out of scope.

Observed API contract from the supplied sandbox response:
- Complaint `C-1042` has `supplier_id: S-91`, `received_at: 2026-10-07T09:20:00Z`, and missing `order_id` represented by null.
- The upstream API returns HTTP 429 with `Retry-After: 30`. Retries must honor the observed contract.

Confirmed constraints:
- The source API permits 120 requests per minute per credential.
- Complaint content must not appear in public error logs.

Proposal, not approval:
- The analyst proposes using Jev for severity. No model/platform has been chosen. Deterministic logic, ordinary LLM, retrieval, classical ML, human review, Jev and hybrid approaches remain candidates where applicable.
- The analyst proposes automatic nightly publication, which would require external authority. No authorization to publish has been given.

Open human choices:
- The product owner has not decided whether the first release includes a reviewer's bulk override action. This is a scope choice, not an API fact.
- The stakeholder does not yet know whether moderation reasons may be shared with suppliers. Keep this question open and block only dependent work.

Testing expectation from the stakeholder:
- Demonstrate the boundary with two cases: an explicit immediate safety hazard and a complaint about a delayed invoice without safety language.

Prior evidence is `prior-evidence.md`. PRODUCT/TECH already hold the current queue and logging behavior. Preserve new material once, cite durable source facts, and keep provenance/epistemic distinctions. Do not implement shipping code.
