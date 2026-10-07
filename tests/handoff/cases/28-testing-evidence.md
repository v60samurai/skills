QA notes for the bulk move upload, from Chiara, agreed with Ingrid on Wednesday. Ingrid approved the feature itself last week: after a cancellation an agent uploads a CSV of `booking_reference,sailing_id` pairs and Harbor Desk moves each booking to the named sailing. The flow is upload, validate, enqueue, process. This note is only about how we check it. Hand it off.

How we test it, in this order. Ingrid wants every one of these done by a person in Harbor Desk on staging, and written down.

1. Invalid pairs are caught before anything is enqueued. Upload files that contain each of these and confirm the whole file is refused, with the row number, and that the queue stays empty:
   - a booking reference that does not exist
   - a sailing id that does not exist
   - a sailing on a different route from the booking
   - a sailing that has already departed
   - the same booking reference on two rows
2. The first real run is small: 15 to 20 bookings, all on the Brevik-Holm route. No larger file until that run is clean.
3. For every booking in that run, compare what the API returns from `GET /v1/bookings/{booking_reference}` with what the booking page in Harbor Desk shows. Compare four things: the sailing id, the departure time, the vehicle class and the booking status.
4. Every difference found in step 3 goes into exactly one of five buckets, and we count them per bucket:
   - `stale_page`: the API is right and the page shows the old sailing until reload
   - `wrong_sailing`: the booking was moved to a sailing other than the one in the file
   - `capacity_overrun`: the move went through although the sailing had no space
   - `notice_missing`: the booking moved and the passenger got no `booking_moved` email
   - `status_stuck`: the booking moved and its status still reads `cancelled_sailing`
5. Only after two clean runs on two consecutive days does Chiara sign it off, and only then do we try a file of 200 rows.

Examples Ingrid and I agreed as what "works" looks like:

- A file of 18 valid rows: 18 bookings moved, 18 `booking_moved` emails, and the summary line reads "18 moved, 0 failed".
- A file where row 7 names a sailing on another route: the whole file is refused with "Row 7: sailing BH-2291 is not on this booking's route", and zero rows are enqueued.
- A file of 501 rows is refused with "Maximum 500 rows per file".
- Uploading the same file twice moves nothing the second time. Each row reports "already on this sailing".
- A file with a header row and no data rows is refused with "No bookings in file".

One thing we have not settled: when a sailing fills up halfway through a file, do the remaining rows fail one by one, or does the whole file roll back? Ingrid wants to think about it.
