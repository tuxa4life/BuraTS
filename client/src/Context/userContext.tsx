import { createContext, useContext, useState } from 'react'

type User = {
    id: string
    username: string
    picture: string
}

interface UserContextType {
    user: User | null
    isLoggedIn: boolean
    setUser(user: User): void
}

const UserContext = createContext<UserContextType | null>(null)

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser_] = useState<User | null>(() => {
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    })

    const isLoggedIn = !!user

    const setUser = (user: User | null): void => {
        if (user) localStorage.setItem('user', JSON.stringify(user))
        else localStorage.removeItem('user')

        setUser_(user)
    }

    return <UserContext.Provider value={{ user, isLoggedIn, setUser }}>{children}</UserContext.Provider>
}

export const useUser = () => {
    const context = useContext(UserContext)
    if (!context) throw new Error('useUser must be used inside provider')

    return context
}
