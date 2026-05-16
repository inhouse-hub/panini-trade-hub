// lib/user-context.tsx — REEMPLAZA el archivo existente
'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { User, UserAlbum, StickerState, TradeRecord, TradeStatus, Notification, NotificationType } from './types'
import { DEFAULT_USERS, createEmptyAlbum, createRoniAlbum, ALBUM_SECTIONS } from './album-data'
import {
  isSupabaseEnabled, fetchUsers, upsertUser, deleteUserRemote,
  fetchAllAlbums, saveAlbum, fetchTrades, createTrade as createTradeRemote,
  updateTradeStatus, subscribeToTrades, subscribeToAlbums,
  fetchNotifications, createNotification, markNotificationRead,
  markAllNotificationsRead, subscribeToNotifications,
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
  const [isInitialized, setIsInitialized] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [undoHistory, setUndoHistory] = useState<UndoSnapshot[]>([])
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingAlbumSaves = useRef<Set<string>>(new Set())

  // ── Init from Supabase ────────────────────────────────────
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
            // Verifica que Jorge exista; si no, lo crea
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

      // NO recuperar active user de localStorage en fase 3:
      // queremos que SIEMPRE empiece en la pantalla de PIN
      // (eso lo controla app/page.tsx, no aquí)

      const storedUndo = localStorage.getItem(STORAGE_KEYS.UNDO_HISTORY)
      if (storedUndo) setUndoHistory(JSON.parse(storedUndo))

      setIsInitialized(true)
    }

    init()
  }, [])

  // ── Realtime subscriptions ────────────────────────────────
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

  // ── Subscribe to notifications for active user ───────────
  useEffect(() => {
    if (!isInitialized || !isOnline || !activeUserId) return

    fetchNotifications(activeUserId).then(setNotifications)

    const unsub = subscribeToNotifications(activeUserId, async () => {
      const fresh = await fetchNotifications(activeUserId)
      setNotifications(fresh)
    })
    return () => unsub()
  }, [isInitialized, isOnline, activeUserId])

  // ── Persistence (only active user pref locally) ──────────
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
            count: count ?? (state === 'repeated' ? 2 : state === 'has' ? 1 : 0)
          }
        }
      }
    }))
  }, [activeUserId, saveUndoSnapshot])

  const cycleStickerState = useCallback((sectionCode: string, stickerNumber: string) => {
    if (!activeUserId || !albums[activeUserId]) return
    const cur = albums[activeUserId][sectionCode]?.[stickerNumber]
    const curState = cur?.state || 'unmarked'
    const order: StickerState[] = ['unmarked', 'has', 'repeated', 'missing']
    const idx = order.indexOf(curState)
    const next = order[(idx + 1) % order.length]
    const nextCount = next === 'repeated' ? 2 : next === 'has' ? 1 : 0
    updateStickerState(sectionCode, stickerNumber, next, nextCount)
  }, [activeUserId, albums, updateStickerState])

  const updateStickerCount = useCallback((sectionCode: string, stickerNumber: string, delta: number) => {
    if (!activeUserId || !albums[activeUserId]) return
    const cur = albums[activeUserId][sectionCode]?.[stickerNumber]
    if (cur?.state !== 'repeated') return
    const newCount = Math.max(2, cur.count + delta)
    updateStickerState(sectionCode, stickerNumber, 'repeated', newCount)
  }, [activeUserId, albums, updateStickerState])

  const markAllSection = useCallback((sectionCode: string, state: StickerState) => {
    if (!activeUserId) return
    const section = ALBUM_SECTIONS.find(s => s.code === sectionCode)
    if (!section) return
    saveUndoSnapshot()
    pendingAlbumSaves.current.add(activeUserId)
    setAlbums(prev => {
      const newSection: { [key: string]: { state: StickerState; count: number } } = {}
      for (let i = section.startNumber; i < section.startNumber + section.stickerCount; i++) {
        newSection[i.toString()] = { state, count: state === 'repeated' ? 2 : state === 'has' ? 1 : 0 }
      }
      return { ...prev, [activeUserId]: { ...prev[activeUserId], [sectionCode]: newSection } }
    })
  }, [activeUserId, saveUndoSnapshot])

  const clearSection = useCallback((sectionCode: string) => {
    markAllSection(sectionCode, 'unmarked')
  }, [markAllSection])

  const getUserAlbum = useCallback((userId: string) => albums[userId] || null, [albums])

  const pushNotification = useCallback((userId: string, type: NotificationType, title: string, message?: string, data?: any) => {
    const notif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId, type, title, message, data, read: false, createdAt: Date.now(),
    }
    if (isOnline) createNotification(notif)
  }, [isOnline])

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
          const nc = c.count - 1
          newAlbums[fromUserId][sc][num] = nc <= 1 ? { state: 'has', count: 1 } : { state: 'repeated', count: nc }
        }
        if (!newAlbums[toUserId]) newAlbums[toUserId] = {}
        if (!newAlbums[toUserId][sc]) newAlbums[toUserId][sc] = {}
        newAlbums[toUserId][sc][num] = { state: 'has', count: 1 }
      }
      for (const sticker of received) {
        const [sc, num] = sticker.split('-')
        if (newAlbums[toUserId]?.[sc]?.[num]) {
          const c = newAlbums[toUserId][sc][num]
          const nc = c.count - 1
          newAlbums[toUserId][sc][num] = nc <= 1 ? { state: 'has', count: 1 } : { state: 'repeated', count: nc }
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
  }, [isOnline])

  const markNotifRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    if (isOnline) markNotificationRead(id)
  }, [isOnline])

  const markAllNotifsRead = useCallback(() => {
    if (!activeUserId) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (isOnline) markAllNotificationsRead(activeUserId)
  }, [activeUserId, isOnline])

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
            case 'has': has++; break
            case 'missing': missing++; break
            case 'repeated': repeated++; repeatedCount += s.count; break
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
      viewingUserId, viewingUserAlbum, canUndo, lastSaveTime, isOnline, isAdmin,
      setActiveUser, signOut, setViewingUser, addUser, updateUser, deleteUser,
      updateStickerState, cycleStickerState, updateStickerCount,
      markAllSection, clearSection, getUserAlbum,
      executeTrade, proposeTrade, acceptTrade, rejectTrade, completeTrade,
      pushNotification, markNotifRead, markAllNotifsRead,
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
