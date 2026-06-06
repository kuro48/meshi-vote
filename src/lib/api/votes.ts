import { apiRequest } from './client'
import type { Vote } from '@/types/domain'

export const getVotes = (code: string) =>
  apiRequest<{ votes: Vote[] }>(`/rooms/${code}/votes`)

export const castVote = (code: string, restaurant_id: string) =>
  apiRequest<{ success: boolean }>(`/rooms/${code}/votes`, {
    method: 'POST',
    body: JSON.stringify({ restaurant_id }),
  })
