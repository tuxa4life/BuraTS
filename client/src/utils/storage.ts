import type { User } from '../types'
import type { Lang } from '../i18n/translations'

// Single safe accessor for the persisted user. A corrupted localStorage entry
// must never crash the app — it is dropped and treated as logged out.
export const loadStoredUser = (): User | null => {
    try {
        const raw = localStorage.getItem('user')
        return raw ? JSON.parse(raw) : null
    } catch {
        localStorage.removeItem('user')
        return null
    }
}

export const saveStoredUser = (user: User): void => {
    localStorage.setItem('user', JSON.stringify(user))
}

export const clearStoredUser = (): void => {
    localStorage.removeItem('user')
}

// The persisted UI language. Returns null when the user has never chosen one,
// so the provider can fall back to browser detection on first visit. A bad
// value is dropped rather than trusted.
export const loadStoredLang = (): Lang | null => {
    const raw = localStorage.getItem('lang')
    return raw === 'en' || raw === 'ka' ? raw : null
}

export const saveStoredLang = (lang: Lang): void => {
    localStorage.setItem('lang', lang)
}
