// components/weekly-challenge.tsx — NUEVO
'use client'

import { useMemo } from 'react'
import { Flame, Calendar, Crown } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

// Inicio del lunes pasado a las 00:00
function getMondayStart(): number {
  const now = new Date()
  const day = now.getDay() // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.getTime()
}

export function WeeklyChallenge() {
  const { feedEvents, users, activeUser } = useUser()

  const ranking = useMemo(() => {
    const monday = getMondayStart()
    const counts = new Map<string, number>()
    for (const ev of feedEvents) {
      if (ev.createdAt < monday) continue
      if (ev.type === 'sticker_milestone' || ev.type === 'section_complete') {
        // Aproximamos por # de eventos (cada milestone = avance)
        const add = ev.data?.count || 1
        counts.set(ev.userId, (counts.get(ev.userId) || 0) + add)
      }
    }
    return users
      .map(u => ({ user: u, score: counts.get(u.id) || 0 }))
      .sort((a, b) => b.score - a.score)
  }, [feedEvents, users])

  const leader = ranking[0]
  const myScore = ranking.find(r => r.user.id === activeUser?.id)?.score || 0

  // Tiempo restante hasta el próximo lunes
  const daysLeft = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day
    return daysUntilMonday
  }, [])

  return (
    <div className="bg-gradient-to-br from-orange-500/10 via-card to-gold/10 border border-orange-500/30 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base text-orange-400 tracking-wider flex items-center gap-2">
          <Flame className="w-4 h-4" />
          RETO SEMANAL
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{daysLeft} día{daysLeft !== 1 ? 's' : ''} más</span>
        </div>
      </div>

      {ranking.every(r => r.score === 0) ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            ¿Quién consigue más estampas esta semana?
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            La competencia arranca cuando alguien marque la primera 🔥
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.slice(0, 4).map((r, idx) => {
            const isMe = r.user.id === activeUser?.id
            const isLeader = idx === 0 && r.score > 0
            return (
              <div
                key={r.user.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-xl transition-colors',
                  isMe ? 'bg-gold/10 border border-gold/30' : 'bg-card/40'
                )}
              >
                <span className={cn(
                  'font-mono font-bold w-5 text-center text-sm',
                  idx === 0 ? 'text-orange-400' : 'text-muted-foreground'
                )}>
                  {idx + 1}
                </span>
                <Avatar user={r.user} size="sm" />
                <p className="flex-1 text-sm font-semibold flex items-center gap-1.5">
                  {r.user.name}
                  {isMe && <span className="text-[10px] text-gold">(tú)</span>}
                  {isLeader && <Crown className="w-3.5 h-3.5 text-orange-400" />}
                </p>
                <p className="font-mono font-bold text-sm">{r.score}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
