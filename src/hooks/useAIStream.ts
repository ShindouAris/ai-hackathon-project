import { useCallback, useEffect, useRef, useState } from 'react'

type StreamFn<TReq> = (req: TReq, signal?: AbortSignal) => AsyncGenerator<string>

interface UseAIStreamOptions {
  /** Delay (ms) trước khi gọi API. Lần `run` mới trong khoảng debounce sẽ huỷ lần trước. Default: 350. */
  debounceMs?: number
  /** Khoảng cooldown tối thiểu giữa 2 lần gọi thực tế (ms). Default: 0. */
  cooldownMs?: number
}

interface UseAIStreamResult<TReq> {
  text: string
  isStreaming: boolean
  isPending: boolean
  error: Error | null
  run: (req: TReq) => void
  reset: () => void
  stop: () => void
}

export function useAIStream<TReq>(
  streamFn: StreamFn<TReq>,
  { debounceMs = 350, cooldownMs = 0 }: UseAIStreamOptions = {}
): UseAIStreamResult<TReq> {
  const [text, setText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const controllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFiredAtRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const cancelInFlight = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  const reset = useCallback(() => {
    cancelInFlight()
    setText('')
    setError(null)
    setIsStreaming(false)
    setIsPending(false)
  }, [cancelInFlight])

  const stop = useCallback(() => {
    cancelInFlight()
    setIsStreaming(false)
    setIsPending(false)
  }, [cancelInFlight])

  const fire = useCallback(
    async (req: TReq) => {
      const controller = new AbortController()
      controllerRef.current = controller
      lastFiredAtRef.current = Date.now()

      if (mountedRef.current) {
        setText('')
        setError(null)
        setIsPending(false)
        setIsStreaming(true)
      }

      try {
        for await (const chunk of streamFn(req, controller.signal)) {
          if (controller.signal.aborted || !mountedRef.current) return
          setText(prev => prev + chunk)
        }
      } catch (e) {
        if (controller.signal.aborted || !mountedRef.current) return
        const err = e instanceof Error ? e : new Error(String(e))
        if (err.name === 'AbortError' || err.name === 'AIAbortError') return
        setError(err)
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
        if (mountedRef.current && !controller.signal.aborted) setIsStreaming(false)
      }
    },
    [streamFn]
  )

  const run = useCallback(
    (req: TReq) => {
      cancelInFlight()
      setError(null)
      setIsPending(true)

      const sinceLast = Date.now() - lastFiredAtRef.current
      const remainingCooldown = cooldownMs > 0 ? Math.max(0, cooldownMs - sinceLast) : 0
      const wait = Math.max(debounceMs, remainingCooldown)

      if (wait <= 0) {
        void fire(req)
      } else {
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null
          void fire(req)
        }, wait)
      }
    },
    [cancelInFlight, fire, debounceMs, cooldownMs]
  )

  return { text, isStreaming, isPending, error, run, reset, stop }
}
