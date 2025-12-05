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

const playerJoin = (player: Player, roomID: string, rooms: Record<string, Room>): void => {
    if (!rooms[roomID]) rooms[roomID] = createRoom(roomID)
    rooms[roomID].players.push(createPlayer(player.id, player.username, player.picture))
}

const getRooms = (rooms: Record<string, Room>) => {
    const output = Object.keys(rooms).map((key) => {
        return {
            id: key, 
            playerCount: rooms[key]?.players.length
        }
    })

    return output
}

export { getRooms, playerJoin }