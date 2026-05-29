export const BASE_STAMINA_MAX = 180
export const STAMINA_PER_LEVEL = 30
export const MAX_LEVEL = 20

export interface LevelInfo {
  level: number
  totalCorrect: number
  staminaMax: number
  correctIntoLevel: number
  correctNeededForLevel: number
  nextLevelAt: number
  progressPct: number
  isMax: boolean
}

export function thresholdForLevel(level: number): number {
  if (level <= 1) return 0
  return (level - 1) * (level - 1)
}

export function levelFromCorrect(totalCorrect: number): number {
  if (totalCorrect <= 0) return 1
  const level = Math.floor(Math.sqrt(totalCorrect)) + 1
  return Math.min(MAX_LEVEL, level)
}

export function staminaMaxForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, level))
  return BASE_STAMINA_MAX + (clamped - 1) * STAMINA_PER_LEVEL
}

export function getLevelInfo(totalCorrect: number): LevelInfo {
  const level = levelFromCorrect(totalCorrect)
  const isMax = level >= MAX_LEVEL
  const currentThreshold = thresholdForLevel(level)
  const nextThreshold = isMax ? currentThreshold : thresholdForLevel(level + 1)
  const correctIntoLevel = totalCorrect - currentThreshold
  const correctNeededForLevel = isMax ? 0 : nextThreshold - currentThreshold
  const progressPct = isMax
    ? 100
    : Math.min(100, (correctIntoLevel / Math.max(1, correctNeededForLevel)) * 100)
  return {
    level,
    totalCorrect,
    staminaMax: staminaMaxForLevel(level),
    correctIntoLevel,
    correctNeededForLevel,
    nextLevelAt: nextThreshold,
    progressPct,
    isMax,
  }
}
