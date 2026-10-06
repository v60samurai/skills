From the pricing integration notes (author: Noor, backend)

Endpoint we call:
POST /v2/quotes
{
  "sku": "BK-2041",
  "quantity": 3,
  "currency": "EUR",
  "customer_tier": "gold"
}

Response on success is 200 with {"quote_id": "q_81f3", "unit_price_minor": 4599, "expires_in_s": 900}.
If quantity > 50 the API returns 422 with error text "quantity_exceeds_limit".
Quotes expire after 900 seconds. We measured p95 latency at 340 ms over 10k calls last week.
customer_tier accepts exactly: "standard", "silver", "gold".
Discount rule confirmed by the pricing owner (Ivo) in the doc: gold gets 12% off, silver 5%, standard 0%.
