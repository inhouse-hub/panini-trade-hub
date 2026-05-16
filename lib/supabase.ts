// lib/supabase.ts
// Cliente Supabase + helpers de sincronización
//
// Las credenciales van en .env.local (para dev) o en Vercel env vars (para prod):
//   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

import { createClient } from '@supabase/supabase-js'
import { User, UserAlbum, TradeRecord } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Modo offline si no hay credenciales (para desarrollo inicial)
export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null

// ─── Helpers de usuarios ─────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('users').select('*').order('created_at')
  if (error) {
    console.error('fetchUsers error:', error)
    return []
  }
  return (data || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    pin: u.pin,
    createdAt: u.created_at,
  }))
}

export async function upsertUser(user: User): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('users').upsert({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    pin: user.pin,
    created_at: user.createdAt,
  })
  if (error) console.error('upsertUser error:', error)
}

export async function deleteUserRemote(userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('users').delete().eq('id', userId)
  if (error) console.error('deleteUser error:', error)
}

// ─── Helpers de álbumes ──────────────────────────────────────

export async function fetchAlbum(userId: string): Promise<UserAlbum | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('albums').select('data').eq('user_id', userId).maybeSingle()
  if (error) {
    console.error('fetchAlbum error:', error)
    return null
  }
  return (data?.data as UserAlbum) || null
}

export async function fetchAllAlbums(): Promise<{ [userId: string]: UserAlbum }> {
  if (!supabase) return {}
  const { data, error } = await supabase.from('albums').select('user_id, data')
  if (error) {
    console.error('fetchAllAlbums error:', error)
    return {}
  }
  const result: { [userId: string]: UserAlbum } = {}
  for (const row of data || []) {
    result[row.user_id] = row.data as UserAlbum
  }
  return result
}

export async function saveAlbum(userId: string, album: UserAlbum): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('albums').upsert({
    user_id: userId,
    data: album,
    updated_at: Date.now(),
  })
  if (error) console.error('saveAlbum error:', error)
}

// ─── Helpers de trades ───────────────────────────────────────

export async function fetchTrades(): Promise<TradeRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('trades').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('fetchTrades error:', error)
    return []
  }
  return (data || []).map((t: any) => ({
    id: t.id,
    fromUserId: t.from_user_id,
    toUserId: t.to_user_id,
    givenStickers: t.given_stickers || [],
    receivedStickers: t.received_stickers || [],
    status: t.status,
    timestamp: t.created_at,
    completed: t.status === 'completed',
  }))
}

export async function createTrade(trade: TradeRecord): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('trades').insert({
    id: trade.id,
    from_user_id: trade.fromUserId,
    to_user_id: trade.toUserId,
    given_stickers: trade.givenStickers,
    received_stickers: trade.receivedStickers,
    status: trade.status || 'pending',
    created_at: trade.timestamp,
    updated_at: Date.now(),
  })
  if (error) console.error('createTrade error:', error)
}

export async function updateTradeStatus(tradeId: string, status: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('trades').update({ status, updated_at: Date.now() }).eq('id', tradeId)
  if (error) console.error('updateTradeStatus error:', error)
}

// ─── Realtime subscriptions ──────────────────────────────────

export function subscribeToTrades(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel('trades-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, callback)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToAlbums(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel('albums-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'albums' }, callback)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
