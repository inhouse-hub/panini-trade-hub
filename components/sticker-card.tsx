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
  repeated: {
    bgClass: 'bg-sticker-repeated/20',
    textClass: 'text-sticker-repeated',
    borderClass: 'border-sticker-repeated/60',
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
  const config = stateConfig[state]

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
          'w-full aspect-square rounded-xl border-2 flex items-center justify-center',
          'font-mono text-lg font-bold transition-all duration-150',
          'hover:scale-105 active:scale-95',
          config.bgClass,
          config.textClass,
          config.borderClass,
          isAnimating && 'sticker-pop'
        )}
      >
        <span className="font-display text-xl">{number}</span>

        {/* Badge de cantidad arriba a la derecha */}
        {state === 'repeated' && count > 0 && (
          <span className="absolute -top-1 -right-1 bg-cyan text-background text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
            {count}
          </span>
        )}
      </button>

      {/* Botones +/- inline cuando está en repetida */}
      {state === 'repeated' && (
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 z-10">
          <button
            onClick={(e) => handleCountChange(e, -1)}
            disabled={count <= 2}
            className={cn(
              'w-5 h-5 flex items-center justify-center rounded-md transition-colors',
              count <= 2
                ? 'bg-card/60 text-muted-foreground/40 cursor-not-allowed'
                : 'bg-card hover:bg-cyan/30 text-foreground border border-cyan/40'
            )}
          >
            <Minus className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={(e) => handleCountChange(e, 1)}
            className="w-5 h-5 flex items-center justify-center rounded-md bg-card hover:bg-cyan/30 text-foreground border border-cyan/40 transition-colors"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// Compact sticker for lists
export function StickerBadge({ sectionCode, number, state }: { sectionCode: string; number: number; state: StickerState }) {
  const config = stateConfig[state]

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