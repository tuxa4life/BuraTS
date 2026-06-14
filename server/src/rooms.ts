import type { Socket } from 'socket.io'
import type { GameView, Player, Room } from '../types.js'

// Projects the room onto what one client may see. Hands other than the
// viewer's own and the deck order are redacted to counts, so reading the
// socket payload in devtools reveals nothing the player couldn't see at a
// real table. The server's `room` stays the only complete state.
const viewFor = (room: Room, viewerId: string | undefined): GameView => ({
    id: room.id,
    turn: room.turn,
    trump: room.trump,
    lastWinner: room.lastWinner,
    multiplier: room.multiplier,
    started: room.started,
    paused: room.paused,
    disconnected: room.disconnected,
    pauseEndsAt: room.pauseEndsAt,
    davi: room.davi,
    deckCount: room.deck.length,
    players: room.players.map((p) => ({
        id: p.id,
        username: p.username,
        picture: p.picture,
        team: p.team,
        points: p.points,
        played: p.played,
        handCount: p.hand.length,
        hand: p.id === viewerId ? p.hand : [],
    })),
})

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

// Public room summary for the menu. Exposes `started` (lobby vs in-progress)
// and a minimal member list so the client can tell which rooms the viewer
// belongs to (→ a "Rejoin" affordance) and which are open lobbies to join.
// No game state (hands, deck, points) leaks here — just who is seated.
const getRooms = (rooms: Record<string, Room>) => {
    const output = Object.keys(rooms).map((key) => {
        const room = rooms[key]
        return {
            id: key,
            playerCount: room?.players.length ?? 0,
            started: room?.started ?? false,
            players: room?.players.map((p) => ({ id: p.id, username: p.username, picture: p.picture })) ?? [],
        }
    })

    return output
}

export { getRooms, playerJoin, leaveRoom, viewFor }