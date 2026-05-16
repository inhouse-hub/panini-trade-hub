// app/p/[userId]/page.tsx — NUEVO (página pública sin login)

'use client'

import { use, useEffect, useState } from 'react'
import { fetchPublicProfile } from '@/lib/supabase'
import { ALBUM_SECTIONS, getTotalStickerCount } from '@/lib/album-data'
import { User, UserAlbum } from '@/lib/types'
import { Trophy, Check, X, RefreshCw, ExternalLink, Copy, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ userId: string }>
}

export default function PublicProfilePage({ params }: Props) {
  const { userId } = use(params)
  const [profile, setProfile] = useState<{ user: User; album: UserAlbum } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchPublicProfile(userId).then(p => {
      setProfile(p)
      setLoading(false)
    })
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground animate-pulse">Cargando perfil…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-xl text-muted-foreground mb-2">Perfil no encontrado</p>
        <Link href="/" className="text-sm text-gold hover:underline">← Volver</Link>
      </div>
    )
  }

  const { user, album } = profile
  const total = getTotalStickerCount()

  let has = 0, missing = 0, repeated = 0
  const repeatedList: string[] = []
  const missingList: string[] = []
  for (const section of ALBUM_SECTIONS) {
    const data = album[section.code] || {}
    for (const num in data) {
      const code = `${section.code}-${num}`
      if (data[num].state === 'has') has++
      else if (data[num].state === 'repeated') { has++; repeated++; repeatedList.push(code) }
      else if (data[num].state === 'missing') { missing++; missingList.push(code) }
    }
  }
  const percent = (has / total) * 100

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const buildWhatsappText = () => {
    return `🏆 Lista de ${user.name} — Panini Mundial 2026\n\n` +
      `📊 Progreso: ${percent.toFixed(1)}% (${has}/${total})\n\n` +
      `🔄 Tengo repetidas (${repeated}):\n${repeatedList.join(', ') || '—'}\n\n` +
      `❌ Me faltan (${missing}):\n${missingList.join(', ') || '—'}\n\n` +
      `🌐 ${typeof window !== 'undefined' ? window.location.href : ''}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Panini Trade Hub</span>
          </Link>
          <Link
            href="/"
            className="text-xs px-3 py-1.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold font-semibold transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3 h-3" />
            Abrir app
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gold/20 via-card to-cyan/10 border border-gold/30 rounded-2xl p-6">
          <div className="relative z-10 flex items-center gap-4">
            {user.avatarUrl ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold/50 shrink-0">
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-4xl shrink-0">
                {user.avatar}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Perfil público</p>
              <h1 className="font-display text-3xl text-gold mt-1 truncate">{user.name}</h1>
              <p className="text-xs text-muted-foreground mt-1">Panini Mundial 2026</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base text-gold tracking-wider">PROGRESO</h3>
            <span className="font-mono text-3xl font-bold">{percent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-gold to-cyan rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono font-bold text-foreground">{has}</span> de {total} estampas
          </p>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-sticker-has/10 border border-sticker-has/30 rounded-lg p-3 text-center">
              <Check className="w-4 h-4 mx-auto text-sticker-has mb-1" />
              <p className="font-mono text-2xl font-bold">{has}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Tiene</p>
            </div>
            <div className="bg-sticker-repeated/10 border border-sticker-repeated/30 rounded-lg p-3 text-center">
              <RefreshCw className="w-4 h-4 mx-auto text-sticker-repeated mb-1" />
              <p className="font-mono text-2xl font-bold">{repeated}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Repetidas</p>
            </div>
            <div className="bg-sticker-missing/10 border border-sticker-missing/30 rounded-lg p-3 text-center">
              <X className="w-4 h-4 mx-auto text-sticker-missing mb-1" />
              <p className="font-mono text-2xl font-bold">{missing}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Faltan</p>
            </div>
          </div>
        </div>

        {/* Copy actions */}
        <button
          onClick={() => handleCopy(buildWhatsappText())}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-xl text-gold text-sm font-semibold transition-colors"
        >
          {copied ? <><CheckCircle className="w-4 h-4" />Copiado para WhatsApp</> : <><Copy className="w-4 h-4" />Copiar lista completa</>}
        </button>

        {/* Repeated */}
        <div className="bg-card/50 backdrop-blur-sm border border-sticker-repeated/30 rounded-2xl p-5">
          <h3 className="font-display text-base text-sticker-repeated tracking-wider mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            REPETIDAS ({repeatedList.length})
          </h3>
          {repeatedList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tiene estampas repetidas marcadas</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {repeatedList.map(code => (
                <span key={code} className="px-2 py-1 bg-sticker-repeated/15 text-sticker-repeated text-xs font-mono rounded-md border border-sticker-repeated/30">
                  {code}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing */}
        <div className="bg-card/50 backdrop-blur-sm border border-sticker-missing/30 rounded-2xl p-5">
          <h3 className="font-display text-base text-sticker-missing tracking-wider mb-3 flex items-center gap-2">
            <X className="w-4 h-4" />
            FALTANTES ({missingList.length})
          </h3>
          {missingList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tiene faltantes marcados</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {missingList.map(code => (
                <span key={code} className="px-2 py-1 bg-sticker-missing/15 text-sticker-missing text-xs font-mono rounded-md border border-sticker-missing/30">
                  {code}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-center pt-4 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trophy className="w-4 h-4" />
            ¿Quieres una lista así? Crea tu cuenta
          </Link>
        </div>
      </main>
    </div>
  )
}
