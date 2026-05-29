import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react'
import { streamChat, type ChatMessage } from '../services/aiService'
import { Markdown } from './Markdown'

interface ChatBoxProps {
  context?: string
  userName?: string | null
}

export function ChatBox({ context, userName }: ChatBoxProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: userName
        ? `Chào ${userName}! 🚀 Tôi là Trợ Lý Không Gian. Hỏi tôi bất cứ điều gì về toán học hoặc chiến lược chinh phục các hành tinh nhé!`
        : 'Chào chỉ huy! 🚀 Tôi là Trợ Lý Không Gian. Hỏi tôi bất cứ điều gì về toán học hoặc chiến lược chinh phục các hành tinh nhé!',
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  const controllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentAtRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingText, open])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming) return

      controllerRef.current?.abort()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      const history: ChatMessage[] = context
        ? [{ role: 'system', content: context }, ...messages, userMsg]
        : [...messages, userMsg]
      const visibleHistory = [...messages, userMsg]

      setMessages(visibleHistory)
      setInput('')
      setStreamingText('')

      const sinceLast = Date.now() - lastSentAtRef.current
      const cooldown = 1500
      const wait = Math.max(300, cooldown - sinceLast)

      debounceTimerRef.current = setTimeout(async () => {
        debounceTimerRef.current = null
        const controller = new AbortController()
        controllerRef.current = controller
        lastSentAtRef.current = Date.now()
        if (mountedRef.current) setStreaming(true)

        let acc = ''
        try {
          for await (const chunk of streamChat({ messages: history, userName }, controller.signal)) {
            if (controller.signal.aborted || !mountedRef.current) return
            acc += chunk
            setStreamingText(acc)
          }
          if (!controller.signal.aborted && mountedRef.current) {
            setMessages(prev => [...prev, { role: 'assistant', content: acc }])
            setStreamingText('')
          }
        } catch (e) {
          if (controller.signal.aborted || !mountedRef.current) return
          const err = e instanceof Error ? e : new Error(String(e))
          if (err.name === 'AbortError' || err.name === 'AIAbortError') return
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: `⚠️ Lỗi AI: ${err.message}` },
          ])
          setStreamingText('')
        } finally {
          if (controllerRef.current === controller) controllerRef.current = null
          if (mountedRef.current && !controller.signal.aborted) setStreaming(false)
        }
      }, wait)
    },
    [messages, streaming, context, userName]
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleStop() {
    controllerRef.current?.abort()
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (streamingText) {
      setMessages(prev => [...prev, { role: 'assistant', content: streamingText + ' [đã dừng]' }])
    }
    setStreamingText('')
    setStreaming(false)
  }

  function handleClear() {
    controllerRef.current?.abort()
    setMessages([
      {
        role: 'assistant',
        content: 'Đã làm mới phi vụ. Hỏi tôi điều gì đó về toán học nhé! 🛰️',
      },
    ])
    setStreamingText('')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 border-2 border-cyan-400/60 shadow-2xl shadow-purple-900/60 hover:scale-110 transition flex items-center justify-center text-2xl"
        title="Mở Chat AI"
      >
        💬
      </button>
    )
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(520px,calc(100vh-12rem))] flex flex-col bg-transparent border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-950/80 backdrop-blur-md">
      <div className="flex items-center justify-between p-3 border-b border-purple-900/60 bg-gradient-to-r from-purple-950/60 to-cyan-950/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-purple-900/80 border border-purple-500/40 flex items-center justify-center text-base">
            🤖
          </span>
          <div>
            <p className="text-xs font-bold text-cyan-300 tracking-wide">TRỢ LÝ KHÔNG GIAN</p>
            <p className="text-[9px] text-slate-400">
              {streaming ? 'đang trả lời...' : 'sẵn sàng giúp đỡ'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="text-[10px] text-slate-400 hover:text-cyan-300 px-2 py-1 transition"
            title="Làm mới hội thoại"
          >
            ↻
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-red-400 w-6 h-6 flex items-center justify-center transition"
            title="Đóng"
          >
            ✕
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {streaming && (
          <MessageBubble
            role="assistant"
            content={streamingText}
            streaming
          />
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-2 border-t border-purple-900/60 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Hỏi điều gì đó về toán..."
          disabled={streaming}
          className="flex-1 bg-slate-900 border border-purple-700/60 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
        />
        {streaming ? (
          <button
            type="button"
            onClick={handleStop}
            className="bg-red-700 border border-red-500 rounded-lg px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-600 transition"
          >
            ◼
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-gradient-to-br from-purple-700 to-cyan-700 border border-cyan-500/60 rounded-lg px-3 py-2 text-xs font-bold text-white hover:scale-105 transition disabled:opacity-40 disabled:hover:scale-100"
          >
            ▶
          </button>
        )}
      </form>
    </div>
  )
}

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  streaming?: boolean
}

function MessageBubble({ role, content, streaming }: MessageBubbleProps) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-cyan-700 to-cyan-800 text-cyan-50 rounded-br-sm whitespace-pre-wrap'
            : 'bg-slate-800/90 border border-purple-900/60 text-slate-200 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          content || (streaming && '...')
        ) : content ? (
          <Markdown>{content}</Markdown>
        ) : (
          streaming && '...'
        )}
        {streaming && content && (
          <span className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 animate-pulse align-middle" />
        )}
      </div>
    </div>
  )
}
