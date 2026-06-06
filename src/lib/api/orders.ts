import { apiRequest } from './client'
import type { Order } from '@/types/domain'

export const getOrders = (code: string) =>
  apiRequest<{ orders: Order[] }>(`/rooms/${code}/orders`)

export const submitOrder = (code: string, order_text: string) =>
  apiRequest<{ success: boolean }>(`/rooms/${code}/orders`, {
    method: 'POST',
    body: JSON.stringify({ order_text }),
  })
