export type Order = { id: string; customerEmail: string; totalCents: number; createdAt: string; status: 'paid' | 'shipped' | 'cancelled' }
export type OrderQuery = { search?: string; page: number; pageSize: number }

export interface OrdersRepository {
  list(query: OrderQuery): Promise<{ rows: Order[]; total: number }>
  get(id: string): Promise<Order | null>
}

// The only implementation today. Reads src/orders/fixtures/orders.json.
export class FixtureOrdersRepository implements OrdersRepository {
  constructor(private orders: Order[]) {}
  async list({ search, page, pageSize }: OrderQuery) {
    const q = search?.toLowerCase()
    const rows = this.orders
      .filter((o) => !q || o.id.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { rows: rows.slice(page * pageSize, (page + 1) * pageSize), total: rows.length }
  }
  async get(id: string) { return this.orders.find((o) => o.id === id) ?? null }
}
