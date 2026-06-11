import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import type { Card, ChatMessage, Game, GameOver, Room, User } from '../types'
import { useNavigate } from 'react-router-dom'

const socket = io(import.meta.env.VITE_RENDER_URL || 'http://localhost:5000')

interface SocketContextInterface {
    rooms: Room[]
    game: Game | null
    message: string
    messageState: boolean
    gameOver: GameOver | null
    chatMessages: ChatMessage[]
    sendChat(text: string): void
    getRooms(): void
    registerOnSockets(user: User): void
    joinRoom(roomID: string): void
    leaveRoom(): void
    triggerStart(): void
    setTeam(team: number): void
    playHand(hand: Card[], myIndex: number): void
    offerDavi(): void
    respondDavi(action: 'accept' | 'decline' | 'challenge'): void
    dismissGameOver(): void
    rematch(): void
}

const SocketContext = createContext<SocketContextInterface | undefined>(undefined)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [rooms, setRooms] = useState<Room[]>([])
    const [game, setGame] = useState<Game | null>(null)
    const [isRegistered, setIsRegistered] = useState(false)

    const [message, setMessage] = useState<string>('')
    const [messageState, setMessageState] = useState<boolean>(false)
    const [gameOver, setGameOver] = useState<GameOver | null>(null)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

    // Last room this client joined, so we can auto-rejoin on a reconnect and
    // let the server clear our disconnected flag / resume a paused game.
    const joinedRoomRef = useRef<string | null>(null)

    const navigate = useNavigate()

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected!')

            const savedUser = localStorage.getItem('user')
            if (savedUser) {
                const user = JSON.parse(savedUser)
                socket.emit('user-registered', user)
                setIsRegistered(true)

                if (joinedRoomRef.current) {
                    socket.emit('join-room', joinedRoomRef.current)
                }
            }
        })

        socket.on('room-list', (rooms: Room[]) => {
            setRooms(rooms)
        })

        socket.on('game-data', (data: Game) => {
            setGame(data)
        })

        socket.on('start-game', (roomID: string) => {
            setGameOver(null)
            navigate(`/game/${roomID}`)
        })

        socket.on('message', (message: string) => {
            setMessage(message)
            setMessageState(!!message)
        })

        socket.on('chat-message', (message: ChatMessage) => {
            setChatMessages((prev) => [...prev, message])
        })

        socket.on('game-aborted', () => {
            joinedRoomRef.current = null
            setGame(null)
            setMessage('')
            setMessageState(false)
            setChatMessages([])
            navigate('/')
        })

        socket.on('game-over', (data: GameOver) => {
            // Keep joinedRoomRef so 'Rematch' can navigate back to this room's lobby.
            setMessage('')
            setMessageState(false)
            setGameOver(data)
        })

        return () => {
            socket.off('connect')
            socket.off('room-list')
            socket.off('game-data')
            socket.off('start-game')
            socket.off('message')
            socket.off('chat-message')
            socket.off('game-aborted')
            socket.off('game-over')
        }
    }, [])

    const getRooms = () => socket.emit('get-room-list')

    const sendChat = (text: string) => {
        const trimmed = text.trim()
        if (!trimmed) return
        socket.emit('chat-message', trimmed)
    }

    const registerOnSockets = (user: User) => {
        socket.emit('user-registered', user)
        setIsRegistered(true)
    }

    const joinRoom = (roomID: string) => {
        const user = localStorage.getItem('user')
        if (!user) {
            alert('MUST BE REGISTERED')
            return
        }

        if (!isRegistered) {
            const userData = JSON.parse(user)
            socket.emit('user-registered', userData)
            setIsRegistered(true)
        }

        joinedRoomRef.current = roomID
        socket.emit('join-room', roomID)
    }

    const triggerStart = () => {
        socket.emit('start-triggered')
    }

    const setTeam = (team: number) => {
        socket.emit('set-team', team)
    }

    const leaveRoom = () => {
        joinedRoomRef.current = null
        socket.emit('leave-room')
    }

    const playHand = (hand: Card[], myIndex: number) => {
        if (hand.length === 0) return

        const sameSuite = hand.every((e) => e.suite === hand[0].suite)
        const firstToPlay = game!.players.every((p) => p.played.length === 0)
        
        const prevIndex = (((myIndex - 1) % 4) + 4) % 4
        const prevPlayedCount = game!.players[prevIndex].played.length
        
        if (!firstToPlay && hand.length !== prevPlayedCount) {
            alert('You must play same number of cards!')
            return
        }

        if (firstToPlay && !sameSuite) {
            alert('You must play same suite cards!')
            return
        }

        socket.emit('hand-played', hand)
    }

    const offerDavi = () => {
        socket.emit('davi-offer')
    }

    const respondDavi = (action: 'accept' | 'decline' | 'challenge') => {
        socket.emit('davi-respond', action)
    }

    const dismissGameOver = () => {
        setGameOver(null)
        leaveRoom()
        setGame(null)
        navigate('/')
    }

    const rematch = () => {
        const roomID = joinedRoomRef.current ?? game?.id
        setGameOver(null)
        if (roomID) navigate(`/lobby/${roomID}`)
        else navigate('/')
    }

    return <SocketContext.Provider value={{ rooms, game, message, messageState, gameOver, chatMessages, sendChat, getRooms, registerOnSockets, joinRoom, leaveRoom, triggerStart, setTeam, playHand, offerDavi, respondDavi, dismissGameOver, rematch }}>{children}</SocketContext.Provider>
}

export const useSockets = (): SocketContextInterface => {
    const context = useContext(SocketContext)
    if (!context) throw new Error('useSockets must be used within a SocketProvider')
    return context
}
