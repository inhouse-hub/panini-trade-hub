// components/achievements-view.tsx — NUEVO
'use client'

import { useMemo } from 'react'
import { Trophy, Lock } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { ACHIEVEMENTS, AchievementCategory } from '@/lib/achievements'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<AchievementCategory, { label: string; icon: string }> = {
  progress: { label: 'Progreso', icon: '📈' },
  trade: { label: 'Intercambios', icon: '🔄' },
  social: { label: 'Social', icon: '💬' },
  special: { label: 'Especiales', icon: '⭐' },
}

interface Props {
  userId?: string  // Si no se pasa, usa activeUser
  compact?: boolean
}

export function AchievementsView({ userId, compact }: Props) {
  const { activeUser, achievements } = useUser()
  const targetId = userId || activeUser?.id

  const unlockedIds = useMemo(() => {
    if (!targetId) return new Set<string>()
    return new Set(achievements.filter(a => a.userId === targetId).map(a => a.achievementId))
  }, [achievements, targetId])

  const unlockedAt = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of achievements) {
      if (a.userId === targetId) map.set(a.achievementId, a.unlockedAt)
    }
    return map
  }, [achievements, targetId])

  const grouped = useMemo(() => {
    const map: Record<AchievementCategory, typeof ACHIEVEMENTS> = {
      progress: [], trade: [], social: [], special: [],
    }
    for (const a of ACHIEVEMENTS) map[a.category].push(a)
    return map
  }, [])

  const totalUnlocked = unlockedIds.size
  const totalAchievements = ACHIEVEMENTS.length

  if (compact) {
    const recent = [...achievements]
      .filter(a => a.userId === targetId)
      .sort((a, b) => b.unlockedAt - a.unlockedAt)
      .slice(0, 6)
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base text-gold tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            LOGROS
          </h3>
          <p className="text-xs font-mono text-muted-foreground">{totalUnlocked}/{totalAchievements}</p>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Completa tu primer país para ganar un logro 🏅
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recent.map(a => {
              const ach = ACHIEVEMENTS.find(x => x.id === a.achievementId)
              if (!ach) return null
              return (
                <div
                  key={a.achievementId}
                  className="flex items-center gap-1.5 px-2 py-1 bg-gold/10 border border-gold/30 rounded-full"
                  title={ach.description}
                >
                  <span className="text-base">{ach.icon}</span>
                  <span className="text-xs font-semibold text-gold">{ach.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-gold/15 via-card to-purple-500/10 border border-gold/30 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl text-gold flex items-center gap-2">
            <Trophy className="w-6 h-6" /> LOGROS
          </h2>
          <p className="font-mono text-2xl font-bold">{totalUnlocked}<span className="text-muted-foreground">/{totalAchievements}</span></p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-purple-400 transition-all"
            style={{ width: `${(totalUnlocked / totalAchievements) * 100}%` }}
          />
        </div>
      </div>

      {/* Categorías */}
      {(Object.keys(grouped) as AchievementCategory[]).map(cat => {
        const items = grouped[cat]
        const catUnlocked = items.filter(a => unlockedIds.has(a.id)).length
        return (
          <div key={cat} className="bg-card/30 border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <span className="text-base">{CATEGORY_LABELS[cat].icon}</span>
                {CATEGORY_LABELS[cat].label}
              </h3>
              <p className="text-xs font-mono text-muted-foreground">{catUnlocked}/{items.length}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {items.map(a => {
                const unlocked = unlockedIds.has(a.id)
                return (
                  <div
                    key={a.id}
                    className={cn(
                      'p-3 rounded-xl border transition-all',
                      unlocked
                        ? 'bg-gradient-to-br from-gold/10 to-purple-500/5 border-gold/40'
                        : 'bg-muted/20 border-border opacity-50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl shrink-0">{unlocked ? a.icon : '🔒'}</span>
                      <div className="min-w-0 flex-1">
                        <p className={cn('font-semibold text-xs', unlocked ? 'text-gold' : 'text-muted-foreground')}>
                          {a.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
