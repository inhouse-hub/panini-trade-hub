// components/user-selector.tsx — REEMPLAZA el archivo existente
// Este componente ya no se usa en el nuevo main-app, pero lo mantenemos
// con la signature correcta por si se referencia desde algún lado.

'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { AVATAR_OPTIONS } from '@/lib/album-data'
import { cn } from '@/lib/utils'

export function UserSelector() {
  const { users, activeUser, setActiveUser, addUser, updateUser, deleteUser, getStats, isAdmin } = useUser()
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState(AVATAR_OPTIONS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAddingUser && inputRef.current) inputRef.current.focus()
  }, [isAddingUser])

  const handleAddUser = () => {
    if (newName.trim()) {
      addUser(newName.trim(), newAvatar)
      setNewName('')
      setNewAvatar(AVATAR_OPTIONS[0])
      setIsAddingUser(false)
    }
  }

  const handleUpdateUser = (userId: string) => {
    if (newName.trim()) {
      updateUser(userId, { name: newName.trim(), avatar: newAvatar })
      setEditingUserId(null)
      setNewName('')
    }
  }

  const startEditing = (userId: string, name: string, avatar: string) => {
    setEditingUserId(userId)
    setNewName(name)
    setNewAvatar(avatar)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {users.map(user => {
          const stats = getStats(user.id)
          const progress = ((stats.has + stats.repeated) / (stats.total || 1)) * 100
          const isActive = activeUser?.id === user.id
          const isEditing = editingUserId === user.id

          if (isEditing) {
            return (
              <div key={user.id} className="flex items-center gap-2 p-2 bg-card border border-gold/50 rounded-xl">
                <div className="flex flex-wrap gap-1 max-w-[100px]">
                  {AVATAR_OPTIONS.map(avatar => (
                    <button key={avatar} onClick={() => setNewAvatar(avatar)}
                      className={cn('w-6 h-6 rounded-md flex items-center justify-center text-sm transition-colors',
                        newAvatar === avatar ? 'bg-gold/30 ring-1 ring-gold' : 'hover:bg-muted')}>
                      {avatar}
                    </button>
                  ))}
                </div>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser(user.id)}
                  className="w-24 px-2 py-1 bg-muted border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Nombre" />
                <button onClick={() => handleUpdateUser(user.id)}
                  className="p-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingUserId(null)}
                  className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          }

          return (
            <div key={user.id} role="button" tabIndex={0}
              onClick={() => setActiveUser(user.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveUser(user.id) }}
              className={cn('group relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer',
                isActive ? 'bg-gold/10 border-gold/50 shadow-lg shadow-gold/10' : 'bg-card/50 border-border hover:border-gold/30 hover:bg-card')}>
              <span className="text-xl">{user.avatar}</span>
              <div className="text-left">
                <p className={cn('font-semibold text-sm', isActive && 'text-gold')}>{user.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{progress.toFixed(0)}%</p>
              </div>
              {isAdmin && (
                <div className={cn('absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
                  isActive && 'opacity-100')}>
                  <button onClick={(e) => { e.stopPropagation(); startEditing(user.id, user.name, user.avatar) }}
                    className="p-1 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {users.length > 1 && !user.isAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar a ${user.name}?`)) deleteUser(user.id) }}
                      className="p-1 rounded-full bg-danger/20 text-danger hover:bg-danger/30 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {isAddingUser && isAdmin ? (
          <div className="flex items-center gap-2 p-2 bg-card border border-gold/50 rounded-xl">
            <div className="flex flex-wrap gap-1 max-w-[100px]">
              {AVATAR_OPTIONS.map(avatar => (
                <button key={avatar} onClick={() => setNewAvatar(avatar)}
                  className={cn('w-6 h-6 rounded-md flex items-center justify-center text-sm transition-colors',
                    newAvatar === avatar ? 'bg-gold/30 ring-1 ring-gold' : 'hover:bg-muted')}>
                  {avatar}
                </button>
              ))}
            </div>
            <input ref={inputRef} type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
              className="w-24 px-2 py-1 bg-muted border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="Nombre" />
            <button onClick={handleAddUser}
              className="p-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setIsAddingUser(false); setNewName('') }}
              className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : isAdmin ? (
          <button onClick={() => setIsAddingUser(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border hover:border-gold/50 hover:bg-card/50 text-muted-foreground hover:text-foreground transition-all">
            <Plus className="w-4 h-4" />
            <span className="text-sm">Nuevo</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
