export interface BankEntry {
  q: string
  a: string[]
  c: number
  explain: string
  topic: string
  difficulty: number
  createdAt: number
}

const KEY = 'galaxylearn-question-bank-v1'
const VERSION = 1

interface BankShape {
  version: number
  byTopic: Record<string, BankEntry[]>
}

function emptyBank(): BankShape {
  return { version: VERSION, byTopic: {} }
}

function load(): BankShape {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyBank()
    const parsed = JSON.parse(raw) as Partial<BankShape>
    if (parsed?.version === VERSION && parsed.byTopic && typeof parsed.byTopic === 'object') {
      return { version: VERSION, byTopic: parsed.byTopic }
    }
  } catch {
    /* ignore */
  }
  return emptyBank()
}

function save(b: BankShape) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b))
  } catch {
    /* ignore quota */
  }
}

function normalize(q: string): string {
  return q.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function getAllBank(): Record<string, BankEntry[]> {
  return load().byTopic
}

export function getBankByTopic(topic: string): BankEntry[] {
  return load().byTopic[topic] ?? []
}

/**
 * Insert a new entry. Returns true if added, false if duplicate (by question text).
 */
export function addToBank(entry: BankEntry): boolean {
  const bank = load()
  const list = bank.byTopic[entry.topic] ?? []
  const norm = normalize(entry.q)
  if (list.some(e => normalize(e.q) === norm)) return false
  bank.byTopic[entry.topic] = [...list, entry]
  save(bank)
  return true
}

export function clearBankTopic(topic: string) {
  const bank = load()
  if (bank.byTopic[topic]) {
    delete bank.byTopic[topic]
    save(bank)
  }
}

export function clearAllBank() {
  save(emptyBank())
}

export interface BankStats {
  topics: number
  total: number
  byTopic: Record<string, number>
}

export function bankStats(): BankStats {
  const bank = load()
  const byTopic: Record<string, number> = {}
  let total = 0
  for (const [topic, list] of Object.entries(bank.byTopic)) {
    byTopic[topic] = list.length
    total += list.length
  }
  return { topics: Object.keys(byTopic).length, total, byTopic }
}
