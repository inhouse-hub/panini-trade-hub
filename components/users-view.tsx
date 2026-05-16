// components/users-view.tsx — REEMPLAZA el archivo existente
'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Check, Eye, Key, ShieldCheck, Lock, X, Camera, Link2, Copy, CheckCircle } from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { AVATAR_OPTIONS } from '@/lib/album-data'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'
import { AvatarUploadModal } from './avatar-upload-modal'

export function UsersView() {
  const { users, activeUser, isAdmin, setActiveUser, addUser, updateUser, deleteUser, getStats, setViewingUser, uploadAvatar } = useUser()
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [pinChangeUserId, setPinChangeUserId] = useState<string | null>(null)
  const [avatarUploadUserId, setAvatarUploadUserId] = useState<string | null>(null)
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null)

  // Form state
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState(AVATAR_OPTIONS[0])
  const [newPin, setNewPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [pinError, setPinError] = useState('')

  const handleAddUser = () => {
    if (newName.trim()) {
      addUser(newName.trim(), newAvatar, newPin || '1234')
      resetForm()
      setIsAddingUser(false)
    }
  }

  const handleUpdateUser = (userId: string) => {
    if (newName.trim()) {
      updateUser(userId, { name: newName.trim(), avatar: newAvatar })
      setEditingUserId(null)
      resetForm()
    }
  }

  const handleChangePin = (user: typeof users[0]) => {
    if (!isAdmin && currentPin !== user.pin) {
      setPinError('PIN actual incorrecto')
      return
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('El PIN debe ser de 4 dígitos')
      return
    }
    updateUser(user.id, { pin: newPin })
    setPinChangeUserId(null)
    resetForm()
  }

  const handleAvatarUpload = async (blob: Blob) => {
    if (!avatarUploadUserId) return
    await uploadAvatar(avatarUploadUserId, blob)
  }

  const handleCopyLink = async (userId: string) => {
    const url = `${window.location.origin}/p/${userId}`
    await navigator.clipboard.writeText(url)
    setCopiedUserId(userId)
    setTimeout(() => setCopiedUserId(null), 2000)
  }

  const resetForm = () => {
    setNewName('')
    setNewAvatar(AVATAR_OPTIONS[0])
    setNewPin('')
    setCurrentPin('')
    setPinError('')
  }

  const startEditing = (user: typeof users[0]) => {
    setEditingUserId(user.id)
    setNewName(user.name)
    setNewAvatar(user.avatar)
  }

  const startPinChange = (user: typeof users[0]) => {
    setPinChangeUserId(user.id)
    setNewPin('')
    setCurrentPin('')
    setPinError('')
  }

  const canEdit = (user: typeof users[0]) => {
    if (!activeUser) return false
    if (isAdmin) return true
    return user.id === activeUser.id
  }

  const canDelete = (user: typeof users[0]) => {
    if (!activeUser || users.length <= 1) return false
    if (!isAdmin) return false
    if (user.isAdmin) return false
    return true
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-gold">Gestión de Usuarios</h2>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-gold" />
              Modo administrador activo
            </p>
          )}
        </div>
        {isAdmin && !isAddingUser && (
          <button
            onClick={() => setIsAddingUser(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-xl text-gold font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        )}
      </div>

      {isAddingUser && isAdmin && (
        <div className="bg-card/50 backdrop-blur-sm border border-gold/30 rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Nuevo Usuario</h3>
          <div className="space-y-4">
            <AvatarPicker value={newAvatar} onChange={setNewAvatar} />
            <TextField label="Nombre" value={newName} onChange={setNewName} placeholder="Ingresa el nombre" />
            <TextField label="PIN inicial (4 dígitos)" value={newPin} onChange={setNewPin} placeholder="1234" maxLength={4} numeric />
            <div className="flex gap-2">
              <button onClick={handleAddUser} disabled={!newName.trim()}
                className={cn('flex-1 py-2.5 rounded-xl font-semibold transition-colors',
                  newName.trim() ? 'bg-gold text-background hover:bg-gold/90' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
                <Check className="w-4 h-4 inline mr-2" />
                Crear
              </button>
              <button onClick={() => { setIsAddingUser(false); resetForm() }}
                className="px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {users.map(user => {
          const stats = getStats(user.id)
          const progress = ((stats.has + stats.repeated) / (stats.total || 1)) * 100
          const isActiveUser = activeUser?.id === user.id
          const isEditing = editingUserId === user.id
          const isPinning = pinChangeUserId === user.id

          if (isEditing) {
            return (
              <div key={user.id} className="bg-card/50 backdrop-blur-sm border border-gold/30 rounded-2xl p-4">
                <h3 className="font-semibold mb-4">Editar perfil</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                    <Avatar user={user} size="xl" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-1">Foto actual</p>
                      <button
                        onClick={() => setAvatarUploadUserId(user.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold text-xs font-semibold transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {user.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
                      </button>
                    </div>
                  </div>
                  <AvatarPicker value={newAvatar} onChange={setNewAvatar} label="O elige un emoji" />
                  <TextField label="Nombre" value={newName} onChange={setNewName} />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateUser(user.id)}
                      className="flex-1 py-2.5 bg-gold text-background rounded-xl font-semibold hover:bg-gold/90 transition-colors">
                      <Check className="w-4 h-4 inline mr-2" /> Guardar
                    </button>
                    <button onClick={() => { setEditingUserId(null); resetForm() }}
                      className="px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          if (isPinning) {
            return (
              <div key={user.id} className="bg-card/50 backdrop-blur-sm border border-cyan/30 rounded-2xl p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan" />
                  {isAdmin && !isActiveUser ? `Cambiar PIN de ${user.name}` : 'Cambiar mi PIN'}
                </h3>
                <div className="space-y-4">
                  {(!isAdmin || isActiveUser) && (
                    <TextField label="PIN actual" value={currentPin} onChange={setCurrentPin} placeholder="••••" maxLength={4} numeric password />
                  )}
                  <TextField label="Nuevo PIN (4 dígitos)" value={newPin} onChange={setNewPin} placeholder="••••" maxLength={4} numeric password />
                  {pinError && (
                    <p className="text-xs text-sticker-missing flex items-center gap-1"><X className="w-3 h-3" />{pinError}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleChangePin(user)}
                      className="flex-1 py-2.5 bg-cyan text-background rounded-xl font-semibold hover:bg-cyan/90 transition-colors">
                      <Check className="w-4 h-4 inline mr-2" /> Guardar PIN
                    </button>
                    <button onClick={() => { setPinChangeUserId(null); resetForm() }}
                      className="px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={user.id} className={cn('bg-card/50 backdrop-blur-sm border rounded-2xl p-4 transition-all',
              isActiveUser ? 'border-gold/50' : 'border-border')}>
              <div className="flex items-center gap-4">
                <Avatar user={user} size="xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    {isActiveUser && (
                      <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs font-semibold rounded-full">Tú</span>
                    )}
                    {user.isAdmin && (
                      <span className="px-2 py-0.5 bg-gold/10 text-gold text-xs font-semibold rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>✓<strong className="text-sticker-has ml-1">{stats.has}</strong></span>
                      <span>🔄<strong className="text-sticker-repeated ml-1">{stats.repeated}</strong></span>
                      <span>✗<strong className="text-sticker-missing ml-1">{stats.missing}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!isActiveUser && isAdmin && (
                    <button onClick={() => setActiveUser(user.id)}
                      className="px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold rounded-lg transition-colors">
                      Cambiar a
                    </button>
                  )}
                  <button onClick={() => setViewingUser(user.id)}
                    className="p-2 rounded-lg hover:bg-cyan/20 text-muted-foreground hover:text-cyan transition-colors"
                    title="Ver álbum">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleCopyLink(user.id)}
                    className={cn('p-2 rounded-lg transition-colors',
                      copiedUserId === user.id
                        ? 'bg-success/20 text-success'
                        : 'hover:bg-cyan/20 text-muted-foreground hover:text-cyan')}
                    title="Copiar link público">
                    {copiedUserId === user.id ? <CheckCircle className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  </button>
                  {canEdit(user) && (
                    <button onClick={() => startEditing(user)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Editar perfil">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canEdit(user) && (
                    <button onClick={() => startPinChange(user)}
                      className="p-2 rounded-lg hover:bg-cyan/20 text-muted-foreground hover:text-cyan transition-colors"
                      title="Cambiar PIN">
                      <Key className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete(user) && (
                    <button onClick={() => {
                      if (confirm(`¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`)) deleteUser(user.id)
                    }}
                      className="p-2 rounded-lg hover:bg-danger/20 text-muted-foreground hover:text-danger transition-colors"
                      title="Eliminar usuario">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!isAdmin && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Solo puedes editar tu propio perfil. Para más permisos, pide a Jorge (admin) que te asigne otro rol.
        </p>
      )}

      {/* Avatar upload modal */}
      {avatarUploadUserId && (
        <AvatarUploadModal
          onClose={() => setAvatarUploadUserId(null)}
          onUpload={handleAvatarUpload}
        />
      )}
    </div>
  )
}

function AvatarPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-2 block">{label || 'Avatar'}</label>
      <div className="flex flex-wrap gap-2">
        {AVATAR_OPTIONS.map(avatar => (
          <button key={avatar} onClick={() => onChange(avatar)}
            className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
              value === avatar ? 'bg-gold/30 ring-2 ring-gold scale-110' : 'bg-muted hover:bg-muted/80')}>
            {avatar}
          </button>
        ))}
      </div>
    </div>
  )
}

function TextField({
  label, value, onChange, placeholder, maxLength, numeric, password
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; maxLength?: number; numeric?: boolean; password?: boolean
}) {
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-2 block">{label}</label>
      <input
        type={password ? 'password' : 'text'}
        inputMode={numeric ? 'numeric' : 'text'}
        value={value}
        onChange={(e) => {
          let v = e.target.value
          if (numeric) v = v.replace(/\D/g, '')
          if (maxLength) v = v.slice(0, maxLength)
          onChange(v)
        }}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 font-mono"
      />
    </div>
  )
}
