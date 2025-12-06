import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSockets } from './socketContext'
import type { User } from '../types'

interface UserContextInterface {
    user: User | null
    isLoggedIn: boolean
    setUser(user: User): void
    logOut(): void
}

const UserContext = createContext<UserContextInterface | null>(null)

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { registerOnSockets } = useSockets()
    const navigate = useNavigate()
    
    const [user, setUser_] = useState<User | null>(() => {
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    })
    const isLoggedIn = !!user

    const setUser = (user: User | null): void => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
            registerOnSockets(user)
        }
        else localStorage.removeItem('user')
        
        setUser_(user)
    }

    const logOut = (): void => {
        setUser_(null)
        localStorage.removeItem('user')
        navigate('/login')
    }

    return <UserContext.Provider value={{ user, isLoggedIn, setUser, logOut }}>{children}</UserContext.Provider>
}

export const useUser = () => {
    const context = useContext(UserContext)
    if (!context) throw new Error('useUser must be used inside provider')

    return context
}
