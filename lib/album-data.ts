// lib/album-data.ts — REEMPLAZA el archivo existente
import { AlbumSection, User, UserAlbum } from './types'

export const ALBUM_SECTIONS: AlbumSection[] = [
  { code: 'FWC', name: 'FIFA World Cup', flag: '🏆', stickerCount: 18, startNumber: 0 },
  { code: 'CC', name: 'Coca-Cola', flag: '🥤', stickerCount: 14, startNumber: 1 },
  { code: 'MEX', name: 'México', flag: '🇲🇽', stickerCount: 20, startNumber: 1 },
  { code: 'RSA', name: 'Sudáfrica', flag: '🇿🇦', stickerCount: 20, startNumber: 1 },
  { code: 'KOR', name: 'Corea del Sur', flag: '🇰🇷', stickerCount: 20, startNumber: 1 },
  { code: 'CZE', name: 'República Checa', flag: '🇨🇿', stickerCount: 20, startNumber: 1 },
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦', stickerCount: 20, startNumber: 1 },
  { code: 'BIH', name: 'Bosnia y Herzegovina', flag: '🇧🇦', stickerCount: 20, startNumber: 1 },
  { code: 'QAT', name: 'Qatar', flag: '🇶🇦', stickerCount: 20, startNumber: 1 },
  { code: 'SUI', name: 'Suiza', flag: '🇨🇭', stickerCount: 20, startNumber: 1 },
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷', stickerCount: 20, startNumber: 1 },
  { code: 'MAR', name: 'Marruecos', flag: '🇲🇦', stickerCount: 20, startNumber: 1 },
  { code: 'HAI', name: 'Haití', flag: '🇭🇹', stickerCount: 20, startNumber: 1 },
  { code: 'SCO', name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', stickerCount: 20, startNumber: 1 },
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸', stickerCount: 20, startNumber: 1 },
  { code: 'PAR', name: 'Paraguay', flag: '🇵🇾', stickerCount: 20, startNumber: 1 },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', stickerCount: 20, startNumber: 1 },
  { code: 'TUR', name: 'Turquía', flag: '🇹🇷', stickerCount: 20, startNumber: 1 },
  { code: 'GER', name: 'Alemania', flag: '🇩🇪', stickerCount: 20, startNumber: 1 },
  { code: 'CUW', name: 'Curazao', flag: '🇨🇼', stickerCount: 20, startNumber: 1 },
  { code: 'CIV', name: 'Costa de Marfil', flag: '🇨🇮', stickerCount: 20, startNumber: 1 },
  { code: 'ECU', name: 'Ecuador', flag: '🇪🇨', stickerCount: 20, startNumber: 1 },
  { code: 'NED', name: 'Países Bajos', flag: '🇳🇱', stickerCount: 20, startNumber: 1 },
  { code: 'JPN', name: 'Japón', flag: '🇯🇵', stickerCount: 20, startNumber: 1 },
  { code: 'SWE', name: 'Suecia', flag: '🇸🇪', stickerCount: 20, startNumber: 1 },
  { code: 'TUN', name: 'Túnez', flag: '🇹🇳', stickerCount: 20, startNumber: 1 },
  { code: 'BEL', name: 'Bélgica', flag: '🇧🇪', stickerCount: 20, startNumber: 1 },
  { code: 'EGY', name: 'Egipto', flag: '🇪🇬', stickerCount: 20, startNumber: 1 },
  { code: 'IRN', name: 'Irán', flag: '🇮🇷', stickerCount: 20, startNumber: 1 },
  { code: 'NZL', name: 'Nueva Zelanda', flag: '🇳🇿', stickerCount: 20, startNumber: 1 },
  { code: 'ESP', name: 'España', flag: '🇪🇸', stickerCount: 20, startNumber: 1 },
  { code: 'CPV', name: 'Cabo Verde', flag: '🇨🇻', stickerCount: 20, startNumber: 1 },
  { code: 'KSA', name: 'Arabia Saudita', flag: '🇸🇦', stickerCount: 20, startNumber: 1 },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾', stickerCount: 20, startNumber: 1 },
  { code: 'FRA', name: 'Francia', flag: '🇫🇷', stickerCount: 20, startNumber: 1 },
  { code: 'SRB', name: 'Serbia', flag: '🇷🇸', stickerCount: 20, startNumber: 1 },
  { code: 'IRQ', name: 'Irak', flag: '🇮🇶', stickerCount: 20, startNumber: 1 },
  { code: 'NOR', name: 'Noruega', flag: '🇳🇴', stickerCount: 20, startNumber: 1 },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', stickerCount: 20, startNumber: 1 },
  { code: 'ALG', name: 'Argelia', flag: '🇩🇿', stickerCount: 20, startNumber: 1 },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹', stickerCount: 20, startNumber: 1 },
  { code: 'JOR', name: 'Jordania', flag: '🇯🇴', stickerCount: 20, startNumber: 1 },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', stickerCount: 20, startNumber: 1 },
  { code: 'COD', name: 'RD del Congo', flag: '🇨🇩', stickerCount: 20, startNumber: 1 },
  { code: 'UZB', name: 'Uzbekistán', flag: '🇺🇿', stickerCount: 20, startNumber: 1 },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', stickerCount: 20, startNumber: 1 },
  { code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', stickerCount: 20, startNumber: 1 },
  { code: 'CRO', name: 'Croacia', flag: '🇭🇷', stickerCount: 20, startNumber: 1 },
  { code: 'GHA', name: 'Ghana', flag: '🇬🇭', stickerCount: 20, startNumber: 1 },
  { code: 'PAN', name: 'Panamá', flag: '🇵🇦', stickerCount: 20, startNumber: 1 },
]

export const DEFAULT_USERS: User[] = [
  { id: 'jorge', name: 'Jorge', avatar: '👑', pin: '9999', isAdmin: true, createdAt: Date.now() },
  { id: 'roni', name: 'RoNi', avatar: '⚽', pin: '1234', createdAt: Date.now() },
  { id: 'carlos', name: 'Carlos', avatar: '🏆', pin: '1234', createdAt: Date.now() },
  { id: 'fabio', name: 'Fabio', avatar: '🌟', pin: '1234', createdAt: Date.now() },
]

export const RONI_MISSING_DATA: { [sectionCode: string]: number[] } = {
  FWC: [0, 1, 4, 5, 8],
  CC: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  MEX: [1, 5, 7, 8, 10, 11, 14, 15, 16, 17, 18, 20],
  RSA: [1, 5, 6, 7, 8, 11, 12, 16, 17, 18, 19, 20],
  KOR: [3, 6, 7, 8, 9, 10, 11, 13, 14, 15, 18, 20],
  CZE: [1, 2, 3, 4, 5, 7, 8, 10, 13, 14, 15, 16, 17, 18, 19, 20],
  CAN: [1, 3, 6, 7, 10, 11, 12, 13, 14, 16, 17, 18, 20],
  BIH: [1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 15, 18, 19, 20],
  QAT: [2, 3, 5, 9, 13, 14, 19, 20],
  SUI: [3, 4, 6, 7, 8, 9, 10, 11, 13, 17, 19],
  BRA: [1, 2, 3, 6, 7, 8, 9, 11, 12, 16],
  MAR: [2, 6, 8, 10, 11, 13, 14, 15, 16],
  HAI: [2, 4, 5, 6, 8, 9, 12, 13, 14, 16, 17, 18, 20],
  SCO: [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 18],
  USA: [1, 3, 5, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  PAR: [1, 2, 3, 5, 6, 7, 9, 10, 11, 12, 14, 15, 17, 18, 19, 20],
  AUS: [4, 6, 10, 11, 12, 13, 14, 17, 18, 20],
  TUR: [3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  GER: [3, 4, 5, 10, 11, 13, 14, 16, 17],
  CUW: [1, 3, 4, 7, 9, 13, 14, 15],
  CIV: [1, 2, 5, 6, 9, 10, 13, 15, 16, 17, 18, 19, 20],
  ECU: [1, 2, 4, 6, 8, 9, 11, 14, 18, 19],
  NED: [3, 4, 7, 8, 12, 14, 16, 19, 20],
  JPN: [2, 5, 7, 9, 10, 11, 12, 13, 18, 19],
  SWE: [1, 3, 4, 6, 7, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20],
  TUN: [1, 7, 10, 12, 13, 14, 18, 19],
  BEL: [1, 2, 3, 6, 10, 11, 14, 15, 19, 20],
  EGY: [4, 5, 6, 7, 8, 10, 12, 14, 15, 17, 19],
  IRN: [2, 3, 5, 6, 8, 9, 10, 13, 14, 17],
  NZL: [3, 4, 8, 9, 12, 13, 15, 16, 17, 18, 19],
  ESP: [1, 2, 7, 8, 9, 10, 11, 12, 13, 14, 17, 20],
  CPV: [4, 5, 9, 14, 15, 17, 20],
  KSA: [1, 3, 7, 8, 9, 11, 14, 17, 18, 19, 20],
  URU: [1, 3, 4, 5, 7, 8, 9, 10, 12, 15, 16, 17, 18, 19, 20],
  FRA: [4, 6, 9, 10, 11, 12, 13, 14, 15, 16, 19],
  SRB: [4, 6, 7, 8, 9, 11, 12, 15, 16, 17, 18, 19, 20],
  IRQ: [2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 18, 19],
  NOR: [6, 8, 9, 10, 12, 14, 20],
  ARG: [4, 5, 8, 10, 11, 12, 13, 14, 15],
  ALG: [6, 9, 10, 11, 14, 15, 16, 17, 20],
  AUT: [1, 4, 5, 6, 9, 12, 13, 14, 15, 16, 17, 19],
  JOR: [1, 2, 3, 4, 5, 6, 7, 9, 10, 14, 17, 18, 20],
  POR: [1, 4, 9, 11, 12, 14, 17, 20],
  COD: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20],
  UZB: [1, 3, 6, 9, 10, 11, 12, 13, 14, 15, 17],
  COL: [6, 7, 11, 16, 19, 20],
  ENG: [3, 4, 6, 8, 9, 13, 15, 16, 17, 18, 19, 20],
  CRO: [1, 4, 5, 9, 10, 11, 16, 20],
  GHA: [1, 3, 4, 11, 12, 15, 16, 17, 19, 20],
  PAN: [1, 2, 4, 5, 6, 8, 10, 12, 14, 15, 16, 20],
}

export function createEmptyAlbum(): UserAlbum {
  const album: UserAlbum = {}
  for (const section of ALBUM_SECTIONS) {
    album[section.code] = {}
    for (let i = section.startNumber; i < section.startNumber + section.stickerCount; i++) {
      album[section.code][i.toString()] = { state: 'unmarked', count: 0 }
    }
  }
  return album
}

export function createRoniAlbum(): UserAlbum {
  const album: UserAlbum = {}
  for (const section of ALBUM_SECTIONS) {
    album[section.code] = {}
    const missingSet = new Set(RONI_MISSING_DATA[section.code] || [])
    for (let i = section.startNumber; i < section.startNumber + section.stickerCount; i++) {
      if (missingSet.has(i)) {
        album[section.code][i.toString()] = { state: 'missing', count: 0 }
      } else {
        album[section.code][i.toString()] = { state: 'has', count: 1 }
      }
    }
  }
  return album
}

export function getTotalStickerCount(): number {
  return ALBUM_SECTIONS.reduce((total, section) => total + section.stickerCount, 0)
}

export const AVATAR_OPTIONS = ['⚽', '🏆', '🌟', '🔥', '⭐', '💫', '🎯', '🥇', '🏅', '👑', '🦁', '🐺', '🚀', '⚡', '💎', '🎨']
