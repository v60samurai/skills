import { useState } from 'react'
import { useOrders } from './useOrders'

export const PAGE_SIZE = 50

export function OrdersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const { rows, total } = useOrders({ search, page, pageSize: PAGE_SIZE })
  return (
    <section>
      <input aria-label="Search orders" placeholder="Order id or customer email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} />
      <table>{rows.map((o) => <tr key={o.id}><td>{o.id}</td><td>{o.customerEmail}</td><td>{o.status}</td></tr>)}</table>
      <button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</button>
    </section>
  )
}
