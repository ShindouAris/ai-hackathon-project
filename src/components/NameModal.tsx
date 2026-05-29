import { useEffect, useRef, useState, type FormEvent } from 'react'

interface NameModalProps {
  initialName?: string
  onSubmit: (name: string) => void
  onSkip?: () => void
  /** "first" = lần đầu (không có nút bỏ qua), "edit" = sửa tên (có nút huỷ). */
  mode?: 'first' | 'edit'
  onClose?: () => void
}

export function NameModal({
  initialName = '',
  onSubmit,
  onSkip,
  mode = 'first',
  onClose,
}: NameModalProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 1) {
      setError('Tên không được để trống.')
      return
    }
    if (trimmed.length > 40) {
      setError('Tên tối đa 40 ký tự.')
      return
    }
    onSubmit(trimmed)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars opacity-40" />
      </div>
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-900/60 overflow-hidden">
        <div className="p-5 border-b border-purple-900/60 bg-gradient-to-r from-purple-950/40 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <h2 className="text-base font-bold text-cyan-300 tracking-widest uppercase">
                {mode === 'first' ? 'Đăng Ký Phi Hành Đoàn' : 'Đổi Danh Tính'}
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {mode === 'first'
                  ? 'Trợ lý AI cần biết tên bạn để cá nhân hoá hành trình'
                  : 'Cập nhật tên hiển thị cho trợ lý AI'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-purple-300 mb-2">
              Tên chỉ huy
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value)
                setError(null)
              }}
              maxLength={40}
              placeholder="VD: Minh, Khoa, Lan Anh..."
              className="w-full bg-slate-900 border border-purple-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-slate-500">
                {error ? <span className="text-red-400">⚠ {error}</span> : 'Trợ lý AI sẽ gọi bạn bằng tên này.'}
              </span>
              <span className="text-[10px] text-slate-500">{name.length}/40</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-purple-900/40 rounded-lg p-3 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-cyan-400 font-bold">💡 Mẹo:</span> Tên được lưu trên thiết bị của bạn. Bạn có thể đổi hoặc xoá bất cứ lúc nào trong cài đặt.
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 p-3 rounded-lg text-sm font-bold tracking-wider bg-gradient-to-br from-purple-700 to-cyan-700 border border-cyan-500/60 text-white hover:scale-[1.02] transition shadow-lg"
            >
              {mode === 'first' ? '🚀 KHỞI HÀNH' : '✓ LƯU'}
            </button>
            {mode === 'first' && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-3 rounded-lg text-xs font-bold text-slate-400 bg-slate-900 border border-slate-700 hover:text-slate-200 hover:border-slate-600 transition"
              >
                Bỏ qua
              </button>
            )}
            {mode === 'edit' && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-lg text-xs font-bold text-slate-400 bg-slate-900 border border-slate-700 hover:text-slate-200 hover:border-slate-600 transition"
              >
                Huỷ
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
