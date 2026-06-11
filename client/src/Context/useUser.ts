import { createContext, useContext } from 'react'
import type { User } from '../types'

export interface UserContextInterface {
    user: User | null
    isLoggedIn: boolean
    setUser(user: User): void
    logOut(): void
}

export const UserContext = createContext<UserContextInterface | null>(null)

export const useUser = () => {
    const context = useContext(UserContext)
    if (!context) throw new Error('useUser must be used inside provider')

    return context
}
