// app/page.tsx — REEMPLAZA el archivo existente

'use client'

import { useState, useEffect } from 'react'
import { UserProvider, useUser } from '@/lib/user-context'
import { MainApp } from '@/components/main-app'
import { PinLock } from '@/components/pin-lock'

function AppWithLock() {
  const { activeUser, setActiveUser, signOut } = useUser()
  const [unlocked, setUnlocked] = useState(false)

  // Reset unlocked state if user signs out
  useEffect(() => {
    if (!activeUser) setUnlocked(false)
  }, [activeUser])

  const handleUnlock = (userId: string) => {
    setActiveUser(userId)
    setUnlocked(true)
  }

  const handleSignOut = () => {
    signOut()
    setUnlocked(false)
  }

  if (!unlocked || !activeUser) {
    return <PinLock onUnlock={handleUnlock} />
  }

  return <MainApp onSignOut={handleSignOut} />
}

export default function Home() {
  return (
    <UserProvider>
      <AppWithLock />
    </UserProvider>
  )
}
