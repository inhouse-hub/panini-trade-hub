// lib/types.ts — REEMPLAZA el archivo existente con este

// Sticker states
export type StickerState = 'unmarked' | 'has' | 'repeated' | 'missing'

// Sticker data with state and count for repeated
export interface StickerData {
  state: StickerState
  count: number // For repeated stickers, how many copies
}

// User's sticker collection for a section/country
export interface SectionInventory {
  [stickerNumber: string]: StickerData
}

// User's complete album data
export interface UserAlbum {
  [sectionCode: string]: SectionInventory
}

// User profile (con PIN)
export interface User {
  id: string
  name: string
  avatar: string // emoji or color code
  pin: string // 4-digit PIN for unlocking the profile
  createdAt: number
}

// Trade status
export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'completed'

// Trade record
export interface TradeRecord {
  id: string
  fromUserId: string
  toUserId: string
  givenStickers: string[] // format: "MEX-5", "FWC-0"
  receivedStickers: string[]
  status: TradeStatus
  timestamp: number
  completed: boolean // for backwards compat with existing UI
}

// Section definition
export interface AlbumSection {
  code: string
  name: string
  flag: string
  stickerCount: number
  startNumber: number // 0 for FWC, 1 for others
}

// Match result for trading (con score mejorado)
export interface TradeMatch {
  userId: string
  userName: string
  userAvatar: string
  canGive: string[] // Stickers you can give them
  canReceive: string[] // Stickers they can give you
  matchScore: number // 0-100, considering mutual benefit
  mutualPossible: number // How many fair 1:1 trades are possible
}

// Filter types
export type FilterType = 'all' | 'missing' | 'repeated' | 'complete' | 'unmarked'

// Tab types
export type TabType = 'home' | 'album' | 'trade' | 'users'
