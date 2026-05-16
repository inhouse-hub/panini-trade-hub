// components/notifications-panel.tsx — NUEVO
'use client'

import { Bell, X, Check, RefreshCw, Trash2 } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { cn } from '@/lib/utils'

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotifRead, markAllNotifsRead, unreadCount } = useUser()

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border-l border-border h-full w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gold" />
            <h2 className="font-display text-lg text-gold tracking-wider">NOTIFICACIONES</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-sticker-missing text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotifsRead}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Marcar todas
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Cuando alguien te proponga un trade aparecerá aquí</p>
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => !n.read && markNotifRead(n.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-colors',
                  n.read
                    ? 'bg-muted/20 border-border/50'
                    : 'bg-gold/5 border-gold/30 hover:bg-gold/10'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', !n.read && 'text-foreground')}>{n.title}</p>
                    {n.message && (
                      <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-gold" />}
                    <span className="text-xs text-muted-foreground font-mono">{formatTime(n.createdAt)}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
