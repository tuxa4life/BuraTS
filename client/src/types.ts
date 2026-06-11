export type User = {
    id: string
    username: string
    picture: string
}

export type Room = {
    id: string
    playerCount: number
}

export type Game = {
    id: string,
    players: Player[],
    deck: Card[],
    turn: number | null,
    trump: Card | null,
    lastWinner: number
    multiplier: number,
    started: boolean,
    paused: boolean,
    disconnected: string[],
    pauseEndsAt: number | null,
    davi: {
        pending: boolean,
        from: number | undefined,
        to: number | undefined,
        level: number
    }
}

export type Player = {
    id: string,
    picture: string,
    username: string,
    team: number,
    hand: Card[],
    played: Card[],
    taken: Card[][],
    points: number
}

export type GameOverTeam = {
    names: (string | undefined)[]
    points: number
}

export type GameOver = {
    message: string
    teams: GameOverTeam[]
}

export type ChatMessage = {
    id: string
    senderId: string
    username: string
    picture: string
    text: string
    at: number
}

export type Suite = 'spades' | 'hearts' | 'clubs' | 'diamonds'
export type Card = {
    suite: Suite,
    value: string,
    name: string
}
