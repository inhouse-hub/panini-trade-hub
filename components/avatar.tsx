// components/avatar.tsx — NUEVO
'use client'

import { User } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AvatarProps {
  user: { avatar: string; avatarUrl?: string; name?: string } | User
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-sm',
  sm: 'w-8 h-8 text-base',
  md: 'w-10 h-10 text-xl',
  lg: 'w-12 h-12 text-2xl',
  xl: 'w-16 h-16 text-3xl',
  '2xl': 'w-24 h-24 text-5xl',
}

export function Avatar({ user, size = 'md', className }: AvatarProps) {
  const sizeClass = sizeClasses[size]

  if (user.avatarUrl) {
    return (
      <div className={cn('rounded-full overflow-hidden bg-muted shrink-0', sizeClass, className)}>
        <img
          src={user.avatarUrl}
          alt={user.name || 'avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <span className={cn('inline-flex items-center justify-center shrink-0', sizeClass, className)}>
      {user.avatar}
    </span>
  )
}
