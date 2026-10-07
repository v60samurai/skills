# Passenger notices

Status: shipped in June.

Harbor Desk sends passenger notices by email only. Each notice is a template in `src/notices/noticeTemplates.ts`. Delivery goes through the shared mail relay, which retries three times and then gives up.

There is no SMS channel and no record of whether a passenger opened a notice.
