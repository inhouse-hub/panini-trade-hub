// components/pin-lock.tsx — REEMPLAZA el archivo existente

'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/user-context'
import { Trophy, Lock, Delete, Download, Smartphone, X, Share } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

interface PinLockProps {
  onUnlock: (userId: string) => void
}

export function PinLock({ onUnlock }: PinLockProps) {
  const { users } = useUser()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  // PWA install state
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  const selectedUser = users.find(u => u.id === selectedUserId)

  // ── Detectar plataforma y standalone ──────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Detectar si ya está corriendo como PWA instalada
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Detectar iOS
    const ua = window.navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(ua))

    // Capturar el evento de "instalable"
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Detectar cuando se instaló
    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsStandalone(true)
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (installPrompt) {
      // Browser-prompted install (Android Chrome)
      installPrompt.prompt()
      const result = await installPrompt.userChoice
      if (result.outcome === 'accepted') {
        setInstallPrompt(null)
      }
    } else {
      // Fallback: show manual instructions
      setShowInstructions(true)
    }
  }

  useEffect(() => {
    if (pin.length === 4 && selectedUser) {
      if (pin === selectedUser.pin) {
        setTimeout(() => onUnlock(selectedUser.id), 200)
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setPin('')
          setError(false)
          setShake(false)
        }, 600)
      }
    }
  }, [pin, selectedUser, onUnlock])

  const handleDigit = (d: string) => {
    if (pin.length < 4) setPin(pin + d)
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
  }

  const handleBack = () => {
    setSelectedUserId(null)
    setPin('')
    setError(false)
  }

  // ── Pantalla 1: Selector de usuario ───────────────────────
  if (!selectedUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center">
            <span className="text-background text-3xl">⚽</span>
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-wide text-gold">PANINI TRADE HUB</h1>
            <p className="text-xs text-muted-foreground">Mundial 2026</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">¿Quién entra?</p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUserId(user.id)}
              className="flex flex-col items-center gap-3 p-6 bg-card/50 backdrop-blur-sm border border-border hover:border-gold/50 hover:bg-card rounded-2xl transition-all group"
            >
              <Avatar user={user} size="2xl" />
              <div className="text-center">
                <p className="font-semibold text-sm group-hover:text-gold transition-colors">{user.name}</p>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gold mt-1">
                    👑 Admin
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Botón de instalar app — solo si NO está ya instalada */}
        {!isStandalone && (
          <button
            onClick={handleInstall}
            className="mt-8 flex items-center gap-2 px-5 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/40 rounded-xl text-gold text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Instalar como app
          </button>
        )}

        {/* Modal con instrucciones */}
        {showInstructions && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
            onClick={() => setShowInstructions(false)}
          >
            <div
              className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-gold flex items-center gap-2">
                  <Smartphone className="w-5 h-5" /> Cómo instalar
                </h3>
                <button onClick={() => setShowInstructions(false)} className="p-1 hover:bg-muted rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isIOS ? (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">En iPhone:</p>
                  <ol className="space-y-2 text-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-gold">1.</span>
                      <span>Tap el botón <Share className="w-4 h-4 inline mx-1" /> Compartir abajo</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gold">2.</span>
                      <span>Scroll abajo</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gold">3.</span>
                      <span>Tap <strong>"Añadir a inicio"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gold">4.</span>
                      <span>Tap <strong>"Añadir"</strong></span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">En Android:</p>
                  <ol className="space-y-2 text-foreground">
                    <li className="flex gap-2">
                      <span className="font-bold text-gold">1.</span>
                      <span>Abre esta página en <strong>Chrome</strong> (NO Samsung Internet)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gold">2.</span>
                      <span>Tap los 3 puntitos <strong>⋮</strong> arriba a la derecha</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gold">3.</span>
                      <span>Tap <strong>"Instalar app"</strong> o <strong>"Añadir a pantalla de inicio"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gold">4.</span>
                      <span>Confirma</span>
                    </li>
                  </ol>
                  <div className="mt-3 p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground">
                    💡 Si dice <strong>"requiere Chrome"</strong>: borra el ícono anterior del home, cierra Chrome y vuelve a intentar.
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full mt-5 py-2.5 bg-gold text-background rounded-xl font-semibold text-sm hover:bg-gold/90 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Pantalla 2: PIN ───────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <button onClick={handleBack}
        className="absolute top-6 left-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Atrás
      </button>

      <div className="flex flex-col items-center mb-8">
        <Avatar user={selectedUser!} size="2xl" className="mb-4" />
        <h2 className="font-display text-2xl text-gold">{selectedUser?.name}</h2>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Ingresa tu PIN
        </p>
      </div>

      {/* PIN dots */}
      <div className={cn('flex gap-3 mb-12 transition-transform', shake && 'animate-shake')}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={cn(
            'w-4 h-4 rounded-full transition-all',
            error ? 'bg-sticker-missing' : pin.length > i ? 'bg-gold' : 'bg-muted'
          )} />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} onClick={() => handleDigit(n.toString())}
            className="aspect-square bg-card/50 backdrop-blur-sm border border-border hover:border-gold/50 hover:bg-card rounded-xl text-2xl font-display tracking-wider transition-all active:scale-95">
            {n}
          </button>
        ))}
        <div />
        <button onClick={() => handleDigit('0')}
          className="aspect-square bg-card/50 backdrop-blur-sm border border-border hover:border-gold/50 hover:bg-card rounded-xl text-2xl font-display tracking-wider transition-all active:scale-95">
          0
        </button>
        <button onClick={handleDelete}
          className="aspect-square bg-card/50 backdrop-blur-sm border border-border hover:border-danger/50 hover:bg-card rounded-xl flex items-center justify-center transition-all active:scale-95">
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}