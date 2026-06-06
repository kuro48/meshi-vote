import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { supabase } from './lib/supabase.ts'
import { participantAuth, type AppVariables } from './middleware/auth.ts'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PRICE_LEVELS: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
    const { data } = await supabase.from('rooms').select('id').eq('code', code).maybeSingle()
    if (!data) return code
  }
  throw new Error('Failed to generate unique room code')
}

const app = new Hono<{ Variables: AppVariables }>()
app.use('/api/*', cors())

// ── Rooms ──────────────────────────────────────────────────────────────────

app.post('/api/rooms', async (c) => {
  try {
    const body = await c.req.json<{ nickname: string }>()
    if (!body.nickname?.trim()) return c.json({ error: 'nickname is required' }, 400)

    const code = await generateUniqueCode()
    const hostToken = crypto.randomUUID()

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({ code, host_token: hostToken, phase: 'waiting' })
      .select()
      .single()

    if (roomErr || !room) return c.json({ error: roomErr?.message ?? 'Failed to create room' }, 500)

    const { data: participant, error: partErr } = await supabase
      .from('participants')
      .insert({ room_id: room.id, nickname: body.nickname.trim(), token: hostToken, role: 'host' })
      .select()
      .single()

    if (partErr || !participant) return c.json({ error: partErr?.message ?? 'Failed to create participant' }, 500)

    return c.json({ room, participant }, 201)
  } catch {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

app.get('/api/rooms/:code', async (c) => {
  const code = c.req.param('code').toUpperCase()

  const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single()
  if (!room) return c.json({ error: 'Room not found' }, 404)

  const { data: participants } = await supabase
    .from('participants').select('*').eq('room_id', room.id).order('created_at')

  return c.json({ room, participants: participants ?? [] })
})

app.post('/api/rooms/:code/join', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()
    const body = await c.req.json<{ nickname: string }>()
    if (!body.nickname?.trim()) return c.json({ error: 'nickname is required' }, 400)

    const { data: room } = await supabase
      .from('rooms').select('id, code, phase').eq('code', code).single()

    if (!room) return c.json({ error: 'Room not found' }, 404)
    if (room.phase === 'finished') return c.json({ error: 'This room has already ended' }, 400)

    const token = crypto.randomUUID()

    const { data: participant, error } = await supabase
      .from('participants')
      .insert({ room_id: room.id, nickname: body.nickname.trim(), token, role: 'voter' })
      .select()
      .single()

    if (error || !participant) return c.json({ error: error?.message ?? 'Failed to join' }, 500)

    return c.json({ room, participant }, 201)
  } catch {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

app.patch('/api/rooms/:code/phase', participantAuth, async (c) => {
  const participant = c.get('participant')
  if (participant.role !== 'host') return c.json({ error: 'Only host can change phase' }, 403)

  try {
    const body = await c.req.json<{ phase: string; winning_restaurant_id?: string }>()

    const updateData: Record<string, unknown> = { phase: body.phase }
    if (body.winning_restaurant_id) updateData.winning_restaurant_id = body.winning_restaurant_id

    const { data: room, error } = await supabase
      .from('rooms').update(updateData).eq('id', participant.room.id).select().single()

    if (error || !room) return c.json({ error: error?.message ?? 'Update failed' }, 500)

    return c.json({ room })
  } catch {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

app.post('/api/rooms/:code/representatives', participantAuth, async (c) => {
  const participant = c.get('participant')
  if (participant.role !== 'host') return c.json({ error: 'Only host can set representatives' }, 403)

  try {
    const { participantIds } = await c.req.json<{ participantIds: string[] }>()

    await supabase
      .from('participants')
      .update({ role: 'voter' })
      .eq('room_id', participant.room.id)
      .neq('role', 'host')

    if (participantIds.length > 0) {
      await supabase
        .from('participants')
        .update({ role: 'representative' })
        .in('id', participantIds)
        .eq('room_id', participant.room.id)
    }

    const { data: participants } = await supabase
      .from('participants').select('*').eq('room_id', participant.room.id)

    return c.json({ participants: participants ?? [] })
  } catch {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// ── Restaurants ────────────────────────────────────────────────────────────

app.get('/api/rooms/:code/restaurants', async (c) => {
  const code = c.req.param('code').toUpperCase()

  const { data: room } = await supabase.from('rooms').select('id').eq('code', code).single()
  if (!room) return c.json({ error: 'Room not found' }, 404)

  const { data: restaurants } = await supabase
    .from('restaurants').select('*').eq('room_id', room.id).order('created_at')

  return c.json({ restaurants: restaurants ?? [] })
})

app.post('/api/rooms/:code/restaurants', participantAuth, async (c) => {
  const participant = c.get('participant')
  if (!['host', 'representative'].includes(participant.role)) {
    return c.json({ error: 'Only representatives can add restaurants' }, 403)
  }

  try {
    const body = await c.req.json<{
      name: string
      address?: string
      photo_url?: string
      google_place_id?: string
      is_delivery?: boolean
      external_url?: string
    }>()

    if (!body.name?.trim()) return c.json({ error: 'name is required' }, 400)

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        room_id: participant.room.id,
        added_by_id: participant.id,
        name: body.name.trim(),
        address: body.address ?? null,
        photo_url: body.photo_url ?? null,
        google_place_id: body.google_place_id ?? null,
        is_delivery: body.is_delivery ?? false,
        external_url: body.external_url ?? null,
      })
      .select()
      .single()

    if (error || !restaurant) return c.json({ error: error?.message ?? 'Failed to add' }, 500)

    return c.json({ restaurant }, 201)
  } catch {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

app.delete('/api/rooms/:code/restaurants/:restaurantId', participantAuth, async (c) => {
  const participant = c.get('participant')
  const restaurantId = c.req.param('restaurantId')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('added_by_id')
    .eq('id', restaurantId)
    .eq('room_id', participant.room.id)
    .single()

  if (!restaurant) return c.json({ error: 'Restaurant not found' }, 404)

  if (participant.role !== 'host' && (restaurant.added_by_id as string) !== participant.id) {
    return c.json({ error: 'Cannot delete this restaurant' }, 403)
  }

  const { error } = await supabase.from('restaurants').delete().eq('id', restaurantId)
  if (error) return c.json({ error: error.message }, 500)

  return c.json({ success: true })
})

// ── Votes ──────────────────────────────────────────────────────────────────

app.get('/api/rooms/:code/votes', async (c) => {
  const code = c.req.param('code').toUpperCase()

  const { data: room } = await supabase.from('rooms').select('id').eq('code', code).single()
  if (!room) return c.json({ error: 'Room not found' }, 404)

  const { data: votes } = await supabase
    .from('votes').select('restaurant_id, participant_id').eq('room_id', room.id)

  return c.json({ votes: votes ?? [] })
})

app.post('/api/rooms/:code/votes', participantAuth, async (c) => {
  const participant = c.get('participant')

  try {
    const { restaurant_id } = await c.req.json<{ restaurant_id: string }>()

    const { error } = await supabase
      .from('votes')
      .upsert(
        { room_id: participant.room.id, participant_id: participant.id, restaurant_id },
        { onConflict: 'room_id,participant_id' }
      )

    if (error) return c.json({ error: error.message }, 500)

    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// ── Orders ─────────────────────────────────────────────────────────────────

app.get('/api/rooms/:code/orders', async (c) => {
  const code = c.req.param('code').toUpperCase()

  const { data: room } = await supabase.from('rooms').select('id').eq('code', code).single()
  if (!room) return c.json({ error: 'Room not found' }, 404)

  const { data: orders } = await supabase
    .from('orders')
    .select('*, participants(nickname)')
    .eq('room_id', room.id)
    .order('created_at')

  return c.json({ orders: orders ?? [] })
})

app.post('/api/rooms/:code/orders', participantAuth, async (c) => {
  const participant = c.get('participant')

  try {
    const { order_text } = await c.req.json<{ order_text: string }>()
    if (!order_text?.trim()) return c.json({ error: 'order_text is required' }, 400)

    const { error } = await supabase
      .from('orders')
      .upsert(
        { room_id: participant.room.id, participant_id: participant.id, order_text: order_text.trim() },
        { onConflict: 'room_id,participant_id' }
      )

    if (error) return c.json({ error: error.message }, 500)

    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Invalid request' }, 400)
  }
})

// ── Places ─────────────────────────────────────────────────────────────────

app.get('/api/places/nearby', async (c) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return c.json({ places: [] }, 200)

  const { lat, lng, radius = '1000' } = c.req.query()
  if (!lat || !lng) return c.json({ error: 'lat and lng are required' }, 400)

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.priceLevel',
      },
      body: JSON.stringify({
        includedTypes: ['restaurant'],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
            radius: parseFloat(radius),
          },
        },
      }),
    })

    if (!res.ok) return c.json({ places: [] }, 200)

    const data = await res.json() as { places?: unknown[] }
    const places = (data.places ?? []).map((p) => {
      const place = p as {
        id: string
        displayName: { text: string }
        formattedAddress: string
        priceLevel?: string
      }
      return {
        id: place.id,
        name: place.displayName?.text ?? '',
        address: place.formattedAddress ?? '',
        priceLevel: place.priceLevel ? (PRICE_LEVELS[place.priceLevel] ?? null) : null,
      }
    })

    return c.json({ places })
  } catch {
    return c.json({ places: [] }, 200)
  }
})

export default app
