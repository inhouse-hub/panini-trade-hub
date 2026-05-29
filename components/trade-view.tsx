// components/trade-view.tsx — REEMPLAZA el archivo existente
'use client'

import { useState, useMemo } from 'react'
import {
  ArrowRight, ArrowLeftRight, RefreshCw, X, Check, Clock, Send, Inbox,
  History, Eye, Plus, Minus, Sparkles, Copy, CheckCircle, AlertCircle,
  ArrowLeft, Search
} from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { ALBUM_SECTIONS } from '@/lib/album-data'
import { cn } from '@/lib/utils'

type TradeTab = 'propuestas' | 'matches' | 'historial'

export function TradeView() {
  const {
    users, activeUser, activeUserAlbum, getUserAlbum, trades,
    proposeTrade, acceptTrade, rejectTrade, setViewingUser,
    updateStickerState, updateStickerCount,
  } = useUser()

  const [tab, setTab] = useState<TradeTab>('matches')
  const [proposing, setProposing] = useState<{ userId: string } | null>(null)
  const [selectedGive, setSelectedGive] = useState<string[]>([])
  const [selectedReceive, setSelectedReceive] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [listView, setListView] = useState<'repeated' | 'missing' | null>(null)

  // ── Mis repetidas y faltantes ─────────────────────────────
  const { myRepeated, myMissing } = useMemo(() => {
    const rep: string[] = []
    const miss: string[] = []
    if (!activeUserAlbum) return { myRepeated: rep, myMissing: miss }
    for (const section of ALBUM_SECTIONS) {
      const data = activeUserAlbum[section.code]
      if (!data) continue
      for (const num in data) {
        const code = `${section.code}-${num}`
        if (data[num].state === 'has' && data[num].count >= 2) rep.push(code)
        if (data[num].state === 'missing') miss.push(code)
      }
    }
    return { myRepeated: rep, myMissing: miss }
  }, [activeUserAlbum])

  // ── Matches por usuario ───────────────────────────────────
  const matches = useMemo(() => {
    if (!activeUser) return []
    const result: {
      userId: string; userName: string; userAvatar: string
      canGive: string[]; canReceive: string[]
      matchScore: number; mutualPossible: number
    }[] = []

    for (const user of users) {
      if (user.id === activeUser.id) continue
      const theirAlbum = getUserAlbum(user.id)
      if (!theirAlbum) continue

      const theirMissing = new Set<string>()
      const theirRepeated = new Set<string>()
      for (const section of ALBUM_SECTIONS) {
        const data = theirAlbum[section.code]
        if (!data) continue
        for (const num in data) {
          const code = `${section.code}-${num}`
          if (data[num].state === 'missing') theirMissing.add(code)
          if (data[num].state === 'has' && data[num].count >= 2) theirRepeated.add(code)
        }
      }

      const canGive = myRepeated.filter(s => theirMissing.has(s))
      const canReceive = myMissing.filter(s => theirRepeated.has(s))
      const mutualPossible = Math.min(canGive.length, canReceive.length)
      // Score: pondera matches mutuos + tamaño total de oportunidades
      const matchScore = mutualPossible > 0
        ? Math.round((mutualPossible * 2 + canGive.length + canReceive.length) / (Math.max(myMissing.length, 1) + Math.max(myRepeated.length, 1)) * 100)
        : 0

      if (canGive.length > 0 || canReceive.length > 0) {
        result.push({
          userId: user.id, userName: user.name, userAvatar: user.avatar,
          canGive, canReceive, matchScore, mutualPossible,
        })
      }
    }

    return result.sort((a, b) => b.matchScore - a.matchScore)
  }, [activeUser, users, getUserAlbum, myRepeated, myMissing])

  // ── Propuestas filtradas ──────────────────────────────────
  const myTrades = useMemo(() => {
    if (!activeUser) return { received: [], sent: [], history: [] }
    return {
      received: trades.filter(t => t.toUserId === activeUser.id && t.status === 'pending'),
      sent: trades.filter(t => t.fromUserId === activeUser.id && t.status === 'pending'),
      history: trades.filter(t =>
        (t.toUserId === activeUser.id || t.fromUserId === activeUser.id) &&
        (t.status === 'completed' || t.status === 'rejected')
      ),
    }
  }, [trades, activeUser])

  const pendingBadge = myTrades.received.length
  const sentBadge = myTrades.sent.length

  // ── Helpers ───────────────────────────────────────────────
  const startProposal = (userId: string) => {
    setProposing({ userId })
    setSelectedGive([])
    setSelectedReceive([])
  }

  const cancelProposal = () => {
    setProposing(null)
    setSelectedGive([])
    setSelectedReceive([])
  }

  const submitProposal = () => {
    if (!proposing || (selectedGive.length === 0 && selectedReceive.length === 0)) return
    proposeTrade(proposing.userId, selectedGive, selectedReceive)
    setProposing(null)
    setSelectedGive([])
    setSelectedReceive([])
    setTab('propuestas')
  }

  const toggleGive = (s: string) => {
    setSelectedGive(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }
  const toggleReceive = (s: string) => {
    setSelectedReceive(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const copyTradeList = async () => {
    const text = `🏆 INTERCAMBIOS PANINI\n\n📤 Tengo repetidas (${myRepeated.length}):\n${myRepeated.join(', ') || 'ninguna'}\n\n📥 Me faltan (${myMissing.length}):\n${myMissing.join(', ') || 'ninguna'}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Usuario'
  const getUserAvatar = (id: string) => users.find(u => u.id === id)?.avatar || '👤'

  if (!activeUser) return null

  // ═══ Modal de propuesta ═══
  if (proposing) {
    const targetUser = users.find(u => u.id === proposing.userId)
    const match = matches.find(m => m.userId === proposing.userId)
    if (!targetUser || !match) {
      cancelProposal()
      return null
    }

    const canSubmit = selectedGive.length > 0 || selectedReceive.length > 0
    const isGift = selectedGive.length > 0 && selectedReceive.length === 0
    const isRequest = selectedGive.length === 0 && selectedReceive.length > 0
    const isUnbalanced = selectedGive.length > 0 && selectedReceive.length > 0 && selectedGive.length !== selectedReceive.length

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={cancelProposal}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl text-gold">Proponer trade</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              con <span className="text-base">{targetUser.avatar}</span>
              <span className="font-semibold text-foreground">{targetUser.name}</span>
            </p>
          </div>
        </div>

        {/* Resumen propuesta */}
        <div className="bg-gradient-to-br from-gold/10 to-cyan/10 border border-gold/30 rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tú das</p>
              <p className="font-mono text-2xl font-bold text-orange-400">{selectedGive.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tú recibes</p>
              <p className="font-mono text-2xl font-bold text-green-400">{selectedReceive.length}</p>
            </div>
          </div>
          {isGift && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gold/20 text-xs text-green-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>🎁 Le regalas {selectedGive.length} estampa{selectedGive.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {isRequest && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gold/20 text-xs text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>🙏 Le pides {selectedReceive.length} estampa{selectedReceive.length !== 1 ? 's' : ''} como regalo</span>
            </div>
          )}
          {isUnbalanced && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gold/20 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Trade desigual ({selectedGive.length} por {selectedReceive.length}) — válido entre primos 😎</span>
            </div>
          )}
        </div>

        {/* Selector: lo que doy (mis repetidas que él necesita) */}
        <div className="bg-card/50 border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm text-orange-400 tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" /> LO QUE TÚ LE DAS
            </h3>
            <span className="text-xs text-muted-foreground font-mono">{match.canGive.length} disponibles</span>
          </div>
          {match.canGive.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">No tienes repetidas que él necesite</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
              {match.canGive.map(s => {
                const isSelected = selectedGive.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleGive(s)}
                    className={cn(
                      'px-2 py-1.5 rounded-lg text-xs font-mono border transition-all',
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 ring-1 ring-orange-500'
                        : 'bg-muted/40 border-border text-muted-foreground hover:border-orange-500/50'
                    )}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selector: lo que recibo (sus repetidas que yo necesito) */}
        <div className="bg-card/50 border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm text-green-400 tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> LO QUE PIDES A CAMBIO
            </h3>
            <span className="text-xs text-muted-foreground font-mono">{match.canReceive.length} disponibles</span>
          </div>
          {match.canReceive.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">Él no tiene repetidas que tú necesites</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
              {match.canReceive.map(s => {
                const isSelected = selectedReceive.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleReceive(s)}
                    className={cn(
                      'px-2 py-1.5 rounded-lg text-xs font-mono border transition-all',
                      isSelected
                        ? 'bg-green-500/20 border-green-500 text-green-400 ring-1 ring-green-500'
                        : 'bg-muted/40 border-border text-muted-foreground hover:border-green-500/50'
                    )}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="sticky bottom-20 bg-background/80 backdrop-blur-md -mx-4 px-4 py-3 border-t border-border">
          <button
            onClick={submitProposal}
            disabled={!canSubmit}
            className={cn(
              'w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
              canSubmit
                ? 'bg-gold text-background hover:bg-gold/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            {isGift ? 'Regalar estampas' : isRequest ? 'Pedir regalo' : 'Enviar propuesta'}
          </button>
          {canSubmit && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {targetUser.name} recibirá una notificación
            </p>
          )}
        </div>
      </div>
    )
  }

  // ═══ Pantalla: Lista detallada de repetidas / faltantes ═══
  if (listView !== null) {
    return <DetailedListView
      type={listView}
      stickers={listView === 'repeated' ? myRepeated : myMissing}
      activeUserAlbum={activeUserAlbum}
      onBack={() => setListView(null)}
      onUpdate={(sc, num, state, count) => updateStickerState(sc, num, state, count)}
      onAddRepeated={(sc, num) => updateStickerCount(sc, num, 1)}
      onRemoveRepeated={(sc, num) => updateStickerCount(sc, num, -1)}
    />
  }

  // ═══ Vista principal ═══
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-1 flex gap-1">
        <TabBtn active={tab === 'matches'} onClick={() => setTab('matches')} icon={Sparkles} label="Matches" />
        <TabBtn active={tab === 'propuestas'} onClick={() => setTab('propuestas')} icon={Inbox} label="Propuestas" badge={pendingBadge + sentBadge} />
        <TabBtn active={tab === 'historial'} onClick={() => setTab('historial')} icon={History} label="Historial" />
      </div>

      {/* Resumen inventario */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setListView('repeated')}
          className="bg-card/50 border border-sticker-repeated/30 hover:border-sticker-repeated/60 hover:bg-card rounded-xl p-3 text-left transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-1.5 text-sticker-repeated mb-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tengo</span>
          </div>
          <p className="font-mono text-2xl font-bold">{myRepeated.length}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            para intercambiar
            <ArrowRight className="w-3 h-3" />
          </p>
        </button>
        <button
          onClick={() => setListView('missing')}
          className="bg-card/50 border border-sticker-missing/30 hover:border-sticker-missing/60 hover:bg-card rounded-xl p-3 text-left transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-1.5 text-sticker-missing mb-1">
            <X className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Necesito</span>
          </div>
          <p className="font-mono text-2xl font-bold">{myMissing.length}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            estampas faltantes
            <ArrowRight className="w-3 h-3" />
          </p>
        </button>
      </div>

      {/* Compartir lista */}
      <button
        onClick={copyTradeList}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-xl text-gold text-sm font-semibold transition-colors"
      >
        {copied ? <><CheckCircle className="w-4 h-4" />Lista copiada</> : <><Copy className="w-4 h-4" />Copiar mi lista para WhatsApp</>}
      </button>

      {/* ─── Tab: Matches ─── */}
      {tab === 'matches' && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-12 px-4 bg-card/30 border border-border rounded-2xl">
              <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold">Aún no hay matches</p>
              <p className="text-xs text-muted-foreground mt-1">
                Marca tus repetidas y faltantes, y pide a otros usuarios que hagan lo mismo
              </p>
            </div>
          ) : (
            matches.map(m => (
              <div key={m.userId} className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{m.userAvatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold">{m.userName}</h4>
                      <span className="font-mono text-xs text-gold font-bold">{m.matchScore}% match</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-gold to-cyan rounded-full transition-all"
                        style={{ width: `${Math.min(m.matchScore, 100)}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingUser(m.userId)}
                    className="p-2 rounded-lg hover:bg-cyan/20 text-muted-foreground hover:text-cyan transition-colors"
                    title="Ver álbum"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <p className="text-orange-400 font-semibold">Le puedes dar</p>
                      <p className="font-mono text-lg text-orange-400">{m.canGive.length}</p>
                    </div>
                    {m.canGive.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.canGive.slice(0, 15).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 font-mono text-[10px] rounded border border-orange-500/30">
                            {s}
                          </span>
                        ))}
                        {m.canGive.length > 15 && (
                          <span className="px-1.5 py-0.5 text-orange-400/60 font-mono text-[10px]">
                            +{m.canGive.length - 15} más
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-orange-400/40 text-[10px] italic">ninguna</p>
                    )}
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <p className="text-green-400 font-semibold">Te puede dar</p>
                      <p className="font-mono text-lg text-green-400">{m.canReceive.length}</p>
                    </div>
                    {m.canReceive.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.canReceive.slice(0, 15).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-green-500/20 text-green-300 font-mono text-[10px] rounded border border-green-500/30">
                            {s}
                          </span>
                        ))}
                        {m.canReceive.length > 15 && (
                          <span className="px-1.5 py-0.5 text-green-400/60 font-mono text-[10px]">
                            +{m.canReceive.length - 15} más
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-green-400/40 text-[10px] italic">ninguna</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => startProposal(m.userId)}
                  className="w-full py-2 bg-gold text-background rounded-lg font-semibold text-sm hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Proponer trade
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Tab: Propuestas ─── */}
      {tab === 'propuestas' && (
        <div className="space-y-4">
          {/* Recibidas */}
          <div>
            <h3 className="font-display text-sm text-gold tracking-wider mb-2 flex items-center gap-2">
              <Inbox className="w-3.5 h-3.5" />
              RECIBIDAS
              {pendingBadge > 0 && <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs rounded-full">{pendingBadge}</span>}
            </h3>
            {myTrades.received.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center bg-card/30 border border-border rounded-xl">
                Sin propuestas pendientes
              </p>
            ) : (
              <div className="space-y-2">
                {myTrades.received.map(t => (
                  <div key={t.id} className="bg-gold/5 border border-gold/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getUserAvatar(t.fromUserId)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{getUserName(t.fromUserId)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(t.timestamp)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <p className="text-orange-400 mb-1 font-semibold">Te ofrece:</p>
                        <div className="flex flex-wrap gap-1">
                          {t.givenStickers.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-orange-500/15 text-orange-400 font-mono rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-green-400 mb-1 font-semibold">Pide:</p>
                        <div className="flex flex-wrap gap-1">
                          {t.receivedStickers.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-green-500/15 text-green-400 font-mono rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptTrade(t.id)}
                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Aceptar
                      </button>
                      <button
                        onClick={() => { if (confirm('¿Rechazar este trade?')) rejectTrade(t.id) }}
                        className="flex-1 py-2 bg-muted hover:bg-muted/70 text-foreground rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enviadas */}
          <div>
            <h3 className="font-display text-sm text-cyan tracking-wider mb-2 flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              ENVIADAS
              {sentBadge > 0 && <span className="px-2 py-0.5 bg-cyan/20 text-cyan text-xs rounded-full">{sentBadge}</span>}
            </h3>
            {myTrades.sent.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center bg-card/30 border border-border rounded-xl">
                No has enviado propuestas
              </p>
            ) : (
              <div className="space-y-2">
                {myTrades.sent.map(t => (
                  <div key={t.id} className="bg-card/50 border border-border rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getUserAvatar(t.toUserId)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Para {getUserName(t.toUserId)}</p>
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Esperando respuesta
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-orange-400 mb-1 font-semibold">Le das:</p>
                        <div className="flex flex-wrap gap-1">
                          {t.givenStickers.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-orange-500/15 text-orange-400 font-mono rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-green-400 mb-1 font-semibold">Pides:</p>
                        <div className="flex flex-wrap gap-1">
                          {t.receivedStickers.map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-green-500/15 text-green-400 font-mono rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Historial ─── */}
      {tab === 'historial' && (
        <div className="space-y-2">
          {myTrades.history.length === 0 ? (
            <div className="text-center py-12 px-4 bg-card/30 border border-border rounded-2xl">
              <History className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm">Sin trades completados aún</p>
            </div>
          ) : (
            myTrades.history.map(t => {
              const isMe = t.fromUserId === activeUser.id
              const otherUserId = isMe ? t.toUserId : t.fromUserId
              return (
                <div key={t.id} className={cn(
                  'border rounded-xl p-3',
                  t.status === 'completed' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getUserAvatar(otherUserId)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {isMe ? `Tú → ${getUserName(otherUserId)}` : `${getUserName(otherUserId)} → Tú`}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.timestamp)}</p>
                    </div>
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      t.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    )}>
                      {t.status === 'completed' ? '✓ Hecho' : '✗ Rechazado'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-muted-foreground">
                      <span className="text-orange-400">Dio:</span> {t.givenStickers.length}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="text-green-400">Recibió:</span> {t.receivedStickers.length}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function TabBtn({
  active, onClick, icon: Icon, label, badge,
}: { active: boolean; onClick: () => void; icon: typeof Inbox; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all',
        active ? 'bg-gold text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          'min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center',
          active ? 'bg-background text-gold' : 'bg-sticker-missing text-white'
        )}>
          {badge}
        </span>
      )}
    </button>
  )
}

// ════════════════════════════════════════════════════════════
// Vista detallada de la lista (repetidas o faltantes)
// ════════════════════════════════════════════════════════════

interface DetailedListViewProps {
  type: 'repeated' | 'missing'
  stickers: string[]
  activeUserAlbum: any
  onBack: () => void
  onUpdate: (sectionCode: string, stickerNumber: string, state: any, count?: number) => void
  onAddRepeated: (sectionCode: string, stickerNumber: string) => void
  onRemoveRepeated: (sectionCode: string, stickerNumber: string) => void
}

function DetailedListView({ type, stickers, activeUserAlbum, onBack, onUpdate, onAddRepeated, onRemoveRepeated }: DetailedListViewProps) {
  const [filter, setFilter] = useState('')
  const [copiedList, setCopiedList] = useState(false)

  // Agrupar por sección
  const grouped = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const code of stickers) {
      const [section, num] = code.split('-')
      if (!filter || code.toLowerCase().includes(filter.toLowerCase())) {
        const arr = map.get(section) || []
        arr.push(num)
        map.set(section, arr)
      }
    }
    // Ordenar por número dentro de cada sección
    for (const [section, nums] of map) {
      nums.sort((a, b) => parseInt(a) - parseInt(b))
    }
    return Array.from(map.entries()).sort((a, b) => {
      const idxA = ALBUM_SECTIONS.findIndex(s => s.code === a[0])
      const idxB = ALBUM_SECTIONS.findIndex(s => s.code === b[0])
      return idxA - idxB
    })
  }, [stickers, filter])

  const totalShown = useMemo(() => grouped.reduce((acc, [, nums]) => acc + nums.length, 0), [grouped])

  const copyList = async () => {
    const lines: string[] = []
    if (type === 'repeated') {
      lines.push('🔄 Mis repetidas para intercambiar:')
    } else {
      lines.push('❌ Estampas que me faltan:')
    }
    lines.push('')
    for (const [section, nums] of grouped) {
      const sec = ALBUM_SECTIONS.find(s => s.code === section)
      lines.push(`${sec?.flag || ''} ${section}: ${nums.map(n => `${section}-${n}`).join(', ')}`)
    }
    lines.push('')
    lines.push(`Total: ${totalShown}`)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopiedList(true)
    setTimeout(() => setCopiedList(false), 2000)
  }

  const isRepeated = type === 'repeated'
  const color = isRepeated ? 'sticker-repeated' : 'sticker-missing'
  const title = isRepeated ? 'Mis repetidas' : 'Me faltan'
  const subtitle = isRepeated
    ? 'Tap una para darla en trade · Mantén presionada para agregar repetida'
    : 'Tap una cuando la recibas en un trade'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 bg-card hover:bg-muted border border-border rounded-xl transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className={cn('font-display text-2xl tracking-wider', `text-${color}`)}>
            {isRepeated ? '🔄' : '❌'} {title}
          </h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={cn('px-3 py-1.5 rounded-xl border', `border-${color}/30 bg-${color}/10`)}>
          <span className={cn('font-mono font-bold', `text-${color}`)}>{totalShown}</span>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar (ej. MEX, BRA-5, USA)..."
          className="w-full bg-card/50 border border-border focus:border-gold/50 focus:outline-none rounded-xl pl-10 pr-3 py-2.5 text-sm"
        />
      </div>

      {/* Botón copiar lista */}
      <button
        onClick={copyList}
        disabled={totalShown === 0}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors',
          totalShown === 0
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold'
        )}
      >
        {copiedList ? <><CheckCircle className="w-4 h-4" />Copiado al portapapeles</> : <><Copy className="w-4 h-4" />Copiar lista para WhatsApp</>}
      </button>

      {/* Tip de uso */}
      <div className={cn('p-3 rounded-xl border text-xs', `bg-${color}/5 border-${color}/20`)}>
        {isRepeated ? (
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-1">💡 Cómo usar esta lista en trades físicos:</p>
            <p className="text-muted-foreground">• Tap <span className="text-sticker-repeated font-mono">−</span> cuando das una repetida</p>
            <p className="text-muted-foreground">• Tap <span className="text-sticker-repeated font-mono">+</span> cuando recibes otra copia repetida</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-1">💡 Cómo usar esta lista en trades físicos:</p>
            <p className="text-muted-foreground">• Tap <span className="text-sticker-has font-mono">✓</span> cuando recibes la estampa y ya no te falta</p>
          </div>
        )}
      </div>

      {/* Lista agrupada por sección */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 px-4 bg-card/30 border border-border rounded-2xl">
          <p className="text-sm font-semibold mb-1">
            {filter ? 'Sin resultados' : (isRepeated ? '¡Sin repetidas!' : '¡Ya no te falta nada!')}
          </p>
          <p className="text-xs text-muted-foreground">
            {filter
              ? 'Prueba con otro término de búsqueda'
              : (isRepeated ? 'Cuando consigas una repetida aparecerá aquí' : '¡Felicidades, álbum completo! 🏆')
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([section, nums]) => {
            const sec = ALBUM_SECTIONS.find(s => s.code === section)
            return (
              <div key={section} className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{sec?.flag}</span>
                  <p className="font-semibold text-sm">{sec?.name}</p>
                  <span className="ml-auto text-xs font-mono text-muted-foreground">{nums.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nums.map(num => {
                    const stickerData = activeUserAlbum?.[section]?.[num]
                    const count = stickerData?.count || 0
                    return (
                      <div
                        key={`${section}-${num}`}
                        className={cn(
                          'group relative inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg border text-xs font-mono',
                          isRepeated
                            ? 'bg-sticker-repeated/10 border-sticker-repeated/40 text-sticker-repeated'
                            : 'bg-sticker-missing/10 border-sticker-missing/40 text-sticker-missing'
                        )}
                      >
                        <span className="font-semibold">{section}-{num}</span>
                        {isRepeated && count >= 2 && (
                          <span className="text-[10px] opacity-70">×{count}</span>
                        )}
                        {isRepeated ? (
                          <div className="flex items-center gap-0.5 ml-1">
                            {/* − resta una copia */}
                            <button
                              onClick={() => onRemoveRepeated(section, num)}
                              className="w-5 h-5 flex items-center justify-center rounded-md bg-card hover:bg-sticker-missing/20 text-sticker-missing transition-colors active:scale-90"
                              title="Di una en trade"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            {/* + suma copia */}
                            <button
                              onClick={() => onAddRepeated(section, num)}
                              className="w-5 h-5 flex items-center justify-center rounded-md bg-card hover:bg-sticker-repeated/20 text-sticker-repeated transition-colors active:scale-90"
                              title="Conseguí otra repetida"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          // Botón ✓ - la recibí
                          <button
                            onClick={() => onUpdate(section, num, 'has', 1)}
                            className="w-5 h-5 flex items-center justify-center rounded-md bg-sticker-has/20 hover:bg-sticker-has/40 text-sticker-has ml-1 transition-colors active:scale-90"
                            title="Ya la recibí"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}