// components/pin-lock.tsx — REEMPLAZA el archivo existente

'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/user-context'
import { Trophy, Lock, Delete } from 'lucide-react'
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

  const selectedUser = users.find(u => u.id === selectedUserId)

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
