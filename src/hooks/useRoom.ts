import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getRoom, type RoomDetailResponse } from '@/lib/api/rooms'

export function useRoomQuery() {
  const { code } = useParams<{ code: string }>()

  return useQuery<RoomDetailResponse>({
    queryKey: ['room', code],
    queryFn: () => getRoom(code!),
    enabled: !!code,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  })
}
