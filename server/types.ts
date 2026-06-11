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

// Wire format. What a single client is allowed to see: it gets its own hand,
// only counts for everyone else's hand and the deck, and no taken piles. This
// is the contract mirrored by client/src/types.ts — keep the two in sync.
export type PlayerView = Omit<Player, 'hand' | 'taken'> & {
    hand: Card[]        // full for the viewer, [] for everyone else
    handCount: number
}

export type GameView = Omit<Room, 'players' | 'deck'> & {
    players: PlayerView[]
    deckCount: number
}

// Cards
export enum Suite { spades = 'spades', hearts = 'hearts', clubs = 'clubs', diamonds = 'diamonds' }
export type Card = {
    suite: Suite,
    value: string,
    name: string
}

