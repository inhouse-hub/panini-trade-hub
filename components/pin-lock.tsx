// components/pin-lock.tsx — NUEVO archivo
// Pantalla de bloqueo con selector de usuario y PIN

'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/user-context'
import { Trophy, Lock, Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // Auto-submit cuando el PIN llega a 4 dígitos
  useEffect(() => {
    if (pin.length === 4 && selectedUser) {
      if (pin === selectedUser.pin) {
        // Pequeño delay para feedback visual antes de entrar
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Panini Trade Hub</h1>
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Mundial 2026</p>
          </div>
        </div>

        <h2 className="text-zinc-400 text-sm uppercase tracking-widest mb-6">¿Quién entra?</h2>

        <div className="w-full max-w-sm space-y-3">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUserId(user.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-yellow-500/50 hover:bg-zinc-900 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-2xl">
                {user.avatar}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-lg">{user.name}</div>
                <div className="text-xs text-zinc-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  PIN requerido
                </div>
              </div>
              <div className="text-zinc-600 group-hover:text-yellow-500 transition-colors">→</div>
            </button>
          ))}
        </div>

        <p className="text-xs text-zinc-600 mt-8 text-center max-w-sm">
          PIN inicial para todos: <span className="font-mono text-zinc-400">1234</span><br />
          Puedes cambiarlo después en Usuarios.
        </p>
      </div>
    )
  }

  // ── Pantalla 2: Ingreso de PIN ────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <button
        onClick={handleBack}
        className="text-zinc-500 hover:text-zinc-300 text-sm mb-8"
      >
        ← Cambiar usuario
      </button>

      <div className={cn(
        "flex flex-col items-center gap-3 mb-10 transition-transform",
        shake && "animate-[shake_0.6s_ease-in-out]"
      )}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-4xl">
          {selectedUser?.avatar}
        </div>
        <h2 className="text-2xl font-bold">{selectedUser?.name}</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest">Ingresa tu PIN</p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full border-2 transition-all",
              error
                ? "border-red-500 bg-red-500"
                : pin.length > i
                ? "border-yellow-500 bg-yellow-500 scale-110"
                : "border-zinc-700"
            )}
          />
        ))}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            onClick={() => handleDigit(n.toString())}
            className="aspect-square rounded-2xl bg-zinc-900/70 border border-zinc-800 text-2xl font-light hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          className="aspect-square rounded-2xl bg-zinc-900/70 border border-zinc-800 text-2xl font-light hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="aspect-square rounded-2xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 active:scale-95 transition-all"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
