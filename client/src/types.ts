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
    davi: {
        last: number | undefined,
        acceptState: {
            playerOne: boolean | undefined,
            playerTwo: boolean | undefined
        }
    }
}

export type Player = {
    id: string,
    picture: string,
    username: string,
    hand: Card[],
    played: Card[],
    taken: Card[],
    points: number
}

export type Suite = 'spades' | 'hearts' | 'clubs' | 'diamonds'
export type Card = {
    suite: Suite,
    value: string,
    name: string
}
