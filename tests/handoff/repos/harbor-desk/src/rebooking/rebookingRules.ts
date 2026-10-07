import type { Sailing } from '../sailings/capacityClient'

// A cancelled booking may move to a sailing on the same route that departs
// within this many hours of the original departure.
export const REBOOK_WINDOW_HOURS = 48

// Lane metres a vehicle takes on the deck. Trucks are not bookable online yet.
export const LANE_METRES = { motorcycle: 1.0, car: 4.5, van: 6.0 } as const
export type VehicleClass = keyof typeof LANE_METRES

export type Booking = { reference: string; route: string; departsAt: string; passengers: number; vehicle?: VehicleClass }

export function eligibleSailings(booking: Booking, sailings: Sailing[]): Sailing[] {
  const from = Date.parse(booking.departsAt)
  const until = from + REBOOK_WINDOW_HOURS * 3600_000
  return sailings
    .filter((s) => s.route === booking.route && !s.cancelled)
    .filter((s) => Date.parse(s.departsAt) > from && Date.parse(s.departsAt) <= until)
    .filter((s) => s.footRemaining >= booking.passengers)
    .filter((s) => !booking.vehicle || s.laneMetresRemaining >= LANE_METRES[booking.vehicle])
    .sort((a, b) => a.departsAt.localeCompare(b.departsAt))
}
