import { createContext, useContext, useEffect } from 'react'
import { io } from 'socket.io-client'

const socket = io('http://localhost:5000')

const SocketContext = createContext(null)
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected!')
        })

        socket.on('test', (data) => {
            console.log(data)
        })

        return () => {
            socket.off('connect')
            socket.off('test')
        }
    }, [])

    const data = null
    return <SocketContext.Provider value={data}>
        {children}
    </SocketContext.Provider>
}

export const useSockets = () => useContext(SocketContext)