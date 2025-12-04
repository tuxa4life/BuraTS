import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import type { Room } from '../types'

const socket = io(import.meta.env.VITE_RENDER_URL || 'http://localhost:5000')

interface SocketContextInterface {
    rooms: Room[]
    getRooms(): void
}

const SocketContext = createContext<SocketContextInterface | undefined>(undefined)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [rooms, setRooms] = useState<Room[]>([])

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected!')
        })

        socket.on('test', (data) => {
            console.log(data)
        })

        socket.on('room-list', (rooms: Room[]) => {
            setRooms(rooms)
        })

        return () => {
            socket.off('connect')
            socket.off('test')
        }
    }, [])

    const getRooms = () => socket.emit('get-room-list')

    return (
        <SocketContext.Provider value={{ rooms, getRooms }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSockets = (): SocketContextInterface => {
    const context = useContext(SocketContext)
    if (!context) throw new Error('useSockets must be used within a SocketProvider')
    return context
}
