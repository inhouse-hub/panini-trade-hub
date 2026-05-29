// lib/album-data.ts — REEMPLAZA el archivo existente
import { AlbumSection, User, UserAlbum } from './types'

export const ALBUM_SECTIONS: AlbumSection[] = [
  { code: 'FWC', name: 'FIFA World Cup', flag: '🏆', stickerCount: 20, startNumber: 0 },
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
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳', stickerCount: 20, startNumber: 1 },
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

export const TOTAL_STICKERS = ALBUM_SECTIONS.reduce((acc, s) => acc + s.stickerCount, 0)

export function getTotalStickerCount(): number {
  return TOTAL_STICKERS
}

export const AVATAR_OPTIONS = ['⚽', '🏆', '🌟', '👑', '🥇', '🎯', '🔥', '⭐', '💎', '🎮', '🏅', '🚀']

export const DEFAULT_USERS: User[] = [
  { id: 'jorge', name: 'Jorge', avatar: '👑', pin: '9999', isAdmin: true, createdAt: Date.now() },
  { id: 'roni', name: 'RoNi', avatar: '⚽', pin: '1234', createdAt: Date.now() },
  { id: 'carlos', name: 'Carlos', avatar: '🥇', pin: '1234', createdAt: Date.now() },
  { id: 'fabio', name: 'Fabio', avatar: '🌟', pin: '1234', createdAt: Date.now() },
]

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

// Crear álbum con todas marcadas como 'tengo' (útil para nuevos usuarios que solo quieren marcar faltantes)
export function createCompletedAlbum(): UserAlbum {
  const album: UserAlbum = {}
  for (const section of ALBUM_SECTIONS) {
    album[section.code] = {}
    for (let i = section.startNumber; i < section.startNumber + section.stickerCount; i++) {
      album[section.code][i.toString()] = { state: 'has', count: 1 }
    }
  }
  return album
}

// RoNi precargado al 43.2%
export function createRoniAlbum(): UserAlbum {
  return createEmptyAlbum()
}