// Staff SSO session handling. Unrelated to the orders pages.
export function currentStaffId(): string | null { return globalThis.sessionStorage?.getItem('staff_id') ?? null }
