// Entities
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

export type Room = {
    id: string,
    players: Player[],
    deck: Card[],
    turn: number | null,
    trump: Card | undefined,
    lastWinner: number
    multiplier: number
    started: boolean
    paused: boolean
    disconnected: string[]
    pauseEndsAt: number | undefined
    davi: {
        pending: boolean,        // an offer is awaiting a response
        from: number | undefined, // index of the player who offered/raised
        to: number | undefined,   // index of the challenged player who must respond
        level: number            // the offered multiplier level (2..11), 0 when idle
    }
}

// Cards
export enum Suite { spades = 'spades', hearts = 'hearts', clubs = 'clubs', diamonds = 'diamonds' }
export type Card = {
    suite: Suite,
    value: string,
    name: string
}

