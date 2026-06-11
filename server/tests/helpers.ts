import { Suite, type Card, type Player, type Room } from '../types.js'

export const c = (suite: Suite, value: string): Card => ({ suite, value, name: `${suite}_${value}` })

export const makePlayer = (i: number): Player => ({
    id: `p${i}`,
    username: `P${i}`,
    picture: '',
    team: i % 2,
    hand: [],
    played: [],
    taken: [],
    points: 0,
})

// A started 4-player room with hearts as trump. Hands/deck are left empty so
// each test sets up exactly the state it asserts on.
export const makeRoom = (): Room => ({
    id: 'test-room',
    players: [makePlayer(0), makePlayer(1), makePlayer(2), makePlayer(3)],
    deck: [],
    turn: 0,
    trump: c(Suite.hearts, '6'),
    lastWinner: 0,
    multiplier: 1,
    started: true,
    paused: false,
    disconnected: [],
    pauseEndsAt: undefined,
    davi: { pending: false, from: undefined, to: undefined, level: 0 },
})
