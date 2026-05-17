// components/feed-view.tsx — NUEVO
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, MessageCircle, Trophy, ArrowLeftRight, Sparkles, Target, Flame } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { FeedEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'
import { ReactionBar, groupReactions } from './reaction-bar'
import { getAchievement } from '@/lib/achievements'

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'ahora'
  const min = Math.floor(sec / 60)
  if (min < 60) return `hace ${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `hace ${day}d`
  return new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

const TYPE_ICONS = {
  sticker_milestone: { icon: Target, color: 'text-cyan' },
  section_complete: { icon: Trophy, color: 'text-gold' },
  trade_done: { icon: ArrowLeftRight, color: 'text-green-400' },
  achievement: { icon: Sparkles, color: 'text-purple-400' },
}

export function FeedView() {
  const {
    feedEvents, reactions, comments, users, activeUser,
    toggleReactionOnEvent, postComment, loadCommentsFor,
  } = useUser()
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [activePicker, setActivePicker] = useState<string | null>(null)

  // Cargar comentarios cuando se expande
  useEffect(() => {
    for (const id of expandedComments) {
      loadCommentsFor(id)
    }
  }, [expandedComments, loadCommentsFor])

  const eventReactions = useMemo(() => {
    const map = new Map<string, { emoji: string; userId: string }[]>()
    for (const r of reactions) {
      if (r.targetType !== 'event') continue
      const arr = map.get(r.targetId) || []
      arr.push({ emoji: r.emoji, userId: r.userId })
      map.set(r.targetId, arr)
    }
    return map
  }, [reactions])

  const eventComments = useMemo(() => {
    const map = new Map<string, typeof comments>()
    for (const c of comments) {
      const arr = map.get(c.eventId) || []
      arr.push(c)
      map.set(c.eventId, arr)
    }
    return map
  }, [comments])

  const getUser = (id: string) => users.find(u => u.id === id)

  const toggleCommentsExpanded = (eventId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  const handleSendComment = async (eventId: string) => {
    const text = (commentDrafts[eventId] || '').trim()
    if (!text || !activeUser) return
    await postComment(eventId, text)
    setCommentDrafts(prev => ({ ...prev, [eventId]: '' }))
  }

  if (feedEvents.length === 0) {
    return (
      <div className="text-center py-16">
        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm font-semibold mb-1">Aún no hay actividad</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Cuando alguien complete un país, haga trade o llegue a un hito, lo verás aquí
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-gold">FEED</h2>
        <p className="text-xs text-muted-foreground">{feedEvents.length} eventos</p>
      </div>

      {feedEvents.map(ev => {
        const user = getUser(ev.userId)
        const iconCfg = TYPE_ICONS[ev.type] || { icon: Sparkles, color: 'text-cyan' }
        const Icon = iconCfg.icon
        const evReactionsRaw = eventReactions.get(ev.id) || []
        const grouped = groupReactions(evReactionsRaw)
        const evComments = eventComments.get(ev.id) || []
        const isExpanded = expandedComments.has(ev.id)

        return (
          <div key={ev.id} className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
              <Avatar user={user || { avatar: '👤' }} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{user?.name || 'Usuario'}</p>
                  <span className="text-[10px] text-muted-foreground">{formatRelativeTime(ev.createdAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{ev.description || ''}</p>
              </div>
              <div className={cn('p-1.5 rounded-lg bg-muted/40', iconCfg.color)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Content */}
            <div className="my-3 pl-13">
              <p className={cn('font-display text-lg leading-tight', iconCfg.color)}>{ev.title}</p>
              {ev.type === 'achievement' && ev.data?.achievementId && (
                (() => {
                  const ach = getAchievement(ev.data.achievementId)
                  return ach ? (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-gold/10 border border-purple-400/30 rounded-xl">
                      <span className="text-2xl">{ach.icon}</span>
                      <div>
                        <p className="text-xs font-semibold">{ach.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ach.description}</p>
                      </div>
                    </div>
                  ) : null
                })()
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <ReactionBar
                reactions={grouped}
                currentUserId={activeUser?.id || ''}
                onToggleReaction={(emoji) => toggleReactionOnEvent(ev.id, emoji)}
                showPicker={activePicker === ev.id}
                onTogglePicker={() => setActivePicker(p => p === ev.id ? null : ev.id)}
              />
              <button
                onClick={() => toggleCommentsExpanded(ev.id)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{evComments.length || ''} Comentar</span>
              </button>
            </div>

            {/* Comments */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                {evComments.map(c => {
                  const cu = getUser(c.userId)
                  return (
                    <div key={c.id} className="flex gap-2">
                      <Avatar user={cu || { avatar: '👤' }} size="xs" />
                      <div className="flex-1 bg-muted/30 rounded-xl px-3 py-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <p className="font-semibold text-xs">{cu?.name}</p>
                          <span className="text-[9px] text-muted-foreground">{formatRelativeTime(c.createdAt)}</span>
                        </div>
                        <p className="text-sm mt-0.5 break-words">{c.text}</p>
                      </div>
                    </div>
                  )
                })}
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="text"
                    value={commentDrafts[ev.id] || ''}
                    onChange={e => setCommentDrafts(prev => ({ ...prev, [ev.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSendComment(ev.id)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  <button
                    onClick={() => handleSendComment(ev.id)}
                    disabled={!(commentDrafts[ev.id] || '').trim()}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      (commentDrafts[ev.id] || '').trim()
                        ? 'bg-gold text-background hover:bg-gold/90'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
