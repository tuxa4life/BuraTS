import { describe, it, expect } from 'vitest'
import { generateKeys, shuffleDeck, sortHand, determineWinner, getCardPoints } from '../src/cards.js'
import { Suite, type Card } from '../types.js'
import { c, makePlayer } from './helpers.js'

const playersWithPlays = (plays: Card[][]) =>
    plays.map((played, i) => {
        const p = makePlayer(i)
        p.played = played
        return p
    })

describe('generateKeys', () => {
    it('produces a full 36-card deck with no duplicates', () => {
        const deck = generateKeys()
        expect(deck).toHaveLength(36)
        expect(new Set(deck.map((card) => card.name)).size).toBe(36)
    })

    it('has 9 cards per suite', () => {
        const deck = generateKeys()
        for (const suite of Object.values(Suite)) {
            expect(deck.filter((card) => card.suite === suite)).toHaveLength(9)
        }
    })
})

describe('shuffleDeck', () => {
    it('returns a permutation of the input', () => {
        const deck = generateKeys()
        const shuffled = shuffleDeck(deck)
        expect(shuffled).toHaveLength(deck.length)
        expect(new Set(shuffled.map((card) => card.name))).toEqual(new Set(deck.map((card) => card.name)))
    })

    it('does not mutate the input deck', () => {
        const deck = generateKeys()
        const before = deck.map((card) => card.name)
        shuffleDeck(deck)
        expect(deck.map((card) => card.name)).toEqual(before)
    })
})

describe('getCardPoints', () => {
    it('scores Bura card values', () => {
        expect(getCardPoints('A')).toBe(11)
        expect(getCardPoints('10')).toBe(10)
        expect(getCardPoints('K')).toBe(4)
        expect(getCardPoints('Q')).toBe(3)
        expect(getCardPoints('J')).toBe(2)
        expect(getCardPoints('9')).toBe(0)
        expect(getCardPoints('6')).toBe(0)
    })
})

describe('sortHand', () => {
    const trump = c(Suite.hearts, '8')

    it('puts trump cards first, each suite in descending power (A, 10, K, Q, J, 9...)', () => {
        const hand = [c(Suite.spades, 'A'), c(Suite.hearts, '6'), c(Suite.spades, '10'), c(Suite.hearts, 'K')]
        const sorted = sortHand(hand, trump)
        expect(sorted.map((card) => card.name)).toEqual(['hearts_K', 'hearts_6', 'spades_A', 'spades_10'])
    })

    it('orders 10 above K within a suite', () => {
        const sorted = sortHand([c(Suite.clubs, 'K'), c(Suite.clubs, '10')], trump)
        expect(sorted.map((card) => card.value)).toEqual(['10', 'K'])
    })

    it('does not mutate the input array', () => {
        const hand = [c(Suite.spades, '6'), c(Suite.hearts, 'A')]
        const before = hand.map((card) => card.name)
        sortHand(hand, trump)
        expect(hand.map((card) => card.name)).toEqual(before)
    })
})

describe('determineWinner', () => {
    const trump = c(Suite.hearts, '6')

    it('highest card of the led suite wins', () => {
        const players = playersWithPlays([[c(Suite.spades, '7')], [c(Suite.spades, 'K')], [c(Suite.spades, 'A')], [c(Suite.spades, '9')]])
        expect(determineWinner(players, trump, 0)).toBe(2)
    })

    it('a trump beats a higher non-trump', () => {
        const players = playersWithPlays([[c(Suite.spades, 'A')], [c(Suite.hearts, '6')], [c(Suite.spades, 'K')], [c(Suite.spades, 'Q')]])
        expect(determineWinner(players, trump, 0)).toBe(1)
    })

    it('an off-suite non-trump cannot beat the leader', () => {
        const players = playersWithPlays([[c(Suite.clubs, '6')], [c(Suite.spades, 'A')], [c(Suite.diamonds, 'A')], [c(Suite.spades, 'K')]])
        expect(determineWinner(players, trump, 0)).toBe(0)
    })

    it('respects a leader who is not seat 0', () => {
        // Seat 2 led clubs; everyone else threw off-suite non-trumps.
        const players = playersWithPlays([[c(Suite.spades, 'A')], [c(Suite.diamonds, 'A')], [c(Suite.clubs, 'Q')], [c(Suite.spades, 'K')]])
        expect(determineWinner(players, trump, 2)).toBe(2)
    })

    it('higher trump beats lower trump', () => {
        const players = playersWithPlays([[c(Suite.hearts, '7')], [c(Suite.hearts, 'A')], [c(Suite.hearts, '9')], [c(Suite.hearts, 'J')]])
        expect(determineWinner(players, trump, 0)).toBe(1)
    })

    it('multi-card: the whole hand must beat the whole winning hand', () => {
        const players = playersWithPlays([
            [c(Suite.spades, 'A'), c(Suite.spades, '6')],
            [c(Suite.spades, '10'), c(Suite.spades, '7')], // 10 does not beat A -> not better
            [c(Suite.hearts, '7'), c(Suite.hearts, '6')],  // two trumps beat both -> takes it
            [c(Suite.clubs, 'A'), c(Suite.clubs, 'K')],    // off-suite -> never better
        ])
        expect(determineWinner(players, trump, 0)).toBe(2)
    })

    it('does not reorder the played cards it inspects', () => {
        const played = [c(Suite.spades, '6'), c(Suite.spades, 'A')] // deliberately unsorted
        const players = playersWithPlays([played, [c(Suite.clubs, '7'), c(Suite.clubs, '8')], [c(Suite.clubs, '9'), c(Suite.clubs, '10')], [c(Suite.clubs, 'J'), c(Suite.clubs, 'Q')]])
        determineWinner(players, trump, 0)
        expect(players[0]!.played.map((card) => card.name)).toEqual(['spades_6', 'spades_A'])
    })
})
