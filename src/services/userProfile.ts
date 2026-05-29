const KEY = 'galaxylearn-user-profile-v1'

export interface UserProfile {
  name: string
  createdAt: number
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    if (typeof parsed?.name === 'string' && parsed.name.trim()) {
      return {
        name: parsed.name.trim(),
        createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function saveProfile(name: string): UserProfile {
  const trimmed = name.trim().slice(0, 40)
  const profile: UserProfile = {
    name: trimmed,
    createdAt: loadProfile()?.createdAt ?? Date.now(),
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    /* ignore quota */
  }
  return profile
}

export function clearProfile() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
