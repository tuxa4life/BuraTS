import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import type { Game, Room } from '../types'

const socket = io(import.meta.env.VITE_RENDER_URL || 'http://localhost:5000')

interface SocketContextInterface {
    rooms: Room[],
    game: Game | null
    getRooms(): void
    registerOnSockets(id: string): void
    joinRoom(roomID: string): void
    leaveRoom(roomID: string): void
}

const SocketContext = createContext<SocketContextInterface | undefined>(undefined)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [rooms, setRooms] = useState<Room[]>([])
    const [game, setGame] = useState<Game | null>(null)

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected!')

            const savedUser = localStorage.getItem('user')
            if (savedUser) {
                const user = JSON.parse(savedUser)
                socket.emit('user-registered', user.id)
            }
        })

        socket.on('room-list', (rooms: Room[]) => {
            setRooms(rooms)
        })

        socket.on('game-data', (data: Game) => {
            setGame(data)
        })

        return () => {
            socket.off('connect')
            socket.off('room-list')
        }
    }, [])

    const getRooms = () => socket.emit('get-room-list')
    const registerOnSockets = (id: string) => {
        if (socket.connected) {
            socket.emit('user-registered', id)
        }
    }

    const joinRoom = (roomID: string) => {
        const user = localStorage.getItem('user')
        if(!user) {
            alert('MUST BE REGISTERED')
            return
        }

        socket.emit('join-room', { roomID, user: JSON.parse(user) })
    }

    const leaveRoom = (roomID: string) => {
        socket.emit('leave-room', roomID)
    }

    return <SocketContext.Provider value={{ rooms, game, getRooms, registerOnSockets, joinRoom, leaveRoom }}>{children}</SocketContext.Provider>
}

export const useSockets = (): SocketContextInterface => {
    const context = useContext(SocketContext)
    if (!context) throw new Error('useSockets must be used within a SocketProvider')
    return context
}
