// components/sticker-card.tsx — REEMPLAZA el archivo existente
'use client'

import { useState } from 'react'
import { Minus, Plus, Check, X, RefreshCw, Circle } from 'lucide-react'
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
    label: 'Sin marcar',
    bgClass: 'bg-sticker-unmarked/30',
    textClass: 'text-muted-foreground',
    borderClass: 'border-sticker-unmarked/50',
  },
  has: {
    label: 'Tengo',
    bgClass: 'bg-sticker-has/20',
    textClass: 'text-sticker-has',
    borderClass: 'border-sticker-has/60',
  },
  repeated: {
    label: 'Repetida',
    bgClass: 'bg-sticker-repeated/20',
    textClass: 'text-sticker-repeated',
    borderClass: 'border-sticker-repeated/60',
  },
  missing: {
    label: 'Falta',
    bgClass: 'bg-sticker-missing/20',
    textClass: 'text-sticker-missing',
    borderClass: 'border-sticker-missing/60',
  },
}

export function StickerCard({ sectionCode, number, state, count }: StickerCardProps) {
  const { updateStickerState, updateStickerCount } = useUser()
  const [showModal, setShowModal] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const config = stateConfig[state]

  const handleClick = () => {
    setIsAnimating(true)
    setShowModal(true)
    setTimeout(() => setIsAnimating(false), 200)
  }

  const handleSelectState = (newState: StickerState) => {
    if (newState === 'repeated' && state !== 'repeated') {
      // Si es la primera vez que se marca como repetida, arranca con count=2
      updateStickerState(sectionCode, number.toString(), 'repeated', 2)
    } else if (newState !== 'repeated') {
      // Otros estados no necesitan count, cerramos modal
      updateStickerState(sectionCode, number.toString(), newState)
      setShowModal(false)
    } else {
      // Ya era repetida y volvió a tap "repetida" → no hace nada
    }
  }

  const handleCountChange = (delta: number) => {
    updateStickerCount(sectionCode, number.toString(), delta)
  }

  return (
    <>
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
          {state === 'repeated' && count > 0 && (
            <span className="absolute -top-1 -right-1 bg-cyan text-background text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Modal de selección de estado */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <h3 className="font-display text-2xl text-gold">{sectionCode}-{number}</h3>
                <span className="text-xs text-muted-foreground">{config.label}</span>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 botones de estado */}
            <div className="space-y-2">
              <StateButton
                icon={Circle}
                label="Sin marcar"
                isActive={state === 'unmarked'}
                onClick={() => handleSelectState('unmarked')}
                color="muted"
              />
              <StateButton
                icon={Check}
                label="Tengo"
                isActive={state === 'has'}
                onClick={() => handleSelectState('has')}
                color="has"
              />
              <StateButton
                icon={RefreshCw}
                label="Repetida"
                isActive={state === 'repeated'}
                onClick={() => handleSelectState('repeated')}
                color="repeated"
                rightContent={state === 'repeated' ? (
                  <div
                    className="flex items-center gap-2 bg-card/80 rounded-lg p-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleCountChange(-1)}
                      disabled={count <= 2}
                      className={cn(
                        'w-7 h-7 flex items-center justify-center rounded transition-colors',
                        count <= 2
                          ? 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
                          : 'bg-muted hover:bg-muted/70 text-foreground'
                      )}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-sm w-6 text-center text-cyan">×{count}</span>
                    <button
                      onClick={() => handleCountChange(1)}
                      className="w-7 h-7 flex items-center justify-center rounded bg-muted hover:bg-muted/70 text-foreground transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}
              />
              <StateButton
                icon={X}
                label="Falta"
                isActive={state === 'missing'}
                onClick={() => handleSelectState('missing')}
                color="missing"
              />
            </div>

            {/* Helper text */}
            {state === 'repeated' && (
              <p className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t border-border">
                Usa <span className="font-mono">+ /−</span> para ajustar cuántas copias tienes
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function StateButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  color,
  rightContent,
}: {
  icon: typeof Check
  label: string
  isActive: boolean
  onClick: () => void
  color: 'muted' | 'has' | 'repeated' | 'missing'
  rightContent?: React.ReactNode
}) {
  const colorMap = {
    muted: {
      active: 'bg-muted/50 border-muted-foreground/40 text-foreground',
      inactive: 'border-border hover:border-muted-foreground/30 text-muted-foreground',
    },
    has: {
      active: 'bg-sticker-has/15 border-sticker-has/60 text-sticker-has',
      inactive: 'border-border hover:border-sticker-has/30 text-muted-foreground hover:text-sticker-has',
    },
    repeated: {
      active: 'bg-sticker-repeated/15 border-sticker-repeated/60 text-sticker-repeated',
      inactive: 'border-border hover:border-sticker-repeated/30 text-muted-foreground hover:text-sticker-repeated',
    },
    missing: {
      active: 'bg-sticker-missing/15 border-sticker-missing/60 text-sticker-missing',
      inactive: 'border-border hover:border-sticker-missing/30 text-muted-foreground hover:text-sticker-missing',
    },
  }
  const c = colorMap[color]

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all',
        isActive ? c.active : c.inactive
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0', isActive && 'scale-110')} />
      <span className="flex-1 text-left font-semibold text-sm">{label}</span>
      {rightContent}
      {isActive && !rightContent && (
        <Check className="w-4 h-4 shrink-0" />
      )}
    </button>
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