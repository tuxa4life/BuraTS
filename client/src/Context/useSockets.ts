import { createContext, useContext } from 'react'
import type { Card, ChatMessage, Game, GameOver, Room, User } from '../types'

export interface SocketContextInterface {
    connected: boolean
    rooms: Room[]
    game: Game | null
    message: string
    gameOver: GameOver | null
    chatMessages: ChatMessage[]
    sendChat(text: string): void
    getRooms(): void
    registerOnSockets(user: User): void
    joinRoom(roomID: string): void
    leaveRoom(mode?: 'step-away' | 'quit'): void
    triggerStart(): void
    setTeam(team: number): void
    playHand(hand: Card[], myIndex: number): void
    offerDavi(): void
    respondDavi(action: 'accept' | 'decline' | 'challenge'): void
    dismissGameOver(): void
    rematch(): void
}

export const SocketContext = createContext<SocketContextInterface | undefined>(undefined)

export const useSockets = (): SocketContextInterface => {
    const context = useContext(SocketContext)
    if (!context) throw new Error('useSockets must be used within a SocketProvider')
    return context
}
