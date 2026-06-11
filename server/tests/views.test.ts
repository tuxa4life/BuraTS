import { describe, it, expect } from 'vitest'
import { viewFor } from '../src/rooms.js'
import { Suite } from '../types.js'
import { c, makeRoom } from './helpers.js'

describe('viewFor', () => {
    const setup = () => {
        const room = makeRoom()
        room.players.forEach((p, i) => {
            p.hand = [c(Suite.spades, `${6 + i}`), c(Suite.clubs, `${6 + i}`)]
            p.played = [c(Suite.diamonds, `${6 + i}`)]
            p.taken = [[c(Suite.hearts, 'A')]]
        })
        room.deck = [c(Suite.hearts, '6'), c(Suite.hearts, '7'), c(Suite.hearts, '8')]
        return room
    }

    it('shows the viewer their own full hand', () => {
        const view = viewFor(setup(), 'p1')
        expect(view.players[1]!.hand.map((card) => card.name)).toEqual(['spades_7', 'clubs_7'])
        expect(view.players[1]!.handCount).toBe(2)
    })

    it("hides everyone else's cards, exposing only counts", () => {
        const view = viewFor(setup(), 'p1')
        for (const i of [0, 2, 3]) {
            expect(view.players[i]!.hand).toEqual([])
            expect(view.players[i]!.handCount).toBe(2)
        }
    })

    it('never exposes the deck order or taken piles', () => {
        const view = viewFor(setup(), 'p1')
        expect(view.deckCount).toBe(3)
        expect(view).not.toHaveProperty('deck')
        view.players.forEach((p) => expect(p).not.toHaveProperty('taken'))
    })

    it('keeps played cards visible to everyone', () => {
        const view = viewFor(setup(), 'p1')
        expect(view.players[3]!.played.map((card) => card.name)).toEqual(['diamonds_9'])
    })

    it('a viewer without a seat (or undefined id) sees no hand at all', () => {
        const view = viewFor(setup(), undefined)
        view.players.forEach((p) => expect(p.hand).toEqual([]))
    })
})
