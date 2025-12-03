// Entities
type Player = {
    id: string,
    name: string,
    hand: string[],
    played: string[],
    taken: string[],
    points: number
}

type Room = {
    id: string,
    players: Player[],
    deck: string[],
    turn: number | null,
    trump: number | null,
    multiplier: number
}

// Cards
enum Suite { spades, heart, clubs, diamonds }
type Card = {
    suite: Suite,
    value: string,
    getName(): string
}

