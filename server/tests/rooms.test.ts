import { describe, it, expect } from 'vitest'
import type { Socket } from 'socket.io'
import { getRooms, playerJoin, leaveRoom } from '../src/rooms.js'
import { Suite, type Room } from '../types.js'
import { c, makeRoom } from './helpers.js'

// Minimal stand-in for a socket.io Socket: just the bits playerJoin/leaveRoom
// touch (data + join/leave). Tracks which socket.io rooms it belongs to.
const mockSocket = (id: string) => {
    const joined = new Set<string>()
    const socket = {
        data: { id, username: id.toUpperCase(), picture: '' } as Record<string, unknown>,
        join: (room: string) => { joined.add(room) },
        leave: (room: string) => { joined.delete(room) },
    }
    return { socket: socket as unknown as Socket, joined }
}

describe('getRooms', () => {
    it('summarises every room with id, count, started flag and members', () => {
        const started = makeRoom() // 4 players, started: true
        const lobby: Room = { ...makeRoom(), id: 'lobby', started: false, players: makeRoom().players.slice(0, 2) }

        const out = getRooms({ [started.id]: started, lobby: lobby })

        const startedSummary = out.find((r) => r.id === started.id)!
        expect(startedSummary.started).toBe(true)
        expect(startedSummary.playerCount).toBe(4)
        expect(startedSummary.players).toEqual([
            { id: 'p0', username: 'P0', picture: '' },
            { id: 'p1', username: 'P1', picture: '' },
            { id: 'p2', username: 'P2', picture: '' },
            { id: 'p3', username: 'P3', picture: '' },
        ])

        const lobbySummary = out.find((r) => r.id === 'lobby')!
        expect(lobbySummary.started).toBe(false)
        expect(lobbySummary.playerCount).toBe(2)
        expect(lobbySummary.players).toHaveLength(2)
    })

    it('never leaks hands, deck, taken piles or points into the summary', () => {
        const room = makeRoom()
        room.players[0]!.hand = [c(Suite.spades, 'A'), c(Suite.clubs, 'K')]
        room.players[0]!.taken = [[c(Suite.hearts, 'A')]]
        room.players[0]!.points = 30
        room.deck = [c(Suite.diamonds, '6')]

        const summary = getRooms({ [room.id]: room })[0]!
        const member = summary.players[0]! as Record<string, unknown>

        expect(member).not.toHaveProperty('hand')
        expect(member).not.toHaveProperty('taken')
        expect(member).not.toHaveProperty('points')
        expect(summary).not.toHaveProperty('deck')
    })

    it('returns an empty list when there are no rooms', () => {
        expect(getRooms({})).toEqual([])
    })
})

describe('room membership', () => {
    it('seats a joining player and records the room on the socket', () => {
        const rooms: Record<string, Room> = {}
        const { socket, joined } = mockSocket('alice')

        playerJoin(socket, 'A', rooms)

        expect(rooms['A']!.players.map((p) => p.id)).toEqual(['alice'])
        expect(socket.data.roomID).toBe('A')
        expect(joined.has('A')).toBe(true)
    })

    it('does not seat the same player twice in one room', () => {
        const rooms: Record<string, Room> = {}
        const { socket } = mockSocket('alice')

        playerJoin(socket, 'A', rooms)
        playerJoin(socket, 'A', rooms)

        expect(rooms['A']!.players).toHaveLength(1)
    })

    it('removes a player on leave and tears the room down when it empties', () => {
        const rooms: Record<string, Room> = {}
        const { socket, joined } = mockSocket('alice')

        playerJoin(socket, 'A', rooms)
        leaveRoom(socket, rooms)

        expect(rooms['A']).toBeUndefined()
        expect(socket.data.roomID).toBeUndefined()
        expect(joined.has('A')).toBe(false)
    })

    it('leaves a player in exactly one room when moving lobbies', () => {
        // Mirrors the server's one-room enforcement: leave the old lobby before
        // joining the new one, so a player is never seated in two rooms at once.
        const rooms: Record<string, Room> = {}
        const { socket } = mockSocket('alice')

        playerJoin(socket, 'A', rooms)
        leaveRoom(socket, rooms)
        playerJoin(socket, 'B', rooms)

        expect(rooms['A']).toBeUndefined()
        expect(rooms['B']!.players.map((p) => p.id)).toEqual(['alice'])
        expect(socket.data.roomID).toBe('B')
    })
})
