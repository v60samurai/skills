export type Sailing = { id: string; route: string; departsAt: string; cancelled: boolean; footRemaining: number; laneMetresRemaining: number }

// Reads remaining capacity from the port control system.
// GET /v1/sailings/{sailing_id}/capacity -> { foot_remaining, lane_metres_remaining }
export async function capacity(baseUrl: string, sailingId: string): Promise<{ footRemaining: number; laneMetresRemaining: number }> {
  const res = await fetch(`${baseUrl}/v1/sailings/${sailingId}/capacity`)
  if (!res.ok) throw new Error(`capacity ${sailingId}: ${res.status}`)
  const body = await res.json()
  return { footRemaining: body.foot_remaining, laneMetresRemaining: body.lane_metres_remaining }
}
