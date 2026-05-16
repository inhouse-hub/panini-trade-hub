// components/dashboard.tsx — REEMPLAZA el archivo existente
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Check, X, RefreshCw, Circle, TrendingUp, Trophy, Flame, Target,
  Crown, Sparkles, ArrowLeftRight, Clock, ChevronRight, Award
} from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { ALBUM_SECTIONS, getTotalStickerCount } from '@/lib/album-data'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

const STREAK_KEY = 'panini_streak'
const ACTIVITY_KEY = 'panini_activity'
const LAST_ALBUM_KEY = 'panini_last_album_snapshot'

interface ActivityEntry {
  sticker: string
  state: string
  timestamp: number
}

export function Dashboard() {
  const { activeUser, activeUserAlbum, users, getStats, getUserAlbum } = useUser()
  const [streak, setStreak] = useState(1)
  const [activity, setActivity] = useState<ActivityEntry[]>([])

  // ── Streak tracking ───────────────────────────────────────
  useEffect(() => {
    if (!activeUser) return
    const key = `${STREAK_KEY}_${activeUser.id}`
    try {
      const stored = localStorage.getItem(key)
      const today = new Date().toDateString()
      if (stored) {
        const data = JSON.parse(stored)
        const lastDate = new Date(data.lastDate).toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()

        if (lastDate === today) {
          setStreak(data.count)
        } else if (lastDate === yesterday) {
          const newCount = data.count + 1
          setStreak(newCount)
          localStorage.setItem(key, JSON.stringify({ count: newCount, lastDate: Date.now() }))
        } else {
          setStreak(1)
          localStorage.setItem(key, JSON.stringify({ count: 1, lastDate: Date.now() }))
        }
      } else {
        setStreak(1)
        localStorage.setItem(key, JSON.stringify({ count: 1, lastDate: Date.now() }))
      }
    } catch (e) {
      setStreak(1)
    }
  }, [activeUser])

  // ── Activity tracking (detecta cambios de estado) ─────────
  useEffect(() => {
    if (!activeUser || !activeUserAlbum) return
    const lastKey = `${LAST_ALBUM_KEY}_${activeUser.id}`
    const actKey = `${ACTIVITY_KEY}_${activeUser.id}`

    try {
      const storedActivity = localStorage.getItem(actKey)
      if (storedActivity) setActivity(JSON.parse(storedActivity))

      const lastSnapStr = localStorage.getItem(lastKey)
      if (lastSnapStr) {
        const lastSnap = JSON.parse(lastSnapStr)
        const newEntries: ActivityEntry[] = []

        for (const section of ALBUM_SECTIONS) {
          const current = activeUserAlbum[section.code] || {}
          const previous = lastSnap[section.code] || {}
          for (const num in current) {
            if (current[num]?.state !== previous[num]?.state && current[num]?.state !== 'unmarked') {
              newEntries.push({
                sticker: `${section.code}-${num}`,
                state: current[num].state,
                timestamp: Date.now(),
              })
            }
          }
        }

        if (newEntries.length > 0) {
          const prev = storedActivity ? JSON.parse(storedActivity) : []
          const merged = [...newEntries, ...prev].slice(0, 10)
          setActivity(merged)
          localStorage.setItem(actKey, JSON.stringify(merged))
        }
      }

      localStorage.setItem(lastKey, JSON.stringify(activeUserAlbum))
    } catch (e) {
      // ignore
    }
  }, [activeUser, activeUserAlbum])

  // ── Per-section stats ─────────────────────────────────────
  const sectionStats = useMemo(() => {
    if (!activeUserAlbum) return []
    return ALBUM_SECTIONS.map(section => {
      const data = activeUserAlbum[section.code] || {}
      let has = 0, missing = 0, repeated = 0
      for (const num in data) {
        if (data[num].state === 'has') has++
        else if (data[num].state === 'missing') missing++
        else if (data[num].state === 'repeated') { has++; repeated++ }
      }
      const owned = has // 'has' incluye estampas con repetidas (la base)
      const percent = (owned / section.stickerCount) * 100
      return {
        ...section,
        has,
        missing,
        repeated,
        owned,
        percent,
        remaining: section.stickerCount - owned,
      }
    })
  }, [activeUserAlbum])

  // ── Top 3 más cerca de completar (no completados) ─────────
  const closeToComplete = useMemo(() => {
    return sectionStats
      .filter(s => s.percent < 100 && s.owned > 0)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3)
  }, [sectionStats])

  // ── Top 3 con más faltantes ───────────────────────────────
  const mostMissing = useMemo(() => {
    return sectionStats
      .filter(s => s.missing > 0)
      .sort((a, b) => b.missing - a.missing)
      .slice(0, 3)
  }, [sectionStats])

  // ── Completados al 100% ───────────────────────────────────
  const completed = useMemo(() => {
    return sectionStats.filter(s => s.percent === 100)
  }, [sectionStats])

  // ── Ranking de usuarios ───────────────────────────────────
  const ranking = useMemo(() => {
    const total = getTotalStickerCount()
    return users
      .map(u => {
        const stats = getStats(u.id)
        const owned = stats.has + stats.repeated
        return {
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          avatarUrl: u.avatarUrl,
          owned,
          percent: (owned / total) * 100,
          isActive: u.id === activeUser?.id,
        }
      })
      .sort((a, b) => b.percent - a.percent)
  }, [users, activeUser, getStats])

  // ── Oportunidades de trade ────────────────────────────────
  const tradeOpportunities = useMemo(() => {
    if (!activeUser || !activeUserAlbum) return []
    const opportunities: { userId: string; userName: string; userAvatar: string; userAvatarUrl?: string; canGet: number; canGive: number }[] = []

    const myMissing = new Set<string>()
    const myRepeated = new Set<string>()
    for (const section of ALBUM_SECTIONS) {
      const data = activeUserAlbum[section.code] || {}
      for (const num in data) {
        const code = `${section.code}-${num}`
        if (data[num].state === 'missing') myMissing.add(code)
        if (data[num].state === 'repeated') myRepeated.add(code)
      }
    }

    for (const user of users) {
      if (user.id === activeUser.id) continue
      const theirAlbum = getUserAlbum(user.id)
      if (!theirAlbum) continue

      let canGet = 0, canGive = 0
      for (const section of ALBUM_SECTIONS) {
        const data = theirAlbum[section.code] || {}
        for (const num in data) {
          const code = `${section.code}-${num}`
          if (data[num].state === 'repeated' && myMissing.has(code)) canGet++
          if (data[num].state === 'missing' && myRepeated.has(code)) canGive++
        }
      }

      if (canGet > 0 || canGive > 0) {
        opportunities.push({
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          userAvatarUrl: user.avatarUrl,
          canGet,
          canGive,
        })
      }
    }

    return opportunities.sort((a, b) => (b.canGet + b.canGive) - (a.canGet + a.canGive))
  }, [activeUser, activeUserAlbum, users, getUserAlbum])

  if (!activeUser || !activeUserAlbum) return null

  const stats = getStats(activeUser.id)
  const totalStickers = getTotalStickerCount()
  const ownedCount = stats.has + stats.repeated
  const progressPercent = (ownedCount / totalStickers) * 100

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const stateLabel = (s: string) => {
    if (s === 'has') return { text: 'Marcaste como tiene', icon: Check, color: 'text-sticker-has' }
    if (s === 'missing') return { text: 'Marcaste como falta', icon: X, color: 'text-sticker-missing' }
    if (s === 'repeated') return { text: 'Marcaste como repetida', icon: RefreshCw, color: 'text-sticker-repeated' }
    return { text: 'Cambio', icon: Circle, color: 'text-muted-foreground' }
  }

  return (
    <div className="space-y-4">
      {/* ═══ Hero / Welcome ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gold/20 via-card to-cyan/10 border border-gold/30 rounded-2xl p-5 md:p-6">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Bienvenido de vuelta</p>
            <h2 className="font-display text-3xl md:text-4xl text-gold mt-1 truncate">{activeUser.name}</h2>
            <div className="flex items-center gap-3 mt-3 text-sm flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400">
                <Flame className="w-3.5 h-3.5" />
                <span className="font-semibold">{streak}</span>
                <span className="text-xs">día{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium">Sincronizado</span>
              </div>
            </div>
          </div>
          <div className="opacity-30 shrink-0">
            {activeUser.avatarUrl ? (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden">
                <img src={activeUser.avatarUrl} alt={activeUser.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="text-6xl md:text-7xl">{activeUser.avatar}</div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Main progress ═══ */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            <h3 className="font-display text-base text-gold tracking-wider">PROGRESO TOTAL</h3>
          </div>
          <span className="font-mono text-3xl font-bold">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-1000',
              progressPercent === 100 ? 'bg-success' : 'progress-shine'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span><span className="font-mono font-bold text-foreground">{ownedCount}</span> / {totalStickers} estampas</span>
          <span>Faltan <span className="font-mono font-bold text-sticker-missing">{stats.missing}</span></span>
        </div>
      </div>

      {/* ═══ Stats grid (4 cards) ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Check} label="Tiene" value={stats.has + stats.repeated} pct={((stats.has + stats.repeated) / totalStickers) * 100} color="has" />
        <StatCard icon={RefreshCw} label="Repetidas" value={stats.repeated} sub={`${stats.repeatedCount} copias`} color="repeated" />
        <StatCard icon={X} label="Faltan" value={stats.missing} pct={(stats.missing / totalStickers) * 100} color="missing" />
        <StatCard icon={Circle} label="Sin revisar" value={stats.unmarked} pct={(stats.unmarked / totalStickers) * 100} color="muted" />
      </div>

      {/* ═══ Top sections row: cerca de completar + faltan más ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Cerca de completar */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-cyan" />
            <h3 className="font-display text-sm text-cyan tracking-wider">CERCA DE COMPLETAR</h3>
          </div>
          {closeToComplete.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Empieza a marcar para ver tu progreso</p>
          ) : (
            <div className="space-y-3">
              {closeToComplete.map(s => (
                <div key={s.code} className="flex items-center gap-3">
                  <span className="text-xl">{s.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold truncate">{s.name}</span>
                      <span className="font-mono text-xs text-cyan shrink-0">{s.percent.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cyan rounded-full transition-all" style={{ width: `${s.percent}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.remaining} para completar</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Faltan más */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <X className="w-4 h-4 text-sticker-missing" />
            <h3 className="font-display text-sm text-sticker-missing tracking-wider">DONDE FALTA MÁS</h3>
          </div>
          {mostMissing.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">¡No tienes faltantes marcados!</p>
          ) : (
            <div className="space-y-3">
              {mostMissing.map(s => (
                <div key={s.code} className="flex items-center gap-3">
                  <span className="text-xl">{s.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold truncate">{s.name}</span>
                      <span className="font-mono text-xs text-sticker-missing shrink-0">−{s.missing}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{s.has}/{s.stickerCount} obtenidas</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Logros (países completados) ═══ */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            <h3 className="font-display text-sm text-gold tracking-wider">LOGROS</h3>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            <span className="text-gold font-bold">{completed.length}</span>/{ALBUM_SECTIONS.length}
          </span>
        </div>
        {completed.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Completa tu primer país para ganar un logro 🏅</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {completed.map(s => (
              <div
                key={s.code}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/40 text-xs"
              >
                <span>{s.flag}</span>
                <span className="font-semibold">{s.code}</span>
                <Check className="w-3 h-3 text-gold" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Ranking + Trade opportunities ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Ranking */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-gold" />
            <h3 className="font-display text-sm text-gold tracking-wider">RANKING</h3>
          </div>
          <div className="space-y-2">
            {ranking.map((u, idx) => (
              <div
                key={u.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-colors',
                  u.isActive ? 'bg-gold/10 border border-gold/30' : 'bg-muted/30 border border-transparent'
                )}
              >
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  idx === 0 ? 'bg-gold/20 text-gold' :
                  idx === 1 ? 'bg-zinc-400/20 text-zinc-300' :
                  idx === 2 ? 'bg-orange-700/20 text-orange-400' :
                  'bg-muted text-muted-foreground'
                )}>
                  {idx + 1}
                </div>
                <Avatar user={u} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn('text-sm font-semibold truncate', u.isActive && 'text-gold')}>
                      {u.name} {u.isActive && <span className="text-xs font-normal text-gold/70">(tú)</span>}
                    </span>
                    <span className="font-mono text-xs shrink-0">{u.percent.toFixed(1)}%</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        idx === 0 ? 'bg-gold' : idx === 1 ? 'bg-zinc-400' : idx === 2 ? 'bg-orange-500' : 'bg-muted-foreground/50'
                      )}
                      style={{ width: `${u.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade opportunities */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight className="w-4 h-4 text-cyan" />
            <h3 className="font-display text-sm text-cyan tracking-wider">OPORTUNIDADES DE TRADE</h3>
          </div>
          {tradeOpportunities.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Aún no hay matches. Marca tus repetidas y faltantes para ver oportunidades.
            </p>
          ) : (
            <div className="space-y-2">
              {tradeOpportunities.slice(0, 3).map(op => (
                <div key={op.userId} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                  <Avatar user={{ avatar: op.userAvatar, avatarUrl: op.userAvatarUrl, name: op.userName }} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{op.userName}</p>
                    <div className="flex items-center gap-3 text-xs mt-0.5">
                      <span className="text-green-400">
                        +{op.canGet} <span className="text-muted-foreground">para ti</span>
                      </span>
                      <span className="text-orange-400">
                        −{op.canGive} <span className="text-muted-foreground">para él</span>
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Actividad reciente ═══ */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-display text-sm text-muted-foreground tracking-wider">ACTIVIDAD RECIENTE</h3>
        </div>
        {activity.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Marca alguna estampa para ver tu actividad</p>
        ) : (
          <div className="space-y-1.5">
            {activity.slice(0, 5).map((entry, idx) => {
              const info = stateLabel(entry.state)
              const Icon = info.icon
              return (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', `bg-${info.color.replace('text-', '')}/10`)}>
                    <Icon className={cn('w-3.5 h-3.5', info.color)} />
                  </div>
                  <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                    <span className="text-xs">
                      <span className={info.color}>{info.text}</span>
                      <span className="text-muted-foreground"> · </span>
                      <span className="font-mono font-semibold">{entry.sticker}</span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 font-mono">{formatTime(entry.timestamp)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ Stat card component ═══
function StatCard({
  icon: Icon, label, value, pct, sub, color,
}: {
  icon: typeof Check
  label: string
  value: number
  pct?: number
  sub?: string
  color: 'has' | 'repeated' | 'missing' | 'muted'
}) {
  const colorMap = {
    has: { text: 'text-sticker-has', border: 'border-sticker-has/30' },
    repeated: { text: 'text-sticker-repeated', border: 'border-sticker-repeated/30' },
    missing: { text: 'text-sticker-missing', border: 'border-sticker-missing/30' },
    muted: { text: 'text-muted-foreground', border: 'border-border' },
  }
  const c = colorMap[color]
  return (
    <div className={cn('bg-card/50 backdrop-blur-sm border rounded-xl p-4', c.border)}>
      <div className={cn('flex items-center gap-2 mb-2', c.text)}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-mono text-3xl font-bold leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1.5">
        {sub ?? (pct !== undefined ? `${pct.toFixed(1)}%` : '')}
      </p>
    </div>
  )
}
