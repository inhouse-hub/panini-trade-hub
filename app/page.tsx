'use client'

import { useState } from 'react'
import { UserProvider, useUser } from '@/lib/user-context'
import { MainApp } from '@/components/main-app'
import { PinLock } from '@/components/pin-lock'

function AppWithLock() {
  const { setActiveUser } = useUser()
  const [unlockedUserId, setUnlockedUserId] = useState<string | null>(null)

  const handleUnlock = (userId: string) => {
    setActiveUser(userId)
    setUnlockedUserId(userId)
  }

  if (!unlockedUserId) {
    return <PinLock onUnlock={handleUnlock} />
  }

  return <MainApp />
}

export default function Home() {
  return (
    <UserProvider>
      <AppWithLock />
    </UserProvider>
  )
}