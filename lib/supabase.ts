// lib/supabase.ts — REEMPLAZA el archivo existente

import { createClient } from '@supabase/supabase-js'
import { User, UserAlbum, TradeRecord, Notification } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null

// ─── Users ───────────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('users').select('*').order('created_at')
  if (error) { console.error('fetchUsers:', error); return [] }
  return (data || []).map((u: any) => ({
    id: u.id, name: u.name, avatar: u.avatar, pin: u.pin,
    isAdmin: u.is_admin || false, createdAt: u.created_at,
  }))
}

export async function upsertUser(user: User): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('users').upsert({
    id: user.id, name: user.name, avatar: user.avatar, pin: user.pin,
    is_admin: user.isAdmin || false, created_at: user.createdAt,
  })
  if (error) console.error('upsertUser:', error)
}

export async function deleteUserRemote(userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('users').delete().eq('id', userId)
  if (error) console.error('deleteUser:', error)
}

// ─── Albums ──────────────────────────────────────────────────

export async function fetchAlbum(userId: string): Promise<UserAlbum | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('albums').select('data').eq('user_id', userId).maybeSingle()
  if (error) { console.error('fetchAlbum:', error); return null }
  return (data?.data as UserAlbum) || null
}

export async function fetchAllAlbums(): Promise<{ [userId: string]: UserAlbum }> {
  if (!supabase) return {}
  const { data, error } = await supabase.from('albums').select('user_id, data')
  if (error) { console.error('fetchAllAlbums:', error); return {} }
  const result: { [userId: string]: UserAlbum } = {}
  for (const row of data || []) result[row.user_id] = row.data as UserAlbum
  return result
}

export async function saveAlbum(userId: string, album: UserAlbum): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('albums').upsert({
    user_id: userId, data: album, updated_at: Date.now(),
  })
  if (error) console.error('saveAlbum:', error)
}

// ─── Trades ──────────────────────────────────────────────────

export async function fetchTrades(): Promise<TradeRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('trades').select('*').order('created_at', { ascending: false })
  if (error) { console.error('fetchTrades:', error); return [] }
  return (data || []).map((t: any) => ({
    id: t.id, fromUserId: t.from_user_id, toUserId: t.to_user_id,
    givenStickers: t.given_stickers || [], receivedStickers: t.received_stickers || [],
    status: t.status, timestamp: t.created_at, completed: t.status === 'completed',
  }))
}

export async function createTrade(trade: TradeRecord): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('trades').insert({
    id: trade.id, from_user_id: trade.fromUserId, to_user_id: trade.toUserId,
    given_stickers: trade.givenStickers, received_stickers: trade.receivedStickers,
    status: trade.status || 'pending', created_at: trade.timestamp, updated_at: Date.now(),
  })
  if (error) console.error('createTrade:', error)
}

export async function updateTradeStatus(tradeId: string, status: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('trades').update({ status, updated_at: Date.now() }).eq('id', tradeId)
  if (error) console.error('updateTradeStatus:', error)
}

// ─── Notifications ───────────────────────────────────────────

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('notifications')
    .select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30)
  if (error) { console.error('fetchNotifications:', error); return [] }
  return (data || []).map((n: any) => ({
    id: n.id, userId: n.user_id, type: n.type, title: n.title,
    message: n.message, data: n.data, read: n.read, createdAt: n.created_at,
  }))
}

export async function createNotification(n: Omit<Notification, 'createdAt'> & { createdAt?: number }): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('notifications').insert({
    id: n.id, user_id: n.userId, type: n.type, title: n.title,
    message: n.message, data: n.data || {}, read: n.read,
    created_at: n.createdAt || Date.now(),
  })
  if (error) console.error('createNotification:', error)
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) console.error('markNotificationRead:', error)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
  if (error) console.error('markAllNotificationsRead:', error)
}

// ─── Realtime ────────────────────────────────────────────────

export function subscribeToTrades(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('trades-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, callback).subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function subscribeToAlbums(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('albums-ch').on('postgres_changes', { event: '*', schema: 'public', table: 'albums' }, callback).subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function subscribeToNotifications(userId: string, callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel(`notif-${userId}`).on('postgres_changes', {
    event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`
  }, callback).subscribe()
  return () => { supabase.removeChannel(channel) }
}
