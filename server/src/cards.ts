import { type Card, type Player, Suite } from '../types.js'

const generateKeys = (): Card[] => {
    const suites = [Suite.spades, Suite.hearts, Suite.clubs, Suite.diamonds]
    const values = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

    const keys: Card[] = []

    suites.forEach((suite) =>
        values.forEach((value) => {
            const card: Card = {
                suite,
                value,
                name: `${suite}_${value}`,
            }

            keys.push(card)
        })
    )

    return keys
}

const shuffleDeck = (cards: Card[]): Card[] => {
    const shuffled = [...cards]

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }

    return shuffled
}

const cardPowers: { [k: string]: number } = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, J: 10, Q: 11, K: 12, '10': 13, A: 14 }
const sortHand = (cards: Card[], trump: Card): Card[] => {
    const suitePriority = {
        clubs: ['clubs', 'hearts', 'spades', 'diamonds'],
        spades: ['spades', 'hearts', 'clubs', 'diamonds'],
        hearts: ['hearts', 'spades', 'diamonds', 'clubs'],
        diamonds: ['diamonds', 'spades', 'hearts', 'clubs'],
    }

    const order = suitePriority[trump.suite]
    return cards.sort((a, b) => {
        const suiteDiff = order.indexOf(a.suite) - order.indexOf(b.suite)
        if (suiteDiff !== 0) return suiteDiff

        return cardPowers[b.value]! - cardPowers[a.value]!
    })
}

const A_Beats_B = (a: Card, b: Card, trump: Card): boolean => { // B is leading suite here
    const aVal = cardPowers[a.value]!
    const bVal = cardPowers[b.value]!

    const sameSuites = a.suite === b.suite
    if (sameSuites) {
        if (aVal > bVal) return true
        else return false
    }

    const aTrump = a.suite === trump.suite
    const bTrump = b.suite === trump.suite
    if (aTrump) return true
    if (bTrump) return false

    return false
}

const determineWinner = (players: Player[], trump: Card, leadingIndex: number) => {
    const hands = players.map(player => sortHand(player.played, trump))
    let winnerIndex = leadingIndex
    hands.forEach((hand, handIndex) => {
        const winnerHand = hands[winnerIndex]
        let isBetter = true
        hand.forEach((card, i) => {
            isBetter = isBetter && A_Beats_B(card, winnerHand![i]!, trump)
        })

        if (isBetter) winnerIndex = handIndex
    })

    return winnerIndex
}


const gatherPlayedCards = (players: Player[]): Card[][] => {
    const output: Card[][] = []
    players.forEach((player) => output.push(player.played))

    return output
}

export { generateKeys, shuffleDeck, gatherPlayedCards, determineWinner }
