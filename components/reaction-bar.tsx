// components/reaction-bar.tsx — NUEVO
'use client'

import { useState } from 'react'
import { Smile, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '⚽', '🎉', '😂', '😮', '🚀']

interface ReactionBarProps {
  reactions: { emoji: string; count: number; userIds: string[] }[]
  currentUserId: string
  onToggleReaction: (emoji: string) => void
  showPicker?: boolean
  variant?: 'feed' | 'message'
  onTogglePicker?: () => void
}

export function ReactionBar({
  reactions, currentUserId, onToggleReaction,
  showPicker, variant = 'feed', onTogglePicker,
}: ReactionBarProps) {
  const [internalPicker, setInternalPicker] = useState(false)
  const pickerOpen = showPicker !== undefined ? showPicker : internalPicker
  const togglePicker = onTogglePicker || (() => setInternalPicker(p => !p))

  return (
    <div className="relative inline-flex items-center gap-1.5 flex-wrap">
      {/* Existing reactions */}
      {reactions.map(r => {
        const userReacted = r.userIds.includes(currentUserId)
        return (
          <button
            key={r.emoji}
            onClick={() => onToggleReaction(r.emoji)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border',
              userReacted
                ? 'bg-gold/20 border-gold/50 text-gold'
                : 'bg-card/60 border-border hover:bg-muted hover:border-gold/30'
            )}
          >
            <span className="text-sm">{r.emoji}</span>
            <span className="font-mono font-semibold">{r.count}</span>
          </button>
        )
      })}

      {/* Add reaction button */}
      <button
        onClick={togglePicker}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors',
          variant === 'feed' ? 'w-7 h-7 bg-card/60 border border-border hover:bg-muted' : 'w-6 h-6 bg-card/60 border border-border hover:bg-muted'
        )}
        title="Reaccionar"
      >
        <Smile className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Picker */}
      {pickerOpen && (
        <div
          className={cn(
            'absolute z-30 flex gap-1 p-2 bg-card border border-border rounded-xl shadow-2xl',
            variant === 'feed' ? 'bottom-full mb-1 left-0' : 'bottom-full mb-1 left-0'
          )}
        >
          {QUICK_EMOJIS.map(e => {
            const userHas = reactions.some(r => r.emoji === e && r.userIds.includes(currentUserId))
            return (
              <button
                key={e}
                onClick={() => {
                  onToggleReaction(e)
                  togglePicker()
                }}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all hover:scale-125',
                  userHas && 'bg-gold/20 ring-1 ring-gold/40'
                )}
              >
                {e}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Helper para agrupar reacciones por emoji
export function groupReactions(reactions: { emoji: string; userId: string }[]) {
  const map = new Map<string, { emoji: string; count: number; userIds: string[] }>()
  for (const r of reactions) {
    const existing = map.get(r.emoji)
    if (existing) {
      existing.count++
      existing.userIds.push(r.userId)
    } else {
      map.set(r.emoji, { emoji: r.emoji, count: 1, userIds: [r.userId] })
    }
  }
  return Array.from(map.values())
}
