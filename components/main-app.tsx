// components/main-app.tsx — REEMPLAZA el archivo existente
'use client'

import { useState, useEffect } from 'react'
import { Home, BookOpen, ArrowLeftRight, Users, Undo2, Save, CheckCircle, LogOut, Bell, ShieldCheck, MessageSquare, Search, Sparkles } from 'lucide-react'
import { TabType } from '@/lib/types'
import { useUser } from '@/lib/user-context'
import { Dashboard } from './dashboard'
import { AlbumView } from './album-view'
import { TradeView } from './trade-view'
import { UsersView } from './users-view'
import { ChatView } from './chat-view'
import { FeedView } from './feed-view'
import { ViewingUserModal } from './viewing-user-modal'
import { NotificationsPanel } from './notifications-panel'
import { GlobalSearch } from './global-search'
import { Avatar } from './avatar'
import { cn } from '@/lib/utils'

const TABS: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'album', label: 'Album', icon: BookOpen },
  { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
  { id: 'feed', label: 'Feed', icon: Sparkles },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'users', label: 'Usuarios', icon: Users },
]

export function MainApp({ onSignOut }: { onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const { canUndo, undo, lastSaveTime, viewingUserId, activeUser, isAdmin, unreadCount, trades, totalUnreadMessages } = useUser()
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    if (lastSaveTime) {
      setShowSaveIndicator(true)
      const t = setTimeout(() => setShowSaveIndicator(false), 2000)
      return () => clearTimeout(t)
    }
  }, [lastSaveTime])

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowNotifs(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const pendingTrades = trades.filter(t => t.status === 'pending' && t.toUserId === activeUser?.id).length

  const tabBadge = (tabId: TabType): number => {
    if (tabId === 'trade') return pendingTrades
    if (tabId === 'chat') return totalUnreadMessages
    return 0
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shrink-0">
                <span className="text-background text-xl">⚽</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl md:text-2xl tracking-wide text-gold truncate">PANINI TRADE HUB</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">Mundial 2026</p>
                  {activeUser && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar user={activeUser} size="xs" />
                        <p className="text-xs text-foreground/80 truncate flex items-center gap-1">
                          {activeUser.name}
                          {isAdmin && <ShieldCheck className="w-3 h-3 text-gold" />}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all duration-300',
                showSaveIndicator ? 'bg-success/20 text-success opacity-100' : 'text-muted-foreground opacity-60'
              )}>
                {showSaveIndicator ? (
                  <><CheckCircle className="w-3 h-3" /><span className="hidden sm:inline">Guardado</span></>
                ) : lastSaveTime ? (
                  <><Save className="w-3 h-3" /></>
                ) : null}
              </div>

              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Buscar estampa (Cmd+K)"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowNotifs(true)}
                className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-sticker-missing text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {canUndo && (
                <button
                  onClick={undo}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-danger/10 hover:bg-danger/20 border border-danger/30 rounded-lg text-danger text-xs font-medium transition-colors"
                  title="Deshacer último cambio"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24">
        {activeTab === 'home' && <Dashboard />}
        {activeTab === 'album' && <AlbumView />}
        {activeTab === 'trade' && <TradeView />}
        {activeTab === 'feed' && <FeedView />}
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'users' && <UsersView />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40">
        <div className="max-w-5xl mx-auto flex justify-around">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const badge = tabBadge(tab.id)
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-3 px-2 flex-1 transition-colors',
                  isActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-sticker-missing text-white text-[9px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className={cn('text-[11px] font-medium', isActive && 'font-semibold')}>{tab.label}</span>
                {isActive && <div className="absolute bottom-0 w-10 h-0.5 bg-gold rounded-full" />}
              </button>
            )
          })}
        </div>
      </nav>

      {viewingUserId && <ViewingUserModal />}
      {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
    </div>
  )
}
