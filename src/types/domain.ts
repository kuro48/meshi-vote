export type Phase =
  | 'waiting'
  | 'representatives'
  | 'restaurants'
  | 'voting'
  | 'order'
  | 'finished'

export type ParticipantRole = 'host' | 'representative' | 'voter'

export interface Room {
  id: string
  code: string
  host_token: string
  phase: Phase
  winning_restaurant_id: string | null
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  expires_at: string
  created_at: string
}

export interface Participant {
  id: string
  room_id: string
  nickname: string
  role: ParticipantRole
  created_at: string
}

export interface Restaurant {
  id: string
  room_id: string
  added_by_id: string
  name: string
  address: string | null
  photo_url: string | null
  google_place_id: string | null
  is_delivery: boolean
  external_url: string | null
  created_at: string
}

export interface Vote {
  restaurant_id: string
  participant_id: string
}

export interface Order {
  id: string
  room_id: string
  participant_id: string
  order_text: string
  created_at: string
  participants?: { nickname: string } | null
}

export interface PlaceResult {
  id: string
  name: string
  address: string
  priceLevel: number | null
}
