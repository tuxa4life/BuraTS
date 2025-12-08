import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import type { Card, Game, Room, User } from '../types'
import { useNavigate } from 'react-router-dom'

const socket = io(import.meta.env.VITE_RENDER_URL || 'http://localhost:5000')

interface SocketContextInterface {
    rooms: Room[],
    game: Game | null
    getRooms(): void
    registerOnSockets(user: User): void
    joinRoom(roomID: string): void
    leaveRoom(): void
    triggerStart(): void
    playHand(hand: Card[]): void
}

const SocketContext = createContext<SocketContextInterface | undefined>(undefined)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [rooms, setRooms] = useState<Room[]>([])
    const [game, setGame] = useState<Game | null>(null)
    const [isRegistered, setIsRegistered] = useState(false)

    const navigate = useNavigate()

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected!')

            const savedUser = localStorage.getItem('user')
            if (savedUser) {
                const user = JSON.parse(savedUser)
                socket.emit('user-registered', user)
                setIsRegistered(true)
            }
        })

        socket.on('room-list', (rooms: Room[]) => {
            setRooms(rooms)
        })

        socket.on('game-data', (data: Game) => {
            setGame(data)
        })

        socket.on('start-game', (roomID: string) => {
            navigate(`/game/${roomID}`)
        })

        return () => {
            socket.off('connect')
            socket.off('room-list')
            socket.off('game-data')
        }
    }, [])

    const getRooms = () => socket.emit('get-room-list')
    
    const registerOnSockets = (user: User) => {
        socket.emit('user-registered', user)
        setIsRegistered(true)
    }

    const joinRoom = (roomID: string) => {
        const user = localStorage.getItem('user')
        if(!user) {
            alert('MUST BE REGISTERED')
            return
        }

        if (!isRegistered) {
            const userData = JSON.parse(user)
            socket.emit('user-registered', userData)
            setIsRegistered(true)
        }

        socket.emit('join-room', roomID)
    }

    const triggerStart = () => {
        socket.emit('start-triggered')
    }

    const leaveRoom = () => {
        socket.emit('leave-room')
    }

    const playHand = (hand: Card[]) => {
        socket.emit('hand-played', hand)
    }

    return <SocketContext.Provider value={{ rooms, game, getRooms, registerOnSockets, joinRoom, leaveRoom, triggerStart, playHand }}>{children}</SocketContext.Provider>
}

export const useSockets = (): SocketContextInterface => {
    const context = useContext(SocketContext)
    if (!context) throw new Error('useSockets must be used within a SocketProvider')
    return context
}