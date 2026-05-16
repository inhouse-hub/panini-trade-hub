'use client'

import { useState, useRef, useEffect } from 'react'
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

const stateConfig: Record<StickerState, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
  unmarked: {
    label: '',
    bgClass: 'bg-sticker-unmarked/30',
    textClass: 'text-muted-foreground',
    borderClass: 'border-sticker-unmarked/50',
  },
  has: {
    label: '',
    bgClass: 'bg-sticker-has/20',
    textClass: 'text-sticker-has',
    borderClass: 'border-sticker-has/60',
  },
  repeated: {
    label: '',
    bgClass: 'bg-sticker-repeated/20',
    textClass: 'text-sticker-repeated',
    borderClass: 'border-sticker-repeated/60',
  },
  missing: {
    label: '',
    bgClass: 'bg-sticker-missing/20',
    textClass: 'text-sticker-missing',
    borderClass: 'border-sticker-missing/60',
  },
}

export function StickerCard({ sectionCode, number, state, count }: StickerCardProps) {
  const { cycleStickerState, updateStickerCount } = useUser()
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCounter, setShowCounter] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const config = stateConfig[state]

  const handleClick = () => {
    if (showCounter) {
      setShowCounter(false)
      return
    }
    setIsAnimating(true)
    cycleStickerState(sectionCode, number.toString())
    setTimeout(() => setIsAnimating(false), 200)
  }

  const handleLongPressStart = () => {
    if (state === 'repeated') {
      longPressTimer.current = setTimeout(() => {
        setShowCounter(true)
      }, 500)
    }
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  useEffect(() => {
    if (state !== 'repeated') {
      setShowCounter(false)
    }
  }, [state])

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
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
        {state === 'repeated' && count > 0 && (
          <span className="absolute -top-1 -right-1 bg-cyan text-background text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      
      {showCounter && state === 'repeated' && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-lg z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              updateStickerCount(sectionCode, number.toString(), -1)
            }}
            className="w-6 h-6 flex items-center justify-center rounded bg-muted hover:bg-muted/80 text-foreground"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono text-sm w-6 text-center">{count}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              updateStickerCount(sectionCode, number.toString(), 1)
            }}
            className="w-6 h-6 flex items-center justify-center rounded bg-muted hover:bg-muted/80 text-foreground"
          >
            <Plus className="w-3 h-3" />
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
