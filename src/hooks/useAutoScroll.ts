import { useEffect, useRef } from 'react'

/**
 * Tự cuộn xuống đáy khi `dep` thay đổi và chỉ khi user đang ở gần đáy
 * (hoặc đang stream). Tránh giật khi user cuộn lên đọc lại.
 */
export function useAutoScroll<T extends HTMLElement>(
  dep: unknown,
  options: { active?: boolean; threshold?: number } = {}
) {
  const { active = true, threshold = 48 } = options
  const ref = useRef<T | null>(null)
  const stickRef = useRef(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      stickRef.current = distance <= threshold
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [threshold])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!active) return
    if (stickRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [dep, active])

  return ref
}
