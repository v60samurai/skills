import { describe, it, expect } from 'vitest'
import { FixtureOrdersRepository } from './ordersRepository'

const repo = new FixtureOrdersRepository([
  { id: 'ORD-1001', customerEmail: 'ana@example.com', totalCents: 4200, createdAt: '2025-03-01', status: 'paid' },
  { id: 'ORD-1002', customerEmail: 'ben@example.com', totalCents: 900, createdAt: '2025-03-02', status: 'shipped' },
])

describe('orders search', () => {
  it('matches on order id', async () => { expect((await repo.list({ search: '1001', page: 0, pageSize: 50 })).total).toBe(1) })
  it('matches on customer email', async () => { expect((await repo.list({ search: 'ben@', page: 0, pageSize: 50 })).total).toBe(1) })
  it('lists newest first', async () => { expect((await repo.list({ page: 0, pageSize: 50 })).rows[0].id).toBe('ORD-1002') })
})
