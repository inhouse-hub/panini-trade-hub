'use client'

import { useState, useEffect } from 'react'
import { Home, BookOpen, ArrowLeftRight, Users, Undo2, Save, CheckCircle } from 'lucide-react'
import { TabType } from '@/lib/types'
import { useUser } from '@/lib/user-context'
import { UserSelector } from './user-selector'
import { Dashboard } from './dashboard'
import { AlbumView } from './album-view'
import { TradeView } from './trade-view'
import { UsersView } from './users-view'
import { ViewingUserModal } from './viewing-user-modal'
import { cn } from '@/lib/utils'

const TABS: { id: TabType; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'album', label: 'Album', icon: BookOpen },
  { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
  { id: 'users', label: 'Usuarios', icon: Users },
]

export function MainApp() {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const { canUndo, undo, lastSaveTime, viewingUserId } = useUser()
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)

  // Show save indicator when data is saved
  useEffect(() => {
    if (lastSaveTime) {
      setShowSaveIndicator(true)
      const timeout = setTimeout(() => setShowSaveIndicator(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [lastSaveTime])

  const formatSaveTime = (timestamp: number | null) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center">
                <span className="text-background text-xl">&#9917;</span>
              </div>
              <div>
                <h1 className="font-display text-2xl tracking-wide text-gold">PANINI TRADE HUB</h1>
                <p className="text-xs text-muted-foreground">Mundial 2026</p>
              </div>
            </div>
            
            {/* Undo button and save indicator */}
            <div className="flex items-center gap-2">
              {/* Save indicator */}
              <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all duration-300',
                showSaveIndicator 
                  ? 'bg-success/20 text-success opacity-100' 
                  : 'text-muted-foreground opacity-60'
              )}>
                {showSaveIndicator ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Guardado</span>
                  </>
                ) : lastSaveTime ? (
                  <>
                    <Save className="w-3 h-3" />
                    <span className="hidden sm:inline">{formatSaveTime(lastSaveTime)}</span>
                  </>
                ) : null}
              </div>
              
              {/* Undo button */}
              {canUndo && (
                <button
                  onClick={undo}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 hover:bg-danger/20 border border-danger/30 rounded-lg text-danger text-sm font-medium transition-colors"
                  title="Deshacer ultimo cambio"
                >
                  <Undo2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Deshacer</span>
                </button>
              )}
            </div>
          </div>
          
          {/* User selector */}
          <UserSelector />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24">
        {activeTab === 'home' && <Dashboard />}
        {activeTab === 'album' && <AlbumView />}
        {activeTab === 'trade' && <TradeView />}
        {activeTab === 'users' && <UsersView />}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40">
        <div className="max-w-5xl mx-auto flex justify-around">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 px-4 flex-1 transition-colors',
                  isActive ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 transition-transform',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-xs font-medium',
                  isActive && 'font-semibold'
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-12 h-0.5 bg-gold rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Viewing user modal (read-only) */}
      {viewingUserId && <ViewingUserModal />}
    </div>
  )
}
