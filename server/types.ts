// Entities
export type Player = {
    id: string,
    picture: string,
    username: string,
    hand: string[],
    played: string[],
    taken: string[],
    points: number
}

export type Room = {
    id: string,
    players: Player[],
    deck: string[],
    turn: number | null,
    trump: string | null,
    multiplier: number
}

// Cards
export enum Suite { spades = 'spades', heart = 'heart', clubs = 'clubs', diamonds = 'diamonds' }
export type Card = {
    suite: Suite,
    value: string,
    name: string
}

