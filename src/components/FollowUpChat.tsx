import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react'
import { streamChat, type ChatMessage } from '../services/aiService'
import { Markdown } from './Markdown'
import { useAutoScroll } from '../hooks/useAutoScroll'

interface FollowUpChatProps {
  /** Câu hỏi gốc đang giải thích. */
  question: string
  options: string[]
  correctIndex: number
  /** Đáp án người học chọn (nếu có). */
  userAnswerIndex?: number | null
  /** Tóm tắt giải thích AI vừa stream xong (gửi kèm để model hiểu ngữ cảnh). */
  baseExplanation?: string
  /** Reset history khi key đổi (vd: chuyển câu). */
  resetKey?: string | number
}

export function FollowUpChat({
  question,
  options,
  correctIndex,
  userAnswerIndex,
  baseExplanation,
  resetKey,
}: FollowUpChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  const controllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentAtRef = useRef(0)
  const mountedRef = useRef(true)

  const scrollRef = useAutoScroll<HTMLDivElement>(
    messages.length + streamingText.length,
    { active: open }
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  useEffect(() => {
    controllerRef.current?.abort()
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    setMessages([])
    setStreamingText('')
    setStreaming(false)
    setInput('')
    setOpen(false)
  }, [resetKey])

  const buildSystem = useCallback((): string => {
    const correctOpt = options[correctIndex]
    const userAnswer = userAnswerIndex != null ? options[userAnswerIndex] : null
    return `Bạn đang trả lời CÂU HỎI BỔ SUNG của người học, dựa trên một câu hỏi toán đang giải thích.

CÂU HỎI GỐC: ${question}
CÁC PHƯƠNG ÁN:
${options.map((o, i) => `  ${String.fromCharCode(65 + i)}. ${o}${i === correctIndex ? ' [ĐÚNG]' : ''}`).join('\n')}
ĐÁP ÁN ĐÚNG: ${correctOpt}
${userAnswer ? `NGƯỜI HỌC ĐÃ CHỌN: ${userAnswer}${userAnswerIndex === correctIndex ? ' (đúng)' : ' (sai)'}` : ''}
${baseExplanation ? `GIẢI THÍCH ĐÃ CUNG CẤP TRƯỚC ĐÓ:\n${baseExplanation}` : ''}

Yêu cầu:
- Trả lời thắc mắc cụ thể của người học, ngắn gọn 2-5 dòng.
- Bám sát câu hỏi gốc, đừng đi lạc đề.
- Nếu hỏi điều quá xa chủ đề, nhẹ nhàng kéo về.
- Có thể dùng markdown (in đậm, danh sách, công thức Unicode).`
  }, [question, options, correctIndex, userAnswerIndex, baseExplanation])

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming) return

      controllerRef.current?.abort()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      const visibleHistory = [...messages, userMsg]
      const requestHistory: ChatMessage[] = [
        { role: 'system', content: buildSystem() },
        ...visibleHistory,
      ]

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
          for await (const chunk of streamChat(
            { messages: requestHistory },
            controller.signal
          )) {
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
    [messages, streaming, buildSystem]
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    send(input)
  }

  function handleStop() {
    controllerRef.current?.abort()
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    if (streamingText) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: streamingText + ' [đã dừng]' },
      ])
    }
    setStreamingText('')
    setStreaming(false)
  }

  function handleClear() {
    controllerRef.current?.abort()
    setMessages([])
    setStreamingText('')
  }

  return (
    <div className="mt-3 border-t border-slate-700/60 pt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/60 border border-purple-500/40 text-[11px] font-bold text-purple-200 hover:bg-purple-900/40 hover:border-purple-400 transition"
        >
          ❓ Chưa hiểu? Hỏi thêm AI
        </button>
      ) : (
        <div className="rounded-lg border border-purple-500/40 bg-slate-950/60 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-purple-950/40 border-b border-purple-900/60">
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
              💬 Hỏi thêm về câu này
            </span>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 px-1.5 transition"
                  title="Xoá hội thoại"
                >
                  ↻
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-red-400 w-5 h-5 flex items-center justify-center transition text-xs"
                title="Đóng"
              >
                ✕
              </button>
            </div>
          </div>

          {(messages.length > 0 || streaming) && (
            <div
              ref={scrollRef}
              className="ai-stream-scroll max-h-44 md:max-h-52 overflow-y-auto p-2 space-y-2 text-xs"
            >
              {messages.map((m, i) => (
                <FollowUpBubble key={i} role={m.role} content={m.content} />
              ))}
              {streaming && (
                <FollowUpBubble role="assistant" content={streamingText} streaming />
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-1.5 p-2 border-t border-purple-900/60">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="VD: Tại sao lại ra công thức này?"
              disabled={streaming}
              className="flex-1 bg-slate-900 border border-purple-700/60 rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            />
            {streaming ? (
              <button
                type="button"
                onClick={handleStop}
                className="bg-red-700 border border-red-500 rounded-md px-2.5 py-1.5 text-xs font-bold text-red-100 hover:bg-red-600 transition"
                title="Dừng"
              >
                ◼
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-gradient-to-br from-purple-700 to-cyan-700 border border-cyan-500/60 rounded-md px-3 py-1.5 text-xs font-bold text-white hover:scale-105 transition disabled:opacity-40 disabled:hover:scale-100"
                title="Gửi"
              >
                ▶
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

function FollowUpBubble({
  role,
  content,
  streaming,
}: {
  role: 'user' | 'assistant' | 'system'
  content: string
  streaming?: boolean
}) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] px-2.5 py-1.5 rounded-xl leading-relaxed text-[11px] ${
          isUser
            ? 'bg-cyan-800/80 text-cyan-50 rounded-br-sm whitespace-pre-wrap'
            : 'bg-slate-800/90 border border-purple-900/60 text-slate-200 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          content
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
