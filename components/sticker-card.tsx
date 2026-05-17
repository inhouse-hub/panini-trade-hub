'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { StickerState } from '@/lib/types'
import { useUser } from '@/lib/user-context'
import { cn } from '@/lib/utils'

interface StickerCardProps {
  sectionCode: string
  number: number
  state: StickerState
  count: number
}

const stateConfig: Record<StickerState, { bgClass: string; textClass: string; borderClass: string }> = {
  unmarked: {
    bgClass: 'bg-sticker-unmarked/30',
    textClass: 'text-muted-foreground',
    borderClass: 'border-sticker-unmarked/50',
  },
  has: {
    bgClass: 'bg-sticker-has/20',
    textClass: 'text-sticker-has',
    borderClass: 'border-sticker-has/60',
  },
  missing: {
    bgClass: 'bg-sticker-missing/20',
    textClass: 'text-sticker-missing',
    borderClass: 'border-sticker-missing/60',
  },
}

export function StickerCard({ sectionCode, number, state, count }: StickerCardProps) {
  const { cycleStickerState, updateStickerCount } = useUser()
  const [isAnimating, setIsAnimating] = useState(false)
  const config = stateConfig[state] || stateConfig.unmarked
  const isRepeated = state === 'has' && count >= 2

  const handleClick = () => {
    setIsAnimating(true)
    cycleStickerState(sectionCode, number.toString())
    setTimeout(() => setIsAnimating(false), 200)
  }

  const handleCountChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation()
    updateStickerCount(sectionCode, number.toString(), delta)
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={cn(
          'w-full aspect-square rounded-xl border-2 flex items-center justify-center relative',
          'font-mono text-lg font-bold transition-all duration-150',
          'hover:scale-105 active:scale-95',
          config.bgClass,
          config.textClass,
          config.borderClass,
          isAnimating && 'sticker-pop'
        )}
      >
        <span className="font-display text-xl">{number}</span>
      </button>

      {/* Botón + arriba a la derecha (solo cuando es 'has') */}
      {state === 'has' && (
        <button
          onClick={(e) => handleCountChange(e, 1)}
          className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-cyan text-background border-2 border-background shadow-md hover:scale-110 active:scale-95 transition-transform z-10"
          aria-label="Marcar como repetida o añadir copia"
        >
          {isRepeated ? (
            <span className="font-bold text-[10px] leading-none">R×{count}</span>
          ) : (
            <Plus className="w-3 h-3" strokeWidth={3} />
          )}
        </button>
      )}

      {/* Botón − abajo a la derecha (solo cuando ya es repetida) */}
      {isRepeated && (
        <button
          onClick={(e) => handleCountChange(e, -1)}
          className="absolute -bottom-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-card border-2 border-cyan text-cyan shadow-md hover:scale-110 active:scale-95 transition-transform z-10"
          aria-label="Quitar una copia"
        >
          <Minus className="w-2.5 h-2.5" strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

// Compact sticker for lists
export function StickerBadge({ sectionCode, number, state }: { sectionCode: string; number: number; state: StickerState }) {
  const config = stateConfig[state] || stateConfig.unmarked

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold',
      config.bgClass,
      config.textClass,
      'border',
      config.borderClass
    )}>
      {sectionCode}-{number}
    </span>
  )
}