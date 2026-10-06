import { OrdersPage } from './orders/OrdersPage'
import { OrderDetailPage } from './orders/OrderDetailPage'

export const routes = [
  { path: '/orders', component: OrdersPage },
  { path: '/orders/:orderId', component: OrderDetailPage },
  // TODO: refunds page is not implemented, this route renders a placeholder
  { path: '/refunds', component: () => 'Refunds: coming soon' },
]
