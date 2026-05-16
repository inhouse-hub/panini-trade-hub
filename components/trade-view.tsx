'use client'

import { useState, useMemo } from 'react'
import { ArrowRight, ArrowLeft, RefreshCw, X, Check, Clock, Share2, Copy, CheckCircle, Gift, Eye } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { ALBUM_SECTIONS } from '@/lib/album-data'
import { TradeMatch } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TradeView() {
  const { users, activeUser, activeUserAlbum, getUserAlbum, trades, executeTrade, completeTrade, setViewingUser } = useUser()
  const [selectedMatch, setSelectedMatch] = useState<TradeMatch | null>(null)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [selectedToGive, setSelectedToGive] = useState<string[]>([])
  const [selectedToReceive, setSelectedToReceive] = useState<string[]>([])
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Calculate what the active user has repeated and what they need
  const myRepeated = useMemo(() => {
    if (!activeUserAlbum) return []
    const repeated: string[] = []
    for (const section of ALBUM_SECTIONS) {
      const sectionData = activeUserAlbum[section.code]
      if (sectionData) {
        for (const [num, sticker] of Object.entries(sectionData)) {
          if (sticker.state === 'repeated' && sticker.count > 0) {
            repeated.push(`${section.code}-${num}`)
          }
        }
      }
    }
    return repeated
  }, [activeUserAlbum])

  const myMissing = useMemo(() => {
    if (!activeUserAlbum) return []
    const missing: string[] = []
    for (const section of ALBUM_SECTIONS) {
      const sectionData = activeUserAlbum[section.code]
      if (sectionData) {
        for (const [num, sticker] of Object.entries(sectionData)) {
          if (sticker.state === 'missing') {
            missing.push(`${section.code}-${num}`)
          }
        }
      }
    }
    return missing
  }, [activeUserAlbum])

  // Calculate what OTHER users have repeated that could help ME
  const contributionsFromOthers = useMemo(() => {
    if (!activeUser) return []
    
    const contributions: { userId: string; userName: string; userAvatar: string; canShareToMe: string[] }[] = []
    
    for (const user of users) {
      if (user.id === activeUser.id) continue
      
      const theirAlbum = getUserAlbum(user.id)
      if (!theirAlbum) continue
      
      const canShareToMe: string[] = []
      
      // Find their repeated stickers that I need (missing)
      for (const section of ALBUM_SECTIONS) {
        const theirSection = theirAlbum[section.code]
        if (theirSection) {
          for (const [num, sticker] of Object.entries(theirSection)) {
            if (sticker.state === 'repeated' && sticker.count > 0) {
              const stickerCode = `${section.code}-${num}`
              if (myMissing.includes(stickerCode)) {
                canShareToMe.push(stickerCode)
              }
            }
          }
        }
      }
      
      if (canShareToMe.length > 0) {
        contributions.push({
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          canShareToMe,
        })
      }
    }
    
    return contributions.sort((a, b) => b.canShareToMe.length - a.canShareToMe.length)
  }, [activeUser, users, getUserAlbum, myMissing])

  // Calculate trade matches with other users
  const tradeMatches = useMemo(() => {
    if (!activeUser) return []
    
    const matches: TradeMatch[] = []
    
    for (const user of users) {
      if (user.id === activeUser.id) continue
      
      const theirAlbum = getUserAlbum(user.id)
      if (!theirAlbum) continue
      
      const canGive: string[] = [] // What I can give them (my repeated + they need)
      const canReceive: string[] = [] // What they can give me (their repeated + I need)
      
      // Check what I can give them
      for (const sticker of myRepeated) {
        const [sectionCode, num] = sticker.split('-')
        const theirSticker = theirAlbum[sectionCode]?.[num]
        if (theirSticker?.state === 'missing') {
          canGive.push(sticker)
        }
      }
      
      // Check what they can give me
      for (const section of ALBUM_SECTIONS) {
        const theirSection = theirAlbum[section.code]
        if (theirSection) {
          for (const [num, sticker] of Object.entries(theirSection)) {
            if (sticker.state === 'repeated' && sticker.count > 0) {
              const stickerCode = `${section.code}-${num}`
              if (myMissing.includes(stickerCode)) {
                canReceive.push(stickerCode)
              }
            }
          }
        }
      }
      
      const totalPossible = Math.min(canGive.length, canReceive.length)
      const matchScore = totalPossible > 0 ? 
        Math.round((totalPossible / Math.max(myMissing.length, 1)) * 100) : 0
      
      matches.push({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        canGive,
        canReceive,
        matchScore,
      })
    }
    
    return matches.sort((a, b) => b.matchScore - a.matchScore)
  }, [activeUser, users, getUserAlbum, myRepeated, myMissing])

  const handleOpenTrade = (match: TradeMatch) => {
    setSelectedMatch(match)
    setSelectedToGive([])
    setSelectedToReceive([])
    setShowTradeModal(true)
  }

  const handleConfirmTrade = () => {
    if (!activeUser || !selectedMatch || selectedToGive.length === 0 || selectedToReceive.length === 0) return
    executeTrade(activeUser.id, selectedMatch.userId, selectedToGive, selectedToReceive)
    setShowTradeModal(false)
    setSelectedMatch(null)
  }

  const handleCopyList = async (type: 'repeated' | 'missing' | 'trade') => {
    let text = ''
    if (type === 'repeated') {
      text = `Mis repetidas:\n${myRepeated.join(', ')}`
    } else if (type === 'missing') {
      text = `Me faltan:\n${myMissing.join(', ')}`
    } else {
      text = `Tengo repetidas: ${myRepeated.join(', ')}\n\nNecesito: ${myMissing.join(', ')}`
    }
    
    await navigator.clipboard.writeText(text)
    setCopiedText(type)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!activeUser) return null

  return (
    <div className="space-y-6">
      {/* My inventory summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Repeated stickers */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-cyan flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Mis Repetidas
            </h3>
            <button
              onClick={() => handleCopyList('repeated')}
              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedText === 'repeated' ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {myRepeated.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {myRepeated.map(sticker => (
                <span key={sticker} className="px-2 py-0.5 bg-sticker-repeated/20 text-sticker-repeated text-xs font-mono rounded-md border border-sticker-repeated/40">
                  {sticker}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tienes estampas repetidas</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Total: {myRepeated.length}</p>
        </div>

        {/* Missing stickers */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-sticker-missing flex items-center gap-2">
              <X className="w-4 h-4" />
              Me Faltan
            </h3>
            <button
              onClick={() => handleCopyList('missing')}
              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedText === 'missing' ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {myMissing.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {myMissing.map(sticker => (
                <span key={sticker} className="px-2 py-0.5 bg-sticker-missing/20 text-sticker-missing text-xs font-mono rounded-md border border-sticker-missing/40">
                  {sticker}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tienes faltantes marcados</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Total: {myMissing.length}</p>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={() => handleCopyList('trade')}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-xl text-gold font-semibold transition-colors"
      >
        {copiedText === 'trade' ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Lista copiada al portapapeles
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            Compartir mi lista de trade
          </>
        )}
      </button>

      {/* What others can share to me */}
      {contributionsFromOthers.length > 0 && (
        <div>
          <h3 className="font-display text-xl text-cyan mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Te pueden compartir
          </h3>
          <div className="space-y-3">
            {contributionsFromOthers.map(contrib => (
              <div key={contrib.userId} className="bg-cyan/5 backdrop-blur-sm border border-cyan/30 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{contrib.userAvatar}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold">{contrib.userName}</h4>
                    <p className="text-xs text-cyan">
                      Tiene {contrib.canShareToMe.length} estampas que te faltan
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingUser(contrib.userId)}
                    className="p-2 rounded-lg hover:bg-cyan/20 text-cyan transition-colors"
                    title="Ver album"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {contrib.canShareToMe.map(sticker => (
                    <span key={sticker} className="px-2 py-0.5 bg-cyan/20 text-cyan text-xs font-mono rounded-md border border-cyan/40">
                      {sticker}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade matches */}
      <div>
        <h3 className="font-display text-xl text-gold mb-4">Matches de Intercambio</h3>
        <div className="space-y-3">
          {tradeMatches.map(match => (
            <div key={match.userId} className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{match.userAvatar}</span>
                <div className="flex-1">
                  <h4 className="font-semibold">{match.userName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gold rounded-full"
                        style={{ width: `${match.matchScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{match.matchScore}%</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingUser(match.userId)}
                  className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  title="Ver album"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-sticker-has text-xs mb-1 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Le puedes dar ({match.canGive.length})
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {match.canGive.slice(0, 10).map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-sticker-has/20 text-sticker-has text-xs font-mono rounded">
                        {s}
                      </span>
                    ))}
                    {match.canGive.length > 10 && (
                      <span className="text-xs text-muted-foreground">+{match.canGive.length - 10} mas</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-cyan text-xs mb-1 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Te puede dar ({match.canReceive.length})
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {match.canReceive.slice(0, 10).map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-cyan/20 text-cyan text-xs font-mono rounded">
                        {s}
                      </span>
                    ))}
                    {match.canReceive.length > 10 && (
                      <span className="text-xs text-muted-foreground">+{match.canReceive.length - 10} mas</span>
                    )}
                  </div>
                </div>
              </div>
              
              {(match.canGive.length > 0 && match.canReceive.length > 0) && (
                <button
                  onClick={() => handleOpenTrade(match)}
                  className="mt-3 w-full py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold font-semibold text-sm transition-colors"
                >
                  Hacer Trade
                </button>
              )}
            </div>
          ))}
          
          {tradeMatches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay otros usuarios para hacer trades
            </div>
          )}
        </div>
      </div>

      {/* Trade history */}
      {trades.length > 0 && (
        <div>
          <h3 className="font-display text-xl text-gold mb-4">Historial de Trades</h3>
          <div className="space-y-2">
            {trades.filter(t => t.fromUserId === activeUser.id || t.toUserId === activeUser.id).map(trade => {
              const otherUser = users.find(u => 
                u.id === (trade.fromUserId === activeUser.id ? trade.toUserId : trade.fromUserId)
              )
              const isGiver = trade.fromUserId === activeUser.id
              
              return (
                <div key={trade.id} className="flex items-center gap-3 p-3 bg-card/30 border border-border rounded-xl">
                  <span className="text-xl">{otherUser?.avatar || '?'}</span>
                  <div className="flex-1 text-sm">
                    <p>
                      <span className="font-semibold">{isGiver ? 'Diste' : 'Recibiste'}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        {(isGiver ? trade.givenStickers : trade.receivedStickers).length} estampas
                      </span>
                      {' a/de '}
                      <span className="font-semibold">{otherUser?.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(trade.timestamp)}
                    </p>
                  </div>
                  {!trade.completed ? (
                    <button
                      onClick={() => completeTrade(trade.id)}
                      className="px-3 py-1 bg-success/20 text-success text-xs font-semibold rounded-lg hover:bg-success/30 transition-colors"
                    >
                      Completar
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-lg">
                      Completado
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Trade modal */}
      {showTradeModal && selectedMatch && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-xl text-gold">Trade con {selectedMatch.userName}</h3>
              <button
                onClick={() => setShowTradeModal(false)}
                className="p-2 rounded-lg hover:bg-muted/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Select stickers to give */}
              <div>
                <p className="text-sm font-semibold mb-2 text-sticker-has">
                  Selecciona lo que vas a dar ({selectedToGive.length} seleccionadas)
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                  {selectedMatch.canGive.map(sticker => (
                    <button
                      key={sticker}
                      onClick={() => {
                        setSelectedToGive(prev => 
                          prev.includes(sticker) 
                            ? prev.filter(s => s !== sticker)
                            : [...prev, sticker]
                        )
                      }}
                      className={cn(
                        'px-2 py-1 text-xs font-mono rounded-md border transition-colors',
                        selectedToGive.includes(sticker)
                          ? 'bg-sticker-has/30 text-sticker-has border-sticker-has'
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-sticker-has/50'
                      )}
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select stickers to receive */}
              <div>
                <p className="text-sm font-semibold mb-2 text-cyan">
                  Selecciona lo que vas a recibir ({selectedToReceive.length} seleccionadas)
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                  {selectedMatch.canReceive.map(sticker => (
                    <button
                      key={sticker}
                      onClick={() => {
                        setSelectedToReceive(prev => 
                          prev.includes(sticker) 
                            ? prev.filter(s => s !== sticker)
                            : [...prev, sticker]
                        )
                      }}
                      className={cn(
                        'px-2 py-1 text-xs font-mono rounded-md border transition-colors',
                        selectedToReceive.includes(sticker)
                          ? 'bg-cyan/30 text-cyan border-cyan'
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-cyan/50'
                      )}
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm */}
              <button
                onClick={handleConfirmTrade}
                disabled={selectedToGive.length === 0 || selectedToReceive.length === 0}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold transition-colors',
                  selectedToGive.length > 0 && selectedToReceive.length > 0
                    ? 'bg-gold text-background hover:bg-gold/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                <Check className="w-4 h-4 inline mr-2" />
                Confirmar Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
