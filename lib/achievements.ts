// lib/achievements.ts — NUEVO

export type AchievementCategory = 'progress' | 'social' | 'trade' | 'special'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
}

export const ACHIEVEMENTS: Achievement[] = [
  // Progress
  { id: 'first_sticker', name: 'Primer paso', description: 'Marca tu primera estampa', icon: '⚽', category: 'progress' },
  { id: 'collector_50', name: 'Coleccionista', description: 'Consigue 50 estampas', icon: '📚', category: 'progress' },
  { id: 'collector_100', name: 'Centena', description: 'Consigue 100 estampas', icon: '💯', category: 'progress' },
  { id: 'collector_250', name: 'Un cuarto', description: 'Consigue 250 estampas', icon: '🎯', category: 'progress' },
  { id: 'collector_500', name: 'Mitad del camino', description: 'Consigue 500 estampas', icon: '🏃', category: 'progress' },
  { id: 'collector_750', name: 'En la recta final', description: 'Consigue 750 estampas', icon: '🚀', category: 'progress' },
  { id: 'album_complete', name: 'Maestro Panini', description: 'Completa el álbum entero', icon: '👑', category: 'progress' },

  // Países
  { id: 'first_country', name: 'Primer país', description: 'Completa un país', icon: '🇲🇽', category: 'progress' },
  { id: 'five_countries', name: 'Mundialista', description: 'Completa 5 países', icon: '🌎', category: 'progress' },
  { id: 'ten_countries', name: 'Globetrotter', description: 'Completa 10 países', icon: '✈️', category: 'progress' },
  { id: 'twenty_countries', name: 'Todo terreno', description: 'Completa 20 países', icon: '🗺️', category: 'progress' },

  // Repetidas
  { id: 'first_repeated', name: 'Primera repe', description: 'Tu primera estampa repetida', icon: '🔄', category: 'trade' },
  { id: 'repeated_10', name: 'Acumulador', description: '10 estampas repetidas', icon: '📦', category: 'trade' },
  { id: 'repeated_50', name: 'Negocio en grande', description: '50 estampas repetidas', icon: '💰', category: 'trade' },

  // Trades
  { id: 'first_trade', name: 'Primer intercambio', description: 'Completa tu primer trade', icon: '🤝', category: 'trade' },
  { id: 'trader_5', name: 'Negociador', description: 'Completa 5 trades', icon: '⚖️', category: 'trade' },
  { id: 'trader_15', name: 'Pro del trade', description: 'Completa 15 trades', icon: '🏆', category: 'trade' },

  // Social
  { id: 'first_message', name: 'Saludando', description: 'Manda tu primer mensaje', icon: '💬', category: 'social' },
  { id: 'chatter_50', name: 'Conversador', description: 'Manda 50 mensajes', icon: '🗣️', category: 'social' },

  // Streaks
  { id: 'streak_3', name: 'Constancia', description: '3 días seguidos', icon: '🔥', category: 'special' },
  { id: 'streak_7', name: 'Una semana', description: '7 días seguidos', icon: '⚡', category: 'special' },
  { id: 'streak_14', name: 'Quincena', description: '14 días seguidos', icon: '💎', category: 'special' },
  { id: 'streak_30', name: 'Mes completo', description: '30 días seguidos', icon: '🏅', category: 'special' },
]

export interface AchievementContext {
  totalHas: number
  totalRepeated: number
  countriesCompleted: number
  tradesCompleted: number
  messagesSent: number
  streakDays: number
  albumTotal: number
}

// Check si un logro está cumplido dado el contexto
export function isAchievementUnlocked(achievementId: string, ctx: AchievementContext): boolean {
  switch (achievementId) {
    case 'first_sticker': return ctx.totalHas >= 1
    case 'collector_50': return ctx.totalHas >= 50
    case 'collector_100': return ctx.totalHas >= 100
    case 'collector_250': return ctx.totalHas >= 250
    case 'collector_500': return ctx.totalHas >= 500
    case 'collector_750': return ctx.totalHas >= 750
    case 'album_complete': return ctx.totalHas >= ctx.albumTotal

    case 'first_country': return ctx.countriesCompleted >= 1
    case 'five_countries': return ctx.countriesCompleted >= 5
    case 'ten_countries': return ctx.countriesCompleted >= 10
    case 'twenty_countries': return ctx.countriesCompleted >= 20

    case 'first_repeated': return ctx.totalRepeated >= 1
    case 'repeated_10': return ctx.totalRepeated >= 10
    case 'repeated_50': return ctx.totalRepeated >= 50

    case 'first_trade': return ctx.tradesCompleted >= 1
    case 'trader_5': return ctx.tradesCompleted >= 5
    case 'trader_15': return ctx.tradesCompleted >= 15

    case 'first_message': return ctx.messagesSent >= 1
    case 'chatter_50': return ctx.messagesSent >= 50

    case 'streak_3': return ctx.streakDays >= 3
    case 'streak_7': return ctx.streakDays >= 7
    case 'streak_14': return ctx.streakDays >= 14
    case 'streak_30': return ctx.streakDays >= 30

    default: return false
  }
}

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id)
}

// Encuentra logros recién desbloqueados (no estaban antes)
export function findNewlyUnlocked(ctx: AchievementContext, alreadyUnlocked: string[]): Achievement[] {
  const have = new Set(alreadyUnlocked)
  return ACHIEVEMENTS.filter(a => !have.has(a.id) && isAchievementUnlocked(a.id, ctx))
}
