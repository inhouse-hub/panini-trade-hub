// components/chat-view.tsx — REEMPLAZA el archivo existente
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Send, Smile, Image as ImageIcon, ArrowLeft, MoreVertical, Trash2,
  Users as UsersIcon, MessageSquare, Check, CheckCheck, X, Loader2
} from 'lucide-react'
import { useUser } from '@/lib/user-context'
import { ALBUM_SECTIONS } from '@/lib/album-data'
import { Message } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'
import { ReactionBar, groupReactions } from './reaction-bar'

const EMOJI_LIST = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😏', '😅',
  '😭', '😢', '😡', '🤯', '🥳', '🤩', '😴', '🤤', '🙄', '😬',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '🤝', '✌️', '👌', '🤞',
  '❤️', '🔥', '⭐', '🎉', '🎊', '✨', '💯', '⚡', '💥', '🚀',
  '⚽', '🏆', '🥇', '🥈', '🥉', '🏅', '🎯', '🎮', '🎨', '📱',
]

// Detecta menciones de estampas tipo "MEX-15", "FWC-3", "CC-10"
const STICKER_MENTION_REGEX = /\b([A-Z]{2,4})-(\d{1,2})\b/g

export function ChatView() {
  const {
    activeUser, users, chats, messagesByChat, chatReads,
    loadChatMessages, sendMessage, deleteMessage, markChatRead,
    setTyping, clearTyping, getOrCreateDM, unreadCountForChat,
    activeUserAlbum, uploadChatImage,
    reactions, toggleReactionOnMessage,
  } = useUser()

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [showNewDM, setShowNewDM] = useState(false)
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null)
  const [reactingMsgId, setReactingMsgId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const selectedChat = chats.find(c => c.id === selectedChatId)

  // ── Asegurar chat grupal Todos en lista ───────────────────
  const sortedChats = useMemo(() => {
    const list = [...chats]
    // Sort: grupo primero, luego por última actividad
    list.sort((a, b) => {
      if (a.type === 'group' && b.type !== 'group') return -1
      if (a.type !== 'group' && b.type === 'group') return 1
      const ta = a.lastMessageAt || a.createdAt
      const tb = b.lastMessageAt || b.createdAt
      return tb - ta
    })
    return list
  }, [chats])

  // ── Load messages when chat opens ─────────────────────────
  useEffect(() => {
    if (selectedChatId && !messagesByChat[selectedChatId]) {
      loadChatMessages(selectedChatId)
    }
    if (selectedChatId) {
      markChatRead(selectedChatId)
    }
  }, [selectedChatId, loadChatMessages, markChatRead, messagesByChat])

  // ── Scroll to bottom when new message arrives ─────────────
  useEffect(() => {
    if (selectedChatId && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }, [selectedChatId, messagesByChat])

  // ── Mark read whenever new messages arrive in open chat ───
  useEffect(() => {
    if (selectedChatId) {
      const msgs = messagesByChat[selectedChatId] || []
      if (msgs.length > 0) markChatRead(selectedChatId)
    }
  }, [messagesByChat, selectedChatId, markChatRead])

  if (!activeUser) return null

  const otherUsers = users.filter(u => u.id !== activeUser.id)

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)
    setShowEmojis(false)
    setMenuMsgId(null)
  }

  const handleStartDM = async (otherUserId: string) => {
    const chatId = await getOrCreateDM(otherUserId)
    setShowNewDM(false)
    setSelectedChatId(chatId)
  }

  const handleSend = async () => {
    if (!selectedChatId || !draftText.trim()) return
    const text = draftText.trim()
    setDraftText('')
    setShowEmojis(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    clearTyping(selectedChatId)
    await sendMessage(selectedChatId, text)
    inputRef.current?.focus()
  }

  const handleInputChange = (val: string) => {
    setDraftText(val)
    if (selectedChatId) {
      setTyping(selectedChatId)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => clearTyping(selectedChatId), 3000)
    }
  }

  const addEmoji = (emoji: string) => {
    setDraftText(prev => prev + emoji)
    inputRef.current?.focus()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedChatId) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagen muy grande. Máximo 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPreviewImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSendImage = async () => {
    if (!selectedChatId || !previewImage) return
    setUploadingImage(true)
    try {
      // Convert dataURL to Blob
      const response = await fetch(previewImage)
      const blob = await response.blob()
      const url = await uploadChatImage(selectedChatId, blob)
      if (url) {
        await sendMessage(selectedChatId, '📷 Imagen', url)
      } else {
        alert('Error al subir la imagen. ¿Activaste el bucket "chat-images" en Supabase Storage?')
      }
    } catch (e) {
      console.error(e)
      alert('Error al subir la imagen')
    } finally {
      setUploadingImage(false)
      setPreviewImage(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const getOtherParticipant = (chat: typeof chats[0]) => {
    if (chat.type !== 'dm') return null
    const otherId = chat.participants.find(p => p !== activeUser.id)
    return users.find(u => u.id === otherId)
  }

  const getChatDisplay = (chat: typeof chats[0]) => {
    if (chat.type === 'group') {
      return { name: chat.name || 'Grupo', avatarNode: <span className="text-2xl">👥</span>, subtitle: `${chat.participants.length} miembros` }
    }
    const other = getOtherParticipant(chat)
    return {
      name: other?.name || 'Usuario',
      avatarNode: other ? <Avatar user={other} size="lg" /> : <span className="text-2xl">👤</span>,
      subtitle: other?.isAdmin ? 'Admin 👑' : 'Chat directo',
    }
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    }
    const yesterday = new Date(Date.now() - 86400000)
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  }

  const formatMessageTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  // ══════════ LISTA DE CHATS (vista inicial) ══════════
  if (!selectedChatId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-gold">Mensajes</h2>
            <p className="text-xs text-muted-foreground">Conversa con tus colegas</p>
          </div>
          <button
            onClick={() => setShowNewDM(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-xl text-gold font-semibold text-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Nuevo
          </button>
        </div>

        {/* Modal de nuevo DM */}
        {showNewDM && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowNewDM(false)}
          >
            <div className="bg-card border border-border rounded-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg text-gold">Iniciar conversación</h3>
                <button onClick={() => setShowNewDM(false)} className="p-1 hover:bg-muted rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {otherUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleStartDM(u.id)}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 rounded-xl transition-colors text-left"
                  >
                    <span className="text-2xl">{u.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{u.name}</p>
                      {u.isAdmin && <p className="text-xs text-gold">Admin 👑</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista de chats */}
        {sortedChats.length === 0 ? (
          <div className="text-center py-12 px-4 bg-card/30 border border-border rounded-2xl">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm">Sin conversaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedChats.map(chat => {
              const display = getChatDisplay(chat)
              const unread = unreadCountForChat(chat.id)
              const isGroup = chat.type === 'group'

              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    unread > 0
                      ? 'bg-gold/5 border-gold/30 hover:bg-gold/10'
                      : 'bg-card/50 border-border hover:bg-card'
                  )}
                >
                  <div className="relative shrink-0">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center overflow-hidden',
                      isGroup ? 'bg-cyan/15' : 'bg-muted/40'
                    )}>
                      {display.avatarNode}
                    </div>
                    {isGroup && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan/30 border-2 border-background flex items-center justify-center">
                        <UsersIcon className="w-2.5 h-2.5 text-cyan" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('font-semibold text-sm truncate', unread > 0 && 'text-foreground')}>
                        {display.name}
                      </p>
                      {chat.lastMessageAt && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn(
                        'text-xs truncate',
                        unread > 0 ? 'text-foreground/80 font-medium' : 'text-muted-foreground'
                      )}>
                        {chat.lastMessageText
                          ? (chat.lastMessageFrom === activeUser.id
                            ? `Tú: ${chat.lastMessageText}`
                            : chat.lastMessageText)
                          : display.subtitle}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-gold text-background text-xs font-bold rounded-full flex items-center justify-center">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ══════════ VISTA DEL CHAT ══════════
  if (!selectedChat) {
    setSelectedChatId(null)
    return null
  }

  const display = getChatDisplay(selectedChat)
  const messages = messagesByChat[selectedChatId] || []

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] -mx-4">
      {/* Header de chat */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <button
          onClick={() => setSelectedChatId(null)}
          className="p-2 hover:bg-muted rounded-lg transition-colors -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>{display.avatarNode}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{display.name}</p>
          <p className="text-xs text-muted-foreground truncate">{display.subtitle}</p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" onClick={() => setMenuMsgId(null)}>
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            Aún no hay mensajes
            <p className="text-xs mt-1">¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.fromUserId === activeUser.id
            const sender = users.find(u => u.id === msg.fromUserId)
            const prevMsg = messages[idx - 1]
            const showSenderName = !isMe && selectedChat.type === 'group' &&
              (!prevMsg || prevMsg.fromUserId !== msg.fromUserId)
            const isMenuOpen = menuMsgId === msg.id
            const msgReactionsRaw = reactions.filter(r => r.targetType === 'message' && r.targetId === msg.id)
            const msgReactions = groupReactions(msgReactionsRaw.map(r => ({ emoji: r.emoji, userId: r.userId })))

            let longPressTimer: NodeJS.Timeout | null = null
            const startLongPress = () => {
              longPressTimer = setTimeout(() => {
                if (!msg.deleted) setReactingMsgId(msg.id)
              }, 500)
            }
            const cancelLongPress = () => {
              if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
            }

            return (
              <div
                key={msg.id}
                className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
              >
                <div className={cn('max-w-[80%] group relative', isMe ? 'items-end' : 'items-start')}>
                  {showSenderName && sender && (
                    <p className="text-xs text-cyan font-semibold mb-0.5 ml-2 flex items-center gap-1">
                      <Avatar user={sender} size="xs" /> {sender.name}
                    </p>
                  )}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isMe && !msg.deleted) setMenuMsgId(isMenuOpen ? null : msg.id)
                    }}
                    onMouseDown={startLongPress}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={startLongPress}
                    onTouchEnd={cancelLongPress}
                    className={cn(
                      'relative px-3 py-2 rounded-2xl text-sm break-words',
                      isMe
                        ? 'bg-gold text-background rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm',
                      msg.deleted && 'italic opacity-60',
                      isMe && !msg.deleted && 'cursor-pointer'
                    )}
                  >
                    {msg.imageUrl && !msg.deleted && (
                      <a href={msg.imageUrl} target="_blank" rel="noopener" className="block mb-1 -mt-1 -mx-1">
                        <img
                          src={msg.imageUrl}
                          alt="Imagen"
                          className="max-w-[260px] max-h-[260px] rounded-lg object-cover"
                          onClick={e => e.stopPropagation()}
                        />
                      </a>
                    )}
                    {msg.text !== '📷 Imagen' || msg.deleted ? (
                      <MessageContent text={msg.text} myAlbum={activeUserAlbum} isMe={isMe} />
                    ) : null}
                    <p className={cn(
                      'text-[10px] mt-1',
                      isMe ? 'text-background/70' : 'text-muted-foreground'
                    )}>
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>

                  {/* Reacciones bajo el mensaje */}
                  {(msgReactions.length > 0 || reactingMsgId === msg.id) && !msg.deleted && (
                    <div className={cn('mt-1', isMe ? 'flex justify-end' : 'flex justify-start')}>
                      <ReactionBar
                        reactions={msgReactions}
                        currentUserId={activeUser.id}
                        onToggleReaction={(emoji) => {
                          toggleReactionOnMessage(msg.id, emoji)
                        }}
                        showPicker={reactingMsgId === msg.id}
                        onTogglePicker={() => setReactingMsgId(p => p === msg.id ? null : msg.id)}
                        variant="message"
                      />
                    </div>
                  )}

                  {/* Menú de mensaje propio */}
                  {isMenuOpen && isMe && !msg.deleted && (
                    <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('¿Eliminar mensaje?')) deleteMessage(msg.id)
                          setMenuMsgId(null)
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-sticker-missing hover:bg-sticker-missing/10 w-full"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Picker de emojis */}
      {showEmojis && (
        <div className="bg-card border-t border-border px-4 py-3">
          <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="w-8 h-8 hover:bg-muted rounded text-lg flex items-center justify-center transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-card border-t border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showEmojis ? 'bg-gold/20 text-gold' : 'hover:bg-muted text-muted-foreground'
            )}
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Adjuntar imagen"
          >
            {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={inputRef}
            type="text"
            value={draftText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Escribe un mensaje… (tip: menciona MEX-15)"
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
          <button
            onClick={handleSend}
            disabled={!draftText.trim()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              draftText.trim()
                ? 'bg-gold text-background hover:bg-gold/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preview de imagen antes de enviar */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-gold">Enviar imagen</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 hover:bg-muted rounded-lg"
                disabled={uploadingImage}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden mb-3 bg-muted/40">
              <img src={previewImage} alt="Preview" className="w-full max-h-[400px] object-contain" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewImage(null)}
                disabled={uploadingImage}
                className="px-4 py-2.5 bg-muted hover:bg-muted/70 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendImage}
                disabled={uploadingImage}
                className={cn(
                  'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5',
                  uploadingImage
                    ? 'bg-muted text-muted-foreground cursor-wait'
                    : 'bg-gold text-background hover:bg-gold/90'
                )}
              >
                {uploadingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Renderiza el texto del mensaje, detectando menciones de estampas ───
function MessageContent({ text, myAlbum, isMe }: { text: string; myAlbum: any; isMe: boolean }) {
  // Reset regex state for each call
  STICKER_MENTION_REGEX.lastIndex = 0

  const parts: { type: 'text' | 'mention'; content: string; sectionCode?: string; num?: string }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = STICKER_MENTION_REGEX.exec(text)) !== null) {
    const [full, code, num] = match
    // Validate that the section code exists in our album
    const sectionExists = ALBUM_SECTIONS.some(s => s.code === code)
    if (!sectionExists) continue

    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'mention', content: full, sectionCode: code, num })
    lastIndex = match.index + full.length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  if (parts.length === 0) return <>{text}</>

  return (
    <>
      {parts.map((p, i) => {
        if (p.type === 'text') return <span key={i}>{p.content}</span>
        // Mention badge
        const myState = myAlbum?.[p.sectionCode!]?.[p.num!]
        const state = myState?.state || 'unmarked'
        const stateColor =
          state === 'has' ? (isMe ? 'bg-background/20' : 'bg-sticker-has/20 text-sticker-has') :
          state === 'repeated' ? (isMe ? 'bg-background/20' : 'bg-sticker-repeated/20 text-sticker-repeated') :
          state === 'missing' ? (isMe ? 'bg-background/20' : 'bg-sticker-missing/20 text-sticker-missing') :
          (isMe ? 'bg-background/20' : 'bg-muted-foreground/20')
        const indicator =
          state === 'has' ? '✓' :
          state === 'repeated' ? `×${myState.count}` :
          state === 'missing' ? '✗' : '?'
        return (
          <span
            key={i}
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded font-mono text-xs font-bold',
              stateColor
            )}
            title={`Tu estado: ${state}`}
          >
            {p.content}
            <span className="opacity-70 text-[10px]">{indicator}</span>
          </span>
        )
      })}
    </>
  )
}
