import type { User } from '../types'

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
