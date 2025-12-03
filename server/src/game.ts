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

const createPlayer = (id: string, name: string): Player => {
    const player = {
        id,
        name,
        hand: [],
        played: [],
        taken: [],
        points: 0,
    }

    return player
}
