'use client'

import { Check, X, RefreshCw, Circle, TrendingUp } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { getTotalStickerCount } from '@/lib/album-data'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { activeUser, getStats } = useUser()
  
  if (!activeUser) return null
  
  const stats = getStats(activeUser.id)
  const totalStickers = getTotalStickerCount()
  const ownedCount = stats.has + stats.repeated
  const progressPercent = (ownedCount / totalStickers) * 100
  
  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gold/20 via-card to-cyan/10 border border-gold/30 rounded-2xl p-6">
        <div className="relative z-10">
          <p className="text-muted-foreground text-sm">Bienvenido de vuelta,</p>
          <h2 className="font-display text-4xl text-gold mt-1">{activeUser.name}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Tu progreso en el álbum del Mundial 2026
          </p>
        </div>
        <div className="absolute -right-4 -top-4 text-[120px] opacity-10">
          {activeUser.avatar}
        </div>
      </div>

      {/* Main progress */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-gold">Progreso Total</h3>
          <span className="font-mono text-2xl font-bold text-foreground">
            {progressPercent.toFixed(1)}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
          <div 
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-1000',
              progressPercent === 100 ? 'bg-success' : 'progress-shine'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-gold" />
          <span className="font-mono font-bold text-foreground">{ownedCount}</span>
          de {totalStickers} estampas
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Has */}
        <div className="bg-card/50 backdrop-blur-sm border border-sticker-has/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sticker-has mb-2">
            <Check className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Tiene</span>
          </div>
          <p className="font-mono text-3xl font-bold">{stats.has}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {((stats.has / totalStickers) * 100).toFixed(1)}%
          </p>
        </div>

        {/* Repeated */}
        <div className="bg-card/50 backdrop-blur-sm border border-sticker-repeated/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sticker-repeated mb-2">
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Repetidas</span>
          </div>
          <p className="font-mono text-3xl font-bold">{stats.repeated}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.repeatedCount} copias totales
          </p>
        </div>

        {/* Missing */}
        <div className="bg-card/50 backdrop-blur-sm border border-sticker-missing/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sticker-missing mb-2">
            <X className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Faltan</span>
          </div>
          <p className="font-mono text-3xl font-bold">{stats.missing}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {((stats.missing / totalStickers) * 100).toFixed(1)}%
          </p>
        </div>

        {/* Unmarked */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Circle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Sin revisar</span>
          </div>
          <p className="font-mono text-3xl font-bold">{stats.unmarked}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {((stats.unmarked / totalStickers) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Quick tips */}
      <div className="bg-card/30 border border-border rounded-xl p-4">
        <h4 className="font-semibold text-sm mb-3">Tips rápidos</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            Toca una estampa para cambiar su estado: sin marcar → tiene → repetida → falta
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            Mantén presionado en una estampa repetida para ajustar la cantidad
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold">•</span>
            Usa la pestaña Trade para encontrar intercambios con otros usuarios
          </li>
        </ul>
      </div>
    </div>
  )
}
