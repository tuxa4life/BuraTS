import type { Socket } from 'socket.io'
import type { Player, Room } from '../types.js'

const createRoom = (id: string): Room => {
    const room = {
        id,
        players: [],
        deck: [],
        turn: null,
        trump: undefined,
        multiplier: 1,
        lastWinner: 0,
        started: false,
        paused: false,
        disconnected: [],
        pauseEndsAt: undefined,
        davi: {
            pending: false,
            from: undefined,
            to: undefined,
            level: 0
        }
    }

    return room
}

const createPlayer = (id: string, username: string, picture: string, team: number): Player => {
    const player = {
        id,
        username,
        picture,
        team,
        hand: [],
        played: [],
        taken: [],
        points: 0,
    }

    return player
}

const playerJoin = (socket: Socket, roomID: string, rooms: Record<string, Room>): void => {
    if (!rooms[roomID]) rooms[roomID] = createRoom(roomID)

    const exists = rooms[roomID].players.some((player: Player) => socket.data.id && player.id === socket.data.id)
    if (exists) return

    // Auto-assign to the team with fewer players (ties go to team 0) so a full
    // room defaults to a balanced 2 v 2; players can switch sides in the lobby.
    const team0 = rooms[roomID].players.filter((p) => p.team === 0).length
    const team1 = rooms[roomID].players.filter((p) => p.team === 1).length
    const team = team0 <= team1 ? 0 : 1

    rooms[roomID].players.push(createPlayer(socket.data.id, socket.data.username, socket.data.picture, team))
    socket.join(roomID)
    socket.data.roomID = roomID
}

const leaveRoom = (socket: Socket, rooms: Record<string, Room>) => {
    const id = socket.data.id
    const roomID = socket.data.roomID
    const room = rooms[roomID]

    if (room && room.players.find((p) => p.id === id)) {
        room.players = room.players.filter((player: Player) => player.id !== id)
        socket.leave(roomID)
        socket.data.roomID = undefined
        if (room.players.length === 0) delete rooms[roomID]
    }
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

export { getRooms, playerJoin, leaveRoom }