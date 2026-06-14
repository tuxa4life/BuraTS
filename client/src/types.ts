export type User = {
    id: string
    username: string
    picture: string
}

// Menu-level room summary (mirrors getRooms in server/src/rooms.ts). `started`
// separates open lobbies from in-progress games; `players` lets the client tell
// which rooms the current user belongs to so it can offer a Rejoin instead of Join.
export type Room = {
    id: string
    playerCount: number
    started: boolean
    players: { id: string; username: string; picture: string }[]
}

// Mirrors the server's wire format (GameView/PlayerView in server/types.ts):
// the server only ever sends this client's own hand and counts for everything
// hidden (other hands, the deck) — keep the two files in sync.
export type Game = {
    id: string,
    players: Player[],
    deckCount: number,
    turn: number | null,
    trump: Card | undefined,
    lastWinner: number
    multiplier: number,
    started: boolean,
    paused: boolean,
    disconnected: string[],
    pauseEndsAt: number | undefined,
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
    hand: Card[],      // full for yourself, [] for everyone else
    handCount: number,
    played: Card[],
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
