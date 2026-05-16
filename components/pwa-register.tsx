// components/pwa-register.tsx — NUEVO
'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.warn('SW registration failed:', err)
        })
      })
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      // Show banner only if not dismissed before
      const dismissed = localStorage.getItem('pwa_install_dismissed')
      if (!dismissed) setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      setInstallPrompt(null)
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa_install_dismissed', Date.now().toString())
  }

  if (!showBanner || !installPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md bg-card border border-gold/40 rounded-2xl p-4 shadow-2xl shadow-gold/10 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shrink-0">
          <span className="text-background text-xl">⚽</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Instala la app</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tenla siempre a la mano en tu celular
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-background rounded-lg text-xs font-semibold hover:bg-gold/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 hover:bg-muted rounded-lg shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
