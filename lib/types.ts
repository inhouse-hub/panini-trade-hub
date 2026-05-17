// lib/types.ts — REEMPLAZA

export type StickerState = 'unmarked' | 'has' | 'missing'

export interface StickerData {
  state: StickerState
  count: number
}

export interface SectionInventory {
  [stickerNumber: string]: StickerData
}

export interface UserAlbum {
  [sectionCode: string]: SectionInventory
}

export interface User {
  id: string
  name: string
  avatar: string
  avatarUrl?: string
  pin: string
  isAdmin?: boolean
  createdAt: number
}

export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'completed'

export interface TradeRecord {
  id: string
  fromUserId: string
  toUserId: string
  givenStickers: string[]
  receivedStickers: string[]
  status: TradeStatus
  timestamp: number
  completed: boolean
}

export interface AlbumSection {
  code: string
  name: string
  flag: string
  stickerCount: number
  startNumber: number
}

export interface TradeMatch {
  userId: string
  userName: string
  userAvatar: string
  canGive: string[]
  canReceive: string[]
  matchScore: number
  mutualPossible: number
}

export type NotificationType =
  | 'trade_proposal'
  | 'trade_accepted'
  | 'trade_rejected'
  | 'admin_action'
  | 'new_message'
  | 'achievement'
  | 'milestone'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message?: string
  data?: any
  read: boolean
  createdAt: number
}

export type ChatType = 'group' | 'dm'

export interface Chat {
  id: string
  type: ChatType
  name?: string
  participants: string[]
  createdAt: number
  lastMessageAt?: number
  lastMessageText?: string
  lastMessageFrom?: string
}

export interface Message {
  id: string
  chatId: string
  fromUserId: string
  text: string
  imageUrl?: string
  deleted: boolean
  createdAt: number
}

export interface TypingIndicator {
  chatId: string
  userId: string
  updatedAt: number
}

// ─── Fase 7: Social ───────────────────────────────────────

export type FeedEventType =
  | 'sticker_milestone'   // Llegó a X estampas
  | 'section_complete'    // Completó un país
  | 'trade_done'          // Completó un trade
  | 'achievement'         // Desbloqueó un logro

export interface FeedEvent {
  id: string
  userId: string
  type: FeedEventType
  title: string
  description?: string
  data?: any
  createdAt: number
}

export interface Reaction {
  id: string
  targetType: 'event' | 'message'
  targetId: string
  userId: string
  emoji: string
  createdAt: number
}

export interface FeedComment {
  id: string
  eventId: string
  userId: string
  text: string
  createdAt: number
}

export interface UserAchievement {
  userId: string
  achievementId: string
  unlockedAt: number
}

export type FilterType = 'all' | 'missing' | 'repeated' | 'complete' | 'unmarked'
export type TabType = 'home' | 'album' | 'trade' | 'feed' | 'chat' | 'users'
