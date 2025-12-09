// Entities
export type Player = {
    id: string,
    picture: string,
    username: string,
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
}

// Cards
export enum Suite { spades = 'spades', hearts = 'hearts', clubs = 'clubs', diamonds = 'diamonds' }
export type Card = {
    suite: Suite,
    value: string,
    name: string
}

