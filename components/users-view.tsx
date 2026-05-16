'use client'

import { useState } from 'react'
import { X, Plus, Edit2, Trash2, Check, Eye } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { AVATAR_OPTIONS } from '@/lib/album-data'
import { cn } from '@/lib/utils'

export function UsersView() {
  const { users, activeUser, setActiveUser, addUser, updateUser, deleteUser, getStats, setViewingUser } = useUser()
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState(AVATAR_OPTIONS[0])

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
      updateUser(userId, newName.trim(), newAvatar)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-gold">Gestion de Usuarios</h2>
        {!isAddingUser && (
          <button
            onClick={() => setIsAddingUser(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-xl text-gold font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Add user form */}
      {isAddingUser && (
        <div className="bg-card/50 backdrop-blur-sm border border-gold/30 rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Nuevo Usuario</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map(avatar => (
                  <button
                    key={avatar}
                    onClick={() => setNewAvatar(avatar)}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
                      newAvatar === avatar 
                        ? 'bg-gold/30 ring-2 ring-gold scale-110' 
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nombre</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                placeholder="Ingresa el nombre"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddUser}
                disabled={!newName.trim()}
                className={cn(
                  'flex-1 py-2.5 rounded-xl font-semibold transition-colors',
                  newName.trim()
                    ? 'bg-gold text-background hover:bg-gold/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                <Check className="w-4 h-4 inline mr-2" />
                Crear Usuario
              </button>
              <button
                onClick={() => { setIsAddingUser(false); setNewName(''); setNewAvatar(AVATAR_OPTIONS[0]) }}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User list */}
      <div className="space-y-3">
        {users.map(user => {
          const stats = getStats(user.id)
          const progress = ((stats.has + stats.repeated) / (stats.total || 1)) * 100
          const isActive = activeUser?.id === user.id
          const isEditing = editingUserId === user.id

          if (isEditing) {
            return (
              <div key={user.id} className="bg-card/50 backdrop-blur-sm border border-gold/30 rounded-2xl p-4">
                <h3 className="font-semibold mb-4">Editar Usuario</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Avatar</label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_OPTIONS.map(avatar => (
                        <button
                          key={avatar}
                          onClick={() => setNewAvatar(avatar)}
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
                            newAvatar === avatar 
                              ? 'bg-gold/30 ring-2 ring-gold scale-110' 
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Nombre</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser(user.id)}
                      className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateUser(user.id)}
                      className="flex-1 py-2.5 bg-gold text-background rounded-xl font-semibold hover:bg-gold/90 transition-colors"
                    >
                      <Check className="w-4 h-4 inline mr-2" />
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingUserId(null)}
                      className="px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div
              key={user.id}
              className={cn(
                'bg-card/50 backdrop-blur-sm border rounded-2xl p-4 transition-all',
                isActive ? 'border-gold/50' : 'border-border'
              )}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{user.avatar}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    {isActive && (
                      <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs font-semibold rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gold rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Tiene: <strong className="text-sticker-has">{stats.has}</strong></span>
                      <span>Repetidas: <strong className="text-sticker-repeated">{stats.repeated}</strong></span>
                      <span>Faltan: <strong className="text-sticker-missing">{stats.missing}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {!isActive && (
                    <button
                      onClick={() => setActiveUser(user.id)}
                      className="px-3 py-1.5 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold rounded-lg transition-colors"
                    >
                      Activar
                    </button>
                  )}
                  {/* View album button - available for all users */}
                  <button
                    onClick={() => setViewingUser(user.id)}
                    className="p-2 rounded-lg hover:bg-cyan/20 text-muted-foreground hover:text-cyan transition-colors"
                    title="Ver album"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEditing(user.id, user.name, user.avatar)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {users.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Eliminar a ${user.name}? Esta accion no se puede deshacer.`)) {
                          deleteUser(user.id)
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-danger/20 text-muted-foreground hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
