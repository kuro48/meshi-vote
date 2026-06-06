import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRoomRealtime(roomCode: string | null, roomId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!roomId || !roomCode) return

    const invalidateRoom = () => queryClient.invalidateQueries({ queryKey: ['room', roomCode] })
    const invalidateRestaurants = () => queryClient.invalidateQueries({ queryKey: ['restaurants', roomCode] })
    const invalidateVotes = () => queryClient.invalidateQueries({ queryKey: ['votes', roomCode] })
    const invalidateOrders = () => queryClient.invalidateQueries({ queryKey: ['orders', roomCode] })

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, invalidateRoom)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` }, invalidateRoom)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants', filter: `room_id=eq.${roomId}` }, invalidateRestaurants)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, invalidateVotes)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `room_id=eq.${roomId}` }, invalidateOrders)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, roomCode, queryClient])
}
