import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSockets } from './useSockets'
import type { User } from '../types'
import { clearStoredUser, loadStoredUser, saveStoredUser } from '../utils/storage'
import { UserContext } from './useUser'

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { registerOnSockets } = useSockets()
    const navigate = useNavigate()
    
    const [user, setUser_] = useState<User | null>(loadStoredUser)
    const isLoggedIn = !!user

    const setUser = (user: User | null): void => {
        if (user) {
            saveStoredUser(user)
            registerOnSockets(user)
        }
        else clearStoredUser()

        setUser_(user)
    }

    const logOut = (): void => {
        setUser_(null)
        clearStoredUser()
        navigate('/login')
    }

    return <UserContext.Provider value={{ user, isLoggedIn, setUser, logOut }}>{children}</UserContext.Provider>
}
