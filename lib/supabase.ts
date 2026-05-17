// lib/supabase.ts — REEMPLAZA el archivo existente

import { createClient } from '@supabase/supabase-js'
import { User, UserAlbum, TradeRecord, Notification, Chat, Message, TypingIndicator, FeedEvent, Reaction, FeedComment, UserAchievement } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null

// ─── Users ───────────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('users').select('*').order('created_at')
  if (error) { console.error('fetchUsers:', error); return [] }
  return (data || []).map((u: any) => ({
    id: u.id, name: u.name, avatar: u.avatar, avatarUrl: u.avatar_url || undefined,
    pin: u.pin, isAdmin: u.is_admin || false, createdAt: u.created_at,
  }))
}

export async function upsertUser(user: User): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('users').upsert({
    id: user.id, name: user.name, avatar: user.avatar,
    avatar_url: user.avatarUrl || null,
    pin: user.pin, is_admin: user.isAdmin || false, created_at: user.createdAt,
  })
  if (error) console.error('upsertUser:', error)
}

export async function deleteUserRemote(userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('users').delete().eq('id', userId)
  if (error) console.error('deleteUser:', error)
}

// ─── Storage: Avatars ────────────────────────────────────────

export async function uploadAvatar(userId: string, file: Blob): Promise<string | null> {
  if (!supabase) return null
  const fileName = `${userId}_${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    })
  if (error) { console.error('uploadAvatar:', error); return null }
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
  return urlData.publicUrl
}

// ─── Storage: Chat Images ────────────────────────────────────

export async function uploadChatImage(chatId: string, file: Blob): Promise<string | null> {
  if (!supabase) return null
  const fileName = `${chatId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`
  const { data, error } = await supabase.storage
    .from('chat-images')
    .upload(fileName, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    })
  if (error) { console.error('uploadChatImage:', error); return null }
  const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(data.path)
  return urlData.publicUrl
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

// ─── Public profile fetcher (sin auth) ──────────────────────

export async function fetchPublicProfile(userId: string): Promise<{ user: User; album: UserAlbum } | null> {
  if (!supabase) return null
  const [userRes, albumRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).maybeSingle(),
    supabase.from('albums').select('data').eq('user_id', userId).maybeSingle(),
  ])
  if (userRes.error || !userRes.data) return null
  const u = userRes.data
  return {
    user: {
      id: u.id, name: u.name, avatar: u.avatar, avatarUrl: u.avatar_url || undefined,
      pin: '', isAdmin: u.is_admin || false, createdAt: u.created_at,
    },
    album: (albumRes.data?.data as UserAlbum) || {},
  }
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

// ─── Chats ───────────────────────────────────────────────────

export async function fetchChats(userId: string): Promise<Chat[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('chats').select('*').order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) { console.error('fetchChats:', error); return [] }
  return (data || [])
    .filter((c: any) => Array.isArray(c.participants) && c.participants.includes(userId))
    .map((c: any) => ({
      id: c.id, type: c.type, name: c.name, participants: c.participants,
      createdAt: c.created_at, lastMessageAt: c.last_message_at,
      lastMessageText: c.last_message_text, lastMessageFrom: c.last_message_from,
    }))
}

export async function createChat(chat: Chat): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('chats').upsert({
    id: chat.id, type: chat.type, name: chat.name,
    participants: chat.participants, created_at: chat.createdAt,
    last_message_at: chat.lastMessageAt,
    last_message_text: chat.lastMessageText,
    last_message_from: chat.lastMessageFrom,
  })
  if (error) console.error('createChat:', error)
}

export async function updateChatLastMessage(chatId: string, text: string, fromUserId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('chats').update({
    last_message_at: Date.now(),
    last_message_text: text.slice(0, 100),
    last_message_from: fromUserId,
  }).eq('id', chatId)
  if (error) console.error('updateChatLastMessage:', error)
}

// ─── Messages ────────────────────────────────────────────────

export async function fetchMessages(chatId: string, limit = 50): Promise<Message[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('messages')
    .select('*').eq('chat_id', chatId).order('created_at', { ascending: false }).limit(limit)
  if (error) { console.error('fetchMessages:', error); return [] }
  return (data || []).map((m: any) => ({
    id: m.id, chatId: m.chat_id, fromUserId: m.from_user_id,
    text: m.text, imageUrl: m.image_url, deleted: m.deleted, createdAt: m.created_at,
  })).reverse()
}

export async function sendMessageRemote(msg: Message): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('messages').insert({
    id: msg.id, chat_id: msg.chatId, from_user_id: msg.fromUserId,
    text: msg.text, image_url: msg.imageUrl, deleted: msg.deleted,
    created_at: msg.createdAt,
  })
  if (error) console.error('sendMessage:', error)
}

export async function deleteMessageRemote(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('messages')
    .update({ deleted: true, text: '[mensaje eliminado]' }).eq('id', id)
  if (error) console.error('deleteMessage:', error)
}

// ─── Chat reads ──────────────────────────────────────────────

export async function fetchChatReads(userId: string): Promise<{ [chatId: string]: number }> {
  if (!supabase) return {}
  const { data, error } = await supabase.from('chat_reads').select('*').eq('user_id', userId)
  if (error) { console.error('fetchChatReads:', error); return {} }
  const result: { [chatId: string]: number } = {}
  for (const row of data || []) result[row.chat_id] = row.last_read_at
  return result
}

export async function markChatReadRemote(chatId: string, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('chat_reads').upsert({
    chat_id: chatId, user_id: userId, last_read_at: Date.now(),
  })
  if (error) console.error('markChatRead:', error)
}

// ─── Typing indicators ──────────────────────────────────────

export async function setTypingRemote(chatId: string, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('typing_indicators').upsert({
    chat_id: chatId, user_id: userId, updated_at: Date.now(),
  })
  if (error) console.error('setTyping:', error)
}

export async function clearTypingRemote(chatId: string, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('typing_indicators').delete()
    .eq('chat_id', chatId).eq('user_id', userId)
  if (error) console.error('clearTyping:', error)
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

export function subscribeToMessages(callback: (msg: Message) => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('messages-ch').on('postgres_changes', {
    event: '*', schema: 'public', table: 'messages'
  }, (payload: any) => {
    if (payload.new) {
      const m = payload.new
      callback({
        id: m.id, chatId: m.chat_id, fromUserId: m.from_user_id,
        text: m.text, imageUrl: m.image_url, deleted: m.deleted, createdAt: m.created_at,
      })
    }
  }).subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function subscribeToChats(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('chats-ch').on('postgres_changes', {
    event: '*', schema: 'public', table: 'chats'
  }, callback).subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function subscribeToUsers(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('users-ch').on('postgres_changes', {
    event: '*', schema: 'public', table: 'users'
  }, callback).subscribe()
  return () => { supabase.removeChannel(channel) }
}

// ═══════════════════════════════════════════════════════════
// FASE 7: Social features
// ═══════════════════════════════════════════════════════════

// ─── Feed events ────────────────────────────────────────────

export async function fetchFeedEvents(limit = 50): Promise<FeedEvent[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('feed_events')
    .select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) { console.error('fetchFeedEvents:', error); return [] }
  return (data || []).map((e: any) => ({
    id: e.id, userId: e.user_id, type: e.type, title: e.title,
    description: e.description, data: e.data, createdAt: e.created_at,
  }))
}

export async function createFeedEvent(ev: FeedEvent): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('feed_events').insert({
    id: ev.id, user_id: ev.userId, type: ev.type, title: ev.title,
    description: ev.description, data: ev.data || {}, created_at: ev.createdAt,
  })
  if (error) console.error('createFeedEvent:', error)
}

// ─── Reactions ──────────────────────────────────────────────

export async function fetchReactions(targetType: 'event' | 'message', targetIds: string[]): Promise<Reaction[]> {
  if (!supabase || targetIds.length === 0) return []
  const { data, error } = await supabase.from('reactions')
    .select('*').eq('target_type', targetType).in('target_id', targetIds)
  if (error) { console.error('fetchReactions:', error); return [] }
  return (data || []).map((r: any) => ({
    id: r.id, targetType: r.target_type, targetId: r.target_id,
    userId: r.user_id, emoji: r.emoji, createdAt: r.created_at,
  }))
}

export async function toggleReaction(
  targetType: 'event' | 'message',
  targetId: string,
  userId: string,
  emoji: string
): Promise<{ added: boolean }> {
  if (!supabase) return { added: false }
  // Buscar si ya existe
  const { data: existing } = await supabase.from('reactions')
    .select('id')
    .eq('target_type', targetType).eq('target_id', targetId)
    .eq('user_id', userId).eq('emoji', emoji)
    .maybeSingle()
  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
    return { added: false }
  } else {
    const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    await supabase.from('reactions').insert({
      id, target_type: targetType, target_id: targetId,
      user_id: userId, emoji, created_at: Date.now(),
    })
    return { added: true }
  }
}

// ─── Comments ───────────────────────────────────────────────

export async function fetchComments(eventIds: string[]): Promise<FeedComment[]> {
  if (!supabase || eventIds.length === 0) return []
  const { data, error } = await supabase.from('feed_comments')
    .select('*').in('event_id', eventIds).order('created_at', { ascending: true })
  if (error) { console.error('fetchComments:', error); return [] }
  return (data || []).map((c: any) => ({
    id: c.id, eventId: c.event_id, userId: c.user_id, text: c.text, createdAt: c.created_at,
  }))
}

export async function addComment(c: FeedComment): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('feed_comments').insert({
    id: c.id, event_id: c.eventId, user_id: c.userId, text: c.text, created_at: c.createdAt,
  })
  if (error) console.error('addComment:', error)
}

// ─── Achievements ───────────────────────────────────────────

export async function fetchUserAchievements(userId?: string): Promise<UserAchievement[]> {
  if (!supabase) return []
  let q = supabase.from('user_achievements').select('*')
  if (userId) q = q.eq('user_id', userId)
  const { data, error } = await q
  if (error) { console.error('fetchUserAchievements:', error); return [] }
  return (data || []).map((a: any) => ({
    userId: a.user_id, achievementId: a.achievement_id, unlockedAt: a.unlocked_at,
  }))
}

export async function unlockAchievement(userId: string, achievementId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId, achievement_id: achievementId, unlocked_at: Date.now(),
  })
  if (error && !error.message.includes('duplicate')) console.error('unlockAchievement:', error)
}

// ─── Realtime subscriptions ────────────────────────────────

export function subscribeToFeed(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('feed-ch').on('postgres_changes', {
    event: '*', schema: 'public', table: 'feed_events'
  }, callback).subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function subscribeToReactions(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('reactions-ch').on('postgres_changes', {
    event: '*', schema: 'public', table: 'reactions'
  }, callback).subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function subscribeToComments(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('comments-ch').on('postgres_changes', {
    event: '*', schema: 'public', table: 'feed_comments'
  }, callback).subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function subscribeToAchievements(callback: () => void) {
  if (!supabase) return () => {}
  const channel = supabase.channel('ach-ch').on('postgres_changes', {
    event: '*', schema: 'public', table: 'user_achievements'
  }, callback).subscribe()
  return () => { supabase.removeChannel(channel) }
}
