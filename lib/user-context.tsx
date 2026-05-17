// lib/user-context.tsx — REEMPLAZA el archivo existente
'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { User, UserAlbum, StickerState, TradeRecord, TradeStatus, Notification, NotificationType, Chat, Message, FeedEvent, FeedEventType, Reaction, FeedComment, UserAchievement } from './types'
import { DEFAULT_USERS, createEmptyAlbum, createRoniAlbum, ALBUM_SECTIONS } from './album-data'
import { ACHIEVEMENTS, findNewlyUnlocked, AchievementContext } from './achievements'
import {
  isSupabaseEnabled, fetchUsers, upsertUser, deleteUserRemote,
  fetchAllAlbums, saveAlbum, fetchTrades, createTrade as createTradeRemote,
  updateTradeStatus, subscribeToTrades, subscribeToAlbums,
  fetchNotifications, createNotification, markNotificationRead,
  markAllNotificationsRead, subscribeToNotifications,
  fetchChats, createChat, updateChatLastMessage,
  fetchMessages, sendMessageRemote, deleteMessageRemote,
  fetchChatReads, markChatReadRemote,
  setTypingRemote, clearTypingRemote,
  subscribeToMessages, subscribeToChats, subscribeToUsers,
  uploadAvatar as uploadAvatarRemote,
  uploadChatImage as uploadChatImageRemote,
  fetchFeedEvents, createFeedEvent,
  fetchReactions, toggleReaction as toggleReactionRemote,
  fetchComments, addComment as addCommentRemote,
  fetchUserAchievements, unlockAchievement as unlockAchievementRemote,
  subscribeToFeed, subscribeToReactions, subscribeToComments, subscribeToAchievements,
} from './supabase'

const STORAGE_KEYS = {
  ACTIVE_USER: 'panini_active_user',
  UNDO_HISTORY: 'panini_undo_history',
}

interface UndoSnapshot {
  userId: string
  album: UserAlbum
  timestamp: number
}

interface UserContextType {
  users: User[]
  activeUser: User | null
  activeUserAlbum: UserAlbum | null
  trades: TradeRecord[]
  notifications: Notification[]
  unreadCount: number
  chats: Chat[]
  messagesByChat: { [chatId: string]: Message[] }
  chatReads: { [chatId: string]: number }
  totalUnreadMessages: number
  viewingUserId: string | null
  viewingUserAlbum: UserAlbum | null
  canUndo: boolean
  lastSaveTime: number | null
  isOnline: boolean
  isAdmin: boolean
  setActiveUser: (userId: string) => void
  signOut: () => void
  setViewingUser: (userId: string | null) => void
  addUser: (name: string, avatar: string, pin?: string) => void
  updateUser: (userId: string, updates: Partial<Pick<User, 'name' | 'avatar' | 'pin' | 'isAdmin'>>) => void
  deleteUser: (userId: string) => void
  updateStickerState: (sectionCode: string, stickerNumber: string, state: StickerState, count?: number) => void
  cycleStickerState: (sectionCode: string, stickerNumber: string) => void
  updateStickerCount: (sectionCode: string, stickerNumber: string, delta: number) => void
  markAllSection: (sectionCode: string, state: StickerState) => void
  clearSection: (sectionCode: string) => void
  getUserAlbum: (userId: string) => UserAlbum | null
  executeTrade: (fromUserId: string, toUserId: string, given: string[], received: string[]) => void
  proposeTrade: (toUserId: string, given: string[], received: string[]) => void
  acceptTrade: (tradeId: string) => void
  rejectTrade: (tradeId: string) => void
  completeTrade: (tradeId: string) => void
  pushNotification: (userId: string, type: NotificationType, title: string, message?: string, data?: any) => void
  markNotifRead: (id: string) => void
  markAllNotifsRead: () => void
  // Chat actions
  loadChatMessages: (chatId: string) => Promise<void>
  sendMessage: (chatId: string, text: string, imageUrl?: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  markChatRead: (chatId: string) => void
  setTyping: (chatId: string) => void
  clearTyping: (chatId: string) => void
  getOrCreateDM: (otherUserId: string) => Promise<string>
  unreadCountForChat: (chatId: string) => number
  uploadAvatar: (userId: string, blob: Blob) => Promise<string | null>
  uploadChatImage: (chatId: string, blob: Blob) => Promise<string | null>
  // Fase 7
  feedEvents: FeedEvent[]
  reactions: Reaction[]
  comments: FeedComment[]
  achievements: UserAchievement[]
  toggleReactionOnEvent: (eventId: string, emoji: string) => Promise<void>
  toggleReactionOnMessage: (messageId: string, emoji: string) => Promise<void>
  postComment: (eventId: string, text: string) => Promise<void>
  loadCommentsFor: (eventId: string) => Promise<void>
  getStats: (userId: string) => { total: number; has: number; missing: number; repeated: number; unmarked: number; repeatedCount: number }
  undo: () => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [albums, setAlbums] = useState<{ [userId: string]: UserAlbum }>({})
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [messagesByChat, setMessagesByChat] = useState<{ [chatId: string]: Message[] }>({})
  const [chatReads, setChatReads] = useState<{ [chatId: string]: number }>({})
  // Fase 7
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [comments, setComments] = useState<FeedComment[]>([])
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const messagesSentRef = useRef<number>(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [undoHistory, setUndoHistory] = useState<UndoSnapshot[]>([])
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingAlbumSaves = useRef<Set<string>>(new Set())

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    async function init() {
      if (isSupabaseEnabled) {
        try {
          const [remoteUsers, remoteAlbums, remoteTrades] = await Promise.all([
            fetchUsers(), fetchAllAlbums(), fetchTrades(),
          ])

          if (remoteUsers.length === 0) {
            for (const user of DEFAULT_USERS) await upsertUser(user)
            setUsers(DEFAULT_USERS)
            const initialAlbums: { [k: string]: UserAlbum } = {
              jorge: createEmptyAlbum(),
              roni: createRoniAlbum(),
              carlos: createEmptyAlbum(),
              fabio: createEmptyAlbum(),
            }
            for (const [uid, alb] of Object.entries(initialAlbums)) await saveAlbum(uid, alb)
            setAlbums(initialAlbums)
          } else {
            let usersToUse = remoteUsers
            const hasJorge = remoteUsers.find(u => u.id === 'jorge')
            if (!hasJorge) {
              const jorge = DEFAULT_USERS.find(u => u.id === 'jorge')!
              await upsertUser(jorge)
              usersToUse = [...remoteUsers, jorge]
            }
            setUsers(usersToUse)

            const albumsToSet: { [k: string]: UserAlbum } = { ...remoteAlbums }
            for (const user of usersToUse) {
              if (!albumsToSet[user.id]) {
                albumsToSet[user.id] = user.id === 'roni' ? createRoniAlbum() : createEmptyAlbum()
                await saveAlbum(user.id, albumsToSet[user.id])
              }
            }
            setAlbums(albumsToSet)
          }

          setTrades(remoteTrades)
          setIsOnline(true)
        } catch (e) {
          console.error('Supabase init failed:', e)
        }
      }

      const storedUndo = localStorage.getItem(STORAGE_KEYS.UNDO_HISTORY)
      if (storedUndo) setUndoHistory(JSON.parse(storedUndo))

      setIsInitialized(true)
    }

    init()
  }, [])

  // ── Realtime subs (trades + albums) ───────────────────────
  useEffect(() => {
    if (!isInitialized || !isOnline) return

    const unsubTrades = subscribeToTrades(async () => {
      const fresh = await fetchTrades()
      setTrades(fresh)
    })
    const unsubAlbums = subscribeToAlbums(async () => {
      const fresh = await fetchAllAlbums()
      setAlbums(prev => ({ ...prev, ...fresh }))
    })

    return () => { unsubTrades(); unsubAlbums() }
  }, [isInitialized, isOnline])

  // ── Notifications + Chats subscriptions for active user ──
  useEffect(() => {
    if (!isInitialized || !isOnline || !activeUserId) return

    fetchNotifications(activeUserId).then(setNotifications)
    fetchChats(activeUserId).then(c => {
      // Asegurar que el grupo "Todos" siempre incluya al activeUserId
      const grupo = c.find(x => x.id === 'group_todos')
      if (grupo && !grupo.participants.includes(activeUserId)) {
        const updated = { ...grupo, participants: [...grupo.participants, activeUserId] }
        createChat(updated)
      }
      setChats(c)
    })
    fetchChatReads(activeUserId).then(setChatReads)

    const unsubNotif = subscribeToNotifications(activeUserId, async () => {
      const fresh = await fetchNotifications(activeUserId)
      setNotifications(fresh)
    })

    const unsubMsg = subscribeToMessages((msg) => {
      setMessagesByChat(prev => {
        const list = prev[msg.chatId] || []
        // Replace if exists (update), else prepend chronologically at the end
        const idx = list.findIndex(m => m.id === msg.id)
        let newList: Message[]
        if (idx >= 0) {
          newList = [...list]
          newList[idx] = msg
        } else {
          newList = [...list, msg]
        }
        return { ...prev, [msg.chatId]: newList }
      })
      // Push notification if message is for me and from someone else
      if (msg.fromUserId !== activeUserId) {
        // Refresca lista de chats (last message updated)
        fetchChats(activeUserId).then(setChats)
      }
    })

    const unsubChats = subscribeToChats(async () => {
      const fresh = await fetchChats(activeUserId)
      setChats(fresh)
    })

    // ── Fase 7: feed, reactions, achievements ───────────────
    fetchFeedEvents(80).then(setFeedEvents)
    fetchUserAchievements().then(setAchievements)
    // Reacciones del feed (las cargamos para todos los eventos visibles)
    fetchFeedEvents(80).then(async (events) => {
      if (events.length > 0) {
        const rx = await fetchReactions('event', events.map(e => e.id))
        setReactions(prev => {
          // Mantener reacciones de mensajes existentes
          const msgRx = prev.filter(r => r.targetType === 'message')
          return [...rx, ...msgRx]
        })
      }
    })

    const unsubFeed = subscribeToFeed(async () => {
      const fresh = await fetchFeedEvents(80)
      setFeedEvents(fresh)
    })
    const unsubReact = subscribeToReactions(async () => {
      const events = await fetchFeedEvents(80)
      const eventRx = events.length > 0 ? await fetchReactions('event', events.map(e => e.id)) : []
      // Cargar reacciones de mensajes visibles
      const allMsgIds: string[] = []
      Object.values(messagesByChat).forEach(list => list.forEach(m => allMsgIds.push(m.id)))
      const msgRx = allMsgIds.length > 0 ? await fetchReactions('message', allMsgIds) : []
      setReactions([...eventRx, ...msgRx])
    })
    const unsubComments = subscribeToComments(async () => {
      // Refrescar comments. Cargamos solo de eventos visibles
      const events = await fetchFeedEvents(80)
      if (events.length > 0) {
        const fresh = await fetchComments(events.map(e => e.id))
        setComments(fresh)
      }
    })
    const unsubAch = subscribeToAchievements(async () => {
      const fresh = await fetchUserAchievements()
      setAchievements(fresh)
    })

    return () => { unsubNotif(); unsubMsg(); unsubChats(); unsubFeed(); unsubReact(); unsubComments(); unsubAch() }
  }, [isInitialized, isOnline, activeUserId])

  // ── Persistence ───────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized || !activeUserId) return
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, activeUserId)
  }, [activeUserId, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    setLastSaveTime(Date.now())
    if (isOnline && pendingAlbumSaves.current.size > 0) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(async () => {
        const toSave = Array.from(pendingAlbumSaves.current)
        pendingAlbumSaves.current.clear()
        for (const uid of toSave) {
          if (albums[uid]) await saveAlbum(uid, albums[uid])
        }
      }, 800)
    }
  }, [albums, isInitialized, isOnline])

  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(STORAGE_KEYS.UNDO_HISTORY, JSON.stringify(undoHistory))
  }, [undoHistory, isInitialized])

  const activeUser = users.find(u => u.id === activeUserId) || null
  const activeUserAlbum = activeUserId ? albums[activeUserId] || null : null
  const viewingUserAlbum = viewingUserId ? albums[viewingUserId] || null : null
  const canUndo = undoHistory.length > 0 && undoHistory[0]?.userId === activeUserId
  const isAdmin = activeUser?.isAdmin === true
  const unreadCount = notifications.filter(n => !n.read).length

  // ── Unread messages per chat ──────────────────────────────
  const unreadCountForChat = useCallback((chatId: string): number => {
    if (!activeUserId) return 0
    const msgs = messagesByChat[chatId] || []
    const lastRead = chatReads[chatId] || 0
    return msgs.filter(m => m.fromUserId !== activeUserId && m.createdAt > lastRead).length
  }, [activeUserId, messagesByChat, chatReads])

  const totalUnreadMessages = chats.reduce((sum, c) => sum + unreadCountForChat(c.id), 0)

  // ── User actions ──────────────────────────────────────────
  const saveUndoSnapshot = useCallback(() => {
    if (!activeUserId || !albums[activeUserId]) return
    setUndoHistory([{
      userId: activeUserId,
      album: JSON.parse(JSON.stringify(albums[activeUserId])),
      timestamp: Date.now(),
    }])
  }, [activeUserId, albums])

  const setActiveUser = useCallback((userId: string) => {
    setActiveUserId(userId)
    setViewingUserId(null)
  }, [])

  const signOut = useCallback(() => {
    setActiveUserId(null)
    setViewingUserId(null)
    setNotifications([])
    setChats([])
    setMessagesByChat({})
    setChatReads({})
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER)
  }, [])

  const setViewingUser = useCallback((userId: string | null) => {
    setViewingUserId(userId)
  }, [])

  const addUser = useCallback((name: string, avatar: string, pin: string = '1234') => {
    const id = `user_${Date.now()}`
    const newUser: User = { id, name, avatar, pin, isAdmin: false, createdAt: Date.now() }
    setUsers(prev => [...prev, newUser])
    setAlbums(prev => ({ ...prev, [id]: createEmptyAlbum() }))
    if (isOnline) {
      upsertUser(newUser)
      saveAlbum(id, createEmptyAlbum())
    }
  }, [isOnline])

  const updateUser = useCallback((userId: string, updates: Partial<Pick<User, 'name' | 'avatar' | 'pin' | 'isAdmin'>>) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u
      const updated: User = { ...u, ...updates }
      if (isOnline) upsertUser(updated)
      return updated
    }))
  }, [isOnline])

  const deleteUser = useCallback((userId: string) => {
    if (users.length <= 1) return
    setUsers(prev => prev.filter(u => u.id !== userId))
    setAlbums(prev => {
      const { [userId]: removed, ...rest } = prev
      return rest
    })
    if (activeUserId === userId) {
      const remaining = users.filter(u => u.id !== userId)
      if (remaining.length > 0) setActiveUserId(remaining[0].id)
    }
    if (isOnline) deleteUserRemote(userId)
  }, [users, activeUserId, isOnline])

  // ── Stickers ──────────────────────────────────────────────
  const updateStickerState = useCallback((sectionCode: string, stickerNumber: string, state: StickerState, count?: number) => {
    if (!activeUserId) return
    saveUndoSnapshot()
    pendingAlbumSaves.current.add(activeUserId)
    setAlbums(prev => ({
      ...prev,
      [activeUserId]: {
        ...prev[activeUserId],
        [sectionCode]: {
          ...prev[activeUserId]?.[sectionCode],
          [stickerNumber]: {
            state,
            count: count ?? (state === 'has' ? 1 : 0)
          }
        }
      }
    }))
  }, [activeUserId, saveUndoSnapshot])

  const cycleStickerState = useCallback((sectionCode: string, stickerNumber: string) => {
    if (!activeUserId) return
    saveUndoSnapshot()
    pendingAlbumSaves.current.add(activeUserId)
    setAlbums(prev => {
      const cur = prev[activeUserId]?.[sectionCode]?.[stickerNumber]
      const curState = cur?.state || 'unmarked'
      const order: StickerState[] = ['unmarked', 'has', 'missing']
      const idx = order.indexOf(curState as any)
      const next = order[(idx === -1 ? 0 : (idx + 1) % order.length)]
      const nextCount = next === 'has' ? 1 : 0
      return {
        ...prev,
        [activeUserId]: {
          ...prev[activeUserId],
          [sectionCode]: {
            ...prev[activeUserId]?.[sectionCode],
            [stickerNumber]: { state: next, count: nextCount }
          }
        }
      }
    })
  }, [activeUserId, saveUndoSnapshot])

  const updateStickerCount = useCallback((sectionCode: string, stickerNumber: string, delta: number) => {
    if (!activeUserId) return
    saveUndoSnapshot()
    pendingAlbumSaves.current.add(activeUserId)
    setAlbums(prev => {
      const cur = prev[activeUserId]?.[sectionCode]?.[stickerNumber]
      if (cur?.state !== 'has') return prev
      const newCount = Math.max(1, cur.count + delta)
      return {
        ...prev,
        [activeUserId]: {
          ...prev[activeUserId],
          [sectionCode]: {
            ...prev[activeUserId]?.[sectionCode],
            [stickerNumber]: { state: 'has', count: newCount }
          }
        }
      }
    })
  }, [activeUserId, saveUndoSnapshot])

  const markAllSection = useCallback((sectionCode: string, state: StickerState) => {
    if (!activeUserId) return
    const section = ALBUM_SECTIONS.find(s => s.code === sectionCode)
    if (!section) return
    saveUndoSnapshot()
    pendingAlbumSaves.current.add(activeUserId)
    setAlbums(prev => {
      const newSection: { [key: string]: { state: StickerState; count: number } } = {}
      for (let i = section.startNumber; i < section.startNumber + section.stickerCount; i++) {
        newSection[i.toString()] = { state, count: state === 'has' ? 1 : 0 }
      }
      return { ...prev, [activeUserId]: { ...prev[activeUserId], [sectionCode]: newSection } }
    })
  }, [activeUserId, saveUndoSnapshot])

  const clearSection = useCallback((sectionCode: string) => {
    markAllSection(sectionCode, 'unmarked')
  }, [markAllSection])

  const getUserAlbum = useCallback((userId: string) => albums[userId] || null, [albums])

  // ── Notifications ─────────────────────────────────────────
  const pushNotification = useCallback((userId: string, type: NotificationType, title: string, message?: string, data?: any) => {
    const notif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId, type, title, message, data, read: false, createdAt: Date.now(),
    }
    if (isOnline) createNotification(notif)
  }, [isOnline])

  // ── Trades ────────────────────────────────────────────────
  const proposeTrade = useCallback((toUserId: string, given: string[], received: string[]) => {
    if (!activeUserId) return
    const trade: TradeRecord = {
      id: `trade_${Date.now()}`,
      fromUserId: activeUserId, toUserId,
      givenStickers: given, receivedStickers: received,
      status: 'pending', timestamp: Date.now(), completed: false,
    }
    setTrades(prev => [trade, ...prev])
    if (isOnline) createTradeRemote(trade)
    const fromName = users.find(u => u.id === activeUserId)?.name || 'Alguien'
    pushNotification(toUserId, 'trade_proposal',
      `🔄 ${fromName} te propone un trade`,
      `Te ofrece ${received.length} estampa(s) a cambio de ${given.length}`,
      { tradeId: trade.id })
  }, [activeUserId, isOnline, users, pushNotification])

  const executeTrade = useCallback((fromUserId: string, toUserId: string, given: string[], received: string[]) => {
    pendingAlbumSaves.current.add(fromUserId)
    pendingAlbumSaves.current.add(toUserId)

    setAlbums(prev => {
      const newAlbums = JSON.parse(JSON.stringify(prev))
      for (const sticker of given) {
        const [sc, num] = sticker.split('-')
        if (newAlbums[fromUserId]?.[sc]?.[num]) {
          const c = newAlbums[fromUserId][sc][num]
          const nc = Math.max(1, c.count - 1)
          newAlbums[fromUserId][sc][num] = { state: 'has', count: nc }
        }
        if (!newAlbums[toUserId]) newAlbums[toUserId] = {}
        if (!newAlbums[toUserId][sc]) newAlbums[toUserId][sc] = {}
        newAlbums[toUserId][sc][num] = { state: 'has', count: 1 }
      }
      for (const sticker of received) {
        const [sc, num] = sticker.split('-')
        if (newAlbums[toUserId]?.[sc]?.[num]) {
          const c = newAlbums[toUserId][sc][num]
          const nc = Math.max(1, c.count - 1)
          newAlbums[toUserId][sc][num] = { state: 'has', count: nc }
        }
        if (!newAlbums[fromUserId]) newAlbums[fromUserId] = {}
        if (!newAlbums[fromUserId][sc]) newAlbums[fromUserId][sc] = {}
        newAlbums[fromUserId][sc][num] = { state: 'has', count: 1 }
      }
      if (isOnline) {
        saveAlbum(fromUserId, newAlbums[fromUserId])
        saveAlbum(toUserId, newAlbums[toUserId])
      }
      return newAlbums
    })
  }, [isOnline])

  const acceptTrade = useCallback((tradeId: string) => {
    const trade = trades.find(t => t.id === tradeId)
    if (!trade) return
    executeTrade(trade.fromUserId, trade.toUserId, trade.givenStickers, trade.receivedStickers)
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: 'completed' as TradeStatus, completed: true } : t))
    if (isOnline) updateTradeStatus(tradeId, 'completed')
    const toName = users.find(u => u.id === trade.toUserId)?.name || 'Alguien'
    pushNotification(trade.fromUserId, 'trade_accepted',
      `✅ ${toName} aceptó tu trade`, undefined, { tradeId })
  }, [trades, executeTrade, isOnline, users, pushNotification])

  const rejectTrade = useCallback((tradeId: string) => {
    const trade = trades.find(t => t.id === tradeId)
    if (!trade) return
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: 'rejected' as TradeStatus } : t))
    if (isOnline) updateTradeStatus(tradeId, 'rejected')
    const toName = users.find(u => u.id === trade.toUserId)?.name || 'Alguien'
    pushNotification(trade.fromUserId, 'trade_rejected',
      `❌ ${toName} rechazó tu trade`, undefined, { tradeId })
  }, [trades, isOnline, users, pushNotification])

  const completeTrade = useCallback((tradeId: string) => {
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, completed: true, status: 'completed' as TradeStatus } : t))
    if (isOnline) updateTradeStatus(tradeId, 'completed')
    // Crear evento en feed
    const trade = trades.find(t => t.id === tradeId)
    if (trade && activeUserId) {
      const otherId = trade.fromUserId === activeUserId ? trade.toUserId : trade.fromUserId
      const otherUser = users.find(u => u.id === otherId)
      const myName = users.find(u => u.id === activeUserId)?.name || ''
      if (isOnline) {
        const ev: FeedEvent = {
          id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId: activeUserId,
          type: 'trade_done',
          title: `Trade completado con ${otherUser?.name || 'alguien'} 🤝`,
          description: `${trade.givenStickers.length} ↔ ${trade.receivedStickers.length} estampas`,
          data: { tradeId, otherId, given: trade.givenStickers.length, received: trade.receivedStickers.length },
          createdAt: Date.now(),
        }
        setFeedEvents(prev => [ev, ...prev])
        createFeedEvent(ev)
      }
    }
  }, [isOnline, trades, activeUserId, users])

  const markNotifRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    if (isOnline) markNotificationRead(id)
  }, [isOnline])

  const markAllNotifsRead = useCallback(() => {
    if (!activeUserId) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (isOnline) markAllNotificationsRead(activeUserId)
  }, [activeUserId, isOnline])

  // ── CHATS ─────────────────────────────────────────────────

  const loadChatMessages = useCallback(async (chatId: string) => {
    const msgs = await fetchMessages(chatId, 100)
    setMessagesByChat(prev => ({ ...prev, [chatId]: msgs }))
  }, [])

  const getOrCreateDM = useCallback(async (otherUserId: string): Promise<string> => {
    if (!activeUserId) return ''
    // DM id determinístico (ordena ids alfabéticamente)
    const ids = [activeUserId, otherUserId].sort()
    const chatId = `dm_${ids[0]}_${ids[1]}`
    const existing = chats.find(c => c.id === chatId)
    if (existing) return chatId

    const newChat: Chat = {
      id: chatId, type: 'dm', participants: ids, createdAt: Date.now(),
    }
    setChats(prev => [...prev, newChat])
    if (isOnline) await createChat(newChat)
    return chatId
  }, [activeUserId, chats, isOnline])

  const sendMessage = useCallback(async (chatId: string, text: string, imageUrl?: string) => {
    if (!activeUserId || !text.trim()) return
    messagesSentRef.current = messagesSentRef.current + 1
    const msg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      chatId, fromUserId: activeUserId,
      text: text.trim(), imageUrl, deleted: false, createdAt: Date.now(),
    }
    // Optimistic update
    setMessagesByChat(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), msg],
    }))
    if (isOnline) {
      await sendMessageRemote(msg)
      await updateChatLastMessage(chatId, msg.text, activeUserId)
    }
    // Push notifications to other participants
    const chat = chats.find(c => c.id === chatId)
    if (chat) {
      const fromName = users.find(u => u.id === activeUserId)?.name || 'Alguien'
      const preview = msg.text.length > 60 ? msg.text.slice(0, 60) + '…' : msg.text
      const title = chat.type === 'group'
        ? `💬 ${fromName} en ${chat.name || 'grupo'}`
        : `💬 Mensaje de ${fromName}`
      for (const pid of chat.participants) {
        if (pid !== activeUserId) {
          pushNotification(pid, 'new_message', title, preview, { chatId })
        }
      }
    }
  }, [activeUserId, isOnline, chats, users, pushNotification])

  const deleteMessage = useCallback(async (messageId: string) => {
    setMessagesByChat(prev => {
      const result = { ...prev }
      for (const cid in result) {
        result[cid] = result[cid].map(m => m.id === messageId ? { ...m, deleted: true, text: '[mensaje eliminado]' } : m)
      }
      return result
    })
    if (isOnline) await deleteMessageRemote(messageId)
  }, [isOnline])

  const markChatRead = useCallback((chatId: string) => {
    if (!activeUserId) return
    setChatReads(prev => ({ ...prev, [chatId]: Date.now() }))
    if (isOnline) markChatReadRemote(chatId, activeUserId)
  }, [activeUserId, isOnline])

  const setTyping = useCallback((chatId: string) => {
    if (!activeUserId) return
    if (isOnline) setTypingRemote(chatId, activeUserId)
  }, [activeUserId, isOnline])

  const clearTyping = useCallback((chatId: string) => {
    if (!activeUserId) return
    if (isOnline) clearTypingRemote(chatId, activeUserId)
  }, [activeUserId, isOnline])

  // ── Avatar / chat image uploads ───────────────────────────
  const uploadAvatar = useCallback(async (userId: string, blob: Blob): Promise<string | null> => {
    if (!isOnline) return null
    const url = await uploadAvatarRemote(userId, blob)
    if (url) {
      // Update user's avatarUrl in state + remote
      setUsers(prev => prev.map(u => {
        if (u.id !== userId) return u
        const updated: User = { ...u, avatarUrl: url }
        upsertUser(updated)
        return updated
      }))
    }
    return url
  }, [isOnline])

  const uploadChatImage = useCallback(async (chatId: string, blob: Blob): Promise<string | null> => {
    if (!isOnline) return null
    return await uploadChatImageRemote(chatId, blob)
  }, [isOnline])

  // ── Stats ─────────────────────────────────────────────────
  const getStats = useCallback((userId: string) => {
    const album = albums[userId]
    if (!album) return { total: 0, has: 0, missing: 0, repeated: 0, unmarked: 0, repeatedCount: 0 }
    let total = 0, has = 0, missing = 0, repeated = 0, unmarked = 0, repeatedCount = 0
    for (const section of ALBUM_SECTIONS) {
      total += section.stickerCount
      const sd = album[section.code]
      if (sd) {
        for (const [, s] of Object.entries(sd)) {
          switch (s.state) {
            case 'has':
              has++
              if (s.count >= 2) { repeated++; repeatedCount += s.count }
              break
            case 'missing': missing++; break
            case 'unmarked': unmarked++; break
          }
        }
      }
    }
    return { total, has, missing, repeated, unmarked, repeatedCount }
  }, [albums])

  const undo = useCallback(() => {
    if (undoHistory.length === 0 || !activeUserId) return
    const snap = undoHistory[0]
    if (snap.userId !== activeUserId) return
    pendingAlbumSaves.current.add(activeUserId)
    setAlbums(prev => ({ ...prev, [activeUserId]: snap.album }))
    setUndoHistory([])
  }, [undoHistory, activeUserId])

  // ════════════════════════════════════════════════════════
  // FASE 7: Feed, reactions, achievements
  // ════════════════════════════════════════════════════════

  const createFeedEventLocal = useCallback(async (type: FeedEventType, title: string, description?: string, data?: any) => {
    if (!activeUserId) return
    const ev: FeedEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: activeUserId,
      type, title, description, data,
      createdAt: Date.now(),
    }
    setFeedEvents(prev => [ev, ...prev])
    if (isOnline) await createFeedEvent(ev)
  }, [activeUserId, isOnline])

  const toggleReactionOnEvent = useCallback(async (eventId: string, emoji: string) => {
    if (!activeUserId || !isOnline) return
    // Optimistic
    const existing = reactions.find(r =>
      r.targetType === 'event' && r.targetId === eventId &&
      r.userId === activeUserId && r.emoji === emoji
    )
    if (existing) {
      setReactions(prev => prev.filter(r => r.id !== existing.id))
    } else {
      const optimistic: Reaction = {
        id: `tmp_${Date.now()}`, targetType: 'event', targetId: eventId,
        userId: activeUserId, emoji, createdAt: Date.now(),
      }
      setReactions(prev => [...prev, optimistic])
    }
    await toggleReactionRemote('event', eventId, activeUserId, emoji)
  }, [activeUserId, isOnline, reactions])

  const toggleReactionOnMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!activeUserId || !isOnline) return
    const existing = reactions.find(r =>
      r.targetType === 'message' && r.targetId === messageId &&
      r.userId === activeUserId && r.emoji === emoji
    )
    if (existing) {
      setReactions(prev => prev.filter(r => r.id !== existing.id))
    } else {
      const optimistic: Reaction = {
        id: `tmp_${Date.now()}`, targetType: 'message', targetId: messageId,
        userId: activeUserId, emoji, createdAt: Date.now(),
      }
      setReactions(prev => [...prev, optimistic])
    }
    await toggleReactionRemote('message', messageId, activeUserId, emoji)
  }, [activeUserId, isOnline, reactions])

  const postComment = useCallback(async (eventId: string, text: string) => {
    if (!activeUserId || !text.trim()) return
    const c: FeedComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      eventId, userId: activeUserId, text: text.trim(), createdAt: Date.now(),
    }
    setComments(prev => [...prev, c])
    if (isOnline) await addCommentRemote(c)
  }, [activeUserId, isOnline])

  const loadCommentsFor = useCallback(async (eventId: string) => {
    if (!isOnline) return
    const fresh = await fetchComments([eventId])
    setComments(prev => {
      // Reemplazar los de este evento
      const others = prev.filter(c => c.eventId !== eventId)
      return [...others, ...fresh]
    })
  }, [isOnline])

  // ── Auto-check achievements ──────────────────────────────
  const checkAndUnlockAchievements = useCallback(async () => {
    if (!activeUserId) return
    const stats = getStats(activeUserId)

    // Países completados
    const album = albums[activeUserId] || {}
    let countriesCompleted = 0
    for (const section of ALBUM_SECTIONS) {
      const data = album[section.code] || {}
      let count = 0
      for (let i = section.startNumber; i < section.startNumber + section.stickerCount; i++) {
        const s = data[i.toString()]
        if (s?.state === 'has') count++
      }
      if (count === section.stickerCount && section.stickerCount > 0) countriesCompleted++
    }

    const tradesCompleted = trades.filter(t => t.status === 'completed' && (t.fromUserId === activeUserId || t.toUserId === activeUserId)).length

    const ctx: AchievementContext = {
      totalHas: stats.has,
      totalRepeated: stats.repeated,
      countriesCompleted,
      tradesCompleted,
      messagesSent: messagesSentRef.current,
      streakDays: 1, // se calcula simple para no agregar más estado
      albumTotal: stats.total,
    }

    const alreadyUnlocked = achievements.filter(a => a.userId === activeUserId).map(a => a.achievementId)
    const newOnes = findNewlyUnlocked(ctx, alreadyUnlocked)

    for (const ach of newOnes) {
      const userAch: UserAchievement = {
        userId: activeUserId, achievementId: ach.id, unlockedAt: Date.now(),
      }
      setAchievements(prev => [...prev, userAch])
      if (isOnline) {
        await unlockAchievementRemote(activeUserId, ach.id)
        // Crear evento en feed
        await createFeedEventLocal(
          'achievement',
          `Desbloqueó: ${ach.name}`,
          ach.description,
          { achievementId: ach.id }
        )
      }
    }
  }, [activeUserId, albums, trades, achievements, isOnline, getStats, createFeedEventLocal])

  // Trigger check después de cada cambio relevante
  useEffect(() => {
    if (!isInitialized || !activeUserId) return
    const timeout = setTimeout(() => { checkAndUnlockAchievements() }, 500)
    return () => clearTimeout(timeout)
  }, [albums, trades, isInitialized, activeUserId, checkAndUnlockAchievements])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-pulse">Cargando álbum…</div>
      </div>
    )
  }

  return (
    <UserContext.Provider value={{
      users, activeUser, activeUserAlbum, trades, notifications, unreadCount,
      chats, messagesByChat, chatReads, totalUnreadMessages,
      viewingUserId, viewingUserAlbum, canUndo, lastSaveTime, isOnline, isAdmin,
      setActiveUser, signOut, setViewingUser, addUser, updateUser, deleteUser,
      updateStickerState, cycleStickerState, updateStickerCount,
      markAllSection, clearSection, getUserAlbum,
      executeTrade, proposeTrade, acceptTrade, rejectTrade, completeTrade,
      pushNotification, markNotifRead, markAllNotifsRead,
      loadChatMessages, sendMessage, deleteMessage, markChatRead,
      setTyping, clearTyping, getOrCreateDM, unreadCountForChat,
      uploadAvatar, uploadChatImage,
      feedEvents, reactions, comments, achievements,
      toggleReactionOnEvent, toggleReactionOnMessage, postComment, loadCommentsFor,
      getStats, undo,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}
