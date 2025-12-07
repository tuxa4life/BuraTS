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
    deck: string[],
    turn: number | null,
    trump: number | null,
    multiplier: number
}

export type Player = {
    id: string,
    picture: string,
    username: string,
    hand: string[],
    played: string[],
    taken: string[],
    points: number
}

export type Suite = 'spades' | 'heart' | 'clubs' | 'diamonds'
export type Card = {
    suite: Suite,
    value: string,
    name: string
}
