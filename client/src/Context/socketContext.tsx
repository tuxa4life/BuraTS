import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import type { Card, ChatMessage, Game, GameOver, Room, User } from '../types'
import { useNavigate } from 'react-router-dom'
import { loadStoredUser } from '../utils/storage'
import { SocketContext } from './useSockets'

const socket = io(import.meta.env.VITE_RENDER_URL || 'http://localhost:5000')

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    // Whether the socket currently has a live connection to the server. The
    // app gates all routes on this — the Render-hosted server cold-starts, so
    // the first connection can take a while.
    const [connected, setConnected] = useState(socket.connected)

    const [rooms, setRooms] = useState<Room[]>([])
    const [game, setGame] = useState<Game | null>(null)
    const [message, setMessage] = useState<string>('')
    const [gameOver, setGameOver] = useState<GameOver | null>(null)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

    // Whether this socket has sent 'user-registered'. A ref, not state: nothing
    // renders it, and keeping it out of state keeps joinRoom's identity stable.
    const registeredRef = useRef(false)

    // Last room this client joined, so we can auto-rejoin on a reconnect and
    // let the server clear our disconnected flag / resume a paused game.
    const joinedRoomRef = useRef<string | null>(null)

    const navigate = useNavigate()

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected!')
            setConnected(true)

            const user = loadStoredUser()
            if (user) {
                socket.emit('user-registered', user)
                registeredRef.current = true

                if (joinedRoomRef.current) {
                    socket.emit('join-room', joinedRoomRef.current)
                }
            }
        })

        socket.on('disconnect', () => {
            setConnected(false)
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
        })

        socket.on('chat-message', (message: ChatMessage) => {
            setChatMessages((prev) => [...prev, message])
        })

        socket.on('game-aborted', () => {
            joinedRoomRef.current = null
            setGame(null)
            setMessage('')
            setChatMessages([])
            navigate('/')
        })

        socket.on('game-over', (data: GameOver) => {
            // Keep joinedRoomRef so 'Rematch' can navigate back to this room's lobby.
            setMessage('')
            setGameOver(data)
        })

        return () => {
            socket.off('connect')
            socket.off('disconnect')
            socket.off('room-list')
            socket.off('game-data')
            socket.off('start-game')
            socket.off('message')
            socket.off('chat-message')
            socket.off('game-aborted')
            socket.off('game-over')
        }
    }, [navigate])

    const getRooms = useCallback(() => socket.emit('get-room-list'), [])

    const sendChat = useCallback((text: string) => {
        const trimmed = text.trim()
        if (!trimmed) return
        socket.emit('chat-message', trimmed)
    }, [])

    const registerOnSockets = useCallback((user: User) => {
        socket.emit('user-registered', user)
        registeredRef.current = true
    }, [])

    const joinRoom = useCallback((roomID: string) => {
        const user = loadStoredUser()
        if (!user) {
            alert('MUST BE REGISTERED')
            return
        }

        if (!registeredRef.current) {
            socket.emit('user-registered', user)
            registeredRef.current = true
        }

        // Entering a different room: the previous room's chat does not belong there.
        if (joinedRoomRef.current !== roomID) setChatMessages([])

        joinedRoomRef.current = roomID
        socket.emit('join-room', roomID)
    }, [])

    const triggerStart = useCallback(() => {
        socket.emit('start-triggered')
    }, [])

    const setTeam = useCallback((team: number) => {
        socket.emit('set-team', team)
    }, [])

    // mode is forwarded to the server: 'step-away' (default) keeps your seat in
    // a started game so you can rejoin; 'quit' forfeits and ends it for everyone.
    const leaveRoom = useCallback((mode?: 'step-away' | 'quit') => {
        joinedRoomRef.current = null
        socket.emit('leave-room', mode)
        // Drop everything tied to the room we just left so a later lobby/game
        // doesn't briefly render the previous room's state.
        setGame(null)
        setMessage('')
        setChatMessages([])
    }, [])

    // Client-side checks are UX only (instant feedback) — the server runs the
    // same rules authoritatively and rejects anything invalid.
    const playHand = useCallback((hand: Card[], myIndex: number) => {
        if (!game || hand.length === 0) return

        const sameSuite = hand.every((e) => e.suite === hand[0].suite)
        const firstToPlay = game.players.every((p) => p.played.length === 0)

        const prevIndex = (((myIndex - 1) % 4) + 4) % 4
        const prevPlayedCount = game.players[prevIndex].played.length

        if (!firstToPlay && hand.length !== prevPlayedCount) {
            alert('You must play same number of cards!')
            return
        }

        if (firstToPlay && !sameSuite) {
            alert('You must play same suite cards!')
            return
        }

        socket.emit('hand-played', hand)
    }, [game])

    const offerDavi = useCallback(() => {
        socket.emit('davi-offer')
    }, [])

    const respondDavi = useCallback((action: 'accept' | 'decline' | 'challenge') => {
        socket.emit('davi-respond', action)
    }, [])

    const dismissGameOver = useCallback(() => {
        setGameOver(null)
        leaveRoom()
        navigate('/')
    }, [leaveRoom, navigate])

    const rematch = useCallback(() => {
        const roomID = joinedRoomRef.current ?? game?.id
        setGameOver(null)
        if (roomID) navigate(`/lobby/${roomID}`)
        else navigate('/')
    }, [game, navigate])

    const value = useMemo(
        () => ({ connected, rooms, game, message, gameOver, chatMessages, sendChat, getRooms, registerOnSockets, joinRoom, leaveRoom, triggerStart, setTeam, playHand, offerDavi, respondDavi, dismissGameOver, rematch }),
        [connected, rooms, game, message, gameOver, chatMessages, sendChat, getRooms, registerOnSockets, joinRoom, leaveRoom, triggerStart, setTeam, playHand, offerDavi, respondDavi, dismissGameOver, rematch]
    )

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
