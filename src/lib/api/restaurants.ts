import { apiRequest } from './client'
import type { Restaurant } from '@/types/domain'

export interface AddRestaurantInput {
  name: string
  address?: string
  photo_url?: string
  google_place_id?: string
  is_delivery?: boolean
  external_url?: string
}

export const getRestaurants = (code: string) =>
  apiRequest<{ restaurants: Restaurant[] }>(`/rooms/${code}/restaurants`)

export const addRestaurant = (code: string, data: AddRestaurantInput) =>
  apiRequest<{ restaurant: Restaurant }>(`/rooms/${code}/restaurants`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const deleteRestaurant = (code: string, restaurantId: string) =>
  apiRequest<{ success: boolean }>(`/rooms/${code}/restaurants/${restaurantId}`, {
    method: 'DELETE',
  })
