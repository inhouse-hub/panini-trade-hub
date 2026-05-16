// components/global-search.tsx — NUEVO
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X, Check, RefreshCw, Circle, ArrowLeftRight } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { ALBUM_SECTIONS } from '@/lib/album-data'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

interface Props {
  onClose: () => void
}

type SearchResult = {
  sectionCode: string
  sectionName: string
  flag: string
  stickerNumber: string
  fullCode: string
  myState: string
  myCount: number
  userStates: { userId: string; userName: string; userAvatar: string; userAvatarUrl?: string; state: string; count: number }[]
}

export function GlobalSearch({ onClose }: Props) {
  const { activeUser, users, activeUserAlbum, getUserAlbum } = useUser()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ── Build full sticker index once ─────────────────────────
  const results = useMemo((): SearchResult[] => {
    if (!activeUser || !activeUserAlbum || query.trim().length < 1) return []
    const q = query.trim().toUpperCase()

    // Find matching sections
    const matchingSections = ALBUM_SECTIONS.filter(s => {
      const codeMatch = s.code.includes(q)
      const nameMatch = s.name.toUpperCase().includes(q)
      return codeMatch || nameMatch
    })

    // Also match patterns like "MEX-15" or "MEX15" or just "15"
    const numberMatch = q.match(/^([A-Z]{2,4})?-?(\d{1,2})$/)
    let specificSticker: { code: string; num: string } | null = null
    if (numberMatch) {
      const [, prefix, num] = numberMatch
      if (prefix) specificSticker = { code: prefix, num }
    }

    const out: SearchResult[] = []

    // Specific sticker takes priority
    if (specificSticker) {
      const sec = ALBUM_SECTIONS.find(s => s.code === specificSticker!.code)
      if (sec) {
        const stickerNum = specificSticker.num
        const myData = activeUserAlbum[sec.code]?.[stickerNum]
        out.push({
          sectionCode: sec.code,
          sectionName: sec.name,
          flag: sec.flag,
          stickerNumber: stickerNum,
          fullCode: `${sec.code}-${stickerNum}`,
          myState: myData?.state || 'unmarked',
          myCount: myData?.count || 0,
          userStates: users.filter(u => u.id !== activeUser.id).map(u => {
            const alb = getUserAlbum(u.id)
            const d = alb?.[sec.code]?.[stickerNum]
            return {
              userId: u.id, userName: u.name, userAvatar: u.avatar, userAvatarUrl: u.avatarUrl,
              state: d?.state || 'unmarked', count: d?.count || 0,
            }
          }),
        })
      }
    }

    // Then add all matching sections (limit per section to keep responsive)
    for (const sec of matchingSections.slice(0, 3)) {
      for (let n = sec.startNumber; n < sec.startNumber + sec.stickerCount; n++) {
        const stickerNum = n.toString()
        const fullCode = `${sec.code}-${stickerNum}`
        if (specificSticker && sec.code === specificSticker.code && stickerNum === specificSticker.num) continue
        const myData = activeUserAlbum[sec.code]?.[stickerNum]
        out.push({
          sectionCode: sec.code,
          sectionName: sec.name,
          flag: sec.flag,
          stickerNumber: stickerNum,
          fullCode,
          myState: myData?.state || 'unmarked',
          myCount: myData?.count || 0,
          userStates: users.filter(u => u.id !== activeUser.id).map(u => {
            const alb = getUserAlbum(u.id)
            const d = alb?.[sec.code]?.[stickerNum]
            return {
              userId: u.id, userName: u.name, userAvatar: u.avatar, userAvatarUrl: u.avatarUrl,
              state: d?.state || 'unmarked', count: d?.count || 0,
            }
          }),
        })
        if (out.length > 80) break
      }
      if (out.length > 80) break
    }

    return out.slice(0, 80)
  }, [query, activeUser, activeUserAlbum, users, getUserAlbum])

  const stateBadge = (state: string, count: number, mini = false) => {
    if (state === 'has') {
      return <span className={cn('inline-flex items-center justify-center rounded-full bg-sticker-has/20 text-sticker-has', mini ? 'w-5 h-5' : 'w-6 h-6')}>
        <Check className={mini ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      </span>
    }
    if (state === 'repeated') {
      return <span className={cn('inline-flex items-center justify-center rounded-full bg-sticker-repeated/20 text-sticker-repeated font-mono font-bold', mini ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]')}>
        ×{count}
      </span>
    }
    if (state === 'missing') {
      return <span className={cn('inline-flex items-center justify-center rounded-full bg-sticker-missing/20 text-sticker-missing', mini ? 'w-5 h-5' : 'w-6 h-6')}>
        <X className={mini ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      </span>
    }
    return <span className={cn('inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground', mini ? 'w-5 h-5' : 'w-6 h-6')}>
      <Circle className={mini ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
    </span>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search header */}
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Search className="w-5 h-5 text-gold shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Buscar estampa o país (ej: "MEX-15", "Brasil", "FWC")'
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {query.trim().length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto opacity-30 mb-3" />
              <p className="text-sm">Busca por código, país o número</p>
              <div className="mt-4 space-y-1 text-xs">
                <p>· <span className="font-mono text-foreground">MEX-15</span> — sticker específico</p>
                <p>· <span className="font-mono text-foreground">Brasil</span> — todos los de Brasil</p>
                <p>· <span className="font-mono text-foreground">FWC</span> — toda una sección</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">Sin resultados</p>
          ) : (
            <div className="space-y-2">
              {results.map(r => {
                const haveRepeated = r.userStates.filter(u => u.state === 'repeated')
                const haveMissing = r.userStates.filter(u => u.state === 'missing')
                const iNeed = r.myState === 'missing'
                const iHaveRep = r.myState === 'repeated'

                return (
                  <div key={r.fullCode} className="bg-muted/30 border border-border rounded-xl p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{r.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="font-mono font-bold text-gold">{r.fullCode}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.sectionName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Tú:</span>
                        {stateBadge(r.myState, r.myCount)}
                      </div>
                    </div>

                    {/* Quick insight */}
                    {iNeed && haveRepeated.length > 0 && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mb-2 text-xs">
                        <span className="text-green-400 font-semibold">¡La necesitas y la tienen repetida!</span>{' '}
                        <span className="text-muted-foreground">
                          {haveRepeated.map(u => u.userName).join(', ')}
                        </span>
                      </div>
                    )}
                    {iHaveRep && haveMissing.length > 0 && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 mb-2 text-xs">
                        <span className="text-orange-400 font-semibold">¡La tienes repetida y la necesitan!</span>{' '}
                        <span className="text-muted-foreground">
                          {haveMissing.map(u => u.userName).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Users grid */}
                    <div className="flex flex-wrap gap-2">
                      {r.userStates.map(u => (
                        <div key={u.userId} className="flex items-center gap-1.5 px-2 py-1 bg-card/50 border border-border rounded-lg">
                          <Avatar user={{ avatar: u.userAvatar, avatarUrl: u.userAvatarUrl, name: u.userName }} size="xs" />
                          <span className="text-xs">{u.userName}</span>
                          {stateBadge(u.state, u.count, true)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
