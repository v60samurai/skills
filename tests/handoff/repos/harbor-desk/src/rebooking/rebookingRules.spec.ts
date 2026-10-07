import { expect, test } from 'vitest'
import { eligibleSailings, REBOOK_WINDOW_HOURS } from './rebookingRules'

const sailing = (id: string, departsAt: string, extra = {}) =>
  ({ id, route: 'brevik-holm', departsAt, cancelled: false, footRemaining: 100, laneMetresRemaining: 50, ...extra })
const booking = { reference: 'SL-88213', route: 'brevik-holm', departsAt: '2026-06-01T08:00:00Z', passengers: 2 }

test('the window is 48 hours', () => {
  expect(REBOOK_WINDOW_HOURS).toBe(48)
})

test('a sailing 49 hours later is not offered', () => {
  const found = eligibleSailings(booking, [sailing('a', '2026-06-02T08:00:00Z'), sailing('b', '2026-06-03T09:00:00Z')])
  expect(found.map((s) => s.id)).toEqual(['a'])
})

test('a van needs 6 lane metres', () => {
  const found = eligibleSailings({ ...booking, vehicle: 'van' }, [sailing('a', '2026-06-01T12:00:00Z', { laneMetresRemaining: 5.5 })])
  expect(found).toEqual([])
})
