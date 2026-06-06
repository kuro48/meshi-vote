import type { MiddlewareHandler } from 'hono'
import { supabase } from '../lib/supabase.ts'

export interface AuthParticipant {
  id: string
  nickname: string
  role: 'host' | 'representative' | 'voter'
  room_id: string
  room: {
    id: string
    code: string
    phase: string
    host_token: string
    winning_restaurant_id: string | null
  }
}

export type AppVariables = { participant: AuthParticipant }

export const participantAuth: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  const token = c.req.header('X-Participant-Token')
  const code = c.req.param('code')

  if (!token || !code) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: participantData } = await supabase
    .from('participants')
    .select('id, nickname, role, room_id')
    .eq('token', token)
    .single()

  if (!participantData) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: roomData } = await supabase
    .from('rooms')
    .select('id, code, phase, host_token, winning_restaurant_id')
    .eq('id', participantData.room_id as string)
    .eq('code', code)
    .single()

  if (!roomData) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const participant: AuthParticipant = {
    id: participantData.id as string,
    nickname: participantData.nickname as string,
    role: participantData.role as 'host' | 'representative' | 'voter',
    room_id: participantData.room_id as string,
    room: {
      id: roomData.id as string,
      code: roomData.code as string,
      phase: roomData.phase as string,
      host_token: roomData.host_token as string,
      winning_restaurant_id: roomData.winning_restaurant_id as string | null,
    },
  }

  c.set('participant', participant)
  await next()
}
