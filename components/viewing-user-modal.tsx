'use client'

import { X, Check, RefreshCw, Circle, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { ALBUM_SECTIONS } from '@/lib/album-data'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

export function ViewingUserModal() {
  const { users, viewingUserId, viewingUserAlbum, setViewingUser, getStats } = useUser()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const viewingUser = users.find(u => u.id === viewingUserId)

  const stats = useMemo(() => {
    if (!viewingUserId) return null
    return getStats(viewingUserId)
  }, [viewingUserId, getStats])

  if (!viewingUserId || !viewingUser || !viewingUserAlbum) return null

  const progress = stats ? ((stats.has + stats.repeated) / (stats.total || 1)) * 100 : 0

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border p-4 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setViewingUser(null)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <span className="text-3xl">{viewingUser.avatar}</span>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl text-gold">{viewingUser.name}</h2>
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Solo lectura
              </span>
            </div>
            {stats && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-xs">
                  <div 
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono">{progress.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats summary */}
        {stats && (
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-6 mt-3 text-sm">
            <span className="flex items-center gap-1 text-sticker-has">
              <Check className="w-4 h-4" /> Tiene: {stats.has}
            </span>
            <span className="flex items-center gap-1 text-sticker-repeated">
              <RefreshCw className="w-4 h-4" /> Repetidas: {stats.repeated}
            </span>
            <span className="flex items-center gap-1 text-sticker-missing">
              <X className="w-4 h-4" /> Faltan: {stats.missing}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Circle className="w-4 h-4" /> Sin marcar: {stats.unmarked}
            </span>
          </div>
        )}
      </div>

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {ALBUM_SECTIONS.map(section => {
            const sectionData = viewingUserAlbum[section.code] || {}
            const isExpanded = expandedSection === section.code
            
            // Calculate section stats
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
            const sectionProgress = (ownedCount / section.stickerCount) * 100
            const isComplete = ownedCount === section.stickerCount && missingCount === 0

            return (
              <div 
                key={section.code}
                className={cn(
                  'bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden',
                  isComplete && 'border-success/50'
                )}
              >
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.code)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xl">{section.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg text-gold">{section.code}</span>
                      <span className="text-xs text-muted-foreground">{section.name}</span>
                      {isComplete && (
                        <span className="px-1.5 py-0.5 bg-success/20 text-success text-xs font-semibold rounded">
                          COMPLETO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[120px]">
                        <div 
                          className={cn(
                            'h-full rounded-full',
                            isComplete ? 'bg-success' : 'bg-gold'
                          )}
                          style={{ width: `${sectionProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{ownedCount}/{section.stickerCount}</span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-border/50">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 mt-3">
                      {stickers.map(({ number, data }) => (
                        <div
                          key={number}
                          className={cn(
                            'aspect-square flex items-center justify-center rounded-lg text-xs font-mono cursor-default border',
                            data.state === 'unmarked' && 'bg-sticker-unmarked/20 text-sticker-unmarked border-sticker-unmarked/30',
                            data.state === 'has' && 'bg-sticker-has/20 text-sticker-has border-sticker-has/50',
                            data.state === 'repeated' && 'bg-sticker-repeated/20 text-sticker-repeated border-sticker-repeated/50',
                            data.state === 'missing' && 'bg-sticker-missing/20 text-sticker-missing border-sticker-missing/50'
                          )}
                        >
                          <div className="text-center">
                            <div className="text-[10px] leading-none">{number}</div>
                            {data.state === 'repeated' && data.count > 0 && (
                              <div className="text-[8px] mt-0.5 opacity-75">x{data.count}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Section legend */}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-sticker-has/30 border border-sticker-has/50" />
                        Tiene: {hasCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-sticker-repeated/30 border border-sticker-repeated/50" />
                        Repetidas: {repeatedCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-sticker-missing/30 border border-sticker-missing/50" />
                        Faltan: {missingCount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
