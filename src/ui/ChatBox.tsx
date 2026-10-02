import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { useMultiplayerStore } from '@/stores/useMultiplayerStore'

export function ChatBox(): JSX.Element {
  const [inputText, setInputText] = useState('')
  const messages = useMultiplayerStore((s) => s.messages)
  const isChatOpen = useMultiplayerStore((s) => s.isChatOpen)
  const setChatOpen = useMultiplayerStore((s) => s.setChatOpen)
  const sendChatMessage = useMultiplayerStore((s) => s.sendChatMessage)
  const myId = useMultiplayerStore((s) => s.myId)
  const multiplayerStatus = useMultiplayerStore((s) => s.status)

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isChatOpen])

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isChatOpen])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (trimmed) {
      sendChatMessage(trimmed)
      setInputText('')
      // Keep focused for rapid chatting
      inputRef.current?.focus()
    } else {
      // Empty enter closes chat
      setChatOpen(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setChatOpen(false)
    }
  }

  // Format timestamp (HH:mm)
  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed right-4 top-20 bottom-36 w-80 sm:w-96 flex flex-col justify-end z-20 pointer-events-none select-none">
      <div
        className={`chat-container pointer-events-auto flex flex-col rounded-2xl transition-all duration-300 ${
          isChatOpen
            ? 'bg-black/80 backdrop-blur-lg border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-3'
            : 'bg-black/35 backdrop-blur-sm border border-white/10 hover:bg-black/50 p-2.5'
        }`}
      >
        {/* ── Chat Header (when open) ─────────────────────────── */}
        {isChatOpen ? (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-white">
            <div className="flex items-center gap-2">
              <span className="text-base">💬</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                Kênh Chat Trực Tuyến
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  multiplayerStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
                title={multiplayerStatus === 'CONNECTED' ? 'Đã kết nối' : 'Chơi đơn'}
              />
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/25 active:scale-95 text-white/70 hover:text-white transition-all cursor-pointer"
              title="Đóng chat (Esc)"
            >
              ESC ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-1.5 mb-1 text-[11px] text-white/60">
            <div className="flex items-center gap-1.5">
              <span>💬</span>
              <span className="font-semibold text-white/80">Kênh Chat (30 gần nhất)</span>
            </div>
            <button
              onClick={() => setChatOpen(true)}
              className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[10px] font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              [Enter] Chat
            </button>
          </div>
        )}

        {/* ── Messages List (max 30 messages) ──────────────────── */}
        <div
          ref={scrollRef}
          className={`space-y-1.5 overflow-y-auto overscroll-contain transition-all pr-1 text-xs ${
            isChatOpen ? 'max-h-64 sm:max-h-72 min-h-36' : 'max-h-44'
          }`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) transparent',
          }}
        >
          {messages.length === 0 ? (
            <div className="text-[11px] text-white/40 italic py-2 text-center">
              Chưa có tin nhắn nào...
            </div>
          ) : (
            messages.map((m) => {
              const isSelf = m.isSelf || (myId && m.senderId === myId)
              const isBot = m.senderId === 'bot-mingsensei'
              const isSystem = m.isSystem || m.senderId === 'system'

              if (isSystem) {
                return (
                  <div
                    key={m.id}
                    className="px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] flex items-start gap-1.5 leading-relaxed"
                  >
                    <span className="opacity-75">🐾</span>
                    <span className="flex-1 font-medium">{m.text}</span>
                    <span className="text-[9px] text-amber-300/50 font-mono self-end">
                      {formatTime(m.timestamp)}
                    </span>
                  </div>
                )
              }

              return (
                <div
                  key={m.id}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] break-words transition-all ${
                    isSelf
                      ? 'bg-amber-400/15 border-amber-400/30 text-white ml-2'
                      : isBot
                      ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-100 mr-2'
                      : 'bg-white/10 border-white/15 text-white/90 mr-2'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className={`font-bold text-[10px] ${
                        isSelf
                          ? 'text-amber-300'
                          : isBot
                          ? 'text-emerald-300 flex items-center gap-1'
                          : 'text-sky-300'
                      }`}
                    >
                      {isBot && '🤖'} {m.senderName} {isSelf && '(Bạn)'}
                    </span>
                    <span className="text-[9px] text-white/40 font-mono">{formatTime(m.timestamp)}</span>
                  </div>
                  <div className="leading-snug text-white/90 select-text">{m.text}</div>
                </div>
              )
            })
          )}
        </div>

        {/* ── Input Bar (when open) ───────────────────────────── */}
        {isChatOpen ? (
          <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={150}
              placeholder="Nhập tin nhắn... (Enter gửi, Esc đóng)"
              className="flex-1 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/40 outline-none transition-all"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center"
              title="Gửi tin nhắn"
            >
              Gửi
            </button>
          </form>
        ) : (
          <div
            onClick={() => setChatOpen(true)}
            className="mt-1.5 py-1 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/50 flex items-center justify-between cursor-pointer transition-all"
          >
            <span>Nhấn [Enter] để mở ô chat...</span>
            <span className="font-mono text-amber-300/80">↵</span>
          </div>
        )}
      </div>
    </div>
  )
}
