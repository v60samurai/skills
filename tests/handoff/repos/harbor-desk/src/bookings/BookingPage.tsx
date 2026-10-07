import { useState } from 'react'
import { eligibleSailings, type Booking } from '../rebooking/rebookingRules'
import type { Sailing } from '../sailings/capacityClient'

// One booking. After a cancellation the agent picks a new sailing by hand.
export function BookingPage({ booking, sailings, onMove }: { booking: Booking; sailings: Sailing[]; onMove(sailingId: string): void }) {
  const [open, setOpen] = useState(false)
  const options = eligibleSailings(booking, sailings)
  return (
    <section>
      <h1>Booking {booking.reference}</h1>
      <button onClick={() => setOpen(true)}>Move booking</button>
      {open && (options.length === 0
        ? <p>No sailing with space in the next 48 hours.</p>
        : <ul>{options.map((s) => <li key={s.id}><button onClick={() => onMove(s.id)}>{s.departsAt}</button></li>)}</ul>)}
    </section>
  )
}
