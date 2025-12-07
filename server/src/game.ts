import type { Socket } from 'socket.io'
import { type Room, type Player } from '../types.js'

const createRoom = (id: string): Room => {
    const room = {
        id,
        players: [],
        deck: [],
        turn: null,
        trump: null,
        multiplier: 1,
    }

    return room
}

const createPlayer = (id: string, username: string, picture: string): Player => {
    const player = {
        id,
        username,
        picture,
        hand: [],
        played: [],
        taken: [],
        points: 0,
    }

    return player
}

const playerJoin = (socket: Socket, roomID: string, rooms: Record<string, Room>): void => {
    if (!rooms[roomID]) rooms[roomID] = createRoom(roomID)

    const exists = rooms[roomID].players.some((player: Player) => socket.data.id && player.id === socket.id)
    if (exists) return

    rooms[roomID].players.push(createPlayer(socket.data.id, socket.data.username, socket.data.picture))
    socket.join(roomID)
    socket.data.roomID = roomID
}

const leaveRoom = (socket: Socket, rooms: Record<string, Room>) => {
    const id = socket.data.id
    const roomID = socket.data.roomID
    const room = rooms[roomID]

    if (room && room.players.find(p => p.id === id)) {
        room.players = room.players.filter((player: Player) => player.id !== id)
        socket.leave(roomID)
        if (room.players.length === 0) delete rooms[roomID]
    }
}

const disconnectPlayer = (socket: Socket, rooms: Record<string, Room>) => {
    Object.keys(rooms).forEach((roomID) => {
        const room = rooms[roomID]
        if (!room) return

        const wasInRoom = room.players.some((p) => p.id === socket.data.id)
        room.players = room.players.filter((p) => p.id !== socket.data.id)
        if (wasInRoom) socket.leave(roomID)
        if (room.players.length === 0) delete rooms[roomID]
    })
}

const getRooms = (rooms: Record<string, Room>) => {
    const output = Object.keys(rooms).map((key) => {
        return {
            id: key,
            playerCount: rooms[key]?.players.length,
        }
    })

    return output
}

const startGame = (room: Room) => {
    if (!room) return

    // TODO: set player hands and other attributes

    room.deck = ['SET THIS']
    room.turn = 0
    room.trump = 'SET THIS'
    room.multiplier = 1
}

export { getRooms, playerJoin, leaveRoom, disconnectPlayer, startGame }
