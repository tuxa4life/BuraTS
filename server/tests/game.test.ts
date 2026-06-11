import { describe, it, expect } from 'vitest'
import { startGame, startRound, handlePlayedHand, resolveTrick, handleRoundOver, isBura, handleBura, offerDavi, respondDavi, resetRoomToLobby, validatePlay, applyPlay } from '../src/game.js'
import { Suite, type Card } from '../types.js'
import { c, makeRoom } from './helpers.js'

// Trump in makeRoom is hearts.
const trumps = (...values: string[]) => values.map((v) => c(Suite.hearts, v))

describe('startGame', () => {
    it('deals 5 cards to each player and initialises the round state', () => {
        const room = makeRoom()
        startGame(room)

        expect(room.started).toBe(true)
        expect(room.trump).toBeDefined()
        expect(room.deck).toHaveLength(16) // 36 - 4 * 5
        room.players.forEach((p) => {
            expect(p.hand).toHaveLength(5)
            expect(p.played).toHaveLength(0)
            expect(p.taken).toHaveLength(0)
            expect(p.points).toBe(0)
        })
    })
})

describe('validatePlay', () => {
    const setup = () => {
        const room = makeRoom()
        room.players[0]!.hand = [c(Suite.spades, '6'), c(Suite.spades, '7'), c(Suite.clubs, 'A'), c(Suite.diamonds, 'K'), c(Suite.hearts, '9')]
        room.players[1]!.hand = [c(Suite.clubs, '6'), c(Suite.clubs, '7'), c(Suite.spades, 'A'), c(Suite.diamonds, '8'), c(Suite.hearts, 'J')]
        return room
    }

    it('accepts a single-suited lead from the player on turn', () => {
        const room = setup()
        expect(validatePlay(room, 0, [c(Suite.spades, '6'), c(Suite.spades, '7')])).toBe(true)
    })

    it('rejects a mixed-suite lead', () => {
        const room = setup()
        expect(validatePlay(room, 0, [c(Suite.spades, '6'), c(Suite.clubs, 'A')])).toBe(false)
    })

    it('rejects a play out of turn', () => {
        const room = setup()
        expect(validatePlay(room, 1, [c(Suite.clubs, '6')])).toBe(false)
    })

    it('rejects cards the player does not hold', () => {
        const room = setup()
        expect(validatePlay(room, 0, [c(Suite.spades, 'A')])).toBe(false)
    })

    it('rejects playing one held card twice', () => {
        const room = setup()
        expect(validatePlay(room, 0, [c(Suite.spades, '6'), c(Suite.spades, '6')])).toBe(false)
    })

    it('rejects an empty play', () => {
        const room = setup()
        expect(validatePlay(room, 0, [])).toBe(false)
    })

    it('rejects a second play into the same trick', () => {
        const room = setup()
        room.players[0]!.played = [c(Suite.diamonds, 'K')]
        expect(validatePlay(room, 0, [c(Suite.spades, '6')])).toBe(false)
    })

    it('requires a follow to match the lead card count', () => {
        const room = setup()
        room.players[0]!.played = [c(Suite.spades, '6'), c(Suite.spades, '7')]
        room.turn = 1

        expect(validatePlay(room, 1, [c(Suite.clubs, '6')])).toBe(false)
        // Follows may mix suites — only the count must match.
        expect(validatePlay(room, 1, [c(Suite.clubs, '6'), c(Suite.spades, 'A')])).toBe(true)
    })

    it('rejects any play while paused or while a davi offer is pending', () => {
        const paused = setup()
        paused.paused = true
        expect(validatePlay(paused, 0, [c(Suite.spades, '6')])).toBe(false)

        const davi = setup()
        davi.davi.pending = true
        expect(validatePlay(davi, 0, [c(Suite.spades, '6')])).toBe(false)
    })

    it('accepts a genuine Bura even when the count does not match the lead', () => {
        const room = setup()
        room.players[0]!.played = [c(Suite.spades, '6')]
        room.turn = 1
        room.players[1]!.hand = trumps('6', '7', '8', '9', '10')
        expect(validatePlay(room, 1, trumps('6', '7', '8', '9', '10'))).toBe(true)
    })

    it('rejects a fabricated Bura with trumps the player does not hold', () => {
        const room = setup()
        expect(validatePlay(room, 0, trumps('6', '7', '8', '9', '10'))).toBe(false)
    })
})

describe('applyPlay', () => {
    it('moves the cards from hand to played, keeping the server card instances', () => {
        const room = makeRoom()
        const player = room.players[0]!
        const serverCard = c(Suite.spades, '6')
        player.hand = [serverCard, c(Suite.clubs, '7')]

        applyPlay(player, [{ ...serverCard }]) // client sends its own object
        expect(player.played).toHaveLength(1)
        expect(player.played[0]).toBe(serverCard) // same reference, not the client copy
        expect(player.hand.map((card) => card.name)).toEqual(['clubs_7'])
    })
})

describe('handlePlayedHand', () => {
    it('advances the turn and reports when all four have played', () => {
        const room = makeRoom()
        room.players.forEach((p, i) => (p.hand = [c(Suite.spades, ['6', '7', '8', '9'][i]!)]))

        for (let i = 0; i < 3; i++) {
            const { allPlayed } = handlePlayedHand([room.players[i]!.hand[0]!], room)
            expect(allPlayed).toBe(false)
            expect(room.turn).toBe(i + 1)
        }
        const { allPlayed } = handlePlayedHand([room.players[3]!.hand[0]!], room)
        expect(allPlayed).toBe(true)
    })
})

describe('resolveTrick', () => {
    it('winner takes the trick, leads next, and new cards are dealt', () => {
        const room = makeRoom()
        room.players[0]!.played = [c(Suite.spades, '6')]
        room.players[1]!.played = [c(Suite.spades, '7')]
        room.players[2]!.played = [c(Suite.spades, 'A')]
        room.players[3]!.played = [c(Suite.hearts, '6')] // trump wins
        room.deck = ['6', '7', '8', '9', '10', 'J', 'Q', 'K'].map((v) => c(Suite.clubs, v))

        const { winnerIndex } = resolveTrick(room)

        expect(winnerIndex).toBe(3)
        expect(room.lastWinner).toBe(3)
        expect(room.turn).toBe(3)
        expect(room.players[3]!.taken).toHaveLength(4)
        room.players.forEach((p) => {
            expect(p.played).toHaveLength(0)
            expect(p.hand).toHaveLength(2) // 8 deck cards dealt round-robin
        })
        expect(room.deck).toHaveLength(0)
    })
})

describe('handleRoundOver', () => {
    it('awards the multiplier to the team with more card points', () => {
        const room = makeRoom()
        room.multiplier = 2
        room.players[0]!.taken = [[c(Suite.hearts, 'A'), c(Suite.hearts, '10')]] // 21
        room.players[1]!.taken = [[c(Suite.spades, 'K')]] // 4

        const result = handleRoundOver(room)
        expect(result.gameOver).toBe(false)
        expect(result.message).toContain('won the round')
        expect(room.players[0]!.points).toBe(2)
        expect(room.players[2]!.points).toBe(2)
        expect(room.players[1]!.points).toBe(0)
    })

    it('a tie awards nothing', () => {
        const room = makeRoom()
        const result = handleRoundOver(room) // nobody took anything: 0 - 0
        expect(result.message).toContain('draw')
        room.players.forEach((p) => expect(p.points).toBe(0))
    })

    it('ends the game when a team reaches the winning score', () => {
        const room = makeRoom()
        room.players[0]!.points = 10
        room.players[2]!.points = 10
        room.players[0]!.taken = [[c(Suite.hearts, 'A')]]

        const result = handleRoundOver(room)
        expect(result.gameOver).toBe(true)
        expect(result.winnerText).toBe('P0 & P2 won the game!')
    })
})

describe('Bura', () => {
    it('isBura requires exactly five cards of the trump suite', () => {
        const room = makeRoom()
        expect(isBura(room, trumps('6', '7', '8', '9', '10'))).toBe(true)
        expect(isBura(room, trumps('6', '7', '8', '9'))).toBe(false)
        expect(isBura(room, [...trumps('6', '7', '8', '9'), c(Suite.spades, 'A')])).toBe(false)
    })

    it("handleBura awards the round to the caller's team at the current stake", () => {
        const room = makeRoom()
        room.multiplier = 3
        const result = handleBura(room, 1)
        expect(result.message).toContain('Bura')
        expect(room.players[1]!.points).toBe(3)
        expect(room.players[3]!.points).toBe(3)
        expect(room.players[0]!.points).toBe(0)
    })
})

describe('davi', () => {
    it('the player on turn can offer before playing', () => {
        const room = makeRoom()
        expect(offerDavi(room, 0)).toBe(true)
        expect(room.davi).toEqual({ pending: true, from: 0, to: 1, level: 2 })
    })

    it('cannot offer out of turn, after playing, while pending, or past the cap', () => {
        expect(offerDavi(makeRoom(), 1)).toBe(false)

        const played = makeRoom()
        played.players[0]!.played = [c(Suite.spades, '6')]
        expect(offerDavi(played, 0)).toBe(false)

        const pending = makeRoom()
        pending.davi.pending = true
        expect(offerDavi(pending, 0)).toBe(false)

        const capped = makeRoom()
        capped.multiplier = 11
        expect(offerDavi(capped, 0)).toBe(false)
    })

    const withOffer = () => {
        const room = makeRoom()
        offerDavi(room, 0)
        return room
    }

    it('only the challenged player may respond', () => {
        expect(respondDavi(withOffer(), 2, 'accept')).toBeNull()
    })

    it('accept locks in the offered level as the multiplier', () => {
        const room = withOffer()
        const result = respondDavi(room, 1, 'accept')
        expect(result).toEqual({ type: 'pending' })
        expect(room.multiplier).toBe(2)
        expect(room.davi.pending).toBe(false)
    })

    it('challenge raises the level and bounces the offer back', () => {
        const room = withOffer()
        const result = respondDavi(room, 1, 'challenge')
        expect(result).toEqual({ type: 'pending' })
        expect(room.davi).toEqual({ pending: true, from: 1, to: 0, level: 3 })
    })

    it('challenge is rejected at the cap', () => {
        const room = withOffer()
        room.davi.level = 11
        expect(respondDavi(room, 1, 'challenge')).toBeNull()
    })

    it("decline forfeits the round to the offerer's team at the accepted stake", () => {
        const room = withOffer()
        const result = respondDavi(room, 1, 'decline')
        expect(result?.type).toBe('round-over')
        if (result?.type !== 'round-over') return
        expect(result.gameOver).toBe(false)
        expect(result.message).toContain('declined')
        expect(room.players[0]!.points).toBe(1) // multiplier was still 1
        expect(room.players[2]!.points).toBe(1)
        expect(room.davi.pending).toBe(false)
    })

    it('a decline can end the game', () => {
        const room = withOffer()
        room.players[0]!.points = 10
        room.players[2]!.points = 10
        const result = respondDavi(room, 1, 'decline')
        expect(result?.type).toBe('round-over')
        if (result?.type !== 'round-over') return
        expect(result.gameOver).toBe(true)
        expect(result.winnerText).toBe('P0 & P2 won the game!')
    })
})

describe('startRound / resetRoomToLobby', () => {
    it('startRound re-deals and resets the stake but keeps the score', () => {
        const room = makeRoom()
        room.lastWinner = 2
        room.multiplier = 4
        room.players[0]!.points = 5
        room.players[0]!.taken = [[c(Suite.spades, 'A')]]

        startRound(room)

        expect(room.turn).toBe(2) // last round's winner leads
        expect(room.multiplier).toBe(1)
        expect(room.deck).toHaveLength(16)
        expect(room.players[0]!.points).toBe(5)
        room.players.forEach((p) => {
            expect(p.hand).toHaveLength(5)
            expect(p.taken).toHaveLength(0)
        })
    })

    it('resetRoomToLobby returns the room to a joinable lobby state', () => {
        const room = makeRoom()
        room.players[0]!.points = 11
        room.players[0]!.hand = [c(Suite.spades, 'A')]

        resetRoomToLobby(room)

        expect(room.started).toBe(false)
        expect(room.deck).toHaveLength(0)
        expect(room.trump).toBeUndefined()
        room.players.forEach((p) => {
            expect(p.points).toBe(0)
            expect(p.hand).toHaveLength(0)
        })
    })
})
