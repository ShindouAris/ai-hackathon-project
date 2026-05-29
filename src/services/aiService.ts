export interface GeneratedQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface QuestionRequest {
  topic: string
  difficulty: number
  avoid?: string[]
}

export interface ExplainRequest {
  question: string
  options: string[]
  correctIndex: number
  userAnswerIndex?: number | null
}

export interface HintRequest extends ExplainRequest {
  attempt?: number
}

const API_BASE = '/api/ai'

export class AIAbortError extends Error {
  constructor() {
    super('AI request aborted')
    this.name = 'AIAbortError'
  }
}

export async function generateQuestion(
  req: QuestionRequest,
  signal?: AbortSignal
): Promise<GeneratedQuestion> {
  const res = await fetch(`${API_BASE}/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  })
  if (!res.ok) {
    if (res.status === 429) throw new Error('Đã chạm giới hạn AI (429). Thử lại sau ít phút.')
    throw new Error(`Generate question failed: ${res.status}`)
  }
  return res.json()
}

export async function* streamExplain(
  req: ExplainRequest,
  signal?: AbortSignal
): AsyncGenerator<string> {
  yield* streamPost(`${API_BASE}/explain`, req, signal)
}

export async function* streamHint(
  req: HintRequest,
  signal?: AbortSignal
): AsyncGenerator<string> {
  yield* streamPost(`${API_BASE}/hint`, req, signal)
}

async function* streamPost(
  url: string,
  body: unknown,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok || !res.body) {
    if (res.status === 429) throw new Error('Đã chạm giới hạn AI (429). Thử lại sau ít phút.')
    throw new Error(`Stream failed: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  const onAbort = () => { reader.cancel().catch(() => {}) }
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    while (true) {
      if (signal?.aborted) throw new AIAbortError()
      const { value, done } = await reader.read()
      if (done) break
      if (value) yield decoder.decode(value, { stream: true })
    }
    const tail = decoder.decode()
    if (tail) yield tail
  } finally {
    signal?.removeEventListener('abort', onAbort)
    try { reader.releaseLock() } catch { /* already released */ }
  }
}
