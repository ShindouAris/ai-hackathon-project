import { useState, useRef, useEffect, useCallback } from 'react'
import { useAIStream } from './hooks/useAIStream'
import { useAutoScroll } from './hooks/useAutoScroll'
import { streamExplain, streamHint, generateQuestion } from './services/aiService'
import {
  addToBank,
  getAllBank,
  getBankByTopic,
  bankStats,
  clearAllBank,
  type BankEntry,
} from './services/questionBank'
import {
  loadProfile,
  saveProfile,
  clearProfile,
  type UserProfile,
} from './services/userProfile'
import {
  getLevelInfo,
  staminaMaxForLevel,
  levelFromCorrect,
} from './services/leveling'
import { ChatBox } from './components/ChatBox'
import { Markdown } from './components/Markdown'
import { FollowUpChat } from './components/FollowUpChat'
import { NameModal } from './components/NameModal'
import Galaxy from './ui/Galaxy'

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
    {
      q: 'Tích hai nghiệm của phương trình ax² + bx + c = 0 (theo Viète) bằng?',
      a: ['c/a', '-c/a', 'b/a', '-b/a'],
      c: 0,
      explain: 'Định lý Viète: x₁·x₂ = c/a. Cùng với x₁ + x₂ = -b/a, hai công thức này cho phép lập phương trình khi biết nghiệm.',
    },
    {
      q: 'Phương trình x² - 5x + 6 = 0 có nghiệm là?',
      a: ['x = 2 và x = 3', 'x = -2 và x = -3', 'x = 1 và x = 6', 'x = -1 và x = -6'],
      c: 0,
      explain: 'Dùng Viète: x₁ + x₂ = 5, x₁·x₂ = 6. Hai số có tổng 5 và tích 6 là 2 và 3.',
    },
    {
      q: 'Hệ phương trình bậc nhất hai ẩn có nghiệm duy nhất khi nào?',
      a: ['Hai đường thẳng cắt nhau', 'Hai đường thẳng song song', 'Hai đường thẳng trùng nhau', 'Hệ số bằng 0'],
      c: 0,
      explain: 'Hệ có nghiệm duy nhất khi hai đường thẳng biểu diễn hai phương trình cắt nhau tại một điểm, tức a₁/a₂ ≠ b₁/b₂.',
    },
    {
      q: 'Logarithm cơ số a của b, ký hiệu log_a(b), được định nghĩa là?',
      a: ['Số mũ x sao cho aˣ = b', 'Số mũ x sao cho bˣ = a', 'a nhân b', 'a chia b'],
      c: 0,
      explain: 'log_a(b) = x ⟺ aˣ = b. Ví dụ: log₂(8) = 3 vì 2³ = 8.',
    },
    {
      q: 'log_a(m·n) bằng?',
      a: ['log_a(m) + log_a(n)', 'log_a(m) - log_a(n)', 'log_a(m) × log_a(n)', 'log_a(m) / log_a(n)'],
      c: 0,
      explain: 'Tính chất logarithm: log_a(m·n) = log_a(m) + log_a(n). Tương tự: log_a(m/n) = log_a(m) - log_a(n).',
    },
    {
      q: 'Giá trị của log₁₀(1000) bằng?',
      a: ['3', '10', '100', '1/3'],
      c: 0,
      explain: 'log₁₀(1000) = log₁₀(10³) = 3. Vì 10³ = 1000.',
    },
    {
      q: 'Bất phương trình x² - 4 > 0 có nghiệm là?',
      a: ['x < -2 hoặc x > 2', '-2 < x < 2', 'x > 2', 'x < -2'],
      c: 0,
      explain: 'x² - 4 > 0 ⟺ (x-2)(x+2) > 0. Tích dương khi cả hai cùng dấu: x > 2 hoặc x < -2.',
    },
    {
      q: 'Công thức khai triển (a + b)² bằng?',
      a: ['a² + 2ab + b²', 'a² + b²', 'a² - 2ab + b²', '2a² + 2b²'],
      c: 0,
      explain: '(a + b)² = a² + 2ab + b². Đây là hằng đẳng thức đáng nhớ số 1. Đừng nhầm với a² + b²!',
    },
    {
      q: 'Công thức khai triển (a - b)² bằng?',
      a: ['a² - 2ab + b²', 'a² + 2ab + b²', 'a² - b²', 'a² + b²'],
      c: 0,
      explain: '(a - b)² = a² - 2ab + b². Lưu ý dấu âm ở giữa, khác với (a + b)².',
    },
    {
      q: 'a² - b² bằng?',
      a: ['(a - b)(a + b)', '(a + b)²', '(a - b)²', '(a + b)(a - b)²'],
      c: 0,
      explain: 'Hằng đẳng thức hiệu hai bình phương: a² - b² = (a - b)(a + b). Rất hữu ích để phân tích nhân tử.',
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
    {
      q: 'Định lý Pythagoras phát biểu rằng trong tam giác vuông, quan hệ giữa ba cạnh là?',
      a: ['a² + b² = c²', 'a + b = c', 'a² - b² = c²', 'a² + b² = 2c²'],
      c: 0,
      explain: 'Trong tam giác vuông với cạnh huyền c và hai cạnh góc vuông a, b: a² + b² = c². Đây là định lý nền tảng của hình học.',
    },
    {
      q: 'Chu vi hình tròn bán kính r là?',
      a: ['2πr', 'πr²', 'πr', '4πr'],
      c: 0,
      explain: 'Chu vi (độ dài đường tròn) C = 2πr. Đường kính d = 2r nên C = πd. Đừng nhầm với diện tích S = πr².',
    },
    {
      q: 'Diện tích tam giác có đáy b và chiều cao h là?',
      a: ['(b × h) / 2', 'b × h', 'b + h', '(b + h) / 2'],
      c: 0,
      explain: 'S = (1/2) × b × h. Tam giác bằng một nửa hình bình hành cùng đáy và chiều cao.',
    },
    {
      q: 'Trong tam giác đều cạnh a, diện tích bằng?',
      a: ['(a²√3) / 4', '(a²√3) / 2', 'a²√3', 'a² / 4'],
      c: 0,
      explain: 'Tam giác đều cạnh a có chiều cao h = (a√3)/2, nên S = (1/2)·a·h = (a²√3)/4.',
    },
    {
      q: 'Tọa độ trung điểm M của đoạn thẳng AB với A(x₁,y₁) và B(x₂,y₂) là?',
      a: ['((x₁+x₂)/2, (y₁+y₂)/2)', '(x₁+x₂, y₁+y₂)', '((x₁-x₂)/2, (y₁-y₂)/2)', '(x₂-x₁, y₂-y₁)'],
      c: 0,
      explain: 'Trung điểm M có tọa độ là trung bình cộng tọa độ hai đầu mút: M = ((x₁+x₂)/2, (y₁+y₂)/2).',
    },
    {
      q: 'Khoảng cách giữa hai điểm A(x₁,y₁) và B(x₂,y₂) trong mặt phẳng là?',
      a: ['√((x₂-x₁)² + (y₂-y₁)²)', '(x₂-x₁) + (y₂-y₁)', '|x₂-x₁| + |y₂-y₁|', '(x₂-x₁)² + (y₂-y₁)²'],
      c: 0,
      explain: 'Áp dụng định lý Pythagoras: |AB| = √((x₂-x₁)² + (y₂-y₁)²). Đây là công thức khoảng cách Euclid.',
    },
    {
      q: 'Thể tích hình cầu bán kính r là?',
      a: ['(4/3)πr³', '4πr²', '(2/3)πr³', 'πr³'],
      c: 0,
      explain: 'V = (4/3)πr³. Còn 4πr² là diện tích mặt cầu. Hai công thức này hay bị nhầm lẫn.',
    },
    {
      q: 'Góc nội tiếp chắn nửa đường tròn bằng bao nhiêu độ?',
      a: ['90°', '45°', '180°', '60°'],
      c: 0,
      explain: 'Định lý Thales: góc nội tiếp chắn đường kính (nửa đường tròn) luôn bằng 90°. Đây là hệ quả của định lý góc nội tiếp.',
    },
    {
      q: 'Hai đường thẳng song song có hệ số góc như thế nào?',
      a: ['Bằng nhau', 'Tích bằng -1', 'Tổng bằng 0', 'Nghịch đảo nhau'],
      c: 0,
      explain: 'Hai đường thẳng song song có cùng hệ số góc (k₁ = k₂) nhưng tung độ gốc khác nhau. Hai đường vuông góc thì k₁·k₂ = -1.',
    },
    {
      q: 'Diện tích hình thang có hai đáy a, b và chiều cao h là?',
      a: ['(a + b) × h / 2', '(a + b) × h', 'a × b × h / 2', '(a - b) × h / 2'],
      c: 0,
      explain: 'S = (a + b)/2 × h. Hình thang là trung bình cộng hai đáy nhân chiều cao.',
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
    {
      q: 'Công thức xác suất cộng cho hai biến cố bất kỳ P(A∪B) bằng?',
      a: ['P(A) + P(B) - P(A∩B)', 'P(A) + P(B)', 'P(A) × P(B)', 'P(A) - P(B) + P(A∩B)'],
      c: 0,
      explain: 'P(A∪B) = P(A) + P(B) - P(A∩B). Phải trừ P(A∩B) để tránh đếm hai lần phần giao.',
    },
    {
      q: 'Xác suất có điều kiện P(A|B) được tính bằng?',
      a: ['P(A∩B) / P(B)', 'P(A) × P(B)', 'P(A∩B) / P(A)', 'P(A) / P(B)'],
      c: 0,
      explain: 'P(A|B) = P(A∩B)/P(B) là xác suất A xảy ra khi biết B đã xảy ra. Đây là nền tảng của định lý Bayes.',
    },
    {
      q: 'Tung một đồng xu cân đối, xác suất ra mặt ngửa là?',
      a: ['1/2', '1/4', '1/3', '2/3'],
      c: 0,
      explain: 'Không gian mẫu có 2 kết quả đồng khả năng: {ngửa, sấp}. P(ngửa) = 1/2 = 0.5.',
    },
    {
      q: 'Tung một xúc xắc cân đối, xác suất ra mặt số 6 là?',
      a: ['1/6', '1/3', '1/2', '1/4'],
      c: 0,
      explain: 'Xúc xắc có 6 mặt đồng khả năng. Chỉ có 1 mặt số 6, nên P(6) = 1/6 ≈ 0.167.',
    },
    {
      q: 'Biến ngẫu nhiên X có kỳ vọng E(X) = Σ xᵢ·P(xᵢ) là gì?',
      a: ['Giá trị trung bình có trọng số theo xác suất', 'Giá trị lớn nhất của X', 'Giá trị xuất hiện nhiều nhất', 'Trung vị của X'],
      c: 0,
      explain: 'Kỳ vọng E(X) là giá trị trung bình có trọng số, mỗi giá trị được nhân với xác suất tương ứng. Nó đại diện cho "giá trị trung bình dài hạn".',
    },
    {
      q: 'Phân phối chuẩn (normal distribution) có dạng đồ thị như thế nào?',
      a: ['Hình chuông đối xứng', 'Đường thẳng', 'Hình chữ U', 'Đường dốc một chiều'],
      c: 0,
      explain: 'Phân phối chuẩn N(μ, σ²) có đồ thị hình chuông đối xứng quanh giá trị trung bình μ. Khoảng 68% dữ liệu nằm trong μ ± σ.',
    },
    {
      q: 'Nếu P(A) = 0.3, xác suất của biến cố đối lập Ā bằng?',
      a: ['0.7', '0.3', '0.6', '1.3'],
      c: 0,
      explain: 'P(Ā) = 1 - P(A) = 1 - 0.3 = 0.7. Biến cố và biến cố đối lập luôn có tổng xác suất bằng 1.',
    },
    {
      q: 'Trong 52 lá bài, xác suất rút được lá bài Át (Ace) là?',
      a: ['4/52 = 1/13', '1/52', '4/13', '1/4'],
      c: 0,
      explain: 'Có 4 lá Át trong 52 lá bài. P(Át) = 4/52 = 1/13 ≈ 0.077.',
    },
    {
      q: 'Định lý tổng xác suất phát biểu rằng?',
      a: ['P(A) = Σ P(A|Bᵢ)·P(Bᵢ) với {Bᵢ} là phân hoạch', 'P(A) = P(B₁) + P(B₂)', 'P(A) = P(A|B)·P(A)', 'P(A) = Σ P(Bᵢ)'],
      c: 0,
      explain: 'Nếu {B₁, B₂, ..., Bₙ} là phân hoạch của không gian mẫu thì P(A) = Σ P(A|Bᵢ)·P(Bᵢ). Đây là nền tảng để áp dụng Bayes.',
    },
    {
      q: 'Phương sai Var(X) đo lường điều gì?',
      a: ['Mức độ phân tán của X quanh kỳ vọng', 'Giá trị trung bình của X', 'Xác suất lớn nhất của X', 'Tổng tất cả giá trị của X'],
      c: 0,
      explain: 'Var(X) = E[(X - μ)²] đo mức độ "trải rộng" của phân phối. Phương sai lớn nghĩa là dữ liệu phân tán nhiều quanh giá trị trung bình.',
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
    {
      q: 'Đạo hàm của cos(x) là?',
      a: ['-sin(x)', 'sin(x)', '-cos(x)', 'tan(x)'],
      c: 0,
      explain: '(cos x)\' = -sin x. Lưu ý dấu âm! Ngược lại (sin x)\' = cos x (không có dấu âm).',
    },
    {
      q: 'Đạo hàm của eˣ là?',
      a: ['eˣ', 'x·eˣ', 'eˣ⁻¹', 'ln(x)'],
      c: 0,
      explain: 'Hàm eˣ là hàm duy nhất có đạo hàm bằng chính nó: (eˣ)\' = eˣ. Đây là tính chất đặc biệt của số e.',
    },
    {
      q: 'Đạo hàm của ln(x) là?',
      a: ['1/x', 'x', 'ln(x)/x', 'eˣ'],
      c: 0,
      explain: '(ln x)\' = 1/x với x > 0. Đây là công thức cơ bản cần nhớ khi làm việc với logarithm tự nhiên.',
    },
    {
      q: 'Quy tắc tích (uv)\' bằng?',
      a: ["u'v + uv'", "u'v'", "u'v - uv'", "(u+v)'"],
      c: 0,
      explain: "Quy tắc tích: (uv)' = u'v + uv'. Đạo hàm của tích KHÔNG phải là tích các đạo hàm.",
    },
    {
      q: 'Quy tắc thương (u/v)\' bằng?',
      a: ["(u'v - uv') / v²", "(u'v + uv') / v²", "u'/v'", "(u' - v') / v"],
      c: 0,
      explain: "(u/v)' = (u'v - uv') / v². Tử số là u'v trừ uv', mẫu số là v bình phương.",
    },
    {
      q: 'Đạo hàm của hàm hợp f(g(x)) theo quy tắc chuỗi là?',
      a: ["f'(g(x)) · g'(x)", "f'(x) · g'(x)", "f'(g(x)) + g'(x)", "f(g'(x))"],
      c: 0,
      explain: "Quy tắc chuỗi: (f∘g)'(x) = f'(g(x))·g'(x). Ví dụ: (sin(x²))' = cos(x²)·2x.",
    },
    {
      q: 'Hàm f(x) đạt cực trị tại x₀ khi nào (điều kiện cần)?',
      a: ["f'(x₀) = 0", "f'(x₀) > 0", "f'(x₀) < 0", "f''(x₀) = 0"],
      c: 0,
      explain: "Điều kiện cần để có cực trị: f'(x₀) = 0 (điểm dừng). Nhưng f'(x₀) = 0 chưa đủ — cần kiểm tra thêm dấu của f' hoặc f''.",
    },
    {
      q: 'Đạo hàm của tan(x) là?',
      a: ['1/cos²(x)', 'cos²(x)', '-1/sin²(x)', 'sin(x)/cos(x)'],
      c: 0,
      explain: "(tan x)' = 1/cos²(x) = sec²(x). Có thể suy ra từ quy tắc thương: tan x = sin x / cos x.",
    },
    {
      q: 'Ý nghĩa hình học của đạo hàm f\'(x₀) là?',
      a: ['Hệ số góc tiếp tuyến tại x₀', 'Diện tích dưới đồ thị', 'Giá trị lớn nhất của f', 'Độ dài cung tại x₀'],
      c: 0,
      explain: "f'(x₀) là hệ số góc (độ dốc) của tiếp tuyến với đồ thị y = f(x) tại điểm (x₀, f(x₀)). Đây là ý nghĩa hình học cơ bản của đạo hàm.",
    },
    {
      q: 'Đạo hàm cấp hai f\'\'(x) cho biết điều gì về đồ thị?',
      a: ['Tính lõm/lồi của đồ thị', 'Hệ số góc tiếp tuyến', 'Điểm cắt trục x', 'Giá trị cực đại'],
      c: 0,
      explain: "f''(x) > 0: đồ thị lõm (concave up). f''(x) < 0: đồ thị lồi (concave down). Điểm uốn xảy ra khi f'' đổi dấu.",
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
    {
      q: 'Phép nhân ma trận A (m×n) với B (n×p) cho kết quả ma trận có kích thước?',
      a: ['m×p', 'n×n', 'm×n', 'p×m'],
      c: 0,
      explain: 'A(m×n) × B(n×p) = C(m×p). Số cột của A phải bằng số hàng của B. Kết quả có số hàng của A và số cột của B.',
    },
    {
      q: 'Phép nhân ma trận có tính chất giao hoán không?',
      a: ['Không, AB ≠ BA nói chung', 'Có, AB = BA luôn luôn', 'Chỉ khi A = B', 'Chỉ khi det(A) = det(B)'],
      c: 0,
      explain: 'Phép nhân ma trận KHÔNG giao hoán: AB ≠ BA trong trường hợp tổng quát. Đây là điểm khác biệt quan trọng so với phép nhân số thực.',
    },
    {
      q: 'Hạng (rank) của ma trận là gì?',
      a: ['Số hàng (hoặc cột) độc lập tuyến tính tối đa', 'Số phần tử của ma trận', 'Giá trị định thức', 'Số hàng của ma trận'],
      c: 0,
      explain: 'Hạng của ma trận là số hàng (hoặc cột) độc lập tuyến tính tối đa, bằng số hàng khác 0 trong dạng bậc thang rút gọn.',
    },
    {
      q: 'Ma trận nghịch đảo A⁻¹ tồn tại khi nào?',
      a: ['Khi det(A) ≠ 0', 'Khi det(A) = 0', 'Khi A là ma trận vuông bất kỳ', 'Khi A = Aᵀ'],
      c: 0,
      explain: 'A⁻¹ tồn tại khi và chỉ khi det(A) ≠ 0 (ma trận không suy biến). Khi đó A·A⁻¹ = A⁻¹·A = I.',
    },
    {
      q: 'Giá trị riêng (eigenvalue) λ của ma trận A thỏa mãn phương trình nào?',
      a: ['det(A - λI) = 0', 'A·λ = 0', 'det(A) = λ', 'A - λ = 0'],
      c: 0,
      explain: 'Giá trị riêng λ thỏa det(A - λI) = 0 (phương trình đặc trưng). Vector riêng v tương ứng thỏa A·v = λ·v.',
    },
    {
      q: 'Vết (trace) của ma trận vuông A là gì?',
      a: ['Tổng các phần tử trên đường chéo chính', 'Định thức của A', 'Tổng tất cả phần tử', 'Tích các phần tử đường chéo'],
      c: 0,
      explain: 'tr(A) = a₁₁ + a₂₂ + ... + aₙₙ là tổng các phần tử trên đường chéo chính. Vết bằng tổng các giá trị riêng.',
    },
    {
      q: 'Ma trận đối xứng thỏa mãn điều kiện nào?',
      a: ['A = Aᵀ', 'A = -Aᵀ', 'A = A⁻¹', 'det(A) = 0'],
      c: 0,
      explain: 'Ma trận đối xứng có A = Aᵀ, tức aᵢⱼ = aⱼᵢ. Ma trận phản đối xứng thỏa A = -Aᵀ.',
    },
    {
      q: 'Phương pháp khử Gauss dùng để làm gì?',
      a: ['Giải hệ phương trình tuyến tính', 'Tính định thức', 'Tìm giá trị riêng', 'Nhân hai ma trận'],
      c: 0,
      explain: 'Khử Gauss biến đổi ma trận về dạng bậc thang bằng các phép biến đổi hàng cơ bản, từ đó giải hệ phương trình tuyến tính Ax = b.',
    },
    {
      q: 'Định thức của tích hai ma trận det(AB) bằng?',
      a: ['det(A) × det(B)', 'det(A) + det(B)', 'det(A) - det(B)', 'det(A) / det(B)'],
      c: 0,
      explain: 'Tính chất quan trọng: det(AB) = det(A)·det(B). Từ đó suy ra det(A⁻¹) = 1/det(A).',
    },
    {
      q: 'Ma trận trực giao Q thỏa mãn điều kiện nào?',
      a: ['QᵀQ = I', 'Q + Qᵀ = I', 'Q² = I', 'det(Q) = 0'],
      c: 0,
      explain: 'Ma trận trực giao thỏa QᵀQ = QQᵀ = I, tức Q⁻¹ = Qᵀ. Các cột (và hàng) của Q tạo thành hệ trực chuẩn.',
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
    {
      q: 'i³ bằng bao nhiêu?',
      a: ['-i', 'i', '1', '-1'],
      c: 0,
      explain: 'i³ = i²·i = (-1)·i = -i. Chu kỳ của lũy thừa i: i¹=i, i²=-1, i³=-i, i⁴=1, rồi lặp lại.',
    },
    {
      q: 'i⁴ bằng bao nhiêu?',
      a: ['1', '-1', 'i', '-i'],
      c: 0,
      explain: 'i⁴ = (i²)² = (-1)² = 1. Chu kỳ 4: i, -1, -i, 1. Để tính iⁿ, chia n cho 4 lấy phần dư.',
    },
    {
      q: 'Tổng (3 + 2i) + (1 - 5i) bằng?',
      a: ['4 - 3i', '4 + 7i', '2 + 7i', '3 - 3i'],
      c: 0,
      explain: 'Cộng số phức: cộng phần thực với phần thực, phần ảo với phần ảo. (3+1) + (2-5)i = 4 - 3i.',
    },
    {
      q: 'Tích (2 + i)(3 - 2i) bằng?',
      a: ['8 - i', '6 - 2i', '5 + i', '6 + i'],
      c: 0,
      explain: '(2+i)(3-2i) = 6 - 4i + 3i - 2i² = 6 - i - 2(-1) = 6 - i + 2 = 8 - i.',
    },
    {
      q: 'Dạng lượng giác của số phức z = a + bi là?',
      a: ['r(cosθ + i·sinθ)', 'r·cosθ + r·sinθ', 'r·e^θ', 'a·cosθ + b·sinθ'],
      c: 0,
      explain: 'z = r(cosθ + i·sinθ) với r = |z| = √(a²+b²) và θ = arg(z) = arctan(b/a). Đây là dạng cực của số phức.',
    },
    {
      q: 'Công thức Euler e^(iθ) bằng?',
      a: ['cosθ + i·sinθ', 'cosθ - i·sinθ', 'sinθ + i·cosθ', 'e^θ·(cos + sin)'],
      c: 0,
      explain: 'Công thức Euler: e^(iθ) = cosθ + i·sinθ. Đặc biệt e^(iπ) + 1 = 0 là đẳng thức đẹp nhất toán học.',
    },
    {
      q: 'Phần thực của số phức z = 5 - 3i là?',
      a: ['5', '-3', '3', '-5'],
      c: 0,
      explain: 'Với z = a + bi, phần thực Re(z) = a. Ở đây z = 5 + (-3)i nên Re(z) = 5.',
    },
    {
      q: 'Nghiệm của phương trình x² + 1 = 0 trong tập số phức là?',
      a: ['x = i và x = -i', 'x = 1 và x = -1', 'Vô nghiệm', 'x = i'],
      c: 0,
      explain: 'x² = -1 ⟹ x = ±√(-1) = ±i. Đây chính là lý do số phức được phát minh — để giải các phương trình vô nghiệm thực.',
    },
    {
      q: 'Định lý De Moivre phát biểu rằng [r(cosθ + i·sinθ)]ⁿ bằng?',
      a: ['rⁿ(cos(nθ) + i·sin(nθ))', 'rⁿ(cosθ + i·sinθ)', 'r(cos(nθ) + i·sin(nθ))', 'nrⁿ⁻¹(cosθ + i·sinθ)'],
      c: 0,
      explain: 'Định lý De Moivre: [r(cosθ + i·sinθ)]ⁿ = rⁿ(cos(nθ) + i·sin(nθ)). Rất hữu ích để tính lũy thừa và căn của số phức.',
    },
    {
      q: 'Môđun của tích hai số phức |z₁·z₂| bằng?',
      a: ['|z₁|·|z₂|', '|z₁| + |z₂|', '|z₁|² + |z₂|²', '|z₁ + z₂|'],
      c: 0,
      explain: '|z₁·z₂| = |z₁|·|z₂|. Môđun của tích bằng tích các môđun. Tương tự: arg(z₁·z₂) = arg(z₁) + arg(z₂).',
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
    {
      q: 'C(n, 0) bằng bao nhiêu?',
      a: ['1', '0', 'n', 'n!'],
      c: 0,
      explain: 'C(n,0) = n!/(0!·n!) = 1. Có đúng 1 cách chọn 0 phần tử từ n phần tử (chọn không có gì).',
    },
    {
      q: 'C(n, 1) bằng bao nhiêu?',
      a: ['n', '1', 'n-1', 'n!'],
      c: 0,
      explain: 'C(n,1) = n!/(1!(n-1)!) = n. Có n cách chọn 1 phần tử từ n phần tử.',
    },
    {
      q: 'C(n, k) = C(n, n-k) thể hiện tính chất gì?',
      a: ['Tính đối xứng của tổ hợp', 'Tính giao hoán', 'Tính kết hợp', 'Tính phân phối'],
      c: 0,
      explain: 'C(n,k) = C(n,n-k) vì chọn k phần tử để lấy tương đương với chọn (n-k) phần tử để loại. Đây là tính đối xứng của tam giác Pascal.',
    },
    {
      q: 'Công thức nhị thức Newton (a+b)ⁿ = ?',
      a: ['Σ C(n,k)·aⁿ⁻ᵏ·bᵏ (k từ 0 đến n)', 'aⁿ + bⁿ', 'Σ aᵏ·bⁿ⁻ᵏ', 'n·(a+b)ⁿ⁻¹'],
      c: 0,
      explain: '(a+b)ⁿ = Σₖ₌₀ⁿ C(n,k)·aⁿ⁻ᵏ·bᵏ. Hệ số C(n,k) chính là các số trong tam giác Pascal.',
    },
    {
      q: 'Tổng tất cả hệ số nhị thức C(n,0) + C(n,1) + ... + C(n,n) bằng?',
      a: ['2ⁿ', 'n!', 'n²', 'n(n+1)/2'],
      c: 0,
      explain: 'Thay a=b=1 vào nhị thức Newton: (1+1)ⁿ = 2ⁿ = Σ C(n,k). Tổng tất cả hệ số nhị thức bằng 2ⁿ.',
    },
    {
      q: 'Có bao nhiêu cách chọn 3 người từ nhóm 5 người?',
      a: ['10', '15', '20', '60'],
      c: 0,
      explain: 'C(5,3) = 5!/(3!·2!) = (5×4)/(2×1) = 10. Hoặc dùng C(5,3) = C(5,2) = 10.',
    },
    {
      q: 'Nguyên lý cộng trong tổ hợp phát biểu rằng?',
      a: ['Nếu A và B rời nhau thì |A∪B| = |A| + |B|', '|A∩B| = |A|·|B|', '|A∪B| = |A|·|B|', '|A| = |B| luôn luôn'],
      c: 0,
      explain: 'Nguyên lý cộng: nếu có thể thực hiện việc A theo m cách HOẶC việc B theo n cách (loại trừ nhau), tổng số cách là m + n.',
    },
    {
      q: 'Nguyên lý nhân trong tổ hợp phát biểu rằng?',
      a: ['Nếu A và B độc lập thì số cách = |A| × |B|', 'Số cách = |A| + |B|', 'Số cách = |A| - |B|', 'Số cách = |A|!'],
      c: 0,
      explain: 'Nguyên lý nhân: nếu thực hiện việc A theo m cách VÀ sau đó việc B theo n cách, tổng số cách thực hiện cả hai là m × n.',
    },
    {
      q: 'Số tập con của một tập có n phần tử là?',
      a: ['2ⁿ', 'n!', 'n²', '2n'],
      c: 0,
      explain: 'Mỗi phần tử có 2 lựa chọn: thuộc hoặc không thuộc tập con. Với n phần tử: 2×2×...×2 = 2ⁿ tập con (kể cả tập rỗng và tập đầy đủ).',
    },
    {
      q: 'Công thức Pascal: C(n,k) = ?',
      a: ['C(n-1,k-1) + C(n-1,k)', 'C(n-1,k) × C(n-1,k-1)', 'C(n+1,k) - C(n,k)', 'C(n,k-1) + C(n,k+1)'],
      c: 0,
      explain: 'Hệ thức Pascal: C(n,k) = C(n-1,k-1) + C(n-1,k). Đây là quy tắc xây dựng tam giác Pascal: mỗi số bằng tổng hai số phía trên.',
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
    {
      q: 'Tích phân ∫eˣ dx bằng?',
      a: ['eˣ + C', 'eˣ⁺¹ + C', 'x·eˣ + C', 'ln(x) + C'],
      c: 0,
      explain: '∫eˣ dx = eˣ + C. Hàm eˣ là nguyên hàm của chính nó — tính chất đặc biệt của số e.',
    },
    {
      q: 'Tích phân ∫(1/x) dx bằng?',
      a: ['ln|x| + C', '1/x² + C', '-1/x² + C', 'log(x) + C'],
      c: 0,
      explain: '∫(1/x) dx = ln|x| + C. Cần dấu giá trị tuyệt đối vì ln chỉ xác định với x > 0.',
    },
    {
      q: 'Tích phân xác định ∫ₐᵇ f(x) dx biểu diễn điều gì?',
      a: ['Diện tích có dấu giữa đồ thị f(x) và trục Ox từ a đến b', 'Đạo hàm của f tại a', 'Giá trị lớn nhất của f trên [a,b]', 'Độ dài đường cong f(x)'],
      c: 0,
      explain: 'Tích phân xác định là diện tích có dấu: dương khi f(x) > 0, âm khi f(x) < 0. Đây là ý nghĩa hình học cơ bản.',
    },
    {
      q: 'Định lý cơ bản của giải tích phát biểu rằng nếu F\'(x) = f(x) thì ∫ₐᵇ f(x) dx bằng?',
      a: ['F(b) - F(a)', 'F(a) - F(b)', 'F(a) + F(b)', 'F(b) / F(a)'],
      c: 0,
      explain: 'Định lý cơ bản giải tích: ∫ₐᵇ f(x) dx = F(b) - F(a) với F là nguyên hàm của f. Kết nối vi phân và tích phân.',
    },
    {
      q: 'lim(x→∞) (1 + 1/x)ˣ bằng?',
      a: ['e', '1', '∞', '0'],
      c: 0,
      explain: 'Đây là định nghĩa của số e ≈ 2.71828. Giới hạn này xuất hiện trong lãi suất kép liên tục và nhiều ứng dụng thực tế.',
    },
    {
      q: 'Tích phân ∫sin(x) dx bằng?',
      a: ['-cos(x) + C', 'cos(x) + C', 'sin(x) + C', '-sin(x) + C'],
      c: 0,
      explain: '∫sin x dx = -cos x + C. Có dấu âm! Kiểm tra: (-cos x)\' = sin x. Đừng nhầm với ∫cos x dx = sin x + C.',
    },
    {
      q: 'Phương pháp tích phân từng phần: ∫u dv = ?',
      a: ['uv - ∫v du', 'uv + ∫v du', '∫u du · ∫v dv', 'u·v\' - u\'·v'],
      c: 0,
      explain: '∫u dv = uv - ∫v du. Chọn u là hàm dễ lấy đạo hàm, dv là phần còn lại. Dùng khi tích phân có dạng tích hai hàm khác loại.',
    },
    {
      q: 'lim(x→0) (eˣ - 1)/x bằng?',
      a: ['1', '0', 'e', '∞'],
      c: 0,
      explain: 'Đây là giới hạn cơ bản: lim(x→0)(eˣ-1)/x = 1. Nó chính là định nghĩa đạo hàm của eˣ tại x=0, bằng e⁰ = 1.',
    },
    {
      q: 'Chuỗi Taylor của eˣ tại x=0 là?',
      a: ['1 + x + x²/2! + x³/3! + ...', '1 + x + x² + x³ + ...', 'x - x³/3! + x⁵/5! - ...', '1 - x²/2! + x⁴/4! - ...'],
      c: 0,
      explain: 'eˣ = Σ xⁿ/n! = 1 + x + x²/2! + x³/3! + ... Chuỗi này hội tụ với mọi x thực, rất hữu ích để tính xấp xỉ.',
    },
    {
      q: 'Tích phân ∫x·eˣ dx được tính bằng phương pháp nào hiệu quả nhất?',
      a: ['Tích phân từng phần', 'Đổi biến', 'Phân tích phân thức', 'Tích phân lượng giác'],
      c: 0,
      explain: 'Dùng tích phân từng phần với u = x, dv = eˣ dx. Kết quả: ∫x·eˣ dx = x·eˣ - eˣ + C = eˣ(x-1) + C.',
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
  totalCorrect: number
  answeredQuestionIds: string[]
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
  const [, setWarp] = useState(false)
  const [answered, setAnswered] = useState<number | null>(null)
  const [questionIdx, setQuestionIdx] = useState(0)
  const [stamina, setStamina] = useState(() => {
    const initialMax = staminaMaxForLevel(levelFromCorrect(saved.totalCorrect ?? 0))
    if (saved.stamina == null || saved.lastRegenTime == null) return initialMax
    const elapsed = Date.now() - saved.lastRegenTime
    const ticks = Math.floor(elapsed / REGEN_INTERVAL_MS)
    return Math.min(initialMax, saved.stamina + ticks * REGEN_AMOUNT)
  })
  const [zoom, setZoom] = useState(saved.zoom ?? 1)
  const [conqueredPlanets, setConqueredPlanets] = useState<Set<string>>(
    new Set(saved.conqueredPlanets ?? [])
  )
  const [planetProgress, setPlanetProgress] = useState<Record<string, number>>(
    saved.planetProgress ?? {}
  )
  const [totalCorrect, setTotalCorrect] = useState<number>(saved.totalCorrect ?? 0)
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(
    new Set(saved.answeredQuestionIds ?? [])
  )
  const [levelUpFlash, setLevelUpFlash] = useState<{ from: number; to: number } | null>(null)

  const levelInfo = getLevelInfo(totalCorrect)
  const dynamicStaminaMax = levelInfo.staminaMax

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
      totalCorrect,
      answeredQuestionIds: Array.from(answeredQuestionIds),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore quota errors
    }
  }, [currentPlanetIdx, stamina, zoom, conqueredPlanets, planetProgress, totalCorrect, answeredQuestionIds])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastRegenTime.current
      if (elapsed >= REGEN_INTERVAL_MS) {
        const ticks = Math.floor(elapsed / REGEN_INTERVAL_MS)
        setStamina(s => {
          const next = Math.min(dynamicStaminaMax, s + ticks * REGEN_AMOUNT)
          if (next !== s) {
            console.log(`[REGEN] +${next - s} PP (${s} → ${next}/${dynamicStaminaMax}) | ticks=${ticks}`)
          }
          return next
        })
        lastRegenTime.current = now - (elapsed % REGEN_INTERVAL_MS)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [dynamicStaminaMax])

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
  const [stuckPromptOpen, setStuckPromptOpen] = useState(false)
  const [stuckDismissedKey, setStuckDismissedKey] = useState<string | null>(null)
  const STUCK_THRESHOLD_MS = 25_000

  const stuckQuestionKey =
    view === 'mission' && currentPlanet
      ? `${currentPlanet.name}::${questionIdx}`
      : null

  useEffect(() => {
    setStuckPromptOpen(false)
    if (!stuckQuestionKey || answered !== null) return
    if (stuckDismissedKey === stuckQuestionKey) return
    const timer = setTimeout(() => {
      setStuckPromptOpen(true)
    }, STUCK_THRESHOLD_MS)
    return () => clearTimeout(timer)
  }, [stuckQuestionKey, answered, stuckDismissedKey])
  const [generatingQuestion, setGeneratingQuestion] = useState(false)
  const [aiQuestions, setAiQuestions] = useState<Record<string, Task[]>>(() => {
    const all = getAllBank()
    const out: Record<string, Task[]> = {}
    for (const [topic, list] of Object.entries(all)) {
      out[topic] = list.map(e => ({ q: e.q, a: e.a, c: e.c, explain: e.explain }))
    }
    return out
  })
  const [bankInfo, setBankInfo] = useState(() => bankStats())
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile())
  const [showNameModal, setShowNameModal] = useState<'first' | 'edit' | null>(() =>
    loadProfile() ? null : 'first'
  )
  const userName = profile?.name ?? null

  function handleSaveName(name: string) {
    const saved = saveProfile(name)
    setProfile(saved)
    setShowNameModal(null)
    setAiMessage(`👋 Chào **${saved.name}**! Phi hành đoàn đã sẵn sàng. Chọn hành tinh để bắt đầu!`)
  }

  function handleSkipName() {
    setShowNameModal(null)
  }

  function handleClearProfile() {
    if (!confirm('Xoá tên đã lưu?')) return
    clearProfile()
    setProfile(null)
    setAiMessage('👤 Đã xoá tên. Trợ lý sẽ gọi bạn là "chỉ huy".')
  }

  const explainAI = useAIStream(streamExplain, { debounceMs: 400, cooldownMs: 1500 })
  const hintAI = useAIStream(streamHint, { debounceMs: 400, cooldownMs: 2500 })
  const explainScrollRef = useAutoScroll<HTMLDivElement>(explainAI.text, {
    active: explainAI.isStreaming,
  })
  const hintScrollRef = useAutoScroll<HTMLDivElement>(hintAI.text, {
    active: hintAI.isStreaming,
  })
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
    const questionKey = `${currentPlanet.name}::${task.q}`
    if (sel === cor) {
      const alreadyCounted = answeredQuestionIds.has(questionKey)
      if (!alreadyCounted) {
        setAnsweredQuestionIds(prev => {
          const next = new Set(prev)
          next.add(questionKey)
          return next
        })
        setTotalCorrect(prev => {
          const nextTotal = prev + 1
          const prevLevel = levelFromCorrect(prev)
          const nextLevel = levelFromCorrect(nextTotal)
          if (nextLevel > prevLevel) {
            const newMax = staminaMaxForLevel(nextLevel)
            const oldMax = staminaMaxForLevel(prevLevel)
            const bonus = newMax - oldMax
            setStamina(s => Math.min(newMax, s + bonus))
            setLevelUpFlash({ from: prevLevel, to: nextLevel })
            setTimeout(() => setLevelUpFlash(null), 4000)
          }
          return nextTotal
        })
      }
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
    if (sel !== cor) {
      explainAI.run({
        question: task.q,
        options: task.a,
        correctIndex: task.c,
        userAnswerIndex: sel,
        userName,
        hideAnswer: true,
      })
    } else {
      explainAI.reset()
    }
  }

  function requestHint() {
    if (!task) return
    const next = Math.min(hintAttempt + 1, 3)
    setHintAttempt(next)
    setStuckPromptOpen(false)
    if (stuckQuestionKey) setStuckDismissedKey(stuckQuestionKey)
    setAiMessage(`💡 **CỨU CÁNH MỨC ${next}** đang được khởi động...`)
    hintAI.run({
      question: task.q,
      options: task.a,
      correctIndex: task.c,
      userAnswerIndex: answered,
      attempt: next,
      userName,
    })
  }

  function dismissStuckPrompt() {
    setStuckPromptOpen(false)
    if (stuckQuestionKey) setStuckDismissedKey(stuckQuestionKey)
  }

  async function handleGenerateAIQuestion(opts: { forceFresh?: boolean } = {}) {
    if (!currentPlanet) return

    if (generateDebounceRef.current) {
      clearTimeout(generateDebounceRef.current)
      generateDebounceRef.current = null
    }
    generateAbortRef.current?.abort()

    const planet = currentPlanet
    const existing = getTasks(planet.name)
    const seenSet = new Set(existing.map(t => t.q.trim().replace(/\s+/g, ' ').toLowerCase()))

    if (!opts.forceFresh) {
      const cached = getBankByTopic(planet.name).filter(
        e => !seenSet.has(e.q.trim().replace(/\s+/g, ' ').toLowerCase())
      )
      if (cached.length > 0) {
        const pick = cached[Math.floor(Math.random() * cached.length)]
        const newTask: Task = { q: pick.q, a: pick.a, c: pick.c, explain: pick.explain }
        setAiQuestions(prev => ({
          ...prev,
          [planet.name]: [...(prev[planet.name] ?? []), newTask],
        }))
        setQuestionIdx(existing.length)
        setAnswered(null)
        explainAI.reset()
        hintAI.reset()
        setHintAttempt(0)
        setAiMessage(`📦 **CÂU HỎI TỪ KHO** (đã lưu trước đó). Tiết kiệm token AI!`)
        return
      }
    }

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

      try {
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
        const entry: BankEntry = {
          ...newTask,
          topic: planet.name,
          difficulty: planet.difficulty,
          createdAt: Date.now(),
        }
        const added = addToBank(entry)
        setBankInfo(bankStats())
        setAiQuestions(prev => ({
          ...prev,
          [planet.name]: [...(prev[planet.name] ?? []), newTask],
        }))
        setQuestionIdx(existing.length)
        setAnswered(null)
        explainAI.reset()
        hintAI.reset()
        setHintAttempt(0)
        setAiMessage(
          added
            ? `✨ **CÂU HỎI MỚI** từ AI đã sẵn sàng và được lưu vào kho. Chinh phục thử thách bonus!`
            : `✨ **CÂU HỎI MỚI** đã sẵn sàng (trùng với kho cũ, không lưu lại).`
        )
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

  function handleClearBank() {
    if (!confirm('Xoá toàn bộ kho câu hỏi AI đã lưu?')) return
    clearAllBank()
    setAiQuestions({})
    setBankInfo(bankStats())
    setAiMessage('🗑️ Đã xoá kho câu hỏi AI.')
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
  const staminaPct = (stamina / dynamicStaminaMax) * 100
  const staminaColor = staminaPct > 60 ? 'from-cyan-500 to-emerald-400' : staminaPct > 30 ? 'from-yellow-500 to-orange-400' : 'from-red-600 to-red-400'

  const PLANET_SPACING = Math.round(160 * zoom)
  const PLANET_SIZE = Math.round(80 * zoom)
  const COLUMN_X = 50
  const totalHeight = planets.length * PLANET_SPACING + Math.round(200 * zoom)

  return (
    <div className="galaxy-bg text-slate-100 flex flex-col" style={{ height: '100vh' }}>
      <div className="absolute inset-0 z-0">
        <Galaxy />
      </div>

      <header className="relative z-30 bg-slate-950/80 border-b border-purple-950/40 p-3 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-cyan-400 tracking-widest uppercase">GALAXYLEARN 2030</h1>
          <p className="text-[9px] text-slate-400">Ngân Hà Toán Học — Hệ thống thám hiểm LHU</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gradient-to-br from-amber-950/60 to-orange-950/60 border border-amber-500/40"
            title={
              levelInfo.isMax
                ? `Cấp tối đa! Đã trả lời đúng ${totalCorrect} câu.`
                : `Trả lời đúng ${levelInfo.correctIntoLevel}/${levelInfo.correctNeededForLevel} câu để lên Cấp ${levelInfo.level + 1}`
            }
          >
            <span className="text-base leading-none">⭐</span>
            <div className="text-left min-w-[56px]">
              <p className="text-[8px] uppercase text-amber-400 font-bold leading-tight tracking-wider">Cấp</p>
              <p className="text-[11px] font-bold text-amber-200 leading-tight">
                {levelInfo.level}
                {levelInfo.isMax && <span className="text-amber-400 ml-1">MAX</span>}
              </p>
            </div>
            <div className="w-12 h-1 bg-slate-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                style={{ width: `${levelInfo.progressPct}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setShowNameModal('edit')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40 transition group"
            title={userName ? `Đổi tên (hiện tại: ${userName})` : 'Đặt tên để cá nhân hoá AI'}
          >
            <span className="text-base leading-none">{userName ? '👨‍🚀' : '👤'}</span>
            <div className="text-left">
              <p className="text-[8px] uppercase text-cyan-400 font-bold leading-tight">Chỉ huy</p>
              <p className="text-[10px] font-bold text-cyan-200 leading-tight max-w-[80px] truncate">
                {userName ?? 'Ẩn danh'}
              </p>
            </div>
          </button>
          {userName && (
            <button
              onClick={handleClearProfile}
              className="hidden md:block text-[10px] text-slate-500 hover:text-red-400 transition px-1"
              title="Xoá tên đã lưu"
            >
              ✕
            </button>
          )}
          {bankInfo.total > 0 && (
            <button
              onClick={handleClearBank}
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/80 border border-violet-500/30 hover:border-violet-400 hover:bg-violet-950/40 transition group"
              title={`Kho câu hỏi AI: ${bankInfo.total} câu / ${bankInfo.topics} chủ đề. Click để xoá toàn bộ.`}
            >
              <span className="text-base leading-none">📦</span>
              <div className="text-left">
                <p className="text-[8px] uppercase text-violet-400 font-bold leading-tight">Kho AI</p>
                <p className="text-[10px] font-bold text-violet-200 leading-tight">
                  {bankInfo.total} câu
                </p>
              </div>
              <span className="text-[10px] text-slate-500 group-hover:text-red-400 transition">🗑️</span>
            </button>
          )}
          <div className="flex flex-col items-end gap-1">
            <div className="w-44 md:w-64 bg-slate-900 rounded-full h-4 border border-cyan-500/30 overflow-hidden relative">
              <div
                className={`h-full bg-gradient-to-r ${staminaColor} transition-all duration-1000`}
                style={{ width: `${staminaPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-950">
                Thể lực: {stamina}/{dynamicStaminaMax} PP
              </span>
            </div>
            <p className="text-[8px] text-slate-500">
              {stamina < dynamicStaminaMax
                ? `+10 PP sau ${regenMin}:${String(regenSec).padStart(2, '0')}`
                : 'Đầy năng lượng'}
            </p>
          </div>
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
            {stuckPromptOpen && answered === null && (
              <div className="stuck-prompt mb-4 p-3 rounded-xl border border-purple-500/60 bg-gradient-to-br from-purple-950/80 to-slate-950/80 shadow-lg shadow-purple-900/40 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 animate-bounce" style={{ animationDuration: '2s' }}>🤔</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-purple-200 mb-0.5">
                    {userName ? `${userName} ơi, bạn có gặp khó khăn?` : 'Bạn có gặp khó khăn?'}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                    Mình thấy bạn đang suy nghĩ khá lâu. Để mình đọc câu hỏi và cho gợi ý nhé?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={requestHint}
                      disabled={hintAI.isStreaming}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-purple-700 to-cyan-700 border border-cyan-500/60 text-[11px] font-bold text-white hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
                    >
                      💡 Hỏi AI ngay
                    </button>
                    <button
                      onClick={dismissStuckPrompt}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-[11px] font-bold text-slate-300 hover:bg-slate-700 transition"
                    >
                      Tự nghĩ tiếp
                    </button>
                  </div>
                </div>
                <button
                  onClick={dismissStuckPrompt}
                  className="text-slate-500 hover:text-slate-300 w-5 h-5 flex items-center justify-center transition flex-shrink-0"
                  title="Đóng"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="space-y-3">
              {task.a.map((opt, i) => {
                let btnClass =
                  'w-full p-3 bg-slate-800 border border-purple-700 rounded-xl text-left text-xs hover:bg-purple-900 transition'
                if (answered !== null) {
                  if (answered === task.c && i === task.c) btnClass += ' !bg-emerald-900 !border-emerald-500'
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
                    {answered === task.c ? '💡 Giải thích AI' : '🔍 Phân tích lỗi sai (AI)'}
                  </p>
                  {explainAI.isStreaming && (
                    <span className="text-[9px] text-purple-300 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      AI đang suy nghĩ...
                    </span>
                  )}
                </div>
                {answered !== task.c && (
                  <p className="text-xs text-amber-300/90 mb-2 italic">
                    Đáp án đúng đang được giấu — hãy phân tích phần giải thích bên dưới rồi <span className="font-bold">Thử lại</span> nhé!
                  </p>
                )}
                <div
                  ref={explainScrollRef}
                  className="ai-stream-scroll text-xs text-slate-300 leading-relaxed max-h-56 md:max-h-64 overflow-y-auto pr-2 -mr-1"
                >
                  {explainAI.error ? (
                    <Markdown>{`⚠️ AI lỗi: ${explainAI.error.message}.\n\n**Giải thích dự phòng:** ${task.explain}`}</Markdown>
                  ) : explainAI.text ? (
                    <Markdown>{explainAI.text}</Markdown>
                  ) : explainAI.isStreaming ? null : (
                    <Markdown>{task.explain}</Markdown>
                  )}
                  {explainAI.isStreaming && (
                    <span className="inline-block w-2 h-3 ml-1 bg-purple-400 animate-pulse align-middle" />
                  )}
                </div>
                {!explainAI.isStreaming && (
                  <FollowUpChat
                    question={task.q}
                    options={task.a}
                    correctIndex={task.c}
                    userAnswerIndex={answered}
                    baseExplanation={explainAI.text || task.explain}
                    resetKey={`${currentPlanet.name}-${questionIdx}`}
                    userName={userName}
                  />
                )}
              </div>
            )}
            {hintAI.text && (answered === null || answered !== task.c) && (
              <div className="mt-3 p-4 rounded-xl border-l-4 bg-purple-950/40 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
                    🛟 Cứu cánh AI · Mức {hintAttempt}/3
                  </p>
                  {hintAI.isStreaming && (
                    <span className="text-[9px] text-purple-300 animate-pulse">streaming...</span>
                  )}
                </div>
                <div
                  ref={hintScrollRef}
                  className="ai-stream-scroll text-xs text-slate-300 leading-relaxed max-h-40 md:max-h-48 overflow-y-auto pr-2 -mr-1"
                >
                  <Markdown>{hintAI.text}</Markdown>
                  {hintAI.isStreaming && (
                    <span className="inline-block w-2 h-3 ml-1 bg-purple-400 animate-pulse align-middle" />
                  )}
                </div>
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
                    onClick={() => handleGenerateAIQuestion()}
                    disabled={generatingQuestion}
                    className="flex-1 min-w-[140px] p-3 bg-violet-900 border border-violet-500 rounded-xl text-xs font-bold text-violet-200 hover:bg-violet-800 transition disabled:opacity-50"
                    title={
                      bankInfo.byTopic[currentPlanet.name]
                        ? `Kho có ${bankInfo.byTopic[currentPlanet.name]} câu cho ${currentPlanet.name}`
                        : 'Chưa có câu nào trong kho'
                    }
                  >
                    {generatingQuestion ? '🛰️ AI đang sinh...' : '✨ Câu hỏi bonus'}
                  </button>
                )}
                {answered === task.c && isLastQuestion && !generatingQuestion && (
                  <button
                    onClick={() => handleGenerateAIQuestion({ forceFresh: true })}
                    className="min-w-[40px] p-3 bg-slate-800 border border-violet-500/40 rounded-xl text-xs font-bold text-violet-300 hover:bg-violet-900/40 transition"
                    title="Bỏ qua kho, sinh câu hoàn toàn mới"
                  >
                    🔄
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

      <footer className="relative z-30 p-3 bg-transparent border-t border-purple-950/40 flex-shrink-0">
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

      <ChatBox
        userName={userName}
        context={
          currentPlanet
            ? `Người học đang khám phá hành tinh "${currentPlanet.name}" (chủ đề: ${currentPlanet.topics?.join(', ') ?? currentPlanet.name}, độ khó ${currentPlanet.difficulty}/8). Cấp độ ${levelInfo.level}, đã trả lời đúng ${totalCorrect} câu, đã chinh phục ${conqueredPlanets.size}/${planets.length} hành tinh, còn ${stamina}/${dynamicStaminaMax} PP thể lực.`
            : `Người học đang ở bản đồ ngân hà. Cấp độ ${levelInfo.level}, đã trả lời đúng ${totalCorrect} câu, đã chinh phục ${conqueredPlanets.size}/${planets.length} hành tinh, còn ${stamina}/${dynamicStaminaMax} PP thể lực.`
        }
      />

      {showNameModal && (
        <NameModal
          mode={showNameModal}
          initialName={profile?.name ?? ''}
          onSubmit={handleSaveName}
          onSkip={showNameModal === 'first' ? handleSkipName : undefined}
          onClose={showNameModal === 'edit' ? () => setShowNameModal(null) : undefined}
        />
      )}

      {levelUpFlash && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center pt-24 pointer-events-none">
          <div className="level-up-toast px-6 py-4 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-500 to-pink-600 border-2 border-amber-300/80 shadow-2xl shadow-amber-900/60 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-100">
              Lên cấp!
            </p>
            <p className="text-2xl font-black text-white mt-1 tracking-wider">
              ⭐ Cấp {levelUpFlash.from} → {levelUpFlash.to}
            </p>
            <p className="text-xs text-amber-50 mt-1.5">
              Thể lực tối đa tăng lên <span className="font-bold">{staminaMaxForLevel(levelUpFlash.to)} PP</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
