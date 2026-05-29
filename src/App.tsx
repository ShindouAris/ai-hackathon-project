import { useState, useRef, useEffect, useCallback } from 'react'
import { useAIStream } from './hooks/useAIStream'
import { streamExplain, streamHint, generateQuestion } from './services/aiService'

type PlanetName = 'Xác Suất' | 'Đại Số' | 'Hình Học' | 'Vi Tích Phân' | 'Ma Trận' | 'Số Phức' | 'Tổ Hợp' | 'Giải Tích'
type View = 'space' | 'info' | 'mission'

interface Task {
  q: string
  a: string[]
  c: number
  explain: string
}

const data: Record<PlanetName, Task[]> = {
  'Đại Số': [
    {
      q: 'Công thức tính định thức ma trận vuông cấp 2: det(A) là gì?',
      a: ['ad - bc', 'ab - cd', 'ac - bd'],
      c: 0,
      explain: 'Với ma trận A = [[a,b],[c,d]], định thức được tính theo quy tắc nhân chéo: lấy tích đường chéo chính (a·d) trừ đi tích đường chéo phụ (b·c).',
    },
    {
      q: 'Phương trình bậc hai ax² + bx + c = 0 có nghiệm khi nào?',
      a: ['Δ = b² - 4ac ≥ 0', 'Δ = b² + 4ac ≥ 0', 'a > 0', 'b ≠ 0'],
      c: 0,
      explain: 'Biệt thức Δ = b² - 4ac quyết định số nghiệm: Δ > 0 có 2 nghiệm phân biệt, Δ = 0 có nghiệm kép, Δ < 0 vô nghiệm thực.',
    },
    {
      q: 'Tổng hai nghiệm của phương trình ax² + bx + c = 0 (theo Viète) bằng?',
      a: ['-b/a', 'b/a', 'c/a', '-c/a'],
      c: 0,
      explain: 'Định lý Viète: nếu x₁, x₂ là hai nghiệm thì x₁ + x₂ = -b/a và x₁·x₂ = c/a.',
    },
  ],
  'Hình Học': [
    {
      q: 'Trong không gian Oxyz, hai vector chỉ phương vuông góc với nhau thì tích vô hướng bằng bao nhiêu?',
      a: ['Bằng 0', 'Bằng 1', 'Bằng -1'],
      c: 0,
      explain: 'Tích vô hướng u·v = |u||v|cos(θ). Khi vuông góc thì θ = 90°, cos(90°) = 0, nên tích vô hướng = 0.',
    },
    {
      q: 'Diện tích hình tròn bán kính r là?',
      a: ['πr²', '2πr', 'πr', '2r²'],
      c: 0,
      explain: 'Diện tích hình tròn S = πr². Còn 2πr là chu vi, đừng nhầm lẫn nhé!',
    },
    {
      q: 'Tổng ba góc trong một tam giác bằng bao nhiêu độ?',
      a: ['180°', '90°', '360°', '270°'],
      c: 0,
      explain: 'Đây là một định lý cơ bản của hình học Euclid: tổng ba góc trong bất kỳ tam giác nào luôn bằng 180° (hay π radian).',
    },
  ],
  'Xác Suất': [
    {
      q: 'Bài toán Xác suất: Lô thứ 2 là chính, có 2 sản phẩm chứa 1 phế phẩm. Vậy tỷ lệ phế phẩm lô thứ 1 là bao nhiêu nếu áp dụng định lý Bayes?',
      a: [
        'Lô thứ 2 chính chứa 1 phế thì phế phẩm còn lại chắc chắn thuộc lô 1',
        'Tỷ lệ ngẫu nhiên 50/50',
        'Không đủ điều kiện logic toán học',
      ],
      c: 0,
      explain: 'Định lý Bayes cập nhật xác suất dựa trên thông tin mới. Khi đã biết lô 2 chứa 1 phế, phế phẩm còn lại phải thuộc lô 1 (suy luận có điều kiện).',
    },
    {
      q: 'Xác suất của biến cố chắc chắn bằng?',
      a: ['1', '0', '0.5', '∞'],
      c: 0,
      explain: 'Biến cố chắc chắn xảy ra có xác suất P = 1 (100%). Biến cố không thể xảy ra có P = 0. Mọi xác suất khác nằm trong [0, 1].',
    },
    {
      q: 'Hai biến cố A và B độc lập thì P(A∩B) bằng?',
      a: ['P(A) × P(B)', 'P(A) + P(B)', 'P(A) - P(B)', 'P(A) / P(B)'],
      c: 0,
      explain: 'Định nghĩa biến cố độc lập: việc xảy ra của A không ảnh hưởng đến B, do đó xác suất cả hai cùng xảy ra bằng tích xác suất của từng biến cố.',
    },
  ],
  'Vi Tích Phân': [
    {
      q: 'Đạo hàm của hàm số f(x) = x³ là gì?',
      a: ['3x²', 'x²', '3x', '2x³'],
      c: 0,
      explain: 'Quy tắc lũy thừa: (xⁿ)\' = n·xⁿ⁻¹. Áp dụng với n=3: (x³)\' = 3·x² = 3x².',
    },
    {
      q: 'Đạo hàm của sin(x) là?',
      a: ['cos(x)', '-cos(x)', '-sin(x)', 'tan(x)'],
      c: 0,
      explain: 'Đây là một công thức đạo hàm cơ bản: (sin x)\' = cos x. Nhớ thêm: (cos x)\' = -sin x.',
    },
    {
      q: 'Đạo hàm của hằng số bằng?',
      a: ['0', '1', 'Hằng số đó', 'Không xác định'],
      c: 0,
      explain: 'Hằng số không thay đổi theo biến, nên tốc độ thay đổi (đạo hàm) bằng 0. Ví dụ: (5)\' = 0, (π)\' = 0.',
    },
  ],
  'Ma Trận': [
    {
      q: 'Ma trận đơn vị I có tính chất gì khi nhân với ma trận A?',
      a: ['A·I = I·A = A', 'A·I = 0', 'A·I = I', 'A·I = A²'],
      c: 0,
      explain: 'Ma trận đơn vị I đóng vai trò như số 1 trong phép nhân ma trận: nhân với bất kỳ ma trận A nào (cùng cấp tương thích) đều cho lại chính A.',
    },
    {
      q: 'Ma trận chuyển vị của ma trận A ký hiệu là?',
      a: ['Aᵀ', 'A⁻¹', '|A|', 'A*'],
      c: 0,
      explain: 'Aᵀ (A transpose) là ma trận đổi dòng thành cột. A⁻¹ là ma trận nghịch đảo, |A| là định thức — đừng nhầm các ký hiệu này.',
    },
    {
      q: 'Ma trận có định thức bằng 0 được gọi là?',
      a: ['Ma trận suy biến', 'Ma trận đơn vị', 'Ma trận vuông', 'Ma trận chuyển vị'],
      c: 0,
      explain: 'Ma trận suy biến (singular matrix) là ma trận có det = 0, đồng nghĩa với việc nó không khả nghịch — không có ma trận nghịch đảo.',
    },
  ],
  'Số Phức': [
    {
      q: 'Số phức z = a + bi có môđun là gì?',
      a: ['√(a² + b²)', 'a + b', 'a² + b²', '√(a - b)'],
      c: 0,
      explain: 'Môđun |z| là khoảng cách từ z đến gốc tọa độ trong mặt phẳng phức. Áp dụng định lý Pythagoras: |z| = √(a² + b²).',
    },
    {
      q: 'i² bằng bao nhiêu?',
      a: ['-1', '1', '0', 'i'],
      c: 0,
      explain: 'i là đơn vị ảo, được định nghĩa sao cho i² = -1. Đây là nền tảng của toàn bộ lý thuyết số phức.',
    },
    {
      q: 'Số phức liên hợp của z = a + bi là?',
      a: ['a - bi', '-a + bi', '-a - bi', 'b + ai'],
      c: 0,
      explain: 'Số phức liên hợp z̄ giữ nguyên phần thực, đổi dấu phần ảo. Tính chất: z·z̄ = a² + b² = |z|².',
    },
  ],
  'Tổ Hợp': [
    {
      q: 'Công thức tổ hợp chập k của n phần tử C(n,k) bằng gì?',
      a: ['n! / (k!(n-k)!)', 'n! / k!', 'n × k', '(n-k)! / k!'],
      c: 0,
      explain: 'C(n,k) đếm số cách chọn k phần tử từ n phần tử (không quan tâm thứ tự). Công thức: n! / (k!(n-k)!).',
    },
    {
      q: 'Số chỉnh hợp chập k của n phần tử A(n,k) bằng?',
      a: ['n! / (n-k)!', 'n! / k!', 'n! / (k!(n-k)!)', 'n × k'],
      c: 0,
      explain: 'Chỉnh hợp A(n,k) đếm số cách chọn k phần tử từ n và sắp thứ tự. Công thức: n!/(n-k)! = n×(n-1)×...×(n-k+1).',
    },
    {
      q: 'Số hoán vị của n phần tử bằng?',
      a: ['n!', 'n²', '2ⁿ', 'n × (n-1)'],
      c: 0,
      explain: 'Hoán vị P(n) = n! = 1×2×3×...×n. Đó là số cách sắp xếp toàn bộ n phần tử khác nhau theo thứ tự.',
    },
  ],
  'Giải Tích': [
    {
      q: 'Tích phân ∫x dx bằng gì?',
      a: ['x²/2 + C', 'x² + C', '2x + C', 'x/2 + C'],
      c: 0,
      explain: 'Quy tắc nguyên hàm lũy thừa: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C. Áp dụng với n=1: ∫x dx = x²/2 + C.',
    },
    {
      q: 'Tích phân ∫cos(x) dx bằng?',
      a: ['sin(x) + C', '-sin(x) + C', 'cos(x) + C', '-cos(x) + C'],
      c: 0,
      explain: 'Vì (sin x)\' = cos x, nên nguyên hàm của cos x là sin x + C. Cẩn thận: ∫sin x dx = -cos x + C (có dấu trừ).',
    },
    {
      q: 'lim(x→0) sin(x)/x bằng?',
      a: ['1', '0', '∞', 'Không xác định'],
      c: 0,
      explain: 'Đây là giới hạn lượng giác kinh điển, có giá trị bằng 1. Nó là nền tảng để chứng minh đạo hàm của sin và cos.',
    },
  ],
}

interface PlanetConfig {
  name: PlanetName
  glowClass: string
  type: 'video' | 'div'
  label: string
  labelColor: string
  emoji: string
  difficulty: number
  color: string
  x: number
  description: string
  topics: string[]
}

const planets: PlanetConfig[] = [
  {
    name: 'Giải Tích', glowClass: 'glow-giaitic', type: 'div', label: 'GIẢI TÍCH',
    labelColor: 'text-pink-400', emoji: '∫', difficulty: 8, color: '#ec4899', x: 50,
    description: 'Hành tinh sâu thẳm của vũ trụ toán học. Nơi nguyên hàm và tích phân vẽ nên dòng chảy của thay đổi liên tục.',
    topics: ['Nguyên hàm & Tích phân', 'Giới hạn nâng cao', 'Chuỗi Taylor', 'Phương trình vi phân'],
  },
  {
    name: 'Số Phức', glowClass: 'glow-sophuc', type: 'div', label: 'SỐ PHỨC',
    labelColor: 'text-violet-400', emoji: 'ℂ', difficulty: 7, color: '#8b5cf6', x: 25,
    description: 'Vùng không gian nơi i² = -1. Mở rộng số thực sang mặt phẳng phức, mở khóa kỹ thuật điện và lượng tử.',
    topics: ['Đơn vị ảo i', 'Môđun & argument', 'Liên hợp', 'Công thức Euler'],
  },
  {
    name: 'Tổ Hợp', glowClass: 'glow-tohop', type: 'div', label: 'TỔ HỢP',
    labelColor: 'text-orange-400', emoji: 'Cₙ', difficulty: 6, color: '#f97316', x: 70,
    description: 'Hành tinh đếm các khả năng. Hoán vị, chỉnh hợp, tổ hợp — nền tảng của xác suất và mật mã học.',
    topics: ['Hoán vị', 'Chỉnh hợp', 'Tổ hợp', 'Tam giác Pascal'],
  },
  {
    name: 'Ma Trận', glowClass: 'glow-matran', type: 'div', label: 'MA TRẬN',
    labelColor: 'text-yellow-400', emoji: '⊞', difficulty: 5, color: '#eab308', x: 35,
    description: 'Vùng đất của các bảng số chiều cao. Ma trận điều khiển đồ họa 3D, AI, và mọi phép biến đổi tuyến tính.',
    topics: ['Phép nhân ma trận', 'Định thức', 'Ma trận nghịch đảo', 'Hệ phương trình tuyến tính'],
  },
  {
    name: 'Vi Tích Phân', glowClass: 'glow-vitichphan', type: 'div', label: 'VI TÍCH PHÂN',
    labelColor: 'text-lime-400', emoji: 'δ', difficulty: 4, color: '#84cc16', x: 75,
    description: 'Cánh cổng vào thế giới của tốc độ thay đổi. Đạo hàm cho biết hàm thay đổi nhanh ra sao tại mỗi điểm.',
    topics: ['Đạo hàm cơ bản', 'Quy tắc chuỗi', 'Đạo hàm hàm lượng giác', 'Ứng dụng đạo hàm'],
  },
  {
    name: 'Xác Suất', glowClass: 'saturn-glow', type: 'video', label: 'XÁC SUẤT',
    labelColor: 'text-amber-400', emoji: '📊', difficulty: 3, color: '#f59e0b', x: 30,
    description: 'Hành tinh của sự ngẫu nhiên có thể đo lường. Từ tung xúc xắc tới định lý Bayes và học máy hiện đại.',
    topics: ['Không gian mẫu', 'Biến cố độc lập', 'Định lý Bayes', 'Phân phối xác suất'],
  },
  {
    name: 'Hình Học', glowClass: 'geometry-glow', type: 'div', label: 'HÌNH HỌC',
    labelColor: 'text-emerald-400', emoji: '📐', difficulty: 2, color: '#10b981', x: 65,
    description: 'Vùng đất xanh ngắt của điểm, đường, mặt phẳng. Khám phá tam giác, đường tròn và không gian Oxyz.',
    topics: ['Tam giác', 'Đường tròn', 'Vector', 'Không gian Oxyz'],
  },
  {
    name: 'Đại Số', glowClass: 'algebra-glow', type: 'div', label: 'ĐẠI SỐ',
    labelColor: 'text-red-400', emoji: '🪐', difficulty: 1, color: '#ef4444', x: 30,
    description: 'Hành tinh khởi đầu của mọi hành trình toán học. Phương trình bậc hai, định lý Viète, định thức 2×2.',
    topics: ['Phương trình bậc hai', 'Định lý Viète', 'Định thức 2×2', 'Hệ phương trình'],
  },
]

const STAMINA_MAX = 180
const REGEN_INTERVAL_MS = 1 * 60 * 1000
const REGEN_AMOUNT = 10
const BASE_COST = 15

function calcCost(fromIdx: number, toIdx: number): number {
  const dist = Math.abs(toIdx - fromIdx)
  return BASE_COST + dist * 12
}

const STORAGE_KEY = 'galaxylearn-state-v1'

interface PersistedState {
  currentPlanetIdx: number
  stamina: number
  zoom: number
  conqueredPlanets: string[]
  planetProgress: Record<string, number>
  lastRegenTime: number
}

function loadState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export default function App() {
  const saved = loadState()

  const [view, setView] = useState<View>('space')
  const [currentPlanet, setCurrentPlanet] = useState<PlanetConfig | null>(null)
  const [currentPlanetIdx, setCurrentPlanetIdx] = useState<number>(saved.currentPlanetIdx ?? planets.length)
  const [aiMessage, setAiMessage] = useState(
    'Chào chỉ huy! Hệ thống sẵn sàng. Trái Đất là điểm xuất phát — càng xa càng tốn thể lực. Chọn hành tinh để bắt đầu thám hiểm!'
  )
  const [warp, setWarp] = useState(false)
  const [answered, setAnswered] = useState<number | null>(null)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [stamina, setStamina] = useState(() => {
    if (saved.stamina == null || saved.lastRegenTime == null) return STAMINA_MAX
    const elapsed = Date.now() - saved.lastRegenTime
    const ticks = Math.floor(elapsed / REGEN_INTERVAL_MS)
    return Math.min(STAMINA_MAX, saved.stamina + ticks * REGEN_AMOUNT)
  })
  const [zoom, setZoom] = useState(saved.zoom ?? 1)
  const [conqueredPlanets, setConqueredPlanets] = useState<Set<string>>(
    new Set(saved.conqueredPlanets ?? [])
  )
  const [planetProgress, setPlanetProgress] = useState<Record<string, number>>(
    saved.planetProgress ?? {}
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const lastRegenTime = useRef(saved.lastRegenTime ?? Date.now())

  useEffect(() => {
    const data: PersistedState = {
      currentPlanetIdx,
      stamina,
      zoom,
      conqueredPlanets: Array.from(conqueredPlanets),
      planetProgress,
      lastRegenTime: lastRegenTime.current,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore quota errors
    }
  }, [currentPlanetIdx, stamina, zoom, conqueredPlanets, planetProgress])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastRegenTime.current
      if (elapsed >= REGEN_INTERVAL_MS) {
        const ticks = Math.floor(elapsed / REGEN_INTERVAL_MS)
        setStamina(s => {
          const next = Math.min(STAMINA_MAX, s + ticks * REGEN_AMOUNT)
          if (next !== s) {
            console.log(`[REGEN] +${next - s} PP (${s} → ${next}/${STAMINA_MAX}) | ticks=${ticks}`)
          }
          return next
        })
        lastRegenTime.current = now - (elapsed % REGEN_INTERVAL_MS)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const [, setNowTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNowTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const timeToNextRegen = Math.max(0, REGEN_INTERVAL_MS - (Date.now() - lastRegenTime.current))
  const regenSeconds = Math.ceil(timeToNextRegen / 1000)
  const regenMin = Math.floor(regenSeconds / 60)
  const regenSec = regenSeconds % 60

  useEffect(() => {
    if (view === 'space') {
      setAnswered(null)
      setQuestionIdx(0)
    }
  }, [view])

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [hintAttempt, setHintAttempt] = useState(0)
  const [generatingQuestion, setGeneratingQuestion] = useState(false)
  const [aiQuestions, setAiQuestions] = useState<Record<string, Task[]>>({})

  const explainAI = useAIStream(streamExplain, { debounceMs: 400, cooldownMs: 1500 })
  const hintAI = useAIStream(streamHint, { debounceMs: 400, cooldownMs: 2500 })
  const generateAbortRef = useRef<AbortController | null>(null)
  const generateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastGenerateAtRef = useRef(0)

  useEffect(() => {
    return () => {
      generateAbortRef.current?.abort()
      if (generateDebounceRef.current) clearTimeout(generateDebounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (view !== 'mission') {
      explainAI.reset()
      hintAI.reset()
      generateAbortRef.current?.abort()
      if (generateDebounceRef.current) {
        clearTimeout(generateDebounceRef.current)
        generateDebounceRef.current = null
      }
      setGeneratingQuestion(false)
    }
  }, [view, explainAI, hintAI])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      setZoom(z => Math.min(2, Math.max(0.4, z - e.deltaY * 0.001)))
    }
  }, [])

  function zoomIn() { setZoom(z => Math.min(2, z + 0.2)) }
  function zoomOut() { setZoom(z => Math.max(0.4, z - 0.2)) }

  function flyTo(planet: PlanetConfig, idx: number) {
    const tasks = data[planet.name]
    const savedProgress = planetProgress[planet.name] ?? 0
    const startQ = savedProgress >= tasks.length ? 0 : savedProgress

    if (idx === currentPlanetIdx) {
      setAiMessage(`📍 Bạn đang ở **${planet.label}**. Xem thông tin hành tinh.`)
      setQuestionIdx(startQ)
      setCurrentPlanet(planet)
      setView('info')
      return
    }

    const cost = calcCost(currentPlanetIdx, idx)
    if (stamina < cost) {
      setAiMessage(`⚠️ **KHÔNG ĐỦ THỂ LỰC!** Cần ${cost} PP để tới **${planet.label}** nhưng chỉ còn ${stamina} PP. Hãy nghỉ ngơi để hồi phục (10 PP / 5 phút)!`)
      return
    }
    setStamina(s => Math.max(0, s - cost))
    setAiMessage(`🚀 **KHAI HỎA!** Tiêu tốn ${cost} PP. Tên lửa đang phóng hướng **Hành tinh ${planet.label}**...`)
    setWarp(true)
    setCurrentPlanetIdx(idx)
    setQuestionIdx(startQ)
    setTimeout(() => {
      setWarp(false)
      setCurrentPlanet(planet)
      setView('info')
    }, 1800)
  }

  function startMission() {
    setAnswered(null)
    setView('mission')
  }

  function check(sel: number, cor: number) {
    setAnswered(sel)
    if (!currentPlanet || !task) return
    const tasks = getTasks(currentPlanet.name)
    const isLast = questionIdx >= tasks.length - 1
    if (sel === cor) {
      if (isLast) {
        setAiMessage(`🎉 **CHINH PHỤC!** Hoàn thành toàn bộ ${tasks.length} câu hỏi của hành tinh ${currentPlanet.label}!`)
        setConqueredPlanets(prev => new Set([...prev, currentPlanet.name]))
        setPlanetProgress(prev => ({ ...prev, [currentPlanet.name]: tasks.length }))
      } else {
        setAiMessage(`✅ **ĐÚNG!** Câu ${questionIdx + 1}/${tasks.length} hoàn thành. Tiếp tục câu kế tiếp!`)
        setPlanetProgress(prev => ({ ...prev, [currentPlanet.name]: questionIdx + 1 }))
      }
    } else {
      setAiMessage('⚠️ **HARD SPOT!** Trợ lý AI đang phân tích lỗi sai...')
    }
    hintAI.reset()
    setHintAttempt(0)
    explainAI.run({
      question: task.q,
      options: task.a,
      correctIndex: task.c,
      userAnswerIndex: sel,
    })
  }

  function requestHint() {
    if (!task) return
    const next = Math.min(hintAttempt + 1, 3)
    setHintAttempt(next)
    setAiMessage(`💡 **CỨU CÁNH MỨC ${next}** đang được khởi động...`)
    hintAI.run({
      question: task.q,
      options: task.a,
      correctIndex: task.c,
      userAnswerIndex: answered,
      attempt: next,
    })
  }

  async function handleGenerateAIQuestion() {
    if (!currentPlanet) return

    if (generateDebounceRef.current) {
      clearTimeout(generateDebounceRef.current)
      generateDebounceRef.current = null
    }
    generateAbortRef.current?.abort()

    const sinceLast = Date.now() - lastGenerateAtRef.current
    const cooldown = 4000
    const wait = Math.max(500, cooldown - sinceLast)

    setGeneratingQuestion(true)
    setAiMessage('🛰️ AI đang sinh câu hỏi mới từ vũ trụ toán học...')

    generateDebounceRef.current = setTimeout(async () => {
      generateDebounceRef.current = null
      const controller = new AbortController()
      generateAbortRef.current = controller
      lastGenerateAtRef.current = Date.now()

      const planet = currentPlanet
      try {
        const existing = getTasks(planet.name)
        const generated = await generateQuestion(
          {
            topic: planet.name,
            difficulty: planet.difficulty,
            avoid: existing.map(t => t.q),
          },
          controller.signal
        )
        if (controller.signal.aborted) return
        const newTask: Task = {
          q: generated.question,
          a: generated.options,
          c: generated.correctIndex,
          explain: generated.explanation,
        }
        setAiQuestions(prev => ({
          ...prev,
          [planet.name]: [...(prev[planet.name] ?? []), newTask],
        }))
        setQuestionIdx(existing.length)
        setAnswered(null)
        explainAI.reset()
        hintAI.reset()
        setHintAttempt(0)
        setAiMessage(`✨ **CÂU HỎI MỚI** từ AI đã sẵn sàng. Chinh phục thử thách bonus!`)
      } catch (e) {
        if (controller.signal.aborted) return
        if (e instanceof Error && e.name === 'AbortError') return
        setAiMessage(`⚠️ Không thể sinh câu hỏi mới: ${e instanceof Error ? e.message : 'lỗi không xác định'}`)
      } finally {
        if (generateAbortRef.current === controller) generateAbortRef.current = null
        if (!controller.signal.aborted) setGeneratingQuestion(false)
      }
    }, wait)
  }

  function nextQuestion() {
    setAnswered(null)
    setQuestionIdx(i => i + 1)
    explainAI.reset()
    hintAI.reset()
    setHintAttempt(0)
  }

  function retryQuestion() {
    setAnswered(null)
    explainAI.reset()
  }

  const getTasks = useCallback(
    (name: PlanetName): Task[] => {
      const base = data[name]
      const extra = aiQuestions[name] ?? []
      return [...base, ...extra]
    },
    [aiQuestions]
  )

  const tasks = currentPlanet ? getTasks(currentPlanet.name) : null
  const task = tasks ? tasks[questionIdx] : null
  const isLastQuestion = tasks ? questionIdx >= tasks.length - 1 : false
  const staminaPct = (stamina / STAMINA_MAX) * 100
  const staminaColor = staminaPct > 60 ? 'from-cyan-500 to-emerald-400' : staminaPct > 30 ? 'from-yellow-500 to-orange-400' : 'from-red-600 to-red-400'

  const PLANET_SPACING = Math.round(160 * zoom)
  const PLANET_SIZE = Math.round(80 * zoom)
  const COLUMN_X = 50
  const totalHeight = planets.length * PLANET_SPACING + Math.round(200 * zoom)

  return (
    <div className="galaxy-bg text-slate-100 flex flex-col" style={{ height: '100vh' }}>
      <div className={`stars${warp ? ' warp-speed' : ''}`} />

      <header className="relative z-30 bg-slate-950/80 border-b border-purple-950/40 p-3 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-cyan-400 tracking-widest uppercase">GALAXYLEARN 2030</h1>
          <p className="text-[9px] text-slate-400">Ngân Hà Toán Học — Hệ thống thám hiểm LHU</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="w-44 md:w-64 bg-slate-900 rounded-full h-4 border border-cyan-500/30 overflow-hidden relative">
            <div
              className={`h-full bg-gradient-to-r ${staminaColor} transition-all duration-1000`}
              style={{ width: `${staminaPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-950">
              Thể lực: {stamina}/{STAMINA_MAX} PP
            </span>
          </div>
          <p className="text-[8px] text-slate-500">
            {stamina < STAMINA_MAX
              ? `+10 PP sau ${regenMin}:${String(regenSec).padStart(2, '0')}`
              : 'Đầy năng lượng'}
          </p>
        </div>
      </header>

      {view === 'space' && (
        <main className="relative z-10 flex-1 overflow-hidden flex flex-col">
          <div className="flex justify-end gap-2 p-2 z-40 relative">
            <button onClick={zoomIn} className="w-8 h-8 bg-slate-800 border border-cyan-500/40 rounded text-cyan-400 font-bold hover:bg-slate-700 transition text-sm">+</button>
            <button onClick={zoomOut} className="w-8 h-8 bg-slate-800 border border-cyan-500/40 rounded text-cyan-400 font-bold hover:bg-slate-700 transition text-sm">−</button>
            <span className="text-[9px] text-slate-500 self-center">{Math.round(zoom * 100)}%</span>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto relative"
            onWheel={handleWheel}
          >
            <div
              style={{
                width: '100%',
                height: `${totalHeight}px`,
                position: 'relative',
              }}
            >
              <div
                id="rocket"
                style={{
                  position: 'absolute',
                  top: `${80 + currentPlanetIdx * PLANET_SPACING + PLANET_SIZE / 2}px`,
                  left: `${currentPlanetIdx < planets.length ? planets[currentPlanetIdx].x : COLUMN_X}%`,
                  transform: `translate(-50%, -50%) scale(${zoom})`,
                  fontSize: '2rem',
                  zIndex: 50,
                  transition: 'top 1.6s cubic-bezier(0.25,0.1,0.25,1), left 1.6s cubic-bezier(0.25,0.1,0.25,1)',
                  filter: 'drop-shadow(0 0 8px #06b6d4)',
                  pointerEvents: 'none',
                }}
              >
                🚀
              </div>

              <svg
                className="absolute inset-0 w-full pointer-events-none"
                style={{ height: `${totalHeight}px` }}
                xmlns="http://www.w3.org/2000/svg"
              >
                {planets.map((planet, i) => {
                  if (i >= planets.length - 1) return null
                  const y1 = 80 + i * PLANET_SPACING + PLANET_SIZE / 2
                  const y2 = 80 + (i + 1) * PLANET_SPACING + PLANET_SIZE / 2
                  const next = planets[i + 1]
                  return (
                    <line
                      key={i}
                      x1={`${planet.x}%`} y1={y1}
                      x2={`${next.x}%`} y2={y2}
                      stroke="rgba(139,92,246,0.3)"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                  )
                })}
                <line
                  x1={`${planets[planets.length - 1].x}%`} y1={80 + (planets.length - 1) * PLANET_SPACING + PLANET_SIZE / 2}
                  x2={`${COLUMN_X}%`} y2={80 + planets.length * PLANET_SPACING + 40}
                  stroke="rgba(6,182,212,0.3)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              </svg>

              {planets.map((planet, i) => {
                const yPos = 80 + i * PLANET_SPACING
                const isConquered = conqueredPlanets.has(planet.name)
                const cost = calcCost(currentPlanetIdx, i)
                const canAfford = stamina >= cost
                const isHovered = hoveredIdx === i
                const planetTasks = data[planet.name]
                const progress = planetProgress[planet.name] ?? 0
                const tooltipOnLeft = planet.x > 55

                return (
                  <div
                    key={planet.name}
                    onClick={() => flyTo(planet, i)}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{
                      position: 'absolute',
                      top: `${yPos}px`,
                      left: `${planet.x}%`,
                      transform: 'translateX(-50%)',
                      zIndex: isHovered ? 40 : 10,
                    }}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="relative">
                      {planet.type === 'video' ? (
                        <video
                          className={`planet-video-frame ${planet.glowClass} group-hover:scale-110 ${!canAfford && i !== currentPlanetIdx ? 'opacity-40' : ''}`}
                          style={{ width: `${PLANET_SIZE}px`, height: `${PLANET_SIZE}px` }}
                          autoPlay loop muted playsInline
                        >
                          <source src="istockphoto-2211749025-600s_2k_saturn.mp4" type="video/mp4" />
                        </video>
                      ) : (
                        <div
                          className={`planet-glow-box ${planet.glowClass} group-hover:scale-110 ${!canAfford && i !== currentPlanetIdx ? 'opacity-40' : ''}`}
                          style={{ width: `${PLANET_SIZE}px`, height: `${PLANET_SIZE}px` }}
                        />
                      )}
                      {isConquered && (
                        <span className="absolute -top-1 -right-1 text-base">✅</span>
                      )}
                      <span
                        className="absolute inset-0 flex items-center justify-center text-xl font-bold"
                        style={{ color: planet.color, textShadow: `0 0 10px ${planet.color}` }}
                      >
                        {planet.emoji}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold ${planet.labelColor} mt-1 tracking-wide`}>
                      {planet.label}
                    </span>
                    <span className={`text-[8px] mt-0.5 ${i === currentPlanetIdx ? 'text-cyan-400' : canAfford ? 'text-slate-400' : 'text-red-500'}`}>
                      {i === currentPlanetIdx ? 'Đang ở đây' : `${cost} PP`}
                    </span>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: 8 }).map((_, s) => (
                        <div
                          key={s}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: s < planet.difficulty ? planet.color : 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </div>

                    {isHovered && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '0',
                          [tooltipOnLeft ? 'right' : 'left']: `${PLANET_SIZE + 16}px`,
                          width: '260px',
                          borderColor: planet.color,
                        }}
                        className="bg-slate-950/95 backdrop-blur-md border-2 rounded-xl p-3 shadow-2xl text-left pointer-events-auto"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl" style={{ color: planet.color }}>{planet.emoji}</span>
                          <div>
                            <p className={`text-xs font-bold ${planet.labelColor} tracking-wider`}>{planet.label}</p>
                            <p className="text-[8px] text-slate-500">Độ khó {planet.difficulty}/8 · {planetTasks.length} câu</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed mb-2">{planet.description}</p>
                        <div className="border-t border-slate-800 pt-2 mb-2">
                          <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Chủ đề</p>
                          <div className="flex flex-wrap gap-1">
                            {planet.topics.map(t => (
                              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${planet.color}22`, color: planet.color }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between text-[9px] mb-1">
                          <span className="text-slate-400">Tiến độ</span>
                          <span style={{ color: planet.color }}>{progress}/{planetTasks.length}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(progress / planetTasks.length) * 100}%`, background: planet.color }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] pt-1 border-t border-slate-800">
                          <span className="text-slate-500">Chi phí</span>
                          <span className={i === currentPlanetIdx ? 'text-cyan-400' : canAfford ? 'text-emerald-400' : 'text-red-400'}>
                            {i === currentPlanetIdx ? 'Miễn phí' : `${cost} PP`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <div
                style={{
                  position: 'absolute',
                  top: `${80 + planets.length * PLANET_SPACING}px`,
                  left: `${COLUMN_X}%`,
                  transform: 'translateX(-50%)',
                }}
                className="flex flex-col items-center"
              >
                <video
                  className="planet-video-frame earth-glow"
                  style={{ width: `${PLANET_SIZE}px`, height: `${PLANET_SIZE}px` }}
                  autoPlay loop muted playsInline
                >
                  <source src="854518-hd_1920_1080_30fps.mp4" type="video/mp4" />
                </video>
                <span className="text-[10px] text-cyan-400 font-bold mt-1 uppercase tracking-tighter">
                  🌍 TRÁI ĐẤT (HOME)
                </span>
                <span className="text-[8px] text-slate-500 mt-0.5">Điểm xuất phát</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {view === 'info' && currentPlanet && tasks && (
        <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto p-6 flex items-center justify-center overflow-auto">
          <div className="w-full bg-slate-900/90 border-2 rounded-2xl shadow-2xl p-6 md:p-8" style={{ borderColor: currentPlanet.color }}>
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="flex flex-col items-center flex-shrink-0">
                {currentPlanet.type === 'video' ? (
                  <video
                    className={`w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ${currentPlanet.glowClass}`}
                    autoPlay loop muted playsInline
                  >
                    <source src="istockphoto-2211749025-600s_2k_saturn.mp4" type="video/mp4" />
                  </video>
                ) : (
                  <div
                    className={`planet-glow-box ${currentPlanet.glowClass}`}
                    style={{ width: '10rem', height: '10rem' }}
                  />
                )}
                <div className="flex gap-0.5 mt-3">
                  {Array.from({ length: 8 }).map((_, s) => (
                    <div
                      key={s}
                      className="w-2 h-2 rounded-full"
                      style={{ background: s < currentPlanet.difficulty ? currentPlanet.color : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-slate-400 mt-1">Độ khó {currentPlanet.difficulty}/8</span>
              </div>

              <div className="flex-1 text-center md:text-left">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Hành tinh</p>
                <h2 className={`text-2xl md:text-3xl font-bold ${currentPlanet.labelColor} tracking-wider mb-3`}>
                  {currentPlanet.emoji} {currentPlanet.label}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">{currentPlanet.description}</p>

                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Chủ đề khám phá</p>
                  <div className="flex flex-wrap gap-2">
                    {currentPlanet.topics.map(t => (
                      <span
                        key={t}
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ background: `${currentPlanet.color}22`, color: currentPlanet.color, border: `1px solid ${currentPlanet.color}55` }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                    <p className="text-[9px] uppercase text-slate-500 mb-1">Số câu hỏi</p>
                    <p className="text-lg font-bold" style={{ color: currentPlanet.color }}>
                      {tasks.length} câu
                    </p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                    <p className="text-[9px] uppercase text-slate-500 mb-1">Tiến độ hiện tại</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {planetProgress[currentPlanet.name] ?? 0}/{tasks.length}
                    </p>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${((planetProgress[currentPlanet.name] ?? 0) / tasks.length) * 100}%`,
                      background: currentPlanet.color,
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={startMission}
                    className="flex-1 p-4 rounded-xl text-sm font-bold tracking-wider transition shadow-lg hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${currentPlanet.color}, ${currentPlanet.color}99)`,
                      color: 'white',
                    }}
                  >
                    {(planetProgress[currentPlanet.name] ?? 0) > 0 && (planetProgress[currentPlanet.name] ?? 0) < tasks.length
                      ? '▶  TIẾP TỤC NHIỆM VỤ'
                      : (planetProgress[currentPlanet.name] ?? 0) >= tasks.length
                        ? '🔄  ÔN TẬP LẠI'
                        : '🚀  BẮT ĐẦU LÀM'}
                  </button>
                  <button
                    onClick={() => setView('space')}
                    className="sm:w-32 p-4 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                  >
                    ← Bản đồ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {view === 'mission' && currentPlanet && task && tasks && (
        <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto p-6 flex flex-col md:flex-row items-center justify-center gap-8 overflow-auto">
          <div className="flex flex-col items-center">
            {currentPlanet.type === 'video' ? (
              <video
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ${currentPlanet.glowClass}`}
                autoPlay loop muted playsInline
              >
                <source src="istockphoto-2211749025-600s_2k_saturn.mp4" type="video/mp4" />
              </video>
            ) : (
              <div
                className={`planet-glow-box ${currentPlanet.glowClass}`}
                style={{ width: '10rem', height: '10rem' }}
              />
            )}
            <h2 className="text-xl font-bold text-purple-300 mt-4 tracking-widest uppercase">
              HÀNH TINH {currentPlanet.name.toUpperCase()}
            </h2>
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: 8 }).map((_, s) => (
                <div
                  key={s}
                  className="w-2 h-2 rounded-full"
                  style={{ background: s < currentPlanet.difficulty ? currentPlanet.color : 'rgba(255,255,255,0.1)' }}
                />
              ))}
            </div>
            <span className="text-[9px] text-slate-400 mt-1">Độ khó: {currentPlanet.difficulty}/8</span>
          </div>

          <div className="flex-1 bg-slate-900/90 border border-purple-900 p-6 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                Câu {questionIdx + 1} / {tasks.length}
              </span>
              <div className="flex gap-1">
                {tasks.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === questionIdx ? '24px' : '12px',
                      background: i < questionIdx
                        ? '#10b981'
                        : i === questionIdx
                          ? currentPlanet.color
                          : 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </div>
            </div>
            <h3 className="text-sm md:text-base font-semibold mb-6 text-slate-200">{task.q}</h3>
            <div className="space-y-3">
              {task.a.map((opt, i) => {
                let btnClass =
                  'w-full p-3 bg-slate-800 border border-purple-700 rounded-xl text-left text-xs hover:bg-purple-900 transition'
                if (answered !== null) {
                  if (i === task.c) btnClass += ' !bg-emerald-900 !border-emerald-500'
                  else if (i === answered && answered !== task.c)
                    btnClass += ' !bg-red-900 !border-red-500'
                }
                return (
                  <button
                    key={i}
                    onClick={() => answered === null && check(i, task.c)}
                    className={btnClass}
                    disabled={answered !== null}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {answered !== null && (
              <div
                className={`mt-6 p-4 rounded-xl border-l-4 ${
                  answered === task.c
                    ? 'bg-emerald-950/40 border-emerald-500'
                    : 'bg-amber-950/40 border-amber-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      answered === task.c ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {answered === task.c ? '💡 Giải thích AI' : '📖 Đáp án đúng + Giải thích AI'}
                  </p>
                  {explainAI.isStreaming && (
                    <span className="text-[9px] text-purple-300 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      AI đang suy nghĩ...
                    </span>
                  )}
                </div>
                {answered !== task.c && (
                  <p className="text-xs text-slate-300 mb-2">
                    <span className="text-emerald-400 font-bold">→ </span>
                    {task.a[task.c]}
                  </p>
                )}
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {explainAI.error
                    ? `⚠️ AI lỗi: ${explainAI.error.message}. Giải thích dự phòng: ${task.explain}`
                    : explainAI.text || (explainAI.isStreaming ? '' : task.explain)}
                  {explainAI.isStreaming && (
                    <span className="inline-block w-2 h-3 ml-1 bg-purple-400 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            )}
            {answered !== null && answered !== task.c && hintAI.text && (
              <div className="mt-3 p-4 rounded-xl border-l-4 bg-purple-950/40 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
                    🛟 Cứu cánh AI · Mức {hintAttempt}/3
                  </p>
                  {hintAI.isStreaming && (
                    <span className="text-[9px] text-purple-300 animate-pulse">streaming...</span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {hintAI.text}
                  {hintAI.isStreaming && (
                    <span className="inline-block w-2 h-3 ml-1 bg-purple-400 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            )}
            {answered !== null && (
              <div className="mt-4 flex flex-wrap gap-3">
                {answered !== task.c && hintAttempt < 3 && (
                  <button
                    onClick={requestHint}
                    disabled={hintAI.isStreaming}
                    className="flex-1 min-w-[120px] p-3 bg-purple-900 border border-purple-500 rounded-xl text-xs font-bold text-purple-200 hover:bg-purple-800 transition disabled:opacity-50"
                  >
                    🛟 {hintAttempt === 0 ? 'Cần cứu cánh' : `Gợi ý mạnh hơn (${hintAttempt + 1}/3)`}
                  </button>
                )}
                {answered === task.c && isLastQuestion && (
                  <button
                    onClick={handleGenerateAIQuestion}
                    disabled={generatingQuestion}
                    className="flex-1 min-w-[140px] p-3 bg-violet-900 border border-violet-500 rounded-xl text-xs font-bold text-violet-200 hover:bg-violet-800 transition disabled:opacity-50"
                  >
                    {generatingQuestion ? '🛰️ AI đang sinh...' : '✨ Câu hỏi AI bonus'}
                  </button>
                )}
                {answered === task.c && !isLastQuestion && (
                  <button
                    onClick={nextQuestion}
                    className="flex-1 min-w-[120px] p-3 bg-emerald-800 border border-emerald-500 rounded-xl text-xs font-bold text-emerald-200 hover:bg-emerald-700 transition"
                  >
                    Câu kế tiếp →
                  </button>
                )}
                {answered !== task.c && (
                  <button
                    onClick={retryQuestion}
                    className="flex-1 min-w-[120px] p-3 bg-amber-800 border border-amber-500 rounded-xl text-xs font-bold text-amber-200 hover:bg-amber-700 transition"
                  >
                    🔄 Thử lại
                  </button>
                )}
                <button
                  onClick={() => setView('info')}
                  className="flex-1 min-w-[120px] p-3 bg-cyan-800 border border-cyan-500 rounded-xl text-xs font-bold text-cyan-200 hover:bg-cyan-700 transition"
                >
                  ← Thông tin
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      <footer className="relative z-30 p-3 bg-slate-950/90 border-t border-purple-950/40 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3 items-start bg-slate-900/80 border border-purple-950/40 p-3 rounded-xl shadow-lg">
          <span className="bg-purple-950 border border-purple-500/30 w-8 h-8 rounded flex items-center justify-center text-sm shadow-md flex-shrink-0">
            🤖
          </span>
          <div className="flex-1">
            <p className="text-[9px] text-purple-400 font-extrabold uppercase">Trợ lý Không gian AI</p>
            <p className="text-xs text-slate-300">{aiMessage}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
