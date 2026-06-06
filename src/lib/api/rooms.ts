import { apiRequest } from './client'
import type { Room, Participant } from '@/types/domain'

export interface RoomResponse {
  room: Room
  participant: Participant & { token: string }
}

export interface RoomDetailResponse {
  room: Room
  participants: Participant[]
}

export const createRoom = (nickname: string) =>
  apiRequest<RoomResponse>('/rooms', {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  })

export const joinRoom = (code: string, nickname: string) =>
  apiRequest<RoomResponse>(`/rooms/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ nickname }),
  })

export const getRoom = (code: string) =>
  apiRequest<RoomDetailResponse>(`/rooms/${code}`)

export const advancePhase = (code: string, phase: string, winning_restaurant_id?: string) =>
  apiRequest<{ room: Room }>(`/rooms/${code}/phase`, {
    method: 'PATCH',
    body: JSON.stringify({ phase, winning_restaurant_id }),
  })

export const setRepresentatives = (code: string, participantIds: string[]) =>
  apiRequest<{ participants: Participant[] }>(`/rooms/${code}/representatives`, {
    method: 'POST',
    body: JSON.stringify({ participantIds }),
  })
