// lib/user-context.tsx — REEMPLAZA el archivo existente con este
// Misma API que el original PERO sincroniza con Supabase si hay credenciales.
// Si no las hay, se queda en modo localStorage (offline).

'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { User, UserAlbum, StickerState, TradeRecord, TradeStatus } from './types'
import { DEFAULT_USERS, createEmptyAlbum, createRoniAlbum, ALBUM_SECTIONS } from './album-data'
import {
  isSupabaseEnabled,
  fetchUsers,
  upsertUser,
  deleteUserRemote,
  fetchAllAlbums,
  saveAlbum,
  fetchTrades,
  createTrade as createTradeRemote,
  updateTradeStatus,
  subscribeToTrades,
  subscribeToAlbums,
} from './supabase'

const STORAGE_KEYS = {
  USERS: 'panini_users',
  ACTIVE_USER: 'panini_active_user',
  ALBUMS: 'panini_albums',
  TRADES: 'panini_trades',
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
  viewingUserId: string | null
  viewingUserAlbum: UserAlbum | null
  canUndo: boolean
  lastSaveTime: number | null
  isOnline: boolean // NEW: indica si Supabase está conectado
  setActiveUser: (userId: string) => void
  setViewingUser: (userId: string | null) => void
  addUser: (name: string, avatar: string, pin?: string) => void
  updateUser: (userId: string, name: string, avatar: string, pin?: string) => void
  deleteUser: (userId: string) => void
  updateStickerState: (sectionCode: string, stickerNumber: string, state: StickerState, count?: number) => void
  cycleStickerState: (sectionCode: string, stickerNumber: string) => void
  updateStickerCount: (sectionCode: string, stickerNumber: string, delta: number) => void
  markAllSection: (sectionCode: string, state: StickerState) => void
  clearSection: (sectionCode: string) => void
  getUserAlbum: (userId: string) => UserAlbum | null
  executeTrade: (fromUserId: string, toUserId: string, given: string[], received: string[]) => void
  completeTrade: (tradeId: string) => void
  updateTradeRecordStatus: (tradeId: string, status: TradeStatus) => void
  getStats: (userId: string) => { total: number; has: number; missing: number; repeated: number; unmarked: number; repeatedCount: number }
  undo: () => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [albums, setAlbums] = useState<{ [userId: string]: UserAlbum }>({})
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [undoHistory, setUndoHistory] = useState<UndoSnapshot[]>([])
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingAlbumSaves = useRef<Set<string>>(new Set())

  // ── Inicialización: carga desde Supabase si está habilitado, sino localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    async function init() {
      if (isSupabaseEnabled) {
        try {
          // Cargar desde Supabase
          const [remoteUsers, remoteAlbums, remoteTrades] = await Promise.all([
            fetchUsers(),
            fetchAllAlbums(),
            fetchTrades(),
          ])

          if (remoteUsers.length === 0) {
            // Primera vez: subir los defaults
            const defaults = DEFAULT_USERS.map(u => ({ ...u, pin: u.pin || '1234' }))
            for (const user of defaults) await upsertUser(user)
            setUsers(defaults)

            const initialAlbums: { [k: string]: UserAlbum } = {
              roni: createRoniAlbum(),
              carlos: createEmptyAlbum(),
              fabio: createEmptyAlbum(),
            }
            for (const [uid, alb] of Object.entries(initialAlbums)) {
              await saveAlbum(uid, alb)
            }
            setAlbums(initialAlbums)
          } else {
            setUsers(remoteUsers)

            // Si RoNi existe pero su álbum está vacío, lo sembramos
            const albumsToSet: { [k: string]: UserAlbum } = { ...remoteAlbums }
            const roniExists = remoteUsers.find(u => u.id === 'roni')
            if (roniExists && (!albumsToSet.roni || Object.keys(albumsToSet.roni).length === 0)) {
              albumsToSet.roni = createRoniAlbum()
              await saveAlbum('roni', albumsToSet.roni)
            }
            // Cualquier usuario sin álbum, asignar vacío
            for (const user of remoteUsers) {
              if (!albumsToSet[user.id]) {
                albumsToSet[user.id] = createEmptyAlbum()
                await saveAlbum(user.id, albumsToSet[user.id])
              }
            }
            setAlbums(albumsToSet)
          }

          setTrades(remoteTrades)
          setIsOnline(true)
        } catch (e) {
          console.error('Supabase init failed, falling back to localStorage:', e)
          loadFromLocalStorage()
        }
      } else {
        loadFromLocalStorage()
      }

      // Active user desde localStorage (preferencia del dispositivo)
      const storedActiveUser = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)
      if (storedActiveUser) setActiveUserId(storedActiveUser)

      const storedUndo = localStorage.getItem(STORAGE_KEYS.UNDO_HISTORY)
      if (storedUndo) setUndoHistory(JSON.parse(storedUndo))

      setIsInitialized(true)
    }

    function loadFromLocalStorage() {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS)
      const storedAlbums = localStorage.getItem(STORAGE_KEYS.ALBUMS)
      const storedTrades = localStorage.getItem(STORAGE_KEYS.TRADES)

      if (storedUsers) {
        setUsers(JSON.parse(storedUsers))
      } else {
        const defaults = DEFAULT_USERS.map(u => ({ ...u, pin: u.pin || '1234' }))
        setUsers(defaults)
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaults))
      }

      if (storedAlbums) {
        setAlbums(JSON.parse(storedAlbums))
      } else {
        const initial: { [k: string]: UserAlbum } = {
          roni: createRoniAlbum(),
          carlos: createEmptyAlbum(),
          fabio: createEmptyAlbum(),
        }
        setAlbums(initial)
        localStorage.setItem(STORAGE_KEYS.ALBUMS, JSON.stringify(initial))
      }

      if (storedTrades) setTrades(JSON.parse(storedTrades))
    }

    init()
  }, [])

  // ── Suscripciones realtime (para que Carlos vea cambios de RoNi en vivo)
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

    return () => {
      unsubTrades()
      unsubAlbums()
    }
  }, [isInitialized, isOnline])

  // ── Persistencia local (cache)
  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  }, [users, isInitialized])

  useEffect(() => {
    if (!isInitialized || !activeUserId) return
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, activeUserId)
  }, [activeUserId, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(STORAGE_KEYS.ALBUMS, JSON.stringify(albums))
    setLastSaveTime(Date.now())

    // Sincronizar a Supabase con debounce
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
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades))
  }, [trades, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(STORAGE_KEYS.UNDO_HISTORY, JSON.stringify(undoHistory))
  }, [undoHistory, isInitialized])

  const activeUser = users.find(u => u.id === activeUserId) || null
  const activeUserAlbum = activeUserId ? albums[activeUserId] || null : null
  const viewingUserAlbum = viewingUserId ? albums[viewingUserId] || null : null
  const canUndo = undoHistory.length > 0 && undoHistory[0]?.userId === activeUserId

  const saveUndoSnapshot = useCallback(() => {
    if (!activeUserId || !albums[activeUserId]) return
    const snapshot: UndoSnapshot = {
      userId: activeUserId,
      album: JSON.parse(JSON.stringify(albums[activeUserId])),
      timestamp: Date.now(),
    }
    setUndoHistory([snapshot])
  }, [activeUserId, albums])

  const setActiveUser = useCallback((userId: string) => {
    setActiveUserId(userId)
    setViewingUserId(null)
  }, [])

  const setViewingUser = useCallback((userId: string | null) => {
    setViewingUserId(userId)
  }, [])

  const addUser = useCallback((name: string, avatar: string, pin: string = '1234') => {
    const id = `user_${Date.now()}`
    const newUser: User = { id, name, avatar, pin, createdAt: Date.now() }
    setUsers(prev => [...prev, newUser])
    setAlbums(prev => ({ ...prev, [id]: createEmptyAlbum() }))
    if (isOnline) {
      upsertUser(newUser)
      saveAlbum(id, createEmptyAlbum())
    }
  }, [isOnline])

  const updateUser = useCallback((userId: string, name: string, avatar: string, pin?: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u
      const updated = { ...u, name, avatar, ...(pin ? { pin } : {}) }
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
    const currentSticker = albums[activeUserId][sectionCode]?.[stickerNumber]
    const currentState = currentSticker?.state || 'unmarked'
    const stateOrder: StickerState[] = ['unmarked', 'has', 'repeated', 'missing']
    const currentIndex = stateOrder.indexOf(currentState)
    const nextState = stateOrder[(currentIndex + 1) % stateOrder.length]
    const nextCount = nextState === 'repeated' ? 2 : nextState === 'has' ? 1 : 0
    updateStickerState(sectionCode, stickerNumber, nextState, nextCount)
  }, [activeUserId, albums, updateStickerState])

  const updateStickerCount = useCallback((sectionCode: string, stickerNumber: string, delta: number) => {
    if (!activeUserId || !albums[activeUserId]) return
    const currentSticker = albums[activeUserId][sectionCode]?.[stickerNumber]
    if (currentSticker?.state !== 'repeated') return
    const newCount = Math.max(2, currentSticker.count + delta)
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
        newSection[i.toString()] = {
          state,
          count: state === 'repeated' ? 2 : state === 'has' ? 1 : 0
        }
      }
      return {
        ...prev,
        [activeUserId]: {
          ...prev[activeUserId],
          [sectionCode]: newSection
        }
      }
    })
  }, [activeUserId, saveUndoSnapshot])

  const clearSection = useCallback((sectionCode: string) => {
    markAllSection(sectionCode, 'unmarked')
  }, [markAllSection])

  const getUserAlbum = useCallback((userId: string) => {
    return albums[userId] || null
  }, [albums])

  const executeTrade = useCallback((fromUserId: string, toUserId: string, given: string[], received: string[]) => {
    pendingAlbumSaves.current.add(fromUserId)
    pendingAlbumSaves.current.add(toUserId)

    setAlbums(prev => {
      const newAlbums = JSON.parse(JSON.stringify(prev)) // Deep copy

      // Given (from -> to)
      for (const sticker of given) {
        const [sectionCode, number] = sticker.split('-')
        if (newAlbums[fromUserId]?.[sectionCode]?.[number]) {
          const cur = newAlbums[fromUserId][sectionCode][number]
          const newCount = cur.count - 1
          newAlbums[fromUserId][sectionCode][number] = newCount <= 1
            ? { state: 'has', count: 1 }
            : { state: 'repeated', count: newCount }
        }
        if (!newAlbums[toUserId]) newAlbums[toUserId] = {}
        if (!newAlbums[toUserId][sectionCode]) newAlbums[toUserId][sectionCode] = {}
        newAlbums[toUserId][sectionCode][number] = { state: 'has', count: 1 }
      }

      // Received (to -> from)
      for (const sticker of received) {
        const [sectionCode, number] = sticker.split('-')
        if (newAlbums[toUserId]?.[sectionCode]?.[number]) {
          const cur = newAlbums[toUserId][sectionCode][number]
          const newCount = cur.count - 1
          newAlbums[toUserId][sectionCode][number] = newCount <= 1
            ? { state: 'has', count: 1 }
            : { state: 'repeated', count: newCount }
        }
        if (!newAlbums[fromUserId]) newAlbums[fromUserId] = {}
        if (!newAlbums[fromUserId][sectionCode]) newAlbums[fromUserId][sectionCode] = {}
        newAlbums[fromUserId][sectionCode][number] = { state: 'has', count: 1 }
      }

      // Persistir a Supabase
      if (isOnline) {
        saveAlbum(fromUserId, newAlbums[fromUserId])
        saveAlbum(toUserId, newAlbums[toUserId])
      }

      return newAlbums
    })

    const trade: TradeRecord = {
      id: `trade_${Date.now()}`,
      fromUserId,
      toUserId,
      givenStickers: given,
      receivedStickers: received,
      status: 'completed', // Por ahora, hasta la Fase 2 los trades son inmediatos
      timestamp: Date.now(),
      completed: true,
    }
    setTrades(prev => [trade, ...prev])
    if (isOnline) createTradeRemote(trade)
  }, [isOnline])

  const completeTrade = useCallback((tradeId: string) => {
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, completed: true, status: 'completed' as TradeStatus } : t))
    if (isOnline) updateTradeStatus(tradeId, 'completed')
  }, [isOnline])

  const updateTradeRecordStatus = useCallback((tradeId: string, status: TradeStatus) => {
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status, completed: status === 'completed' } : t))
    if (isOnline) updateTradeStatus(tradeId, status)
  }, [isOnline])

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
      users,
      activeUser,
      activeUserAlbum,
      trades,
      viewingUserId,
      viewingUserAlbum,
      canUndo,
      lastSaveTime,
      isOnline,
      setActiveUser,
      setViewingUser,
      addUser,
      updateUser,
      deleteUser,
      updateStickerState,
      cycleStickerState,
      updateStickerCount,
      markAllSection,
      clearSection,
      getUserAlbum,
      executeTrade,
      completeTrade,
      updateTradeRecordStatus,
      getStats,
      undo,
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
