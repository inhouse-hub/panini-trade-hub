'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X, RefreshCw, Circle, ChevronDown, ChevronUp, MoreHorizontal, Trash2, CheckCheck, XCircle, RotateCcw } from 'lucide-react'
import { AlbumSection } from '@/lib/types'
import { useUser } from '@/lib/user-context'
import { StickerCard } from './sticker-card'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface SectionCardProps {
  section: AlbumSection
}

export function SectionCard({ section }: SectionCardProps) {
  const { activeUserAlbum } = useUser()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [wasComplete, setWasComplete] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)
  const { markAllSection, clearSection } = useUser()

  const sectionData = activeUserAlbum?.[section.code] || {}
  
  // Calculate stats
  const stickers = []
  for (let i = section.startNumber; i < section.startNumber + section.stickerCount; i++) {
    stickers.push({
      number: i,
      data: sectionData[i.toString()] || { state: 'unmarked' as const, count: 0 }
    })
  }
  
  const hasCount = stickers.filter(s => s.data.state === 'has').length
  const repeatedCount = stickers.filter(s => s.data.state === 'repeated').length
  const missingCount = stickers.filter(s => s.data.state === 'missing').length
  const ownedCount = hasCount + repeatedCount
  const progress = (ownedCount / section.stickerCount) * 100
  const isComplete = ownedCount === section.stickerCount && missingCount === 0

  // Celebration effect when section becomes complete
  useEffect(() => {
    if (isComplete && !wasComplete) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#06b6d4', '#22c55e'],
      })
    }
    setWasComplete(isComplete)
  }, [isComplete, wasComplete])

  // Close actions menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn(
      'bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden transition-all duration-300',
      isComplete && 'border-success/50 celebrate'
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        <span className="text-2xl">{section.flag}</span>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl tracking-wide text-gold">{section.code}</span>
            <span className="text-sm text-muted-foreground">{section.name}</span>
            {isComplete && (
              <span className="px-2 py-0.5 bg-success/20 text-success text-xs font-semibold rounded-full">
                COMPLETO
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isComplete ? 'bg-success' : 'progress-shine'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Stats */}
          <div className="mt-1.5 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-sticker-has">
              <Check className="w-3 h-3" /> {hasCount}
            </span>
            <span className="flex items-center gap-1 text-sticker-repeated">
              <RefreshCw className="w-3 h-3" /> {repeatedCount}
            </span>
            <span className="flex items-center gap-1 text-sticker-missing">
              <X className="w-3 h-3" /> {missingCount}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Circle className="w-3 h-3" /> {section.stickerCount - hasCount - repeatedCount - missingCount}
            </span>
            <span className="ml-auto text-muted-foreground font-mono">
              {ownedCount}/{section.stickerCount}
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-border/50">
          {/* Quick actions */}
          <div className="flex items-center justify-end mb-3 relative" ref={actionsRef}>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showActions && (
              <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => { markAllSection(section.code, 'has'); setShowActions(false) }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted/50 text-left"
                >
                  <CheckCheck className="w-4 h-4 text-sticker-has" />
                  Marcar todas como tiene
                </button>
                <button
                  onClick={() => { markAllSection(section.code, 'missing'); setShowActions(false) }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted/50 text-left"
                >
                  <XCircle className="w-4 h-4 text-sticker-missing" />
                  Marcar todas como faltan
                </button>
                <button
                  onClick={() => { clearSection(section.code); setShowActions(false) }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted/50 text-left text-danger"
                >
                  <RotateCcw className="w-4 h-4" />
                  Limpiar sección
                </button>
              </div>
            )}
          </div>

          {/* Sticker grid */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {stickers.map(({ number, data }) => (
              <StickerCard
                key={number}
                sectionCode={section.code}
                number={number}
                state={data.state}
                count={data.count}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sticker-unmarked/30 border border-sticker-unmarked/50" />
              Sin marcar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sticker-has/20 border border-sticker-has/60" />
              Tiene
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sticker-repeated/20 border border-sticker-repeated/60" />
              Repetida
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sticker-missing/20 border border-sticker-missing/60" />
              Falta
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
